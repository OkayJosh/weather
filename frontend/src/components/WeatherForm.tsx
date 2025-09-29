/**
 * WeatherForm component for city input and weather data fetching
 */

import { useState, type FormEvent, type ChangeEvent } from 'react';

interface WeatherFormProps {
  onSubmit: (city: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const WeatherForm = ({ onSubmit, loading, error }: WeatherFormProps) => {
  const [city, setCity] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting || loading) {
      return;
    }
    
    // Clear previous input error
    setInputError(null);
    
    // Validate input
    const trimmedCity = city.trim();
    
    if (!trimmedCity) {
      setInputError('Please enter a city name');
      return;
    }
    
    if (trimmedCity.length > 100) {
      setInputError('City name cannot exceed 100 characters');
      return;
    }
    
    // Submit the form
    setIsSubmitting(true);
    try {
      await onSubmit(trimmedCity);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCity(value);
    
    // Clear input error when user starts typing
    if (inputError && value.trim()) {
      setInputError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="weather-form">
      <div className="form-group">
        <label htmlFor="city-input" className="form-label">
          Enter City Name
        </label>
        <div className="input-container">
          <input
            id="city-input"
            type="text"
            value={city}
            onChange={handleInputChange}
            placeholder="e.g., London, New York, Tokyo"
            className={`form-input ${inputError || error ? 'input-error' : ''}`}
            disabled={loading}
            maxLength={100}
            autoComplete="off"
            aria-describedby={inputError || error ? 'error-message' : undefined}
          />
          <button
            type="submit"
            disabled={loading || isSubmitting || !city.trim()}
            className="submit-button"
            aria-label="Get weather"
          >
            {loading ? (
              <>
                <span className="loading-spinner" aria-hidden="true" />
                Loading...
              </>
            ) : (
              'Get Weather'
            )}
          </button>
        </div>
      </div>
      
      {(inputError || error) && (
        <div id="error-message" className="error-message" role="alert">
          {inputError || error}
        </div>
      )}
    </form>
  );
};

export default WeatherForm;
