/**
 * Mock Helpers for Admin Tests
 */
import { vi } from 'vitest';

// ============================================
// Mock Prisma Client
// ============================================
export const mockPrismaClient = {
    user: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
    },
    article: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
    },
    category: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    tag: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    level: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    module: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    lesson: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    quiz: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    question: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    eAProduct: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    licenseAccount: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
    },
    comment: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
    },
    broadcast: {
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
    },
    systemSetting: {
        findFirst: vi.fn(),
        upsert: vi.fn(),
    },
    auditLog: {
        findMany: vi.fn(),
        create: vi.fn(),
    },
    broker: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(mockPrismaClient)),
};

// ============================================
// Mock Supabase Client
// ============================================
export const mockSupabaseClient = {
    auth: {
        getSession: vi.fn().mockResolvedValue({
            data: { session: { user: { id: 'user-1', email: 'admin@example.com' } } },
            error: null,
        }),
        getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-1', email: 'admin@example.com' } },
            error: null,
        }),
    },
    storage: {
        from: vi.fn(() => ({
            upload: vi.fn().mockResolvedValue({ data: { path: 'uploads/file.jpg' }, error: null }),
            getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/file.jpg' } })),
            remove: vi.fn().mockResolvedValue({ error: null }),
        })),
    },
};

// ============================================
// Mock Fetch Helper
// ============================================
export const createMockFetch = (response: any, ok = true) => {
    return vi.fn().mockResolvedValue({
        ok,
        json: vi.fn().mockResolvedValue(response),
        status: ok ? 200 : 400,
    });
};

// ============================================
// Mock Router Helper
// ============================================
export const createMockRouter = () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
});

// ============================================
// Mock Session Helper
// ============================================
export const mockAdminSession = {
    user: {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN',
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
};

export const mockEditorSession = {
    user: {
        id: 'editor-1',
        name: 'Editor User',
        email: 'editor@example.com',
        role: 'EDITOR',
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
};

export const mockUserSession = {
    user: {
        id: 'user-1',
        name: 'Regular User',
        email: 'user@example.com',
        role: 'USER',
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
};

// ============================================
// Wait Helper
// ============================================
export const waitFor = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================
// Render with Providers Helper
// ============================================
export const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(() => 'toast-id'),
    dismiss: vi.fn(),
};
