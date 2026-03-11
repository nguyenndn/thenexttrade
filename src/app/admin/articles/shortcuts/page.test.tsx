import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import ShortcutsManager from './page';
import { toast } from 'sonner';

// Mock UI Components
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

// Mock the relatively complex rich text editor
vi.mock('@/components/admin/articles/RichTextEditor', () => ({
    RichTextEditor: ({ content, onChange }: any) => (
        <textarea
            data-testid="mock-rte"
            value={content || ''}
            onChange={(e) => onChange(e.target.value)}
        />
    )
}));

const mockShortcuts = [
    { id: '1', name: 'Promo Banner', description: 'desc1', content: '<div>Promo</div>', createdAt: new Date().toISOString() },
    { id: '2', name: 'Author Bio', description: '', content: '<div>Bio</div>', createdAt: new Date().toISOString() }
];

describe('ShortcutsManager (CRUD)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    it('READ: shows empty states if no shortcuts', async () => {
        (global.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        render(<ShortcutsManager />);
        
        await waitFor(() => {
            expect(screen.getByText('No Shortcuts Found')).toBeInTheDocument();
        });
    });

    it('READ: renders list of shortcuts', async () => {
        (global.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockShortcuts
        });

        render(<ShortcutsManager />);
        
        await waitFor(() => {
            expect(screen.getByText('Promo Banner')).toBeInTheDocument();
            expect(screen.getByText('Author Bio')).toBeInTheDocument();
        });
    });

    it('CREATE: opens modal, validates, and creates a shortcut via POST', async () => {
        (global.fetch as Mock).mockResolvedValueOnce({ ok: true, json: async () => [] });
        render(<ShortcutsManager />);

        // Give it time to load the empty list
        await waitFor(() => {
            expect(screen.getByText('No Shortcuts Found')).toBeInTheDocument();
        });

        // Click Add New
        fireEvent.click(screen.getByRole('button', { name: /new shortcut/i }));
        
        // Modal appears
        expect(screen.getByText('Create New Shortcut')).toBeInTheDocument();

        // Fill out form
        let nameInput: any;
        let rte: any;
        await waitFor(() => {
            const nameInputs = screen.getAllByRole('textbox');
            nameInput = nameInputs[1]; // First is search, second is Name
            rte = screen.getByTestId('mock-rte');
            expect(rte).toBeInTheDocument();
        });
        fireEvent.change(nameInput, { target: { value: 'New Snippet' } });
        fireEvent.change(rte, { target: { value: '<b>HTML</b>' } });

        // Mock success response
        (global.fetch as Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'new-id' }) });

        fireEvent.click(screen.getByRole('button', { name: /save shortcut/i }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/articles/shortcuts', expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('"content":"<b>HTML</b>"')
            }));
            expect(toast.success).toHaveBeenCalledWith('Shortcut created!');
        });
    });

    it('UPDATE: opens modal with prefilled data and submits PUT', async () => {
        (global.fetch as Mock).mockResolvedValueOnce({ ok: true, json: async () => mockShortcuts });
        render(<ShortcutsManager />);

        await waitFor(() => {
            expect(screen.getByText('Promo Banner')).toBeInTheDocument();
        });

        // Find edit buttons (one per row)
        const editBtns = screen.getAllByRole('button', { name: 'Edit Shortcut' });
        fireEvent.click(editBtns[0]); // Edit Promo Banner

        // Expect prefilled values
        let rte: any;
        await waitFor(() => {
            expect(screen.getByText('Edit Shortcut')).toBeInTheDocument();
            const displayInputs = screen.getAllByDisplayValue('Promo Banner');
            expect(displayInputs.length).toBeGreaterThan(0);
            rte = screen.getByTestId('mock-rte');
            expect(rte).toHaveValue('<div>Promo</div>');
        });

        // Mock success
        (global.fetch as Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ id: '1' }) });

        // Change content and submit
        fireEvent.change(rte, { target: { value: 'Updated' } });
        fireEvent.click(screen.getByRole('button', { name: /save shortcut/i }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/articles/shortcuts/1', expect.objectContaining({
                method: 'PUT',
                body: expect.stringContaining('"content":"Updated"')
            }));
            expect(toast.success).toHaveBeenCalledWith('Shortcut updated!');
        });
    });

    it('DELETE: handles confirm dialog deleting shortcut', async () => {
        (global.fetch as Mock).mockResolvedValueOnce({ ok: true, json: async () => mockShortcuts });
        render(<ShortcutsManager />);

        await waitFor(() => {
            expect(screen.getByText('Promo Banner')).toBeInTheDocument();
        });

        const deleteBtns = screen.getAllByRole('button', { name: 'Delete Shortcut' });
        fireEvent.click(deleteBtns[0]); // Delete Promo Banner

        await waitFor(() => {
            expect(screen.getByTestId('mock-confirm-dialog')).toBeInTheDocument();
        });

        // Mock delete success
        (global.fetch as Mock).mockResolvedValueOnce({ ok: true });
        
        fireEvent.click(screen.getByTestId('confirm-btn'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/articles/shortcuts/1', { method: 'DELETE' });
            expect(toast.success).toHaveBeenCalledWith('Shortcut deleted successfully.');
        });
    });
});
