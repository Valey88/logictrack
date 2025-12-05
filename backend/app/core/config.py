from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5433/logitrack_tms"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production-use-env-variable"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",      # <-- ВАЖНО: Добавили ваш порт
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "LogiTrack TMS"
    
    # Email Configuration
    EMAIL_ENABLED: bool = False  # Set to True to enable email sending
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = "noreply@logitrack.com"
    FRONTEND_URL: str = "http://localhost:3000"  # Frontend URL for tracking links
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra environment variables


settings = Settings()

