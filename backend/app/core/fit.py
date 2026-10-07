"""Step 2: how well a career fits the student (backend guide, section 4).

A = sum of w_k x t_k over the career's aptitude weights; I and C the same for interest and cognitive style.
S = 0.5 A + 0.3 I + 0.2 C. A domain's score is the mean of its careers' scores.
"""

from collections.abc import Mapping
from dataclasses import dataclass
from statistics import fmean
from uuid import UUID

from app.schemas.common import Dimension, TraitGroup

GROUP_SHARE: dict[TraitGroup, float] = {TraitGroup.APTITUDE: 0.5, TraitGroup.INTEREST: 0.3, TraitGroup.COGNITIVE: 0.2}


@dataclass(frozen=True)
class Fit:
    aptitude: float
    interest: float
    cognitive: float

    @property
    def total(self) -> float:
        return (
            GROUP_SHARE[TraitGroup.APTITUDE] * self.aptitude
            + GROUP_SHARE[TraitGroup.INTEREST] * self.interest
            + GROUP_SHARE[TraitGroup.COGNITIVE] * self.cognitive
        )


def group_score(weights: Mapping[str, float], traits: Mapping[Dimension, float | None]) -> float:
    """sum of w_k x t_k. A dimension with no answers is left out and the remaining weights are scaled back up
    to 1, so one skipped dimension doesn't drag the whole group towards 0. With no answered dimension it's 0."""
    answered = {key: weight for key, weight in weights.items() if traits.get(Dimension(key)) is not None}
    total_weight = sum(answered.values())
    if total_weight == 0:
        return 0.0
    return sum(weight * traits[Dimension(key)] for key, weight in answered.items()) / total_weight


def career_fit(trait_weights: Mapping[str, Mapping[str, float]], traits: Mapping[Dimension, float | None]) -> Fit:
    return Fit(
        aptitude=group_score(trait_weights[TraitGroup.APTITUDE], traits),
        interest=group_score(trait_weights[TraitGroup.INTEREST], traits),
        cognitive=group_score(trait_weights[TraitGroup.COGNITIVE], traits),
    )


@dataclass(frozen=True)
class DomainFit:
    domain_id: UUID
    domain: str
    fit: Fit

    @property
    def total(self) -> float:
        return self.fit.total


def domain_fits(career_fits: list[tuple[UUID, str, Fit]]) -> list[DomainFit]:
    """Mean of each domain's career scores, best first (ties by name, so the order never flips)."""
    by_domain: dict[UUID, tuple[str, list[Fit]]] = {}
    for domain_id, domain, fit in career_fits:
        by_domain.setdefault(domain_id, (domain, []))[1].append(fit)
    results = [
        DomainFit(
            domain_id,
            name,
            Fit(
                aptitude=fmean(f.aptitude for f in fits),
                interest=fmean(f.interest for f in fits),
                cognitive=fmean(f.cognitive for f in fits),
            ),
        )
        for domain_id, (name, fits) in by_domain.items()
    ]
    return sorted(results, key=lambda d: (-d.total, d.domain))
