import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import CategoryList from './CategoryList';
import { toast } from 'sonner';

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

vi.mock('./CategoryModal', () => ({
    CategoryModal: ({ isOpen, onClose, category }: any) => {
        if (!isOpen) return null;
        return <div data-testid="mock-category-modal">Editing {category?.name || 'New'}</div>;
    }
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

const mockCategories = [
    { id: '1', name: 'Crypto', slug: 'crypto', description: 'Crypto news', _count: { articles: 5 } },
    { id: '2', name: 'Stocks', slug: 'stocks', _count: { articles: 0 } },
];

describe('CategoryList (CRUD)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    it('READ: shows loading state initially', () => {
        // Fetch promise doesn't resolve immediately
        (global.fetch as Mock).mockImplementation(() => new Promise(() => {}));
        render(<CategoryList />);
        
        expect(screen.getByText('Loading categories...')).toBeInTheDocument();
    });

    it('READ: shows empty state when no data', async () => {
        (global.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        render(<CategoryList />);
        
        await waitFor(() => {
            expect(screen.getByText('No categories found')).toBeInTheDocument();
        });
    });

    it('READ: renders categories table correctly', async () => {
        (global.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockCategories
        });

        render(<CategoryList />);
        
        await waitFor(() => {
            expect(screen.getByText('Crypto')).toBeInTheDocument();
            expect(screen.getByText('Stocks')).toBeInTheDocument();
            expect(screen.getByText('Crypto news')).toBeInTheDocument();
        });
    });

    it('CREATE: opens create modal on Add New click', async () => {
        (global.fetch as Mock).mockResolvedValueOnce({ ok: true, json: async () => [] });
        render(<CategoryList />);

        await waitFor(() => {
            expect(screen.queryByTestId('mock-category-modal')).not.toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /add new/i }));

        await waitFor(() => {
            expect(screen.getByTestId('mock-category-modal')).toHaveTextContent('Editing New');
        });
    });

    it('UPDATE: opens edit modal prefilled with data', async () => {
        (global.fetch as Mock).mockResolvedValueOnce({ ok: true, json: async () => mockCategories });
        render(<CategoryList />);

        await waitFor(() => {
            expect(screen.getByText('Crypto')).toBeInTheDocument();
        });

        // The first dropdown item will be Edit based on CategoryList map
        const editBtns = screen.getAllByText('Edit');
        fireEvent.click(editBtns[0]); // Click Edit for Crypto

        await waitFor(() => {
            expect(screen.getByTestId('mock-category-modal')).toHaveTextContent('Editing Crypto');
        });
    });

    it('DELETE: handles confirm dialog workflow', async () => {
        (global.fetch as Mock).mockResolvedValueOnce({ ok: true, json: async () => mockCategories });
        render(<CategoryList />);

        await waitFor(() => {
            expect(screen.getByText('Crypto')).toBeInTheDocument();
        });

        const deleteBtns = screen.getAllByText('Delete');
        fireEvent.click(deleteBtns[0]); // Trigger Delete for Crypto

        // Confirm Dialog should appear
        await waitFor(() => {
            expect(screen.getByTestId('mock-confirm-dialog')).toBeInTheDocument();
        });

        // Setup the exact mock for the DELETE request (id 1)
        (global.fetch as Mock).mockResolvedValueOnce({ ok: true });
        
        // Mock a re-fetch response after successful delete
        (global.fetch as Mock).mockResolvedValueOnce({ ok: true, json: async () => [mockCategories[1]] });

        // Click confirm in the mock dialog
        fireEvent.click(screen.getByTestId('confirm-btn'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/categories/1', { method: 'DELETE' });
            expect(toast.success).toHaveBeenCalledWith('Category deleted');
            // Check that the re-fetch was triggered (total 3 fetch calls)
            expect(global.fetch).toHaveBeenCalledTimes(3); 
            expect(screen.queryByTestId('mock-confirm-dialog')).not.toBeInTheDocument();
        });
    });
});
