import pytest
from pydantic import ValidationError

from app.config import Settings


def test_auth_bypass_is_refused_in_production() -> None:
    with pytest.raises(ValidationError, match="DEV_AUTH_BYPASS"):
        Settings(_env_file=None, environment="production", dev_auth_bypass=True)


def test_auth_bypass_is_allowed_in_development() -> None:
    assert Settings(_env_file=None, environment="development", dev_auth_bypass=True).dev_auth_bypass


def test_cors_origins_are_split_and_trimmed() -> None:
    settings = Settings(_env_file=None, cors_origins=" http://localhost:3000 , https://prism.vercel.app,, ")
    assert settings.cors_origin_list == ["http://localhost:3000", "https://prism.vercel.app"]


def test_secrets_are_hidden_when_printed() -> None:
    settings = Settings(
        _env_file=None, gemini_api_key="AIza-very-secret", database_url="postgresql://user:pw-secret@host/db"
    )
    assert "very-secret" not in repr(settings)
    assert "pw-secret" not in str(settings)
    assert settings.gemini_api_key is not None and settings.gemini_api_key.get_secret_value() == "AIza-very-secret"


def test_live_mode_refuses_to_start_without_its_settings() -> None:
    with pytest.raises(ValidationError, match="DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY"):
        Settings(_env_file=None, use_mocks=False)
