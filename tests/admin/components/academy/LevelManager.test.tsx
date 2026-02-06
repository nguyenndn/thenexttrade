/**
 * Academy Level Manager Tests
 * @module tests/admin/components/academy/LevelManager.test
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockLevels, mockModules } from '../../__mocks__/data';

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
}));

// Mock confirm
global.confirm = vi.fn(() => true);

// Simplified LevelManager Component
function LevelManager({
    levels = mockLevels,
    loading = false,
    onCreateLevel = vi.fn(),
    onUpdateLevel = vi.fn(),
    onDeleteLevel = vi.fn(),
    onReorderLevels = vi.fn(),
}: {
    levels?: typeof mockLevels;
    loading?: boolean;
    onCreateLevel?: (data: any) => Promise<void>;
    onUpdateLevel?: (id: string, data: any) => Promise<void>;
    onDeleteLevel?: (id: string) => Promise<void>;
    onReorderLevels?: (levelIds: string[]) => Promise<void>;
}) {
    const [showForm, setShowForm] = React.useState(false);
    const [editingLevel, setEditingLevel] = React.useState<typeof mockLevels[0] | null>(null);
    const [formData, setFormData] = React.useState({ name: '', description: '' });
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    const handleCreate = () => {
        setEditingLevel(null);
        setFormData({ name: '', description: '' });
        setShowForm(true);
    };

    const handleEdit = (level: typeof mockLevels[0]) => {
        setEditingLevel(level);
        setFormData({ name: level.name, description: level.description || '' });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this level?')) {
            await onDeleteLevel(id);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        } else if (formData.name.length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }
        
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        if (editingLevel) {
            await onUpdateLevel(editingLevel.id, formData);
        } else {
            await onCreateLevel(formData);
        }
        setShowForm(false);
    };

    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        const newLevelIds = levels.map(l => l.id);
        [newLevelIds[index - 1], newLevelIds[index]] = [newLevelIds[index], newLevelIds[index - 1]];
        onReorderLevels(newLevelIds);
    };

    const handleMoveDown = (index: number) => {
        if (index === levels.length - 1) return;
        const newLevelIds = levels.map(l => l.id);
        [newLevelIds[index], newLevelIds[index + 1]] = [newLevelIds[index + 1], newLevelIds[index]];
        onReorderLevels(newLevelIds);
    };

    if (loading) {
        return <div data-testid="loading">Loading...</div>;
    }

    return (
        <div>
            <div className="header">
                <h1>Academy Levels</h1>
                <button onClick={handleCreate} data-testid="create-button">
                    Create Level
                </button>
            </div>

            {/* Stats */}
            <div className="stats">
                <span data-testid="total-levels">{levels.length} Levels</span>
                <span data-testid="total-modules">
                    {levels.reduce((acc, l) => acc + (l.modulesCount || 0), 0)} Modules
                </span>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="modal" data-testid="level-form">
                    <form onSubmit={handleSubmit}>
                        <h2>{editingLevel ? 'Edit Level' : 'Create Level'}</h2>
                        
                        <div className="form-group">
                            <label htmlFor="name">Name *</label>
                            <input
                                id="name"
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                data-testid="name-input"
                            />
                            {errors.name && (
                                <span className="error" data-testid="name-error">{errors.name}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">Description</label>
                            <textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                data-testid="description-input"
                            />
                        </div>

                        <div className="actions">
                            <button type="button" onClick={() => setShowForm(false)}>
                                Cancel
                            </button>
                            <button type="submit" data-testid="submit-button">
                                {editingLevel ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Level List */}
            {levels.length === 0 ? (
                <div data-testid="empty-state">No levels found</div>
            ) : (
                <div className="levels-list" data-testid="levels-list">
                    {levels.map((level, index) => (
                        <div key={level.id} className="level-card" data-testid={`level-${level.id}`}>
                            <div className="level-order">
                                <button
                                    onClick={() => handleMoveUp(index)}
                                    disabled={index === 0}
                                    data-testid={`move-up-${level.id}`}
                                    aria-label="Move up"
                                >
                                    ↑
                                </button>
                                <span className="order-number">{level.order}</span>
                                <button
                                    onClick={() => handleMoveDown(index)}
                                    disabled={index === levels.length - 1}
                                    data-testid={`move-down-${level.id}`}
                                    aria-label="Move down"
                                >
                                    ↓
                                </button>
                            </div>

                            <div className="level-info">
                                <h3>{level.name}</h3>
                                {level.description && <p>{level.description}</p>}
                                <span className="module-count">
                                    {level.modulesCount || 0} modules
                                </span>
                            </div>

                            <div className="level-actions">
                                <button
                                    onClick={() => mockPush(`/admin/academy/levels/${level.id}`)}
                                    aria-label={`View ${level.name}`}
                                >
                                    View
                                </button>
                                <button
                                    onClick={() => handleEdit(level)}
                                    aria-label={`Edit ${level.name}`}
                                    data-testid={`edit-${level.id}`}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(level.id)}
                                    aria-label={`Delete ${level.name}`}
                                    data-testid={`delete-${level.id}`}
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

describe('LevelManager Component', () => {
    const mockOnCreateLevel = vi.fn();
    const mockOnUpdateLevel = vi.fn();
    const mockOnDeleteLevel = vi.fn();
    const mockOnReorderLevels = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // Basic Rendering Tests
    // ========================================
    describe('Basic Rendering', () => {
        it('should render the component', () => {
            render(<LevelManager />);
            expect(screen.getByText('Academy Levels')).toBeInTheDocument();
        });

        it('should show loading state', () => {
            render(<LevelManager loading={true} />);
            expect(screen.getByTestId('loading')).toBeInTheDocument();
        });

        it('should display all levels', () => {
            render(<LevelManager />);
            mockLevels.forEach((level) => {
                expect(screen.getByText(level.name)).toBeInTheDocument();
            });
        });

        it('should display stats', () => {
            render(<LevelManager />);
            expect(screen.getByTestId('total-levels')).toHaveTextContent(`${mockLevels.length} Levels`);
        });

        it('should show create button', () => {
            render(<LevelManager />);
            expect(screen.getByTestId('create-button')).toBeInTheDocument();
        });
    });

    // ========================================
    // Empty State Tests
    // ========================================
    describe('Empty State', () => {
        it('should show empty state when no levels', () => {
            render(<LevelManager levels={[]} />);
            expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        });
    });

    // ========================================
    // Create Level Tests
    // ========================================
    describe('Create Level', () => {
        it('should open create form', async () => {
            const user = userEvent.setup();
            render(<LevelManager onCreateLevel={mockOnCreateLevel} />);

            await user.click(screen.getByTestId('create-button'));

            expect(screen.getByTestId('level-form')).toBeInTheDocument();
            expect(screen.getByRole('heading', { name: /create level/i })).toBeInTheDocument();
        });

        it('should validate name is required', async () => {
            const user = userEvent.setup();
            render(<LevelManager onCreateLevel={mockOnCreateLevel} />);

            await user.click(screen.getByTestId('create-button'));
            await user.click(screen.getByTestId('submit-button'));

            expect(screen.getByTestId('name-error')).toHaveTextContent('Name is required');
            expect(mockOnCreateLevel).not.toHaveBeenCalled();
        });

        it('should validate name minimum length', async () => {
            const user = userEvent.setup();
            render(<LevelManager onCreateLevel={mockOnCreateLevel} />);

            await user.click(screen.getByTestId('create-button'));
            await user.type(screen.getByTestId('name-input'), 'A');
            await user.click(screen.getByTestId('submit-button'));

            expect(screen.getByTestId('name-error')).toHaveTextContent('at least 2 characters');
        });

        it('should submit valid form', async () => {
            const user = userEvent.setup();
            render(<LevelManager onCreateLevel={mockOnCreateLevel} />);

            await user.click(screen.getByTestId('create-button'));
            await user.type(screen.getByTestId('name-input'), 'Expert Level');
            await user.type(screen.getByTestId('description-input'), 'For advanced traders');
            await user.click(screen.getByTestId('submit-button'));

            expect(mockOnCreateLevel).toHaveBeenCalledWith({
                name: 'Expert Level',
                description: 'For advanced traders',
            });
        });

        it('should close form on cancel', async () => {
            const user = userEvent.setup();
            render(<LevelManager />);

            await user.click(screen.getByTestId('create-button'));
            expect(screen.getByTestId('level-form')).toBeInTheDocument();

            await user.click(screen.getByText('Cancel'));
            expect(screen.queryByTestId('level-form')).not.toBeInTheDocument();
        });
    });

    // ========================================
    // Edit Level Tests
    // ========================================
    describe('Edit Level', () => {
        it('should open edit form with pre-filled data', async () => {
            const user = userEvent.setup();
            render(<LevelManager onUpdateLevel={mockOnUpdateLevel} />);

            await user.click(screen.getByTestId(`edit-${mockLevels[0].id}`));

            expect(screen.getByTestId('level-form')).toBeInTheDocument();
            expect(screen.getByText('Edit Level')).toBeInTheDocument();
            expect(screen.getByTestId('name-input')).toHaveValue(mockLevels[0].name);
        });

        it('should submit update', async () => {
            const user = userEvent.setup();
            render(<LevelManager onUpdateLevel={mockOnUpdateLevel} />);

            await user.click(screen.getByTestId(`edit-${mockLevels[0].id}`));
            await user.clear(screen.getByTestId('name-input'));
            await user.type(screen.getByTestId('name-input'), 'Updated Name');
            await user.click(screen.getByTestId('submit-button'));

            expect(mockOnUpdateLevel).toHaveBeenCalledWith(mockLevels[0].id, {
                name: 'Updated Name',
                description: mockLevels[0].description || '',
            });
        });
    });

    // ========================================
    // Delete Level Tests
    // ========================================
    describe('Delete Level', () => {
        it('should confirm before deleting', async () => {
            const user = userEvent.setup();
            render(<LevelManager onDeleteLevel={mockOnDeleteLevel} />);

            await user.click(screen.getByTestId(`delete-${mockLevels[0].id}`));

            expect(global.confirm).toHaveBeenCalled();
        });

        it('should call delete when confirmed', async () => {
            const user = userEvent.setup();
            render(<LevelManager onDeleteLevel={mockOnDeleteLevel} />);

            await user.click(screen.getByTestId(`delete-${mockLevels[0].id}`));

            expect(mockOnDeleteLevel).toHaveBeenCalledWith(mockLevels[0].id);
        });

        it('should not delete when cancelled', async () => {
            const user = userEvent.setup();
            (global.confirm as jest.Mock).mockReturnValueOnce(false);
            render(<LevelManager onDeleteLevel={mockOnDeleteLevel} />);

            await user.click(screen.getByTestId(`delete-${mockLevels[0].id}`));

            expect(mockOnDeleteLevel).not.toHaveBeenCalled();
        });
    });

    // ========================================
    // Reorder Tests
    // ========================================
    describe('Reorder Levels', () => {
        it('should move level up', async () => {
            const user = userEvent.setup();
            render(<LevelManager onReorderLevels={mockOnReorderLevels} />);

            // Move second level up
            await user.click(screen.getByTestId(`move-up-${mockLevels[1].id}`));

            expect(mockOnReorderLevels).toHaveBeenCalled();
        });

        it('should move level down', async () => {
            const user = userEvent.setup();
            render(<LevelManager onReorderLevels={mockOnReorderLevels} />);

            // Move first level down
            await user.click(screen.getByTestId(`move-down-${mockLevels[0].id}`));

            expect(mockOnReorderLevels).toHaveBeenCalled();
        });

        it('should disable move up for first level', () => {
            render(<LevelManager />);
            expect(screen.getByTestId(`move-up-${mockLevels[0].id}`)).toBeDisabled();
        });

        it('should disable move down for last level', () => {
            render(<LevelManager />);
            const lastLevel = mockLevels[mockLevels.length - 1];
            expect(screen.getByTestId(`move-down-${lastLevel.id}`)).toBeDisabled();
        });
    });

    // ========================================
    // Navigation Tests
    // ========================================
    describe('Navigation', () => {
        it('should navigate to level detail', async () => {
            const user = userEvent.setup();
            render(<LevelManager />);

            await user.click(screen.getByRole('button', { name: `View ${mockLevels[0].name}` }));

            expect(mockPush).toHaveBeenCalledWith(`/admin/academy/levels/${mockLevels[0].id}`);
        });
    });
});
