"""Plain data the scoring engine works on. app/services/analysis.py fills these from the database, so the
functions in app/core/ never touch it (no database, no network, no randomness)."""

from dataclasses import dataclass
from datetime import date
from uuid import UUID

from app.schemas.common import Dimension


@dataclass(frozen=True)
class QuestionInfo:
    id: UUID
    dimension: Dimension
    kind: str  # "likert" or "choice"
    reverse_scored: bool = False
    correct_value: int | None = None


@dataclass(frozen=True)
class Route:
    """One way into a career: an exam, a college and the course it leads to."""

    exam: str
    college: str
    level: str  # "UG" or "PG"
    duration_years: float
    annual_fee: int | None
    annual_living_cost: int | None  # hostel and mess; None = use the college's state average
    state: str | None
    # Class 11-12 streams that may enter the course, and the ones it naturally follows (step 0)
    eligible_streams: tuple[str, ...] = ()
    primary_streams: tuple[str, ...] = ()
    tier: int | None = None  # 1-3 by NIRF; None for routes that aren't colleges (CA, NDA)
    city: str | None = None
    rank: int | None = None  # NIRF rank (lower bound of a band)
    course: str = ""


@dataclass(frozen=True)
class MarketRow:
    region: str
    demand_index: float  # 0..100, as stored
    growth_rate: float | None
    median_salary: int | None
    entry_salary: int | None
    as_of: date
    source: str
    estimated: bool


@dataclass(frozen=True)
class Scholarship:
    name: str
    amount: int
    amount_period: str  # "one_time" or "per_year"
    deadline: date | None
    income_limit: int | None
    categories: tuple[str, ...]
    states: tuple[str, ...]
    min_percentage: float | None
    gender: str | None
    course_level: str | None


@dataclass(frozen=True)
class Student:
    risk_appetite: int
    preferred_state: str
    open_to_abroad: bool
    home_state: str
    category: str | None = None
    percentage: float | None = None
    gender: str | None = None
    stream: str = "undecided"  # Class 11-12 stream (SchoolStream); undecided keeps every career


@dataclass(frozen=True)
class Parent:
    annual_budget: int
    savings: int
    max_loan: int
    annual_income: int | None
    risk_appetite: int
    breakeven_tolerance_years: int
    preferred_state: str
    open_to_abroad: bool
    top_domain_ids: tuple[UUID, ...]
