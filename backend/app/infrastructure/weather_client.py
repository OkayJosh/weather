"""WeatherAPI client adapter for external weather service integration."""

import logging
import asyncio
from typing import Dict, Any
import httpx
from datetime import datetime
from pydantic import BaseModel

from ..application.ports import WeatherServicePort
from ..domain import CityWeather, InvalidCityError, WeatherServiceUnavailableError, TimeoutError
from ..settings import settings

logger = logging.getLogger(__name__)


class WeatherAPIResponse(BaseModel):
    """Pydantic model for WeatherAPI.com response mapping."""
    location: Dict[str, Any]
    current: Dict[str, Any]


class WeatherAPIClient(WeatherServicePort):
    """
    Adapter for WeatherAPI.com service.
    
    This implements the WeatherServicePort interface and handles
    the external API communication, error mapping, and data transformation.
    """
    
    def __init__(self, api_key: str, base_url: str, timeout: int = 10):
        self.api_key = api_key
        self.base_url = base_url
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)
    
    async def get_weather(self, city: str) -> CityWeather:
        """
        Fetch weather data from WeatherAPI.com for a given city.
        
        Args:
            city: Name of the city
            
        Returns:
            CityWeather domain entity
            
        Raises:
            InvalidCityError: If city is not found (400 response)
            WeatherServiceUnavailableError: If service is unavailable (500 response)
            TimeoutError: If request times out
        """
        url = f"{self.base_url}/current.json"
        params = {
            "key": self.api_key,
            "q": city,
            "aqi": "no"  # No air quality data needed
        }
        
        try:
            logger.info(f"Making request to WeatherAPI for city: {city}")
            response = await self.client.get(url, params=params)
            
            if response.status_code == 400:
                error_data = response.json()
                error_message = error_data.get("error", {}).get("message", "Unknown city")
                logger.warning(f"City not found: {city} - {error_message}")
                raise InvalidCityError(city, {"response": error_data})
            
            if response.status_code == 401:
                logger.error("WeatherAPI authentication failed - invalid API key")
                raise WeatherServiceUnavailableError(
                    "Weather service authentication failed",
                    {"status_code": response.status_code}
                )
            
            if response.status_code >= 500:
                logger.error(f"WeatherAPI server error: {response.status_code}")
                raise WeatherServiceUnavailableError(
                    "Weather service is temporarily unavailable",
                    {"status_code": response.status_code}
                )
            
            if response.status_code != 200:
                logger.error(f"Unexpected WeatherAPI response: {response.status_code}")
                raise WeatherServiceUnavailableError(
                    f"Unexpected response from weather service: {response.status_code}",
                    {"status_code": response.status_code}
                )
            
            # Parse and validate response
            response_data = response.json()
            logger.debug(f"WeatherAPI response for {city}: {response_data}")
            
            return self._map_to_domain(response_data, city)
            
        except asyncio.TimeoutError:
            logger.error(f"Timeout while fetching weather for {city}")
            raise TimeoutError(f"Request timed out while fetching weather for {city}")
        
        except httpx.TimeoutException:
            logger.error(f"HTTP timeout while fetching weather for {city}")
            raise TimeoutError(f"Request timed out while fetching weather for {city}")
        
        except (InvalidCityError, WeatherServiceUnavailableError, TimeoutError):
            # Re-raise domain errors
            raise
        
        except Exception as e:
            logger.error(f"Unexpected error fetching weather for {city}: {e}")
            raise WeatherServiceUnavailableError(
                "An unexpected error occurred while fetching weather data",
                {"error": str(e)}
            )
    
    def _map_to_domain(self, response_data: Dict[str, Any], requested_city: str) -> CityWeather:
        """
        Map WeatherAPI response to domain entity.
        
        Args:
            response_data: Raw response from WeatherAPI
            requested_city: Originally requested city name
            
        Returns:
            CityWeather domain entity
        """
        try:
            location = response_data["location"]
            current = response_data["current"]
            
            # Use the actual city name from the API response for consistency
            actual_city_name = location["name"]
            
            weather = CityWeather(
                city=actual_city_name,
                temperature=float(current["temp_c"]),
                humidity=int(current["humidity"]),
                wind_speed=float(current["wind_kph"]),
                condition=current["condition"]["text"],
                fetched_at=datetime.utcnow(),
                provider="weatherapi"
            )
            
            logger.info(f"Successfully mapped weather data for {actual_city_name}")
            return weather
            
        except KeyError as e:
            logger.error(f"Missing required field in WeatherAPI response: {e}")
            raise WeatherServiceUnavailableError(
                "Invalid response format from weather service",
                {"missing_field": str(e), "response": response_data}
            )
        
        except (ValueError, TypeError) as e:
            logger.error(f"Invalid data type in WeatherAPI response: {e}")
            raise WeatherServiceUnavailableError(
                "Invalid data format from weather service",
                {"error": str(e), "response": response_data}
            )
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()


# Factory function to create weather client with settings
def create_weather_client() -> WeatherAPIClient:
    """Create a WeatherAPI client with application settings."""
    return WeatherAPIClient(
        api_key=settings.weather_api_key,
        base_url=settings.weather_api_base_url,
        timeout=settings.api_timeout
    )
