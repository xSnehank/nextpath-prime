from uuid import UUID

from fastapi import APIRouter

from app import mocks
from app.db import ConnDep
from app.deps import OptionalUserDep, SettingsDep
from app.errors import AppError, error_responses
from app.schemas.analyze import AnalyzeResponse
from app.schemas.common import ErrorCode
from app.services.access import readable_result

router = APIRouter(tags=["analysis"])


@router.get(
    "/results/{result_id}",
    response_model=AnalyzeResponse,
    responses=error_responses(401, 404, 409, 422),
    summary="A saved roadmap (the demo family's needs no sign-in while DEMO_ENABLED=true)",
)
def get_result(result_id: UUID, user: OptionalUserDep, settings: SettingsDep, conn: ConnDep) -> AnalyzeResponse:
    """Only for the linked pair, and only while both still agree to the comparison (409 CONSENT_REQUIRED)."""
    if settings.use_mocks:
        if result_id != mocks.MOCK_RESULT_ID:
            raise AppError(ErrorCode.NOT_FOUND, "No result with this id.")
        return mocks.load("analyze", AnalyzeResponse)
    return AnalyzeResponse.model_validate(readable_result(conn, settings, user, result_id).response)
