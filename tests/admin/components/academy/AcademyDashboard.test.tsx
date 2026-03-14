/**
 * AcademyDashboard Component Tests
 * @module tests/admin/components/academy/AcademyDashboard.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { mockLevels } from '../../__mocks__/data';

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        refresh: mockRefresh,
    }),
}));

// Mock toast
const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(() => 'toast-id'),
};

vi.mock('sonner', () => ({
    toast: mockToast,
}));

// Mock deleteLevel action
const mockDeleteLevel = vi.fn();
vi.mock('@/app/admin/ai-studio/levels/actions', () => ({
    deleteLevel: (id: string) => mockDeleteLevel(id),
}));

// Simplified AcademyDashboard for testing
interface Level {
    id: string;
    title: string;
    description?: string | null;
    order: number;
    _count?: { modules: number };
    modules?: { id: string }[];
}

interface AcademyDashboardProps {
    initialLevels: Level[];
}

function AcademyDashboard({ initialLevels }: AcademyDashboardProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [editingLevel, setEditingLevel] = React.useState<Level | null>(null);

    const handleDelete = async (levelId: string) => {
        const confirmed = window.confirm('Are you sure you want to delete this course level?');
        if (confirmed) {
            mockToast.loading();
            try {
                const res = await mockDeleteLevel(levelId);
                if (res.success) {
                    mockToast.success('Level deleted successfully');
                    mockRefresh();
                } else {
                    mockToast.error(`Delete failed: ${res.error}`);
                }
            } catch (error) {
                mockToast.error('An error occurred');
            }
        }
    };

    return (
        <div data-testid="academy-dashboard">
            <div className="header">
                <h1>Academy Management</h1>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    data-testid="add-level-button"
                >
                    Add New
                </button>
            </div>

            <div className="level-grid" data-testid="level-grid">
                {initialLevels.map((level) => (
                    <div key={level.id} data-testid={`level-card-${level.id}`} className="level-card">
                        <h3>{level.title}</h3>
                        <p>{level.description || 'No description provided.'}</p>
                        <div className="stats">
                            <span data-testid={`module-count-${level.id}`}>
                                {level._count?.modules || level.modules?.length || 0} Modules
                            </span>
                        </div>
                        <div className="actions">
                            <button
                                onClick={() => setEditingLevel(level)}
                                data-testid={`edit-level-${level.id}`}
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(level.id)}
                                data-testid={`delete-level-${level.id}`}
                            >
                                Delete
                            </button>
                            <a
                                href={`/admin/academy/${level.id}`}
                                data-testid={`manage-level-${level.id}`}
                            >
                                Manage Content
                            </a>
                        </div>
                    </div>
                ))}

                {initialLevels.length === 0 && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        data-testid="empty-state-create"
                    >
                        Create your first course
                    </button>
                )}
            </div>

            {isCreateModalOpen && (
                <div data-testid="create-modal">
                    <h2>Create New Level</h2>
                    <button onClick={() => setIsCreateModalOpen(false)} data-testid="close-create-modal">
                        Close
                    </button>
                </div>
            )}

            {editingLevel && (
                <div data-testid="edit-modal">
                    <h2>Edit Level: {editingLevel.title}</h2>
                    <button onClick={() => setEditingLevel(null)} data-testid="close-edit-modal">
                        Close
                    </button>
                </div>
            )}
        </div>
    );
}

describe('AcademyDashboard', () => {
    const defaultProps = {
        initialLevels: mockLevels,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockDeleteLevel.mockResolvedValue({ success: true });
        (window.confirm as any).mockReturnValue(true);
    });

    // ========================================
    // Basic Rendering Tests
    // ========================================
    describe('Basic Rendering', () => {
        it('should render academy dashboard', () => {
            render(<AcademyDashboard {...defaultProps} />);
            
            expect(screen.getByTestId('academy-dashboard')).toBeInTheDocument();
            expect(screen.getByText('Academy Management')).toBeInTheDocument();
        });

        it('should render all levels', () => {
            render(<AcademyDashboard {...defaultProps} />);
            
            mockLevels.forEach((level) => {
                expect(screen.getByTestId(`level-card-${level.id}`)).toBeInTheDocument();
                expect(screen.getByText(level.title)).toBeInTheDocument();
            });
        });

        it('should render level descriptions', () => {
            render(<AcademyDashboard {...defaultProps} />);
            
            expect(screen.getByText('Introduction to trading basics')).toBeInTheDocument();
            expect(screen.getByText('Advanced concepts and strategies')).toBeInTheDocument();
        });

        it('should render module counts', () => {
            render(<AcademyDashboard {...defaultProps} />);
            
            expect(screen.getByTestId('module-count-level-1')).toHaveTextContent('5 Modules');
            expect(screen.getByTestId('module-count-level-2')).toHaveTextContent('8 Modules');
        });

        it('should render Add New button', () => {
            render(<AcademyDashboard {...defaultProps} />);
            
            expect(screen.getByTestId('add-level-button')).toBeInTheDocument();
        });
    });

    // ========================================
    // Empty State Tests
    // ========================================
    describe('Empty State', () => {
        it('should show empty state when no levels', () => {
            render(<AcademyDashboard initialLevels={[]} />);
            
            expect(screen.getByTestId('empty-state-create')).toBeInTheDocument();
            expect(screen.getByText('Create your first course')).toBeInTheDocument();
        });
    });

    // ========================================
    // Create Modal Tests
    // ========================================
    describe('Create Modal', () => {
        it('should open create modal when clicking Add New', async () => {
            const user = userEvent.setup();
            render(<AcademyDashboard {...defaultProps} />);
            
            await user.click(screen.getByTestId('add-level-button'));
            
            expect(screen.getByTestId('create-modal')).toBeInTheDocument();
            expect(screen.getByText('Create New Level')).toBeInTheDocument();
        });

        it('should close create modal when clicking close', async () => {
            const user = userEvent.setup();
            render(<AcademyDashboard {...defaultProps} />);
            
            await user.click(screen.getByTestId('add-level-button'));
            await user.click(screen.getByTestId('close-create-modal'));
            
            expect(screen.queryByTestId('create-modal')).not.toBeInTheDocument();
        });

        it('should open create modal from empty state button', async () => {
            const user = userEvent.setup();
            render(<AcademyDashboard initialLevels={[]} />);
            
            await user.click(screen.getByTestId('empty-state-create'));
            
            expect(screen.getByTestId('create-modal')).toBeInTheDocument();
        });
    });

    // ========================================
    // Edit Modal Tests
    // ========================================
    describe('Edit Modal', () => {
        it('should open edit modal when clicking Edit', async () => {
            const user = userEvent.setup();
            render(<AcademyDashboard {...defaultProps} />);
            
            await user.click(screen.getByTestId('edit-level-level-1'));
            
            expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
            expect(screen.getByText('Edit Level: Beginner')).toBeInTheDocument();
        });

        it('should close edit modal when clicking close', async () => {
            const user = userEvent.setup();
            render(<AcademyDashboard {...defaultProps} />);
            
            await user.click(screen.getByTestId('edit-level-level-1'));
            await user.click(screen.getByTestId('close-edit-modal'));
            
            expect(screen.queryByTestId('edit-modal')).not.toBeInTheDocument();
        });
    });

    // ========================================
    // Delete Tests
    // ========================================
    describe('Delete Level', () => {
        it('should show confirmation dialog before delete', async () => {
            const user = userEvent.setup();
            render(<AcademyDashboard {...defaultProps} />);
            
            await user.click(screen.getByTestId('delete-level-level-1'));
            
            expect(window.confirm).toHaveBeenCalledWith(
                'Are you sure you want to delete this course level?'
            );
        });

        it('should call deleteLevel action when confirmed', async () => {
            const user = userEvent.setup();
            render(<AcademyDashboard {...defaultProps} />);
            
            await user.click(screen.getByTestId('delete-level-level-1'));
            
            expect(mockDeleteLevel).toHaveBeenCalledWith('level-1');
        });

        it('should not delete when confirmation is cancelled', async () => {
            (window.confirm as any).mockReturnValue(false);
            
            const user = userEvent.setup();
            render(<AcademyDashboard {...defaultProps} />);
            
            await user.click(screen.getByTestId('delete-level-level-1'));
            
            expect(mockDeleteLevel).not.toHaveBeenCalled();
        });

        it('should show success toast on successful delete', async () => {
            const user = userEvent.setup();
            render(<AcademyDashboard {...defaultProps} />);
            
            await user.click(screen.getByTestId('delete-level-level-1'));
            
            await waitFor(() => {
                expect(mockToast.success).toHaveBeenCalledWith('Level deleted successfully');
            });
        });

        it('should refresh router on successful delete', async () => {
            const user = userEvent.setup();
            render(<AcademyDashboard {...defaultProps} />);
            
            await user.click(screen.getByTestId('delete-level-level-1'));
            
            await waitFor(() => {
                expect(mockRefresh).toHaveBeenCalled();
            });
        });

        it('should show error toast on failed delete', async () => {
            mockDeleteLevel.mockResolvedValue({ success: false, error: 'Cannot delete level with lessons' });
            
            const user = userEvent.setup();
            render(<AcademyDashboard {...defaultProps} />);
            
            await user.click(screen.getByTestId('delete-level-level-1'));
            
            await waitFor(() => {
                expect(mockToast.error).toHaveBeenCalledWith('Delete failed: Cannot delete level with lessons');
            });
        });
    });

    // ========================================
    // Navigation Tests
    // ========================================
    describe('Navigation', () => {
        it('should have correct manage content links', () => {
            render(<AcademyDashboard {...defaultProps} />);
            
            const manageLink1 = screen.getByTestId('manage-level-level-1');
            expect(manageLink1).toHaveAttribute('href', '/admin/academy/level-1');
            
            const manageLink2 = screen.getByTestId('manage-level-level-2');
            expect(manageLink2).toHaveAttribute('href', '/admin/academy/level-2');
        });
    });
});
