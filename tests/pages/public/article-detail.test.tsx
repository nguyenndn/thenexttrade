import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mock dependencies ---

// Mock next/cache unstable_cache — it wraps a function, so just return the function itself
vi.mock('next/cache', () => ({
    unstable_cache: (fn: any) => fn,
}));

// Mock DOMPurify
vi.mock('isomorphic-dompurify', () => ({
    default: {
        sanitize: (html: string) => html,
    },
}));

// Mock Prisma
const mockFindUnique = vi.fn();
const mockFindFirst = vi.fn();
const mockFindMany = vi.fn();
const mockUpdate = vi.fn();
const mockCommentCount = vi.fn();
vi.mock('@/lib/prisma', () => ({
    prisma: {
        article: {
            findUnique: (...args: any[]) => mockFindUnique(...args),
            findFirst: (...args: any[]) => mockFindFirst(...args),
            findMany: (...args: any[]) => mockFindMany(...args),
            update: (...args: any[]) => mockUpdate(...args),
        },
        user: {
            findUnique: vi.fn().mockResolvedValue(null),
        },
        comment: {
            count: (...args: any[]) => mockCommentCount(...args),
        },
    },
}));

// Mock auth
vi.mock('@/lib/auth-cache', () => ({
    getAuthUser: vi.fn().mockResolvedValue(null),
}));

// Mock next/navigation
const mockNotFound = vi.fn();
vi.mock('next/navigation', async () => {
    const actual = await vi.importActual('next/navigation');
    return {
        ...actual,
        notFound: () => { mockNotFound(); throw new Error('NEXT_NOT_FOUND'); },
    };
});

// Mock child components
vi.mock('@/components/layout/PublicHeader', () => ({
    PublicHeader: () => <header data-testid="public-header">Header</header>,
}));
vi.mock('@/components/layout/SiteFooter', () => ({
    SiteFooter: () => <footer data-testid="site-footer">Footer</footer>,
}));
vi.mock('@/components/layout/MobileBottomNav', () => ({
    default: () => <nav data-testid="mobile-nav">MobileNav</nav>,
}));
vi.mock('@/components/features/ReadingProgressBar', () => ({
    default: () => <div data-testid="progress-bar">ProgressBar</div>,
}));
vi.mock('@/components/features/ViewCounter', () => ({
    ViewCounter: () => <div data-testid="view-counter">ViewCounter</div>,
}));
vi.mock('@/components/features/SocialShare', () => ({
    default: () => <div data-testid="social-share">SocialShare</div>,
}));
vi.mock('@/components/features/RelatedArticlesBottom', () => ({
    default: () => <div data-testid="related-articles">Related</div>,
}));
vi.mock('@/components/features/SidebarWidgets', () => ({
    default: () => <div data-testid="sidebar-widgets">Sidebar</div>,
}));
vi.mock('@/components/features/TableOfContents', () => ({
    default: () => <div data-testid="toc">TOC</div>,
}));
vi.mock('@/components/comments/CommentsFetcher', () => ({
    CommentsFetcher: () => <div data-testid="comments-fetcher">Comments</div>,
}));
vi.mock('@/components/seo/JsonLd', () => ({
    JsonLd: () => null,
}));
vi.mock('next/image', () => ({
    default: (props: any) => <img {...props} />,
}));

import ArticlePage from '@/app/articles/[slug]/page';

const mockArticle = {
    id: 'article-1',
    title: 'Mastering Forex Trading',
    slug: 'mastering-forex-trading',
    excerpt: 'A comprehensive guide to forex trading.',
    content: '<h2>Introduction</h2><p>Forex trading is one of the most popular forms of trading.</p>',
    thumbnail: '/thumbnail.jpg',
    views: 350,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-01'),
    publishedAt: new Date('2024-01-15'),
    status: 'PUBLISHED',
    categoryId: 'cat-1',
    author: { id: 'author-1', name: 'John Doe', image: '/author.jpg' },
    category: { id: 'cat-1', name: 'Education', slug: 'education' },
    tags: [
        { tag: { id: 'tag-1', name: 'Forex', slug: 'forex' } },
        { tag: { id: 'tag-2', name: 'Beginner', slug: 'beginner' } },
    ],
};

describe('Article Detail Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFindUnique.mockResolvedValue(mockArticle);
        mockFindFirst.mockResolvedValue(null);
        mockFindMany.mockResolvedValue([]);
        mockUpdate.mockResolvedValue({});
        mockCommentCount.mockResolvedValue(5);
    });

    it('renders the article title as an h1', async () => {
        const page = await ArticlePage({ params: Promise.resolve({ slug: 'mastering-forex-trading' }) });
        const { container } = render(page);
        const h1 = container.querySelector('h1');
        expect(h1).toBeInTheDocument();
        expect(h1?.textContent).toBe('Mastering Forex Trading');
    });

    it('renders the author name', async () => {
        const page = await ArticlePage({ params: Promise.resolve({ slug: 'mastering-forex-trading' }) });
        render(page);
        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders the formatted date', async () => {
        const page = await ArticlePage({ params: Promise.resolve({ slug: 'mastering-forex-trading' }) });
        render(page);
        expect(screen.getByText(/january 15, 2024/i)).toBeInTheDocument();
    });

    it('renders breadcrumb with Home and Knowledge links', async () => {
        const page = await ArticlePage({ params: Promise.resolve({ slug: 'mastering-forex-trading' }) });
        render(page);
        const homeLink = screen.getByText('Home');
        expect(homeLink.closest('a')).toHaveAttribute('href', '/');
        const knowledgeLink = screen.getByText('Knowledge');
        expect(knowledgeLink.closest('a')).toHaveAttribute('href', '/articles');
    });

    it('renders tags as links', async () => {
        const page = await ArticlePage({ params: Promise.resolve({ slug: 'mastering-forex-trading' }) });
        render(page);
        expect(screen.getByText('#Forex')).toBeInTheDocument();
        expect(screen.getByText('#Beginner')).toBeInTheDocument();
    });

    it('renders header and footer', async () => {
        const page = await ArticlePage({ params: Promise.resolve({ slug: 'mastering-forex-trading' }) });
        render(page);
        expect(screen.getByTestId('public-header')).toBeInTheDocument();
        expect(screen.getByTestId('site-footer')).toBeInTheDocument();
    });

    it('calls notFound() when article does not exist', async () => {
        mockFindUnique.mockResolvedValue(null);
        mockFindFirst.mockResolvedValue(null);

        await expect(
            ArticlePage({ params: Promise.resolve({ slug: 'nonexistent' }) })
        ).rejects.toThrow('NEXT_NOT_FOUND');
        expect(mockNotFound).toHaveBeenCalled();
    });

    it('renders category badge on thumbnail', async () => {
        const page = await ArticlePage({ params: Promise.resolve({ slug: 'mastering-forex-trading' }) });
        render(page);
        expect(screen.getByText('Education')).toBeInTheDocument();
    });

    it('renders without hero image when article has no thumbnail', async () => {
        const noThumbArticle = { ...mockArticle, thumbnail: null };
        mockFindUnique.mockResolvedValue(noThumbArticle);

        const page = await ArticlePage({ params: Promise.resolve({ slug: 'mastering-forex-trading' }) });
        const { container } = render(page);

        // No img with hero thumbnail should exist — the hero section is skipped
        const heroImg = container.querySelector('img[alt="Mastering Forex Trading"]');
        expect(heroImg).not.toBeInTheDocument();
    });

    it('does not render tags section when article has no tags', async () => {
        const noTagsArticle = { ...mockArticle, tags: [] };
        mockFindUnique.mockResolvedValue(noTagsArticle);

        const page = await ArticlePage({ params: Promise.resolve({ slug: 'mastering-forex-trading' }) });
        const { container } = render(page);

        // No tag links should be rendered
        expect(screen.queryByText('#Forex')).not.toBeInTheDocument();
        expect(screen.queryByText('#Beginner')).not.toBeInTheDocument();
    });

    it('does not render comment count link when commentCount is 0', async () => {
        mockCommentCount.mockResolvedValue(0);

        const page = await ArticlePage({ params: Promise.resolve({ slug: 'mastering-forex-trading' }) });
        render(page);

        // "Comments" link should not exist when count is 0
        expect(screen.queryByText(/\d+ Comments/)).not.toBeInTheDocument();
    });

    it('renders comment count link when commentCount > 0', async () => {
        mockCommentCount.mockResolvedValue(5);

        const page = await ArticlePage({ params: Promise.resolve({ slug: 'mastering-forex-trading' }) });
        render(page);

        expect(screen.getByText('5 Comments')).toBeInTheDocument();
    });
});
