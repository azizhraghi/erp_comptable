from functools import lru_cache

from pydantic import AliasChoices, Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration lue uniquement depuis l'environnement du serveur."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "ComptaExpert API"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    # Les alias VITE_* facilitent la reprise de la configuration locale du
    # frontend. Les noms sans VITE_ restent ceux à utiliser en production.
    supabase_url: str = Field(
        default="", validation_alias=AliasChoices("SUPABASE_URL", "VITE_SUPABASE_URL")
    )
    supabase_publishable_key: str = Field(
        default="",
        validation_alias=AliasChoices(
            "SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_ANON_KEY"
        ),
    )
    mistral_api_key: SecretStr | None = None
    mistral_model: str = "mistral-small-latest"
    cors_origins: str = "http://127.0.0.1:5174,http://localhost:5174"

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
