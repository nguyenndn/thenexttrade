import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { TagModal } from './TagModal';
import { toast } from 'sonner';

// Mock Modal since it might use complex portal/animation
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

describe('TagModal (CRUD)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    it('renders correctly for Create mode', () => {
        render(<TagModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
        expect(screen.getByRole('heading', { name: 'Create Tag' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create tag/i })).toBeInTheDocument();
    });

    it('renders correctly for Edit (Update) mode with prefilled data', () => {
        const mockTag = { id: '789', name: 'Scalping', slug: 'scalping' };
        render(<TagModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} tag={mockTag} />);
        
        expect(screen.getByRole('heading', { name: 'Edit Tag' })).toBeInTheDocument();
        expect(screen.getByDisplayValue('Scalping')).toBeInTheDocument();
        expect(screen.getByDisplayValue('scalping')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('CREATE: validates required fields (Name)', async () => {
        render(<TagModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
        
        const submitBtn = screen.getByRole('button', { name: /create tag/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText('Name is required')).toBeInTheDocument();
        });
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('CREATE: auto-generates slug when typing in Name', async () => {
        render(<TagModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
        
        const nameInput = screen.getByPlaceholderText('Scalping');
        // Wait, what is the slug placeholder? Looking at TagModal.tsx it's 'scalping'
        const slugInput = screen.getAllByRole('textbox')[1]; // Second input is slug

        fireEvent.change(nameInput, { target: { value: 'Hành động Giá' } });

        await waitFor(() => {
            expect(slugInput).toHaveValue('hanh-dong-gia');
        });
    });

    it('CREATE: successfully posts new tag', async () => {
        (global.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'new-tag', name: 'New Tag' })
        });

        render(<TagModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
        
        const nameInput = screen.getByPlaceholderText('Scalping');
        fireEvent.change(nameInput, { target: { value: 'New Tag' } });
        fireEvent.click(screen.getByRole('button', { name: /create tag/i }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/tags', expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: expect.stringContaining('"name":"New Tag"')
            }));
            expect(toast.success).toHaveBeenCalledWith('Tag created');
            expect(mockOnSuccess).toHaveBeenCalled();
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it('UPDATE: successfully updates existing tag', async () => {
        (global.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: '789' })
        });

        const mockTag = { id: '789', name: 'Old Tag', slug: 'old-tag' };
        render(<TagModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} tag={mockTag} />);
        
        const nameInput = screen.getByDisplayValue('Old Tag');
        fireEvent.change(nameInput, { target: { value: 'Updated Tag' } });
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/tags/789', expect.objectContaining({
                method: 'PUT',
                body: expect.stringContaining('"name":"Updated Tag"')
            }));
            expect(toast.success).toHaveBeenCalledWith('Tag updated');
            expect(mockOnSuccess).toHaveBeenCalled();
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it('handles API errors gracefully', async () => {
        (global.fetch as Mock).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Tag already exists' })
        });

        render(<TagModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
        
        const nameInput = screen.getByPlaceholderText('Scalping');
        fireEvent.change(nameInput, { target: { value: 'Test' } });
        fireEvent.click(screen.getByRole('button', { name: /create tag/i }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Tag already exists');
            expect(mockOnSuccess).not.toHaveBeenCalled();
            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });
});
