from fastapi import APIRouter

from app import mocks
from app.deps import CurrentUserDep, SettingsDep
from app.errors import AppError, error_responses, not_implemented
from app.schemas.common import ErrorCode, Role
from app.schemas.domains import Domain
from app.schemas.profile import ParentProfile, Profile, StudentProfile

router = APIRouter(tags=["profile"])


@router.get("/profile", response_model=Profile, responses=error_responses(401, 404), summary="Your saved profile")
def read_profile(user: CurrentUserDep, settings: SettingsDep) -> ParentProfile | StudentProfile:
    if settings.use_mocks:
        model = ParentProfile if user.role is Role.PARENT else StudentProfile
        return mocks.load(f"profile_{user.role.value}", model)
    raise not_implemented("feat/be-B-responses-api")


@router.put(
    "/profile",
    response_model=Profile,
    responses=error_responses(401, 403, 422),
    summary="Save your profile: a parent's finances and hopes, or a student's preferences",
)
def save_profile(body: Profile, user: CurrentUserDep, settings: SettingsDep) -> ParentProfile | StudentProfile:
    if body.role != user.role:
        raise AppError(ErrorCode.FORBIDDEN, f"You are signed in as a {user.role.value}; send a {user.role.value} profile.")
    if settings.use_mocks:
        if isinstance(body, ParentProfile):
            known = {domain.id for domain in mocks.load("domains", list[Domain])}
            unknown = [str(domain_id) for domain_id in body.top_domain_ids if domain_id not in known]
            if unknown:
                raise AppError(
                    ErrorCode.VALIDATION_ERROR, "Unknown domain id; use ids from GET /domains.", {"unknown_domain_ids": unknown}
                )
        return body
    raise not_implemented("feat/be-B-responses-api")
