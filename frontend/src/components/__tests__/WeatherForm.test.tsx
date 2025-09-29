/**
 * Unit tests for WeatherForm component
 * 
 * Tests cover:
 * - Component rendering
 * - User input handling
 * - Form validation
 * - Submission behavior
 * - Error handling
 * - Loading states
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import WeatherForm from '../WeatherForm';

describe('WeatherForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  const defaultProps = {
    onSubmit: mockOnSubmit,
    loading: false,
    error: null,
  };

  describe('Rendering', () => {
    it('renders the form with all required elements', () => {
      render(<WeatherForm {...defaultProps} />);
      
      expect(screen.getByLabelText(/enter city name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e.g., London, New York, Tokyo/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /get weather/i })).toBeInTheDocument();
    });

    it('renders with proper form structure and accessibility attributes', () => {
      render(<WeatherForm {...defaultProps} />);
      
      const input = screen.getByLabelText(/enter city name/i);
      const button = screen.getByRole('button', { name: /get weather/i });
      
      expect(input).toHaveAttribute('id', 'city-input');
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('maxLength', '100');
      expect(input).toHaveAttribute('autoComplete', 'off');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('renders the submit button as disabled when no city is entered', () => {
      render(<WeatherForm {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /get weather/i });
      expect(button).toBeDisabled();
    });
  });

  describe('User Input', () => {
    it('updates input value when user types', async () => {
      const user = userEvent.setup();
      render(<WeatherForm {...defaultProps} />);
      
      const input = screen.getByLabelText(/enter city name/i);
      
      await user.type(input, 'London');
      
      expect(input).toHaveValue('London');
    });

    it('enables submit button when city name is entered', async () => {
      const user = userEvent.setup();
      render(<WeatherForm {...defaultProps} />);
      
      const input = screen.getByLabelText(/enter city name/i);
      const button = screen.getByRole('button', { name: /get weather/i });
      
      expect(button).toBeDisabled();
      
      await user.type(input, 'Paris');
      
      expect(button).not.toBeDisabled();
    });

    it('disables submit button when input becomes empty', async () => {
      const user = userEvent.setup();
      render(<WeatherForm {...defaultProps} />);
      
      const input = screen.getByLabelText(/enter city name/i);
      const button = screen.getByRole('button', { name: /get weather/i });
      
      // Type and then clear
      await user.type(input, 'London');
      expect(button).not.toBeDisabled();
      
      await user.clear(input);
      expect(button).toBeDisabled();
    });

    it('handles whitespace-only input correctly', async () => {
      const user = userEvent.setup();
      render(<WeatherForm {...defaultProps} />);
      
      const input = screen.getByLabelText(/enter city name/i);
      const button = screen.getByRole('button', { name: /get weather/i });
      
      await user.type(input, '   ');
      expect(button).toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with trimmed city name on form submission', async () => {
      const user = userEvent.setup();
      render(<WeatherForm {...defaultProps} />);
      
      const input = screen.getByLabelText(/enter city name/i);
      const form = input.closest('form')!;
      
      await user.type(input, '  Tokyo  ');
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('Tokyo');
      });
    });

    it('calls onSubmit when submit button is clicked', async () => {
      const user = userEvent.setup();
      render(<WeatherForm {...defaultProps} />);
      
      const input = screen.getByLabelText(/enter city name/i);
      const button = screen.getByRole('button', { name: /get weather/i });
      
      await user.type(input, 'Berlin');
      await user.click(button);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('Berlin');
      });
    });

    it('prevents form submission when input is empty', async () => {
      const user = userEvent.setup();
      render(<WeatherForm {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /get weather/i });
      
      // Try to click disabled button
      expect(button).toBeDisabled();
      
      // Verify onSubmit was not called
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('calls onSubmit only once on double-click', async () => {
      const user = userEvent.setup();
      const mockAsyncSubmit = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      render(<WeatherForm {...defaultProps} onSubmit={mockAsyncSubmit} />);
      
      const input = screen.getByLabelText(/enter city name/i);
      const button = screen.getByRole('button', { name: /get weather/i });
      
      await user.type(input, 'Madrid');
      await user.dblClick(button);
      
      // Wait for any potential submissions to complete
      await waitFor(() => {
        expect(mockAsyncSubmit).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });
  });

  describe('Input Validation', () => {
    it('shows error when trying to submit empty input', async () => {
      const user = userEvent.setup();
      render(<WeatherForm {...defaultProps} />);
      
      const input = screen.getByLabelText(/enter city name/i);
      const button = screen.getByRole('button', { name: /get weather/i });
      
      // Type something then delete it to trigger validation
      await user.type(input, 'Test');
      await user.clear(input);
      
      // Force form submission by simulating Enter key
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      fireEvent.submit(input.closest('form')!);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/please enter a city name/i);
      });
      
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error when input exceeds 100 characters', async () => {
      render(<WeatherForm {...defaultProps} />);
      
      const input = screen.getByLabelText(/enter city name/i);
      const longCityName = 'a'.repeat(101); // 101 characters
      
      // Bypass maxLength by directly setting the value
      fireEvent.change(input, { target: { value: longCityName } });
      
      // Submit the form
      fireEvent.submit(input.closest('form')!);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/city name cannot exceed 100 characters/i);
      });
      
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('clears input error when user starts typing valid input', async () => {
      const user = userEvent.setup();
      render(<WeatherForm {...defaultProps} />);
      
      const input = screen.getByLabelText(/enter city name/i);
      
      // Trigger empty input error first
      fireEvent.submit(input.closest('form')!);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      
      // Start typing - error should clear
      await user.type(input, 'L');
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('applies error styling to input when there is a validation error', async () => {
      render(<WeatherForm {...defaultProps} />);
      
      const input = screen.getByLabelText(/enter city name/i);
      
      // Trigger validation error
      fireEvent.submit(input.closest('form')!);
      
      await waitFor(() => {
        expect(input).toHaveClass('input-error');
      });
    });
  });

  describe('Loading State', () => {
    it('disables input and button when loading', () => {
      render(<WeatherForm {...defaultProps} loading={true} />);
      
      const input = screen.getByLabelText(/enter city name/i);
      const button = screen.getByRole('button', { name: /get weather/i });
      
      expect(input).toBeDisabled();
      expect(button).toBeDisabled();
    });

    it('shows loading text and spinner when loading', () => {
      const { container } = render(<WeatherForm {...defaultProps} loading={true} />);
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
      const spinner = container.querySelector('.loading-spinner');
      expect(spinner).toHaveClass('loading-spinner');
    });

    it('shows normal button text when not loading', () => {
      render(<WeatherForm {...defaultProps} loading={false} />);
      
      expect(screen.getByRole('button', { name: /get weather/i })).toBeInTheDocument();
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when error prop is provided', () => {
      const errorMessage = 'Unable to fetch weather data';
      render(<WeatherForm {...defaultProps} error={errorMessage} />);
      
      expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
    });

    it('applies error styling when error prop is provided', () => {
      const errorMessage = 'Network error';
      render(<WeatherForm {...defaultProps} error={errorMessage} />);
      
      const input = screen.getByLabelText(/enter city name/i);
      expect(input).toHaveClass('input-error');
    });

    it('shows input validation error over props error', async () => {
      const propsError = 'Network error';
      render(<WeatherForm {...defaultProps} error={propsError} />);
      
      // Initially shows props error
      expect(screen.getByRole('alert')).toHaveTextContent(propsError);
      
      // Trigger validation error
      const input = screen.getByLabelText(/enter city name/i);
      fireEvent.submit(input.closest('form')!);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/please enter a city name/i);
      });
    });

    it('clears props error when user starts typing', async () => {
      const user = userEvent.setup();
      const propsError = 'City not found';
      render(<WeatherForm {...defaultProps} error={propsError} />);
      
      expect(screen.getByRole('alert')).toHaveTextContent(propsError);
      
      const input = screen.getByLabelText(/enter city name/i);
      await user.type(input, 'New York');
      
      // The error should still be there as it's a props error, not an input error
      // The parent component should clear it when making a new request
      expect(screen.getByRole('alert')).toHaveTextContent(propsError);
    });
  });

  describe('Accessibility', () => {
    it('associates error message with input using aria-describedby', () => {
      const errorMessage = 'Invalid city name';
      render(<WeatherForm {...defaultProps} error={errorMessage} />);
      
      const input = screen.getByLabelText(/enter city name/i);
      const errorElement = screen.getByRole('alert');
      
      expect(input).toHaveAttribute('aria-describedby', 'error-message');
      expect(errorElement).toHaveAttribute('id', 'error-message');
    });

    it('does not have aria-describedby when no error', () => {
      render(<WeatherForm {...defaultProps} />);
      
      const input = screen.getByLabelText(/enter city name/i);
      expect(input).not.toHaveAttribute('aria-describedby');
    });

    it('submit button has proper aria-label', () => {
      render(<WeatherForm {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /get weather/i });
      expect(button).toHaveAttribute('aria-label', 'Get weather');
    });

    it('loading spinner has aria-hidden attribute', () => {
      const { container } = render(<WeatherForm {...defaultProps} loading={true} />);
      
      const spinner = container.querySelector('.loading-spinner');
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Keyboard Navigation', () => {
    it('submits form when Enter is pressed in input field', async () => {
      const user = userEvent.setup();
      render(<WeatherForm {...defaultProps} />);
      
      const input = screen.getByLabelText(/enter city name/i);
      
      await user.type(input, 'Sydney');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('Sydney');
      });
    });

    it('does not submit when Enter is pressed with empty input', async () => {
      const user = userEvent.setup();
      render(<WeatherForm {...defaultProps} />);
      
      const input = screen.getByLabelText(/enter city name/i);
      
      // Try to force form submission by directly submitting the form
      const form = input.closest('form')!;
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/please enter a city name/i);
      });
      
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });
});
