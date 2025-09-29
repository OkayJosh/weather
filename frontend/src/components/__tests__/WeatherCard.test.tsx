/**
 * Unit tests for WeatherCard component
 * 
 * Tests cover:
 * - Component rendering
 * - Data display formatting
 * - Weather icon mapping
 * - Accessibility features
 * - Edge cases and error handling
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import WeatherCard from '../WeatherCard';
import type { CityWeather } from '../../lib/api';

describe('WeatherCard', () => {
  const mockWeatherData: CityWeather = {
    city: 'London',
    temperature: 22.5,
    humidity: 65,
    wind_speed: 12.7,
    condition: 'Partly cloudy',
    fetched_at: '2024-01-15T10:30:00.000Z',
    provider: 'weatherapi',
  };

  describe('Rendering', () => {
    it('renders all weather information correctly', () => {
      render(<WeatherCard weather={mockWeatherData} />);
      
      expect(screen.getByText('London')).toBeInTheDocument();
      expect(screen.getByText('23°C')).toBeInTheDocument(); // Rounded temperature
      expect(screen.getByText('Partly cloudy')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
      expect(screen.getByText('12.7 km/h')).toBeInTheDocument();
      expect(screen.getByText('weatherapi')).toBeInTheDocument();
    });

    it('renders with proper structure and CSS classes', () => {
      render(<WeatherCard weather={mockWeatherData} />);
      
      expect(screen.getByText('London')).toHaveClass('city-name');
      expect(screen.getByText('23°C')).toHaveClass('temperature');
      expect(screen.getByText('Partly cloudy')).toHaveClass('condition');
      
      // Check for weather details structure
      expect(screen.getByText('Humidity')).toHaveClass('detail-label');
      expect(screen.getByText('65%')).toHaveClass('detail-value');
      expect(screen.getByText('Wind Speed')).toHaveClass('detail-label');
      expect(screen.getByText('12.7 km/h')).toHaveClass('detail-value');
      expect(screen.getByText('Data Source')).toHaveClass('detail-label');
      expect(screen.getByText('weatherapi')).toHaveClass('detail-value');
    });

    it('renders the weather card with main container', () => {
      const { container } = render(<WeatherCard weather={mockWeatherData} />);
      
      expect(container.firstChild).toHaveClass('weather-card');
    });
  });

  describe('Temperature Formatting', () => {
    it('rounds temperature to nearest integer', () => {
      const weatherData = { ...mockWeatherData, temperature: 22.7 };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText('23°C')).toBeInTheDocument();
    });

    it('handles negative temperatures correctly', () => {
      const weatherData = { ...mockWeatherData, temperature: -5.3 };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText('-5°C')).toBeInTheDocument();
    });

    it('handles zero temperature correctly', () => {
      const weatherData = { ...mockWeatherData, temperature: 0.0 };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText('0°C')).toBeInTheDocument();
    });

    it('handles very high temperatures', () => {
      const weatherData = { ...mockWeatherData, temperature: 45.9 };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText('46°C')).toBeInTheDocument();
    });
  });

  describe('Wind Speed Formatting', () => {
    it('displays wind speed with one decimal place', () => {
      render(<WeatherCard weather={mockWeatherData} />);
      
      expect(screen.getByText('12.7 km/h')).toBeInTheDocument();
    });

    it('handles integer wind speeds', () => {
      const weatherData = { ...mockWeatherData, wind_speed: 15 };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText('15.0 km/h')).toBeInTheDocument();
    });

    it('handles zero wind speed', () => {
      const weatherData = { ...mockWeatherData, wind_speed: 0 };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText('0.0 km/h')).toBeInTheDocument();
    });

    it('handles high wind speeds', () => {
      const weatherData = { ...mockWeatherData, wind_speed: 89.6 };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText('89.6 km/h')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('formats valid ISO date correctly', () => {
      render(<WeatherCard weather={mockWeatherData} />);
      
      // Check that some form of date is displayed (exact format may vary by locale)
      expect(screen.getByText(/last updated:/i)).toBeInTheDocument();
      expect(screen.getByText(/january.*15.*2024/i)).toBeInTheDocument();
    });

    it('handles invalid date strings gracefully', () => {
      const weatherData = { ...mockWeatherData, fetched_at: 'invalid-date' };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText(/last updated: unknown/i)).toBeInTheDocument();
    });

    it('handles empty date strings', () => {
      const weatherData = { ...mockWeatherData, fetched_at: '' };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText(/last updated: unknown/i)).toBeInTheDocument();
    });
  });

  describe('Weather Icons', () => {
    it('shows sun icon for sunny conditions', () => {
      const weatherData = { ...mockWeatherData, condition: 'Sunny' };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText('☀️')).toBeInTheDocument();
    });

    it('shows sun icon for clear conditions', () => {
      const weatherData = { ...mockWeatherData, condition: 'Clear' };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText('☀️')).toBeInTheDocument();
    });

    it('shows cloud icon for cloudy conditions', () => {
      const weatherData = { ...mockWeatherData, condition: 'Cloudy' };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText('☁️')).toBeInTheDocument();
    });

    it('shows rain icon for rainy conditions', () => {
      const weatherData = { ...mockWeatherData, condition: 'Light rain' };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText('🌧️')).toBeInTheDocument();
    });

    it('shows rain icon for drizzle conditions', () => {
      const weatherData = { ...mockWeatherData, condition: 'Patchy light drizzle' };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText('🌧️')).toBeInTheDocument();
    });

    it('shows snow icon for snowy conditions', () => {
      const weatherData = { ...mockWeatherData, condition: 'Light snow' };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText('❄️')).toBeInTheDocument();
    });

    it('shows thunder icon for thunderstorm conditions', () => {
      const weatherData = { ...mockWeatherData, condition: 'Thundery outbreaks possible' };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText('⛈️')).toBeInTheDocument();
    });

    it('shows thunder icon for storm conditions', () => {
      const weatherData = { ...mockWeatherData, condition: 'Moderate or heavy snow with thunder' };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText('⛈️')).toBeInTheDocument();
    });

    it('shows fog icon for foggy conditions', () => {
      const weatherData = { ...mockWeatherData, condition: 'Fog' };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText('🌫️')).toBeInTheDocument();
    });

    it('shows fog icon for misty conditions', () => {
      const weatherData = { ...mockWeatherData, condition: 'Mist' };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText('🌫️')).toBeInTheDocument();
    });

    it('shows default icon for unknown conditions', () => {
      const weatherData = { ...mockWeatherData, condition: 'Unknown weather condition' };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText('🌤️')).toBeInTheDocument();
    });

    it('handles case-insensitive condition matching', () => {
      const weatherData = { ...mockWeatherData, condition: 'SUNNY' };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText('☀️')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('displays humidity as percentage', () => {
      render(<WeatherCard weather={mockWeatherData} />);
      
      expect(screen.getByText('Humidity')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
    });

    it('handles edge case humidity values', () => {
      const weatherData = { ...mockWeatherData, humidity: 0 };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('handles maximum humidity', () => {
      const weatherData = { ...mockWeatherData, humidity: 100 };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('displays provider information', () => {
      render(<WeatherCard weather={mockWeatherData} />);
      
      expect(screen.getByText('Data Source')).toBeInTheDocument();
      expect(screen.getByText('weatherapi')).toBeInTheDocument();
    });
  });

  describe('City Name Display', () => {
    it('handles city names with special characters', () => {
      const weatherData = { ...mockWeatherData, city: 'São Paulo' };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText('São Paulo')).toBeInTheDocument();
    });

    it('handles very long city names', () => {
      const weatherData = { 
        ...mockWeatherData, 
        city: 'Krungthepmahanakhon Amonrattanakosin Mahintharayutthaya Mahadilokphop'
      };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText(/Krungthepmahanakhon/)).toBeInTheDocument();
    });

    it('handles city names with numbers', () => {
      const weatherData = { ...mockWeatherData, city: 'New York City 5' };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText('New York City 5')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes for weather icon', () => {
      const { container } = render(<WeatherCard weather={mockWeatherData} />);
      
      const weatherIconContainer = container.querySelector('.weather-icon');
      expect(weatherIconContainer).toHaveAttribute('aria-hidden', 'true');
    });

    it('uses proper heading hierarchy', () => {
      render(<WeatherCard weather={mockWeatherData} />);
      
      const cityHeading = screen.getByRole('heading', { level: 2 });
      expect(cityHeading).toHaveTextContent('London');
    });

    it('has semantic structure with labels and values', () => {
      render(<WeatherCard weather={mockWeatherData} />);
      
      // Check that detail labels and values are properly paired
      expect(screen.getByText('Humidity')).toBeInTheDocument();
      expect(screen.getByText('Wind Speed')).toBeInTheDocument();
      expect(screen.getByText('Data Source')).toBeInTheDocument();
      
      // Values should be next to their labels
      const humidityLabel = screen.getByText('Humidity');
      const humidityValue = screen.getByText('65%');
      expect(humidityLabel.nextElementSibling).toBe(humidityValue);
    });
  });

  describe('Edge Cases', () => {
    it('handles extreme weather conditions', () => {
      const extremeWeather = {
        ...mockWeatherData,
        temperature: -40,
        humidity: 5,
        wind_speed: 150.5,
        condition: 'Blizzard',
      };
      
      render(<WeatherCard weather={extremeWeather} />);
      
      expect(screen.getByText('-40°C')).toBeInTheDocument();
      expect(screen.getByText('5%')).toBeInTheDocument();
      expect(screen.getByText('150.5 km/h')).toBeInTheDocument();
      expect(screen.getByText('Blizzard')).toBeInTheDocument();
    });

    it('handles empty or minimal condition strings', () => {
      const weatherData = { ...mockWeatherData, condition: '' };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText('🌤️')).toBeInTheDocument(); // Default icon
    });

    it('handles floating point precision in temperature', () => {
      const weatherData = { ...mockWeatherData, temperature: 22.999999 };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText('23°C')).toBeInTheDocument();
    });

    it('handles floating point precision in wind speed', () => {
      const weatherData = { ...mockWeatherData, wind_speed: 12.99999 };
      render(<WeatherCard weather={weatherData} />);
      
      expect(screen.getByText('13.0 km/h')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('has all required sections', () => {
      const { container } = render(<WeatherCard weather={mockWeatherData} />);
      
      expect(container.querySelector('.weather-header')).toBeInTheDocument();
      expect(container.querySelector('.weather-main')).toBeInTheDocument();
      expect(container.querySelector('.weather-details')).toBeInTheDocument();
      expect(container.querySelector('.weather-footer')).toBeInTheDocument();
    });

    it('contains the expected number of detail items', () => {
      const { container } = render(<WeatherCard weather={mockWeatherData} />);
      
      const detailItems = container.querySelectorAll('.detail-item');
      expect(detailItems).toHaveLength(3); // Humidity, Wind Speed, Data Source
    });

    it('has proper footer with last updated information', () => {
      render(<WeatherCard weather={mockWeatherData} />);
      
      expect(screen.getByText(/last updated:/i)).toBeInTheDocument();
      expect(screen.getByText(/last updated:/i).tagName.toLowerCase()).toBe('small');
    });
  });
});
