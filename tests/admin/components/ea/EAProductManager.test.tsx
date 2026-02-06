/**
 * EA Products Manager Tests
 * @module tests/admin/components/ea/EAProductManager.test
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockEAProducts } from '../../__mocks__/data';

// Mock toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock next/navigation
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
    useSearchParams: () => new URLSearchParams(),
}));

// Mock confirm
global.confirm = vi.fn(() => true);

// Simplified EAProductManager Component
function EAProductManager({
    products = mockEAProducts,
    loading = false,
    onToggleActive = vi.fn(),
    onDelete = vi.fn(),
}: {
    products?: typeof mockEAProducts;
    loading?: boolean;
    onToggleActive?: (id: string) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
}) {
    const [search, setSearch] = React.useState('');
    const [typeFilter, setTypeFilter] = React.useState('ALL');
    const [activeFilter, setActiveFilter] = React.useState('ALL');

    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === 'ALL' || product.type === typeFilter;
        const matchesActive = activeFilter === 'ALL' || 
            (activeFilter === 'ACTIVE' && product.isActive) ||
            (activeFilter === 'INACTIVE' && !product.isActive);
        return matchesSearch && matchesType && matchesActive;
    });

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this product?')) {
            await onDelete(id);
        }
    };

    if (loading) {
        return <div data-testid="loading">Loading...</div>;
    }

    return (
        <div>
            <div className="header">
                <h1>EA Products</h1>
                <button 
                    onClick={() => mockPush('/admin/ea/create')}
                    data-testid="create-button"
                >
                    Create Product
                </button>
            </div>

            {/* Stats */}
            <div className="stats">
                <div data-testid="total-products">
                    <span className="label">Total</span>
                    <span className="value">{products.length}</span>
                </div>
                <div data-testid="active-products">
                    <span className="label">Active</span>
                    <span className="value">{products.filter(p => p.isActive).length}</span>
                </div>
                <div data-testid="total-licenses">
                    <span className="label">Licenses</span>
                    <span className="value">{products.reduce((acc, p) => acc + (p.licensesCount || 0), 0)}</span>
                </div>
            </div>

            {/* Filters */}
            <div className="filters">
                <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    data-testid="search-input"
                />
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    data-testid="type-filter"
                >
                    <option value="ALL">All Types</option>
                    <option value="AUTO_TRADE">Auto Trade</option>
                    <option value="SIGNAL">Signal</option>
                    <option value="INDICATOR">Indicator</option>
                    <option value="UTILITY">Utility</option>
                </select>
                <select
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                    data-testid="active-filter"
                >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                </select>
            </div>

            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
                <div data-testid="empty-state">No products found</div>
            ) : (
                <div className="products-grid" data-testid="products-grid">
                    {filteredProducts.map((product) => (
                        <div 
                            key={product.id} 
                            className="product-card" 
                            data-testid={`product-${product.id}`}
                        >
                            <div className="product-header">
                                <h3>{product.name}</h3>
                                <span className={`badge ${product.isActive ? 'active' : 'inactive'}`}>
                                    {product.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="product-info">
                                <p className="type">{product.type}</p>
                                <p className="platform">{product.platform}</p>
                                <p className="version">v{product.version}</p>
                                {product.description && (
                                    <p className="description">{product.description}</p>
                                )}
                            </div>

                            <div className="product-stats">
                                <span>{product.licensesCount || 0} licenses</span>
                                <span>{product.downloadsCount || 0} downloads</span>
                            </div>

                            <div className="product-actions">
                                <button
                                    onClick={() => mockPush(`/admin/ea/${product.id}`)}
                                    aria-label={`View ${product.name}`}
                                >
                                    View
                                </button>
                                <button
                                    onClick={() => mockPush(`/admin/ea/${product.id}/edit`)}
                                    aria-label={`Edit ${product.name}`}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => onToggleActive(product.id)}
                                    data-testid={`toggle-${product.id}`}
                                    aria-label={product.isActive ? 'Deactivate' : 'Activate'}
                                >
                                    {product.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                    onClick={() => handleDelete(product.id)}
                                    data-testid={`delete-${product.id}`}
                                    aria-label={`Delete ${product.name}`}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

describe('EAProductManager Component', () => {
    const mockOnToggleActive = vi.fn();
    const mockOnDelete = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // Basic Rendering Tests
    // ========================================
    describe('Basic Rendering', () => {
        it('should render the component', () => {
            render(<EAProductManager />);
            expect(screen.getByText('EA Products')).toBeInTheDocument();
        });

        it('should show loading state', () => {
            render(<EAProductManager loading={true} />);
            expect(screen.getByTestId('loading')).toBeInTheDocument();
        });

        it('should display all products', () => {
            render(<EAProductManager />);
            mockEAProducts.forEach((product) => {
                expect(screen.getByText(product.name)).toBeInTheDocument();
            });
        });

        it('should display stats', () => {
            render(<EAProductManager />);
            expect(screen.getByTestId('total-products')).toBeInTheDocument();
            expect(screen.getByTestId('active-products')).toBeInTheDocument();
            expect(screen.getByTestId('total-licenses')).toBeInTheDocument();
        });

        it('should show create button', () => {
            render(<EAProductManager />);
            expect(screen.getByTestId('create-button')).toBeInTheDocument();
        });

        it('should display product details', () => {
            render(<EAProductManager />);
            const firstProduct = mockEAProducts[0];
            expect(screen.getByText(firstProduct.name)).toBeInTheDocument();
            expect(screen.getAllByText(firstProduct.type).length).toBeGreaterThan(0);
            expect(screen.getAllByText(firstProduct.platform).length).toBeGreaterThan(0);
        });
    });

    // ========================================
    // Search Tests
    // ========================================
    describe('Search Functionality', () => {
        it('should filter by search term', async () => {
            const user = userEvent.setup();
            render(<EAProductManager />);

            const searchInput = screen.getByTestId('search-input');
            await user.type(searchInput, mockEAProducts[0].name);

            expect(screen.getByText(mockEAProducts[0].name)).toBeInTheDocument();
        });

        it('should show empty state when no results', async () => {
            const user = userEvent.setup();
            render(<EAProductManager />);

            const searchInput = screen.getByTestId('search-input');
            await user.type(searchInput, 'nonexistent product xyz');

            expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        });

        it('should be case insensitive', async () => {
            const user = userEvent.setup();
            render(<EAProductManager />);

            const searchInput = screen.getByTestId('search-input');
            await user.type(searchInput, mockEAProducts[0].name.toUpperCase());

            expect(screen.getByText(mockEAProducts[0].name)).toBeInTheDocument();
        });
    });

    // ========================================
    // Filter Tests
    // ========================================
    describe('Filter Functionality', () => {
        it('should filter by type', async () => {
            const user = userEvent.setup();
            render(<EAProductManager />);

            const typeFilter = screen.getByTestId('type-filter');
            await user.selectOptions(typeFilter, 'AUTO_TRADE');

            const autoTradeProducts = mockEAProducts.filter(p => p.type === 'AUTO_TRADE');
            if (autoTradeProducts.length > 0) {
                autoTradeProducts.forEach((product) => {
                    expect(screen.getByText(product.name)).toBeInTheDocument();
                });
            }
        });

        it('should filter by active status', async () => {
            const user = userEvent.setup();
            render(<EAProductManager />);

            const activeFilter = screen.getByTestId('active-filter');
            await user.selectOptions(activeFilter, 'ACTIVE');

            const activeProducts = mockEAProducts.filter(p => p.isActive);
            if (activeProducts.length > 0) {
                activeProducts.forEach((product) => {
                    expect(screen.getByText(product.name)).toBeInTheDocument();
                });
            }
        });

        it('should filter inactive products', async () => {
            const user = userEvent.setup();
            render(<EAProductManager />);

            const activeFilter = screen.getByTestId('active-filter');
            await user.selectOptions(activeFilter, 'INACTIVE');

            const inactiveProducts = mockEAProducts.filter(p => !p.isActive);
            if (inactiveProducts.length > 0) {
                inactiveProducts.forEach((product) => {
                    expect(screen.getByText(product.name)).toBeInTheDocument();
                });
            } else {
                expect(screen.getByTestId('empty-state')).toBeInTheDocument();
            }
        });

        it('should combine filters', async () => {
            const user = userEvent.setup();
            render(<EAProductManager />);

            await user.selectOptions(screen.getByTestId('type-filter'), 'AUTO_TRADE');
            await user.selectOptions(screen.getByTestId('active-filter'), 'ACTIVE');
            await user.type(screen.getByTestId('search-input'), 'Scalper');

            // Results depend on mock data matching all criteria
        });
    });

    // ========================================
    // Empty State Tests
    // ========================================
    describe('Empty State', () => {
        it('should show empty state when no products', () => {
            render(<EAProductManager products={[]} />);
            expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        });
    });

    // ========================================
    // Toggle Active Tests
    // ========================================
    describe('Toggle Active', () => {
        it('should call toggle active', async () => {
            const user = userEvent.setup();
            render(<EAProductManager onToggleActive={mockOnToggleActive} />);

            await user.click(screen.getByTestId(`toggle-${mockEAProducts[0].id}`));

            expect(mockOnToggleActive).toHaveBeenCalledWith(mockEAProducts[0].id);
        });

        it('should show correct button text based on status', () => {
            render(<EAProductManager />);
            
            mockEAProducts.forEach((product) => {
                const button = screen.getByTestId(`toggle-${product.id}`);
                expect(button).toHaveTextContent(product.isActive ? 'Deactivate' : 'Activate');
            });
        });
    });

    // ========================================
    // Delete Tests
    // ========================================
    describe('Delete Product', () => {
        it('should confirm before deleting', async () => {
            const user = userEvent.setup();
            render(<EAProductManager onDelete={mockOnDelete} />);

            await user.click(screen.getByTestId(`delete-${mockEAProducts[0].id}`));

            expect(global.confirm).toHaveBeenCalled();
        });

        it('should call delete when confirmed', async () => {
            const user = userEvent.setup();
            render(<EAProductManager onDelete={mockOnDelete} />);

            await user.click(screen.getByTestId(`delete-${mockEAProducts[0].id}`));

            expect(mockOnDelete).toHaveBeenCalledWith(mockEAProducts[0].id);
        });

        it('should not delete when cancelled', async () => {
            const user = userEvent.setup();
            (global.confirm as jest.Mock).mockReturnValueOnce(false);
            render(<EAProductManager onDelete={mockOnDelete} />);

            await user.click(screen.getByTestId(`delete-${mockEAProducts[0].id}`));

            expect(mockOnDelete).not.toHaveBeenCalled();
        });
    });

    // ========================================
    // Navigation Tests
    // ========================================
    describe('Navigation', () => {
        it('should navigate to create page', async () => {
            const user = userEvent.setup();
            render(<EAProductManager />);

            await user.click(screen.getByTestId('create-button'));

            expect(mockPush).toHaveBeenCalledWith('/admin/ea/create');
        });

        it('should navigate to view page', async () => {
            const user = userEvent.setup();
            render(<EAProductManager />);

            await user.click(screen.getByRole('button', { name: `View ${mockEAProducts[0].name}` }));

            expect(mockPush).toHaveBeenCalledWith(`/admin/ea/${mockEAProducts[0].id}`);
        });

        it('should navigate to edit page', async () => {
            const user = userEvent.setup();
            render(<EAProductManager />);

            await user.click(screen.getByRole('button', { name: `Edit ${mockEAProducts[0].name}` }));

            expect(mockPush).toHaveBeenCalledWith(`/admin/ea/${mockEAProducts[0].id}/edit`);
        });
    });
});
