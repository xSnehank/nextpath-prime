"""Live mode, step 0: the student's Class 11-12 stream decides which careers appear and which come first.

Runs /analyze against the real seeded catalog (db/data via db/scripts/build_catalog.py) for students of each
stream, and checks the rules rather than particular careers:
- every roadmap career follows the student's stream (each stream has at least 5 careers of its own, so open
  careers never reach the top 5),
- no career the student can't enter appears at all (a PCB student never sees a B.Tech-only career),
- the colleges shown are ones the student's stream naturally leads to, at most 4 per tier, tiers in order,
- the cost is based on a typical college the student can enter.
"""

from typing import Any
from uuid import UUID

import pytest
from sqlalchemy import text

from app.db import engine_for
from app.schemas.analyze import AnalyzeResponse
from tests.helpers import PARENT_PROFILE, STUDENT_PROFILE, assert_analyze_invariants
from tests.live import as_user, live_client, sign_up


def _rows(db_url: str, sql: str, **params: Any) -> list[Any]:
    with engine_for(db_url).connect() as conn:
        return list(conn.execute(text(sql), params))


def _analysis_for(db_url: str, stream: str) -> AnalyzeResponse:
    client = live_client(db_url)
    student, parent = sign_up(db_url, "student", f"S {stream}"), sign_up(db_url, "parent", f"P {stream}")
    code = client.post("/auth/invite", headers=as_user(student)).json()["invite_code"]
    client.post("/auth/link", headers=as_user(parent), json={"invite_code": code})
    questions = client.get("/questions?audience=student", headers=as_user(student)).json()["questions"]
    answers = [{"question_id": q["id"], "value": 1 + i % len(q["options"])} for i, q in enumerate(questions)]
    client.post("/responses", headers=as_user(student), json={"answers": answers})
    saved = client.put("/profile", headers=as_user(student), json=STUDENT_PROFILE | {"stream": stream})
    assert saved.status_code == 200, saved.text
    client.put("/profile", headers=as_user(parent), json=PARENT_PROFILE)
    for user in (student, parent):
        client.post("/consent", headers=as_user(user), json={"agree": True})
    response = client.post(
        "/analyze", headers=as_user(student), json={"student_id": str(student), "parent_id": str(parent)}
    )
    assert response.status_code == 200, response.text
    result = AnalyzeResponse.model_validate(response.json())
    assert_analyze_invariants(result)
    return result


def _careers_with(db_url: str, column: str, stream: str) -> set[str]:
    """Careers with at least one course whose `column` (eligible_streams / primary_streams) lists the stream."""
    return {
        r.name for r in _rows(
            db_url,
            f"SELECT DISTINCT c.name FROM careers c JOIN courses co ON co.career_id = c.id "
            f"WHERE :s = ANY (co.{column}::text[])",
            s=stream,
        )
    }


def _natural_courses(db_url: str, stream: str) -> set[str]:
    return {r.name for r in _rows(db_url, "SELECT name FROM courses WHERE :s = ANY (primary_streams::text[])", s=stream)}


@pytest.mark.parametrize("stream", ["science_pcm", "science_pcb", "science_pcmb", "commerce_maths", "commerce", "arts"])
def test_the_roadmap_follows_the_students_stream(db_url: str, stream: str) -> None:
    result = _analysis_for(db_url, stream)
    own = _careers_with(db_url, "primary_streams", stream)
    natural_courses = _natural_courses(db_url, stream)
    assert len(result.roadmap) == 5
    for item in result.roadmap:
        assert item.stream_match == "natural", f"{item.career} is not a {stream} career"
        assert item.career in own
        assert item.path.typical_college
        tiers = [c.tier for c in item.path.colleges]
        order = {1: 0, 2: 1, 3: 2, None: 3}
        assert tiers == sorted(tiers, key=order.__getitem__), f"{item.career}: tiers out of order"
        assert all(tiers.count(t) <= 4 for t in set(tiers)), f"{item.career}: more than 4 colleges in a tier"
        assert {c.course for c in item.path.colleges} <= natural_courses, f"{item.career}: a college outside {stream}"


def test_a_pcm_student_never_gets_commerce_or_arts_careers_on_top(db_url: str) -> None:
    result = _analysis_for(db_url, "science_pcm")
    commerce_or_arts_only = {"Chartered Accountant (CA)", "Company Secretary", "Cost Accountant (CMA)",
                             "Marketing Manager", "HR Manager", "Business Analyst", "Corporate Lawyer", "Journalist"}
    assert not {item.career for item in result.roadmap} & commerce_or_arts_only


def test_a_pcb_student_never_sees_a_career_they_cant_enter(db_url: str) -> None:
    result = _analysis_for(db_url, "science_pcb")
    open_to_pcb = _careers_with(db_url, "eligible_streams", "science_pcb")
    shown = {item.career for item in result.roadmap} | {c.career for c in result.rejected}
    assert shown <= open_to_pcb
    assert "Electrical Engineer" not in shown  # B.Tech only: needs Physics and Mathematics


def test_an_undecided_student_keeps_every_career(db_url: str) -> None:
    result = _analysis_for(db_url, "undecided")
    assert all(item.stream_match == "natural" for item in result.roadmap)


@pytest.mark.parametrize("stream", ["science_pcm", "science_pcb"])
def test_the_cost_is_based_on_a_route_the_student_can_take(db_url: str, stream: str) -> None:
    # The pick itself (lower median, preferring the student's state) is unit-tested in test_core_streams.py.
    result = _analysis_for(db_url, stream)
    for item in result.roadmap:
        routes = _rows(
            db_url,
            "SELECT ec.college FROM exams_colleges ec JOIN courses co ON co.id = ec.course_id "
            "WHERE co.career_id = :career AND :s = ANY (co.primary_streams::text[])",
            career=item.career_id, s=stream,
        )
        assert item.path.typical_college in {r.college for r in routes}, item.career


def test_stream_is_required_for_a_student_profile(db_url: str) -> None:
    client = live_client(db_url)
    student = sign_up(db_url, "student", "No stream")
    body = {k: v for k, v in STUDENT_PROFILE.items() if k != "stream"}
    assert client.put("/profile", headers=as_user(student), json=body).status_code == 422
    assert client.put("/profile", headers=as_user(student), json=STUDENT_PROFILE | {"stream": "PCM"}).status_code == 422
    saved = client.put("/profile", headers=as_user(student), json=STUDENT_PROFILE | {"stream": "arts"})
    assert saved.status_code == 200
    assert client.get("/profile", headers=as_user(student)).json()["stream"] == "arts"
    row = _rows(db_url, "SELECT stream FROM profiles WHERE user_id = :u", u=UUID(str(student)))[0]
    assert row.stream == "arts"
