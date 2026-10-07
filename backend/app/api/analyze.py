from fastapi import APIRouter

from app import mocks
from app.deps import CurrentUserDep, SettingsDep
from app.errors import AppError, error_responses, not_implemented
from app.schemas.analyze import AnalyzeRequest, AnalyzeResponse
from app.schemas.common import ErrorCode

router = APIRouter(tags=["analysis"])


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    responses=error_responses(401, 403, 409, 422),
    summary="Run the whole pipeline for a linked pair and return the roadmap",
)
def analyze(body: AnalyzeRequest, _user: CurrentUserDep, settings: SettingsDep) -> AnalyzeResponse:
    """Mock mode returns the saved demo result. Custom weights are validated
    but only change the ranking once feat/be-E1-E2-roadmap-endpoint lands."""
    if settings.use_mocks:
        if (body.student_id, body.parent_id) != (mocks.MOCK_STUDENT_ID, mocks.MOCK_PARENT_ID):
            raise AppError(ErrorCode.FORBIDDEN, "You can only analyse your own linked pair (ids from GET /me).")
        return mocks.load("analyze", AnalyzeResponse)
    raise not_implemented("feat/be-E1-E2-roadmap-endpoint")
