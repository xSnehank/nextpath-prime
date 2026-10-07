from fastapi import APIRouter

from app import mocks
from app.db import ConnDep
from app.deps import CurrentUserDep, SettingsDep
from app.errors import AppError, error_responses
from app.repositories import pairs
from app.schemas.analyze import AnalyzeRequest, AnalyzeResponse
from app.schemas.common import ErrorCode
from app.services import analysis

router = APIRouter(tags=["analysis"])


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    responses=error_responses(401, 403, 409, 422, 503),
    summary="Run the whole pipeline for a linked pair and return the roadmap",
)
def analyze(body: AnalyzeRequest, user: CurrentUserDep, settings: SettingsDep, conn: ConnDep) -> AnalyzeResponse:
    """Needs both assessments finished (409 ASSESSMENT_INCOMPLETE) and both consents (409 CONSENT_REQUIRED).
    Mock mode returns the saved demo result."""
    if settings.use_mocks:
        if (body.student_id, body.parent_id) != (mocks.MOCK_STUDENT_ID, mocks.MOCK_PARENT_ID):
            raise AppError(ErrorCode.FORBIDDEN, "You can only analyse your own linked pair (ids from GET /me).")
        return mocks.load("analyze", AnalyzeResponse)
    pair = pairs.get_pair(conn, user.id)
    if pair is None or (pair.student_id, pair.parent_id) != (body.student_id, body.parent_id):
        raise AppError(ErrorCode.FORBIDDEN, "You can only analyse your own linked pair (ids from GET /me).")
    analysis.require_ready(conn, pair.student_id, pair.parent_id)
    return analysis.run(conn, pair.student_id, pair.parent_id, body.weights)
