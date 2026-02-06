/**
 * Users Module Tests
 * @module tests/admin/components/users/UserList.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { mockUsers, mockUserStats } from '../../__mocks__/data';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
    useSearchParams: () => new URLSearchParams(),
}));

// Simplified UserList for testing
interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    image: string | null;
    createdAt: Date;
    lastLogin: Date;
}

interface UserListProps {
    users: User[];
    stats: typeof mockUserStats;
    pagination: { currentPage: number; totalPages: number };
}

function UserList({ users, stats, pagination }: UserListProps) {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [roleFilter, setRoleFilter] = React.useState<string>('ALL');
    const [currentPage, setCurrentPage] = React.useState(pagination.currentPage);

    const filteredUsers = React.useMemo(() => {
        return users.filter((user) => {
            const matchesSearch =
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [users, searchTerm, roleFilter]);

    return (
        <div data-testid="user-list">
            {/* Stats Cards */}
            <div className="stats-grid" data-testid="stats-grid">
                <div data-testid="stat-total">{stats.totalUsers} Total Users</div>
                <div data-testid="stat-new">{stats.newUsersThisMonth} New This Month</div>
                <div data-testid="stat-active">{stats.activeUsers} Active Users</div>
            </div>

            {/* Filters */}
            <div className="filters">
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="search-input"
                />
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    data-testid="role-filter"
                >
                    <option value="ALL">All Roles</option>
                    <option value="ADMIN">Admin</option>
                    <option value="EDITOR">Editor</option>
                    <option value="USER">User</option>
                </select>
            </div>

            {/* User Table */}
            {filteredUsers.length === 0 ? (
                <div data-testid="empty-state">No users found</div>
            ) : (
                <table data-testid="user-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th>Last Login</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user.id} data-testid={`user-row-${user.id}`}>
                                <td>
                                    <div className="user-info">
                                        {user.image && (
                                            <img
                                                src={user.image}
                                                alt={user.name}
                                                data-testid={`avatar-${user.id}`}
                                            />
                                        )}
                                        <span data-testid={`name-${user.id}`}>{user.name}</span>
                                    </div>
                                </td>
                                <td data-testid={`email-${user.id}`}>{user.email}</td>
                                <td>
                                    <span
                                        className={`role-badge role-${user.role.toLowerCase()}`}
                                        data-testid={`role-${user.id}`}
                                    >
                                        {user.role}
                                    </span>
                                </td>
                                <td data-testid={`joined-${user.id}`}>
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td data-testid={`last-login-${user.id}`}>
                                    {new Date(user.lastLogin).toLocaleDateString()}
                                </td>
                                <td>
                                    <a
                                        href={`/admin/users/${user.id}`}
                                        data-testid={`view-${user.id}`}
                                    >
                                        View
                                    </a>
                                    <button data-testid={`edit-role-${user.id}`}>
                                        Edit Role
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div data-testid="pagination">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        data-testid="prev-page"
                    >
                        Previous
                    </button>
                    <span data-testid="page-info">
                        Page {currentPage} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                        disabled={currentPage === pagination.totalPages}
                        data-testid="next-page"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

describe('UserList', () => {
    const defaultProps = {
        users: mockUsers,
        stats: mockUserStats,
        pagination: { currentPage: 1, totalPages: 3 },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // Basic Rendering Tests
    // ========================================
    describe('Basic Rendering', () => {
        it('should render user list', () => {
            render(<UserList {...defaultProps} />);
            
            expect(screen.getByTestId('user-list')).toBeInTheDocument();
            expect(screen.getByTestId('user-table')).toBeInTheDocument();
        });

        it('should render all users', () => {
            render(<UserList {...defaultProps} />);
            
            mockUsers.forEach((user) => {
                expect(screen.getByTestId(`user-row-${user.id}`)).toBeInTheDocument();
            });
        });

        it('should display user names', () => {
            render(<UserList {...defaultProps} />);
            
            expect(screen.getByTestId('name-user-1')).toHaveTextContent('John Doe');
            expect(screen.getByTestId('name-user-2')).toHaveTextContent('Jane Smith');
        });

        it('should display user emails', () => {
            render(<UserList {...defaultProps} />);
            
            expect(screen.getByTestId('email-user-1')).toHaveTextContent('john@example.com');
            expect(screen.getByTestId('email-user-2')).toHaveTextContent('jane@example.com');
        });

        it('should display role badges', () => {
            render(<UserList {...defaultProps} />);
            
            expect(screen.getByTestId('role-user-1')).toHaveTextContent('ADMIN');
            expect(screen.getByTestId('role-user-2')).toHaveTextContent('USER');
            expect(screen.getByTestId('role-user-3')).toHaveTextContent('EDITOR');
        });

        it('should render user avatars when available', () => {
            render(<UserList {...defaultProps} />);
            
            expect(screen.getByTestId('avatar-user-1')).toBeInTheDocument();
            expect(screen.queryByTestId('avatar-user-2')).not.toBeInTheDocument(); // No image
        });
    });

    // ========================================
    // Stats Tests
    // ========================================
    describe('Statistics Display', () => {
        it('should display total users', () => {
            render(<UserList {...defaultProps} />);
            
            expect(screen.getByTestId('stat-total')).toHaveTextContent('1500 Total Users');
        });

        it('should display new users this month', () => {
            render(<UserList {...defaultProps} />);
            
            expect(screen.getByTestId('stat-new')).toHaveTextContent('120 New This Month');
        });

        it('should display active users', () => {
            render(<UserList {...defaultProps} />);
            
            expect(screen.getByTestId('stat-active')).toHaveTextContent('850 Active Users');
        });
    });

    // ========================================
    // Search Tests
    // ========================================
    describe('Search Functionality', () => {
        it('should filter users by name', async () => {
            const user = userEvent.setup();
            render(<UserList {...defaultProps} />);
            
            await user.type(screen.getByTestId('search-input'), 'John');
            
            expect(screen.getByTestId('user-row-user-1')).toBeInTheDocument();
            expect(screen.queryByTestId('user-row-user-2')).not.toBeInTheDocument();
        });

        it('should filter users by email', async () => {
            const user = userEvent.setup();
            render(<UserList {...defaultProps} />);
            
            await user.type(screen.getByTestId('search-input'), 'jane@');
            
            expect(screen.getByTestId('user-row-user-2')).toBeInTheDocument();
            expect(screen.queryByTestId('user-row-user-1')).not.toBeInTheDocument();
        });

        it('should be case-insensitive', async () => {
            const user = userEvent.setup();
            render(<UserList {...defaultProps} />);
            
            await user.type(screen.getByTestId('search-input'), 'JOHN');
            
            expect(screen.getByTestId('user-row-user-1')).toBeInTheDocument();
        });

        it('should show empty state when no matches', async () => {
            const user = userEvent.setup();
            render(<UserList {...defaultProps} />);
            
            await user.type(screen.getByTestId('search-input'), 'nonexistent');
            
            expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        });
    });

    // ========================================
    // Role Filter Tests
    // ========================================
    describe('Role Filter', () => {
        it('should filter by ADMIN role', async () => {
            const user = userEvent.setup();
            render(<UserList {...defaultProps} />);
            
            await user.selectOptions(screen.getByTestId('role-filter'), 'ADMIN');
            
            expect(screen.getByTestId('user-row-user-1')).toBeInTheDocument();
            expect(screen.queryByTestId('user-row-user-2')).not.toBeInTheDocument();
        });

        it('should filter by USER role', async () => {
            const user = userEvent.setup();
            render(<UserList {...defaultProps} />);
            
            await user.selectOptions(screen.getByTestId('role-filter'), 'USER');
            
            expect(screen.getByTestId('user-row-user-2')).toBeInTheDocument();
            expect(screen.queryByTestId('user-row-user-1')).not.toBeInTheDocument();
        });

        it('should filter by EDITOR role', async () => {
            const user = userEvent.setup();
            render(<UserList {...defaultProps} />);
            
            await user.selectOptions(screen.getByTestId('role-filter'), 'EDITOR');
            
            expect(screen.getByTestId('user-row-user-3')).toBeInTheDocument();
            expect(screen.queryByTestId('user-row-user-1')).not.toBeInTheDocument();
        });

        it('should show all when ALL is selected', async () => {
            const user = userEvent.setup();
            render(<UserList {...defaultProps} />);
            
            await user.selectOptions(screen.getByTestId('role-filter'), 'ADMIN');
            await user.selectOptions(screen.getByTestId('role-filter'), 'ALL');
            
            expect(screen.getByTestId('user-row-user-1')).toBeInTheDocument();
            expect(screen.getByTestId('user-row-user-2')).toBeInTheDocument();
        });
    });

    // ========================================
    // Combined Filters Tests
    // ========================================
    describe('Combined Filters', () => {
        it('should apply both search and role filter', async () => {
            const user = userEvent.setup();
            render(<UserList {...defaultProps} />);
            
            await user.type(screen.getByTestId('search-input'), 'John');
            await user.selectOptions(screen.getByTestId('role-filter'), 'USER');
            
            // John is ADMIN, not USER, so should be empty
            expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        });
    });

    // ========================================
    // Pagination Tests
    // ========================================
    describe('Pagination', () => {
        it('should show pagination when multiple pages', () => {
            render(<UserList {...defaultProps} />);
            
            expect(screen.getByTestId('pagination')).toBeInTheDocument();
            expect(screen.getByTestId('page-info')).toHaveTextContent('Page 1 of 3');
        });

        it('should disable prev on first page', () => {
            render(<UserList {...defaultProps} />);
            
            expect(screen.getByTestId('prev-page')).toBeDisabled();
        });

        it('should navigate to next page', async () => {
            const user = userEvent.setup();
            render(<UserList {...defaultProps} />);
            
            await user.click(screen.getByTestId('next-page'));
            
            expect(screen.getByTestId('page-info')).toHaveTextContent('Page 2 of 3');
        });

        it('should not show pagination for single page', () => {
            render(
                <UserList
                    {...defaultProps}
                    pagination={{ currentPage: 1, totalPages: 1 }}
                />
            );
            
            expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
        });
    });

    // ========================================
    // Navigation Tests
    // ========================================
    describe('Navigation', () => {
        it('should have correct view links', () => {
            render(<UserList {...defaultProps} />);
            
            const viewLink = screen.getByTestId('view-user-1');
            expect(viewLink).toHaveAttribute('href', '/admin/users/user-1');
        });
    });

    // ========================================
    // Empty State Tests
    // ========================================
    describe('Empty State', () => {
        it('should show empty state when no users', () => {
            render(<UserList {...defaultProps} users={[]} />);
            
            expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        });
    });
});
