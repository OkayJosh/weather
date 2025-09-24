/**
 * Main Weather App component
 * 
 * This component orchestrates the weather application, managing state
 * and coordinating between the form and display components.
 */

import React, { useState } from 'react';
import WeatherForm from './components/WeatherForm';
import WeatherCard from './components/WeatherCard';
import { getWeather, getErrorMessage, CityWeather } from './lib/api';
import './App.css';

function App() {
  const [weather, setWeather] = useState<CityWeather | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWeatherSearch = async (city: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const weatherData = await getWeather(city);
      setWeather(weatherData);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError(getErrorMessage(err));
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          🌤️ Weather App
        </h1>
        <p className="app-subtitle">
          Get current weather information for any city worldwide
        </p>
      </header>
      
      <main className="app-main">
        <div className="app-container">
          <WeatherForm 
            onSubmit={handleWeatherSearch}
            loading={loading}
            error={error}
          />
          
          {weather && !loading && (
            <div className="weather-result">
              <WeatherCard weather={weather} />
            </div>
          )}
          
          {!weather && !loading && !error && (
            <div className="app-welcome">
              <div className="welcome-content">
                <h2>Welcome to Weather App!</h2>
                <p>
                  Enter a city name above to get current weather conditions including
                  temperature, humidity, and wind speed.
                </p>
                <div className="features">
                  <div className="feature">
                    <span className="feature-icon">🌡️</span>
                    <span>Real-time temperature</span>
                  </div>
                  <div className="feature">
                    <span className="feature-icon">💧</span>
                    <span>Humidity levels</span>
                  </div>
                  <div className="feature">
                    <span className="feature-icon">💨</span>
                    <span>Wind speed</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <footer className="app-footer">
        <p>
          Powered by <strong>WeatherAPI</strong> | 
          Built with <strong>FastAPI</strong> & <strong>React</strong>
        </p>
      </footer>
    </div>
  );
}

export default App;
