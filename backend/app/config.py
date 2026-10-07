"""Settings read from environment variables (and backend/.env when it exists).

Every variable is listed in .env.example. Secrets are SecretStr, so printing the
settings shows '**********' instead of the real value.
"""

from functools import lru_cache
from typing import Literal, Self

from pydantic import SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: Literal["development", "test", "production"] = "development"
    # true = every endpoint answers from app/mocks/*.json; no database needed.
    use_mocks: bool = True
    # Supabase's Postgres connection string (Connect -> Session pooler). Live mode only.
    database_url: SecretStr | None = None
    # The project URL and its public anon (publishable) key: the backend asks Supabase who a token belongs to.
    supabase_url: str | None = None
    supabase_anon_key: str | None = None
    gemini_api_key: SecretStr | None = None
    gemini_model: str | None = None
    explain_mode: Literal["gemini", "template"] = "template"
    # Accept an X-Dev-User header (a users.id) instead of a real token. Local development only.
    dev_auth_bypass: bool = False
    demo_enabled: bool = False
    # Comma-separated browser origins allowed to call the API.
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @model_validator(mode="after")
    def _refuse_auth_bypass_in_production(self) -> Self:
        if self.environment == "production" and self.dev_auth_bypass:
            raise ValueError("DEV_AUTH_BYPASS must be false when ENVIRONMENT=production.")
        return self

    @model_validator(mode="after")
    def _live_mode_needs_the_database_and_supabase(self) -> Self:
        if not self.use_mocks:
            missing = [
                name
                for name, value in (
                    ("DATABASE_URL", self.database_url),
                    ("SUPABASE_URL", self.supabase_url),
                    ("SUPABASE_ANON_KEY", self.supabase_anon_key),
                )
                if not value
            ]
            if missing:
                raise ValueError(f"USE_MOCKS=false needs {', '.join(missing)} (see backend/.env.example).")
        return self


@lru_cache
def get_settings() -> Settings:
    """The settings for this process, read once."""
    return Settings()
