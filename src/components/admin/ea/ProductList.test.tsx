import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { ProductList } from './ProductList';
import { deleteEAProduct } from '@/app/admin/ea/actions';
import { toast } from 'sonner';

// Mock server actions and UI Components
vi.mock('@/app/admin/ea/actions', () => ({
    deleteEAProduct: vi.fn(),
}));

vi.mock('@/components/ui/ConfirmDialog', () => ({
    ConfirmDialog: ({ isOpen, onConfirm, onCancel, title }: any) => {
        if (!isOpen) return null;
        return (
            <div data-testid="mock-confirm-dialog">
                <h3>{title}</h3>
                <button onClick={onConfirm} data-testid="confirm-btn">Confirm</button>
            </div>
        );
    }
}));

const mockProducts = [
    {
        id: '1',
        name: 'Trade Master EA',
        type: 'ROBOT',
        platform: 'MT4',
        isActive: true,
        versionInfo: { current: '1.0' },
        createdAt: new Date().toISOString()
    },
    {
        id: '2',
        name: 'Indicator Pro',
        type: 'INDICATOR',
        platform: 'MT5',
        isActive: false,
        createdAt: new Date().toISOString()
    }
];

describe('ProductList (QA)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders empty state if no products', () => {
        render(<ProductList products={[]} />);
        expect(screen.getByText('No Products Found')).toBeInTheDocument();
    });

    it('renders list of products correctly', () => {
        render(<ProductList products={mockProducts as any} />);
        expect(screen.getByText('Trade Master EA')).toBeInTheDocument();
        expect(screen.getByText('Indicator Pro')).toBeInTheDocument();
    });

    it('handles delete status correctly with ConfirmDialog', async () => {
        (deleteEAProduct as Mock).mockResolvedValueOnce({ success: true });
        
        render(<ProductList products={mockProducts as any} />);
        
        // Find the trash button (it has a Trash2 icon, usually wrapped in a button rendered last in the row)
        const buttons = screen.getAllByRole('button');
        const directBtns = buttons.filter(b => b.className.includes('hover:text-red-500'));
        if (directBtns.length > 0) fireEvent.click(directBtns[0]);
        
        await waitFor(() => {
            expect(screen.getByTestId('mock-confirm-dialog')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('confirm-btn'));

        await waitFor(() => {
            expect(deleteEAProduct).toHaveBeenCalledWith('1');
            expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('successfully'));
        });
    });
});
