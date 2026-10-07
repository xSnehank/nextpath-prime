from fastapi import APIRouter

from app import mocks
from app.deps import SettingsDep
from app.errors import AppError, error_responses, not_implemented
from app.schemas.common import ErrorCode
from app.schemas.demo import DemoRunResponse

router = APIRouter(tags=["demo"])


@router.post(
    "/demo/run",
    response_model=DemoRunResponse,
    responses=error_responses(404),
    summary="Load the demo family and return its result id (only when DEMO_ENABLED=true; no login)",
)
def run_demo(settings: SettingsDep) -> DemoRunResponse:
    if not settings.demo_enabled:
        raise AppError(ErrorCode.NOT_FOUND, "No such endpoint.")  # looks like any unknown route
    if settings.use_mocks:
        return mocks.load("demo", DemoRunResponse)
    raise not_implemented("feat/be-E1-E2-roadmap-endpoint")
