import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Verify2FAPage from '@/app/auth/verify-2fa/page';
import { toast } from 'sonner';

// Mock auth actions
const mockVerifyLogin2FA = vi.fn();
vi.mock('@/app/auth/actions', () => ({
    verifyLogin2FA: (...args: any[]) => mockVerifyLogin2FA(...args),
}));

describe('Verify 2FA Page', () => {
    beforeEach(() => {
        mockVerifyLogin2FA.mockReset();
    });

    it('renders the Two-Factor Authentication heading', () => {
        render(<Verify2FAPage />);
        expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
    });

    it('renders description text', () => {
        render(<Verify2FAPage />);
        expect(screen.getByText(/enter the 6-digit code/i)).toBeInTheDocument();
    });

    it('renders 6-digit code input', () => {
        render(<Verify2FAPage />);
        const input = screen.getByPlaceholderText('000000');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('maxLength', '6');
    });

    it('only allows numeric input', () => {
        render(<Verify2FAPage />);
        const input = screen.getByPlaceholderText('000000');

        fireEvent.change(input, { target: { value: 'abc123' } });
        expect(input).toHaveValue('123');
    });

    it('submit button is disabled when code is less than 6 digits', () => {
        render(<Verify2FAPage />);
        const button = screen.getByRole('button', { name: /verify identity/i });
        expect(button).toBeDisabled();

        const input = screen.getByPlaceholderText('000000');
        fireEvent.change(input, { target: { value: '12345' } });
        expect(button).toBeDisabled();
    });

    it('submit button is enabled when code has 6 digits', () => {
        render(<Verify2FAPage />);
        const input = screen.getByPlaceholderText('000000');
        fireEvent.change(input, { target: { value: '123456' } });

        const button = screen.getByRole('button', { name: /verify identity/i });
        expect(button).not.toBeDisabled();
    });

    it('shows toast error on failed verification', async () => {
        mockVerifyLogin2FA.mockResolvedValue({ error: 'Invalid code' });

        render(<Verify2FAPage />);

        const input = screen.getByPlaceholderText('000000');
        fireEvent.change(input, { target: { value: '123456' } });
        fireEvent.submit(screen.getByRole('button', { name: /verify identity/i }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Invalid code');
        });
    });

    it('renders Back to Login button', () => {
        render(<Verify2FAPage />);
        const backBtn = screen.getByRole('button', { name: /back to login/i });
        expect(backBtn).toBeInTheDocument();
    });

    it('does not call verifyLogin2FA when code is less than 6 digits', async () => {
        render(<Verify2FAPage />);

        const input = screen.getByPlaceholderText('000000');
        fireEvent.change(input, { target: { value: '123' } });

        // Try to submit the form directly (bypassing disabled button)
        const form = input.closest('form')!;
        fireEvent.submit(form);

        // Wait a tick then verify the action was never called
        await waitFor(() => {
            expect(mockVerifyLogin2FA).not.toHaveBeenCalled();
        });
    });
});
