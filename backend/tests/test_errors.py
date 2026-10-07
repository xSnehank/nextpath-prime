"""Every failure uses the one error shape and never echoes what the user sent."""

from uuid import uuid4

from fastapi.testclient import TestClient

from tests.helpers import (
    AS_PARENT,
    AS_STUDENT,
    DATA_SCIENCE_ID,
    PAIR,
    PARENT_PROFILE,
    RESULT_ID,
    STUDENT_PROFILE,
    assert_error,
    make_client,
)


def test_unknown_route(client: TestClient) -> None:
    assert_error(client.get("/nope"), 404, "NOT_FOUND")


def test_wrong_method(client: TestClient) -> None:
    response = client.delete("/health")
    assert_error(response, 405, "METHOD_NOT_ALLOWED")
    assert response.headers["allow"] == "GET"


def test_validation_error_lists_fields_but_never_echoes_values(client: TestClient) -> None:
    response = client.put("/profile", headers=AS_PARENT, json=PARENT_PROFILE | {"savings": -987654321})
    details = assert_error(response, 422, "VALIDATION_ERROR")
    assert [f["field"] for f in details["fields"]] == ["savings"]  # the union's role tag is dropped
    assert details["fields"][0]["location"] == "body"
    assert "987654321" not in response.text


def test_unknown_fields_are_rejected(client: TestClient) -> None:
    details = assert_error(client.post("/consent", json={"agree": True, "agre": True}), 422, "VALIDATION_ERROR")
    assert [f["field"] for f in details["fields"]] == ["agre"]


def test_answer_outside_1_to_5(client: TestClient) -> None:
    body = {"answers": [{"question_id": "a0000000-0000-4000-8000-000000000001", "value": 7}]}
    details = assert_error(client.post("/responses", json=body), 422, "VALIDATION_ERROR")
    assert [f["field"] for f in details["fields"]] == ["answers.0.value"]


def test_unknown_question_id(client: TestClient) -> None:
    body = {"answers": [{"question_id": str(uuid4()), "value": 3}]}
    details = assert_error(client.post("/responses", json=body), 422, "VALIDATION_ERROR")
    assert details["unknown_question_ids"] == [body["answers"][0]["question_id"]]


def test_parents_answer_no_questions(client: TestClient) -> None:
    body = {"answers": [{"question_id": "a0000000-0000-4000-8000-000000000001", "value": 3}]}
    assert_error(client.post("/responses", headers=AS_PARENT, json=body), 422, "VALIDATION_ERROR")


def test_bad_query_parameter(client: TestClient) -> None:
    details = assert_error(client.get("/questions?audience=teacher"), 422, "VALIDATION_ERROR")
    assert details["fields"][0]["location"] == "query"


def test_any_problem_with_weights_is_invalid_weights(client: TestClient) -> None:
    body = PAIR | {"weights": {"fit": -0.1, "finance": 0.6, "market": 0.5}}
    details = assert_error(client.post("/analyze", json=body), 422, "INVALID_WEIGHTS")
    assert details["fields"][0]["field"] == "weights.fit"


def test_wrong_role_is_forbidden(client: TestClient) -> None:
    assert_error(client.post("/auth/invite", headers=AS_PARENT), 403, "FORBIDDEN")
    assert_error(client.post("/auth/link", headers=AS_STUDENT, json={"invite_code": "PRISM-7KQ2M9XA"}), 403, "FORBIDDEN")
    assert_error(client.put("/profile", headers=AS_PARENT, json=STUDENT_PROFILE), 403, "FORBIDDEN")


def test_unknown_mock_user_is_unauthenticated(client: TestClient) -> None:
    assert_error(client.get("/me", headers={"X-Dev-User": str(uuid4())}), 401, "UNAUTHENTICATED")
    assert_error(client.get("/me", headers={"X-Dev-User": "not-a-uuid"}), 401, "UNAUTHENTICATED")


def test_unknown_ids_are_not_found(client: TestClient) -> None:
    assert_error(client.get(f"/results/{uuid4()}"), 404, "NOT_FOUND")
    assert_error(client.get(f"/careers/{uuid4()}/market"), 404, "NOT_FOUND")
    assert_error(client.post("/explain", json={"result_id": RESULT_ID, "career_id": str(uuid4())}), 404, "NOT_FOUND")
    assert_error(client.post("/explain", json={"result_id": str(uuid4()), "career_id": DATA_SCIENCE_ID}), 404, "NOT_FOUND")


def test_analysing_someone_elses_pair_is_forbidden(client: TestClient) -> None:
    body = PAIR | {"parent_id": str(uuid4())}
    assert_error(client.post("/analyze", json=body), 403, "FORBIDDEN")


def test_parent_profile_needs_three_different_known_domains(client: TestClient) -> None:
    same = PARENT_PROFILE | {"top_domain_ids": [PARENT_PROFILE["top_domain_ids"][0]] * 3}
    assert_error(client.put("/profile", headers=AS_PARENT, json=same), 422, "VALIDATION_ERROR")
    unknown = PARENT_PROFILE | {"top_domain_ids": [str(uuid4()) for _ in range(3)]}
    details = assert_error(client.put("/profile", headers=AS_PARENT, json=unknown), 422, "VALIDATION_ERROR")
    assert len(details["unknown_domain_ids"]) == 3


def test_demo_disabled_looks_like_a_missing_route() -> None:
    assert_error(make_client(demo_enabled=False).post("/demo/run"), 404, "NOT_FOUND")


def test_unexpected_error_is_a_clean_500() -> None:
    client = make_client()

    def boom() -> None:
        raise RuntimeError("income=1234567 secret")

    client.app.add_api_route("/boom", boom)
    response = client.get("/boom")
    assert_error(response, 500, "INTERNAL_ERROR")
    assert "1234567" not in response.text
    assert "Traceback" not in response.text
