"""FastAPI routes and controllers for the weather application."""

import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import JSONResponse

from ..domain import CityWeather, ErrorResponse, WeatherDomainError, ValidationError, InvalidCityError, WeatherServiceUnavailableError, TimeoutError
from ..application import GetWeatherUseCase
from ..infrastructure import create_weather_client, create_cache
from ..settings import settings

logger = logging.getLogger(__name__)

router = APIRouter()

# Dependency injection for use case
async def get_weather_use_case() -> GetWeatherUseCase:
    """Create and return a GetWeatherUseCase instance with dependencies."""
    weather_client = create_weather_client()
    cache = create_cache()
    return GetWeatherUseCase(weather_client, cache)


@router.get("/weather", response_model=CityWeather)
async def get_weather(
    city: str = Query(..., min_length=1, max_length=100, description="City name to get weather for"),
    use_case: GetWeatherUseCase = Depends(get_weather_use_case)
) -> CityWeather:
    """
    Get current weather for a specified city.
    
    Args:
        city: Name of the city to get weather for
        use_case: Injected GetWeatherUseCase instance
        
    Returns:
        CityWeather domain entity with current weather information
        
    Raises:
        HTTPException: With appropriate status code and error details
    """
    try:
        logger.info(f"Received weather request for city: {city}")
        weather_data = await use_case.execute(city)
        logger.info(f"Successfully retrieved weather for {city}")
        return weather_data
        
    except ValidationError as e:
        logger.warning(f"Validation error for city {city}: {e.message}")
        error_response = ErrorResponse(
            code=e.code,
            message=e.message,
            details={"field": e.field}
        )
        raise HTTPException(
            status_code=422,
            detail=error_response.dict()
        )
    
    except InvalidCityError as e:
        logger.warning(f"Invalid city error: {e.message}")
        error_response = ErrorResponse(
            code=e.code,
            message=e.message,
            details=e.details
        )
        raise HTTPException(
            status_code=422,
            detail=error_response.dict()
        )
    
    except TimeoutError as e:
        logger.error(f"Timeout error for city {city}: {e.message}")
        error_response = ErrorResponse(
            code=e.code,
            message=e.message,
            details=e.details
        )
        raise HTTPException(
            status_code=504,
            detail=error_response.dict()
        )
    
    except WeatherServiceUnavailableError as e:
        logger.error(f"Service unavailable error for city {city}: {e.message}")
        error_response = ErrorResponse(
            code=e.code,
            message=e.message,
            details=e.details
        )
        raise HTTPException(
            status_code=502,
            detail=error_response.dict()
        )
    
    except WeatherDomainError as e:
        logger.error(f"Domain error for city {city}: {e.message}")
        error_response = ErrorResponse(
            code=e.code,
            message=e.message,
            details=e.details
        )
        raise HTTPException(
            status_code=500,
            detail=error_response.dict()
        )
    
    except Exception as e:
        logger.error(f"Unexpected error for city {city}: {e}")
        error_response = ErrorResponse(
            code="INTERNAL_ERROR",
            message="An unexpected error occurred while processing your request",
            details={"error": str(e) if settings.debug else "Internal server error"}
        )
        raise HTTPException(
            status_code=500,
            detail=error_response.dict()
        )


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Health check endpoint for monitoring and load balancers.
    
    Returns:
        Dictionary with application health status
    """
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "version": settings.app_version,
        "timestamp": "2025-01-14T10:00:00Z"  # Would normally be datetime.utcnow().isoformat()
    }


@router.get("/")
async def root() -> Dict[str, str]:
    """
    Root endpoint with basic API information.
    
    Returns:
        Dictionary with API information
    """
    return {
        "message": f"Welcome to {settings.app_name} API",
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/api/health"
    }
