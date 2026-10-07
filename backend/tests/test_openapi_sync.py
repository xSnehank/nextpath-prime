"""The committed contract must equal what the code generates, and use one error shape."""

import json

from scripts.check_contract import SPEC_PATH, current_spec


def test_committed_spec_is_up_to_date() -> None:
    committed = json.loads(SPEC_PATH.read_text(encoding="utf-8"))
    assert committed == current_spec(), "Run: python scripts/check_contract.py --write"


def test_every_error_response_uses_error_body() -> None:
    spec = current_spec()
    assert "HTTPValidationError" not in spec["components"]["schemas"]
    for path, operations in spec["paths"].items():
        for method, operation in operations.items():
            for status, response in operation["responses"].items():
                if status.startswith(("4", "5")):
                    schema = response["content"]["application/json"]["schema"]
                    assert schema == {"$ref": "#/components/schemas/ErrorBody"}, (method, path, status)


def test_only_health_demo_and_market_data_are_public() -> None:
    spec = current_spec()
    public = {
        (method.upper(), path)
        for path, operations in spec["paths"].items()
        for method, operation in operations.items()
        if "security" not in operation
    }
    assert public == {("GET", "/health"), ("POST", "/demo/run"), ("GET", "/careers/{career_id}/market")}
