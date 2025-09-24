"""Domain entities using Pydantic models."""

from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field, validator


class CityWeather(BaseModel):
    """
    CityWeather aggregate root representing weather data for a city.
    
    This is the core domain entity that encapsulates weather information
    and business rules for weather data validation.
    """
    city: str = Field(..., min_length=1, max_length=100, description="Name of the city")
    temperature: float = Field(..., description="Temperature in Celsius")
    humidity: int = Field(..., ge=0, le=100, description="Humidity percentage")
    wind_speed: float = Field(..., ge=0, description="Wind speed in km/h")
    condition: str = Field(..., min_length=1, description="Weather condition description")
    fetched_at: datetime = Field(default_factory=datetime.utcnow, description="When data was fetched")
    provider: Literal["weatherapi"] = Field(default="weatherapi", description="Weather data provider")

    @validator('city')
    def validate_city_name(cls, v):
        """Validate city name is not empty and properly formatted."""
        if not v or not v.strip():
            raise ValueError("City name cannot be empty")
        return v.strip().title()

    @validator('temperature')
    def validate_temperature(cls, v):
        """Validate temperature is within reasonable range."""
        if v < -100 or v > 60:
            raise ValueError("Temperature must be between -100°C and 60°C")
        return v

    @validator('condition')
    def validate_condition(cls, v):
        """Validate weather condition is not empty."""
        if not v or not v.strip():
            raise ValueError("Weather condition cannot be empty")
        return v.strip()

    class Config:
        """Pydantic model configuration."""
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }


class ErrorResponse(BaseModel):
    """
    ErrorResponse value object for standardized error responses.
    
    This encapsulates error information in a consistent format
    across the application.
    """
    code: str = Field(..., description="Error code identifier")
    message: str = Field(..., description="Human-readable error message")
    details: dict = Field(default_factory=dict, description="Additional error details")

    @validator('code')
    def validate_error_code(cls, v):
        """Validate error code format."""
        if not v or not v.strip():
            raise ValueError("Error code cannot be empty")
        return v.upper()

    @validator('message')
    def validate_error_message(cls, v):
        """Validate error message is not empty."""
        if not v or not v.strip():
            raise ValueError("Error message cannot be empty")
        return v.strip()
