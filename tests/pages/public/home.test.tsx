import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// Mock all heavy dependencies BEFORE importing
// ============================================

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        article: { findMany: vi.fn().mockResolvedValue([]) },
        economicEvent: { findFirst: vi.fn().mockResolvedValue(null) },
    },
}));

// Mock cache wrapper
vi.mock('@/lib/cache', () => ({
    cache: {
        wrap: vi.fn((_key: string, fn: () => any) => fn()),
    },
}));

// Mock auth
vi.mock('@/lib/auth-cache', () => ({
    getAuthUser: vi.fn().mockResolvedValue(null),
}));

// Mock market data
vi.mock('@/app/actions/get-market-data', () => ({
    getMarketData: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

// Mock config
vi.mock('@/config/home-data', () => ({
    HOMEPAGE_TRENDING_TOPICS: [
        { name: 'Forex Basics', href: '/knowledge?tag=forex', change: 'Up' },
        { name: 'Risk Management', href: '/knowledge?tag=risk', change: 'Up' },
    ],
}));

// Mock child components to isolate page logic
vi.mock('@/components/layout/PublicHeader', () => ({
    PublicHeader: ({ user }: any) => <header data-testid="public-header">Header</header>,
}));
vi.mock('@/components/layout/SiteFooter', () => ({
    SiteFooter: () => <footer data-testid="site-footer">Footer</footer>,
}));
vi.mock('@/components/home/HeroCarousel', () => ({
    HeroCarousel: ({ articles }: any) => <div data-testid="hero-carousel">{articles.length} articles</div>,
}));
vi.mock('@/components/home/MarketTickerSection', () => ({
    MarketTickerSection: () => <div data-testid="market-ticker">Ticker</div>,
}));
vi.mock('@/components/home/ToolsPreviewSection', () => ({
    ToolsPreviewSection: () => <div data-testid="tools-preview">Tools</div>,
}));
vi.mock('@/components/shared/QuoteDisplay', () => ({
    default: () => <div data-testid="quote-display">Quote</div>,
}));
vi.mock('@/components/ui/SectionHeader', () => ({
    SectionHeader: ({ title }: any) => <h2 data-testid={`section-${title}`}>{title}</h2>,
}));
vi.mock('@/components/ui/DynamicFirefly', () => ({
    DynamicFirefly: () => null,
}));
vi.mock('@/components/ui/LoadingSkeleton', () => ({
    HomeFeedSkeleton: () => <div>Loading...</div>,
}));
vi.mock('@/components/ui/FadeIn', () => ({
    FadeIn: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('next/image', () => ({
    default: (props: any) => <img {...props} />,
}));
vi.mock('@/lib/utils', () => ({
    shuffleArray: (arr: any[]) => arr,
    cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

// Import AFTER mocks
import Home from '@/app/page';

describe('Homepage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders header component', async () => {
        const page = await Home();
        render(page);
        expect(screen.getByTestId('public-header')).toBeInTheDocument();
    });

    it('renders footer component', async () => {
        const page = await Home();
        render(page);
        expect(screen.getByTestId('site-footer')).toBeInTheDocument();
    });

    it('renders the main structure with Suspense fallback', async () => {
        const page = await Home();
        render(page);
        // Suspense fallback shows while HomeFeed (async) resolves
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders the correct page container class', async () => {
        const page = await Home();
        const { container } = render(page);
        const main = container.querySelector('main');
        expect(main).toBeInTheDocument();
        expect(main).toHaveClass('min-h-screen');
    });
});
