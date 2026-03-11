import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import TagList from './TagList';
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

vi.mock('./TagModal', () => ({
    TagModal: ({ isOpen, onClose, tag }: any) => {
        if (!isOpen) return null;
        return <div data-testid="mock-tag-modal">Editing {tag?.name || 'New'}</div>;
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

const mockTags = [
    { id: '1', name: 'Scalping', slug: 'scalping' },
    { id: '2', name: 'Day Trading', slug: 'day-trading' },
];

describe('TagList (CRUD)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    it('READ: shows loading state initially', () => {
        (global.fetch as Mock).mockImplementation(() => new Promise(() => {}));
        render(<TagList />);
        
        expect(screen.getByText('Loading tags...')).toBeInTheDocument();
    });

    it('READ: shows empty state when no data', async () => {
        (global.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        render(<TagList />);
        
        await waitFor(() => {
            expect(screen.getByText('No tags found')).toBeInTheDocument();
        });
    });

    it('READ: renders tags table correctly', async () => {
        (global.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockTags
        });

        render(<TagList />);
        
        await waitFor(() => {
            expect(screen.getByText('Scalping')).toBeInTheDocument();
            expect(screen.getByText('day-trading')).toBeInTheDocument();
        });
    });

    it('CREATE: opens create modal on Add New click', async () => {
        (global.fetch as Mock).mockResolvedValueOnce({ ok: true, json: async () => [] });
        render(<TagList />);

        await waitFor(() => {
            expect(screen.queryByTestId('mock-tag-modal')).not.toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /add new/i }));

        await waitFor(() => {
            expect(screen.getByTestId('mock-tag-modal')).toHaveTextContent('Editing New');
        });
    });

    it('UPDATE: opens edit modal prefilled with data', async () => {
        (global.fetch as Mock).mockResolvedValueOnce({ ok: true, json: async () => mockTags });
        render(<TagList />);

        await waitFor(() => {
            expect(screen.getByText('Scalping')).toBeInTheDocument();
        });

        const editBtns = screen.getAllByText('Edit');
        fireEvent.click(editBtns[0]);

        await waitFor(() => {
            expect(screen.getByTestId('mock-tag-modal')).toHaveTextContent('Editing Scalping');
        });
    });

    it('DELETE: handles confirm dialog workflow', async () => {
        (global.fetch as Mock).mockResolvedValueOnce({ ok: true, json: async () => mockTags });
        render(<TagList />);

        await waitFor(() => {
            expect(screen.getByText('Scalping')).toBeInTheDocument();
        });

        const deleteBtns = screen.getAllByText('Delete');
        fireEvent.click(deleteBtns[0]); // Trigger Delete for Scalping

        await waitFor(() => {
            expect(screen.getByTestId('mock-confirm-dialog')).toBeInTheDocument();
        });

        (global.fetch as Mock).mockResolvedValueOnce({ ok: true });
        (global.fetch as Mock).mockResolvedValueOnce({ ok: true, json: async () => [mockTags[1]] });

        fireEvent.click(screen.getByTestId('confirm-btn'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/tags/1', { method: 'DELETE' });
            expect(toast.success).toHaveBeenCalledWith('Tag deleted');
            expect(global.fetch).toHaveBeenCalledTimes(3); 
            expect(screen.queryByTestId('mock-confirm-dialog')).not.toBeInTheDocument();
        });
    });
});
