"""Application layer ports (interfaces) for dependency inversion."""

from abc import ABC, abstractmethod
from typing import Optional
from ..domain.entities import CityWeather


class WeatherServicePort(ABC):
    """
    Port (interface) for weather service adapters.
    
    This defines the contract that infrastructure adapters must implement
    to provide weather data to the application layer.
    """
    
    @abstractmethod
    async def get_weather(self, city: str) -> CityWeather:
        """
        Fetch weather data for a given city.
        
        Args:
            city: Name of the city to fetch weather for
            
        Returns:
            CityWeather domain entity with weather information
            
        Raises:
            InvalidCityError: If the city is not found
            WeatherServiceUnavailableError: If the service is unavailable
            TimeoutError: If the request times out
        """
        pass


class CachePort(ABC):
    """
    Port (interface) for caching adapters.
    
    This defines the contract for caching weather data.
    """
    
    @abstractmethod
    async def get(self, key: str) -> Optional[CityWeather]:
        """Get cached weather data by key."""
        pass
    
    @abstractmethod
    async def set(self, key: str, value: CityWeather, ttl: int = 300) -> None:
        """Set cached weather data with TTL."""
        pass
    
    @abstractmethod
    async def delete(self, key: str) -> None:
        """Delete cached weather data."""
        pass
