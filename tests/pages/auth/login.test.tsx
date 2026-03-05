import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '@/app/auth/login/page';

// Mock auth actions
const mockLogin = vi.fn();
vi.mock('@/app/auth/actions', () => ({
    login: (...args: any[]) => mockLogin(...args),
}));

// Mock Logo component
vi.mock('@/components/ui/Logo', () => ({
    Logo: () => <div data-testid="logo">Logo</div>,
}));

describe('Login Page', () => {
    beforeEach(() => {
        mockLogin.mockReset();
    });

    it('renders the login form with email and password fields', () => {
        render(<LoginPage />);
        expect(screen.getByPlaceholderText('hello@example.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });

    it('renders the Login button with submit type', () => {
        render(<LoginPage />);
        const button = screen.getByRole('button', { name: /^login$/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('type', 'submit');
    });

    it('renders the heading "Login to your account"', () => {
        render(<LoginPage />);
        expect(screen.getByText('Login to your account')).toBeInTheDocument();
    });

    it('renders logo component', () => {
        render(<LoginPage />);
        expect(screen.getByTestId('logo')).toBeInTheDocument();
    });

    it('toggles password visibility', () => {
        render(<LoginPage />);
        const toggleBtn = screen.getByRole('button', { name: /show password/i });
        expect(toggleBtn).toBeInTheDocument();

        fireEvent.click(toggleBtn);
        expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();
    });

    it('shows error message on failed login', async () => {
        mockLogin.mockResolvedValue({ error: 'Invalid email or password' });

        render(<LoginPage />);

        fireEvent.change(screen.getByPlaceholderText('hello@example.com'), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
        fireEvent.submit(screen.getByRole('button', { name: /^login$/i }));

        await waitFor(() => {
            expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
        });
    });

    it('has link to forgot password page', () => {
        render(<LoginPage />);
        const forgotLink = screen.getByText('Forgot your password?');
        expect(forgotLink).toBeInTheDocument();
        expect(forgotLink.closest('a')).toHaveAttribute('href', '/auth/forgot-password');
    });

    it('has link to signup page', () => {
        render(<LoginPage />);
        const signupLink = screen.getByText('Sign up');
        expect(signupLink).toBeInTheDocument();
        expect(signupLink.closest('a')).toHaveAttribute('href', '/auth/signup');
    });

    it('calls login action with form data on submit', async () => {
        mockLogin.mockResolvedValue({});

        render(<LoginPage />);

        fireEvent.change(screen.getByPlaceholderText('hello@example.com'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'mypassword' } });
        fireEvent.submit(screen.getByRole('button', { name: /^login$/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledTimes(1);
            const formData = mockLogin.mock.calls[0][0];
            expect(formData).toBeInstanceOf(FormData);
        });
    });

    it('redirects to /auth/verify-2fa when login requires 2FA', async () => {
        mockLogin.mockResolvedValue({ requires2FA: true });

        // Mock window.location
        const originalLocation = window.location;
        Object.defineProperty(window, 'location', {
            writable: true,
            value: { ...originalLocation, href: '' },
        });

        render(<LoginPage />);

        fireEvent.change(screen.getByPlaceholderText('hello@example.com'), { target: { value: 'user@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'pass123' } });
        fireEvent.submit(screen.getByRole('button', { name: /^login$/i }));

        await waitFor(() => {
            expect(window.location.href).toBe('/auth/verify-2fa');
        });

        // Restore
        Object.defineProperty(window, 'location', { writable: true, value: originalLocation });
    });
});
