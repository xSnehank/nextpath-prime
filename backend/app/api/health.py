from fastapi import APIRouter
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app import __version__
from app.db import engine_for
from app.deps import SettingsDep
from app.errors import error_responses
from app.schemas.health import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse, responses=error_responses(503), summary="Liveness and database check")
def health(settings: SettingsDep) -> HealthResponse:
    """Always 200 while the app runs; "database" says whether the database answered (skipped in mock mode)."""
    if settings.use_mocks or settings.database_url is None:
        return HealthResponse(status="ok", database="skipped", mode="mock", version=__version__)
    try:
        with engine_for(settings.database_url.get_secret_value()).connect() as conn:
            conn.execute(text("SELECT 1"))
        database = "ok"
    except SQLAlchemyError:
        database = "unavailable"
    return HealthResponse(status="ok", database=database, mode="live", version=__version__)
