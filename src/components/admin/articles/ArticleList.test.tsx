import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { ArticleList } from './ArticleList';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// Keep the global navigation mock, but we can spy on it
const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
};

vi.mock('next/navigation', async (importOriginal) => {
    const actual = await importOriginal<typeof import('next/navigation')>();
    return {
        ...actual,
        useRouter: () => mockRouter,
        usePathname: () => '/admin/articles',
        useSearchParams: () => new URLSearchParams(),
    };
});

// Mock UI Components
vi.mock('@/components/ui/dropdown-menu', () => ({
    DropdownMenu: ({ children }: any) => <div data-testid="dropdown">{children}</div>,
    DropdownMenuTrigger: ({ children }: any) => <div data-testid="dropdown-trigger">{children}</div>,
    DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
    DropdownMenuItem: ({ children, onClick }: any) => (
        <button onClick={onClick} data-testid="dropdown-item">
            {children}
        </button>
    )
}));

vi.mock('./ArticleRowActions', () => ({
    ArticleRowActions: () => <div data-testid="row-actions">Actions</div>
}));

vi.mock('@/components/ui/ConfirmDialog', () => ({
    ConfirmDialog: ({ isOpen, onConfirm, onCancel, title }: any) => {
        if (!isOpen) return null;
        return (
            <div data-testid="mock-confirm-dialog">
                <h3>{title}</h3>
                <button onClick={onConfirm} data-testid="confirm-btn">Confirm</button>
                <button onClick={onCancel} data-testid="cancel-btn">Cancel</button>
            </div>
        );
    }
}));

const mockArticles = [
    {
        id: '1', title: 'BTC Analysis', slug: 'btc', status: 'PUBLISHED', views: 100, thumbnail: null,
        createdAt: new Date('2024-01-01'), author: { name: 'Admin', image: null }, category: { name: 'Crypto' }, authorId: 'a1'
    },
    {
        id: '2', title: 'Trading 101', slug: 'trading-101', status: 'DRAFT', views: 0, thumbnail: null,
        createdAt: new Date('2024-01-02'), author: { name: 'Admin', image: null }, category: { name: 'Forex' }, authorId: 'a1'
    }
];

describe('ArticleList (CRUD & Integration)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    it('READ: renders articles table correctly from props', () => {
        render(<ArticleList initialArticles={mockArticles as any} pagination={{ currentPage: 1, totalPages: 1 }} />);
        
        expect(screen.getByText('BTC Analysis')).toBeInTheDocument();
        expect(screen.getByText('Trading 101')).toBeInTheDocument();
        expect(screen.getByText('Crypto')).toBeInTheDocument();
        expect(screen.getByText('PUBLISHED')).toBeInTheDocument();
        expect(screen.getByText('DRAFT')).toBeInTheDocument();
    });

    it('READ (Filter): debounces search input and updates URL params', async () => {
        render(<ArticleList initialArticles={mockArticles as any} pagination={{ currentPage: 1, totalPages: 1 }} />);
        
        const searchInput = screen.getByPlaceholderText('Search articles...');
        fireEvent.change(searchInput, { target: { value: 'Bitcoin' } });

        // Wait natively for debounce to fire
        await new Promise(r => setTimeout(r, 400));

        await waitFor(() => {
            expect(mockRouter.replace).toHaveBeenCalledWith(expect.stringContaining('q=Bitcoin'));
        });
    });

    it('UPDATE (Quick Edit): toggles form, saves, and updates table', async () => {
        (global.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true })
        });

        render(<ArticleList initialArticles={mockArticles as any} pagination={{ currentPage: 1, totalPages: 1 }} />);
        
        // Find the Quick Edit button for the first article
        const quickEditBtns = screen.getAllByRole('button', { name: 'Quick Edit' });
        fireEvent.click(quickEditBtns[0]); // BTC Analysis

        // The Quick Edit form should appear, finding the Title input prefilled
        let titleInput: any;
        await waitFor(() => {
            titleInput = screen.getByDisplayValue('BTC Analysis');
            expect(titleInput).toBeInTheDocument();
        });
        fireEvent.change(titleInput, { target: { value: 'BTC Updated' } });

        const saveBtn = screen.getByRole('button', { name: 'Save' });
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/articles/1', expect.objectContaining({
                method: 'PUT',
                body: expect.stringContaining('"title":"BTC Updated"')
            }));
            expect(toast.success).toHaveBeenCalledWith('Article updated successfully');
            expect(mockRouter.refresh).toHaveBeenCalled();
        });
        
        // The table should optimism display "BTC Updated"
        expect(screen.getByText('BTC Updated')).toBeInTheDocument();
    });

    it('DELETE (Bulk Action): selects article, triggers confirm dialog, calls bulk API', async () => {
        (global.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true })
        });

        render(<ArticleList initialArticles={mockArticles as any} pagination={{ currentPage: 1, totalPages: 1 }} />);
        
        // Find and click the selection checkbox for the first article
        const checkboxes = screen.getAllByRole('button', { name: 'Select Article' });
        fireEvent.click(checkboxes[0]);

        // A bulk toolbar with "1 selected" should appear
        expect(screen.getByText('1 selected')).toBeInTheDocument();

        // Click delete bulk action
        const deleteBulkBtn = screen.getByTitle('Delete Selected');
        fireEvent.click(deleteBulkBtn);

        // Confirm Dialog should open
        await waitFor(() => {
            expect(screen.getByTestId('mock-confirm-dialog')).toBeInTheDocument();
        });

        // Confirm
        fireEvent.click(screen.getByTestId('confirm-btn'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/articles/bulk', expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('"ids":["1"],"action":"delete"')
            }));
            expect(toast.success).toHaveBeenCalledWith('Successfully processed 1 articles');
            expect(mockRouter.refresh).toHaveBeenCalled();
        });
    });
});
