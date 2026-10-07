"""Dependencies the routers share: settings, the current user, and role checks."""

from dataclasses import dataclass
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Request, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import Settings, get_settings
from app.db import ConnDep
from app.errors import AppError
from app.mocks import MOCK_PARENT_ID, MOCK_STUDENT_ID
from app.repositories import users
from app.schemas.common import ErrorCode, Role
from app.services import supabase_auth

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
    conn: ConnDep,
) -> CurrentUser:
    """Who is calling.

    Mock mode: the demo student, or the mock user named in the X-Dev-User header.
    Live mode: the Supabase account the bearer token belongs to, which must have a users row. With
    DEV_AUTH_BYPASS=true (local only) an X-Dev-User header naming a users.id is accepted instead.
    """
    user = optional_user(request, settings, credentials, conn)
    if user is None:
        raise AppError(ErrorCode.UNAUTHENTICATED, "Sign in first: send Authorization: Bearer <Supabase access token>.")
    return user


def optional_user(
    request: Request,
    settings: SettingsDep,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Security(bearer_scheme)],
    conn: ConnDep,
) -> CurrentUser | None:
    """Like current_user, but None when nobody is signed in (the demo result is public while DEMO_ENABLED)."""
    dev_user = request.headers.get("X-Dev-User")
    if settings.use_mocks:
        return _mock_user(dev_user)
    if settings.dev_auth_bypass and dev_user:
        user_id = _parse_uuid(dev_user)
    elif credentials is not None:
        user_id = supabase_auth.user_id_for_token(credentials.credentials, settings)
    else:
        return None
    row = users.get_user(conn, user_id) if user_id else None
    if row is None:
        raise AppError(ErrorCode.UNAUTHENTICATED, "This account has no PRISM profile yet. Sign up again or contact us.")
    return CurrentUser(row.id, Role(row.role))


def _parse_uuid(value: str) -> UUID | None:
    try:
        return UUID(value)
    except ValueError:
        return None


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
OptionalUserDep = Annotated[CurrentUser | None, Depends(optional_user)]


def _require(role: Role):
    def check(user: CurrentUserDep) -> CurrentUser:
        if user.role != role:
            raise AppError(ErrorCode.FORBIDDEN, f"Only a {role.value} can do this.")
        return user

    return check


StudentDep = Annotated[CurrentUser, Depends(_require(Role.STUDENT))]
ParentDep = Annotated[CurrentUser, Depends(_require(Role.PARENT))]
