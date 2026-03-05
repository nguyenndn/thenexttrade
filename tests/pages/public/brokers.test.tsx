import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock auth
vi.mock('@/lib/auth-cache', () => ({
    getAuthUser: vi.fn().mockResolvedValue(null),
}));

// Mock getBrokers action
const mockGetBrokers = vi.fn();
vi.mock('@/app/actions/brokers', () => ({
    getBrokers: (...args: any[]) => mockGetBrokers(...args),
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
vi.mock('next/image', () => ({
    default: (props: any) => <img {...props} />,
}));
vi.mock('@/components/ui/Button', () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    buttonVariants: () => 'btn-primary',
}));

import BrokersPage from '@/app/brokers/page';

const mockBrokerData = [
    {
        id: '1',
        name: 'IC Markets',
        logo: '/ic.png',
        rating: 4.8,
        summary: 'Top-rated forex broker',
        description: 'Professional grade broker',
        features: ['Low spreads', 'Fast execution', 'MT4/MT5'],
        affiliateUrl: 'https://icmarkets.com',
        url: 'https://icmarkets.com',
    },
    {
        id: '2',
        name: 'Exness',
        logo: '/exness.png',
        rating: 4.6,
        summary: 'Popular retail broker',
        description: 'Great for beginners',
        features: ['No minimum deposit', 'Instant withdrawals', 'Copy trading'],
        affiliateUrl: 'https://exness.com',
        url: 'https://exness.com',
    },
];

describe('Brokers Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the "Top Trusted Brokers" heading', async () => {
        mockGetBrokers.mockResolvedValue({ data: mockBrokerData });
        const page = await BrokersPage();
        const { container } = render(page);
        const h1 = container.querySelector('h1');
        expect(h1).toBeInTheDocument();
        expect(h1?.textContent).toContain('Trusted Brokers');
    });

    it('renders the "Verified Partners" badge', async () => {
        mockGetBrokers.mockResolvedValue({ data: mockBrokerData });
        const page = await BrokersPage();
        render(page);
        expect(screen.getByText('Verified Partners')).toBeInTheDocument();
    });

    it('renders broker cards with name and rating', async () => {
        mockGetBrokers.mockResolvedValue({ data: mockBrokerData });
        const page = await BrokersPage();
        render(page);
        expect(screen.getByText('IC Markets')).toBeInTheDocument();
        expect(screen.getByText('Exness')).toBeInTheDocument();
        expect(screen.getByText('4.8')).toBeInTheDocument();
        expect(screen.getByText('4.6')).toBeInTheDocument();
    });

    it('renders "Open Account" buttons for each broker', async () => {
        mockGetBrokers.mockResolvedValue({ data: mockBrokerData });
        const page = await BrokersPage();
        render(page);
        const openBtns = screen.getAllByText('Open Account');
        expect(openBtns).toHaveLength(2);
    });

    it('renders empty state when no brokers', async () => {
        mockGetBrokers.mockResolvedValue({ data: [] });
        const page = await BrokersPage();
        render(page);
        expect(screen.getByText(/no trusted brokers listed yet/i)).toBeInTheDocument();
    });

    it('renders footer', async () => {
        mockGetBrokers.mockResolvedValue({ data: mockBrokerData });
        const page = await BrokersPage();
        render(page);
        expect(screen.getByTestId('site-footer')).toBeInTheDocument();
    });
});
