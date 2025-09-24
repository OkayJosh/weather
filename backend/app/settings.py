"""Application settings configuration."""

import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # API Configuration
    weather_api_key: str
    weather_api_base_url: str = "https://api.weatherapi.com/v1"
    api_timeout: int = 10
    
    # Application Configuration
    app_name: str = "Weather App"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Cache Configuration
    cache_ttl: int = 300  # 5 minutes in seconds
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
