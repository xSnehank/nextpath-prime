from fastapi import APIRouter

from app import mocks
from app.deps import CurrentUserDep, SettingsDep
from app.errors import error_responses, not_implemented
from app.schemas.me import MeResponse

router = APIRouter(tags=["me"])


@router.get(
    "/me",
    response_model=MeResponse,
    responses=error_responses(401),
    summary="Who am I: role, linked pair, progress and consent flags",
)
def read_me(user: CurrentUserDep, settings: SettingsDep) -> MeResponse:
    if settings.use_mocks:
        return mocks.load(f"me_{user.role.value}", MeResponse)
    raise not_implemented("feat/be-A1-A2-auth-linking")
