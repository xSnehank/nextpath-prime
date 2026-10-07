"""POST /analyze and GET /results/{id}: the roadmap.

Field names follow the backend guide (section 5). Every score is 0..1 and carries
the parts it was computed from, so the UI can show how it was calculated. The
parent's raw budget, savings and loan limit are never included (privacy rule).
"""

from datetime import date, datetime
from enum import StrEnum
from typing import Literal
from uuid import UUID

from pydantic import Field

from app.schemas.common import DEFAULT_WEIGHTS, Dimension, Rupees, Score, Score100, StrictModel, TraitGroup, Weights
from app.schemas.market import RegionMarket


class AnalyzeRequest(StrictModel):
    student_id: UUID
    parent_id: UUID
    weights: Weights = Field(default=DEFAULT_WEIGHTS, description="Must sum to 1, otherwise INVALID_WEIGHTS")


# ---------- conflict index ----------


class Gap(StrictModel):
    dimension: Literal["domain", "risk", "location", "budget"]
    gap: Score = Field(description="0 = agree ... 1 = fully disagree")
    text: str
    student_value: str | None = Field(description="The student's side, for display")
    parent_value: str | None = Field(description="The parent's side, for display")


class Conflict(StrictModel):
    index: int = Field(ge=0, le=100, description="100 x the mean of the four gaps")
    label: Literal["low", "moderate", "high"] = Field(description="under 30 low, 30-60 moderate, above 60 high")
    top_gaps: list[Gap] = Field(max_length=3, description="The three largest gaps, largest first")
    gaps: list[Gap] = Field(max_length=4, description="All four gaps, largest first")


# ---------- SWOT, traits, domains ----------


class SwotItem(StrictModel):
    text: str
    value: float = Field(description="The number that produced this item: a trait score, demand score, years or rupees")


class Swot(StrictModel):
    strengths: list[SwotItem]
    weaknesses: list[SwotItem]
    opportunities: list[SwotItem]
    threats: list[SwotItem]


class Trait(StrictModel):
    dimension: Dimension
    group: TraitGroup
    value: Score | None = Field(description="Null when the student answered no questions for this dimension")


class DomainScore(StrictModel):
    """Mean of the scores of the careers in this domain."""

    domain_id: UUID
    domain: str
    fit: Score
    aptitude: Score
    interest: Score
    cognitive: Score


# ---------- one roadmap entry ----------


class FinanceReason(StrEnum):
    LOAN_EXCEEDS_LIMIT = "LOAN_EXCEEDS_LIMIT"
    BREAKEVEN_TOO_LONG = "BREAKEVEN_TOO_LONG"
    COST_EXCEEDS_CAPACITY = "COST_EXCEEDS_CAPACITY"


class FitParts(StrictModel):
    """fit = 0.5 x aptitude + 0.3 x interest + 0.2 x cognitive"""

    aptitude: Score
    interest: Score
    cognitive: Score


class FinanceParts(StrictModel):
    """finance = 0.5 x capacity_ratio + 0.3 x loan + 0.2 x payback"""

    capacity_ratio: Score = Field(description="min(1, capacity / total_cost)")
    loan: Score = Field(description="1 when the loan is within the family's limit, lower the further above it")
    payback: Score = Field(description="1 - breakeven / (2 x the family's tolerance), clamped to 0..1")


class MarketParts(StrictModel):
    """market = 0.5 x demand + 0.3 x growth + 0.2 x salary_percentile, each min-max scaled across careers"""

    demand: Score
    growth: Score
    salary_percentile: Score


class Scores(StrictModel):
    fit: Score
    finance: Score
    market: Score
    final: Score = Field(description="weights.fit x fit + weights.finance x finance + weights.market x market")
    final_100: Score100
    fit_parts: FitParts
    finance_parts: FinanceParts
    market_parts: MarketParts


class FinanceCheck(StrictModel):
    viable: bool
    total_cost: Rupees = Field(description="(annual fee + living cost) x duration - matched scholarship")
    capacity: Rupees = Field(description="What the family can pay over the course without a loan")
    loan_needed: Rupees = Field(description="max(0, total_cost - capacity)")
    starting_salary: Rupees
    breakeven_years: float = Field(ge=0, description="total_cost / (starting salary - yearly living costs)")
    duration_years: float = Field(gt=0)
    reasons: list[FinanceReason] = Field(description="Why the path is not viable; empty when viable")


class College(StrictModel):
    name: str
    annual_fee: Rupees


class EducationPath(StrictModel):
    education: str
    exams: list[str]
    colleges: list[College] = Field(description="The finance check uses the first college")


class MatchedScholarship(StrictModel):
    name: str
    amount: Rupees
    deadline: date | None
    matched_rule: str = Field(description="The eligibility rule the family met, e.g. 'percentage >= 85'")


class RoadmapItem(StrictModel):
    rank: int = Field(ge=1, le=5)
    career_id: UUID
    career: str
    domain: str
    scores: Scores
    finance: FinanceCheck
    market: RegionMarket
    path: EducationPath
    scholarships: list[MatchedScholarship]
    cheaper_alternative: str | None


class RejectedCareer(StrictModel):
    career_id: UUID
    career: str
    reasons: list[FinanceReason] = Field(min_length=1)
    cheaper_alternative: str | None


class AnalyzeResponse(StrictModel):
    result_id: UUID
    created_at: datetime
    weights: Weights
    conflict: Conflict
    swot: Swot
    traits: list[Trait]
    domain_scores: list[DomainScore] = Field(description="Best fit first")
    roadmap: list[RoadmapItem] = Field(
        max_length=5,
        description="Viable paths first, by final score; filled with non-viable ones (finance.viable = false) when fewer than 5 are viable",
    )
    rejected: list[RejectedCareer] = Field(description="Non-viable careers that did not make the roadmap")
