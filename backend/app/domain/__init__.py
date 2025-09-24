"""Domain layer for weather application."""

from .entities import CityWeather, ErrorResponse
from .errors import (
    WeatherDomainError,
    InvalidCityError,
    ValidationError,
    WeatherServiceUnavailableError,
    TimeoutError,
)

__all__ = [
    "CityWeather",
    "ErrorResponse",
    "WeatherDomainError",
    "InvalidCityError",
    "ValidationError",
    "WeatherServiceUnavailableError",
    "TimeoutError",
]
