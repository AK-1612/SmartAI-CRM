from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI CRM"
    environment: str = "development"
    database_url: str = "sqlite:///./crm.db"
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    cors_origins: str = "http://localhost:5173"
    storage_path: str = "storage"
    model_path: str = "../ml/artifacts/model.pkl"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        return [value.strip() for value in self.cors_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
