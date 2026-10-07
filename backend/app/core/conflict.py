"""Step 6: the Parent-Student Conflict Index (backend guide, section 4).

Four gaps, each 0 (agree) to 1 (fully disagree); the index is 100 x their mean.
"""

from collections.abc import Sequence
from typing import Hashable

RANK_WEIGHTS = (1.0, 0.66, 0.33)
FULL_AGREEMENT = sum(RANK_WEIGHTS)  # 1.99


def domain_gap(student_top: Sequence[Hashable], parent_top: Sequence[Hashable]) -> float:
    """1 - shared weight / 1.99. A domain both picked counts with the lower of its two rank weights,
    so the same three domains in the same order give 0, and a different order still leaves a gap."""
    student = {domain: RANK_WEIGHTS[i] for i, domain in enumerate(student_top[:3])}
    parent = {domain: RANK_WEIGHTS[i] for i, domain in enumerate(parent_top[:3])}
    shared = sum(min(student[domain], parent[domain]) for domain in student.keys() & parent.keys())
    return max(0.0, 1 - shared / FULL_AGREEMENT)


def risk_gap(student_risk: int, parent_risk: int) -> float:
    """|student - parent| / 4 on the 1-5 scale."""
    return abs(student_risk - parent_risk) / 4


def location_gap(student_state: str, student_abroad: bool, parent_state: str, parent_abroad: bool) -> float:
    """0 when both choices match, 0.5 when one differs, 1 when both differ."""
    return 0.5 * (student_state != parent_state) + 0.5 * (student_abroad != parent_abroad)


def budget_gap(cost: int, family_capacity: int) -> float:
    """min(1, max(0, cost - capacity) / cost) for the student's top-ranked path."""
    if cost <= 0:
        return 0.0
    return min(1.0, max(0, cost - family_capacity) / cost)


def conflict_index(gaps: Sequence[float]) -> int:
    return round(100 * sum(gaps) / len(gaps))


def conflict_label(index: int) -> str:
    """Under 30 low, 30-60 moderate, above 60 high."""
    return "low" if index < 30 else "moderate" if index <= 60 else "high"
