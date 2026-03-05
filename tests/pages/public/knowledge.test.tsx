import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
const mockFindMany = vi.fn();
const mockCount = vi.fn();
vi.mock('@/lib/prisma', () => ({
    prisma: {
        article: { findMany: (...args: any[]) => mockFindMany(...args), count: (...args: any[]) => mockCount(...args) },
        category: { findMany: vi.fn().mockResolvedValue([]) },
        tag: { findMany: vi.fn().mockResolvedValue([]) },
    },
}));

// Mock auth
vi.mock('@/lib/auth-cache', () => ({
    getAuthUser: vi.fn().mockResolvedValue(null),
}));

// Mock child components
vi.mock('@/components/layout/PublicHeader', () => ({
    PublicHeader: () => <header data-testid="public-header">Header</header>,
}));
vi.mock('@/components/layout/SiteFooter', () => ({
    SiteFooter: () => <footer data-testid="site-footer">Footer</footer>,
}));
vi.mock('@/components/ui/DynamicFirefly', () => ({
    DynamicFirefly: () => null,
}));
vi.mock('@/components/ui/SectionHeader', () => ({
    SectionHeader: ({ title }: any) => <h2>{title}</h2>,
}));
vi.mock('@/components/knowledge/ArticleCard', () => ({
    ArticleCard: ({ article }: any) => <div data-testid="article-card">{article.title}</div>,
}));
vi.mock('@/components/ui/FadeIn', () => ({
    FadeIn: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('next/image', () => ({
    default: (props: any) => <img {...props} />,
}));

import LibraryPage from '@/app/knowledge/page';

const mockArticles = [
    { id: '1', title: 'Forex 101', slug: 'forex-101', excerpt: 'Learn forex', thumbnail: '/img.jpg', createdAt: new Date(), author: { name: 'Admin', image: null }, category: { name: 'Education', slug: 'education' }, tags: [] },
    { id: '2', title: 'Risk Guide', slug: 'risk-guide', excerpt: 'Risk basics', thumbnail: '/img2.jpg', createdAt: new Date(), author: { name: 'Admin', image: null }, category: { name: 'Strategy', slug: 'strategy' }, tags: [] },
];

describe('Knowledge / Library Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFindMany.mockResolvedValue(mockArticles);
        mockCount.mockResolvedValue(2);
    });

    it('renders the Trading Library heading (text split across elements)', async () => {
        const page = await LibraryPage({ searchParams: Promise.resolve({}) });
        const { container } = render(page);
        // "Trading" and "Library" are in separate spans within an h1
        const h1 = container.querySelector('h1');
        expect(h1).toBeInTheDocument();
        expect(h1?.textContent).toContain('Trading');
        expect(h1?.textContent).toContain('Library');
    });

    it('renders article cards', async () => {
        const page = await LibraryPage({ searchParams: Promise.resolve({}) });
        render(page);
        const cards = screen.getAllByTestId('article-card');
        expect(cards.length).toBeGreaterThan(0);
    });

    it('renders header component', async () => {
        const page = await LibraryPage({ searchParams: Promise.resolve({}) });
        render(page);
        expect(screen.getByTestId('public-header')).toBeInTheDocument();
    });

    it('renders footer component', async () => {
        const page = await LibraryPage({ searchParams: Promise.resolve({}) });
        render(page);
        expect(screen.getByTestId('site-footer')).toBeInTheDocument();
    });

    it('renders search input', async () => {
        const page = await LibraryPage({ searchParams: Promise.resolve({}) });
        render(page);
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it('handles empty articles state', async () => {
        mockFindMany.mockResolvedValue([]);
        mockCount.mockResolvedValue(0);
        const page = await LibraryPage({ searchParams: Promise.resolve({}) });
        const { container } = render(page);
        // Should render without crashing; page heading still present
        const h1 = container.querySelector('h1');
        expect(h1?.textContent).toContain('Trading');
    });
});
