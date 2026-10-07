"""Unit tests for app/core with values worked out by hand (backend guide, section 4).

Edge cases from the guide: all answers equal, a missing dimension, zero savings, a loan limit of zero,
no viable career, the parent's ranks identical to the student's, and a region with no market data.
(Weights that don't sum to 1 are tested in test_weights.py.)
"""

from datetime import date
from uuid import UUID, uuid4

import pytest

from app.core import conflict, finance, fit, market, ranking, scholarships, swot, traits
from app.core.inputs import MarketRow, Parent, QuestionInfo, Scholarship, Student
from app.schemas.analyze import FinanceReason
from app.schemas.common import DEFAULT_WEIGHTS, Dimension

approx = pytest.approx


# ---------- step 1: traits ----------


def _q(dimension: Dimension, kind: str = "likert", **kwargs) -> QuestionInfo:
    return QuestionInfo(uuid4(), dimension, kind, **kwargs)


def test_likert_answers_average_then_scale() -> None:
    a, b = _q(Dimension.LOGICAL), _q(Dimension.LOGICAL)
    # (5 - 1) / 4 = 1.0 and (3 - 1) / 4 = 0.5, mean 0.75 (= (mean 4 - 1) / 4)
    assert traits.trait_scores([a, b], {a.id: 5, b.id: 3})[Dimension.LOGICAL] == 0.75


def test_reverse_scored_statements_are_flipped() -> None:
    q = _q(Dimension.STRUCTURED, reverse_scored=True)
    # 6 - 2 = 4, then (4 - 1) / 4 = 0.75
    assert traits.trait_scores([q], {q.id: 2})[Dimension.STRUCTURED] == 0.75


def test_choice_questions_are_graded() -> None:
    right, wrong = _q(Dimension.NUMERICAL, "choice", correct_value=2), _q(Dimension.NUMERICAL, "choice", correct_value=4)
    # 1 correct out of 2 = 0.5
    assert traits.trait_scores([right, wrong], {right.id: 2, wrong.id: 1})[Dimension.NUMERICAL] == 0.5


def test_a_dimension_with_no_answers_is_none() -> None:
    q = _q(Dimension.VERBAL)
    scores = traits.trait_scores([q, _q(Dimension.SPATIAL)], {q.id: 4})
    assert scores[Dimension.VERBAL] == 0.75 and scores[Dimension.SPATIAL] is None


def test_all_answers_equal_gives_the_middle_of_the_scale() -> None:
    questions = [_q(dimension) for dimension in Dimension]
    scores = traits.trait_scores(questions, {q.id: 3 for q in questions})
    assert set(scores.values()) == {0.5}  # (3 - 1) / 4


# ---------- step 2: fit ----------

WEIGHTS = {
    "aptitude": {"logical": 0.6, "numerical": 0.4},
    "interest": {"investigative": 1.0},
    "cognitive": {"analytical": 0.5, "structured": 0.5},
}


def test_group_score_is_the_weighted_sum() -> None:
    t = {Dimension.LOGICAL: 0.5, Dimension.NUMERICAL: 1.0}
    assert fit.group_score(WEIGHTS["aptitude"], t) == approx(0.7)  # 0.6 x 0.5 + 0.4 x 1.0


def test_a_missing_dimension_is_left_out_and_the_rest_rescaled() -> None:
    t = {Dimension.LOGICAL: 0.5, Dimension.NUMERICAL: None}
    assert fit.group_score(WEIGHTS["aptitude"], t) == approx(0.5)  # 0.6 x 0.5 / 0.6
    assert fit.group_score(WEIGHTS["interest"], {}) == 0.0


def test_career_fit_combines_the_groups() -> None:
    t = {
        Dimension.LOGICAL: 0.5, Dimension.NUMERICAL: 1.0,  # A = 0.7
        Dimension.INVESTIGATIVE: 0.5,  # I = 0.5
        Dimension.ANALYTICAL: 0.25, Dimension.STRUCTURED: 0.15,  # C = 0.5 x 0.25 + 0.5 x 0.15 = 0.2
    }
    f = fit.career_fit(WEIGHTS, t)
    assert (f.aptitude, f.interest, f.cognitive) == (approx(0.7), approx(0.5), approx(0.2))
    assert f.total == approx(0.54)  # 0.5 x 0.7 + 0.3 x 0.5 + 0.2 x 0.2 = 0.35 + 0.15 + 0.04


def test_domain_score_is_the_mean_of_its_careers() -> None:
    tech, health = uuid4(), uuid4()
    domains = fit.domain_fits([
        (tech, "Tech", fit.Fit(0.8, 0.6, 0.4)),  # S = 0.4 + 0.18 + 0.08 = 0.66
        (tech, "Tech", fit.Fit(0.4, 0.2, 0.2)),  # S = 0.2 + 0.06 + 0.04 = 0.30
        (health, "Health", fit.Fit(0.5, 0.5, 0.5)),  # S = 0.5
    ])
    assert [d.domain for d in domains] == ["Health", "Tech"]  # 0.5 > (0.66 + 0.30) / 2 = 0.48
    assert domains[1].total == approx(0.48)
    assert domains[1].fit.aptitude == approx(0.6)


# ---------- step 3: finance ----------


def test_cost_and_capacity() -> None:
    assert finance.total_cost(200_000, 60_000, 4) == 1_040_000  # (2,00,000 + 60,000) x 4
    assert finance.total_cost(200_000, 60_000, 4, scholarship=50_000) == 990_000
    assert finance.total_cost(0, 10_000, 1, scholarship=50_000) == 0  # never negative
    assert finance.capacity(250_000, 600_000, 4) == 1_600_000  # 2,50,000 x 4 + 6,00,000
    assert finance.capacity(300_000, 0, 3) == 900_000  # zero savings


def test_an_affordable_path() -> None:
    check = finance.check_path(1_040_000, 1_600_000, 800_000, 600_000, 15_000, 5, 4)
    # net salary = 6,00,000 - 12 x 15,000 = 4,20,000; breakeven = 10,40,000 / 4,20,000 = 2.476 years
    assert check.loan_needed == 0 and check.viable and check.reasons == ()
    assert check.breakeven_years == approx(2.47619, abs=1e-5)
    assert (check.capacity_ratio, check.loan_score) == (1.0, 1.0)  # min(1, 16 / 10.4) = 1
    assert check.payback_score == approx(0.752381, abs=1e-6)  # 1 - 2.476 / (2 x 5)
    assert check.score == approx(0.950476, abs=1e-6)  # 0.5 + 0.3 + 0.2 x 0.752381


def test_a_loan_above_the_limit() -> None:
    check = finance.check_path(2_000_000, 1_600_000, 100_000, 600_000, 15_000, 5, 4)
    # loan = 20,00,000 - 16,00,000 = 4,00,000 > 1,00,000; breakeven = 20,00,000 / 4,20,000 = 4.76 (fine)
    assert check.loan_needed == 400_000 and not check.viable
    assert check.reasons == (FinanceReason.COST_EXCEEDS_CAPACITY, FinanceReason.LOAN_EXCEEDS_LIMIT)
    assert check.capacity_ratio == 0.8  # 16 / 20
    assert check.loan_score == approx(0.85)  # 1 - (4,00,000 - 1,00,000) / 20,00,000
    assert check.score == approx(0.5 * 0.8 + 0.3 * 0.85 + 0.2 * (1 - 4.761905 / 10), abs=1e-6)


def test_a_loan_limit_of_zero() -> None:
    check = finance.check_path(1_000_000, 900_000, 0, 600_000, 15_000, 5, 3)
    assert check.loan_needed == 100_000 and FinanceReason.LOAN_EXCEEDS_LIMIT in check.reasons
    assert check.loan_score == approx(0.9)  # 1 - 1,00,000 / 10,00,000


def test_a_salary_below_living_costs_never_pays_back() -> None:
    check = finance.check_path(500_000, 600_000, 0, 100_000, 15_000, 5, 3)
    # net salary = max(1,00,000 - 1,80,000, 1) = 1 rupee, so breakeven is 5,00,000 years
    assert check.reasons == (FinanceReason.BREAKEVEN_TOO_LONG,)  # no loan, so no COST_EXCEEDS_CAPACITY
    assert check.payback_score == 0.0


# ---------- step 4: market ----------


def _row(region: str, demand: float, growth: float | None, median: int | None) -> MarketRow:
    return MarketRow(region, demand, growth, median, median, date(2026, 1, 1), "test", False)


def test_min_max() -> None:
    assert market.min_max({"a": 10, "b": 20, "c": 30}) == {"a": 0.0, "b": 0.5, "c": 1.0}
    assert market.min_max({"a": 7, "b": 7}) == {"a": 0.5, "b": 0.5}
    assert market.min_max({"a": None, "b": 3}) == {"a": 0.0, "b": 0.5}


def test_market_score_blends_the_scaled_signals() -> None:
    scores = market.market_scores({"a": _row("India", 80, 10, 900_000), "b": _row("India", 40, None, 600_000)})
    # a: demand 1, growth 0.5 (only known value), salary 1 -> 0.5 + 0.15 + 0.2 = 0.85; b: all 0
    assert scores["a"].total == approx(0.85) and scores["b"].total == 0.0


def test_a_region_with_no_data_falls_back_to_national() -> None:
    national = _row("India", 50, 5, 500_000)
    assert market.pick_row({"Karnataka": _row("Karnataka", 1, 1, 1), "India": national}, "Karnataka")[1] is False
    assert market.pick_row({"India": national}, "Kerala") == (national, True)
    assert market.pick_row({}, "Kerala") == (None, True)


# ---------- step 5: ranking ----------


def _cand(name: str, fit_: float, fin: float, mkt: float, viable: bool = True) -> ranking.Candidate:
    return ranking.Candidate(UUID(int=sum(map(ord, name))), fit_, fin, mkt, viable)


def test_final_score_uses_the_weights() -> None:
    assert ranking.final_score(DEFAULT_WEIGHTS, 0.8, 0.6, 0.5) == approx(0.665)  # 0.36 + 0.18 + 0.125


def test_viable_paths_first_then_non_viable_fill_the_gaps() -> None:
    a = _cand("a", 0.8, 0.6, 0.5)  # 0.665
    b = _cand("b", 0.6, 0.9, 0.9)  # 0.27 + 0.27 + 0.225 = 0.765
    c = _cand("c", 0.9, 0.2, 0.8, viable=False)  # 0.405 + 0.06 + 0.2 = 0.665
    roadmap, rejected = ranking.rank([a, b, c], DEFAULT_WEIGHTS)
    assert roadmap == [b, a, c] and rejected == []


def test_more_than_five_viable_pushes_non_viable_out() -> None:
    viable = [_cand(f"v{i}", 0.5 + i / 100, 0.5, 0.5) for i in range(6)]
    bad = _cand("x", 1, 1, 1, viable=False)
    roadmap, rejected = ranking.rank([*viable, bad], DEFAULT_WEIGHTS)
    assert len(roadmap) == 5 and all(c.viable for c in roadmap) and rejected == [bad]


def test_no_viable_career_still_returns_a_roadmap() -> None:
    options = [_cand(n, 0.5, 0.1, 0.5, viable=False) for n in "abc"]
    roadmap, rejected = ranking.rank(options, DEFAULT_WEIGHTS)
    assert len(roadmap) == 3 and not any(c.viable for c in roadmap) and rejected == []


def test_ties_break_on_fit_then_market_then_id() -> None:
    # all three score 0.45 x fit + 0.30 x finance + 0.25 x market = 0.5
    more_fit = _cand("p", 0.6, 0.5 - 0.15, 0.5)
    more_market = _cand("q", 0.5, 0.5 - 0.25 * 0.4 / 0.3, 0.9)
    plain = _cand("r", 0.5, 0.5, 0.5)
    roadmap, _ = ranking.rank([plain, more_market, more_fit], DEFAULT_WEIGHTS)
    assert roadmap == [more_fit, more_market, plain]


# ---------- step 6: conflict ----------


def test_domain_gap() -> None:
    assert conflict.domain_gap("ABC", "ABC") == 0.0  # the parent's ranks are identical to the student's
    assert conflict.domain_gap("ABC", "XYZ") == 1.0
    # same three, reversed: min(1, 0.33) + min(0.66, 0.66) + min(0.33, 1) = 1.32; 1 - 1.32 / 1.99
    assert conflict.domain_gap("ABC", "CBA") == approx(0.336683, abs=1e-6)
    # two shared in the same places: 1 + 0.66 = 1.66; 1 - 1.66 / 1.99
    assert conflict.domain_gap("ABC", "ABD") == approx(0.165829, abs=1e-6)


def test_risk_location_and_budget_gaps() -> None:
    assert conflict.risk_gap(4, 2) == 0.5  # |4 - 2| / 4
    assert conflict.location_gap("Kerala", True, "Kerala", True) == 0.0
    assert conflict.location_gap("Kerala", True, "Kerala", False) == 0.5
    assert conflict.location_gap("Kerala", True, "Goa", False) == 1.0
    assert conflict.budget_gap(1_000_000, 800_000) == 0.2  # (10 - 8) / 10 lakh
    assert conflict.budget_gap(1_000_000, 1_200_000) == 0.0


def test_index_and_label() -> None:
    assert conflict.conflict_index([0.8, 0.5, 0.5, 0.2]) == 50  # 100 x 2.0 / 4
    assert [conflict.conflict_label(i) for i in (29, 30, 60, 61)] == ["low", "moderate", "moderate", "high"]


# ---------- step 8: scholarships ----------

STUDENT = Student(4, "Karnataka", True, "Karnataka", category="obc", percentage=88.0, gender="female")
PARENT = Parent(250_000, 600_000, 800_000, 600_000, 2, 5, "Karnataka", False, ())


def _scholarship(**rules) -> Scholarship:
    base = dict(name="S", amount=12_000, amount_period="per_year", deadline=None, income_limit=None,
                categories=(), states=(), min_percentage=None, gender=None, course_level=None)
    return Scholarship(**base | rules)


def test_rupees_use_indian_grouping() -> None:
    assert [scholarships.rupees_text(n) for n in (999, 1234, 800_000, 12_345_678)] == [
        "999", "1,234", "8,00,000", "1,23,45,678"
    ]


def test_every_rule_must_be_met() -> None:
    all_rules = _scholarship(income_limit=800_000, categories=("obc", "sc"), states=("Karnataka",),
                             min_percentage=85, gender="female", course_level="UG")
    rule = scholarships.matched_rule(all_rules, STUDENT, PARENT, "UG")
    assert rule == ("UG course; family income up to Rs 8,00,000; category OBC; home state Karnataka; "
                    "marks of at least 85%; for girls")
    assert scholarships.matched_rule(all_rules, STUDENT, PARENT, "PG") is None
    assert scholarships.matched_rule(_scholarship(min_percentage=90), STUDENT, PARENT, "UG") is None
    assert scholarships.matched_rule(_scholarship(), STUDENT, PARENT, "UG") == "open to all students"


def test_an_unknown_income_never_matches_an_income_limit() -> None:
    no_income = Parent(250_000, 600_000, 800_000, None, 2, 5, "Karnataka", False, ())
    assert scholarships.matched_rule(_scholarship(income_limit=800_000), STUDENT, no_income, "UG") is None


def test_value_over_the_course() -> None:
    assert scholarships.total_value(_scholarship(), 4) == 48_000  # 12,000 x 4 years
    assert scholarships.total_value(_scholarship(amount_period="one_time"), 4) == 12_000


# ---------- step 7: SWOT ----------


def _summary(name: str, fit_: float, mkt: float, demand: float, viable: bool = True, **kw) -> swot.CareerSummary:
    reasons = kw.pop("reasons", ())
    return swot.CareerSummary(name, fit_, mkt, demand, "Karnataka", viable, reasons, kw.get("loan", 0), kw.get("be", 1.0))


def test_swot_quadrants() -> None:
    t = {Dimension.LOGICAL: 0.9, Dimension.VERBAL: 0.7, Dimension.SPATIAL: 0.4, Dimension.CREATIVE: None}
    careers = [
        _summary("Data Scientist", 0.8, 0.9, 0.9),
        _summary("Doctor", 0.9, 0.7, 0.8, viable=False, reasons=(FinanceReason.LOAN_EXCEEDS_LIMIT,), loan=900_000),
        _summary("Lawyer", 0.4, 0.95, 0.3),  # strong market but weak fit, and low demand in the region
    ]
    result = swot.build_swot(t, careers, conflict_index=65)
    assert [i.text for i in result.strengths] == ["Strong logical reasoning", "Strong verbal ability"]
    assert [(i.text, i.value) for i in result.weaknesses] == [("Lower spatial reasoning", 0.4)]
    assert [i.text for i in result.opportunities] == ["Strong job market for Data Scientist", "Strong job market for Doctor"]
    assert [(i.text, i.value) for i in result.threats] == [
        ("Doctor needs a loan above the family's limit", 900_000),
        ("Low demand for Lawyer in Karnataka", 0.3),
        ("Parent and student disagree on a lot", 65),
    ]


def test_swot_never_invents_items() -> None:
    result = swot.build_swot({Dimension.LOGICAL: 0.5}, [], conflict_index=10)
    assert result == swot.Swot([], [], [], [])
