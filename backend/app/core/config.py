import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI CRM"
    environment: str = "development"
    database_url: str = ""
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    cors_origins: str = "http://localhost:5173"
    storage_path: str = "storage"
    model_path: str = "../ml/artifacts/model.pkl"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def db_url(self) -> str:
        url = os.getenv("DATABASE_URL") or self.database_url
        if url:
            return url
        pg_user = os.getenv("POSTGRES_USER", "smart_ai_crm")
        pg_password = os.getenv("POSTGRES_PASSWORD", "smart_ai_crm")
        pg_host = os.getenv("POSTGRES_HOST", "localhost")
        pg_port = os.getenv("POSTGRES_PORT", "5432")
        pg_db = os.getenv("POSTGRES_DB", "smart_ai_crm")
        # Check if we are running in docker/postgres or using local fallback
        return f"postgresql://{pg_user}:{pg_password}@{pg_host}:{pg_port}/{pg_db}"

    @property
    def allowed_origins(self) -> list[str]:
        return [value.strip() for value in self.cors_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

