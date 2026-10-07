from fastapi import APIRouter

from app import __version__
from app.deps import SettingsDep
from app.errors import error_responses
from app.schemas.health import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse, responses=error_responses(503), summary="Liveness and database check")
def health(settings: SettingsDep) -> HealthResponse:
    # The database check arrives with the first repository (feat/be-B-responses-api).
    return HealthResponse(
        status="ok", database="skipped", mode="mock" if settings.use_mocks else "live", version=__version__
    )
