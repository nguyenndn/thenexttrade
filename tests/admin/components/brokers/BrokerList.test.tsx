/**
 * Brokers Module Tests
 * @module tests/admin/components/brokers/BrokerList.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { mockBrokers } from '../../__mocks__/data';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock sonner
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Simplified BrokerList for testing
interface Broker {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    rating: number;
    isActive: boolean;
    isFeatured: boolean;
    minDeposit: number;
    leverage: string;
    regulations: string[];
    platforms: string[];
    createdAt: Date;
}

interface BrokerListProps {
    brokers: Broker[];
}

function BrokerList({ brokers: initialBrokers }: BrokerListProps) {
    const [brokers, setBrokers] = React.useState(initialBrokers);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
    const [featuredFilter, setFeaturedFilter] = React.useState<'ALL' | 'FEATURED' | 'NORMAL'>('ALL');

    const filteredBrokers = React.useMemo(() => {
        return brokers.filter((broker) => {
            const matchesSearch = broker.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus =
                statusFilter === 'ALL' ||
                (statusFilter === 'ACTIVE' && broker.isActive) ||
                (statusFilter === 'INACTIVE' && !broker.isActive);
            const matchesFeatured =
                featuredFilter === 'ALL' ||
                (featuredFilter === 'FEATURED' && broker.isFeatured) ||
                (featuredFilter === 'NORMAL' && !broker.isFeatured);
            return matchesSearch && matchesStatus && matchesFeatured;
        });
    }, [brokers, searchTerm, statusFilter, featuredFilter]);

    const handleToggleActive = async (id: string) => {
        const broker = brokers.find((b) => b.id === id);
        if (!broker) return;

        const response = await fetch(`/api/admin/brokers/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !broker.isActive }),
        });

        if (response.ok) {
            setBrokers(
                brokers.map((b) =>
                    b.id === id ? { ...b, isActive: !b.isActive } : b
                )
            );
        }
    };

    const handleToggleFeatured = async (id: string) => {
        const broker = brokers.find((b) => b.id === id);
        if (!broker) return;

        const response = await fetch(`/api/admin/brokers/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isFeatured: !broker.isFeatured }),
        });

        if (response.ok) {
            setBrokers(
                brokers.map((b) =>
                    b.id === id ? { ...b, isFeatured: !b.isFeatured } : b
                )
            );
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure?')) return;

        const response = await fetch(`/api/admin/brokers/${id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            setBrokers(brokers.filter((b) => b.id !== id));
        }
    };

    return (
        <div data-testid="broker-list">
            {/* Filters */}
            <div className="filters">
                <input
                    type="text"
                    placeholder="Search brokers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="search-input"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
                    data-testid="status-filter"
                >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                </select>
                <select
                    value={featuredFilter}
                    onChange={(e) => setFeaturedFilter(e.target.value as 'ALL' | 'FEATURED' | 'NORMAL')}
                    data-testid="featured-filter"
                >
                    <option value="ALL">All Types</option>
                    <option value="FEATURED">Featured</option>
                    <option value="NORMAL">Normal</option>
                </select>
                <a href="/admin/brokers/new" data-testid="add-broker-btn">
                    Add Broker
                </a>
            </div>

            {/* Broker Table */}
            {filteredBrokers.length === 0 ? (
                <div data-testid="empty-state">No brokers found</div>
            ) : (
                <table data-testid="broker-table">
                    <thead>
                        <tr>
                            <th>Broker</th>
                            <th>Rating</th>
                            <th>Min Deposit</th>
                            <th>Leverage</th>
                            <th>Regulations</th>
                            <th>Status</th>
                            <th>Featured</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBrokers.map((broker) => (
                            <tr key={broker.id} data-testid={`broker-row-${broker.id}`}>
                                <td>
                                    <div className="broker-info">
                                        {broker.logo && (
                                            <img
                                                src={broker.logo}
                                                alt={broker.name}
                                                data-testid={`logo-${broker.id}`}
                                            />
                                        )}
                                        <span data-testid={`name-${broker.id}`}>{broker.name}</span>
                                    </div>
                                </td>
                                <td data-testid={`rating-${broker.id}`}>⭐ {broker.rating}</td>
                                <td data-testid={`deposit-${broker.id}`}>${broker.minDeposit}</td>
                                <td data-testid={`leverage-${broker.id}`}>{broker.leverage}</td>
                                <td data-testid={`regulations-${broker.id}`}>
                                    {broker.regulations.join(', ')}
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleToggleActive(broker.id)}
                                        data-testid={`toggle-active-${broker.id}`}
                                        className={broker.isActive ? 'active' : 'inactive'}
                                    >
                                        {broker.isActive ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleToggleFeatured(broker.id)}
                                        data-testid={`toggle-featured-${broker.id}`}
                                        className={broker.isFeatured ? 'featured' : 'normal'}
                                    >
                                        {broker.isFeatured ? '⭐ Featured' : 'Normal'}
                                    </button>
                                </td>
                                <td>
                                    <a
                                        href={`/admin/brokers/${broker.id}`}
                                        data-testid={`edit-${broker.id}`}
                                    >
                                        Edit
                                    </a>
                                    <button
                                        onClick={() => handleDelete(broker.id)}
                                        data-testid={`delete-${broker.id}`}
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

describe('BrokerList', () => {
    const defaultProps = {
        brokers: mockBrokers,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ success: true }),
        });
        vi.stubGlobal('confirm', vi.fn(() => true));
    });

    // ========================================
    // Basic Rendering Tests
    // ========================================
    describe('Basic Rendering', () => {
        it('should render broker list', () => {
            render(<BrokerList {...defaultProps} />);

            expect(screen.getByTestId('broker-list')).toBeInTheDocument();
            expect(screen.getByTestId('broker-table')).toBeInTheDocument();
        });

        it('should render all brokers', () => {
            render(<BrokerList {...defaultProps} />);

            mockBrokers.forEach((broker) => {
                expect(screen.getByTestId(`broker-row-${broker.id}`)).toBeInTheDocument();
            });
        });

        it('should display broker names', () => {
            render(<BrokerList {...defaultProps} />);

            expect(screen.getByTestId('name-broker-1')).toHaveTextContent('XM Trading');
            expect(screen.getByTestId('name-broker-2')).toHaveTextContent('IC Markets');
        });

        it('should display broker ratings', () => {
            render(<BrokerList {...defaultProps} />);

            expect(screen.getByTestId('rating-broker-1')).toHaveTextContent('⭐ 4.5');
        });

        it('should display min deposit', () => {
            render(<BrokerList {...defaultProps} />);

            expect(screen.getByTestId('deposit-broker-1')).toHaveTextContent('$5');
        });

        it('should display leverage', () => {
            render(<BrokerList {...defaultProps} />);

            expect(screen.getByTestId('leverage-broker-1')).toHaveTextContent('1:888');
        });

        it('should display regulations', () => {
            render(<BrokerList {...defaultProps} />);

            expect(screen.getByTestId('regulations-broker-1')).toHaveTextContent('CySEC, ASIC');
        });
    });

    // ========================================
    // Search Tests
    // ========================================
    describe('Search Functionality', () => {
        it('should filter by broker name', async () => {
            const user = userEvent.setup();
            render(<BrokerList {...defaultProps} />);

            await user.type(screen.getByTestId('search-input'), 'XM');

            expect(screen.getByTestId('broker-row-broker-1')).toBeInTheDocument();
            expect(screen.queryByTestId('broker-row-broker-2')).not.toBeInTheDocument();
        });

        it('should be case-insensitive', async () => {
            const user = userEvent.setup();
            render(<BrokerList {...defaultProps} />);

            await user.type(screen.getByTestId('search-input'), 'ic markets');

            expect(screen.getByTestId('broker-row-broker-2')).toBeInTheDocument();
        });

        it('should show empty state when no matches', async () => {
            const user = userEvent.setup();
            render(<BrokerList {...defaultProps} />);

            await user.type(screen.getByTestId('search-input'), 'nonexistent');

            expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        });
    });

    // ========================================
    // Status Filter Tests
    // ========================================
    describe('Status Filter', () => {
        it('should filter active brokers', async () => {
            const user = userEvent.setup();
            render(<BrokerList {...defaultProps} />);

            await user.selectOptions(screen.getByTestId('status-filter'), 'ACTIVE');

            expect(screen.getByTestId('broker-row-broker-1')).toBeInTheDocument();
            expect(screen.queryByTestId('broker-row-broker-2')).not.toBeInTheDocument();
        });

        it('should filter inactive brokers', async () => {
            const user = userEvent.setup();
            render(<BrokerList {...defaultProps} />);

            await user.selectOptions(screen.getByTestId('status-filter'), 'INACTIVE');

            expect(screen.getByTestId('broker-row-broker-2')).toBeInTheDocument();
            expect(screen.queryByTestId('broker-row-broker-1')).not.toBeInTheDocument();
        });
    });

    // ========================================
    // Featured Filter Tests
    // ========================================
    describe('Featured Filter', () => {
        it('should filter featured brokers', async () => {
            const user = userEvent.setup();
            render(<BrokerList {...defaultProps} />);

            await user.selectOptions(screen.getByTestId('featured-filter'), 'FEATURED');

            expect(screen.getByTestId('broker-row-broker-1')).toBeInTheDocument();
            expect(screen.queryByTestId('broker-row-broker-2')).not.toBeInTheDocument();
        });

        it('should filter normal brokers', async () => {
            const user = userEvent.setup();
            render(<BrokerList {...defaultProps} />);

            await user.selectOptions(screen.getByTestId('featured-filter'), 'NORMAL');

            expect(screen.getByTestId('broker-row-broker-2')).toBeInTheDocument();
            expect(screen.queryByTestId('broker-row-broker-1')).not.toBeInTheDocument();
        });
    });

    // ========================================
    // Toggle Active Tests
    // ========================================
    describe('Toggle Active Status', () => {
        it('should toggle broker active status', async () => {
            const user = userEvent.setup();
            render(<BrokerList {...defaultProps} />);

            await user.click(screen.getByTestId('toggle-active-broker-1'));

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/admin/brokers/broker-1',
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isActive: false }),
                }
            );
        });

        it('should update UI after toggle', async () => {
            const user = userEvent.setup();
            render(<BrokerList {...defaultProps} />);

            const toggleBtn = screen.getByTestId('toggle-active-broker-1');
            expect(toggleBtn).toHaveTextContent('Active');

            await user.click(toggleBtn);

            await waitFor(() => {
                expect(screen.getByTestId('toggle-active-broker-1')).toHaveTextContent('Inactive');
            });
        });
    });

    // ========================================
    // Toggle Featured Tests
    // ========================================
    describe('Toggle Featured Status', () => {
        it('should toggle broker featured status', async () => {
            const user = userEvent.setup();
            render(<BrokerList {...defaultProps} />);

            await user.click(screen.getByTestId('toggle-featured-broker-1'));

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/admin/brokers/broker-1',
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isFeatured: false }),
                }
            );
        });
    });

    // ========================================
    // Delete Tests
    // ========================================
    describe('Delete Broker', () => {
        it('should confirm before delete', async () => {
            const user = userEvent.setup();
            render(<BrokerList {...defaultProps} />);

            await user.click(screen.getByTestId('delete-broker-1'));

            expect(window.confirm).toHaveBeenCalledWith('Are you sure?');
        });

        it('should delete broker on confirm', async () => {
            const user = userEvent.setup();
            render(<BrokerList {...defaultProps} />);

            await user.click(screen.getByTestId('delete-broker-1'));

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/admin/brokers/broker-1',
                { method: 'DELETE' }
            );
        });

        it('should not delete on cancel', async () => {
            vi.stubGlobal('confirm', vi.fn(() => false));
            const user = userEvent.setup();
            render(<BrokerList {...defaultProps} />);

            await user.click(screen.getByTestId('delete-broker-1'));

            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('should remove broker from list after delete', async () => {
            const user = userEvent.setup();
            render(<BrokerList {...defaultProps} />);

            await user.click(screen.getByTestId('delete-broker-1'));

            await waitFor(() => {
                expect(screen.queryByTestId('broker-row-broker-1')).not.toBeInTheDocument();
            });
        });
    });

    // ========================================
    // Navigation Tests
    // ========================================
    describe('Navigation', () => {
        it('should have add broker link', () => {
            render(<BrokerList {...defaultProps} />);

            const addBtn = screen.getByTestId('add-broker-btn');
            expect(addBtn).toHaveAttribute('href', '/admin/brokers/new');
        });

        it('should have edit links', () => {
            render(<BrokerList {...defaultProps} />);

            const editLink = screen.getByTestId('edit-broker-1');
            expect(editLink).toHaveAttribute('href', '/admin/brokers/broker-1');
        });
    });

    // ========================================
    // Empty State Tests
    // ========================================
    describe('Empty State', () => {
        it('should show empty state when no brokers', () => {
            render(<BrokerList brokers={[]} />);

            expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        });
    });
});
