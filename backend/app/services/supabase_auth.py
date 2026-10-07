"""Who does a Supabase access token belong to?

We ask Supabase itself (GET /auth/v1/user). It checks the signature and expiry, and also that the person
hasn't signed out, without us holding any signing secret. Answers are cached for a minute, keyed by a hash
of the token, so a page that makes several API calls costs one round trip. Tokens are never logged.
"""

import hashlib
import time
from uuid import UUID

import httpx

from app.config import Settings
from app.errors import AppError
from app.schemas.common import ErrorCode

CACHE_SECONDS = 60
_cache: dict[str, tuple[UUID, float]] = {}


def fetch_supabase_user(token: str, settings: Settings) -> httpx.Response:
    """One call to Supabase Auth. Tests replace this function."""
    return httpx.get(
        f"{(settings.supabase_url or '').rstrip('/')}/auth/v1/user",
        headers={"apikey": settings.supabase_anon_key or "", "Authorization": f"Bearer {token}"},
        timeout=5,
    )


def user_id_for_token(token: str, settings: Settings) -> UUID:
    key = hashlib.sha256(token.encode()).hexdigest()
    now = time.monotonic()
    cached = _cache.get(key)
    if cached and cached[1] > now:
        return cached[0]

    try:
        response = fetch_supabase_user(token, settings)
    except httpx.HTTPError as error:
        raise AppError(ErrorCode.UPSTREAM_UNAVAILABLE, "The sign-in service can't be reached. Try again.") from error
    if response.status_code in (401, 403):
        raise AppError(ErrorCode.UNAUTHENTICATED, "Your session has expired or is not valid. Sign in again.")
    if response.status_code != 200:
        raise AppError(ErrorCode.UPSTREAM_UNAVAILABLE, "The sign-in service had a problem. Try again.")

    user_id = UUID(response.json()["id"])
    if len(_cache) > 1000:
        _cache.clear()
    _cache[key] = (user_id, now + CACHE_SECONDS)
    return user_id
