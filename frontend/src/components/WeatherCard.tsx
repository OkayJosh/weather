/**
 * WeatherCard component for displaying weather information
 */

import type { CityWeather } from '../lib/api';

interface WeatherCardProps {
  weather: CityWeather;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ weather }) => {
  // Format the timestamp to a readable date
  const formatDate = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown';
    }
  };

  // Format temperature with proper symbol
  const formatTemperature = (temp: number): string => {
    return `${Math.round(temp)}°C`;
  };

  // Format wind speed
  const formatWindSpeed = (speed: number): string => {
    return `${speed.toFixed(1)} km/h`;
  };

  // Get weather condition icon/emoji based on condition text
  const getWeatherIcon = (condition: string): string => {
    const lowerCondition = condition.toLowerCase();
    
    if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) {
      return '☀️';
    } else if (lowerCondition.includes('cloud')) {
      return '☁️';
    } else if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
      return '🌧️';
    } else if (lowerCondition.includes('snow')) {
      return '❄️';
    } else if (lowerCondition.includes('thunder') || lowerCondition.includes('storm')) {
      return '⛈️';
    } else if (lowerCondition.includes('fog') || lowerCondition.includes('mist')) {
      return '🌫️';
    } else {
      return '🌤️';
    }
  };

  return (
    <div className="weather-card">
      <div className="weather-header">
        <h2 className="city-name">{weather.city}</h2>
        <div className="weather-icon" aria-hidden="true">
          {getWeatherIcon(weather.condition)}
        </div>
      </div>
      
      <div className="weather-main">
        <div className="temperature">
          {formatTemperature(weather.temperature)}
        </div>
        <div className="condition">
          {weather.condition}
        </div>
      </div>
      
      <div className="weather-details">
        <div className="detail-item">
          <span className="detail-label">Humidity</span>
          <span className="detail-value">{weather.humidity}%</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Wind Speed</span>
          <span className="detail-value">{formatWindSpeed(weather.wind_speed)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Data Source</span>
          <span className="detail-value">{weather.provider}</span>
        </div>
      </div>
      
      <div className="weather-footer">
        <small className="last-updated">
          Last updated: {formatDate(weather.fetched_at)}
        </small>
      </div>
    </div>
  );
};

export default WeatherCard;
