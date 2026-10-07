"""The FastAPI app: middleware, error handlers and routers. No business logic here."""

import logging
import time
from uuid import uuid4

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api import ROUTERS
from app.config import Settings, get_settings
from app.errors import error_response, error_responses, register_exception_handlers
from app.schemas.common import ErrorCode

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("prism.request")

DESCRIPTION = """
Career-guidance API for PRISM Engine (DataQuest 3.0, problem DQNM).

* Send `Authorization: Bearer <Supabase access token>` on every endpoint except `/health` and `/demo/run`.
* Every error has the shape `{"error": {"code", "message", "details"}}`; quote the `X-Request-ID`
  response header when reporting a bug.
* Mock mode (`USE_MOCKS=true`) answers from fixed demo data and needs no token. Act as the demo
  parent by sending `X-Dev-User: 22222222-2222-4222-8222-222222222222`.
"""


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    app = FastAPI(
        title="PRISM Engine API", version=__version__, description=DESCRIPTION, responses=error_responses(500)
    )
    # Routers ask for settings through get_settings; make them all see this app's settings.
    app.dependency_overrides[get_settings] = lambda: settings
    register_exception_handlers(app)

    @app.middleware("http")
    async def request_context(request: Request, call_next) -> Response:
        """Tag each request with an id and log one line: never bodies, query strings or tokens."""
        request_id = uuid4().hex
        started = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            # Caught here (not by FastAPI) so the 500 still passes through CORS and reaches the browser.
            logger.exception("id=%s unhandled error on %s %s", request_id, request.method, request.url.path)
            response = error_response(ErrorCode.INTERNAL_ERROR, "Something went wrong on our side.")
        response.headers["X-Request-ID"] = request_id
        elapsed_ms = (time.perf_counter() - started) * 1000
        logger.info("id=%s %s %s -> %s (%.0f ms)", request_id, request.method, request.url.path, response.status_code, elapsed_ms)
        return response

    # Added last, so it wraps everything above, including the 500 responses.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_methods=["GET", "POST", "PUT", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Dev-User"],
        expose_headers=["X-Request-ID"],
    )

    for router in ROUTERS:
        app.include_router(router)
    return app


app = create_app()
