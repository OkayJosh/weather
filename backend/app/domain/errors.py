"""Domain-specific errors and exceptions."""

from typing import Optional, Dict, Any


class WeatherDomainError(Exception):
    """Base exception for weather domain errors."""
    
    def __init__(self, message: str, code: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details or {}


class InvalidCityError(WeatherDomainError):
    """Raised when city name is invalid or not found."""
    
    def __init__(self, city: str, details: Optional[Dict[str, Any]] = None):
        message = f"Invalid or unknown city: {city}"
        super().__init__(message, "UNKNOWN_CITY", details)
        self.city = city


class ValidationError(WeatherDomainError):
    """Raised when domain validation fails."""
    
    def __init__(self, message: str, field: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, "BAD_REQUEST", details)
        self.field = field


class WeatherServiceUnavailableError(WeatherDomainError):
    """Raised when weather service is unavailable."""
    
    def __init__(self, message: str = "Weather service is temporarily unavailable", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, "UPSTREAM_ERROR", details)


class TimeoutError(WeatherDomainError):
    """Raised when weather service request times out."""
    
    def __init__(self, message: str = "Weather service request timed out", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, "TIMEOUT", details)
