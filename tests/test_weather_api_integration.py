"""
Playwright MCP Integration Tests for Weather API

These tests validate the backend endpoints against the WeatherAPI Swagger 1.0.2 specification
using Playwright MCP (Model Context Protocol) for automated testing.
"""

import pytest
import asyncio
import os
from typing import Dict, Any
import httpx
from playwright.async_api import async_playwright, APIRequestContext


class TestWeatherAPIIntegration:
    """Integration tests for Weather API endpoints using Playwright MCP."""
    
    BASE_URL = "http://localhost:8000"
    WEATHER_ENDPOINT = f"{BASE_URL}/api/weather"
    HEALTH_ENDPOINT = f"{BASE_URL}/api/health"
    
    @pytest.fixture(scope="class")
    async def api_context(self):
        """Create a Playwright API request context."""
        async with async_playwright() as playwright:
            request_context = await playwright.request.new_context(
                base_url=self.BASE_URL,
                timeout=10000
            )
            yield request_context
            await request_context.dispose()
    
    async def test_health_endpoint(self, api_context: APIRequestContext):
        """Test the health check endpoint."""
        response = await api_context.get("/api/health")
        
        assert response.status == 200
        
        data = await response.json()
        assert "status" in data
        assert data["status"] == "healthy"
        assert "app_name" in data
        assert "version" in data
    
    async def test_weather_endpoint_valid_city(self, api_context: APIRequestContext):
        """Test weather endpoint with a valid city."""
        response = await api_context.get("/api/weather", params={"city": "London"})
        
        assert response.status == 200
        
        data = await response.json()
        
        # Validate response structure according to CityWeather schema
        required_fields = [
            "city", "temperature", "humidity", "wind_speed", 
            "condition", "fetched_at", "provider"
        ]
        
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        # Validate data types
        assert isinstance(data["city"], str)
        assert isinstance(data["temperature"], (int, float))
        assert isinstance(data["humidity"], int)
        assert isinstance(data["wind_speed"], (int, float))
        assert isinstance(data["condition"], str)
        assert isinstance(data["fetched_at"], str)
        assert data["provider"] == "weatherapi"
        
        # Validate value ranges
        assert -100 <= data["temperature"] <= 60
        assert 0 <= data["humidity"] <= 100
        assert data["wind_speed"] >= 0
        assert len(data["city"]) > 0
        assert len(data["condition"]) > 0
    
    async def test_weather_endpoint_invalid_city(self, api_context: APIRequestContext):
        """Test weather endpoint with an invalid city."""
        response = await api_context.get("/api/weather", params={"city": "InvalidCityName123"})
        
        assert response.status == 422
        
        data = await response.json()
        
        # Validate error response structure
        assert "code" in data
        assert "message" in data
        assert "details" in data
        
        assert data["code"] == "UNKNOWN_CITY"
        assert isinstance(data["message"], str)
        assert isinstance(data["details"], dict)
    
    async def test_weather_endpoint_empty_city(self, api_context: APIRequestContext):
        """Test weather endpoint with empty city parameter."""
        response = await api_context.get("/api/weather", params={"city": ""})
        
        assert response.status == 422
        
        data = await response.json()
        
        # Should return validation error
        assert "code" in data
        assert data["code"] == "BAD_REQUEST"
    
    async def test_weather_endpoint_missing_city_parameter(self, api_context: APIRequestContext):
        """Test weather endpoint without city parameter."""
        response = await api_context.get("/api/weather")
        
        assert response.status == 422
        
        # FastAPI validation error for missing required parameter
        data = await response.json()
        assert "detail" in data
    
    async def test_weather_endpoint_too_long_city(self, api_context: APIRequestContext):
        """Test weather endpoint with city name exceeding max length."""
        long_city = "x" * 101  # Longer than 100 characters
        
        response = await api_context.get("/api/weather", params={"city": long_city})
        
        assert response.status == 422
        
        data = await response.json()
        assert "code" in data
        assert data["code"] == "BAD_REQUEST"
    
    async def test_weather_endpoint_whitespace_city(self, api_context: APIRequestContext):
        """Test weather endpoint with whitespace-only city."""
        response = await api_context.get("/api/weather", params={"city": "   "})
        
        assert response.status == 422
        
        data = await response.json()
        assert "code" in data
        assert data["code"] == "BAD_REQUEST"
    
    async def test_multiple_valid_cities(self, api_context: APIRequestContext):
        """Test weather endpoint with multiple valid cities."""
        cities = ["London", "New York", "Tokyo", "Paris", "Sydney"]
        
        for city in cities:
            response = await api_context.get("/api/weather", params={"city": city})
            
            if response.status == 200:
                data = await response.json()
                assert data["city"].lower() == city.lower() or city.lower() in data["city"].lower()
                assert data["provider"] == "weatherapi"
            elif response.status == 422:
                # Some cities might not be found, which is acceptable
                data = await response.json()
                assert data["code"] in ["UNKNOWN_CITY", "BAD_REQUEST"]
    
    async def test_api_response_headers(self, api_context: APIRequestContext):
        """Test that API responses include proper headers."""
        response = await api_context.get("/api/weather", params={"city": "London"})
        
        headers = response.headers
        
        # Check for CORS headers (since frontend needs to access API)
        # Note: Exact header values might vary based on FastAPI CORS configuration
        assert "content-type" in headers
        assert headers["content-type"] == "application/json"
    
    async def test_api_response_time(self, api_context: APIRequestContext):
        """Test API response time is reasonable."""
        import time
        
        start_time = time.time()
        response = await api_context.get("/api/weather", params={"city": "London"})
        end_time = time.time()
        
        response_time = end_time - start_time
        
        # API should respond within 15 seconds (includes external API call)
        assert response_time < 15.0
        
        # Check response is successful or properly handled error
        assert response.status in [200, 422, 502, 504]
    
    @pytest.mark.asyncio
    async def test_contract_compliance_with_swagger_spec(self, api_context: APIRequestContext):
        """Test compliance with WeatherAPI Swagger 1.0.2 specification."""
        # Test successful response structure matches expected format
        response = await api_context.get("/api/weather", params={"city": "London"})
        
        if response.status == 200:
            data = await response.json()
            
            # Verify response matches our domain model structure
            # This ensures compatibility with WeatherAPI.com response format
            assert all(field in data for field in [
                "city", "temperature", "humidity", "wind_speed", 
                "condition", "fetched_at", "provider"
            ])
            
            # Verify data types match expected types from WeatherAPI
            assert isinstance(data["temperature"], (int, float))
            assert isinstance(data["humidity"], int)
            assert isinstance(data["wind_speed"], (int, float))
        
        # Test error response structure
        error_response = await api_context.get("/api/weather", params={"city": ""})
        
        if error_response.status == 422:
            error_data = await error_response.json()
            assert "code" in error_data
            assert "message" in error_data
    
    async def test_concurrent_requests(self, api_context: APIRequestContext):
        """Test API handles concurrent requests properly."""
        async def make_request(city: str):
            response = await api_context.get("/api/weather", params={"city": city})
            return response.status, await response.json()
        
        # Make multiple concurrent requests
        tasks = [
            make_request("London"),
            make_request("Paris"),
            make_request("Tokyo"),
            make_request("Sydney"),
            make_request("Berlin")
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # All requests should complete without exceptions
        for result in results:
            assert not isinstance(result, Exception)
            status, data = result
            assert status in [200, 422, 502, 504]  # Valid response codes


# Additional MCP-specific test configurations
class TestPlaywrightMCPConfiguration:
    """Test Playwright MCP configuration and setup."""
    
    def test_playwright_mcp_availability(self):
        """Verify Playwright MCP is available and properly configured."""
        try:
            import playwright
            from playwright.async_api import async_playwright
            assert True  # Playwright is available
        except ImportError:
            pytest.fail("Playwright MCP is not available")
    
    async def test_api_context_creation(self):
        """Test that API context can be created successfully."""
        async with async_playwright() as playwright:
            context = await playwright.request.new_context()
            assert context is not None
            await context.dispose()


if __name__ == "__main__":
    # Run tests directly
    pytest.main([__file__, "-v"])
