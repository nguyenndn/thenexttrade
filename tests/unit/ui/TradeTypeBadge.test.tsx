import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TradeTypeBadge } from '@/components/ui/TradeTypeBadge';

describe('TradeTypeBadge', () => {
    it('renders BUY badge correctly', () => {
        render(<TradeTypeBadge type="BUY" />);
        const badge = screen.getByText('BUY');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass('text-blue-600');
    });

    it('renders SELL badge correctly', () => {
        render(<TradeTypeBadge type="SELL" />);
        const badge = screen.getByText('SELL');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass('text-orange-600');
    });
});
