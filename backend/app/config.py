from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "GOVIND TUBE API"
    environment: str = "development"
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_database: str = "govind_tube"
    jwt_secret: str = "development-only-change-this-secret"
    jwt_expire_minutes: int = 10080
    api_cors_origins: str = "http://localhost:3000"
    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 1024
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)
    @property
    def cors_origins(self):
        return [x.strip() for x in self.api_cors_origins.split(",") if x.strip()]

@lru_cache
def get_settings():
    return Settings()
settings = get_settings()
