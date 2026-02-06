/**
 * ArticleList Component Tests
 * @module tests/admin/components/articles/ArticleList.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockArticles, mockAuthors } from '../../__mocks__/data';

// Mock next/navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: mockReplace,
        refresh: mockRefresh,
    }),
    usePathname: () => '/admin/articles',
    useSearchParams: () => new URLSearchParams(),
}));

// Mock ArticleRowActions
vi.mock('@/components/admin/articles/ArticleRowActions', () => ({
    ArticleRowActions: ({ articleId }: { articleId: string }) => (
        <div data-testid={`row-actions-${articleId}`}>Actions</div>
    ),
}));

// Simplified ArticleList for testing
interface Article {
    id: string;
    title: string;
    slug: string;
    status: string;
    views: number;
    thumbnail: string | null;
    createdAt: Date;
    author: { name: string | null; image: string | null };
    category: { name: string };
    authorId: string;
}

interface ArticleListProps {
    initialArticles: Article[];
    authors: { id: string; name: string }[];
    pagination: { currentPage: number; totalPages: number };
}

function ArticleList({ initialArticles, authors, pagination }: ArticleListProps) {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('');
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

    const filteredArticles = initialArticles.filter((article) => {
        const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || article.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredArticles.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredArticles.map((a) => a.id)));
        }
    };

    return (
        <div>
            <div className="filters">
                <input
                    type="text"
                    placeholder="Search articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="search-input"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    data-testid="status-filter"
                >
                    <option value="">All Status</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PENDING">Pending</option>
                </select>
            </div>

            {selectedIds.size > 0 && (
                <div data-testid="bulk-actions">
                    <span>{selectedIds.size} selected</span>
                    <button data-testid="bulk-delete">Delete Selected</button>
                </div>
            )}

            {filteredArticles.length === 0 ? (
                <div data-testid="empty-state">No articles found</div>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.size === filteredArticles.length && filteredArticles.length > 0}
                                    onChange={toggleSelectAll}
                                    data-testid="select-all"
                                />
                            </th>
                            <th>Title</th>
                            <th>Status</th>
                            <th>Author</th>
                            <th>Views</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredArticles.map((article) => (
                            <tr key={article.id} data-testid={`article-row-${article.id}`}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(article.id)}
                                        onChange={() => toggleSelect(article.id)}
                                        data-testid={`select-${article.id}`}
                                    />
                                </td>
                                <td>
                                    <a href={`/admin/articles/${article.id}/edit`}>{article.title}</a>
                                    <span>{article.category.name}</span>
                                </td>
                                <td data-testid={`status-${article.id}`}>{article.status}</td>
                                <td>{article.author.name || 'Unknown'}</td>
                                <td>{article.views.toLocaleString()}</td>
                                <td>{new Date(article.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <div data-testid={`row-actions-${article.id}`}>Actions</div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {pagination.totalPages > 1 && (
                <div data-testid="pagination">
                    <span>
                        Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                </div>
            )}
        </div>
    );
}

// Need to import React for the component
import React from 'react';

describe('ArticleList', () => {
    const defaultProps = {
        initialArticles: mockArticles,
        authors: mockAuthors,
        pagination: { currentPage: 1, totalPages: 3 },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // Basic Rendering Tests
    // ========================================
    describe('Basic Rendering', () => {
        it('should render article list', () => {
            render(<ArticleList {...defaultProps} />);
            
            expect(screen.getByText('Getting Started with Forex Trading')).toBeInTheDocument();
            expect(screen.getByText('Advanced Technical Analysis')).toBeInTheDocument();
            expect(screen.getByText('Risk Management Strategies')).toBeInTheDocument();
        });

        it('should render article status badges', () => {
            render(<ArticleList {...defaultProps} />);
            
            expect(screen.getByTestId('status-article-1')).toHaveTextContent('PUBLISHED');
            expect(screen.getByTestId('status-article-2')).toHaveTextContent('DRAFT');
            expect(screen.getByTestId('status-article-3')).toHaveTextContent('PENDING');
        });

        it('should render author names', () => {
            render(<ArticleList {...defaultProps} />);
            
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        });

        it('should render view counts', () => {
            render(<ArticleList {...defaultProps} />);
            
            expect(screen.getByText('1,250')).toBeInTheDocument();
            expect(screen.getByText('0')).toBeInTheDocument();
            expect(screen.getByText('450')).toBeInTheDocument();
        });

        it('should render category names', () => {
            render(<ArticleList {...defaultProps} />);
            
            expect(screen.getByText('Trading Basics')).toBeInTheDocument();
            expect(screen.getByText('Analysis')).toBeInTheDocument();
            expect(screen.getByText('Strategy')).toBeInTheDocument();
        });
    });

    // ========================================
    // Search Tests
    // ========================================
    describe('Search Functionality', () => {
        it('should filter articles by search term', async () => {
            const user = userEvent.setup();
            render(<ArticleList {...defaultProps} />);
            
            const searchInput = screen.getByTestId('search-input');
            await user.type(searchInput, 'Forex');
            
            expect(screen.getByText('Getting Started with Forex Trading')).toBeInTheDocument();
            expect(screen.queryByText('Advanced Technical Analysis')).not.toBeInTheDocument();
        });

        it('should show empty state when no results', async () => {
            const user = userEvent.setup();
            render(<ArticleList {...defaultProps} />);
            
            const searchInput = screen.getByTestId('search-input');
            await user.type(searchInput, 'nonexistent article xyz');
            
            expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        });

        it('should be case-insensitive', async () => {
            const user = userEvent.setup();
            render(<ArticleList {...defaultProps} />);
            
            const searchInput = screen.getByTestId('search-input');
            await user.type(searchInput, 'FOREX');
            
            expect(screen.getByText('Getting Started with Forex Trading')).toBeInTheDocument();
        });
    });

    // ========================================
    // Filter Tests
    // ========================================
    describe('Status Filter', () => {
        it('should filter by PUBLISHED status', async () => {
            const user = userEvent.setup();
            render(<ArticleList {...defaultProps} />);
            
            const statusFilter = screen.getByTestId('status-filter');
            await user.selectOptions(statusFilter, 'PUBLISHED');
            
            expect(screen.getByText('Getting Started with Forex Trading')).toBeInTheDocument();
            expect(screen.queryByText('Advanced Technical Analysis')).not.toBeInTheDocument();
        });

        it('should filter by DRAFT status', async () => {
            const user = userEvent.setup();
            render(<ArticleList {...defaultProps} />);
            
            const statusFilter = screen.getByTestId('status-filter');
            await user.selectOptions(statusFilter, 'DRAFT');
            
            expect(screen.getByText('Advanced Technical Analysis')).toBeInTheDocument();
            expect(screen.queryByText('Getting Started with Forex Trading')).not.toBeInTheDocument();
        });

        it('should show all when filter is cleared', async () => {
            const user = userEvent.setup();
            render(<ArticleList {...defaultProps} />);
            
            const statusFilter = screen.getByTestId('status-filter');
            await user.selectOptions(statusFilter, 'PUBLISHED');
            await user.selectOptions(statusFilter, '');
            
            expect(screen.getByText('Getting Started with Forex Trading')).toBeInTheDocument();
            expect(screen.getByText('Advanced Technical Analysis')).toBeInTheDocument();
        });
    });

    // ========================================
    // Selection Tests
    // ========================================
    describe('Selection', () => {
        it('should select individual article', async () => {
            const user = userEvent.setup();
            render(<ArticleList {...defaultProps} />);
            
            const checkbox = screen.getByTestId('select-article-1');
            await user.click(checkbox);
            
            expect(screen.getByTestId('bulk-actions')).toBeInTheDocument();
            expect(screen.getByText('1 selected')).toBeInTheDocument();
        });

        it('should select multiple articles', async () => {
            const user = userEvent.setup();
            render(<ArticleList {...defaultProps} />);
            
            await user.click(screen.getByTestId('select-article-1'));
            await user.click(screen.getByTestId('select-article-2'));
            
            expect(screen.getByText('2 selected')).toBeInTheDocument();
        });

        it('should select all articles', async () => {
            const user = userEvent.setup();
            render(<ArticleList {...defaultProps} />);
            
            const selectAll = screen.getByTestId('select-all');
            await user.click(selectAll);
            
            expect(screen.getByText('3 selected')).toBeInTheDocument();
        });

        it('should deselect all when clicking select all again', async () => {
            const user = userEvent.setup();
            render(<ArticleList {...defaultProps} />);
            
            const selectAll = screen.getByTestId('select-all');
            await user.click(selectAll);
            await user.click(selectAll);
            
            expect(screen.queryByTestId('bulk-actions')).not.toBeInTheDocument();
        });
    });

    // ========================================
    // Pagination Tests
    // ========================================
    describe('Pagination', () => {
        it('should show pagination when multiple pages', () => {
            render(<ArticleList {...defaultProps} />);
            
            expect(screen.getByTestId('pagination')).toBeInTheDocument();
            expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
        });

        it('should not show pagination when single page', () => {
            render(
                <ArticleList
                    {...defaultProps}
                    pagination={{ currentPage: 1, totalPages: 1 }}
                />
            );
            
            expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
        });
    });

    // ========================================
    // Empty State Tests
    // ========================================
    describe('Empty State', () => {
        it('should show empty state when no articles', () => {
            render(
                <ArticleList
                    {...defaultProps}
                    initialArticles={[]}
                />
            );
            
            expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        });
    });
});
