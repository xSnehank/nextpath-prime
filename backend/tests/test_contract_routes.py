"""Every endpoint answers in mock mode with exactly its contract shape.

The last test fails if someone adds a route without adding a case here.
"""

from dataclasses import dataclass
from typing import Any

import pytest
from fastapi.routing import APIRoute
from pydantic import TypeAdapter

from app.schemas.analyze import AnalyzeResponse
from app.schemas.auth import InviteResponse, LinkResponse
from app.schemas.consent import ConsentResponse
from app.schemas.demo import DemoRunResponse
from app.schemas.domains import Domain
from app.schemas.explain import ExplainResponse
from app.schemas.health import HealthResponse
from app.schemas.market import CareerMarket
from app.schemas.me import MeResponse
from app.schemas.profile import ParentProfile, StudentProfile
from app.schemas.questions import QuestionSet
from app.schemas.responses import ResponsesSaved
from tests.helpers import (
    AS_PARENT,
    AS_STUDENT,
    DATA_SCIENCE_ID,
    PAIR,
    PARENT_PROFILE,
    RESULT_ID,
    STUDENT_PROFILE,
    make_client,
)

FIRST_QUESTION_ID = "a0000000-0000-4000-8000-000000000001"


@dataclass
class Case:
    method: str
    route: str  # the path template FastAPI registered
    url: str
    model: Any
    headers: dict[str, str] | None = None
    body: dict[str, Any] | None = None
    status: int = 200


CASES = [
    Case("GET", "/health", "/health", HealthResponse),
    Case("POST", "/auth/invite", "/auth/invite", InviteResponse, AS_STUDENT, status=201),
    Case("POST", "/auth/link", "/auth/link", LinkResponse, AS_PARENT, {"invite_code": "PRISM-7KQ2M9XA"}),
    Case("GET", "/me", "/me", MeResponse, AS_STUDENT),
    Case("GET", "/me", "/me", MeResponse, AS_PARENT),
    Case("GET", "/profile", "/profile", StudentProfile, AS_STUDENT),
    Case("GET", "/profile", "/profile", ParentProfile, AS_PARENT),
    Case("PUT", "/profile", "/profile", StudentProfile, AS_STUDENT, STUDENT_PROFILE),
    Case("PUT", "/profile", "/profile", ParentProfile, AS_PARENT, PARENT_PROFILE),
    Case("GET", "/domains", "/domains", list[Domain], AS_PARENT),
    Case("GET", "/questions", "/questions?audience=student", QuestionSet, AS_STUDENT),
    Case("GET", "/questions", "/questions?audience=parent", QuestionSet, AS_PARENT),
    Case(
        "POST", "/responses", "/responses", ResponsesSaved, AS_STUDENT,
        {"answers": [{"question_id": FIRST_QUESTION_ID, "value": 4}]},
    ),
    Case("POST", "/consent", "/consent", ConsentResponse, AS_STUDENT, {"agree": True}),
    Case("POST", "/analyze", "/analyze", AnalyzeResponse, AS_STUDENT, PAIR),
    Case("GET", "/results/{result_id}", f"/results/{RESULT_ID}", AnalyzeResponse, AS_PARENT),
    Case(
        "POST", "/explain", "/explain", ExplainResponse, AS_STUDENT,
        {"result_id": RESULT_ID, "career_id": DATA_SCIENCE_ID},
    ),
    Case("GET", "/careers/{career_id}/market", f"/careers/{DATA_SCIENCE_ID}/market", CareerMarket, AS_STUDENT),
    Case("POST", "/demo/run", "/demo/run", DemoRunResponse),
]


def _case_id(case: Case) -> str:
    who = "parent" if case.headers == AS_PARENT else "student" if case.headers == AS_STUDENT else "anon"
    return f"{case.method} {case.url} as {who}"


@pytest.mark.parametrize("case", CASES, ids=_case_id)
def test_route_matches_its_contract(case: Case) -> None:
    response = make_client().request(case.method, case.url, headers=case.headers, json=case.body)
    assert response.status_code == case.status, response.text
    TypeAdapter(case.model).validate_python(response.json())


def test_every_route_has_a_contract_case() -> None:
    registered = {
        (method, route.path)
        for route in make_client().app.routes
        if isinstance(route, APIRoute)
        for method in route.methods
    }
    covered = {(case.method, case.route) for case in CASES}
    assert registered - covered == set(), "add a Case for each new route"


def test_custom_weights_are_accepted_in_mock_mode() -> None:
    body = PAIR | {"weights": {"fit": 0.5, "finance": 0.3, "market": 0.2}}
    response = make_client().post("/analyze", headers=AS_STUDENT, json=body)
    assert response.status_code == 200, response.text


def test_withdrawing_consent() -> None:
    response = make_client().post("/consent", headers=AS_STUDENT, json={"agree": False})
    assert response.json() == {"consented": False, "consented_at": None, "both_consented": False}


def test_partner_name_is_the_other_persons_own_name() -> None:
    client = make_client()
    student = client.get("/me", headers=AS_STUDENT).json()
    parent = client.get("/me", headers=AS_PARENT).json()
    assert student["partner"]["full_name"] == parent["full_name"]
    assert parent["partner"]["full_name"] == student["full_name"]
