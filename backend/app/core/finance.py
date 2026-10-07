"""Step 3: can the family afford a path? (backend guide, section 4, the Financial Constraint Solver)

total_cost   = (annual_fee + living_cost) x duration_years - scholarship
capacity     = annual_budget x duration_years + savings   (the guide's 12 x monthly budget, with a yearly budget)
loan_needed  = max(0, total_cost - capacity)
net_salary   = max(starting_salary - 12 x monthly_living, 1 rupee)
breakeven    = total_cost / net_salary   (years)
viable       = loan_needed <= max_loan and breakeven <= tolerance
F            = 0.5 x min(1, capacity / total_cost) + 0.3 x L + 0.2 x P
  L = 1 when the loan is within the limit, else max(0, 1 - (loan_needed - max_loan) / total_cost)
  P = clamp(1 - breakeven / (2 x tolerance), 0, 1)
"""

from dataclasses import dataclass

from app.schemas.analyze import FinanceReason

EPSILON_RUPEES = 1  # stops a salary below living costs from dividing by zero


def total_cost(annual_fee: int, annual_living_cost: int, duration_years: float, scholarship: int = 0) -> int:
    return max(0, round((annual_fee + annual_living_cost) * duration_years) - scholarship)


def capacity(annual_budget: int, savings: int, duration_years: float) -> int:
    return round(annual_budget * duration_years) + savings


@dataclass(frozen=True)
class FinanceCheck:
    total_cost: int
    capacity: int
    loan_needed: int
    starting_salary: int
    breakeven_years: float
    duration_years: float
    viable: bool
    reasons: tuple[FinanceReason, ...]
    capacity_ratio: float
    loan_score: float
    payback_score: float

    @property
    def score(self) -> float:
        return 0.5 * self.capacity_ratio + 0.3 * self.loan_score + 0.2 * self.payback_score


def check_path(
    cost: int,
    family_capacity: int,
    max_loan: int,
    starting_salary: int,
    monthly_living: int,
    tolerance_years: int,
    duration_years: float,
) -> FinanceCheck:
    loan = max(0, cost - family_capacity)
    net_salary = max(starting_salary - 12 * monthly_living, EPSILON_RUPEES)
    breakeven = cost / net_salary

    reasons: list[FinanceReason] = []
    if loan > max_loan:
        reasons.append(FinanceReason.LOAN_EXCEEDS_LIMIT)
    if breakeven > tolerance_years:
        reasons.append(FinanceReason.BREAKEVEN_TOO_LONG)
    viable = not reasons
    # Costing more than the family can pay without a loan is fine on its own (that's what the loan is for);
    # it's listed only to explain a path that already failed.
    if not viable and cost > family_capacity:
        reasons.insert(0, FinanceReason.COST_EXCEEDS_CAPACITY)

    capacity_ratio = 1.0 if cost == 0 else min(1.0, family_capacity / cost)
    loan_score = 1.0 if loan <= max_loan else max(0.0, 1 - (loan - max_loan) / cost)
    payback_score = min(1.0, max(0.0, 1 - breakeven / (2 * tolerance_years)))
    return FinanceCheck(
        total_cost=cost,
        capacity=family_capacity,
        loan_needed=loan,
        starting_salary=starting_salary,
        breakeven_years=breakeven,
        duration_years=duration_years,
        viable=viable,
        reasons=tuple(reasons),
        capacity_ratio=capacity_ratio,
        loan_score=loan_score,
        payback_score=payback_score,
    )
