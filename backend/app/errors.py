"""One error shape for the whole API: {"error": {"code", "message", "details"}}.

Raise AppError anywhere. The handlers below turn it, and FastAPI's own validation,
404 and 405 errors, into that shape. Submitted values are never echoed back or
logged, because they can be incomes or answers.
"""

import logging
from collections.abc import Sequence
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError, ResponseValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.schemas.common import ErrorBody, ErrorCode, ErrorDetail

logger = logging.getLogger("prism.errors")

STATUS: dict[ErrorCode, int] = {
    ErrorCode.UNAUTHENTICATED: 401,
    ErrorCode.FORBIDDEN: 403,
    ErrorCode.NOT_FOUND: 404,
    ErrorCode.METHOD_NOT_ALLOWED: 405,
    ErrorCode.ASSESSMENT_INCOMPLETE: 409,
    ErrorCode.CONSENT_REQUIRED: 409,
    ErrorCode.INVALID_WEIGHTS: 422,
    ErrorCode.VALIDATION_ERROR: 422,
    ErrorCode.INTERNAL_ERROR: 500,
    ErrorCode.NOT_IMPLEMENTED: 501,
    ErrorCode.UPSTREAM_UNAVAILABLE: 503,
}

_DESCRIPTIONS: dict[int, str] = {
    401: "UNAUTHENTICATED: missing or invalid access token",
    403: "FORBIDDEN: signed in, but not allowed to do this",
    404: "NOT_FOUND",
    409: "ASSESSMENT_INCOMPLETE or CONSENT_REQUIRED",
    422: "VALIDATION_ERROR or INVALID_WEIGHTS: details.fields lists what is wrong",
    500: "INTERNAL_ERROR: a bug on our side; quote the X-Request-ID header",
    503: "UPSTREAM_UNAVAILABLE: the database cannot be reached",
}

_HTTP_STATUS_CODES: dict[int, ErrorCode] = {
    401: ErrorCode.UNAUTHENTICATED,
    403: ErrorCode.FORBIDDEN,
    404: ErrorCode.NOT_FOUND,
    405: ErrorCode.METHOD_NOT_ALLOWED,
}

_LOCATIONS = {"body", "query", "path", "header", "cookie"}


class AppError(Exception):
    """An expected failure with a contract error code, e.g. FORBIDDEN or CONSENT_REQUIRED."""

    def __init__(self, code: ErrorCode, message: str, details: dict[str, Any] | None = None) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details or {}


def not_implemented(branch: str) -> AppError:
    """For live mode on endpoints whose real code has not landed yet."""
    return AppError(
        ErrorCode.NOT_IMPLEMENTED,
        f"Only mock mode works here so far; the real version arrives in {branch}.",
        {"branch": branch},
    )


def error_response(
    code: ErrorCode,
    message: str,
    details: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    body = ErrorBody(error=ErrorDetail(code=code, message=message, details=details or {}))
    return JSONResponse(status_code=STATUS[code], content=body.model_dump(mode="json"), headers=headers)


def error_responses(*statuses: int) -> dict[int | str, dict[str, Any]]:
    """OpenAPI documentation for the error statuses a route can return (all use ErrorBody)."""
    return {status: {"model": ErrorBody, "description": _DESCRIPTIONS[status]} for status in statuses}


def _field_errors(errors: Sequence[Any]) -> list[dict[str, Any]]:
    """Where each validation problem is and what is wrong. Never the submitted value."""
    fields = []
    for error in errors:
        loc = list(error.get("loc", ()))
        location = loc.pop(0) if loc and loc[0] in _LOCATIONS else None
        fields.append({"field": ".".join(str(part) for part in loc), "location": location, "issue": error.get("msg", "")})
    return fields


async def _on_app_error(request: Request, exc: AppError) -> JSONResponse:
    return error_response(exc.code, exc.message, exc.details)


async def _on_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = exc.errors()
    weight_errors = [e for e in errors if tuple(e.get("loc", ()))[:2] == ("body", "weights")]
    if weight_errors:
        first = weight_errors[0]
        details: dict[str, Any] = {"fields": _field_errors(weight_errors)}
        if first.get("type") == "invalid_weights":
            details.update(first.get("ctx") or {})
        return error_response(ErrorCode.INVALID_WEIGHTS, first.get("msg", "Invalid weights."), details)
    return error_response(
        ErrorCode.VALIDATION_ERROR, "Some fields are missing or invalid.", {"fields": _field_errors(errors)}
    )


async def _on_http_error(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    code = _HTTP_STATUS_CODES.get(exc.status_code)
    if code is None:
        logger.error("unexpected HTTP %s on %s %s", exc.status_code, request.method, request.url.path)
        return error_response(ErrorCode.INTERNAL_ERROR, "Something went wrong on our side.")
    messages = {
        ErrorCode.NOT_FOUND: "No such endpoint.",
        ErrorCode.METHOD_NOT_ALLOWED: "This endpoint does not support that HTTP method.",
    }
    return error_response(code, messages.get(code, str(exc.detail)), headers=exc.headers)


async def _on_response_validation_error(request: Request, exc: ResponseValidationError) -> JSONResponse:
    # Our own output broke the contract. Log where, never the values.
    problems = "; ".join(f"{'.'.join(map(str, e.get('loc', ())))} ({e.get('type')})" for e in exc.errors())
    logger.error("response broke the contract on %s %s: %s", request.method, request.url.path, problems)
    return error_response(ErrorCode.INTERNAL_ERROR, "Something went wrong on our side.")


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, _on_app_error)
    app.add_exception_handler(RequestValidationError, _on_validation_error)
    app.add_exception_handler(ResponseValidationError, _on_response_validation_error)
    app.add_exception_handler(StarletteHTTPException, _on_http_error)
