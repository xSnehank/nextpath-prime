"""Dependencies the routers share: settings, the current user, and role checks."""

from dataclasses import dataclass
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Request, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import Settings, get_settings
from app.errors import AppError, not_implemented
from app.mocks import MOCK_PARENT_ID, MOCK_STUDENT_ID
from app.schemas.common import ErrorCode, Role

SettingsDep = Annotated[Settings, Depends(get_settings)]

# Puts "Authorization: Bearer <Supabase access token>" into the OpenAPI contract.
# auto_error=False: a missing token raises our UNAUTHENTICATED error, not FastAPI's own.
bearer_scheme = HTTPBearer(auto_error=False, description="Supabase access token")

MOCK_USERS: dict[UUID, Role] = {MOCK_STUDENT_ID: Role.STUDENT, MOCK_PARENT_ID: Role.PARENT}


@dataclass(frozen=True)
class CurrentUser:
    id: UUID
    role: Role


def current_user(
    request: Request,
    settings: SettingsDep,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Security(bearer_scheme)],
) -> CurrentUser:
    """Who is calling.

    Mock mode: the demo student, or the mock user named in the X-Dev-User header.
    Live mode: Supabase JWT verification arrives in feat/be-A1-A2-auth-linking.
    """
    if settings.use_mocks:
        return _mock_user(request.headers.get("X-Dev-User"))
    raise not_implemented("feat/be-A1-A2-auth-linking")


def _mock_user(header: str | None) -> CurrentUser:
    if header is None:
        return CurrentUser(MOCK_STUDENT_ID, Role.STUDENT)
    try:
        user_id = UUID(header)
    except ValueError:
        user_id = None
    role = MOCK_USERS.get(user_id) if user_id else None
    if user_id is None or role is None:
        raise AppError(
            ErrorCode.UNAUTHENTICATED,
            "Unknown X-Dev-User. In mock mode use the mock student or parent id.",
            {"mock_user_ids": [str(mock_id) for mock_id in MOCK_USERS]},
        )
    return CurrentUser(user_id, role)


CurrentUserDep = Annotated[CurrentUser, Depends(current_user)]


def _require(role: Role):
    def check(user: CurrentUserDep) -> CurrentUser:
        if user.role != role:
            raise AppError(ErrorCode.FORBIDDEN, f"Only a {role.value} can do this.")
        return user

    return check


StudentDep = Annotated[CurrentUser, Depends(_require(Role.STUDENT))]
ParentDep = Annotated[CurrentUser, Depends(_require(Role.PARENT))]
