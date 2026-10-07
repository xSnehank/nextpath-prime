from fastapi import APIRouter

from app import mocks
from app.deps import CurrentUserDep, SettingsDep
from app.errors import error_responses, not_implemented
from app.schemas.domains import Domain

router = APIRouter(tags=["careers"])


@router.get(
    "/domains",
    response_model=list[Domain],
    responses=error_responses(401),
    summary="Career domains, for the parent's top-3 picker",
)
def list_domains(_user: CurrentUserDep, settings: SettingsDep) -> list[Domain]:
    if settings.use_mocks:
        return mocks.load("domains", list[Domain])
    raise not_implemented("feat/be-B-responses-api")
