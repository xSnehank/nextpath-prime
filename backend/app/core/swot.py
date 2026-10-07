"""Step 7: the SWOT summary (backend guide, section 4).

Strengths: trait dimensions with t >= 0.7. Weaknesses: t <= 0.4.
Opportunities: the careers with the strongest market that also fit (S >= 0.5).
Threats: top-fit careers the family can't afford, careers with low demand, and a high Conflict Index.
Every item keeps the number that produced it. When the data doesn't support an item, it's left out, so a
quadrant can have fewer than two items rather than an invented one.
"""

from collections.abc import Mapping, Sequence
from dataclasses import dataclass

from app.schemas.analyze import FinanceReason
from app.schemas.common import Dimension

STRONG, WEAK = 0.7, 0.4
GOOD_FIT = 0.5
LOW_DEMAND = 0.4  # demand index on the 0..1 scale
HIGH_CONFLICT = 60
MAX_ITEMS = 4

LABELS: dict[Dimension, str] = {
    Dimension.LOGICAL: "logical reasoning",
    Dimension.NUMERICAL: "numerical ability",
    Dimension.VERBAL: "verbal ability",
    Dimension.SPATIAL: "spatial reasoning",
    Dimension.CREATIVE: "creativity",
    Dimension.REALISTIC: "hands-on (realistic) interests",
    Dimension.INVESTIGATIVE: "investigative interests",
    Dimension.ARTISTIC: "artistic interests",
    Dimension.SOCIAL: "social interests",
    Dimension.ENTERPRISING: "enterprising interests",
    Dimension.CONVENTIONAL: "organising (conventional) interests",
    Dimension.ANALYTICAL: "analytical thinking",
    Dimension.STRUCTURED: "structured way of working",
}


@dataclass(frozen=True)
class Item:
    text: str
    value: float


@dataclass(frozen=True)
class CareerSummary:
    name: str
    fit: float
    market: float
    demand_index: float  # 0..1
    region: str
    viable: bool
    reasons: tuple[FinanceReason, ...]
    loan_needed: int
    breakeven_years: float


@dataclass(frozen=True)
class Swot:
    strengths: list[Item]
    weaknesses: list[Item]
    opportunities: list[Item]
    threats: list[Item]


def build_swot(
    traits: Mapping[Dimension, float | None], careers: Sequence[CareerSummary], conflict_index: int
) -> Swot:
    scored = [(dimension, t) for dimension, t in traits.items() if t is not None]
    strengths = [
        Item(f"Strong {LABELS[d]}", round(t, 4)) for d, t in sorted(scored, key=lambda p: -p[1]) if t >= STRONG
    ]
    weaknesses = [
        Item(f"Lower {LABELS[d]}", round(t, 4)) for d, t in sorted(scored, key=lambda p: p[1]) if t <= WEAK
    ]
    opportunities = [
        Item(f"Strong job market for {c.name}", round(c.market, 4))
        for c in sorted(careers, key=lambda c: (-c.market, c.name))
        if c.fit >= GOOD_FIT
    ]

    threats: list[Item] = []
    for c in sorted(careers, key=lambda c: (-c.fit, c.name))[:MAX_ITEMS]:
        if c.viable:
            continue
        if FinanceReason.LOAN_EXCEEDS_LIMIT in c.reasons:
            threats.append(Item(f"{c.name} needs a loan above the family's limit", c.loan_needed))
        elif FinanceReason.BREAKEVEN_TOO_LONG in c.reasons:
            threats.append(Item(f"{c.name} takes too long to pay back", round(c.breakeven_years, 1)))
    threats += [
        Item(f"Low demand for {c.name} in {c.region}", round(c.demand_index, 4))
        for c in sorted(careers, key=lambda c: c.demand_index)
        if c.demand_index < LOW_DEMAND
    ]
    if conflict_index > HIGH_CONFLICT:
        threats.append(Item("Parent and student disagree on a lot", conflict_index))

    return Swot(strengths[:MAX_ITEMS], weaknesses[:MAX_ITEMS], opportunities[:MAX_ITEMS], threats[:MAX_ITEMS])
