import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://thaiacc:password@localhost:5432/thaiacc"
    
    # Authentication
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    
    # Application
    env: str = "development"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000
    
    # CORS
    frontend_url: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    # Allow test environment to set a test secret
    if os.environ.get("PYTEST_CURRENT_TEST") and not os.environ.get("JWT_SECRET_KEY"):
        os.environ["JWT_SECRET_KEY"] = "test-secret-key-do-not-use-in-production"
    return Settings()
