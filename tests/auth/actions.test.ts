import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login } from '@/app/auth/actions'; // Adjust import path if needed
import { redirect } from 'next/navigation';

// Mock dependencies
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: () => ({ getAll: () => [] }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/session', () => ({
  recordSession: vi.fn(),
}));

// Mock Supabase
const mockSignIn = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve({
    auth: {
      signInWithPassword: mockSignIn,
      getUser: mockGetUser,
    },
  }),
}));

describe('Auth Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to /dashboard on successful login', async () => {
    const { prisma } = await import('@/lib/prisma');

    // Setup success mock
    mockSignIn.mockResolvedValue({ data: { user: { id: '123' }, session: {} }, error: null });
    mockGetUser.mockResolvedValue({ data: { user: { id: '123', email: 'test@example.com' } }, error: null });
    (prisma.user.findUnique as any).mockResolvedValue({ id: '123' });

    const formData = new FormData();
    formData.append('email', 'test@example.com');
    formData.append('password', 'password123'); // Ensure matches schema

    try {
      await login(formData);
    } catch (e) {
      // redirect throws
    }

    expect(mockSignIn).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith('/dashboard');
  });

  it('should not redirect on login failure', async () => {
    // Setup failure mock
    mockSignIn.mockResolvedValue({ data: { user: null, session: null }, error: { message: 'Invalid credentials' } });

    const formData = new FormData();
    formData.append('email', 'fail@example.com');
    formData.append('password', 'wrongpass');

    const result = await login(formData);

    expect(mockSignIn).toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
    // Check if error is returned/handled (depends on implementation)
  });
});
