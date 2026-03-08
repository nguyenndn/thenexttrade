import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { ArticleForm } from '@/components/admin/articles/ArticleForm';
import { toast } from 'sonner';

// Mock complex subcomponents to avoid jsdom rendering issues
vi.mock('@/components/admin/media/MediaLibraryModal', () => ({
    MediaLibraryModal: ({ isOpen, onClose, onSelect }: any) => isOpen ? (
        <div data-testid="media-modal">
            <button onClick={() => onSelect('https://example.com/image.png')}>Select Image</button>
            <button onClick={onClose}>Close</button>
        </div>
    ) : null
}));

vi.mock('@/components/admin/articles/TagInput', () => ({
    TagInput: ({ value, onChange }: any) => (
        <input data-testid="tag-input" value={(value || []).join(',')} onChange={(e) => onChange(e.target.value.split(','))} />
    )
}));

vi.mock('@/components/admin/articles/RichTextEditor', () => ({
    RichTextEditor: ({ content, onChange }: any) => (
        <textarea data-testid="rich-text" value={content || ''} onChange={(e) => onChange(e.target.value)} />
    )
}));

vi.mock('@/components/admin/articles/SeoAnalysisPanel', () => ({
    SeoAnalysisPanel: () => <div data-testid="seo-panel" />
}));

const mockCategories = [
    { id: 'cat1', name: 'Strategy' },
    { id: 'cat2', name: 'Analysis' }
];

describe('ArticleForm Constraints & Features', () => {
    beforeEach(() => {
        global.fetch = vi.fn((url: string) => {
            if (url.includes('/api/users/authors')) {
                return Promise.resolve({
                    json: () => Promise.resolve([{ id: 'author1', name: 'John Doe' }])
                });
            }
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ id: 'article_created' })
            });
        }) as unknown as typeof fetch;
    });

    it('1. UI Rendering: renders properly in create mode without deleting actions', async () => {
        render(<ArticleForm categories={mockCategories} />);
        
        expect(screen.getByPlaceholderText('Article Title')).toBeInTheDocument();
        expect(screen.getByText('Publish Info')).toBeInTheDocument();
        expect(screen.getByText('Publish')).toBeInTheDocument();
        
        // Make sure Delete Article is strictly hidden in create mode
        expect(screen.queryByTitle('Delete Article')).not.toBeInTheDocument();
        
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/users/authors');
        });
    });

    it('2. Validation & Flow: prevents submission and shows warning toast if required fields miss', async () => {
        render(<ArticleForm categories={mockCategories} />);
        const submitBtn = screen.getByText('Publish');
        
        await userEvent.click(submitBtn);
        
        // Assert that the Custom Warning Toast is injected!
        expect(toast.warning).toHaveBeenCalledWith(expect.stringContaining('Missing required fields'));
        expect(global.fetch).not.toHaveBeenCalledWith('/api/articles', expect.anything());
    });

    it('3. Interactions: auto-generates slug continuously when title is updated', async () => {
        render(<ArticleForm categories={mockCategories} />);
        const titleInput = screen.getByPlaceholderText('Article Title');
        
        await userEvent.type(titleInput, 'My New Article!');
        
        // Since slug is generated implicitly, we can look for it in the dom
        const slugInputs = screen.getAllByRole('textbox').filter(el => el.getAttribute('value') === 'my-new-article');
        expect(slugInputs.length).toBeGreaterThan(0);
    });

    it('4. Workflow: submits structured data seamlessly across the Happy Path', async () => {
        render(<ArticleForm categories={mockCategories} />);
        
        // Fill Title
        await userEvent.type(screen.getByPlaceholderText('Article Title'), 'Valid Title');
        
        // Fill Content
        const contentInput = screen.getByTestId('rich-text');
        await userEvent.type(contentInput, 'Some valid content here');
        
        // Fill Category via Radix UI Dropdown Menu emulation
        const categoryTrigger = screen.getByText('Select Category');
        await userEvent.click(categoryTrigger);
        
        // Radix portals the items, so finding them might require waiting or just grabbing text
        const strategyOption = screen.getByText('Strategy');
        await userEvent.click(strategyOption);
        
        // Publish Time!
        const submitBtn = screen.getByText('Publish');
        await userEvent.click(submitBtn);
        
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/articles', expect.objectContaining({
                method: 'POST',
                headers: { "Content-Type": "application/json" }
            }));
        });
        
        expect(toast.success).toHaveBeenCalledWith('Article created successfully!');
    });
});
