"""
Main configuration settings for FastAPI service
"""

import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load environment variables from .env file
load_dotenv()


class Settings(BaseSettings):
    # App settings
    app_name: str = "DeployIO FastAPI Service"
    version: str = "1.0.0"
    description: str = "FastAPI service for DeployIO application"
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"  # Database settings
    mongodb_uri: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017/deployio")

    # Server settings
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", 8000))  # CORS settings
    client_url: str = os.getenv("CLIENT_URL", "http://localhost:5173")
    backend_url: str = os.getenv("BACKEND_URL", "http://localhost:3000")
    production_url: str = os.getenv("PRODUCTION_URL", "")

    # Security settings
    jwt_secret: str = os.getenv("JWT_SECRET", "your-secret-key-here")
    secret_key: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

    class Config:
        env_file = ".env"
        extra = "ignore"  # Allow extra environment variables to be ignored


# Create settings instance
settings = Settings()
