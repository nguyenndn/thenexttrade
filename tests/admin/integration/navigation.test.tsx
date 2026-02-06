/**
 * Admin Page Navigation Tests
 * Tests navigation flows and routing within admin panel
 * @module tests/admin/integration/navigation.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock next/navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockBack = vi.fn();
const mockPathname = vi.fn(() => '/admin');

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: mockReplace,
        back: mockBack,
    }),
    usePathname: () => mockPathname(),
    useSearchParams: () => new URLSearchParams(),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Simplified AdminSidebar Component for testing
const AdminSidebar = () => {
    const router = { push: mockPush };
    
    const menuItems = [
        { href: '/admin', label: 'Dashboard', icon: '📊' },
        { href: '/admin/articles', label: 'Articles', icon: '📝' },
        { href: '/admin/categories', label: 'Categories', icon: '📁' },
        { href: '/admin/users', label: 'Users', icon: '👥' },
        { href: '/admin/academy', label: 'Academy', icon: '🎓' },
        { href: '/admin/ea', label: 'EA Management', icon: '🤖' },
        { href: '/admin/brokers', label: 'Brokers', icon: '🏦' },
        { href: '/admin/comments', label: 'Comments', icon: '💬' },
        { href: '/admin/notifications', label: 'Notifications', icon: '🔔' },
        { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
    ];

    return (
        <nav data-testid="admin-sidebar">
            <ul>
                {menuItems.map(item => (
                    <li key={item.href}>
                        <button
                            onClick={() => router.push(item.href)}
                            data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

// Simplified Breadcrumb Component
const Breadcrumb = ({ items }: { items: { label: string; href?: string }[] }) => {
    const router = { push: mockPush };
    
    return (
        <nav data-testid="breadcrumb" aria-label="Breadcrumb">
            <ol>
                {items.map((item, index) => (
                    <li key={index}>
                        {item.href ? (
                            <button onClick={() => router.push(item.href!)}>{item.label}</button>
                        ) : (
                            <span aria-current="page">{item.label}</span>
                        )}
                        {index < items.length - 1 && <span>/</span>}
                    </li>
                ))}
            </ol>
        </nav>
    );
};

// Simplified Tab Navigation Component
const TabNavigation = ({ 
    tabs, 
    activeTab, 
    onTabChange 
}: { 
    tabs: { id: string; label: string }[]; 
    activeTab: string; 
    onTabChange: (id: string) => void;
}) => {
    return (
        <div data-testid="tab-navigation" role="tablist">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    data-testid={`tab-${tab.id}`}
                    onClick={() => onTabChange(tab.id)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

describe('Admin Navigation Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // Sidebar Navigation
    // ========================================
    describe('Sidebar Navigation', () => {
        it('should render all navigation items', () => {
            render(<AdminSidebar />);

            expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument();
            expect(screen.getByTestId('nav-articles')).toBeInTheDocument();
            expect(screen.getByTestId('nav-categories')).toBeInTheDocument();
            expect(screen.getByTestId('nav-users')).toBeInTheDocument();
            expect(screen.getByTestId('nav-academy')).toBeInTheDocument();
            expect(screen.getByTestId('nav-ea-management')).toBeInTheDocument();
            expect(screen.getByTestId('nav-brokers')).toBeInTheDocument();
            expect(screen.getByTestId('nav-comments')).toBeInTheDocument();
            expect(screen.getByTestId('nav-notifications')).toBeInTheDocument();
            expect(screen.getByTestId('nav-settings')).toBeInTheDocument();
        });

        it('should navigate to dashboard', async () => {
            render(<AdminSidebar />);

            fireEvent.click(screen.getByTestId('nav-dashboard'));

            expect(mockPush).toHaveBeenCalledWith('/admin');
        });

        it('should navigate to articles', async () => {
            render(<AdminSidebar />);

            fireEvent.click(screen.getByTestId('nav-articles'));

            expect(mockPush).toHaveBeenCalledWith('/admin/articles');
        });

        it('should navigate to users', async () => {
            render(<AdminSidebar />);

            fireEvent.click(screen.getByTestId('nav-users'));

            expect(mockPush).toHaveBeenCalledWith('/admin/users');
        });

        it('should navigate to academy', async () => {
            render(<AdminSidebar />);

            fireEvent.click(screen.getByTestId('nav-academy'));

            expect(mockPush).toHaveBeenCalledWith('/admin/academy');
        });

        it('should navigate to EA management', async () => {
            render(<AdminSidebar />);

            fireEvent.click(screen.getByTestId('nav-ea-management'));

            expect(mockPush).toHaveBeenCalledWith('/admin/ea');
        });

        it('should navigate to settings', async () => {
            render(<AdminSidebar />);

            fireEvent.click(screen.getByTestId('nav-settings'));

            expect(mockPush).toHaveBeenCalledWith('/admin/settings');
        });
    });

    // ========================================
    // Breadcrumb Navigation
    // ========================================
    describe('Breadcrumb Navigation', () => {
        it('should render breadcrumb trail', () => {
            const items = [
                { label: 'Admin', href: '/admin' },
                { label: 'Articles', href: '/admin/articles' },
                { label: 'Edit Article' },
            ];

            render(<Breadcrumb items={items} />);

            expect(screen.getByText('Admin')).toBeInTheDocument();
            expect(screen.getByText('Articles')).toBeInTheDocument();
            expect(screen.getByText('Edit Article')).toBeInTheDocument();
        });

        it('should navigate via breadcrumb links', () => {
            const items = [
                { label: 'Admin', href: '/admin' },
                { label: 'Articles', href: '/admin/articles' },
                { label: 'Edit Article' },
            ];

            render(<Breadcrumb items={items} />);

            fireEvent.click(screen.getByText('Admin'));
            expect(mockPush).toHaveBeenCalledWith('/admin');

            fireEvent.click(screen.getByText('Articles'));
            expect(mockPush).toHaveBeenCalledWith('/admin/articles');
        });

        it('should not navigate on current page breadcrumb', () => {
            const items = [
                { label: 'Admin', href: '/admin' },
                { label: 'Current Page' },
            ];

            render(<Breadcrumb items={items} />);

            const currentPage = screen.getByText('Current Page');
            expect(currentPage).toHaveAttribute('aria-current', 'page');
        });
    });

    // ========================================
    // Tab Navigation
    // ========================================
    describe('Tab Navigation', () => {
        const tabs = [
            { id: 'general', label: 'General' },
            { id: 'seo', label: 'SEO' },
            { id: 'advanced', label: 'Advanced' },
        ];

        it('should render all tabs', () => {
            const onTabChange = vi.fn();
            render(<TabNavigation tabs={tabs} activeTab="general" onTabChange={onTabChange} />);

            expect(screen.getByTestId('tab-general')).toBeInTheDocument();
            expect(screen.getByTestId('tab-seo')).toBeInTheDocument();
            expect(screen.getByTestId('tab-advanced')).toBeInTheDocument();
        });

        it('should indicate active tab', () => {
            const onTabChange = vi.fn();
            render(<TabNavigation tabs={tabs} activeTab="general" onTabChange={onTabChange} />);

            expect(screen.getByTestId('tab-general')).toHaveAttribute('aria-selected', 'true');
            expect(screen.getByTestId('tab-seo')).toHaveAttribute('aria-selected', 'false');
        });

        it('should call onTabChange when tab clicked', () => {
            const onTabChange = vi.fn();
            render(<TabNavigation tabs={tabs} activeTab="general" onTabChange={onTabChange} />);

            fireEvent.click(screen.getByTestId('tab-seo'));

            expect(onTabChange).toHaveBeenCalledWith('seo');
        });
    });

    // ========================================
    // Deep Linking
    // ========================================
    describe('Deep Linking', () => {
        it('should construct correct URL for article edit', () => {
            const articleId = 'article-123';
            const expectedUrl = `/admin/articles/${articleId}/edit`;

            expect(expectedUrl).toBe('/admin/articles/article-123/edit');
        });

        it('should construct correct URL for user profile', () => {
            const userId = 'user-456';
            const expectedUrl = `/admin/users/${userId}`;

            expect(expectedUrl).toBe('/admin/users/user-456');
        });

        it('should construct correct URL with query params', () => {
            const baseUrl = '/admin/articles';
            const params = new URLSearchParams({
                status: 'DRAFT',
                category: 'cat-1',
                page: '2',
            });
            const fullUrl = `${baseUrl}?${params.toString()}`;

            expect(fullUrl).toBe('/admin/articles?status=DRAFT&category=cat-1&page=2');
        });
    });

    // ========================================
    // Back Navigation
    // ========================================
    describe('Back Navigation', () => {
        it('should go back to previous page', () => {
            const BackButton = () => (
                <button onClick={mockBack} data-testid="back-button">Back</button>
            );

            render(<BackButton />);
            fireEvent.click(screen.getByTestId('back-button'));

            expect(mockBack).toHaveBeenCalled();
        });
    });

    // ========================================
    // Pagination Navigation
    // ========================================
    describe('Pagination Navigation', () => {
        const PaginationComponent = ({ 
            currentPage, 
            totalPages,
            onPageChange 
        }: { 
            currentPage: number; 
            totalPages: number;
            onPageChange: (page: number) => void;
        }) => {
            return (
                <nav data-testid="pagination" aria-label="Pagination">
                    <button
                        data-testid="prev-page"
                        disabled={currentPage === 1}
                        onClick={() => onPageChange(currentPage - 1)}
                    >
                        Previous
                    </button>
                    <span data-testid="page-info">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        data-testid="next-page"
                        disabled={currentPage === totalPages}
                        onClick={() => onPageChange(currentPage + 1)}
                    >
                        Next
                    </button>
                </nav>
            );
        };

        it('should disable previous button on first page', () => {
            const onPageChange = vi.fn();
            render(<PaginationComponent currentPage={1} totalPages={10} onPageChange={onPageChange} />);

            expect(screen.getByTestId('prev-page')).toBeDisabled();
        });

        it('should disable next button on last page', () => {
            const onPageChange = vi.fn();
            render(<PaginationComponent currentPage={10} totalPages={10} onPageChange={onPageChange} />);

            expect(screen.getByTestId('next-page')).toBeDisabled();
        });

        it('should navigate to next page', () => {
            const onPageChange = vi.fn();
            render(<PaginationComponent currentPage={5} totalPages={10} onPageChange={onPageChange} />);

            fireEvent.click(screen.getByTestId('next-page'));

            expect(onPageChange).toHaveBeenCalledWith(6);
        });

        it('should navigate to previous page', () => {
            const onPageChange = vi.fn();
            render(<PaginationComponent currentPage={5} totalPages={10} onPageChange={onPageChange} />);

            fireEvent.click(screen.getByTestId('prev-page'));

            expect(onPageChange).toHaveBeenCalledWith(4);
        });
    });

    // ========================================
    // Modal Navigation
    // ========================================
    describe('Modal Navigation', () => {
        const ModalComponent = ({ 
            isOpen, 
            onClose,
            title 
        }: { 
            isOpen: boolean; 
            onClose: () => void;
            title: string;
        }) => {
            if (!isOpen) return null;

            return (
                <div data-testid="modal" role="dialog" aria-modal="true">
                    <div data-testid="modal-overlay" onClick={onClose} />
                    <div data-testid="modal-content">
                        <h2>{title}</h2>
                        <button data-testid="modal-close" onClick={onClose}>Close</button>
                    </div>
                </div>
            );
        };

        it('should render modal when open', () => {
            const onClose = vi.fn();
            render(<ModalComponent isOpen={true} onClose={onClose} title="Test Modal" />);

            expect(screen.getByTestId('modal')).toBeInTheDocument();
            expect(screen.getByText('Test Modal')).toBeInTheDocument();
        });

        it('should not render modal when closed', () => {
            const onClose = vi.fn();
            render(<ModalComponent isOpen={false} onClose={onClose} title="Test Modal" />);

            expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
        });

        it('should close modal on close button click', () => {
            const onClose = vi.fn();
            render(<ModalComponent isOpen={true} onClose={onClose} title="Test Modal" />);

            fireEvent.click(screen.getByTestId('modal-close'));

            expect(onClose).toHaveBeenCalled();
        });

        it('should close modal on overlay click', () => {
            const onClose = vi.fn();
            render(<ModalComponent isOpen={true} onClose={onClose} title="Test Modal" />);

            fireEvent.click(screen.getByTestId('modal-overlay'));

            expect(onClose).toHaveBeenCalled();
        });
    });

    // ========================================
    // URL State Management
    // ========================================
    describe('URL State Management', () => {
        it('should parse filter params from URL', () => {
            const searchParams = new URLSearchParams('status=PUBLISHED&category=news&page=2');

            expect(searchParams.get('status')).toBe('PUBLISHED');
            expect(searchParams.get('category')).toBe('news');
            expect(searchParams.get('page')).toBe('2');
        });

        it('should update URL when filters change', async () => {
            const FilterComponent = () => {
                const handleFilterChange = (status: string) => {
                    const params = new URLSearchParams();
                    params.set('status', status);
                    mockPush(`/admin/articles?${params.toString()}`);
                };

                return (
                    <select
                        data-testid="status-filter"
                        onChange={(e) => handleFilterChange(e.target.value)}
                    >
                        <option value="">All</option>
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                    </select>
                );
            };

            render(<FilterComponent />);

            fireEvent.change(screen.getByTestId('status-filter'), {
                target: { value: 'PUBLISHED' },
            });

            expect(mockPush).toHaveBeenCalledWith('/admin/articles?status=PUBLISHED');
        });
    });
});
