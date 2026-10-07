"""Live mode end to end: a linked pair finishes, agrees, runs /analyze, reads the result and explanations.

Careers need trait weights, market data and living costs to be ranked. Where the seeds don't provide them
yet, this module fills the gaps with obviously fake test values (only in the throwaway database), and the
tests check the formulas (assert_analyze_invariants), not particular numbers.
"""

import json
from typing import Any
from uuid import UUID

import pytest

from app.schemas.analyze import AnalyzeResponse
from app.schemas.explain import ExplainResponse
from tests.helpers import PARENT_PROFILE, STUDENT_PROFILE, assert_analyze_invariants, assert_error
from tests.live import as_user, live_client, run_sql, sign_up

TEST_WEIGHTS = {
    "aptitude": {"logical": 0.4, "numerical": 0.3, "verbal": 0.3},
    "interest": {"investigative": 0.5, "realistic": 0.5},
    "cognitive": {"analytical": 0.6, "structured": 0.4},
}


@pytest.fixture(scope="module")
def data(db_url: str) -> str:
    run_sql(db_url, "UPDATE careers SET trait_weights = CAST(:w AS jsonb) WHERE trait_weights IS NULL", w=json.dumps(TEST_WEIGHTS))
    run_sql(
        db_url,
        """
        INSERT INTO market_data (career_id, region, demand_index, entry_salary, median_salary, growth_rate, source, as_of, estimated)
        SELECT id, 'India', 40 + (row_number() OVER (ORDER BY id)) * 4, 400000 + (row_number() OVER (ORDER BY id)) * 30000,
               700000 + (row_number() OVER (ORDER BY id)) * 50000, 5 + (row_number() OVER (ORDER BY id)), 'TEST DATA',
               DATE '2026-01-01', true
        FROM careers WHERE NOT EXISTS (SELECT 1 FROM market_data m WHERE m.career_id = careers.id)
        ON CONFLICT DO NOTHING
        """,
    )
    run_sql(
        db_url,
        """
        INSERT INTO regions (name, monthly_living_cost, source, estimated) VALUES
            ('India', 15000, 'TEST DATA', true), ('Karnataka', 18000, 'TEST DATA', true)
        ON CONFLICT DO NOTHING
        """,
    )
    return db_url


def _ready_pair(client: Any, db_url: str, *, student_consents: bool = True) -> tuple[UUID, UUID]:
    student, parent = sign_up(db_url, "student", "Asha"), sign_up(db_url, "parent", "Ravi")
    code = client.post("/auth/invite", headers=as_user(student)).json()["invite_code"]
    client.post("/auth/link", headers=as_user(parent), json={"invite_code": code})
    questions = client.get("/questions?audience=student", headers=as_user(student)).json()["questions"]
    answers = [{"question_id": q["id"], "value": 1 + i % len(q["options"])} for i, q in enumerate(questions)]
    client.post("/responses", headers=as_user(student), json={"answers": answers})
    client.put("/profile", headers=as_user(student), json=STUDENT_PROFILE)
    client.put("/profile", headers=as_user(parent), json=PARENT_PROFILE)
    client.post("/consent", headers=as_user(parent), json={"agree": True})
    if student_consents:
        client.post("/consent", headers=as_user(student), json={"agree": True})
    return student, parent


def _analyze(client: Any, student: UUID, parent: UUID, caller: UUID, **body: Any) -> Any:
    return client.post(
        "/analyze", headers=as_user(caller), json={"student_id": str(student), "parent_id": str(parent)} | body
    )


def test_a_linked_pair_gets_a_roadmap_that_obeys_the_formulas(data: str) -> None:
    client = live_client(data)
    student, parent = _ready_pair(client, data)
    response = _analyze(client, student, parent, student)
    assert response.status_code == 200, response.text
    result = AnalyzeResponse.model_validate(response.json())
    assert_analyze_invariants(result)
    assert 1 <= len(result.roadmap) <= 5
    assert {gap.dimension for gap in result.conflict.gaps} == {"domain", "risk", "location", "budget"}
    # the parent's picks are DOMAIN_IDS; STUDENT_PROFILE says Karnataka, open to abroad; PARENT_PROFILE Maharashtra, not
    location = next(g for g in result.conflict.gaps if g.dimension == "location")
    assert location.gap == 1.0 and location.parent_value == "Maharashtra, India only"
    risk = next(g for g in result.conflict.gaps if g.dimension == "risk")
    assert risk.gap == 0.5  # |4 - 2| / 4
    for item in result.roadmap:
        assert item.market.region == "Karnataka" or item.market.data_quality == "estimated"
        assert item.path.colleges and item.path.exams

    # the parent sees the same saved result, and /me points at it
    saved = client.get(f"/results/{result.result_id}", headers=as_user(parent)).json()
    assert saved == response.json()
    assert client.get("/me", headers=as_user(parent)).json()["latest_result_id"] == str(result.result_id)


def test_custom_weights_change_the_ranking_inputs(data: str) -> None:
    client = live_client(data)
    student, parent = _ready_pair(client, data)
    weights = {"fit": 1.0, "finance": 0.0, "market": 0.0}
    result = AnalyzeResponse.model_validate(_analyze(client, student, parent, parent, weights=weights).json())
    assert_analyze_invariants(result)
    for item in result.roadmap:
        assert item.scores.final == item.scores.fit


def test_analysis_needs_both_assessments_and_both_consents(data: str) -> None:
    client = live_client(data)
    student, parent = _ready_pair(client, data, student_consents=False)
    details = assert_error(_analyze(client, student, parent, parent), 409, "CONSENT_REQUIRED")
    assert details["missing"] == ["student"]

    lonely_student, lonely_parent = sign_up(data, "student"), sign_up(data, "parent")
    code = client.post("/auth/invite", headers=as_user(lonely_student)).json()["invite_code"]
    client.post("/auth/link", headers=as_user(lonely_parent), json={"invite_code": code})
    details = assert_error(_analyze(client, lonely_student, lonely_parent, lonely_student), 409, "ASSESSMENT_INCOMPLETE")
    assert details["missing"] == ["student", "parent"]


def test_only_the_pair_itself_can_analyse_or_read_it(data: str) -> None:
    client = live_client(data)
    student, parent = _ready_pair(client, data)
    outsider = sign_up(data, "student")
    assert_error(_analyze(client, student, parent, outsider), 403, "FORBIDDEN")
    result_id = _analyze(client, student, parent, student).json()["result_id"]
    assert_error(client.get(f"/results/{result_id}", headers=as_user(outsider)), 404, "NOT_FOUND")
    assert_error(client.get(f"/results/{result_id}"), 401, "UNAUTHENTICATED")


def test_withdrawing_consent_hides_the_saved_result(data: str) -> None:
    client = live_client(data)
    student, parent = _ready_pair(client, data)
    result_id = _analyze(client, student, parent, student).json()["result_id"]
    client.post("/consent", headers=as_user(parent), json={"agree": False})
    details = assert_error(client.get(f"/results/{result_id}", headers=as_user(student)), 409, "CONSENT_REQUIRED")
    assert details["missing"] == ["parent"]


def test_explanations_use_the_template_and_only_result_numbers(data: str) -> None:
    client = live_client(data)
    student, parent = _ready_pair(client, data)
    result = AnalyzeResponse.model_validate(_analyze(client, student, parent, student).json())
    top = result.roadmap[0]
    body = {"result_id": str(result.result_id), "career_id": str(top.career_id)}
    explanation = ExplainResponse.model_validate(client.post("/explain", headers=as_user(parent), json=body).json())
    assert explanation.source == "template" and explanation.text.startswith(top.career)
    assert f"{round(top.scores.fit * 100)}/100" in explanation.text
    missing = {"result_id": str(result.result_id), "career_id": "00000000-0000-4000-8000-000000000000"}
    assert_error(client.post("/explain", headers=as_user(parent), json=missing), 404, "NOT_FOUND")


def test_career_market(data: str) -> None:
    client = live_client(data)
    student = sign_up(data, "student")
    career_id = "c1000000-0000-4000-8000-000000000001"
    market = client.get(f"/careers/{career_id}/market").json()  # public: no sign-in needed
    assert market["career"] == "Software Engineer" and market["domain"] == "Engineering / Technology"
    assert market["national"]["region"] == "India"
    missing = "00000000-0000-4000-8000-000000000000"
    assert_error(client.get(f"/careers/{missing}/market", headers=as_user(student)), 404, "NOT_FOUND")


def test_the_demo_needs_the_demo_family(data: str) -> None:
    client = live_client(data)
    response = client.post("/demo/run")
    if response.status_code == 404:  # db/seed/03_demo_family.sql not loaded in this database
        assert response.json()["error"]["message"].startswith("The demo family")
        return
    demo = response.json()
    result = client.get(f"/results/{demo['result_id']}")  # no sign-in needed for the demo family
    assert result.status_code == 200
    assert_analyze_invariants(AnalyzeResponse.model_validate(result.json()))


def test_an_eligible_family_gets_scholarships_and_a_lower_cost(data: str) -> None:
    """Income up to Rs 4.5 lakh: the Central Sector Scheme (Rs 12,000 a year) applies to every seeded career."""
    client = live_client(data)
    student, parent = _ready_pair(client, data)
    client.put("/profile", headers=as_user(student), json=STUDENT_PROFILE | {"category": "obc", "percentage": 91})
    client.put("/profile", headers=as_user(parent), json=PARENT_PROFILE | {"annual_income": 420000})
    result = AnalyzeResponse.model_validate(_analyze(client, student, parent, student).json())
    names = {s.name for item in result.roadmap for s in item.scholarships}
    assert "Central Sector Scheme of Scholarship for College and University Students" in names
    assert all(s.matched_rule for item in result.roadmap for s in item.scholarships)
