import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PaginationControl } from '@/components/ui/PaginationControl';

describe('PaginationControl', () => {
    const defaultProps = {
        currentPage: 1,
        totalPages: 10,
        pageSize: 10,
        totalItems: 100,
        onPageChange: vi.fn(),
        onPageSizeChange: vi.fn(),
        itemName: 'items',
    };

    it('renders correctly', () => {
        render(<PaginationControl {...defaultProps} />);

        // Check for text parts
        expect(screen.getByText(/Showing/i)).toBeInTheDocument();
        expect(screen.getByText('1-10')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();

        // Page 1 should be there
        expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();

        // Page 10 should be there (last page)
        // Find by text content because getByRole might be ambiguous with pageSize selector
        const buttons = screen.getAllByRole('button');
        const page10Button = buttons.find(b => b.textContent === '10');
        expect(page10Button).toBeInTheDocument();
    });

    it('handles page change', () => {
        render(<PaginationControl {...defaultProps} />);
        const page2Button = screen.getByRole('button', { name: '2' });
        fireEvent.click(page2Button);
        expect(defaultProps.onPageChange).toHaveBeenCalledWith(2);
    });

    it('disables prev button on first page', () => {
        render(<PaginationControl {...defaultProps} currentPage={1} />);
        const buttons = screen.getAllByRole('button');
        // Filter disabled buttons
        const disabled = buttons.filter(b => b.hasAttribute('disabled'));
        expect(disabled.length).toBeGreaterThan(0);
    });

    it('disables next button on last page', () => {
        render(<PaginationControl {...defaultProps} currentPage={10} />);
        const buttons = screen.getAllByRole('button');
        const disabled = buttons.filter(b => b.hasAttribute('disabled'));
        expect(disabled.length).toBeGreaterThan(0);
    });
});
