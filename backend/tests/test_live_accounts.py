"""Live mode against a real PostgreSQL: sign-in, linking, profiles, questions, answers and consent."""

from typing import Any
from uuid import UUID

import httpx
import pytest

from app.schemas.me import MeResponse
from app.schemas.questions import QuestionSet
from app.services import supabase_auth
from tests.helpers import DOMAIN_IDS, PARENT_PROFILE, STUDENT_PROFILE, assert_error
from tests.live import as_user, live_client, run_sql, sign_up


def _link(client: Any, student: UUID, parent: UUID) -> dict[str, Any]:
    code = client.post("/auth/invite", headers=as_user(student)).json()["invite_code"]
    response = client.post("/auth/link", headers=as_user(parent), json={"invite_code": code})
    assert response.status_code == 200, response.text
    return response.json()


def _answer_everything(client: Any, student: UUID) -> None:
    questions = client.get("/questions?audience=student", headers=as_user(student)).json()["questions"]
    answers = [{"question_id": q["id"], "value": 1} for q in questions]
    assert client.post("/responses", headers=as_user(student), json={"answers": answers}).status_code == 200


# ---------- who is calling ----------


def test_a_new_student_sees_an_empty_me(db_url: str) -> None:
    student = sign_up(db_url, "student", "Asha")
    me = MeResponse.model_validate(live_client(db_url).get("/me", headers=as_user(student)).json())
    assert (me.role, me.full_name, me.pair, me.partner, me.latest_result_id) == ("student", "Asha", None, None, None)
    assert me.progress.questions_answered == 0 and me.progress.questions_required == 33
    assert not me.progress.profile_complete and not me.consented


def test_no_token_is_401(db_url: str) -> None:
    assert_error(live_client(db_url).get("/me"), 401, "UNAUTHENTICATED")


def test_a_supabase_token_is_checked_with_supabase(db_url: str, monkeypatch: pytest.MonkeyPatch) -> None:
    student = sign_up(db_url, "student")
    calls: list[str] = []

    def fake_supabase(token: str, settings: Any) -> httpx.Response:
        calls.append(token)
        if token == "good-token":
            return httpx.Response(200, json={"id": str(student)})
        return httpx.Response(401, json={"msg": "invalid JWT"})

    monkeypatch.setattr(supabase_auth, "fetch_supabase_user", fake_supabase)
    supabase_auth._cache.clear()
    client = live_client(db_url, dev_auth_bypass=False)
    for _ in range(2):
        response = client.get("/me", headers={"Authorization": "Bearer good-token"})
        assert response.status_code == 200 and response.json()["user_id"] == str(student)
    assert calls == ["good-token"], "the second call is answered from the cache"
    assert_error(client.get("/me", headers={"Authorization": "Bearer bad-token"}), 401, "UNAUTHENTICATED")


def test_x_dev_user_is_ignored_without_the_bypass(db_url: str) -> None:
    student = sign_up(db_url, "student")
    assert_error(live_client(db_url, dev_auth_bypass=False).get("/me", headers=as_user(student)), 401, "UNAUTHENTICATED")


def test_the_database_being_down_is_a_clean_503(db_url: str) -> None:
    client = live_client("postgresql://postgres@127.0.0.1:1/nowhere")
    assert_error(client.get("/domains", headers=as_user(UUID(int=1))), 503, "UPSTREAM_UNAVAILABLE")


def test_health_checks_the_database(db_url: str) -> None:
    assert live_client(db_url).get("/health").json() | {"version": "x"} == {
        "status": "ok", "database": "ok", "mode": "live", "version": "x"
    }


# ---------- invites and linking ----------


def test_invite_and_link(db_url: str) -> None:
    client = live_client(db_url)
    student, parent = sign_up(db_url, "student", "Asha"), sign_up(db_url, "parent", "Ravi")
    invite = client.post("/auth/invite", headers=as_user(student))
    assert invite.status_code == 201
    code = invite.json()["invite_code"]
    assert code.startswith("PRISM-") and len(code) == 14

    linked = client.post("/auth/link", headers=as_user(parent), json={"invite_code": code.lower()}).json()
    assert (linked["student_id"], linked["parent_id"]) == (str(student), str(parent))

    student_me = client.get("/me", headers=as_user(student)).json()
    parent_me = client.get("/me", headers=as_user(parent)).json()
    assert student_me["pair"] == parent_me["pair"] == {"student_id": str(student), "parent_id": str(parent)}
    assert student_me["partner"]["full_name"] == "Ravi" and parent_me["partner"]["full_name"] == "Asha"

    other_parent = sign_up(db_url, "parent")
    assert_error(client.post("/auth/link", headers=as_user(other_parent), json={"invite_code": code}), 404, "NOT_FOUND")
    assert_error(client.post("/auth/invite", headers=as_user(student)), 403, "FORBIDDEN")


def test_only_the_newest_unexpired_code_works(db_url: str) -> None:
    client = live_client(db_url)
    student, parent = sign_up(db_url, "student"), sign_up(db_url, "parent")
    first = client.post("/auth/invite", headers=as_user(student)).json()["invite_code"]
    second = client.post("/auth/invite", headers=as_user(student)).json()["invite_code"]
    assert_error(client.post("/auth/link", headers=as_user(parent), json={"invite_code": first}), 404, "NOT_FOUND")
    run_sql(db_url, "UPDATE invites SET expires_at = now() - interval '1 minute' WHERE student_id = :id", id=student)
    assert_error(client.post("/auth/link", headers=as_user(parent), json={"invite_code": second}), 404, "NOT_FOUND")


def test_roles_are_enforced(db_url: str) -> None:
    client = live_client(db_url)
    student, parent = sign_up(db_url, "student"), sign_up(db_url, "parent")
    assert_error(client.post("/auth/invite", headers=as_user(parent)), 403, "FORBIDDEN")
    assert_error(client.post("/auth/link", headers=as_user(student), json={"invite_code": "PRISM-AAAAAAAA"}), 403, "FORBIDDEN")


def test_a_linked_parent_cannot_link_again(db_url: str) -> None:
    client = live_client(db_url)
    parent = sign_up(db_url, "parent")
    _link(client, sign_up(db_url, "student"), parent)
    code = client.post("/auth/invite", headers=as_user(sign_up(db_url, "student"))).json()["invite_code"]
    assert_error(client.post("/auth/link", headers=as_user(parent), json={"invite_code": code}), 403, "FORBIDDEN")


# ---------- profiles ----------


def test_student_profile_round_trip(db_url: str) -> None:
    client = live_client(db_url)
    student = sign_up(db_url, "student")
    assert_error(client.get("/profile", headers=as_user(student)), 404, "NOT_FOUND")
    saved = STUDENT_PROFILE | {"category": "obc", "percentage": 88.5, "gender": "female"}
    assert client.put("/profile", headers=as_user(student), json=saved).status_code == 200
    assert client.get("/profile", headers=as_user(student)).json() == saved
    assert client.get("/me", headers=as_user(student)).json()["progress"]["profile_complete"]


def test_parent_profile_round_trip_keeps_the_domain_order(db_url: str) -> None:
    client = live_client(db_url)
    parent = sign_up(db_url, "parent")
    assert client.put("/profile", headers=as_user(parent), json=PARENT_PROFILE).status_code == 200
    assert client.get("/profile", headers=as_user(parent)).json() == PARENT_PROFILE
    reordered = PARENT_PROFILE | {"top_domain_ids": list(reversed(DOMAIN_IDS))}
    client.put("/profile", headers=as_user(parent), json=reordered)
    assert client.get("/profile", headers=as_user(parent)).json()["top_domain_ids"] == list(reversed(DOMAIN_IDS))
    me = client.get("/me", headers=as_user(parent)).json()
    assert me["progress"] == {
        "questions_answered": 0, "questions_required": 0, "profile_complete": True, "assessment_complete": True
    }


def test_profile_errors(db_url: str) -> None:
    client = live_client(db_url)
    parent = sign_up(db_url, "parent")
    unknown = PARENT_PROFILE | {"top_domain_ids": [*DOMAIN_IDS[:2], "d0000000-0000-4000-8000-000000000099"]}
    details = assert_error(client.put("/profile", headers=as_user(parent), json=unknown), 422, "VALIDATION_ERROR")
    assert details["unknown_domain_ids"] == ["d0000000-0000-4000-8000-000000000099"]
    assert_error(client.put("/profile", headers=as_user(parent), json=STUDENT_PROFILE), 403, "FORBIDDEN")
    bad = PARENT_PROFILE | {"risk_appetite": 9}
    details = assert_error(client.put("/profile", headers=as_user(parent), json=bad), 422, "VALIDATION_ERROR")
    assert [f["field"] for f in details["fields"]] == ["risk_appetite"], "no 'parent.' prefix: it matches the form field"


# ---------- questions and answers ----------


def test_questions_come_from_the_database_without_the_answer_key(db_url: str) -> None:
    client = live_client(db_url)
    student = sign_up(db_url, "student")
    response = client.get("/questions?audience=student", headers=as_user(student))
    bank = QuestionSet.model_validate(response.json())
    assert len(bank.questions) == 33
    assert sum(q.kind == "choice" for q in bank.questions) == 10
    assert "correct" not in response.text and "reverse" not in response.text
    parents = client.get("/questions?audience=parent", headers=as_user(student)).json()
    assert parents == {"audience": "parent", "questions": []}


def test_answers_are_validated_saved_and_overwritten(db_url: str) -> None:
    client = live_client(db_url)
    student = sign_up(db_url, "student")
    questions = client.get("/questions?audience=student", headers=as_user(student)).json()["questions"]
    choice = next(q for q in questions if q["kind"] == "choice")
    likert = next(q for q in questions if q["kind"] == "likert")

    details = assert_error(
        client.post("/responses", headers=as_user(student), json={"answers": [{"question_id": choice["id"], "value": 5}]}),
        422,
        "VALIDATION_ERROR",
    )
    assert details["invalid_question_ids"] == [choice["id"]], "a 4-option question has no option 5"
    unknown = {"answers": [{"question_id": "00000000-0000-4000-8000-000000000000", "value": 3}]}
    assert_error(client.post("/responses", headers=as_user(student), json=unknown), 422, "VALIDATION_ERROR")

    first = {"answers": [{"question_id": likert["id"], "value": 2}, {"question_id": choice["id"], "value": 1}]}
    assert client.post("/responses", headers=as_user(student), json=first).json() == {
        "saved": 2, "answered": 2, "required": 33, "complete": False
    }
    again = {"answers": [{"question_id": likert["id"], "value": 5}]}
    assert client.post("/responses", headers=as_user(student), json=again).json()["answered"] == 2

    _answer_everything(client, student)
    me = client.get("/me", headers=as_user(student)).json()
    assert me["progress"]["questions_answered"] == 33
    assert not me["progress"]["assessment_complete"], "the profile isn't saved yet"
    client.put("/profile", headers=as_user(student), json=STUDENT_PROFILE)
    assert client.get("/me", headers=as_user(student)).json()["progress"]["assessment_complete"]


# ---------- consent ----------


def test_consent_needs_both_people(db_url: str) -> None:
    client = live_client(db_url)
    student, parent = sign_up(db_url, "student"), sign_up(db_url, "parent")
    _link(client, student, parent)

    mine = client.post("/consent", headers=as_user(student), json={"agree": True}).json()
    assert mine["consented"] and mine["consented_at"] and not mine["both_consented"]
    theirs = client.post("/consent", headers=as_user(parent), json={"agree": True}).json()
    assert theirs["both_consented"]
    assert client.get("/me", headers=as_user(student)).json()["partner"]["consented"]

    withdrawn = client.post("/consent", headers=as_user(student), json={"agree": False}).json()
    assert withdrawn == {"consented": False, "consented_at": None, "both_consented": False}
    assert not client.get("/me", headers=as_user(parent)).json()["partner"]["consented"]
