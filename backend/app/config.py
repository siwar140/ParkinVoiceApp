# app/config.py
import os
from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    # ============================================================
    # BASE DE DONNEES
    # ============================================================
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://parkinvoice_user:parkinvoice_password@localhost:5432/parkinvoice_db"
    )

    # ============================================================
    # SECURITE
    # ============================================================
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

    # ============================================================
    # CORS
    # ============================================================
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000",
    )

    def get_cors_origins(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        return self.CORS_ORIGINS

    # ============================================================
    # EMAIL
    # ============================================================
    RESEND_API_KEY: Optional[str] = os.getenv("RESEND_API_KEY", None)
    FROM_EMAIL: str = os.getenv("FROM_EMAIL", "onboarding@resend.dev")

    # ============================================================
    # UPLOAD
    # ============================================================
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")

    # ============================================================
    # MODELE ML
    # ============================================================
    MODEL_PATH: str = os.getenv("MODEL_PATH", "./models_ia/model.h5")
    MODEL_KERAS_PATH: str = os.getenv("MODEL_KERAS_PATH", "./models_ia/model.keras")

    # ============================================================
    # ENVIRONNEMENT
    # ============================================================
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"   # <-- IMPORTANT : autorise les variables supplementaires


settings = Settings()

if settings.is_production:
    if len(settings.SECRET_KEY) < 32 or settings.SECRET_KEY in {
        "your-super-secret-key-change-me",
        "change-me",
    }:
        raise RuntimeError("SECRET_KEY must be a unique value of at least 32 characters in production")
    if settings.DEBUG:
        raise RuntimeError("DEBUG must be false in production")
