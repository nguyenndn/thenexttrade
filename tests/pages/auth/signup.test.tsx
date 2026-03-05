import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SignupPage from '@/app/auth/signup/page';

// Mock auth actions
const mockSignup = vi.fn();
vi.mock('@/app/auth/actions', () => ({
    signup: (...args: any[]) => mockSignup(...args),
}));

// Mock Logo component
vi.mock('@/components/ui/Logo', () => ({
    Logo: () => <div data-testid="logo">Logo</div>,
}));

// Mock CountrySelect
vi.mock('@/components/ui/CountrySelect', () => ({
    CountrySelect: ({ value, onChange }: any) => (
        <select data-testid="country-select" value={value} onChange={(e: any) => onChange(e.target.value)}>
            <option value="">Select country</option>
            <option value="VN">Vietnam</option>
        </select>
    ),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: vi.fn(),
        refresh: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        prefetch: vi.fn(),
    }),
    usePathname: () => '/auth/signup',
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
}));

describe('Signup Page', () => {
    beforeEach(() => {
        mockSignup.mockReset();
    });

    it('renders the signup form with all required fields', () => {
        render(<SignupPage />);
        expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email Address')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument();
    });

    it('renders the "Sign up" heading', () => {
        render(<SignupPage />);
        expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
    });

    it('renders the "Create My Account" submit button', () => {
        render(<SignupPage />);
        const submitBtn = screen.getByRole('button', { name: /create my account/i });
        expect(submitBtn).toBeInTheDocument();
        expect(submitBtn).toHaveAttribute('type', 'submit');
    });

    it('renders logo component', () => {
        render(<SignupPage />);
        expect(screen.getByTestId('logo')).toBeInTheDocument();
    });

    it('shows error message on failed signup', async () => {
        mockSignup.mockResolvedValue({ error: 'Email already exists' });

        render(<SignupPage />);

        fireEvent.change(screen.getByPlaceholderText('Full Name'), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'password123' } });
        // Check the terms checkbox (required)
        fireEvent.click(screen.getByLabelText(/I accept the/i));
        fireEvent.submit(screen.getByRole('button', { name: /create my account/i }));

        await waitFor(() => {
            expect(screen.getByText('Email already exists')).toBeInTheDocument();
        });
    });

    it('has link to login page', () => {
        render(<SignupPage />);
        const loginLink = screen.getByText('Sign In');
        expect(loginLink).toBeInTheDocument();
        expect(loginLink.closest('a')).toHaveAttribute('href', '/auth/login');
    });

    it('toggles password visibility', () => {
        render(<SignupPage />);
        const toggleBtn = screen.getByRole('button', { name: /show password/i });
        expect(toggleBtn).toBeInTheDocument();
        fireEvent.click(toggleBtn);
        expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();
    });

    it('calls signup action with form data on submit', async () => {
        mockSignup.mockResolvedValue({});

        render(<SignupPage />);

        fireEvent.change(screen.getByPlaceholderText('Full Name'), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'secure123' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'secure123' } });
        fireEvent.click(screen.getByLabelText(/I accept the/i));
        fireEvent.submit(screen.getByRole('button', { name: /create my account/i }));

        await waitFor(() => {
            expect(mockSignup).toHaveBeenCalledTimes(1);
        });
    });

    it('shows error when passwords do not match (client-side)', async () => {
        render(<SignupPage />);

        fireEvent.change(screen.getByPlaceholderText('Full Name'), { target: { value: 'Test' } });
        fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'a@b.com' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'abc123' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'xyz789' } });
        fireEvent.click(screen.getByLabelText(/I accept the/i));
        fireEvent.submit(screen.getByRole('button', { name: /create my account/i }));

        await waitFor(() => {
            expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
        });
        // signup action should NOT have been called
        expect(mockSignup).not.toHaveBeenCalled();
    });

    it('redirects to verify-email when requiresVerification is returned', async () => {
        mockSignup.mockResolvedValue({ requiresVerification: true, email: 'new@test.com' });

        render(<SignupPage />);

        fireEvent.change(screen.getByPlaceholderText('Full Name'), { target: { value: 'Test' } });
        fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'new@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass123' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'pass123' } });
        fireEvent.click(screen.getByLabelText(/I accept the/i));
        fireEvent.submit(screen.getByRole('button', { name: /create my account/i }));

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/auth/verify-email?email=new%40test.com');
        });
    });

    it('redirects to dashboard on successful signup', async () => {
        mockSignup.mockResolvedValue({ success: true });

        render(<SignupPage />);

        fireEvent.change(screen.getByPlaceholderText('Full Name'), { target: { value: 'Test' } });
        fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'ok@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass123' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'pass123' } });
        fireEvent.click(screen.getByLabelText(/I accept the/i));
        fireEvent.submit(screen.getByRole('button', { name: /create my account/i }));

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/dashboard');
        });
    });
});
