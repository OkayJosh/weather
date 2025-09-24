"""Tests for cache infrastructure."""

import pytest
import asyncio
from datetime import datetime, timedelta

from app.infrastructure.cache import InMemoryCache
from app.domain.entities import CityWeather


class TestInMemoryCache:
    """Test cases for InMemoryCache."""
    
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
    async def test_cache_miss(self):
        """Test cache miss returns None."""
        cache = InMemoryCache()
        
        result = await cache.get("non_existent_key")
        
        assert result is None
    
    @pytest.mark.asyncio
    async def test_cache_set_and_get(self, sample_weather):
        """Test setting and getting cache entry."""
        cache = InMemoryCache()
        
        await cache.set("test_key", sample_weather, ttl=300)
        result = await cache.get("test_key")
        
        assert result is not None
        assert result.city == sample_weather.city
        assert result.temperature == sample_weather.temperature
        assert result.humidity == sample_weather.humidity
    
    @pytest.mark.asyncio
    async def test_cache_expiration(self, sample_weather):
        """Test cache entry expiration."""
        cache = InMemoryCache()
        
        # Set entry with very short TTL
        await cache.set("test_key", sample_weather, ttl=0)
        
        # Wait a bit and try to get
        await asyncio.sleep(0.1)
        result = await cache.get("test_key")
        
        assert result is None
    
    @pytest.mark.asyncio
    async def test_cache_delete(self, sample_weather):
        """Test deleting cache entry."""
        cache = InMemoryCache()
        
        await cache.set("test_key", sample_weather)
        await cache.delete("test_key")
        result = await cache.get("test_key")
        
        assert result is None
    
    @pytest.mark.asyncio
    async def test_cache_clear(self, sample_weather):
        """Test clearing all cache entries."""
        cache = InMemoryCache()
        
        await cache.set("key1", sample_weather)
        await cache.set("key2", sample_weather)
        
        assert await cache.size() == 2
        
        await cache.clear()
        
        assert await cache.size() == 0
        assert await cache.get("key1") is None
        assert await cache.get("key2") is None
    
    @pytest.mark.asyncio
    async def test_cache_size(self, sample_weather):
        """Test getting cache size."""
        cache = InMemoryCache()
        
        assert await cache.size() == 0
        
        await cache.set("key1", sample_weather)
        assert await cache.size() == 1
        
        await cache.set("key2", sample_weather)
        assert await cache.size() == 2
        
        await cache.delete("key1")
        assert await cache.size() == 1
    
    @pytest.mark.asyncio
    async def test_cleanup_expired(self, sample_weather):
        """Test cleanup of expired entries."""
        cache = InMemoryCache()
        
        # Add some entries with different TTLs
        await cache.set("fresh_key", sample_weather, ttl=300)  # Long TTL
        await cache.set("expired_key", sample_weather, ttl=0)  # Immediate expiry
        
        assert await cache.size() == 2
        
        # Wait for expiration
        await asyncio.sleep(0.1)
        
        # Clean up expired entries
        removed_count = await cache.cleanup_expired()
        
        assert removed_count == 1
        assert await cache.size() == 1
        assert await cache.get("fresh_key") is not None
        assert await cache.get("expired_key") is None
    
    @pytest.mark.asyncio
    async def test_concurrent_access(self, sample_weather):
        """Test concurrent access to cache."""
        cache = InMemoryCache()
        
        async def set_operation(key: str):
            await cache.set(key, sample_weather)
        
        async def get_operation(key: str):
            return await cache.get(key)
        
        # Run concurrent operations
        keys = [f"key_{i}" for i in range(10)]
        set_tasks = [set_operation(key) for key in keys]
        
        await asyncio.gather(*set_tasks)
        
        # Verify all entries were set
        assert await cache.size() == 10
        
        # Run concurrent gets
        get_tasks = [get_operation(key) for key in keys]
        results = await asyncio.gather(*get_tasks)
        
        # All should return valid weather data
        assert all(result is not None for result in results)
        assert all(result.city == "London" for result in results)
    
    @pytest.mark.asyncio
    async def test_serialization_deserialization(self, sample_weather):
        """Test proper serialization and deserialization of weather data."""
        cache = InMemoryCache()
        
        await cache.set("test_key", sample_weather)
        result = await cache.get("test_key")
        
        assert result is not None
        assert isinstance(result, CityWeather)
        assert result.city == sample_weather.city
        assert result.temperature == sample_weather.temperature
        assert result.humidity == sample_weather.humidity
        assert result.wind_speed == sample_weather.wind_speed
        assert result.condition == sample_weather.condition
        assert result.provider == sample_weather.provider
    
    @pytest.mark.asyncio
    async def test_corrupted_cache_data_handling(self):
        """Test handling of corrupted cache data."""
        cache = InMemoryCache()
        
        # Manually insert corrupted data
        async with cache._lock:
            cache._cache["corrupted_key"] = {
                "data": {"invalid": "data"},  # Invalid structure
                "expires_at": datetime.utcnow() + timedelta(seconds=300)
            }
        
        # Should return None and clean up corrupted entry
        result = await cache.get("corrupted_key")
        
        assert result is None
        assert await cache.size() == 0
