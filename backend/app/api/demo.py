from fastapi import APIRouter

from app import mocks
from app.db import ConnDep
from app.deps import SettingsDep
from app.errors import AppError, error_responses
from app.repositories import users
from app.schemas.common import DEFAULT_WEIGHTS, ErrorCode
from app.schemas.demo import DemoRunResponse
from app.services import analysis
from app.services.demo import DEMO_PARENT_ID, DEMO_STUDENT_ID

router = APIRouter(tags=["demo"])


@router.post(
    "/demo/run",
    response_model=DemoRunResponse,
    responses=error_responses(404, 503),
    summary="Load the demo family and return its result id (only when DEMO_ENABLED=true; no login)",
)
def run_demo(settings: SettingsDep, conn: ConnDep) -> DemoRunResponse:
    """Runs the full analysis for the seeded demo family with the default weights."""
    if not settings.demo_enabled:
        raise AppError(ErrorCode.NOT_FOUND, "No such endpoint.")  # looks like any unknown route
    if settings.use_mocks:
        return mocks.load("demo", DemoRunResponse)
    if users.get_user(conn, DEMO_STUDENT_ID) is None or users.get_user(conn, DEMO_PARENT_ID) is None:
        raise AppError(ErrorCode.NOT_FOUND, "The demo family isn't loaded (db/seed/03_demo_family.sql).")
    analysis.require_ready(conn, DEMO_STUDENT_ID, DEMO_PARENT_ID)
    result = analysis.run(conn, DEMO_STUDENT_ID, DEMO_PARENT_ID, DEFAULT_WEIGHTS)
    return DemoRunResponse(result_id=result.result_id, student_id=DEMO_STUDENT_ID, parent_id=DEMO_PARENT_ID)
