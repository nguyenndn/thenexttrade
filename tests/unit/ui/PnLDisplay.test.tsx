import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PnLDisplay } from '@/components/ui/PnLDisplay';

describe('PnLDisplay', () => {
    it('renders positive value correctly', () => {
        render(<PnLDisplay value={100} />);
        const element = screen.getByText('$100.00');
        expect(element).toBeInTheDocument();
        expect(element).toHaveClass('text-primary');
    });

    it('renders negative value correctly', () => {
        render(<PnLDisplay value={-50.5} />);
        const element = screen.getByText('-$50.50');
        expect(element).toBeInTheDocument();
        expect(element).toHaveClass('text-red-500');
    });

    it('renders zero value correctly', () => {
        render(<PnLDisplay value={0} />);
        const element = screen.getByText('$0.00');
        expect(element).toBeInTheDocument();
        expect(element).toHaveClass('text-gray-400');
    });

    it('renders with custom currency', () => {
        render(<PnLDisplay value={100} currency="€" />);
        expect(screen.getByText('€100.00')).toBeInTheDocument();
    });
});
