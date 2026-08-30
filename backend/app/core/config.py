from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration lue uniquement depuis l'environnement du serveur."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "ComptaExpert API"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    supabase_url: str = ""
    supabase_publishable_key: str = ""
    mistral_api_key: SecretStr | None = None
    mistral_model: str = "mistral-small-latest"
    cors_origins: str = "http://127.0.0.1:5174,http://localhost:5174"

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
