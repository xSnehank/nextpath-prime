"""Tests for the weights rule you write in app/schemas/common.py (Weights._must_sum_to_one).

They fail until that TODO is done; they adapt to whatever WEIGHT_SUM_TOLERANCE you choose.
"""

import pytest
from pydantic import ValidationError

from app.schemas.common import WEIGHT_SUM_TOLERANCE, Weights
from tests.helpers import PAIR, assert_error, make_client


@pytest.mark.parametrize(
    ("fit", "finance", "market"),
    [(0.45, 0.30, 0.25), (0.5, 0.3, 0.2), (1, 0, 0), (0.1, 0.2, 0.7)],  # 0.1 + 0.2 + 0.7 = 1.0000000000000002 in floats
)
def test_weights_that_sum_to_one_are_accepted(fit: float, finance: float, market: float) -> None:
    Weights(fit=fit, finance=finance, market=market)


@pytest.mark.parametrize(("fit", "finance", "market"), [(0.5, 0.5, 0.5), (0.2, 0.2, 0.2), (0.6, 0.3, 0.0)])
def test_weights_far_from_one_are_rejected(fit: float, finance: float, market: float) -> None:
    with pytest.raises(ValidationError):
        Weights(fit=fit, finance=finance, market=market)


def test_the_tolerance_is_the_boundary() -> None:
    if WEIGHT_SUM_TOLERANCE <= 0:
        pytest.skip("WEIGHT_SUM_TOLERANCE is not chosen yet")
    Weights(fit=0.45 + WEIGHT_SUM_TOLERANCE / 2, finance=0.30, market=0.25)
    with pytest.raises(ValidationError):
        Weights(fit=0.45 + WEIGHT_SUM_TOLERANCE * 2, finance=0.30, market=0.25)


def test_the_api_answers_invalid_weights() -> None:
    body = PAIR | {"weights": {"fit": 0.5, "finance": 0.5, "market": 0.5}}
    assert_error(make_client().post("/analyze", json=body), 422, "INVALID_WEIGHTS")
