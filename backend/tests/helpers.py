"""Shared test helpers: a mock-mode app isolated from your local .env, and the
formula checks every /analyze response must pass (mock now, real from branch 8)."""

from typing import Any

from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from app.mocks import MOCK_PARENT_ID, MOCK_RESULT_ID, MOCK_STUDENT_ID
from app.schemas.analyze import AnalyzeResponse
from app.schemas.common import DIMENSION_GROUP, Dimension, ErrorBody

AS_STUDENT = {"X-Dev-User": str(MOCK_STUDENT_ID)}
AS_PARENT = {"X-Dev-User": str(MOCK_PARENT_ID)}
PAIR = {"student_id": str(MOCK_STUDENT_ID), "parent_id": str(MOCK_PARENT_ID)}
RESULT_ID = str(MOCK_RESULT_ID)
DATA_SCIENCE_ID = "c0000000-0000-4000-8000-000000000001"
DOMAIN_IDS = [f"d0000000-0000-4000-8000-{n:012d}" for n in (4, 1, 2)]

PARENT_PROFILE = {
    "role": "parent",
    "annual_education_budget": 250000,
    "savings": 600000,
    "max_loan": 800000,
    "annual_income": 1200000,
    "risk_appetite": 2,
    "breakeven_tolerance_years": 5,
    "preferred_state": "Maharashtra",
    "open_to_abroad": False,
    "top_domain_ids": DOMAIN_IDS,
}
STUDENT_PROFILE = {
    "role": "student",
    "risk_appetite": 4,
    "preferred_state": "Karnataka",
    "open_to_abroad": True,
    "home_state": "Maharashtra",
}

TOLERANCE = 1e-3  # mock and real scores are rounded to 4 decimals


def make_settings(**overrides: Any) -> Settings:
    values = {
        "environment": "test",
        "use_mocks": True,
        "demo_enabled": True,
        "dev_auth_bypass": False,
        "explain_mode": "template",
        "cors_origins": "http://localhost:3000",
    } | overrides
    return Settings(_env_file=None, **values)


def make_client(**overrides: Any) -> TestClient:
    return TestClient(create_app(make_settings(**overrides)), raise_server_exceptions=False)


def assert_error(response: Any, status: int, code: str) -> dict[str, Any]:
    """The response is the one error shape with this status and code; returns error.details."""
    assert response.status_code == status, response.text[:500]
    body = response.json()
    ErrorBody.model_validate(body)
    assert body["error"]["code"] == code
    assert body["error"]["message"]
    assert "X-Request-ID" in response.headers
    return body["error"]["details"]


def assert_analyze_invariants(result: AnalyzeResponse) -> None:
    """Rules from docs/backend-guide.md section 4 that any /analyze response must obey."""
    w = result.weights
    assert abs(w.fit + w.finance + w.market - 1) < TOLERANCE

    assert sorted(t.dimension for t in result.traits) == sorted(Dimension)
    assert all(t.group == DIMENSION_GROUP[t.dimension] for t in result.traits)
    fits = [d.fit for d in result.domain_scores]
    assert fits == sorted(fits, reverse=True), "domain_scores are best first"

    assert [item.rank for item in result.roadmap] == list(range(1, len(result.roadmap) + 1))
    viable = [item.finance.viable for item in result.roadmap]
    assert viable == sorted(viable, reverse=True), "viable paths come before non-viable ones"
    for group in (True, False):
        finals = [item.scores.final for item in result.roadmap if item.finance.viable is group]
        assert finals == sorted(finals, reverse=True), "each group is ordered by final score"

    for item in result.roadmap:
        s, f = item.scores, item.finance
        assert abs(s.final - (w.fit * s.fit + w.finance * s.finance + w.market * s.market)) < TOLERANCE
        assert s.final_100 == round(s.final * 100)
        fp, fin, mp = s.fit_parts, s.finance_parts, s.market_parts
        assert abs(s.fit - (0.5 * fp.aptitude + 0.3 * fp.interest + 0.2 * fp.cognitive)) < TOLERANCE
        assert abs(s.finance - (0.5 * fin.capacity_ratio + 0.3 * fin.loan + 0.2 * fin.payback)) < TOLERANCE
        assert abs(s.market - (0.5 * mp.demand + 0.3 * mp.growth + 0.2 * mp.salary_percentile)) < TOLERANCE
        assert f.loan_needed == max(0, f.total_cost - f.capacity)
        assert abs(fin.capacity_ratio - min(1, f.capacity / f.total_cost)) < TOLERANCE
        if f.viable:
            assert not {"LOAN_EXCEEDS_LIMIT", "BREAKEVEN_TOO_LONG"} & set(f.reasons)
        else:
            assert f.reasons, "a non-viable path says why"

    roadmap_ids = {item.career_id for item in result.roadmap}
    assert not roadmap_ids & {career.career_id for career in result.rejected}

    c = result.conflict
    assert len(c.gaps) == 4 and len({g.dimension for g in c.gaps}) == 4
    assert c.index == round(100 * sum(g.gap for g in c.gaps) / 4)
    assert c.label == ("low" if c.index < 30 else "moderate" if c.index <= 60 else "high")
    gaps = [g.gap for g in c.gaps]
    assert gaps == sorted(gaps, reverse=True), "gaps are largest first"
    assert c.top_gaps == c.gaps[:3]
