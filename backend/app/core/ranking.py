"""Step 5: the final ranking (backend guide, section 4).

R = fit_weight x S + finance_weight x F + market_weight x M.
Only viable paths enter the top 5; if fewer than 5 are viable, the best non-viable ones fill the gaps.
Ties break on higher S, then higher M, then career id, so results never flip between runs.
"""

from dataclasses import dataclass
from uuid import UUID

from app.schemas.common import Weights

TOP = 5


@dataclass(frozen=True)
class Candidate:
    career_id: UUID
    fit: float
    finance: float
    market: float
    viable: bool


def final_score(weights: Weights, fit: float, finance: float, market: float) -> float:
    return weights.fit * fit + weights.finance * finance + weights.market * market


def rank(candidates: list[Candidate], weights: Weights) -> tuple[list[Candidate], list[Candidate]]:
    """(the roadmap, best first; the non-viable careers left out of it)."""

    def order(c: Candidate) -> tuple[float, float, float, str]:
        # Rounded so float noise (0.30000000000000004) can't decide a tie the rules say S and M should.
        final = round(final_score(weights, c.fit, c.finance, c.market), 9)
        return (-final, -round(c.fit, 9), -round(c.market, 9), str(c.career_id))

    viable = sorted((c for c in candidates if c.viable), key=order)
    not_viable = sorted((c for c in candidates if not c.viable), key=order)
    roadmap = viable[:TOP]
    roadmap += not_viable[: TOP - len(roadmap)]
    rejected = [c for c in not_viable if c not in roadmap]
    return roadmap, rejected
