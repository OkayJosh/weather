"""Cache adapter implementations."""

import asyncio
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import json

from ..application.ports import CachePort
from ..domain.entities import CityWeather

logger = logging.getLogger(__name__)


class InMemoryCache(CachePort):
    """
    Simple in-memory cache implementation.
    
    This is suitable for development and single-instance deployments.
    For production with multiple instances, consider Redis or similar.
    """
    
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._lock = asyncio.Lock()
    
    async def get(self, key: str) -> Optional[CityWeather]:
        """Get cached weather data by key."""
        async with self._lock:
            if key not in self._cache:
                logger.debug(f"Cache miss for key: {key}")
                return None
            
            entry = self._cache[key]
            expires_at = entry["expires_at"]
            
            # Check if entry has expired
            if datetime.utcnow() > expires_at:
                logger.debug(f"Cache entry expired for key: {key}")
                del self._cache[key]
                return None
            
            # Deserialize weather data
            try:
                weather_data = entry["data"]
                weather = CityWeather(**weather_data)
                logger.debug(f"Cache hit for key: {key}")
                return weather
            except Exception as e:
                logger.error(f"Error deserializing cached data for key {key}: {e}")
                del self._cache[key]
                return None
    
    async def set(self, key: str, value: CityWeather, ttl: int = 300) -> None:
        """Set cached weather data with TTL."""
        async with self._lock:
            expires_at = datetime.utcnow() + timedelta(seconds=ttl)
            
            # Serialize weather data
            weather_data = value.dict()
            
            self._cache[key] = {
                "data": weather_data,
                "expires_at": expires_at
            }
            
            logger.debug(f"Cached data for key: {key} with TTL: {ttl}s")
    
    async def delete(self, key: str) -> None:
        """Delete cached weather data."""
        async with self._lock:
            if key in self._cache:
                del self._cache[key]
                logger.debug(f"Deleted cache entry for key: {key}")
    
    async def clear(self) -> None:
        """Clear all cached data."""
        async with self._lock:
            self._cache.clear()
            logger.info("Cleared all cache entries")
    
    async def size(self) -> int:
        """Get number of cached entries."""
        async with self._lock:
            return len(self._cache)
    
    async def cleanup_expired(self) -> int:
        """Remove expired entries and return count of removed items."""
        removed_count = 0
        current_time = datetime.utcnow()
        
        async with self._lock:
            keys_to_remove = []
            
            for key, entry in self._cache.items():
                if current_time > entry["expires_at"]:
                    keys_to_remove.append(key)
            
            for key in keys_to_remove:
                del self._cache[key]
                removed_count += 1
            
            if removed_count > 0:
                logger.info(f"Cleaned up {removed_count} expired cache entries")
        
        return removed_count


# Factory function to create cache with settings
def create_cache() -> InMemoryCache:
    """Create a cache instance."""
    return InMemoryCache()


class CacheCleanupTask:
    """Background task for periodic cache cleanup."""
    
    def __init__(self, cache: InMemoryCache, interval: int = 300):
        self.cache = cache
        self.interval = interval
        self._task: Optional[asyncio.Task] = None
        self._stop_event = asyncio.Event()
    
    async def start(self):
        """Start the cleanup task."""
        if self._task is not None:
            return
        
        self._task = asyncio.create_task(self._cleanup_loop())
        logger.info(f"Started cache cleanup task with {self.interval}s interval")
    
    async def stop(self):
        """Stop the cleanup task."""
        if self._task is None:
            return
        
        self._stop_event.set()
        await self._task
        self._task = None
        logger.info("Stopped cache cleanup task")
    
    async def _cleanup_loop(self):
        """Main cleanup loop."""
        try:
            while not self._stop_event.is_set():
                try:
                    await self.cache.cleanup_expired()
                except Exception as e:
                    logger.error(f"Error during cache cleanup: {e}")
                
                # Wait for interval or stop event
                try:
                    await asyncio.wait_for(
                        self._stop_event.wait(),
                        timeout=self.interval
                    )
                    break  # Stop event was set
                except asyncio.TimeoutError:
                    continue  # Continue with next cleanup cycle
                
        except asyncio.CancelledError:
            logger.info("Cache cleanup task was cancelled")
            raise
