"""POST /analyze: load a linked pair's inputs, run the steps in app/core, build the response and save it.

A career takes part only when it has trait weights, an undergraduate route with a known fee that the student's
stream may enter (step 0), and market data (for the student's state or the national figure) with a starting
salary. The others are left out rather than scored on made-up numbers.
"""

from collections import defaultdict
from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy.engine import Connection

from app.core import conflict, finance, fit, market, ranking, scholarships, streams, swot, traits
from app.core.inputs import MarketRow, Parent, QuestionInfo, Route, Scholarship, Student
from app.errors import AppError
from app.repositories import assessment, catalog, profiles, results
from app.schemas.analyze import (
    AnalyzeResponse,
    College,
    Conflict,
    DomainScore,
    EducationPath,
    FinanceCheck,
    FinanceParts,
    FitParts,
    Gap,
    MarketParts,
    MatchedScholarship,
    RejectedCareer,
    RoadmapItem,
    Scores,
    Swot,
    SwotItem,
    Trait,
)
from app.schemas.common import DIMENSION_GROUP, Dimension, ErrorCode, Role, Weights
from app.schemas.market import RegionMarket
from app.services.progress import progress_for

NATIONAL = "India"
COLLEGES_PER_TIER = 4  # the roadmap shows up to 4 colleges of each tier (and 4 non-college routes such as ICAI)


def r4(value: float) -> float:
    return round(value, 4)


def lakh(rupees: int) -> str:
    return f"₹{rupees / 100_000:.1f} lakh"


# ---------- loading ----------


@dataclass(frozen=True)
class Career:
    id: UUID
    name: str
    domain_id: UUID
    domain: str
    education_path: str
    trait_weights: dict | None
    routes: list[Route]
    market: dict[str, MarketRow]
    scholarships: list[Scholarship]


def load_careers(conn: Connection) -> list[Career]:
    routes: dict[UUID, list[Route]] = defaultdict(list)
    for row in catalog.list_routes(conn):
        routes[row.career_id].append(
            Route(
                row.exam, row.college, row.level, float(row.duration_years), row.annual_fee, row.annual_living_cost,
                row.state, tuple(row.eligible_streams), tuple(row.primary_streams), row.tier, row.city, row.rank,
                row.course,
            )
        )
    markets: dict[UUID, dict[str, MarketRow]] = defaultdict(dict)
    for row in catalog.list_market_data(conn):
        markets[row.career_id][row.region] = MarketRow(
            row.region,
            float(row.demand_index) if row.demand_index is not None else 0.0,
            float(row.growth_rate) if row.growth_rate is not None else None,
            row.median_salary,
            row.entry_salary,
            row.as_of,
            row.source,
            row.estimated,
        )
    awards: dict[UUID, list[Scholarship]] = defaultdict(list)
    for row in catalog.list_scholarships(conn):
        award = Scholarship(
            row.name,
            row.amount,
            row.amount_period,
            row.deadline,
            row.income_limit,
            tuple(row.categories),
            tuple(row.states),
            float(row.min_percentage) if row.min_percentage is not None else None,
            row.gender,
            row.course_level,
        )
        for career_id in row.career_ids:
            awards[career_id].append(award)
    return [
        Career(
            row.id, row.name, row.domain_id, row.domain, row.education_path, row.trait_weights,
            routes[row.id], markets[row.id], awards[row.id],
        )
        for row in catalog.list_careers(conn)
    ]


def load_student(conn: Connection, student_id: UUID) -> Student:
    p = profiles.get_profile(conn, student_id)
    return Student(
        p.risk_appetite, p.preferred_state, p.open_to_abroad, p.home_state, p.category,
        float(p.percentage) if p.percentage is not None else None, p.gender, p.stream or streams.UNDECIDED,
    )


def load_parent(conn: Connection, parent_id: UUID) -> Parent:
    p = profiles.get_profile(conn, parent_id)
    return Parent(
        p.annual_education_budget, p.savings, p.max_loan, p.annual_income, p.risk_appetite,
        p.breakeven_tolerance_years, p.preferred_state, p.open_to_abroad,
        tuple(profiles.get_top_domain_ids(conn, parent_id)),
    )


def require_ready(conn: Connection, student_id: UUID, parent_id: UUID) -> None:
    """Both assessments finished, then both consents given; 409 with what's missing otherwise."""
    student = progress_for(conn, student_id, Role.STUDENT)
    parent = progress_for(conn, parent_id, Role.PARENT)
    missing = [role for role, p in (("student", student), ("parent", parent)) if not p.assessment_complete]
    if missing:
        raise AppError(ErrorCode.ASSESSMENT_INCOMPLETE, "Both assessments must be finished first.", {"missing": missing})
    missing = [role for role, p in (("student", student), ("parent", parent)) if not p.consented]
    if missing:
        raise AppError(ErrorCode.CONSENT_REQUIRED, "Both of you need to agree to the comparison first.", {"missing": missing})


# ---------- one career ----------


@dataclass(frozen=True)
class Evaluated:
    career: Career
    fit_result: fit.Fit
    market_row: MarketRow
    national_fallback: bool
    check: finance.FinanceCheck
    options: list[tuple[int, Route]]  # (total cost, route) the student can take, cheapest first
    matched: list[tuple[Scholarship, str]]
    match: str  # streams.NATURAL or streams.OPEN (closed careers aren't evaluated)
    typical: tuple[int, Route]  # the route the finance check is based on


def monthly_living(living: dict, state: str | None) -> int | None:
    row = living.get(state) or living.get(NATIONAL)
    return row.monthly_living_cost if row else None


def route_match(route: Route, stream: str) -> str:
    return streams.course_match(stream, route.eligible_streams, route.primary_streams)


def evaluate(career: Career, t: dict, student: Student, parent: Parent, living: dict) -> Evaluated | None:
    if not career.trait_weights:
        return None
    row, national_fallback = market.pick_row(career.market, student.preferred_state)
    eligible = [
        route for route in career.routes
        if route.level == "UG" and route.annual_fee is not None and route_match(route, student.stream) != streams.CLOSED
    ]
    match = streams.best_match(route_match(route, student.stream) for route in eligible)
    # Cost and list only the routes of the career's best match: a PCM student's Data Scientist path is B.Tech,
    # not the B.Sc routes that suit a Commerce-with-Maths student.
    routes = [route for route in eligible if route_match(route, student.stream) == match]
    after_graduation = monthly_living(living, student.preferred_state)
    if row is None or row.entry_salary is None or not routes or after_graduation is None:
        return None

    matched = [
        (award, rule)
        for award in career.scholarships
        if (rule := scholarships.matched_rule(award, student, parent, "UG")) is not None
    ]
    options = []
    for route in routes:
        studying = route.annual_living_cost
        if studying is None:
            studying = 12 * (monthly_living(living, route.state) or 0)
        best_award = max((scholarships.total_value(a, route.duration_years) for a, _ in matched), default=0)
        options.append((finance.total_cost(route.annual_fee, studying, route.duration_years, best_award), route))
    options.sort(key=lambda option: (option[0], option[1].college))
    cost, route = typical = finance.typical_option(options, lambda r: r.state == student.preferred_state)
    check = finance.check_path(
        cost,
        finance.capacity(parent.annual_budget, parent.savings, route.duration_years),
        parent.max_loan,
        row.entry_salary,
        after_graduation,
        parent.breakeven_tolerance_years,
        route.duration_years,
    )
    return Evaluated(
        career, fit.career_fit(career.trait_weights, t), row, national_fallback, check, options, matched, match, typical
    )


# ---------- the whole pipeline ----------


def run(conn: Connection, student_id: UUID, parent_id: UUID, weights: Weights, result_id: UUID | None = None) -> AnalyzeResponse:
    questions = [
        QuestionInfo(q.id, Dimension(q.dimension), q.kind, q.reverse_scored, q.correct_value)
        for q in assessment.list_questions(conn, Role.STUDENT.value)
    ]
    t = traits.trait_scores(questions, assessment.get_answers(conn, student_id))
    student, parent = load_student(conn, student_id), load_parent(conn, parent_id)
    living = catalog.living_costs(conn)
    careers = load_careers(conn)
    domain_names = {row.id: row.name for row in catalog.list_domains(conn)}

    evaluated = [e for c in careers if (e := evaluate(c, t, student, parent, living)) is not None]
    if not evaluated:
        raise AppError(ErrorCode.UPSTREAM_UNAVAILABLE, "There isn't enough career data to rank careers yet.")
    by_id = {e.career.id: e for e in evaluated}
    market_scores = market.market_scores({e.career.id: e.market_row for e in evaluated})
    candidates = [
        ranking.Candidate(
            e.career.id, e.fit_result.total, e.check.score, market_scores[e.career.id].total, e.check.viable,
            natural=e.match == streams.NATURAL,
        )
        for e in evaluated
    ]
    ranked, left_out = ranking.rank(candidates, weights)

    def cheaper_alternative(e: Evaluated) -> str | None:
        if e.check.viable:
            return None
        # Stay within the student's stream: a PCM student's alternative to Robotics isn't CA.
        options = sorted(
            (
                o for o in evaluated
                if o.check.viable and o.career.domain_id == e.career.domain_id
                and (o.match == streams.NATURAL or e.match == streams.OPEN)
            ),
            key=lambda o: (o.check.total_cost, o.career.name),
        )
        return options[0].career.name if options else None

    roadmap = [
        _roadmap_item(rank, by_id[c.career_id], market_scores[c.career_id], weights, cheaper_alternative(by_id[c.career_id]))
        for rank, c in enumerate(ranked, start=1)
    ]
    rejected = [
        RejectedCareer(
            career_id=c.career_id,
            career=by_id[c.career_id].career.name,
            reasons=list(by_id[c.career_id].check.reasons),
            cheaper_alternative=cheaper_alternative(by_id[c.career_id]),
        )
        for c in left_out
    ]

    domains = fit.domain_fits(
        [(c.domain_id, c.domain, fit.career_fit(c.trait_weights, t)) for c in careers if c.trait_weights]
    )
    gaps = _gaps(student, parent, domains, domain_names, roadmap)
    index = conflict.conflict_index([g.gap for g in gaps])
    # Opportunities and threats come from the student's own-stream careers when there are any.
    in_stream = [e for e in evaluated if e.match == streams.NATURAL] or evaluated
    summary = swot.build_swot(
        t,
        [
            swot.CareerSummary(
                e.career.name, e.fit_result.total, market_scores[e.career.id].total, e.market_row.demand_index / 100,
                e.market_row.region, e.check.viable, e.check.reasons, e.check.loan_needed, e.check.breakeven_years,
            )
            for e in in_stream
        ],
        index,
    )

    response = AnalyzeResponse(
        result_id=result_id or uuid4(),
        created_at=datetime.now(UTC),
        weights=weights,
        conflict=Conflict(index=index, label=conflict.conflict_label(index), top_gaps=gaps[:3], gaps=gaps),
        swot=Swot(**{quadrant: [SwotItem(text=i.text, value=i.value) for i in items] for quadrant, items in vars(summary).items()}),
        traits=[Trait(dimension=d, group=DIMENSION_GROUP[d], value=None if t[d] is None else r4(t[d])) for d in Dimension],
        domain_scores=[
            DomainScore(
                domain_id=d.domain_id, domain=d.domain, fit=r4(d.total), aptitude=r4(d.fit.aptitude),
                interest=r4(d.fit.interest), cognitive=r4(d.fit.cognitive),
            )
            for d in domains
        ],
        roadmap=roadmap,
        rejected=rejected,
    )
    results.save_result(
        conn, response.result_id, student_id, parent_id, weights.model_dump(), index, response.model_dump(mode="json")
    )
    return response


def _roadmap_item(
    rank: int, e: Evaluated, m: market.MarketScore, weights: Weights, alternative: str | None
) -> RoadmapItem:
    check, row = e.check, e.market_row
    fit_ = r4(e.fit_result.total)
    finance_ = r4(check.score)
    market_ = r4(m.total)
    final = r4(ranking.final_score(weights, fit_, finance_, market_))
    exams = list(dict.fromkeys(route.exam for _, route in e.options))
    shown = _colleges_to_show(e.options)
    return RoadmapItem(
        rank=rank,
        career_id=e.career.id,
        career=e.career.name,
        domain=e.career.domain,
        scores=Scores(
            fit=fit_,
            finance=finance_,
            market=market_,
            final=final,
            final_100=round(final * 100),
            fit_parts=FitParts(aptitude=r4(e.fit_result.aptitude), interest=r4(e.fit_result.interest), cognitive=r4(e.fit_result.cognitive)),
            finance_parts=FinanceParts(
                capacity_ratio=r4(check.capacity_ratio), loan=r4(check.loan_score), payback=r4(check.payback_score)
            ),
            market_parts=MarketParts(demand=r4(m.demand), growth=r4(m.growth), salary_percentile=r4(m.salary_percentile)),
        ),
        finance=FinanceCheck(
            viable=check.viable,
            total_cost=check.total_cost,
            capacity=check.capacity,
            loan_needed=check.loan_needed,
            starting_salary=check.starting_salary,
            breakeven_years=round(check.breakeven_years, 2),
            duration_years=check.duration_years,
            reasons=list(check.reasons),
        ),
        market=RegionMarket(
            region=row.region,
            demand_index=r4(row.demand_index / 100),
            growth_rate=row.growth_rate,
            median_salary=row.median_salary,
            entry_salary=row.entry_salary,
            as_of=row.as_of,
            source=row.source,
            data_quality="estimated" if e.national_fallback or row.estimated else "sourced",
        ),
        path=EducationPath(
            education=e.career.education_path,
            exams=exams,
            colleges=[
                College(
                    name=route.college, annual_fee=route.annual_fee, course=route.course, tier=route.tier,
                    city=route.city, state=route.state,
                )
                for route in shown
            ],
            typical_college=e.typical[1].college,
        ),
        scholarships=[
            MatchedScholarship(name=a.name, amount=a.amount, deadline=a.deadline, matched_rule=rule)
            for a, rule in sorted(e.matched, key=lambda m: (-scholarships.total_value(m[0], check.duration_years), m[0].name))
        ],
        cheaper_alternative=alternative,
        stream_match=e.match,
    )


def _colleges_to_show(options: list[tuple[int, Route]]) -> list[Route]:
    """Up to 4 routes per tier (1, 2, 3, then non-college routes such as ICAI): best NIRF rank, then lowest fee.

    A college offering two of the career's courses is listed once, with the course ranked first.
    """
    best: dict[str, Route] = {}
    for _, route in sorted(options, key=lambda o: (o[1].rank or 10**6, o[1].annual_fee or 0, o[1].college)):
        best.setdefault(route.college, route)
    by_tier: dict[int | None, list[Route]] = defaultdict(list)
    for route in best.values():
        if len(by_tier[route.tier]) < COLLEGES_PER_TIER:
            by_tier[route.tier].append(route)
    return [route for tier in (1, 2, 3, None) for route in by_tier[tier]]


def _gaps(
    student: Student, parent: Parent, domains: list[fit.DomainFit], names: dict[UUID, str], roadmap: list[RoadmapItem]
) -> list[Gap]:
    student_top = [d.domain_id for d in domains[:3]]
    best = domains[0].domain if domains else None
    first_choice = names.get(parent.top_domain_ids[0]) if parent.top_domain_ids else None
    domain = Gap(
        dimension="domain",
        gap=r4(conflict.domain_gap(student_top, parent.top_domain_ids)),
        text=f"Parent's first choice is {first_choice}; the student's best fit is {best}."
        if first_choice != best
        else f"Parent's first choice and the student's best fit are both {best}.",
        student_value=best,
        parent_value=first_choice,
    )

    s_risk, p_risk = student.risk_appetite, parent.risk_appetite
    risk_text = (
        f"Both rate their comfort with risk {s_risk}/5."
        if s_risk == p_risk
        else f"The student is {'more' if s_risk > p_risk else 'less'} comfortable with risk ({s_risk}/5) "
        f"than the parent ({p_risk}/5)."
    )
    risk = Gap(dimension="risk", gap=r4(conflict.risk_gap(s_risk, p_risk)), text=risk_text,
               student_value=f"{s_risk}/5", parent_value=f"{p_risk}/5")

    def place(state: str, abroad: bool) -> str:
        return f"{state}, {'open to abroad' if abroad else 'India only'}"

    same_state = student.preferred_state == parent.preferred_state
    same_abroad = student.open_to_abroad == parent.open_to_abroad
    location_text = (
        f"Both prefer {student.preferred_state} and agree about studying abroad."
        if same_state and same_abroad
        else "The student prefers " + place(student.preferred_state, student.open_to_abroad)
        + "; the parent prefers " + place(parent.preferred_state, parent.open_to_abroad) + "."
    )
    location = Gap(
        dimension="location",
        gap=r4(conflict.location_gap(student.preferred_state, student.open_to_abroad, parent.preferred_state, parent.open_to_abroad)),
        text=location_text,
        student_value=place(student.preferred_state, student.open_to_abroad),
        parent_value=place(parent.preferred_state, parent.open_to_abroad),
    )

    top = roadmap[0]
    shortfall = max(0, top.finance.total_cost - top.finance.capacity)
    budget = Gap(
        dimension="budget",
        gap=r4(conflict.budget_gap(top.finance.total_cost, top.finance.capacity)),
        text=f"The top-ranked path ({top.career}) fits within what the family can pay without a loan."
        if shortfall == 0
        else f"The top-ranked path ({top.career}) costs {lakh(shortfall)} more than the family can pay without a loan.",
        student_value=f"{lakh(top.finance.total_cost)} total cost",
        parent_value=f"{lakh(top.finance.capacity)} capacity",
    )
    return sorted([domain, risk, location, budget], key=lambda g: (-g.gap, g.dimension))
