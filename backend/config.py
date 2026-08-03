"""
config.py — Application settings from environment variables.

All secrets and configuration values are loaded from .env file.
No secrets are ever hardcoded in source code.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the backend directory
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


class Settings:
    """Application settings loaded from environment variables."""

    # Telegram Bot
    BOT_TOKEN: str = os.getenv("BOT_TOKEN", "")

    # Database
    DB_PATH: str = os.getenv("DB_PATH", "birkasjourney.db")
    DB_FULL_PATH: str = str(BASE_DIR / DB_PATH)

    # JWT Authentication
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me-in-production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRATION_HOURS: int = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))

    # App
    APP_HOST: str = os.getenv("APP_HOST", "0.0.0.0")
    APP_PORT: int = int(os.getenv("APP_PORT", "8000"))
    TIMEZONE: str = os.getenv("TIMEZONE", "Asia/Almaty")

    # Browser origins allowed to call the API, comma-separated. In production
    # this is the deployed site's own origin; "*" is only for local development,
    # where the dashboard and the API are served from the same port anyway.
    ALLOWED_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv("ALLOWED_ORIGINS", "*").split(",")
        if origin.strip()
    ]

    @classmethod
    def validate(cls) -> None:
        """Validate that all required settings are present."""
        if not cls.BOT_TOKEN:
            raise ValueError(
                "BOT_TOKEN is not set. Add it to backend/.env file. "
                "Get one from @BotFather on Telegram."
            )
        if cls.JWT_SECRET == "change-me-in-production":
            import warnings
            warnings.warn(
                "JWT_SECRET is using default value. Set a strong secret in .env",
                stacklevel=2,
            )


settings = Settings()
