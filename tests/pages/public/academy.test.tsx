import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        level: {
            findMany: vi.fn().mockResolvedValue([
                {
                    id: '1', title: 'Level 1: Basics', description: 'Start here', order: 1,
                    modules: [
                        { id: 'm1', title: 'Intro to Forex', description: 'Getting started', lessons: [{ id: 'l1', title: 'Lesson 1', slug: 'lesson-1', duration: 10 }] },
                    ],
                },
            ]),
        },
    },
}));

// Mock auth
vi.mock('@/lib/auth-cache', () => ({
    getAuthUser: vi.fn().mockResolvedValue(null),
}));

// Mock child components
vi.mock('@/components/layout/SiteFooter', () => ({
    SiteFooter: () => <footer data-testid="site-footer">Footer</footer>,
}));
vi.mock('@/components/academy/AcademyMap', () => ({
    default: ({ levels }: any) => <div data-testid="academy-map">{levels.length} levels</div>,
}));
vi.mock('@/components/seo/JsonLd', () => ({
    JsonLd: () => null,
}));

import AcademyPage from '@/app/academy/page';

describe('Academy Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders heading with "Ascent" text', async () => {
        const page = await AcademyPage();
        const { container } = render(page);
        const h1 = container.querySelector('h1');
        expect(h1).toBeInTheDocument();
        expect(h1?.textContent).toContain('Ascent');
    });

    it('renders the "Professional Career Path" badge', async () => {
        const page = await AcademyPage();
        render(page);
        expect(screen.getByText('Professional Career Path')).toBeInTheDocument();
    });

    it('renders the AcademyMap component', async () => {
        const page = await AcademyPage();
        render(page);
        expect(screen.getByTestId('academy-map')).toBeInTheDocument();
    });

    it('renders the footer', async () => {
        const page = await AcademyPage();
        render(page);
        expect(screen.getByTestId('site-footer')).toBeInTheDocument();
    });

    it('renders market description text', async () => {
        const page = await AcademyPage();
        render(page);
        expect(screen.getByText(/master the markets/i)).toBeInTheDocument();
    });
});
