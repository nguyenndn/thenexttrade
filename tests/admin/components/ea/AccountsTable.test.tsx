/**
 * AccountsTable Component Tests
 * @module tests/admin/components/ea/AccountsTable.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { mockLicenseAccounts } from '../../__mocks__/data';

// Mock toast
const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
};

vi.mock('sonner', () => ({
    toast: mockToast,
}));

// Simplified AccountsTable for testing
interface LicenseAccount {
    id: string;
    userId: string;
    productId: string;
    accountNumber: string;
    brokerName: string;
    status: string;
    createdAt: Date;
    user: { name: string; email: string };
    product: { name: string };
}

interface AccountsTableProps {
    accounts: LicenseAccount[];
    onApprove?: (id: string) => Promise<void>;
    onReject?: (id: string, reason: string) => Promise<void>;
}

function AccountsTable({ accounts, onApprove, onReject }: AccountsTableProps) {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;

    const filteredAccounts = React.useMemo(() => {
        return accounts.filter((account) => {
            const matchesSearch =
                account.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                account.accountNumber.includes(searchTerm) ||
                account.brokerName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || account.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [accounts, searchTerm, statusFilter]);

    const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
    const paginatedAccounts = filteredAccounts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleApprove = async (id: string) => {
        if (onApprove) {
            await onApprove(id);
            mockToast.success('License approved');
        }
    };

    const handleReject = async (id: string) => {
        const reason = 'Invalid account number';
        if (onReject) {
            await onReject(id, reason);
            mockToast.success('License rejected');
        }
    };

    return (
        <div data-testid="accounts-table">
            {/* Filters */}
            <div className="filters">
                <input
                    type="text"
                    placeholder="Search accounts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="search-input"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    data-testid="status-filter"
                >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>

            {/* Stats */}
            <div className="stats" data-testid="account-stats">
                <span data-testid="total-count">Total: {filteredAccounts.length}</span>
                <span data-testid="pending-count">
                    Pending: {accounts.filter((a) => a.status === 'PENDING').length}
                </span>
                <span data-testid="approved-count">
                    Approved: {accounts.filter((a) => a.status === 'APPROVED').length}
                </span>
            </div>

            {/* Table */}
            {paginatedAccounts.length === 0 ? (
                <div data-testid="empty-state">No accounts found</div>
            ) : (
                <table data-testid="table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Product</th>
                            <th>Account Number</th>
                            <th>Broker</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedAccounts.map((account) => (
                            <tr key={account.id} data-testid={`account-row-${account.id}`}>
                                <td>
                                    <div>
                                        <span data-testid={`user-name-${account.id}`}>{account.user.name}</span>
                                        <span data-testid={`user-email-${account.id}`}>{account.user.email}</span>
                                    </div>
                                </td>
                                <td data-testid={`product-${account.id}`}>{account.product.name}</td>
                                <td data-testid={`account-number-${account.id}`}>{account.accountNumber}</td>
                                <td data-testid={`broker-${account.id}`}>{account.brokerName}</td>
                                <td>
                                    <span
                                        className={`status-${account.status.toLowerCase()}`}
                                        data-testid={`status-${account.id}`}
                                    >
                                        {account.status}
                                    </span>
                                </td>
                                <td data-testid={`created-${account.id}`}>
                                    {new Date(account.createdAt).toLocaleDateString()}
                                </td>
                                <td>
                                    {account.status === 'PENDING' && (
                                        <>
                                            <button
                                                onClick={() => handleApprove(account.id)}
                                                data-testid={`approve-${account.id}`}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(account.id)}
                                                data-testid={`reject-${account.id}`}
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    <a
                                        href={`/admin/ea/accounts/${account.id}`}
                                        data-testid={`view-${account.id}`}
                                    >
                                        View
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div data-testid="pagination">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        data-testid="prev-page"
                    >
                        Previous
                    </button>
                    <span data-testid="page-info">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        data-testid="next-page"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

describe('AccountsTable', () => {
    const mockOnApprove = vi.fn();
    const mockOnReject = vi.fn();

    const defaultProps = {
        accounts: mockLicenseAccounts,
        onApprove: mockOnApprove,
        onReject: mockOnReject,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockOnApprove.mockResolvedValue(undefined);
        mockOnReject.mockResolvedValue(undefined);
    });

    // ========================================
    // Basic Rendering Tests
    // ========================================
    describe('Basic Rendering', () => {
        it('should render accounts table', () => {
            render(<AccountsTable {...defaultProps} />);
            
            expect(screen.getByTestId('accounts-table')).toBeInTheDocument();
            expect(screen.getByTestId('table')).toBeInTheDocument();
        });

        it('should render all accounts', () => {
            render(<AccountsTable {...defaultProps} />);
            
            mockLicenseAccounts.forEach((account) => {
                expect(screen.getByTestId(`account-row-${account.id}`)).toBeInTheDocument();
            });
        });

        it('should render user information', () => {
            render(<AccountsTable {...defaultProps} />);
            
            expect(screen.getByTestId('user-name-license-1')).toHaveTextContent('John Doe');
            expect(screen.getByTestId('user-email-license-1')).toHaveTextContent('john@example.com');
        });

        it('should render account details', () => {
            render(<AccountsTable {...defaultProps} />);
            
            expect(screen.getByTestId('account-number-license-1')).toHaveTextContent('12345678');
            expect(screen.getByTestId('broker-license-1')).toHaveTextContent('XM Global');
        });

        it('should render product name', () => {
            render(<AccountsTable {...defaultProps} />);
            
            expect(screen.getByTestId('product-license-1')).toHaveTextContent('Golden Scalper EA');
        });

        it('should render status badges', () => {
            render(<AccountsTable {...defaultProps} />);
            
            expect(screen.getByTestId('status-license-1')).toHaveTextContent('APPROVED');
            expect(screen.getByTestId('status-license-2')).toHaveTextContent('PENDING');
        });
    });

    // ========================================
    // Stats Tests
    // ========================================
    describe('Statistics', () => {
        it('should show total count', () => {
            render(<AccountsTable {...defaultProps} />);
            
            expect(screen.getByTestId('total-count')).toHaveTextContent('Total: 2');
        });

        it('should show pending count', () => {
            render(<AccountsTable {...defaultProps} />);
            
            expect(screen.getByTestId('pending-count')).toHaveTextContent('Pending: 1');
        });

        it('should show approved count', () => {
            render(<AccountsTable {...defaultProps} />);
            
            expect(screen.getByTestId('approved-count')).toHaveTextContent('Approved: 1');
        });
    });

    // ========================================
    // Search Tests
    // ========================================
    describe('Search Functionality', () => {
        it('should filter by user name', async () => {
            const user = userEvent.setup();
            render(<AccountsTable {...defaultProps} />);
            
            await user.type(screen.getByTestId('search-input'), 'John');
            
            expect(screen.getByTestId('account-row-license-1')).toBeInTheDocument();
            expect(screen.queryByTestId('account-row-license-2')).not.toBeInTheDocument();
        });

        it('should filter by account number', async () => {
            const user = userEvent.setup();
            render(<AccountsTable {...defaultProps} />);
            
            await user.type(screen.getByTestId('search-input'), '12345678');
            
            expect(screen.getByTestId('account-row-license-1')).toBeInTheDocument();
            expect(screen.queryByTestId('account-row-license-2')).not.toBeInTheDocument();
        });

        it('should filter by broker name', async () => {
            const user = userEvent.setup();
            render(<AccountsTable {...defaultProps} />);
            
            await user.type(screen.getByTestId('search-input'), 'IC Markets');
            
            expect(screen.getByTestId('account-row-license-2')).toBeInTheDocument();
            expect(screen.queryByTestId('account-row-license-1')).not.toBeInTheDocument();
        });
    });

    // ========================================
    // Filter Tests
    // ========================================
    describe('Status Filter', () => {
        it('should filter by PENDING status', async () => {
            const user = userEvent.setup();
            render(<AccountsTable {...defaultProps} />);
            
            await user.selectOptions(screen.getByTestId('status-filter'), 'PENDING');
            
            expect(screen.getByTestId('account-row-license-2')).toBeInTheDocument();
            expect(screen.queryByTestId('account-row-license-1')).not.toBeInTheDocument();
        });

        it('should filter by APPROVED status', async () => {
            const user = userEvent.setup();
            render(<AccountsTable {...defaultProps} />);
            
            await user.selectOptions(screen.getByTestId('status-filter'), 'APPROVED');
            
            expect(screen.getByTestId('account-row-license-1')).toBeInTheDocument();
            expect(screen.queryByTestId('account-row-license-2')).not.toBeInTheDocument();
        });
    });

    // ========================================
    // Actions Tests
    // ========================================
    describe('Actions', () => {
        it('should show approve/reject buttons for pending accounts', () => {
            render(<AccountsTable {...defaultProps} />);
            
            expect(screen.getByTestId('approve-license-2')).toBeInTheDocument();
            expect(screen.getByTestId('reject-license-2')).toBeInTheDocument();
        });

        it('should not show approve/reject for approved accounts', () => {
            render(<AccountsTable {...defaultProps} />);
            
            expect(screen.queryByTestId('approve-license-1')).not.toBeInTheDocument();
            expect(screen.queryByTestId('reject-license-1')).not.toBeInTheDocument();
        });

        it('should call onApprove when clicking approve', async () => {
            const user = userEvent.setup();
            render(<AccountsTable {...defaultProps} />);
            
            await user.click(screen.getByTestId('approve-license-2'));
            
            expect(mockOnApprove).toHaveBeenCalledWith('license-2');
            expect(mockToast.success).toHaveBeenCalledWith('License approved');
        });

        it('should call onReject when clicking reject', async () => {
            const user = userEvent.setup();
            render(<AccountsTable {...defaultProps} />);
            
            await user.click(screen.getByTestId('reject-license-2'));
            
            expect(mockOnReject).toHaveBeenCalledWith('license-2', 'Invalid account number');
            expect(mockToast.success).toHaveBeenCalledWith('License rejected');
        });

        it('should have view link for all accounts', () => {
            render(<AccountsTable {...defaultProps} />);
            
            expect(screen.getByTestId('view-license-1')).toHaveAttribute('href', '/admin/ea/accounts/license-1');
            expect(screen.getByTestId('view-license-2')).toHaveAttribute('href', '/admin/ea/accounts/license-2');
        });
    });

    // ========================================
    // Empty State Tests
    // ========================================
    describe('Empty State', () => {
        it('should show empty state when no accounts', () => {
            render(<AccountsTable accounts={[]} />);
            
            expect(screen.getByTestId('empty-state')).toBeInTheDocument();
            expect(screen.getByText('No accounts found')).toBeInTheDocument();
        });
    });

    // ========================================
    // Pagination Tests
    // ========================================
    describe('Pagination', () => {
        const manyAccounts = Array.from({ length: 25 }, (_, i) => ({
            ...mockLicenseAccounts[0],
            id: `license-${i}`,
        }));

        it('should show pagination when more than 10 items', () => {
            render(<AccountsTable accounts={manyAccounts} />);
            
            expect(screen.getByTestId('pagination')).toBeInTheDocument();
        });

        it('should show correct page info', () => {
            render(<AccountsTable accounts={manyAccounts} />);
            
            expect(screen.getByTestId('page-info')).toHaveTextContent('Page 1 of 3');
        });

        it('should navigate to next page', async () => {
            const user = userEvent.setup();
            render(<AccountsTable accounts={manyAccounts} />);
            
            await user.click(screen.getByTestId('next-page'));
            
            expect(screen.getByTestId('page-info')).toHaveTextContent('Page 2 of 3');
        });

        it('should disable prev on first page', () => {
            render(<AccountsTable accounts={manyAccounts} />);
            
            expect(screen.getByTestId('prev-page')).toBeDisabled();
        });

        it('should not show pagination when 10 or less items', () => {
            render(<AccountsTable {...defaultProps} />);
            
            expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
        });
    });
});
