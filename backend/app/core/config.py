from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    jwt_secret_key: str
    jwt_access_token_expire_minutes: int = 60
    database_url: str = "sqlite:///./stylehub.db"
    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_currency: str = "inr"
    frontend_url: str = "http://localhost:5173"
    backend_cors_origins: str = "http://localhost:5173"
    vite_api_base_url: str = "http://localhost:8000/api/v1"
    vite_stripe_publishable_key: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def stripe_configured(self) -> bool:
        key = self.stripe_secret_key
        return key.startswith("sk_") and "replace" not in key

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
