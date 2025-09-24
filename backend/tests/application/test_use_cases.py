"""Tests for application layer use cases."""

import pytest
from unittest.mock import AsyncMock, Mock

from app.application.use_cases import GetWeatherUseCase
from app.application.ports import WeatherServicePort, CachePort
from app.domain import CityWeather, ValidationError, InvalidCityError
from datetime import datetime


class TestGetWeatherUseCase:
    """Test cases for GetWeatherUseCase."""
    
    @pytest.fixture
    def mock_weather_service(self):
        """Create a mock weather service."""
        return AsyncMock(spec=WeatherServicePort)
    
    @pytest.fixture
    def mock_cache(self):
        """Create a mock cache."""
        return AsyncMock(spec=CachePort)
    
    @pytest.fixture
    def sample_weather(self):
        """Create sample weather data."""
        return CityWeather(
            city="London",
            temperature=15.5,
            humidity=65,
            wind_speed=12.3,
            condition="Partly cloudy",
            fetched_at=datetime(2024, 1, 15, 10, 0, 0),
            provider="weatherapi"
        )
    
    @pytest.mark.asyncio
    async def test_successful_weather_fetch_no_cache(self, mock_weather_service, sample_weather):
        """Test successful weather fetch without cache."""
        # Arrange
        mock_weather_service.get_weather.return_value = sample_weather
        use_case = GetWeatherUseCase(mock_weather_service)
        
        # Act
        result = await use_case.execute("London")
        
        # Assert
        assert result == sample_weather
        mock_weather_service.get_weather.assert_called_once_with("London")
    
    @pytest.mark.asyncio
    async def test_successful_weather_fetch_with_cache_miss(self, mock_weather_service, mock_cache, sample_weather):
        """Test successful weather fetch with cache miss."""
        # Arrange
        mock_cache.get.return_value = None  # Cache miss
        mock_weather_service.get_weather.return_value = sample_weather
        use_case = GetWeatherUseCase(mock_weather_service, mock_cache)
        
        # Act
        result = await use_case.execute("London")
        
        # Assert
        assert result == sample_weather
        mock_cache.get.assert_called_once_with("weather:london")
        mock_weather_service.get_weather.assert_called_once_with("London")
        mock_cache.set.assert_called_once_with("weather:london", sample_weather)
    
    @pytest.mark.asyncio
    async def test_successful_weather_fetch_with_cache_hit(self, mock_weather_service, mock_cache, sample_weather):
        """Test successful weather fetch with cache hit."""
        # Arrange
        mock_cache.get.return_value = sample_weather  # Cache hit
        use_case = GetWeatherUseCase(mock_weather_service, mock_cache)
        
        # Act
        result = await use_case.execute("London")
        
        # Assert
        assert result == sample_weather
        mock_cache.get.assert_called_once_with("weather:london")
        mock_weather_service.get_weather.assert_not_called()
        mock_cache.set.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_empty_city_validation(self, mock_weather_service):
        """Test validation for empty city name."""
        # Arrange
        use_case = GetWeatherUseCase(mock_weather_service)
        
        # Act & Assert
        with pytest.raises(ValidationError) as exc_info:
            await use_case.execute("")
        
        assert exc_info.value.code == "BAD_REQUEST"
        assert "empty" in exc_info.value.message.lower()
        assert exc_info.value.field == "city"
        mock_weather_service.get_weather.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_whitespace_city_validation(self, mock_weather_service):
        """Test validation for whitespace-only city name."""
        # Arrange
        use_case = GetWeatherUseCase(mock_weather_service)
        
        # Act & Assert
        with pytest.raises(ValidationError) as exc_info:
            await use_case.execute("   ")
        
        assert exc_info.value.code == "BAD_REQUEST"
        assert "empty" in exc_info.value.message.lower()
        assert exc_info.value.field == "city"
        mock_weather_service.get_weather.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_too_long_city_validation(self, mock_weather_service):
        """Test validation for city name that's too long."""
        # Arrange
        use_case = GetWeatherUseCase(mock_weather_service)
        long_city = "x" * 101  # Longer than 100 characters
        
        # Act & Assert
        with pytest.raises(ValidationError) as exc_info:
            await use_case.execute(long_city)
        
        assert exc_info.value.code == "BAD_REQUEST"
        assert "100 characters" in exc_info.value.message
        assert exc_info.value.field == "city"
        mock_weather_service.get_weather.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_city_name_trimming(self, mock_weather_service, sample_weather):
        """Test that city names are trimmed before processing."""
        # Arrange
        mock_weather_service.get_weather.return_value = sample_weather
        use_case = GetWeatherUseCase(mock_weather_service)
        
        # Act
        result = await use_case.execute("  London  ")
        
        # Assert
        assert result == sample_weather
        mock_weather_service.get_weather.assert_called_once_with("London")
    
    @pytest.mark.asyncio
    async def test_invalid_city_error_propagation(self, mock_weather_service, mock_cache):
        """Test that InvalidCityError is properly propagated."""
        # Arrange
        mock_cache.get.return_value = None
        mock_weather_service.get_weather.side_effect = InvalidCityError("InvalidCity")
        use_case = GetWeatherUseCase(mock_weather_service, mock_cache)
        
        # Act & Assert
        with pytest.raises(InvalidCityError):
            await use_case.execute("InvalidCity")
        
        mock_cache.get.assert_called_once_with("weather:invalidcity")
        mock_weather_service.get_weather.assert_called_once_with("InvalidCity")
        mock_cache.set.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_cache_error_handling_read(self, mock_weather_service, mock_cache, sample_weather):
        """Test graceful handling of cache read errors."""
        # Arrange
        mock_cache.get.side_effect = Exception("Cache read error")
        mock_weather_service.get_weather.return_value = sample_weather
        use_case = GetWeatherUseCase(mock_weather_service, mock_cache)
        
        # Act
        result = await use_case.execute("London")
        
        # Assert
        # Should still return weather data despite cache error
        assert result == sample_weather
        mock_weather_service.get_weather.assert_called_once_with("London")
        mock_cache.set.assert_called_once_with("weather:london", sample_weather)
    
    @pytest.mark.asyncio
    async def test_cache_error_handling_write(self, mock_weather_service, mock_cache, sample_weather):
        """Test graceful handling of cache write errors."""
        # Arrange
        mock_cache.get.return_value = None
        mock_cache.set.side_effect = Exception("Cache write error")
        mock_weather_service.get_weather.return_value = sample_weather
        use_case = GetWeatherUseCase(mock_weather_service, mock_cache)
        
        # Act
        result = await use_case.execute("London")
        
        # Assert
        # Should still return weather data despite cache error
        assert result == sample_weather
        mock_weather_service.get_weather.assert_called_once_with("London")
    
    @pytest.mark.asyncio
    async def test_cache_key_generation(self, mock_weather_service, mock_cache, sample_weather):
        """Test proper cache key generation."""
        # Arrange
        mock_cache.get.return_value = None
        mock_weather_service.get_weather.return_value = sample_weather
        use_case = GetWeatherUseCase(mock_weather_service, mock_cache)
        
        # Act
        await use_case.execute("New York")
        
        # Assert
        # Cache key should be lowercase and properly formatted
        mock_cache.get.assert_called_once_with("weather:new york")
        mock_cache.set.assert_called_once_with("weather:new york", sample_weather)
