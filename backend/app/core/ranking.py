"""Step 5: the final ranking (backend guide, section 4).

R = fit_weight x S + finance_weight x F + market_weight x M.
Careers that follow the student's stream (step 0) always come before the ones that are merely open to them:
  1. own-stream, viable   2. own-stream, not viable   3. open, viable   4. open, not viable
so a PCM student never sees CA above an engineering career. Within each group, higher R first; ties break on
higher S, then higher M, then career id, so results never flip between runs.
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
    natural: bool = True  # the career follows the student's stream (False: open to them, but another stream's)


def final_score(weights: Weights, fit: float, finance: float, market: float) -> float:
    return weights.fit * fit + weights.finance * finance + weights.market * market


def rank(candidates: list[Candidate], weights: Weights) -> tuple[list[Candidate], list[Candidate]]:
    """(the roadmap, best first; the student's own-stream careers that weren't viable and didn't make it)."""

    def order(c: Candidate) -> tuple[int, int, float, float, float, str]:
        # Rounded so float noise (0.30000000000000004) can't decide a tie the rules say S and M should.
        final = round(final_score(weights, c.fit, c.finance, c.market), 9)
        return (not c.natural, not c.viable, -final, -round(c.fit, 9), -round(c.market, 9), str(c.career_id))

    ordered = sorted(candidates, key=order)
    roadmap = ordered[:TOP]
    rejected = [c for c in ordered if c.natural and not c.viable and c not in roadmap]
    return roadmap, rejected
