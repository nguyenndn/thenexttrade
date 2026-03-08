/**
 * Vitest Test Setup
 * Global test configuration and mocks
 */
import { vi, beforeAll, afterEach, afterAll } from 'vitest';
import '@testing-library/jest-dom';

// ============================================
// Mock Next.js Navigation
// ============================================
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        refresh: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        prefetch: vi.fn(),
    }),
    usePathname: () => '/admin',
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
}));

// ============================================
// Mock Next.js Link
// ============================================
vi.mock('next/link', () => {
    const React = require('react');
    return {
        default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: any }) => {
            return React.createElement('a', { href, ...rest }, children);
        },
    };
});


// ============================================
// Mock Sonner Toast
// ============================================
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        loading: vi.fn(() => 'toast-id'),
        dismiss: vi.fn(),
    },
}));

// ============================================
// Mock LocalStorage
// ============================================
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ============================================
// Mock window.confirm
// ============================================
window.confirm = vi.fn(() => true);

// ============================================
// Mock window.matchMedia
// ============================================
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// ============================================
// Mock ResizeObserver
// ============================================
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// ============================================
// Mock IntersectionObserver
// ============================================
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// ============================================
// Global Cleanup
// ============================================
afterEach(() => {
    vi.clearAllMocks();
});
