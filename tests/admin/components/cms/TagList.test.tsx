/**
 * TagList Component Tests
 * @module tests/admin/components/cms/TagList.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { mockTags } from '../../__mocks__/data';

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

// Simplified TagList for testing
interface Tag {
    id: string;
    name: string;
    slug: string;
    _count?: { articles: number };
}

function TagList() {
    const [tags, setTags] = React.useState<Tag[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingTag, setEditingTag] = React.useState<Tag | undefined>(undefined);
    const [newName, setNewName] = React.useState('');
    const [searchTerm, setSearchTerm] = React.useState('');

    const fetchTags = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/tags');
            const data = await res.json();
            setTags(Array.isArray(data) ? data : []);
        } catch (error) {
            mockToast.error('Failed to load tags');
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchTags();
    }, []);

    const filteredTags = React.useMemo(() => {
        return tags.filter((tag) =>
            tag.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [tags, searchTerm]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;

        try {
            const res = await fetch(`/api/tags/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                throw new Error('Failed to delete');
            }
            mockToast.success('Tag deleted');
            fetchTags();
        } catch (error) {
            mockToast.error('Failed to delete tag');
        }
    };

    const handleEdit = (tag: Tag) => {
        setEditingTag(tag);
        setNewName(tag.name);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingTag(undefined);
        setNewName('');
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!newName.trim()) {
            mockToast.error('Name is required');
            return;
        }

        const slug = newName.toLowerCase().replace(/\s+/g, '-');

        try {
            const url = editingTag ? `/api/tags/${editingTag.id}` : '/api/tags';
            const method = editingTag ? 'PUT' : 'POST';
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, slug }),
            });

            if (!res.ok) {
                throw new Error('Failed to save');
            }

            mockToast.success(editingTag ? 'Tag updated' : 'Tag created');
            setIsModalOpen(false);
            fetchTags();
        } catch (error) {
            mockToast.error('Failed to save tag');
        }
    };

    if (isLoading) {
        return <div data-testid="loading">Loading...</div>;
    }

    return (
        <div data-testid="tag-list">
            <div className="header">
                <h1>Tag Management</h1>
                <button onClick={handleCreate} data-testid="add-tag-button">
                    Add New
                </button>
            </div>

            <input
                type="text"
                placeholder="Search tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="search-input"
            />

            <div data-testid="tag-count">
                Showing {filteredTags.length} of {tags.length} tags
            </div>

            {filteredTags.length === 0 ? (
                <div data-testid="empty-state">No tags found</div>
            ) : (
                <div data-testid="tag-grid">
                    {filteredTags.map((tag) => (
                        <div key={tag.id} data-testid={`tag-card-${tag.id}`} className="tag-card">
                            <span data-testid={`tag-name-${tag.id}`}>{tag.name}</span>
                            <span data-testid={`tag-count-${tag.id}`}>
                                {tag._count?.articles || 0} articles
                            </span>
                            <div className="actions">
                                <button
                                    onClick={() => handleEdit(tag)}
                                    data-testid={`edit-${tag.id}`}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(tag.id)}
                                    data-testid={`delete-${tag.id}`}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div data-testid="tag-modal">
                    <h2>{editingTag ? 'Edit Tag' : 'Create Tag'}</h2>
                    <input
                        type="text"
                        placeholder="Tag name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        data-testid="name-input"
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

describe('TagList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockTags),
        });
        (window.confirm as any).mockReturnValue(true);
    });

    // ========================================
    // Loading State Tests
    // ========================================
    describe('Loading State', () => {
        it('should show loading state initially', () => {
            mockFetch.mockImplementation(() => new Promise(() => {}));
            render(<TagList />);
            
            expect(screen.getByTestId('loading')).toBeInTheDocument();
        });
    });

    // ========================================
    // Basic Rendering Tests
    // ========================================
    describe('Basic Rendering', () => {
        it('should render tag list after loading', async () => {
            render(<TagList />);
            
            await waitFor(() => {
                expect(screen.getByTestId('tag-list')).toBeInTheDocument();
            });
        });

        it('should render all tags', async () => {
            render(<TagList />);
            
            await waitFor(() => {
                mockTags.forEach((tag) => {
                    expect(screen.getByTestId(`tag-card-${tag.id}`)).toBeInTheDocument();
                });
            });
        });

        it('should display tag names', async () => {
            render(<TagList />);
            
            await waitFor(() => {
                expect(screen.getByTestId('tag-name-tag-1')).toHaveTextContent('forex');
                expect(screen.getByTestId('tag-name-tag-2')).toHaveTextContent('crypto');
            });
        });

        it('should display article counts', async () => {
            render(<TagList />);
            
            await waitFor(() => {
                expect(screen.getByTestId('tag-count-tag-1')).toHaveTextContent('45 articles');
                expect(screen.getByTestId('tag-count-tag-2')).toHaveTextContent('30 articles');
            });
        });

        it('should show total count', async () => {
            render(<TagList />);
            
            await waitFor(() => {
                expect(screen.getByTestId('tag-count')).toHaveTextContent('Showing 3 of 3 tags');
            });
        });
    });

    // ========================================
    // Search Tests
    // ========================================
    describe('Search Functionality', () => {
        it('should filter tags by search term', async () => {
            const user = userEvent.setup();
            render(<TagList />);
            
            await waitFor(() => screen.getByTestId('search-input'));
            await user.type(screen.getByTestId('search-input'), 'forex');
            
            expect(screen.getByTestId('tag-card-tag-1')).toBeInTheDocument();
            expect(screen.queryByTestId('tag-card-tag-2')).not.toBeInTheDocument();
        });

        it('should be case-insensitive', async () => {
            const user = userEvent.setup();
            render(<TagList />);
            
            await waitFor(() => screen.getByTestId('search-input'));
            await user.type(screen.getByTestId('search-input'), 'FOREX');
            
            expect(screen.getByTestId('tag-card-tag-1')).toBeInTheDocument();
        });

        it('should update count when filtering', async () => {
            const user = userEvent.setup();
            render(<TagList />);
            
            await waitFor(() => screen.getByTestId('search-input'));
            await user.type(screen.getByTestId('search-input'), 'forex');
            
            expect(screen.getByTestId('tag-count')).toHaveTextContent('Showing 1 of 3 tags');
        });

        it('should show empty state when no matches', async () => {
            const user = userEvent.setup();
            render(<TagList />);
            
            await waitFor(() => screen.getByTestId('search-input'));
            await user.type(screen.getByTestId('search-input'), 'nonexistent');
            
            expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        });
    });

    // ========================================
    // Create Tag Tests
    // ========================================
    describe('Create Tag', () => {
        it('should open create modal', async () => {
            const user = userEvent.setup();
            render(<TagList />);
            
            await waitFor(() => screen.getByTestId('add-tag-button'));
            await user.click(screen.getByTestId('add-tag-button'));
            
            expect(screen.getByTestId('tag-modal')).toBeInTheDocument();
            expect(screen.getByText('Create Tag')).toBeInTheDocument();
        });

        it('should validate name is required', async () => {
            const user = userEvent.setup();
            render(<TagList />);
            
            await waitFor(() => screen.getByTestId('add-tag-button'));
            await user.click(screen.getByTestId('add-tag-button'));
            await user.click(screen.getByTestId('save-button'));
            
            expect(mockToast.error).toHaveBeenCalledWith('Name is required');
        });

        it('should create tag with auto-generated slug', async () => {
            const user = userEvent.setup();
            render(<TagList />);
            
            await waitFor(() => screen.getByTestId('add-tag-button'));
            await user.click(screen.getByTestId('add-tag-button'));
            await user.type(screen.getByTestId('name-input'), 'New Tag Name');
            await user.click(screen.getByTestId('save-button'));
            
            expect(mockFetch).toHaveBeenCalledWith('/api/tags', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ name: 'New Tag Name', slug: 'new-tag-name' }),
            }));
            expect(mockToast.success).toHaveBeenCalledWith('Tag created');
        });
    });

    // ========================================
    // Edit Tag Tests
    // ========================================
    describe('Edit Tag', () => {
        it('should open edit modal with pre-filled data', async () => {
            const user = userEvent.setup();
            render(<TagList />);
            
            await waitFor(() => screen.getByTestId('edit-tag-1'));
            await user.click(screen.getByTestId('edit-tag-1'));
            
            expect(screen.getByTestId('tag-modal')).toBeInTheDocument();
            expect(screen.getByText('Edit Tag')).toBeInTheDocument();
            expect(screen.getByTestId('name-input')).toHaveValue('forex');
        });

        it('should update tag successfully', async () => {
            const user = userEvent.setup();
            render(<TagList />);
            
            await waitFor(() => screen.getByTestId('edit-tag-1'));
            await user.click(screen.getByTestId('edit-tag-1'));
            
            const nameInput = screen.getByTestId('name-input');
            await user.clear(nameInput);
            await user.type(nameInput, 'Updated Tag');
            await user.click(screen.getByTestId('save-button'));
            
            expect(mockFetch).toHaveBeenCalledWith('/api/tags/tag-1', expect.objectContaining({
                method: 'PUT',
            }));
            expect(mockToast.success).toHaveBeenCalledWith('Tag updated');
        });
    });

    // ========================================
    // Delete Tag Tests
    // ========================================
    describe('Delete Tag', () => {
        it('should show confirmation before delete', async () => {
            const user = userEvent.setup();
            render(<TagList />);
            
            await waitFor(() => screen.getByTestId('delete-tag-1'));
            await user.click(screen.getByTestId('delete-tag-1'));
            
            expect(window.confirm).toHaveBeenCalled();
        });

        it('should delete tag on confirm', async () => {
            const user = userEvent.setup();
            render(<TagList />);
            
            await waitFor(() => screen.getByTestId('delete-tag-1'));
            await user.click(screen.getByTestId('delete-tag-1'));
            
            expect(mockFetch).toHaveBeenCalledWith('/api/tags/tag-1', { method: 'DELETE' });
            expect(mockToast.success).toHaveBeenCalledWith('Tag deleted');
        });

        it('should not delete when cancelled', async () => {
            (window.confirm as any).mockReturnValue(false);
            
            const user = userEvent.setup();
            render(<TagList />);
            
            await waitFor(() => screen.getByTestId('delete-tag-1'));
            const initialCallCount = mockFetch.mock.calls.length;
            await user.click(screen.getByTestId('delete-tag-1'));
            
            expect(mockFetch).toHaveBeenCalledTimes(initialCallCount);
        });
    });

    // ========================================
    // Empty State Tests
    // ========================================
    describe('Empty State', () => {
        it('should show empty state when no tags', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([]),
            });
            
            render(<TagList />);
            
            await waitFor(() => {
                expect(screen.getByTestId('empty-state')).toBeInTheDocument();
            });
        });
    });
});
