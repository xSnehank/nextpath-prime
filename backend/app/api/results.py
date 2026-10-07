from uuid import UUID

from fastapi import APIRouter

from app import mocks
from app.deps import CurrentUserDep, SettingsDep
from app.errors import AppError, error_responses, not_implemented
from app.schemas.analyze import AnalyzeResponse
from app.schemas.common import ErrorCode

router = APIRouter(tags=["analysis"])


@router.get(
    "/results/{result_id}",
    response_model=AnalyzeResponse,
    responses=error_responses(401, 403, 404, 422),
    summary="A saved roadmap",
)
def get_result(result_id: UUID, _user: CurrentUserDep, settings: SettingsDep) -> AnalyzeResponse:
    if settings.use_mocks:
        if result_id != mocks.MOCK_RESULT_ID:
            raise AppError(ErrorCode.NOT_FOUND, "No result with this id.")
        return mocks.load("analyze", AnalyzeResponse)
    raise not_implemented("feat/be-E1-E2-roadmap-endpoint")
