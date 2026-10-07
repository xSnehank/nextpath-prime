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
    database_url: SecretStr | None = None
    supabase_jwt_secret: SecretStr | None = None
    gemini_api_key: SecretStr | None = None
    gemini_model: str | None = None
    explain_mode: Literal["gemini", "template"] = "template"
    # Accept an X-Dev-User header instead of a real token. Local development only.
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


@lru_cache
def get_settings() -> Settings:
    """The settings for this process, read once."""
    return Settings()
