/**
 * API client for weather service communication
 */

import axios from 'axios';

// Types matching backend domain entities
export interface CityWeather {
  city: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  condition: string;
  fetched_at: string;
  provider: 'weatherapi';
}

export interface ErrorResponse {
  code: string;
  message: string;
  details: Record<string, any>;
}

// API client configuration
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch weather data for a given city
 */
export async function getWeather(city: string): Promise<CityWeather> {
  try {
    const response = await api.get<CityWeather>('/weather', {
      params: { city: city.trim() },
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle HTTP error responses
      if (error.response?.data) {
        const errorData = error.response.data as ErrorResponse;
        throw new WeatherAPIError(
          errorData.message || 'Failed to fetch weather data',
          errorData.code || 'UNKNOWN_ERROR',
          error.response.status,
          errorData.details
        );
      }
      
      // Handle network errors
      if (error.code === 'ECONNABORTED') {
        throw new WeatherAPIError(
          'Request timed out. Please try again.',
          'TIMEOUT',
          408
        );
      }
      
      if (!error.response) {
        throw new WeatherAPIError(
          'Unable to connect to weather service. Please check your internet connection.',
          'NETWORK_ERROR',
          0
        );
      }
      
      // Handle HTTP errors without proper error response data
      throw new WeatherAPIError(
        'Failed to fetch weather data',
        'UNKNOWN_ERROR',
        error.response.status
      );
    }
    
    // Re-throw unknown errors
    throw error;
  }
}

/**
 * Custom error class for weather API errors
 */
export class WeatherAPIError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details: Record<string, any>;
  
  constructor(
    message: string, 
    code: string, 
    statusCode: number, 
    details: Record<string, any> = {}
  ) {
    super(message);
    this.name = 'WeatherAPIError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Check if error is a WeatherAPIError
 */
export function isWeatherAPIError(error: any): error is WeatherAPIError {
  return error instanceof WeatherAPIError;
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: any): string {
  if (isWeatherAPIError(error)) {
    switch (error.code) {
      case 'UNKNOWN_CITY':
        return 'City not found. Please check the spelling and try again.';
      case 'TIMEOUT':
        return 'Request timed out. Please try again.';
      case 'NETWORK_ERROR':
        return 'Unable to connect. Please check your internet connection.';
      case 'BAD_REQUEST':
        return error.message || 'Invalid request. Please check your input.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }
  
  return 'An unexpected error occurred. Please try again.';
}
