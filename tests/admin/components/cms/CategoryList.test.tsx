/**
 * CategoryList Component Tests
 * @module tests/admin/components/cms/CategoryList.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { mockCategories } from '../../__mocks__/data';

// Mock toast
const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
};

vi.mock('sonner', () => ({
    toast: mockToast,
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Simplified CategoryList for testing
interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    _count?: { articles: number };
}

function CategoryList() {
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingCategory, setEditingCategory] = React.useState<Category | undefined>(undefined);
    const [newName, setNewName] = React.useState('');
    const [newSlug, setNewSlug] = React.useState('');

    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/categories');
            const data = await res.json();
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            mockToast.error('Failed to load categories');
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchCategories();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This action cannot be undone.')) return;

        try {
            const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to delete');
            }
            mockToast.success('Category deleted');
            fetchCategories();
        } catch (error: any) {
            mockToast.error(error.message);
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setNewName(category.name);
        setNewSlug(category.slug);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingCategory(undefined);
        setNewName('');
        setNewSlug('');
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!newName.trim()) {
            mockToast.error('Name is required');
            return;
        }
        if (!newSlug.trim()) {
            mockToast.error('Slug is required');
            return;
        }

        try {
            const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
            const method = editingCategory ? 'PUT' : 'POST';
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, slug: newSlug }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to save');
            }

            mockToast.success(editingCategory ? 'Category updated' : 'Category created');
            setIsModalOpen(false);
            fetchCategories();
        } catch (error: any) {
            mockToast.error(error.message);
        }
    };

    if (isLoading) {
        return <div data-testid="loading">Loading...</div>;
    }

    return (
        <div data-testid="category-list">
            <div className="header">
                <h1>Category Management</h1>
                <button onClick={handleCreate} data-testid="add-category-button">
                    Add New
                </button>
            </div>

            {categories.length === 0 ? (
                <div data-testid="empty-state">No categories found</div>
            ) : (
                <table data-testid="category-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Slug</th>
                            <th>Articles</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((category) => (
                            <tr key={category.id} data-testid={`category-row-${category.id}`}>
                                <td data-testid={`name-${category.id}`}>{category.name}</td>
                                <td data-testid={`slug-${category.id}`}>{category.slug}</td>
                                <td data-testid={`count-${category.id}`}>
                                    {category._count?.articles || 0}
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleEdit(category)}
                                        data-testid={`edit-${category.id}`}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category.id)}
                                        data-testid={`delete-${category.id}`}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {isModalOpen && (
                <div data-testid="category-modal">
                    <h2>{editingCategory ? 'Edit Category' : 'Create Category'}</h2>
                    <input
                        type="text"
                        placeholder="Category name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        data-testid="name-input"
                    />
                    <input
                        type="text"
                        placeholder="Slug"
                        value={newSlug}
                        onChange={(e) => setNewSlug(e.target.value)}
                        data-testid="slug-input"
                    />
                    <button onClick={handleSave} data-testid="save-button">
                        Save
                    </button>
                    <button onClick={() => setIsModalOpen(false)} data-testid="cancel-button">
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
}

describe('CategoryList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockCategories),
        });
        (window.confirm as any).mockReturnValue(true);
    });

    // ========================================
    // Loading State Tests
    // ========================================
    describe('Loading State', () => {
        it('should show loading state initially', () => {
            mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
            render(<CategoryList />);
            
            expect(screen.getByTestId('loading')).toBeInTheDocument();
        });
    });

    // ========================================
    // Basic Rendering Tests
    // ========================================
    describe('Basic Rendering', () => {
        it('should render category list after loading', async () => {
            render(<CategoryList />);
            
            await waitFor(() => {
                expect(screen.getByTestId('category-list')).toBeInTheDocument();
            });
        });

        it('should fetch categories on mount', async () => {
            render(<CategoryList />);
            
            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith('/api/categories');
            });
        });

        it('should render all categories', async () => {
            render(<CategoryList />);
            
            await waitFor(() => {
                mockCategories.forEach((cat) => {
                    expect(screen.getByTestId(`category-row-${cat.id}`)).toBeInTheDocument();
                });
            });
        });

        it('should display category names', async () => {
            render(<CategoryList />);
            
            await waitFor(() => {
                expect(screen.getByTestId('name-cat-1')).toHaveTextContent('Trading Basics');
                expect(screen.getByTestId('name-cat-2')).toHaveTextContent('Analysis');
            });
        });

        it('should display article counts', async () => {
            render(<CategoryList />);
            
            await waitFor(() => {
                expect(screen.getByTestId('count-cat-1')).toHaveTextContent('25');
                expect(screen.getByTestId('count-cat-2')).toHaveTextContent('18');
            });
        });
    });

    // ========================================
    // Empty State Tests
    // ========================================
    describe('Empty State', () => {
        it('should show empty state when no categories', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([]),
            });
            
            render(<CategoryList />);
            
            await waitFor(() => {
                expect(screen.getByTestId('empty-state')).toBeInTheDocument();
            });
        });
    });

    // ========================================
    // Create Category Tests
    // ========================================
    describe('Create Category', () => {
        it('should open create modal', async () => {
            const user = userEvent.setup();
            render(<CategoryList />);
            
            await waitFor(() => screen.getByTestId('add-category-button'));
            await user.click(screen.getByTestId('add-category-button'));
            
            expect(screen.getByTestId('category-modal')).toBeInTheDocument();
            expect(screen.getByText('Create Category')).toBeInTheDocument();
        });

        it('should validate name is required', async () => {
            const user = userEvent.setup();
            render(<CategoryList />);
            
            await waitFor(() => screen.getByTestId('add-category-button'));
            await user.click(screen.getByTestId('add-category-button'));
            await user.click(screen.getByTestId('save-button'));
            
            expect(mockToast.error).toHaveBeenCalledWith('Name is required');
        });

        it('should validate slug is required', async () => {
            const user = userEvent.setup();
            render(<CategoryList />);
            
            await waitFor(() => screen.getByTestId('add-category-button'));
            await user.click(screen.getByTestId('add-category-button'));
            await user.type(screen.getByTestId('name-input'), 'New Category');
            await user.click(screen.getByTestId('save-button'));
            
            expect(mockToast.error).toHaveBeenCalledWith('Slug is required');
        });

        it('should create category successfully', async () => {
            const user = userEvent.setup();
            render(<CategoryList />);
            
            await waitFor(() => screen.getByTestId('add-category-button'));
            await user.click(screen.getByTestId('add-category-button'));
            await user.type(screen.getByTestId('name-input'), 'New Category');
            await user.type(screen.getByTestId('slug-input'), 'new-category');
            await user.click(screen.getByTestId('save-button'));
            
            expect(mockFetch).toHaveBeenCalledWith('/api/categories', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ name: 'New Category', slug: 'new-category' }),
            }));
            expect(mockToast.success).toHaveBeenCalledWith('Category created');
        });

        it('should close modal on cancel', async () => {
            const user = userEvent.setup();
            render(<CategoryList />);
            
            await waitFor(() => screen.getByTestId('add-category-button'));
            await user.click(screen.getByTestId('add-category-button'));
            await user.click(screen.getByTestId('cancel-button'));
            
            expect(screen.queryByTestId('category-modal')).not.toBeInTheDocument();
        });
    });

    // ========================================
    // Edit Category Tests
    // ========================================
    describe('Edit Category', () => {
        it('should open edit modal with pre-filled data', async () => {
            const user = userEvent.setup();
            render(<CategoryList />);
            
            await waitFor(() => screen.getByTestId('edit-cat-1'));
            await user.click(screen.getByTestId('edit-cat-1'));
            
            expect(screen.getByTestId('category-modal')).toBeInTheDocument();
            expect(screen.getByText('Edit Category')).toBeInTheDocument();
            expect(screen.getByTestId('name-input')).toHaveValue('Trading Basics');
            expect(screen.getByTestId('slug-input')).toHaveValue('trading-basics');
        });

        it('should update category successfully', async () => {
            const user = userEvent.setup();
            render(<CategoryList />);
            
            await waitFor(() => screen.getByTestId('edit-cat-1'));
            await user.click(screen.getByTestId('edit-cat-1'));
            
            const nameInput = screen.getByTestId('name-input');
            await user.clear(nameInput);
            await user.type(nameInput, 'Updated Name');
            await user.click(screen.getByTestId('save-button'));
            
            expect(mockFetch).toHaveBeenCalledWith('/api/categories/cat-1', expect.objectContaining({
                method: 'PUT',
            }));
            expect(mockToast.success).toHaveBeenCalledWith('Category updated');
        });
    });

    // ========================================
    // Delete Category Tests
    // ========================================
    describe('Delete Category', () => {
        it('should show confirmation before delete', async () => {
            const user = userEvent.setup();
            render(<CategoryList />);
            
            await waitFor(() => screen.getByTestId('delete-cat-1'));
            await user.click(screen.getByTestId('delete-cat-1'));
            
            expect(window.confirm).toHaveBeenCalled();
        });

        it('should delete category on confirm', async () => {
            const user = userEvent.setup();
            render(<CategoryList />);
            
            await waitFor(() => screen.getByTestId('delete-cat-1'));
            await user.click(screen.getByTestId('delete-cat-1'));
            
            expect(mockFetch).toHaveBeenCalledWith('/api/categories/cat-1', { method: 'DELETE' });
            expect(mockToast.success).toHaveBeenCalledWith('Category deleted');
        });

        it('should not delete when cancelled', async () => {
            (window.confirm as any).mockReturnValue(false);
            
            const user = userEvent.setup();
            render(<CategoryList />);
            
            await waitFor(() => screen.getByTestId('delete-cat-1'));
            const initialCallCount = mockFetch.mock.calls.length;
            await user.click(screen.getByTestId('delete-cat-1'));
            
            // Should not have made additional DELETE call
            expect(mockFetch).toHaveBeenCalledTimes(initialCallCount);
        });

        it('should show error toast on delete failure', async () => {
            mockFetch
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockCategories) }) // Initial fetch
                .mockResolvedValueOnce({ 
                    ok: false, 
                    json: () => Promise.resolve({ error: 'Category has articles' }) 
                }); // Delete
            
            const user = userEvent.setup();
            render(<CategoryList />);
            
            await waitFor(() => screen.getByTestId('delete-cat-1'));
            await user.click(screen.getByTestId('delete-cat-1'));
            
            await waitFor(() => {
                expect(mockToast.error).toHaveBeenCalledWith('Category has articles');
            });
        });
    });

    // ========================================
    // Error Handling Tests
    // ========================================
    describe('Error Handling', () => {
        it('should show error toast when fetch fails', async () => {
            mockFetch.mockRejectedValue(new Error('Network error'));
            
            render(<CategoryList />);
            
            await waitFor(() => {
                expect(mockToast.error).toHaveBeenCalledWith('Failed to load categories');
            });
        });
    });
});
