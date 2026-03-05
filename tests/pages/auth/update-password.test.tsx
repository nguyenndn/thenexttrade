import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UpdatePasswordPage from '@/app/auth/update-password/page';

// Mock auth actions
const mockUpdatePassword = vi.fn();
vi.mock('@/app/auth/actions', () => ({
    updatePassword: (...args: any[]) => mockUpdatePassword(...args),
}));

// Mock Logo
vi.mock('@/components/ui/Logo', () => ({
    Logo: () => <div data-testid="logo">Logo</div>,
}));

describe('Update Password Page', () => {
    beforeEach(() => {
        mockUpdatePassword.mockReset();
    });

    it('renders the "Set New Password" heading', () => {
        render(<UpdatePasswordPage />);
        expect(screen.getByText('Set New Password')).toBeInTheDocument();
    });

    it('renders two password input fields', () => {
        render(<UpdatePasswordPage />);
        const passwordInputs = screen.getAllByPlaceholderText(/password|characters/i);
        expect(passwordInputs.length).toBeGreaterThanOrEqual(2);
    });

    it('renders the "Reset Password" submit button', () => {
        render(<UpdatePasswordPage />);
        const button = screen.getByRole('button', { name: /reset password/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('type', 'submit');
    });

    it('shows error message on failed submission', async () => {
        mockUpdatePassword.mockResolvedValue({ error: 'Passwords do not match' });

        render(<UpdatePasswordPage />);

        fireEvent.change(screen.getByPlaceholderText('Min 6 characters'), {
            target: { value: 'newpass123' },
        });
        fireEvent.change(screen.getByPlaceholderText('Re-enter password'), {
            target: { value: 'differentpass' },
        });
        fireEvent.submit(screen.getByRole('button', { name: /reset password/i }));

        await waitFor(() => {
            expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
        });
    });

    it('both password fields are required', () => {
        render(<UpdatePasswordPage />);
        const inputs = screen.getAllByPlaceholderText(/password|characters/i);
        inputs.forEach((input) => {
            expect(input).toBeRequired();
        });
    });

    it('calls updatePassword action on submit', async () => {
        mockUpdatePassword.mockResolvedValue({});

        render(<UpdatePasswordPage />);

        fireEvent.change(screen.getByPlaceholderText('Min 6 characters'), {
            target: { value: 'newpassword' },
        });
        fireEvent.change(screen.getByPlaceholderText('Re-enter password'), {
            target: { value: 'newpassword' },
        });
        fireEvent.submit(screen.getByRole('button', { name: /reset password/i }));

        await waitFor(() => {
            expect(mockUpdatePassword).toHaveBeenCalledTimes(1);
            const formData = mockUpdatePassword.mock.calls[0][0];
            expect(formData).toBeInstanceOf(FormData);
        });
    });
});
