import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Logo } from '@/components/ui/Logo';

describe('Logo Component', () => {
    it('renders and links to homepage', () => {
        render(<Logo />);
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/');
    });

    it('renders brand text "TheNextTrade"', () => {
        render(<Logo />);
        expect(screen.getByText(/TheNext/)).toBeInTheDocument();
        expect(screen.getByText('Trade')).toBeInTheDocument();
    });

    it('renders the TrendingUp icon container', () => {
        render(<Logo />);
        // Icon is inside a div with bg-primary class
        const iconContainer = document.querySelector('.bg-primary');
        expect(iconContainer).toBeInTheDocument();
    });
});
