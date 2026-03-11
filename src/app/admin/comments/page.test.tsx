import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import AdminCommentsPage from './page';
import { toast } from 'sonner';

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

const mockComments = [
    {
        id: '1',
        content: 'Great post on BTC!',
        createdAt: new Date().toISOString(),
        user: { name: 'John Doe', image: null, email: 'john@example.com' },
        article: { title: 'Bitcoin Surge', slug: 'btc-surge' }
    },
    {
        id: '2',
        content: 'Needs more examples',
        createdAt: new Date().toISOString(),
        user: { name: 'Jane Smith', image: null, email: 'jane@example.com' },
        lesson: { title: 'Intro to Forex', slug: 'intro-forex' }
    }
];

describe('AdminCommentsPage (CRUD & Filter)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    it('READ: shows empty states if no comments return', async () => {
        (global.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ comments: [] })
        });

        render(<AdminCommentsPage />);
        
        await waitFor(() => {
            expect(screen.getByText('No comments found')).toBeInTheDocument();
        });
    });

    it('READ: renders list of comments successfully', async () => {
        (global.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ comments: mockComments })
        });

        render(<AdminCommentsPage />);
        
        await waitFor(() => {
            expect(screen.getByText('Great post on BTC!')).toBeInTheDocument();
            expect(screen.getByText('Needs more examples')).toBeInTheDocument();
        });
    });

    it('READ (Filter): filters comments locally string matching', async () => {
        (global.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ comments: mockComments })
        });

        render(<AdminCommentsPage />);
        
        await waitFor(() => {
            expect(screen.getByText('Great post on BTC!')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('Search comments...');
        fireEvent.change(searchInput, { target: { value: 'Jane' } }); // Search author name

        await waitFor(() => {
            expect(screen.queryByText('Great post on BTC!')).not.toBeInTheDocument();
            expect(screen.getByText('Needs more examples')).toBeInTheDocument();
        });
    });

    it('DELETE: handles confirm dialog deleting comment', async () => {
        (global.fetch as Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ comments: mockComments }) });
        render(<AdminCommentsPage />);

        await waitFor(() => {
            expect(screen.getByText('Great post on BTC!')).toBeInTheDocument();
        });

        // Find delete buttons. In `page.tsx`, it's an action button inside the table row.
        const deleteBtns = screen.getAllByTitle('Delete Comment');
        // Assume first button is for first comment (BTC)
        fireEvent.click(deleteBtns[0]); 

        await waitFor(() => {
            expect(screen.getByTestId('mock-confirm-dialog')).toBeInTheDocument();
        });

        // Mock delete API success
        (global.fetch as Mock).mockResolvedValueOnce({ ok: true });
        
        fireEvent.click(screen.getByTestId('confirm-btn'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/comments/1', { method: 'DELETE' });
            expect(toast.success).toHaveBeenCalledWith('Comment deleted');
            expect(screen.queryByText('Great post on BTC!')).not.toBeInTheDocument(); // optimistic table update
        });
    });
});
