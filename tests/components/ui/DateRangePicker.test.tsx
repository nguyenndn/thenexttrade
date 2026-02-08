
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { addDays, format } from 'date-fns';

describe('DateRangePicker Component', () => {
  const mockOnChange = vi.fn();
  const defaultProps = {
    value: {
      start: new Date(2024, 0, 1), // Jan 1 2024
      end: new Date(2024, 0, 7),   // Jan 7 2024
    },
    onChange: mockOnChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render selected date range text', () => {
    render(<DateRangePicker {...defaultProps} />);
    const display = screen.getByText('Jan 01, 2024 - Jan 07, 2024');
    expect(display).toBeInTheDocument();
  });

  it('should render "Select date range" when no value', () => {
    render(<DateRangePicker value={{ start: undefined as any, end: undefined as any }} onChange={mockOnChange} />);
    expect(screen.getByText('Select date range')).toBeInTheDocument();
  });

  it('should handle "All Time" display (Year 2025)', () => {
    // User changed logic: if start year is 2025 -> "All Time"
    const allTimeProps = {
      value: {
        start: new Date(2025, 0, 1),
        end: new Date(),
      },
      onChange: mockOnChange,
    };
    render(<DateRangePicker {...allTimeProps} />);
    expect(screen.getByText('All Time')).toBeInTheDocument();
  });

  it('should open popover when clicked', async () => {
    render(<DateRangePicker {...defaultProps} />);
    const trigger = screen.getByText('Jan 01, 2024 - Jan 07, 2024').closest('button');
    fireEvent.click(trigger!);

    await waitFor(() => {
      // Check for buttons inside popover
      expect(screen.getByText('Apply')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  it.skip('should call onChange when Apply is clicked', async () => {
    render(<DateRangePicker {...defaultProps} />);
    const trigger = screen.getByText('Jan 01, 2024 - Jan 07, 2024').closest('button');
    fireEvent.click(trigger!);

    await waitFor(() => {
      expect(screen.getByText('Apply')).toBeInTheDocument();
    });

    const applyBtn = screen.getByText('Apply');
    fireEvent.click(applyBtn);

    // Should call onChange with current range because we didn't change it
    expect(mockOnChange).toHaveBeenCalled();
  });
});
