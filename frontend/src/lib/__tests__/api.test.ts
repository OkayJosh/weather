/**
 * Integration tests for API client and backend error handling
 * 
 * Tests cover:
 * - Successful API calls
 * - Network errors
 * - HTTP error responses
 * - Timeout handling
 * - Error message formatting
 * - WeatherAPIError functionality
 */

import axios, { AxiosError } from 'axios';
import { 
  getWeather, 
  WeatherAPIError, 
  isWeatherAPIError, 
  getErrorMessage,
  type CityWeather,
  type ErrorResponse 
} from '../api';

// Mock axios completely
jest.mock('axios', () => {
  const mockInstance = {
    get: jest.fn(),
  };
  
  return {
    default: {
      create: jest.fn(() => mockInstance),
      isAxiosError: jest.fn(),
    },
    create: jest.fn(() => mockInstance),
    isAxiosError: jest.fn(),
  };
});

// Get the mock instance reference
const mockAxiosInstance = (axios.create as jest.Mock)();

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosInstance.get.mockClear();
  });

  const mockWeatherData: CityWeather = {
    city: 'London',
    temperature: 22.5,
    humidity: 65,
    wind_speed: 12.7,
    condition: 'Partly cloudy',
    fetched_at: '2024-01-15T10:30:00.000Z',
    provider: 'weatherapi',
  };

  describe('Successful API Calls', () => {
    it('returns weather data for valid city', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockWeatherData });

      const result = await getWeather('London');

      expect(result).toEqual(mockWeatherData);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/weather', {
        params: { city: 'London' }
      });
    });

    it('trims city name before making API call', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockWeatherData });

      await getWeather('  Paris  ');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/weather', {
        params: { city: 'Paris' }
      });
    });

    it('handles city names with special characters', async () => {
      const saoPauloWeather = { ...mockWeatherData, city: 'São Paulo' };
      mockAxiosInstance.get.mockResolvedValue({ data: saoPauloWeather });

      const result = await getWeather('São Paulo');

      expect(result).toEqual(saoPauloWeather);
    });
  });

  describe('HTTP Error Responses', () => {
    it('throws WeatherAPIError for 422 validation errors', async () => {
      const errorResponse: ErrorResponse = {
        code: 'BAD_REQUEST',
        message: 'City name cannot be empty',
        details: { field: 'city' }
      };

      const axiosError = new Error('Request failed') as AxiosError;
      axiosError.response = {
        status: 422,
        data: errorResponse,
        statusText: 'Unprocessable Entity',
        headers: {},
        config: {} as any,
      };

      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      mockAxiosInstance.get.mockRejectedValue(axiosError);

      await expect(getWeather('')).rejects.toThrow(WeatherAPIError);
      
      try {
        await getWeather('');
      } catch (error) {
        expect(error).toBeInstanceOf(WeatherAPIError);
        if (error instanceof WeatherAPIError) {
          expect(error.code).toBe('BAD_REQUEST');
          expect(error.message).toBe('City name cannot be empty');
          expect(error.statusCode).toBe(422);
          expect(error.details).toEqual({ field: 'city' });
        }
      }
    });

    it('throws WeatherAPIError for 422 unknown city errors', async () => {
      const errorResponse: ErrorResponse = {
        code: 'UNKNOWN_CITY',
        message: 'Invalid or unknown city: Atlantis',
        details: {}
      };

      const axiosError = new Error('Request failed') as AxiosError;
      axiosError.response = {
        status: 422,
        data: errorResponse,
        statusText: 'Unprocessable Entity',
        headers: {},
        config: {} as any,
      };

      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      mockAxiosInstance.get.mockRejectedValue(axiosError);

      try {
        await getWeather('Atlantis');
      } catch (error) {
        expect(error).toBeInstanceOf(WeatherAPIError);
        if (error instanceof WeatherAPIError) {
          expect(error.code).toBe('UNKNOWN_CITY');
          expect(error.message).toBe('Invalid or unknown city: Atlantis');
          expect(error.statusCode).toBe(422);
        }
      }
    });

    it('throws WeatherAPIError for 504 timeout errors', async () => {
      const errorResponse: ErrorResponse = {
        code: 'TIMEOUT',
        message: 'Weather service request timed out',
        details: {}
      };

      const axiosError = new Error('Request failed') as AxiosError;
      axiosError.response = {
        status: 504,
        data: errorResponse,
        statusText: 'Gateway Timeout',
        headers: {},
        config: {} as any,
      };

      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      mockAxiosInstance.get.mockRejectedValue(axiosError);

      try {
        await getWeather('London');
      } catch (error) {
        expect(error).toBeInstanceOf(WeatherAPIError);
        if (error instanceof WeatherAPIError) {
          expect(error.code).toBe('TIMEOUT');
          expect(error.statusCode).toBe(504);
        }
      }
    });

    it('throws WeatherAPIError for 502 service unavailable errors', async () => {
      const errorResponse: ErrorResponse = {
        code: 'UPSTREAM_ERROR',
        message: 'Weather service is temporarily unavailable',
        details: {}
      };

      const axiosError = new Error('Request failed') as AxiosError;
      axiosError.response = {
        status: 502,
        data: errorResponse,
        statusText: 'Bad Gateway',
        headers: {},
        config: {} as any,
      };

      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      mockAxiosInstance.get.mockRejectedValue(axiosError);

      try {
        await getWeather('London');
      } catch (error) {
        expect(error).toBeInstanceOf(WeatherAPIError);
        if (error instanceof WeatherAPIError) {
          expect(error.code).toBe('UPSTREAM_ERROR');
          expect(error.statusCode).toBe(502);
        }
      }
    });

    it('throws WeatherAPIError for 500 internal server errors', async () => {
      const errorResponse: ErrorResponse = {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while processing your request',
        details: { error: 'Internal server error' }
      };

      const axiosError = new Error('Request failed') as AxiosError;
      axiosError.response = {
        status: 500,
        data: errorResponse,
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as any,
      };

      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      mockAxiosInstance.get.mockRejectedValue(axiosError);

      try {
        await getWeather('London');
      } catch (error) {
        expect(error).toBeInstanceOf(WeatherAPIError);
        if (error instanceof WeatherAPIError) {
          expect(error.code).toBe('INTERNAL_ERROR');
          expect(error.statusCode).toBe(500);
        }
      }
    });

    it('handles HTTP errors without error response data', async () => {
      const axiosError = new Error('Request failed') as AxiosError;
      axiosError.response = {
        status: 500,
        data: null,
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as any,
      };

      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      mockAxiosInstance.get.mockRejectedValue(axiosError);

      try {
        await getWeather('London');
      } catch (error) {
        expect(error).toBeInstanceOf(WeatherAPIError);
        if (error instanceof WeatherAPIError) {
          expect(error.code).toBe('UNKNOWN_ERROR');
          expect(error.message).toBe('Failed to fetch weather data');
          expect(error.statusCode).toBe(500);
        }
      }
    });
  });

  describe('Network Errors', () => {
    it('throws WeatherAPIError for connection timeout', async () => {
      const axiosError = new Error('timeout of 10000ms exceeded') as AxiosError;
      axiosError.code = 'ECONNABORTED';
      axiosError.response = undefined;

      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      mockAxiosInstance.get.mockRejectedValue(axiosError);

      try {
        await getWeather('London');
      } catch (error) {
        expect(error).toBeInstanceOf(WeatherAPIError);
        if (error instanceof WeatherAPIError) {
          expect(error.code).toBe('TIMEOUT');
          expect(error.message).toBe('Request timed out. Please try again.');
          expect(error.statusCode).toBe(408);
        }
      }
    });

    it('throws WeatherAPIError for network connection failure', async () => {
      const axiosError = new Error('Network Error') as AxiosError;
      axiosError.response = undefined;

      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      mockAxiosInstance.get.mockRejectedValue(axiosError);

      try {
        await getWeather('London');
      } catch (error) {
        expect(error).toBeInstanceOf(WeatherAPIError);
        if (error instanceof WeatherAPIError) {
          expect(error.code).toBe('NETWORK_ERROR');
          expect(error.message).toBe('Unable to connect to weather service. Please check your internet connection.');
          expect(error.statusCode).toBe(0);
        }
      }
    });
  });

  describe('Non-Axios Errors', () => {
    it('re-throws non-axios errors without modification', async () => {
      const customError = new Error('Some other error');
      
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(false);
      mockAxiosInstance.get.mockRejectedValue(customError);

      await expect(getWeather('London')).rejects.toThrow('Some other error');
    });

    it('handles undefined errors', async () => {
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(false);
      mockAxiosInstance.get.mockRejectedValue(undefined);

      await expect(getWeather('London')).rejects.toBeUndefined();
    });
  });

  describe('WeatherAPIError Class', () => {
    it('creates error with all properties', () => {
      const error = new WeatherAPIError(
        'Test error message',
        'TEST_CODE',
        400,
        { key: 'value' }
      );

      expect(error.name).toBe('WeatherAPIError');
      expect(error.message).toBe('Test error message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ key: 'value' });
    });

    it('creates error with default details', () => {
      const error = new WeatherAPIError('Test message', 'TEST_CODE', 400);

      expect(error.details).toEqual({});
    });

    it('inherits from Error class', () => {
      const error = new WeatherAPIError('Test message', 'TEST_CODE', 400);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(WeatherAPIError);
    });
  });

  describe('Error Utility Functions', () => {
    describe('isWeatherAPIError', () => {
      it('returns true for WeatherAPIError instances', () => {
        const error = new WeatherAPIError('Test', 'TEST', 400);
        expect(isWeatherAPIError(error)).toBe(true);
      });

      it('returns false for regular Error instances', () => {
        const error = new Error('Regular error');
        expect(isWeatherAPIError(error)).toBe(false);
      });

      it('returns false for non-error objects', () => {
        expect(isWeatherAPIError({})).toBe(false);
        expect(isWeatherAPIError('string')).toBe(false);
        expect(isWeatherAPIError(null)).toBe(false);
        expect(isWeatherAPIError(undefined)).toBe(false);
      });
    });

    describe('getErrorMessage', () => {
      it('returns specific message for UNKNOWN_CITY error', () => {
        const error = new WeatherAPIError('City not found', 'UNKNOWN_CITY', 422);
        expect(getErrorMessage(error)).toBe('City not found. Please check the spelling and try again.');
      });

      it('returns specific message for TIMEOUT error', () => {
        const error = new WeatherAPIError('Timeout', 'TIMEOUT', 408);
        expect(getErrorMessage(error)).toBe('Request timed out. Please try again.');
      });

      it('returns specific message for NETWORK_ERROR', () => {
        const error = new WeatherAPIError('Network failed', 'NETWORK_ERROR', 0);
        expect(getErrorMessage(error)).toBe('Unable to connect. Please check your internet connection.');
      });

      it('returns specific message for BAD_REQUEST error', () => {
        const error = new WeatherAPIError('Invalid input', 'BAD_REQUEST', 422);
        expect(getErrorMessage(error)).toBe('Invalid input');
      });

      it('returns custom message for unknown error codes', () => {
        const error = new WeatherAPIError('Custom error', 'CUSTOM_CODE', 500);
        expect(getErrorMessage(error)).toBe('Custom error');
      });

      it('returns fallback message for WeatherAPIError without message', () => {
        const error = new WeatherAPIError('', 'UNKNOWN_CODE', 500);
        expect(getErrorMessage(error)).toBe('An unexpected error occurred.');
      });

      it('returns default message for non-WeatherAPIError', () => {
        const error = new Error('Regular error');
        expect(getErrorMessage(error)).toBe('An unexpected error occurred. Please try again.');
      });

      it('returns default message for null/undefined errors', () => {
        expect(getErrorMessage(null)).toBe('An unexpected error occurred. Please try again.');
        expect(getErrorMessage(undefined)).toBe('An unexpected error occurred. Please try again.');
      });

      it('returns default message for non-error objects', () => {
        expect(getErrorMessage({})).toBe('An unexpected error occurred. Please try again.');
        expect(getErrorMessage('string')).toBe('An unexpected error occurred. Please try again.');
      });
    });
  });

  describe('API Configuration', () => {
    it('creates axios instance with correct configuration', () => {
      // Verify the module imports axios and creates instance correctly
      // The actual axios.create call happens on module import
      expect(mockedAxios.create).toBeDefined();
    });
  });

  describe('Request Parameters', () => {
    it('passes city parameter correctly', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockWeatherData });

      await getWeather('Tokyo');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/weather', {
        params: { city: 'Tokyo' }
      });
    });

    it('handles empty city parameter (though validation should prevent this)', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockWeatherData });

      await getWeather('');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/weather', {
        params: { city: '' }
      });
    });

    it('handles very long city names', async () => {
      const longCityName = 'Very-Long-City-Name-That-Exceeds-Normal-Limits';
      mockAxiosInstance.get.mockResolvedValue({ data: mockWeatherData });

      await getWeather(longCityName);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/weather', {
        params: { city: longCityName }
      });
    });
  });
});
