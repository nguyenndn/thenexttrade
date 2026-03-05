import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AuthLayout from '@/app/auth/layout';

// Mock Logo
vi.mock('@/components/ui/Logo', () => ({
    Logo: () => <div data-testid="logo">Logo</div>,
}));

// Mock ThemeToggleSwitch
vi.mock('@/components/ui/ThemeToggleSwitch', () => ({
    ThemeToggleSwitch: () => <button data-testid="theme-toggle" aria-label="Toggle theme">Theme</button>,
}));

// Mock next/image
vi.mock('next/image', () => ({
    default: (props: any) => <img {...props} />,
}));

describe('Auth Layout', () => {
    it('renders children content', () => {
        render(
            <AuthLayout>
                <div data-testid="child-content">Hello</div>
            </AuthLayout>
        );
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
        expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('has "Back to Home" link pointing to /', () => {
        render(
            <AuthLayout>
                <div>Test</div>
            </AuthLayout>
        );
        const backLink = screen.getByText('Back to Home');
        expect(backLink).toBeInTheDocument();
        expect(backLink.closest('a')).toHaveAttribute('href', '/');
    });

    it('renders theme toggle switch', () => {
        render(
            <AuthLayout>
                <div>Test</div>
            </AuthLayout>
        );
        expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('renders right-side marketing panel content', () => {
        render(
            <AuthLayout>
                <div>Test</div>
            </AuthLayout>
        );
        // Right panel has marketing heading
        expect(screen.getByText(/build your trading/i)).toBeInTheDocument();
        expect(screen.getByText('Edge')).toBeInTheDocument();
        // Feature cards
        expect(screen.getByText('Data-Driven Insights')).toBeInTheDocument();
        expect(screen.getByText('Psychology Mastery')).toBeInTheDocument();
        expect(screen.getByText('Smart Trade Journal')).toBeInTheDocument();
    });
});
