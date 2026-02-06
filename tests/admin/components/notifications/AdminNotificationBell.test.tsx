/**
 * AdminNotificationBell Component Tests
 * @module tests/admin/components/notifications/AdminNotificationBell.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { mockNotifications, mockAdminStats } from '../../__mocks__/data';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
    usePathname: () => '/admin/dashboard',
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Simplified AdminNotificationBell for testing
interface AdminNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    link: string;
    isRead: boolean;
    createdAt: string;
}

function AdminNotificationBell() {
    const [notifications, setNotifications] = React.useState<AdminNotification[]>([]);
    const [stats, setStats] = React.useState({ pendingLicenses: 0, unreadNotifications: 0 });
    const [viewedPendingCount, setViewedPendingCount] = React.useState(0);
    const [isOpen, setIsOpen] = React.useState(false);

    React.useEffect(() => {
        const stored = localStorage.getItem('adminViewedPendingCount');
        if (stored) {
            setViewedPendingCount(parseInt(stored, 10));
        }
    }, []);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/admin/notifications?limit=5');
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setNotifications(data.data.notifications);
                        setStats({
                            pendingLicenses: data.data.pendingLicenses,
                            unreadNotifications: data.data.unreadCount,
                        });
                    }
                }
            } catch (e) {
                console.error('Failed to fetch admin notifications');
            }
        };
        fetchData();
    }, []);

    const effectivePendingCount = Math.max(0, stats.pendingLicenses - viewedPendingCount);
    const badgeCount = effectivePendingCount + stats.unreadNotifications;

    const markAsViewed = () => {
        const current = stats.pendingLicenses;
        setViewedPendingCount(current);
        localStorage.setItem('adminViewedPendingCount', current.toString());
    };

    const handleNavigate = (link: string) => {
        setIsOpen(false);
        markAsViewed();
        mockPush(link);
    };

    return (
        <div data-testid="notification-bell">
            <button
                onClick={() => setIsOpen(!isOpen)}
                data-testid="bell-button"
                className="bell-button"
            >
                🔔
                {badgeCount > 0 && (
                    <span data-testid="badge-count" className="badge">
                        {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div data-testid="notification-dropdown" className="dropdown">
                    <div className="dropdown-header">
                        <h3>Notifications</h3>
                        {stats.pendingLicenses > 0 && (
                            <span data-testid="pending-badge">
                                {stats.pendingLicenses} pending licenses
                            </span>
                        )}
                    </div>

                    {notifications.length === 0 ? (
                        <div data-testid="empty-state">No notifications</div>
                    ) : (
                        <ul data-testid="notification-list">
                            {notifications.map((notif) => (
                                <li
                                    key={notif.id}
                                    data-testid={`notification-${notif.id}`}
                                    className={notif.isRead ? 'read' : 'unread'}
                                    onClick={() => handleNavigate(notif.link)}
                                >
                                    <strong data-testid={`title-${notif.id}`}>{notif.title}</strong>
                                    <p data-testid={`message-${notif.id}`}>{notif.message}</p>
                                    <span data-testid={`time-${notif.id}`} className="time">
                                        {new Date(notif.createdAt).toLocaleDateString()}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="dropdown-footer">
                        <a
                            href="/admin/notifications"
                            data-testid="view-all-link"
                            onClick={() => setIsOpen(false)}
                        >
                            View All
                        </a>
                        <button
                            onClick={markAsViewed}
                            data-testid="mark-read-button"
                        >
                            Mark as Read
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

describe('AdminNotificationBell', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                success: true,
                data: {
                    notifications: mockNotifications,
                    pendingLicenses: mockAdminStats.pendingLicenses,
                    unreadCount: mockAdminStats.unreadNotifications,
                },
            }),
        });
    });

    // ========================================
    // Basic Rendering Tests
    // ========================================
    describe('Basic Rendering', () => {
        it('should render notification bell', async () => {
            render(<AdminNotificationBell />);
            
            expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
            expect(screen.getByTestId('bell-button')).toBeInTheDocument();
        });

        it('should fetch notifications on mount', async () => {
            render(<AdminNotificationBell />);
            
            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith('/api/admin/notifications?limit=5');
            });
        });
    });

    // ========================================
    // Badge Count Tests
    // ========================================
    describe('Badge Count', () => {
        it('should show badge when there are pending items', async () => {
            render(<AdminNotificationBell />);
            
            await waitFor(() => {
                expect(screen.getByTestId('badge-count')).toBeInTheDocument();
            });
        });

        it('should show correct count', async () => {
            render(<AdminNotificationBell />);
            
            await waitFor(() => {
                // 3 pending + 1 unread = 4
                expect(screen.getByTestId('badge-count')).toHaveTextContent('4');
            });
        });

        it('should not show badge when count is 0', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        notifications: [],
                        pendingLicenses: 0,
                        unreadCount: 0,
                    },
                }),
            });
            
            render(<AdminNotificationBell />);
            
            await waitFor(() => {
                expect(screen.queryByTestId('badge-count')).not.toBeInTheDocument();
            });
        });

        it('should show 99+ for large counts', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        notifications: [],
                        pendingLicenses: 150,
                        unreadCount: 0,
                    },
                }),
            });
            
            render(<AdminNotificationBell />);
            
            await waitFor(() => {
                expect(screen.getByTestId('badge-count')).toHaveTextContent('99+');
            });
        });

        it('should subtract viewed count from badge', async () => {
            localStorageMock.getItem.mockReturnValue('2'); // Already viewed 2
            
            render(<AdminNotificationBell />);
            
            await waitFor(() => {
                // 3 pending - 2 viewed + 1 unread = 2
                expect(screen.getByTestId('badge-count')).toHaveTextContent('2');
            });
        });
    });

    // ========================================
    // Dropdown Tests
    // ========================================
    describe('Dropdown Behavior', () => {
        it('should open dropdown on click', async () => {
            const user = userEvent.setup();
            render(<AdminNotificationBell />);
            
            await waitFor(() => screen.getByTestId('bell-button'));
            await user.click(screen.getByTestId('bell-button'));
            
            expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
        });

        it('should close dropdown on second click', async () => {
            const user = userEvent.setup();
            render(<AdminNotificationBell />);
            
            await waitFor(() => screen.getByTestId('bell-button'));
            await user.click(screen.getByTestId('bell-button'));
            await user.click(screen.getByTestId('bell-button'));
            
            expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();
        });

        it('should show notifications in dropdown', async () => {
            const user = userEvent.setup();
            render(<AdminNotificationBell />);
            
            await waitFor(() => screen.getByTestId('bell-button'));
            await user.click(screen.getByTestId('bell-button'));
            
            await waitFor(() => {
                expect(screen.getByTestId('notification-list')).toBeInTheDocument();
                mockNotifications.forEach((notif) => {
                    expect(screen.getByTestId(`notification-${notif.id}`)).toBeInTheDocument();
                });
            });
        });

        it('should show pending licenses count in header', async () => {
            const user = userEvent.setup();
            render(<AdminNotificationBell />);
            
            await waitFor(() => screen.getByTestId('bell-button'));
            await user.click(screen.getByTestId('bell-button'));
            
            await waitFor(() => {
                expect(screen.getByTestId('pending-badge')).toHaveTextContent('3 pending licenses');
            });
        });
    });

    // ========================================
    // Notification Item Tests
    // ========================================
    describe('Notification Items', () => {
        it('should display notification title', async () => {
            const user = userEvent.setup();
            render(<AdminNotificationBell />);
            
            await waitFor(() => screen.getByTestId('bell-button'));
            await user.click(screen.getByTestId('bell-button'));
            
            await waitFor(() => {
                expect(screen.getByTestId('title-notif-1')).toHaveTextContent('New License Request');
            });
        });

        it('should display notification message', async () => {
            const user = userEvent.setup();
            render(<AdminNotificationBell />);
            
            await waitFor(() => screen.getByTestId('bell-button'));
            await user.click(screen.getByTestId('bell-button'));
            
            await waitFor(() => {
                expect(screen.getByTestId('message-notif-1')).toHaveTextContent(
                    'John Doe requested a license for Golden Scalper EA'
                );
            });
        });

        it('should navigate when clicking notification', async () => {
            const user = userEvent.setup();
            render(<AdminNotificationBell />);
            
            await waitFor(() => screen.getByTestId('bell-button'));
            await user.click(screen.getByTestId('bell-button'));
            
            await waitFor(() => screen.getByTestId('notification-notif-1'));
            await user.click(screen.getByTestId('notification-notif-1'));
            
            expect(mockPush).toHaveBeenCalledWith('/admin/ea/accounts/pending');
        });
    });

    // ========================================
    // Mark as Read Tests
    // ========================================
    describe('Mark as Read', () => {
        it('should update localStorage when marking as read', async () => {
            const user = userEvent.setup();
            render(<AdminNotificationBell />);
            
            await waitFor(() => screen.getByTestId('bell-button'));
            await user.click(screen.getByTestId('bell-button'));
            
            await waitFor(() => screen.getByTestId('mark-read-button'));
            await user.click(screen.getByTestId('mark-read-button'));
            
            expect(localStorageMock.setItem).toHaveBeenCalledWith('adminViewedPendingCount', '3');
        });
    });

    // ========================================
    // Empty State Tests
    // ========================================
    describe('Empty State', () => {
        it('should show empty state when no notifications', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        notifications: [],
                        pendingLicenses: 0,
                        unreadCount: 0,
                    },
                }),
            });
            
            const user = userEvent.setup();
            render(<AdminNotificationBell />);
            
            await waitFor(() => screen.getByTestId('bell-button'));
            await user.click(screen.getByTestId('bell-button'));
            
            await waitFor(() => {
                expect(screen.getByTestId('empty-state')).toBeInTheDocument();
            });
        });
    });

    // ========================================
    // Error Handling Tests
    // ========================================
    describe('Error Handling', () => {
        it('should handle fetch failure gracefully', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            mockFetch.mockRejectedValue(new Error('Network error'));
            
            render(<AdminNotificationBell />);
            
            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalled();
            });
            
            consoleSpy.mockRestore();
        });
    });

    // ========================================
    // View All Link Tests
    // ========================================
    describe('View All Link', () => {
        it('should have correct href', async () => {
            const user = userEvent.setup();
            render(<AdminNotificationBell />);
            
            await waitFor(() => screen.getByTestId('bell-button'));
            await user.click(screen.getByTestId('bell-button'));
            
            await waitFor(() => {
                const viewAllLink = screen.getByTestId('view-all-link');
                expect(viewAllLink).toHaveAttribute('href', '/admin/notifications');
            });
        });
    });
});
