import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ForgotPasswordPage from '@/app/auth/forgot-password/page';

// Mock auth actions
const mockForgotPassword = vi.fn();
vi.mock('@/app/auth/actions', () => ({
    forgotPassword: (...args: any[]) => mockForgotPassword(...args),
}));

// Mock Logo
vi.mock('@/components/ui/Logo', () => ({
    Logo: () => <div data-testid="logo">Logo</div>,
}));

describe('Forgot Password Page', () => {
    beforeEach(() => {
        mockForgotPassword.mockReset();
    });

    it('renders the "Reset Password" heading', () => {
        render(<ForgotPasswordPage />);
        expect(screen.getByText('Reset Password')).toBeInTheDocument();
    });

    it('renders email input field', () => {
        render(<ForgotPasswordPage />);
        const emailInput = screen.getByPlaceholderText('name@example.com');
        expect(emailInput).toBeInTheDocument();
        expect(emailInput).toHaveAttribute('type', 'email');
        expect(emailInput).toBeRequired();
    });

    it('renders the "Send Reset Link" submit button', () => {
        render(<ForgotPasswordPage />);
        const button = screen.getByRole('button', { name: /send reset link/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('type', 'submit');
    });

    it('shows success message after successful submission', async () => {
        mockForgotPassword.mockResolvedValue({});

        render(<ForgotPasswordPage />);

        fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
            target: { value: 'user@example.com' },
        });
        fireEvent.submit(screen.getByRole('button', { name: /send reset link/i }));

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument();
        });
    });

    it('shows error message on failed submission', async () => {
        mockForgotPassword.mockResolvedValue({ error: 'User not found' });

        render(<ForgotPasswordPage />);

        fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
            target: { value: 'nobody@example.com' },
        });
        fireEvent.submit(screen.getByRole('button', { name: /send reset link/i }));

        await waitFor(() => {
            expect(screen.getByText('User not found')).toBeInTheDocument();
        });
    });

    it('calls forgotPassword action with form data', async () => {
        mockForgotPassword.mockResolvedValue({});

        render(<ForgotPasswordPage />);

        fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
            target: { value: 'test@test.com' },
        });
        fireEvent.submit(screen.getByRole('button', { name: /send reset link/i }));

        await waitFor(() => {
            expect(mockForgotPassword).toHaveBeenCalledTimes(1);
            const formData = mockForgotPassword.mock.calls[0][0];
            expect(formData).toBeInstanceOf(FormData);
        });
    });

    it('shows exact success message text after reset', async () => {
        mockForgotPassword.mockResolvedValue({});

        render(<ForgotPasswordPage />);

        fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
            target: { value: 'user@example.com' },
        });
        fireEvent.submit(screen.getByRole('button', { name: /send reset link/i }));

        await waitFor(() => {
            expect(screen.getByText('Check your email for the password reset link.')).toBeInTheDocument();
        });
    });
});
