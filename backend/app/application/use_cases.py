"""Application layer use cases that orchestrate domain logic."""

import logging
from typing import Optional
from ..domain import CityWeather, ValidationError, InvalidCityError
from .ports import WeatherServicePort, CachePort

logger = logging.getLogger(__name__)


class GetWeatherUseCase:
    """
    Use case for fetching weather data for a city.
    
    This orchestrates the business logic for retrieving weather information,
    including validation, caching, and error handling.
    """
    
    def __init__(self, weather_service: WeatherServicePort, cache: Optional[CachePort] = None):
        self.weather_service = weather_service
        self.cache = cache
    
    async def execute(self, city: str) -> CityWeather:
        """
        Execute the get weather use case.
        
        Args:
            city: Name of the city to get weather for
            
        Returns:
            CityWeather domain entity
            
        Raises:
            ValidationError: If input validation fails
            InvalidCityError: If the city is not found
            WeatherServiceUnavailableError: If the service is unavailable
            TimeoutError: If the request times out
        """
        # Validate input
        if not city or not city.strip():
            raise ValidationError("City name cannot be empty", "city")
        
        city = city.strip()
        
        if len(city) > 100:
            raise ValidationError("City name cannot exceed 100 characters", "city")
        
        # Generate cache key
        cache_key = f"weather:{city.lower()}"
        
        # Try to get from cache first
        if self.cache:
            try:
                cached_weather = await self.cache.get(cache_key)
                if cached_weather:
                    logger.info(f"Weather data for {city} found in cache")
                    return cached_weather
            except Exception as e:
                logger.warning(f"Cache read error for {city}: {e}")
        
        # Fetch from weather service
        logger.info(f"Fetching weather data for {city} from service")
        weather_data = await self.weather_service.get_weather(city)
        
        # Cache the result
        if self.cache and weather_data:
            try:
                await self.cache.set(cache_key, weather_data)
                logger.info(f"Weather data for {city} cached successfully")
            except Exception as e:
                logger.warning(f"Cache write error for {city}: {e}")
        
        return weather_data
