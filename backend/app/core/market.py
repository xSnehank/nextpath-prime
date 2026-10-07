"""Step 4: how strong is the job market for each career? (backend guide, section 4)

Each signal is min-max scaled across the careers being ranked, then
M = 0.5 x demand + 0.3 x growth + 0.2 x salary_percentile.
The student's preferred state is used when there is data for it; otherwise the national ('India') figure
stands in and the result is flagged 'estimated'.
"""

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Hashable

from app.core.inputs import MarketRow

NATIONAL = "India"


def pick_row(rows: Mapping[str, MarketRow], region: str) -> tuple[MarketRow | None, bool]:
    """The row for the region, or the national one. The flag is True when the national row stood in."""
    if region in rows:
        return rows[region], False
    return rows.get(NATIONAL), True


def min_max[K: Hashable](values: Mapping[K, float | None]) -> dict[K, float]:
    """(x - min) / (max - min). A missing value scores 0; when every value is the same they all score 0.5."""
    known = [value for value in values.values() if value is not None]
    if not known:
        return dict.fromkeys(values, 0.0)
    low, high = min(known), max(known)
    return {
        key: 0.0 if value is None else 0.5 if high == low else (value - low) / (high - low)
        for key, value in values.items()
    }


@dataclass(frozen=True)
class MarketScore:
    demand: float
    growth: float
    salary_percentile: float

    @property
    def total(self) -> float:
        return 0.5 * self.demand + 0.3 * self.growth + 0.2 * self.salary_percentile


def market_scores[K: Hashable](rows: Mapping[K, MarketRow]) -> dict[K, MarketScore]:
    demand = min_max({key: row.demand_index for key, row in rows.items()})
    growth = min_max({key: row.growth_rate for key, row in rows.items()})
    salary = min_max({key: row.median_salary for key, row in rows.items()})
    return {key: MarketScore(demand[key], growth[key], salary[key]) for key in rows}
