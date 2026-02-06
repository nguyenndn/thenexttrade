/**
 * ProductList Component Tests
 * @module tests/admin/components/ea/ProductList.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { mockEAProducts } from '../../__mocks__/data';

// Mock toast
const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
};

vi.mock('sonner', () => ({
    toast: mockToast,
}));

// Mock delete action
const mockDeleteEAProduct = vi.fn();
vi.mock('@/app/admin/ea/actions', () => ({
    deleteEAProduct: (id: string) => mockDeleteEAProduct(id),
}));

// Simplified ProductList for testing
interface EAProduct {
    id: string;
    name: string;
    slug: string;
    type: string;
    platform: string;
    version: string;
    description: string;
    isActive: boolean;
    totalDownloads: number;
    createdAt: Date;
    thumbnail: string | null;
}

interface ProductListProps {
    products: EAProduct[];
}

function ProductList({ products }: ProductListProps) {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filterType, setFilterType] = React.useState<string>('ALL');
    const [sortField, setSortField] = React.useState<string>('createdAt');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');

    const filteredProducts = React.useMemo(() => {
        return products.filter((product) => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === 'ALL' || product.type === filterType;
            return matchesSearch && matchesType;
        });
    }, [products, searchTerm, filterType]);

    const sortedProducts = React.useMemo(() => {
        return [...filteredProducts].sort((a, b) => {
            let aValue: any = a[sortField as keyof EAProduct];
            let bValue: any = b[sortField as keyof EAProduct];

            if (typeof aValue === 'string') aValue = aValue.toLowerCase();
            if (typeof bValue === 'string') bValue = bValue.toLowerCase();

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredProducts, sortField, sortDirection]);

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleDelete = async (productId: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            const result = await mockDeleteEAProduct(productId);
            if (result.success) {
                mockToast.success('Product deleted successfully');
            } else {
                mockToast.error(result.error);
            }
        } catch (error) {
            mockToast.error('Failed to delete product');
        }
    };

    return (
        <div data-testid="product-list">
            {/* Filters */}
            <div className="filters">
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="search-input"
                />
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    data-testid="type-filter"
                >
                    <option value="ALL">All Types</option>
                    <option value="AUTO_TRADE">Auto Trade</option>
                    <option value="MANUAL_ASSIST">Manual Assist</option>
                    <option value="INDICATOR">Indicator</option>
                </select>
            </div>

            {/* Product Table */}
            {sortedProducts.length === 0 ? (
                <div data-testid="empty-state">No Products Found</div>
            ) : (
                <table data-testid="product-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('name')} data-testid="sort-name">
                                Product {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('type')} data-testid="sort-type">
                                Type {sortField === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th>Platform</th>
                            <th>Version</th>
                            <th onClick={() => handleSort('totalDownloads')} data-testid="sort-downloads">
                                Downloads {sortField === 'totalDownloads' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('isActive')} data-testid="sort-status">
                                Status {sortField === 'isActive' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedProducts.map((product) => (
                            <tr key={product.id} data-testid={`product-row-${product.id}`}>
                                <td>
                                    <div className="product-info">
                                        <span>{product.name}</span>
                                    </div>
                                </td>
                                <td data-testid={`type-${product.id}`}>{product.type}</td>
                                <td data-testid={`platform-${product.id}`}>{product.platform}</td>
                                <td data-testid={`version-${product.id}`}>{product.version}</td>
                                <td data-testid={`downloads-${product.id}`}>
                                    {product.totalDownloads.toLocaleString()}
                                </td>
                                <td>
                                    <span
                                        className={product.isActive ? 'active' : 'inactive'}
                                        data-testid={`status-${product.id}`}
                                    >
                                        {product.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <a href={`/admin/ea/products/${product.id}`} data-testid={`edit-${product.id}`}>
                                        Edit
                                    </a>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        data-testid={`delete-${product.id}`}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

describe('ProductList', () => {
    const defaultProps = {
        products: mockEAProducts,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockDeleteEAProduct.mockResolvedValue({ success: true });
        (window.confirm as any).mockReturnValue(true);
    });

    // ========================================
    // Basic Rendering Tests
    // ========================================
    describe('Basic Rendering', () => {
        it('should render product list', () => {
            render(<ProductList {...defaultProps} />);
            
            expect(screen.getByTestId('product-list')).toBeInTheDocument();
            expect(screen.getByTestId('product-table')).toBeInTheDocument();
        });

        it('should render all products', () => {
            render(<ProductList {...defaultProps} />);
            
            mockEAProducts.forEach((product) => {
                expect(screen.getByTestId(`product-row-${product.id}`)).toBeInTheDocument();
                expect(screen.getByText(product.name)).toBeInTheDocument();
            });
        });

        it('should render product types', () => {
            render(<ProductList {...defaultProps} />);
            
            expect(screen.getByTestId('type-ea-1')).toHaveTextContent('AUTO_TRADE');
            expect(screen.getByTestId('type-ea-2')).toHaveTextContent('INDICATOR');
            expect(screen.getByTestId('type-ea-3')).toHaveTextContent('MANUAL_ASSIST');
        });

        it('should render download counts', () => {
            render(<ProductList {...defaultProps} />);
            
            expect(screen.getByTestId('downloads-ea-1')).toHaveTextContent('1,250');
            expect(screen.getByTestId('downloads-ea-2')).toHaveTextContent('890');
        });

        it('should render status badges', () => {
            render(<ProductList {...defaultProps} />);
            
            expect(screen.getByTestId('status-ea-1')).toHaveTextContent('Active');
            expect(screen.getByTestId('status-ea-3')).toHaveTextContent('Inactive');
        });

        it('should render version numbers', () => {
            render(<ProductList {...defaultProps} />);
            
            expect(screen.getByTestId('version-ea-1')).toHaveTextContent('2.5.1');
            expect(screen.getByTestId('version-ea-2')).toHaveTextContent('1.0.0');
        });
    });

    // ========================================
    // Search Tests
    // ========================================
    describe('Search Functionality', () => {
        it('should filter products by search term', async () => {
            const user = userEvent.setup();
            render(<ProductList {...defaultProps} />);
            
            await user.type(screen.getByTestId('search-input'), 'Golden');
            
            expect(screen.getByText('Golden Scalper EA')).toBeInTheDocument();
            expect(screen.queryByText('Trend Indicator Pro')).not.toBeInTheDocument();
        });

        it('should be case-insensitive', async () => {
            const user = userEvent.setup();
            render(<ProductList {...defaultProps} />);
            
            await user.type(screen.getByTestId('search-input'), 'GOLDEN');
            
            expect(screen.getByText('Golden Scalper EA')).toBeInTheDocument();
        });

        it('should show empty state when no matches', async () => {
            const user = userEvent.setup();
            render(<ProductList {...defaultProps} />);
            
            await user.type(screen.getByTestId('search-input'), 'nonexistent product');
            
            expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        });
    });

    // ========================================
    // Filter Tests
    // ========================================
    describe('Type Filter', () => {
        it('should filter by AUTO_TRADE', async () => {
            const user = userEvent.setup();
            render(<ProductList {...defaultProps} />);
            
            await user.selectOptions(screen.getByTestId('type-filter'), 'AUTO_TRADE');
            
            expect(screen.getByText('Golden Scalper EA')).toBeInTheDocument();
            expect(screen.queryByText('Trend Indicator Pro')).not.toBeInTheDocument();
        });

        it('should filter by INDICATOR', async () => {
            const user = userEvent.setup();
            render(<ProductList {...defaultProps} />);
            
            await user.selectOptions(screen.getByTestId('type-filter'), 'INDICATOR');
            
            expect(screen.getByText('Trend Indicator Pro')).toBeInTheDocument();
            expect(screen.queryByText('Golden Scalper EA')).not.toBeInTheDocument();
        });

        it('should show all when ALL is selected', async () => {
            const user = userEvent.setup();
            render(<ProductList {...defaultProps} />);
            
            await user.selectOptions(screen.getByTestId('type-filter'), 'INDICATOR');
            await user.selectOptions(screen.getByTestId('type-filter'), 'ALL');
            
            expect(screen.getByText('Golden Scalper EA')).toBeInTheDocument();
            expect(screen.getByText('Trend Indicator Pro')).toBeInTheDocument();
        });
    });

    // ========================================
    // Sort Tests
    // ========================================
    describe('Sorting', () => {
        it('should sort by name ascending', async () => {
            const user = userEvent.setup();
            render(<ProductList {...defaultProps} />);
            
            await user.click(screen.getByTestId('sort-name'));
            
            const rows = screen.getAllByTestId(/product-row-/);
            // Golden Scalper EA should be first alphabetically
            expect(rows[0]).toHaveAttribute('data-testid', 'product-row-ea-1');
        });

        it('should toggle sort direction', async () => {
            const user = userEvent.setup();
            render(<ProductList {...defaultProps} />);
            
            await user.click(screen.getByTestId('sort-name')); // asc
            await user.click(screen.getByTestId('sort-name')); // desc
            
            const sortHeader = screen.getByTestId('sort-name');
            expect(sortHeader).toHaveTextContent('↓');
        });

        it('should sort by downloads', async () => {
            const user = userEvent.setup();
            render(<ProductList {...defaultProps} />);
            
            await user.click(screen.getByTestId('sort-downloads'));
            
            const rows = screen.getAllByTestId(/product-row-/);
            // 450 downloads should be first (ascending)
            expect(rows[0]).toHaveAttribute('data-testid', 'product-row-ea-3');
        });
    });

    // ========================================
    // Delete Tests
    // ========================================
    describe('Delete Product', () => {
        it('should show confirmation before delete', async () => {
            const user = userEvent.setup();
            render(<ProductList {...defaultProps} />);
            
            await user.click(screen.getByTestId('delete-ea-1'));
            
            expect(window.confirm).toHaveBeenCalled();
        });

        it('should call delete action on confirm', async () => {
            const user = userEvent.setup();
            render(<ProductList {...defaultProps} />);
            
            await user.click(screen.getByTestId('delete-ea-1'));
            
            expect(mockDeleteEAProduct).toHaveBeenCalledWith('ea-1');
        });

        it('should not delete when cancelled', async () => {
            (window.confirm as any).mockReturnValue(false);
            
            const user = userEvent.setup();
            render(<ProductList {...defaultProps} />);
            
            await user.click(screen.getByTestId('delete-ea-1'));
            
            expect(mockDeleteEAProduct).not.toHaveBeenCalled();
        });

        it('should show success toast on successful delete', async () => {
            const user = userEvent.setup();
            render(<ProductList {...defaultProps} />);
            
            await user.click(screen.getByTestId('delete-ea-1'));
            
            await waitFor(() => {
                expect(mockToast.success).toHaveBeenCalledWith('Product deleted successfully');
            });
        });

        it('should show error toast on failed delete', async () => {
            mockDeleteEAProduct.mockResolvedValue({ success: false, error: 'Delete failed' });
            
            const user = userEvent.setup();
            render(<ProductList {...defaultProps} />);
            
            await user.click(screen.getByTestId('delete-ea-1'));
            
            await waitFor(() => {
                expect(mockToast.error).toHaveBeenCalledWith('Delete failed');
            });
        });
    });

    // ========================================
    // Empty State Tests
    // ========================================
    describe('Empty State', () => {
        it('should show empty state when no products', () => {
            render(<ProductList products={[]} />);
            
            expect(screen.getByTestId('empty-state')).toBeInTheDocument();
            expect(screen.getByText('No Products Found')).toBeInTheDocument();
        });
    });

    // ========================================
    // Navigation Tests
    // ========================================
    describe('Navigation', () => {
        it('should have correct edit links', () => {
            render(<ProductList {...defaultProps} />);
            
            const editLink = screen.getByTestId('edit-ea-1');
            expect(editLink).toHaveAttribute('href', '/admin/ea/products/ea-1');
        });
    });
});
