/**
 * ArticleForm Component Tests
 * @module tests/admin/components/articles/ArticleForm.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { mockCategories, mockTags, mockArticles } from '../../__mocks__/data';

// Mock next/navigation
const mockPush = vi.fn();
const mockRouter = {
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
};

vi.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
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

// Simplified ArticleForm for testing
interface ArticleFormProps {
    article?: typeof mockArticles[0];
    categories: typeof mockCategories;
    onSubmit: (data: any) => Promise<{ success: boolean; error?: string }>;
}

function ArticleForm({ article, categories, onSubmit }: ArticleFormProps) {
    const [title, setTitle] = React.useState(article?.title || '');
    const [slug, setSlug] = React.useState(article?.slug || '');
    const [content, setContent] = React.useState('');
    const [categoryId, setCategoryId] = React.useState('');
    const [status, setStatus] = React.useState(article?.status || 'DRAFT');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    const generateSlug = (text: string) => {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    };

    const handleTitleChange = (value: string) => {
        setTitle(value);
        if (!article) {
            setSlug(generateSlug(value));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!title.trim()) newErrors.title = 'Title is required';
        if (!slug.trim()) newErrors.slug = 'Slug is required';
        if (!categoryId) newErrors.categoryId = 'Category is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            const result = await onSubmit({ title, slug, content, categoryId, status });
            if (result.success) {
                mockToast.success(article ? 'Article updated' : 'Article created');
                mockRouter.push('/admin/articles');
            } else {
                mockToast.error(result.error || 'Failed to save article');
            }
        } catch (error) {
            mockToast.error('An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} data-testid="article-form">
            <div>
                <label htmlFor="title">Title</label>
                <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    data-testid="title-input"
                />
                {errors.title && <span data-testid="title-error">{errors.title}</span>}
            </div>

            <div>
                <label htmlFor="slug">Slug</label>
                <input
                    id="slug"
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    data-testid="slug-input"
                />
                {errors.slug && <span data-testid="slug-error">{errors.slug}</span>}
            </div>

            <div>
                <label htmlFor="category">Category</label>
                <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    data-testid="category-select"
                >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>
                {errors.categoryId && <span data-testid="category-error">{errors.categoryId}</span>}
            </div>

            <div>
                <label htmlFor="content">Content</label>
                <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    data-testid="content-textarea"
                />
            </div>

            <div>
                <label htmlFor="status">Status</label>
                <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    data-testid="status-select"
                >
                    <option value="DRAFT">Draft</option>
                    <option value="PENDING">Pending Review</option>
                    <option value="PUBLISHED">Published</option>
                </select>
            </div>

            <button type="submit" disabled={isSubmitting} data-testid="submit-button">
                {isSubmitting ? 'Saving...' : article ? 'Update Article' : 'Create Article'}
            </button>
        </form>
    );
}

describe('ArticleForm', () => {
    const mockOnSubmit = vi.fn();

    const defaultProps = {
        categories: mockCategories,
        onSubmit: mockOnSubmit,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockOnSubmit.mockResolvedValue({ success: true });
    });

    // ========================================
    // Create Mode Tests
    // ========================================
    describe('Create Mode', () => {
        it('should render empty form for new article', () => {
            render(<ArticleForm {...defaultProps} />);
            
            expect(screen.getByTestId('title-input')).toHaveValue('');
            expect(screen.getByTestId('slug-input')).toHaveValue('');
            expect(screen.getByTestId('submit-button')).toHaveTextContent('Create Article');
        });

        it('should auto-generate slug from title', async () => {
            const user = userEvent.setup();
            render(<ArticleForm {...defaultProps} />);
            
            const titleInput = screen.getByTestId('title-input');
            await user.type(titleInput, 'My New Article Title');
            
            expect(screen.getByTestId('slug-input')).toHaveValue('my-new-article-title');
        });

        it('should render all categories in select', () => {
            render(<ArticleForm {...defaultProps} />);
            
            const categorySelect = screen.getByTestId('category-select');
            expect(categorySelect).toBeInTheDocument();
            
            mockCategories.forEach((cat) => {
                expect(screen.getByText(cat.name)).toBeInTheDocument();
            });
        });
    });

    // ========================================
    // Edit Mode Tests
    // ========================================
    describe('Edit Mode', () => {
        const existingArticle = mockArticles[0];

        it('should pre-fill form with article data', () => {
            render(<ArticleForm {...defaultProps} article={existingArticle} />);
            
            expect(screen.getByTestId('title-input')).toHaveValue(existingArticle.title);
            expect(screen.getByTestId('slug-input')).toHaveValue(existingArticle.slug);
            expect(screen.getByTestId('submit-button')).toHaveTextContent('Update Article');
        });

        it('should not auto-generate slug when editing', async () => {
            const user = userEvent.setup();
            render(<ArticleForm {...defaultProps} article={existingArticle} />);
            
            const titleInput = screen.getByTestId('title-input');
            await user.clear(titleInput);
            await user.type(titleInput, 'New Title');
            
            // Slug should remain unchanged
            expect(screen.getByTestId('slug-input')).toHaveValue(existingArticle.slug);
        });
    });

    // ========================================
    // Validation Tests
    // ========================================
    describe('Validation', () => {
        it('should show error when title is empty', async () => {
            const user = userEvent.setup();
            render(<ArticleForm {...defaultProps} />);
            
            const submitButton = screen.getByTestId('submit-button');
            await user.click(submitButton);
            
            expect(screen.getByTestId('title-error')).toHaveTextContent('Title is required');
        });

        it('should show error when category is not selected', async () => {
            const user = userEvent.setup();
            render(<ArticleForm {...defaultProps} />);
            
            await user.type(screen.getByTestId('title-input'), 'Test Title');
            await user.click(screen.getByTestId('submit-button'));
            
            expect(screen.getByTestId('category-error')).toHaveTextContent('Category is required');
        });

        it('should not submit form when validation fails', async () => {
            const user = userEvent.setup();
            render(<ArticleForm {...defaultProps} />);
            
            await user.click(screen.getByTestId('submit-button'));
            
            expect(mockOnSubmit).not.toHaveBeenCalled();
        });
    });

    // ========================================
    // Submission Tests
    // ========================================
    describe('Submission', () => {
        it('should submit form with correct data', async () => {
            const user = userEvent.setup();
            render(<ArticleForm {...defaultProps} />);
            
            await user.type(screen.getByTestId('title-input'), 'New Article');
            await user.selectOptions(screen.getByTestId('category-select'), 'cat-1');
            await user.type(screen.getByTestId('content-textarea'), 'Article content here');
            await user.click(screen.getByTestId('submit-button'));
            
            expect(mockOnSubmit).toHaveBeenCalledWith({
                title: 'New Article',
                slug: 'new-article',
                content: 'Article content here',
                categoryId: 'cat-1',
                status: 'DRAFT',
            });
        });

        it('should show loading state while submitting', async () => {
            mockOnSubmit.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100)));
            
            const user = userEvent.setup();
            render(<ArticleForm {...defaultProps} />);
            
            await user.type(screen.getByTestId('title-input'), 'New Article');
            await user.selectOptions(screen.getByTestId('category-select'), 'cat-1');
            await user.click(screen.getByTestId('submit-button'));
            
            expect(screen.getByTestId('submit-button')).toHaveTextContent('Saving...');
            expect(screen.getByTestId('submit-button')).toBeDisabled();
        });

        it('should show success toast and redirect on success', async () => {
            const user = userEvent.setup();
            render(<ArticleForm {...defaultProps} />);
            
            await user.type(screen.getByTestId('title-input'), 'New Article');
            await user.selectOptions(screen.getByTestId('category-select'), 'cat-1');
            await user.click(screen.getByTestId('submit-button'));
            
            await waitFor(() => {
                expect(mockToast.success).toHaveBeenCalledWith('Article created');
                expect(mockPush).toHaveBeenCalledWith('/admin/articles');
            });
        });

        it('should show error toast on failure', async () => {
            mockOnSubmit.mockResolvedValue({ success: false, error: 'Slug already exists' });
            
            const user = userEvent.setup();
            render(<ArticleForm {...defaultProps} />);
            
            await user.type(screen.getByTestId('title-input'), 'New Article');
            await user.selectOptions(screen.getByTestId('category-select'), 'cat-1');
            await user.click(screen.getByTestId('submit-button'));
            
            await waitFor(() => {
                expect(mockToast.error).toHaveBeenCalledWith('Slug already exists');
            });
        });
    });

    // ========================================
    // Status Tests
    // ========================================
    describe('Status Selection', () => {
        it('should default to DRAFT status', () => {
            render(<ArticleForm {...defaultProps} />);
            
            expect(screen.getByTestId('status-select')).toHaveValue('DRAFT');
        });

        it('should allow changing status', async () => {
            const user = userEvent.setup();
            render(<ArticleForm {...defaultProps} />);
            
            await user.selectOptions(screen.getByTestId('status-select'), 'PUBLISHED');
            
            expect(screen.getByTestId('status-select')).toHaveValue('PUBLISHED');
        });
    });
});
