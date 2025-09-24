"""Tests for domain entities."""

import pytest
from datetime import datetime
from pydantic import ValidationError

from app.domain.entities import CityWeather, ErrorResponse


class TestCityWeather:
    """Test cases for CityWeather entity."""
    
    def test_valid_city_weather_creation(self):
        """Test creating a valid CityWeather instance."""
        weather = CityWeather(
            city="London",
            temperature=15.5,
            humidity=65,
            wind_speed=12.3,
            condition="Partly cloudy"
        )
        
        assert weather.city == "London"
        assert weather.temperature == 15.5
        assert weather.humidity == 65
        assert weather.wind_speed == 12.3
        assert weather.condition == "Partly cloudy"
        assert weather.provider == "weatherapi"
        assert isinstance(weather.fetched_at, datetime)
    
    def test_city_name_validation(self):
        """Test city name validation rules."""
        # Empty city name should raise ValidationError
        with pytest.raises(ValidationError):
            CityWeather(
                city="",
                temperature=15.5,
                humidity=65,
                wind_speed=12.3,
                condition="Sunny"
            )
        
        # Whitespace-only city name should raise ValidationError
        with pytest.raises(ValidationError):
            CityWeather(
                city="   ",
                temperature=15.5,
                humidity=65,
                wind_speed=12.3,
                condition="Sunny"
            )
    
    def test_city_name_formatting(self):
        """Test city name is properly formatted."""
        weather = CityWeather(
            city="  london  ",
            temperature=15.5,
            humidity=65,
            wind_speed=12.3,
            condition="Sunny"
        )
        
        # Should be trimmed and title cased
        assert weather.city == "London"
    
    def test_temperature_validation(self):
        """Test temperature validation rules."""
        # Valid temperature range
        weather = CityWeather(
            city="London",
            temperature=25.0,
            humidity=65,
            wind_speed=12.3,
            condition="Sunny"
        )
        assert weather.temperature == 25.0
        
        # Temperature too low
        with pytest.raises(ValidationError):
            CityWeather(
                city="London",
                temperature=-150.0,
                humidity=65,
                wind_speed=12.3,
                condition="Sunny"
            )
        
        # Temperature too high
        with pytest.raises(ValidationError):
            CityWeather(
                city="London",
                temperature=100.0,
                humidity=65,
                wind_speed=12.3,
                condition="Sunny"
            )
    
    def test_humidity_validation(self):
        """Test humidity validation rules."""
        # Valid humidity
        weather = CityWeather(
            city="London",
            temperature=15.5,
            humidity=50,
            wind_speed=12.3,
            condition="Sunny"
        )
        assert weather.humidity == 50
        
        # Humidity too low
        with pytest.raises(ValidationError):
            CityWeather(
                city="London",
                temperature=15.5,
                humidity=-1,
                wind_speed=12.3,
                condition="Sunny"
            )
        
        # Humidity too high
        with pytest.raises(ValidationError):
            CityWeather(
                city="London",
                temperature=15.5,
                humidity=101,
                wind_speed=12.3,
                condition="Sunny"
            )
    
    def test_wind_speed_validation(self):
        """Test wind speed validation rules."""
        # Valid wind speed
        weather = CityWeather(
            city="London",
            temperature=15.5,
            humidity=65,
            wind_speed=20.0,
            condition="Sunny"
        )
        assert weather.wind_speed == 20.0
        
        # Negative wind speed should raise ValidationError
        with pytest.raises(ValidationError):
            CityWeather(
                city="London",
                temperature=15.5,
                humidity=65,
                wind_speed=-5.0,
                condition="Sunny"
            )
    
    def test_condition_validation(self):
        """Test weather condition validation."""
        # Valid condition
        weather = CityWeather(
            city="London",
            temperature=15.5,
            humidity=65,
            wind_speed=12.3,
            condition="Partly cloudy"
        )
        assert weather.condition == "Partly cloudy"
        
        # Empty condition should raise ValidationError
        with pytest.raises(ValidationError):
            CityWeather(
                city="London",
                temperature=15.5,
                humidity=65,
                wind_speed=12.3,
                condition=""
            )


class TestErrorResponse:
    """Test cases for ErrorResponse value object."""
    
    def test_valid_error_response_creation(self):
        """Test creating a valid ErrorResponse instance."""
        error = ErrorResponse(
            code="UNKNOWN_CITY",
            message="City not found",
            details={"city": "InvalidCity"}
        )
        
        assert error.code == "UNKNOWN_CITY"
        assert error.message == "City not found"
        assert error.details == {"city": "InvalidCity"}
    
    def test_error_code_formatting(self):
        """Test error code is properly formatted."""
        error = ErrorResponse(
            code="unknown_city",
            message="City not found"
        )
        
        # Should be uppercase
        assert error.code == "UNKNOWN_CITY"
    
    def test_error_code_validation(self):
        """Test error code validation rules."""
        # Empty code should raise ValidationError
        with pytest.raises(ValidationError):
            ErrorResponse(
                code="",
                message="Some error"
            )
        
        # Whitespace-only code should raise ValidationError
        with pytest.raises(ValidationError):
            ErrorResponse(
                code="   ",
                message="Some error"
            )
    
    def test_error_message_validation(self):
        """Test error message validation rules."""
        # Empty message should raise ValidationError
        with pytest.raises(ValidationError):
            ErrorResponse(
                code="ERROR_CODE",
                message=""
            )
        
        # Whitespace-only message should raise ValidationError
        with pytest.raises(ValidationError):
            ErrorResponse(
                code="ERROR_CODE",
                message="   "
            )
    
    def test_default_details(self):
        """Test default empty details dict."""
        error = ErrorResponse(
            code="ERROR_CODE",
            message="Some error"
        )
        
        assert error.details == {}
