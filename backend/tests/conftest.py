"""Test configuration and fixtures."""

import pytest
import asyncio
from datetime import datetime
from typing import AsyncGenerator, Generator

from app.domain.entities import CityWeather
from app.infrastructure.cache import InMemoryCache
from app.infrastructure.weather_client import WeatherAPIClient


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def cache() -> AsyncGenerator[InMemoryCache, None]:
    """Create a fresh cache instance for testing."""
    cache_instance = InMemoryCache()
    yield cache_instance
    await cache_instance.clear()


@pytest.fixture
def sample_weather_data() -> CityWeather:
    """Create sample weather data for testing."""
    return CityWeather(
        city="London",
        temperature=15.5,
        humidity=65,
        wind_speed=12.3,
        condition="Partly cloudy",
        fetched_at=datetime(2024, 1, 15, 10, 0, 0),
        provider="weatherapi"
    )


@pytest.fixture
def mock_weatherapi_response():
    """Mock WeatherAPI.com response data."""
    return {
        "location": {
            "name": "London",
            "region": "City of London, Greater London",
            "country": "United Kingdom",
            "lat": 51.52,
            "lon": -0.11,
            "tz_id": "Europe/London",
            "localtime_epoch": 1705316400,
            "localtime": "2024-01-15 10:00"
        },
        "current": {
            "last_updated_epoch": 1705316400,
            "last_updated": "2024-01-15 10:00",
            "temp_c": 15.5,
            "temp_f": 59.9,
            "is_day": 1,
            "condition": {
                "text": "Partly cloudy",
                "icon": "//cdn.weatherapi.com/weather/64x64/day/116.png",
                "code": 1003
            },
            "wind_mph": 7.6,
            "wind_kph": 12.3,
            "wind_degree": 240,
            "wind_dir": "WSW",
            "pressure_mb": 1013.0,
            "pressure_in": 29.91,
            "precip_mm": 0.0,
            "precip_in": 0.0,
            "humidity": 65,
            "cloud": 50,
            "feelslike_c": 15.5,
            "feelslike_f": 59.9,
            "vis_km": 10.0,
            "vis_miles": 6.0,
            "uv": 4.0,
            "gust_mph": 15.0,
            "gust_kph": 24.1
        }
    }


@pytest.fixture
def mock_weather_client():
    """Mock weather client for testing."""
    return WeatherAPIClient(
        api_key="test_api_key",
        base_url="https://api.test.com/v1",
        timeout=5
    )
