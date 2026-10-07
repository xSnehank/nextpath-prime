"""Browsers may call the API only from the origins in CORS_ORIGINS."""

from fastapi.testclient import TestClient

from tests.helpers import make_client

ALLOWED = "http://localhost:3000"


def test_preflight_from_an_allowed_origin(client: TestClient) -> None:
    response = client.options(
        "/analyze",
        headers={
            "Origin": ALLOWED,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == ALLOWED


def test_preflight_from_an_unknown_origin_is_refused(client: TestClient) -> None:
    response = client.options(
        "/analyze", headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "POST"}
    )
    assert "access-control-allow-origin" not in response.headers


def test_the_browser_can_read_the_request_id(client: TestClient) -> None:
    response = client.get("/health", headers={"Origin": ALLOWED})
    assert response.headers["access-control-allow-origin"] == ALLOWED
    assert "x-request-id" in response.headers["access-control-expose-headers"].lower()


def test_a_500_still_reaches_the_browser() -> None:
    client = make_client()

    def boom() -> None:
        raise RuntimeError("boom")

    client.app.add_api_route("/boom", boom)
    response = client.get("/boom", headers={"Origin": ALLOWED})
    assert response.status_code == 500
    assert response.headers["access-control-allow-origin"] == ALLOWED
