import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from '@/components/ui/StatusBadge';

describe('StatusBadge', () => {
    it('renders OPEN status correctly', () => {
        render(<StatusBadge status="OPEN" />);
        expect(screen.getByText('OPEN')).toBeInTheDocument();
        // Check for pulse animation class
        const badge = screen.getByText('OPEN').closest('span');
        expect(badge).toHaveClass('animate-pulse');
    });

    it('renders CLOSED status correctly', () => {
        render(<StatusBadge status="CLOSED" />);
        expect(screen.getByText('CLOSED')).toBeInTheDocument();
    });

    it('renders PENDING status correctly', () => {
        render(<StatusBadge status="PENDING" />);
        expect(screen.getByText('PENDING')).toBeInTheDocument();
    });
});
