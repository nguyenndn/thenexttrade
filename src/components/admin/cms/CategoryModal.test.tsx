import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { CategoryModal } from './CategoryModal';
import { toast } from 'sonner';

// Mock Modal since it might use complex portal/animation that JSDOM struggles with
// We just render its children for the sake of unit testing the form logic
vi.mock('@/components/ui/Modal', () => ({
    Modal: ({ children, isOpen, title }: any) => {
        if (!isOpen) return null;
        return (
            <div data-testid="mock-modal">
                <h2>{title}</h2>
                {children}
            </div>
        );
    }
}));

const mockOnClose = vi.fn();
const mockOnSuccess = vi.fn();

describe('CategoryModal (CRUD)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    it('renders correctly for Create mode', () => {
        render(<CategoryModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
        expect(screen.getByRole('heading', { name: 'Create Category' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create category/i })).toBeInTheDocument();
    });

    it('renders correctly for Edit (Update) mode with prefilled data', () => {
        const mockCategory = { id: '123', name: 'Trading', slug: 'trading', description: 'Trading desc' };
        render(<CategoryModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} category={mockCategory} />);
        
        expect(screen.getByRole('heading', { name: 'Edit Category' })).toBeInTheDocument();
        expect(screen.getByDisplayValue('Trading')).toBeInTheDocument();
        expect(screen.getByDisplayValue('trading')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Trading desc')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('CREATE: validates required fields (Name)', async () => {
        render(<CategoryModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
        
        const submitBtn = screen.getByRole('button', { name: /create category/i });
        fireEvent.click(submitBtn);

        // Validation from Zod schema
        await waitFor(() => {
            expect(screen.getByText('Name is required')).toBeInTheDocument();
        });
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('CREATE: auto-generates slug when typing in Name', async () => {
        render(<CategoryModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
        
        const nameInput = screen.getByPlaceholderText('Market Analysis');
        const slugInput = screen.getByPlaceholderText('market-analysis');

        fireEvent.change(nameInput, { target: { value: 'Chiến lược Giao dịch' } });

        // The auto slugger should run
        await waitFor(() => {
            expect(slugInput).toHaveValue('chien-luoc-giao-dich');
        });
    });

    it('CREATE: successfully posts new category', async () => {
        (global.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'new-id', name: 'New Cat' })
        });

        render(<CategoryModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
        
        fireEvent.change(screen.getByPlaceholderText('Market Analysis'), { target: { value: 'New Cat' } });
        fireEvent.click(screen.getByRole('button', { name: /create category/i }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/categories', expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: expect.stringContaining('"name":"New Cat"')
            }));
            expect(toast.success).toHaveBeenCalledWith('Category created');
            expect(mockOnSuccess).toHaveBeenCalled();
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it('UPDATE: successfully updates existing category', async () => {
        (global.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: '123' })
        });

        const mockCategory = { id: '123', name: 'Old', slug: 'old' };
        render(<CategoryModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} category={mockCategory} />);
        
        const nameInput = screen.getByDisplayValue('Old');
        fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/categories/123', expect.objectContaining({
                method: 'PUT',
                body: expect.stringContaining('"name":"Updated Name"')
            }));
            expect(toast.success).toHaveBeenCalledWith('Category updated');
            expect(mockOnSuccess).toHaveBeenCalled();
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it('handles API errors gracefully', async () => {
        (global.fetch as Mock).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Slug already exists' })
        });

        render(<CategoryModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
        
        fireEvent.change(screen.getByPlaceholderText('Market Analysis'), { target: { value: 'Test' } });
        fireEvent.click(screen.getByRole('button', { name: /create category/i }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Slug already exists');
            expect(mockOnSuccess).not.toHaveBeenCalled();
            // Modal should stay open
            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });
});
