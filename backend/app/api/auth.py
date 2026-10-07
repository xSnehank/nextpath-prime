from datetime import UTC, datetime, timedelta

from fastapi import APIRouter

from app import mocks
from app.deps import ParentDep, SettingsDep, StudentDep
from app.errors import error_responses, not_implemented
from app.schemas.auth import InviteResponse, LinkRequest, LinkResponse

router = APIRouter(prefix="/auth", tags=["auth"])

INVITE_LIFETIME = timedelta(days=7)


@router.post(
    "/invite",
    status_code=201,
    response_model=InviteResponse,
    responses=error_responses(401, 403),
    summary="Student creates an invite code for their parent",
)
def create_invite(user: StudentDep, settings: SettingsDep) -> InviteResponse:
    if settings.use_mocks:
        invite = mocks.load("invite", InviteResponse)
        return invite.model_copy(update={"expires_at": datetime.now(UTC) + INVITE_LIFETIME})
    raise not_implemented("feat/be-A1-A2-auth-linking")


@router.post(
    "/link",
    response_model=LinkResponse,
    responses=error_responses(401, 403, 404, 422),
    summary="Parent redeems the invite code, linking the two accounts",
)
def link_accounts(body: LinkRequest, user: ParentDep, settings: SettingsDep) -> LinkResponse:
    if settings.use_mocks:
        return mocks.load("link", LinkResponse)
    raise not_implemented("feat/be-A1-A2-auth-linking")
