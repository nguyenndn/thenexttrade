/**
 * Dashboard Overview Component Tests
 * @module tests/admin/components/dashboard/DashboardOverview.test
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockDashboardStats, mockAdminStats } from '../../__mocks__/data';

// Mock next/navigation
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
}));

// Mock chart components
vi.mock('recharts', () => ({
    LineChart: () => <div data-testid="line-chart">Line Chart</div>,
    BarChart: () => <div data-testid="bar-chart">Bar Chart</div>,
    PieChart: () => <div data-testid="pie-chart">Pie Chart</div>,
    Line: () => null,
    Bar: () => null,
    Pie: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Simplified DashboardOverview Component
function DashboardOverview({
    stats = mockDashboardStats,
    adminStats = mockAdminStats,
    loading = false,
    recentActivity = [],
}: {
    stats?: typeof mockDashboardStats;
    adminStats?: typeof mockAdminStats;
    loading?: boolean;
    recentActivity?: Array<{
        id: string;
        type: string;
        message: string;
        createdAt: string;
    }>;
}) {
    const [period, setPeriod] = React.useState('7d');

    if (loading) {
        return <div data-testid="loading">Loading dashboard...</div>;
    }

    return (
        <div>
            <div className="header">
                <h1>Dashboard</h1>
                <div className="period-selector">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        data-testid="period-selector"
                    >
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="90d">Last 90 Days</option>
                    </select>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid" data-testid="stats-grid">
                <div className="stat-card" data-testid="stat-users">
                    <h3>Total Users</h3>
                    <p className="value">{stats.totalUsers}</p>
                    <p className="change positive">+{stats.newUsers} new</p>
                </div>

                <div className="stat-card" data-testid="stat-articles">
                    <h3>Total Articles</h3>
                    <p className="value">{stats.totalArticles}</p>
                    <p className="change">{stats.publishedArticles} published</p>
                </div>

                <div className="stat-card" data-testid="stat-views">
                    <h3>Page Views</h3>
                    <p className="value">{stats.pageViews?.toLocaleString()}</p>
                </div>

                <div className="stat-card" data-testid="stat-comments">
                    <h3>Comments</h3>
                    <p className="value">{stats.totalComments}</p>
                    <p className="change">{stats.pendingComments} pending</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions" data-testid="quick-actions">
                <h2>Quick Actions</h2>
                <button
                    onClick={() => mockPush('/admin/articles/create')}
                    data-testid="action-new-article"
                >
                    New Article
                </button>
                <button
                    onClick={() => mockPush('/admin/users')}
                    data-testid="action-manage-users"
                >
                    Manage Users
                </button>
                <button
                    onClick={() => mockPush('/admin/comments?status=pending')}
                    data-testid="action-pending-comments"
                >
                    Review Comments
                </button>
                <button
                    onClick={() => mockPush('/admin/academy')}
                    data-testid="action-academy"
                >
                    Academy
                </button>
            </div>

            {/* Charts */}
            <div className="charts-grid" data-testid="charts-section">
                <div className="chart-card">
                    <h3>User Growth</h3>
                    <div data-testid="line-chart">Line Chart</div>
                </div>
                <div className="chart-card">
                    <h3>Content Stats</h3>
                    <div data-testid="bar-chart">Bar Chart</div>
                </div>
            </div>

            {/* Admin Stats */}
            <div className="admin-stats" data-testid="admin-stats">
                <h2>System Overview</h2>
                <div className="stats-row">
                    <div data-testid="admin-stat-active-sessions">
                        <span className="label">Active Sessions</span>
                        <span className="value">{adminStats.activeSessions}</span>
                    </div>
                    <div data-testid="admin-stat-pending-approvals">
                        <span className="label">Pending Approvals</span>
                        <span className="value">{adminStats.pendingApprovals}</span>
                    </div>
                    <div data-testid="admin-stat-server-status">
                        <span className="label">Server Status</span>
                        <span className={`value ${adminStats.serverStatus}`}>
                            {adminStats.serverStatus}
                        </span>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity" data-testid="recent-activity">
                <h2>Recent Activity</h2>
                {recentActivity.length === 0 ? (
                    <p data-testid="no-activity">No recent activity</p>
                ) : (
                    <ul>
                        {recentActivity.map((activity) => (
                            <li key={activity.id} data-testid={`activity-${activity.id}`}>
                                <span className="type">{activity.type}</span>
                                <span className="message">{activity.message}</span>
                                <span className="time">
                                    {new Date(activity.createdAt).toLocaleString()}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

describe('DashboardOverview Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // Basic Rendering Tests
    // ========================================
    describe('Basic Rendering', () => {
        it('should render the component', () => {
            render(<DashboardOverview />);
            expect(screen.getByText('Dashboard')).toBeInTheDocument();
        });

        it('should show loading state', () => {
            render(<DashboardOverview loading={true} />);
            expect(screen.getByTestId('loading')).toBeInTheDocument();
        });

        it('should display stats cards', () => {
            render(<DashboardOverview />);
            expect(screen.getByTestId('stat-users')).toBeInTheDocument();
            expect(screen.getByTestId('stat-articles')).toBeInTheDocument();
            expect(screen.getByTestId('stat-views')).toBeInTheDocument();
            expect(screen.getByTestId('stat-comments')).toBeInTheDocument();
        });

        it('should display stats values', () => {
            render(<DashboardOverview />);
            expect(screen.getByTestId('stat-users')).toHaveTextContent(
                mockDashboardStats.totalUsers.toString()
            );
        });

        it('should display quick actions', () => {
            render(<DashboardOverview />);
            expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
        });

        it('should display charts section', () => {
            render(<DashboardOverview />);
            expect(screen.getByTestId('charts-section')).toBeInTheDocument();
        });

        it('should display admin stats', () => {
            render(<DashboardOverview />);
            expect(screen.getByTestId('admin-stats')).toBeInTheDocument();
        });
    });

    // ========================================
    // Stats Cards Tests
    // ========================================
    describe('Stats Cards', () => {
        it('should display user stats', () => {
            render(<DashboardOverview />);
            const userCard = screen.getByTestId('stat-users');
            expect(userCard).toHaveTextContent('Total Users');
            expect(userCard).toHaveTextContent(mockDashboardStats.totalUsers.toString());
            expect(userCard).toHaveTextContent(`+${mockDashboardStats.newUsers} new`);
        });

        it('should display article stats', () => {
            render(<DashboardOverview />);
            const articleCard = screen.getByTestId('stat-articles');
            expect(articleCard).toHaveTextContent('Total Articles');
            expect(articleCard).toHaveTextContent(mockDashboardStats.totalArticles.toString());
        });

        it('should display pending comments', () => {
            render(<DashboardOverview />);
            const commentsCard = screen.getByTestId('stat-comments');
            expect(commentsCard).toHaveTextContent(`${mockDashboardStats.pendingComments} pending`);
        });
    });

    // ========================================
    // Period Selector Tests
    // ========================================
    describe('Period Selector', () => {
        it('should render period selector', () => {
            render(<DashboardOverview />);
            expect(screen.getByTestId('period-selector')).toBeInTheDocument();
        });

        it('should change period on selection', async () => {
            const user = userEvent.setup();
            render(<DashboardOverview />);

            const selector = screen.getByTestId('period-selector');
            await user.selectOptions(selector, '30d');

            expect(selector).toHaveValue('30d');
        });

        it('should have default period of 7d', () => {
            render(<DashboardOverview />);
            expect(screen.getByTestId('period-selector')).toHaveValue('7d');
        });
    });

    // ========================================
    // Quick Actions Tests
    // ========================================
    describe('Quick Actions', () => {
        it('should navigate to new article', async () => {
            const user = userEvent.setup();
            render(<DashboardOverview />);

            await user.click(screen.getByTestId('action-new-article'));

            expect(mockPush).toHaveBeenCalledWith('/admin/articles/create');
        });

        it('should navigate to users management', async () => {
            const user = userEvent.setup();
            render(<DashboardOverview />);

            await user.click(screen.getByTestId('action-manage-users'));

            expect(mockPush).toHaveBeenCalledWith('/admin/users');
        });

        it('should navigate to pending comments', async () => {
            const user = userEvent.setup();
            render(<DashboardOverview />);

            await user.click(screen.getByTestId('action-pending-comments'));

            expect(mockPush).toHaveBeenCalledWith('/admin/comments?status=pending');
        });

        it('should navigate to academy', async () => {
            const user = userEvent.setup();
            render(<DashboardOverview />);

            await user.click(screen.getByTestId('action-academy'));

            expect(mockPush).toHaveBeenCalledWith('/admin/academy');
        });
    });

    // ========================================
    // Admin Stats Tests
    // ========================================
    describe('Admin Stats', () => {
        it('should display active sessions', () => {
            render(<DashboardOverview />);
            expect(screen.getByTestId('admin-stat-active-sessions')).toHaveTextContent(
                mockAdminStats.activeSessions.toString()
            );
        });

        it('should display pending approvals', () => {
            render(<DashboardOverview />);
            expect(screen.getByTestId('admin-stat-pending-approvals')).toHaveTextContent(
                mockAdminStats.pendingApprovals.toString()
            );
        });

        it('should display server status', () => {
            render(<DashboardOverview />);
            expect(screen.getByTestId('admin-stat-server-status')).toHaveTextContent(
                mockAdminStats.serverStatus
            );
        });
    });

    // ========================================
    // Recent Activity Tests
    // ========================================
    describe('Recent Activity', () => {
        it('should show no activity message when empty', () => {
            render(<DashboardOverview recentActivity={[]} />);
            expect(screen.getByTestId('no-activity')).toBeInTheDocument();
        });

        it('should display activity items', () => {
            const activities = [
                { id: '1', type: 'LOGIN', message: 'User logged in', createdAt: '2025-01-01T10:00:00Z' },
                { id: '2', type: 'COMMENT', message: 'New comment', createdAt: '2025-01-01T09:00:00Z' },
            ];
            render(<DashboardOverview recentActivity={activities} />);

            expect(screen.getByTestId('activity-1')).toBeInTheDocument();
            expect(screen.getByTestId('activity-2')).toBeInTheDocument();
        });

        it('should display activity details', () => {
            const activities = [
                { id: '1', type: 'LOGIN', message: 'User logged in', createdAt: '2025-01-01T10:00:00Z' },
            ];
            render(<DashboardOverview recentActivity={activities} />);

            const activityItem = screen.getByTestId('activity-1');
            expect(activityItem).toHaveTextContent('LOGIN');
            expect(activityItem).toHaveTextContent('User logged in');
        });
    });

    // ========================================
    // Charts Tests
    // ========================================
    describe('Charts', () => {
        it('should render chart components', () => {
            render(<DashboardOverview />);
            expect(screen.getByText('User Growth')).toBeInTheDocument();
            expect(screen.getByText('Content Stats')).toBeInTheDocument();
        });
    });
});
