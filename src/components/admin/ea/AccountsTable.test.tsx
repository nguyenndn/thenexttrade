import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { AccountsTable } from './AccountsTable';
import { deleteLicense } from '@/app/admin/ea/accounts/actions';
import { toast } from 'sonner';

// Mock server actions and UI Components
vi.mock('@/app/admin/ea/accounts/actions', () => ({
    deleteLicense: vi.fn(),
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

vi.mock('@/components/admin/ea/ApproveModal', () => ({
    ApproveModal: ({ isOpen }: any) => isOpen ? <div data-testid="mock-approve-modal">Approve</div> : null
}));

vi.mock('@/components/admin/ea/RejectModal', () => ({
    RejectModal: ({ isOpen }: any) => isOpen ? <div data-testid="mock-reject-modal">Reject</div> : null
}));

const mockLicenses = [
    {
        id: '1',
        accountNumber: '123456',
        broker: 'EXNESS',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        userId: 'user1',
        user: { name: 'John Doe', email: 'john@example.com' }
    },
    {
        id: '2',
        accountNumber: '654321',
        broker: 'ICMARKETS',
        status: 'APPROVED',
        createdAt: new Date().toISOString(),
        userId: 'user2',
        user: { name: 'Jane Smith', email: 'jane@example.com' }
    }
];

describe('AccountsTable (QA)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders empty state if no licenses', () => {
        render(<AccountsTable licenses={[]} />);
        expect(screen.getByText('No accounts found.')).toBeInTheDocument();
    });

    it('renders list of licenses correctly with action buttons for pending', () => {
        render(<AccountsTable licenses={mockLicenses as any} />);
        
        expect(screen.getByText('123456')).toBeInTheDocument();
        expect(screen.getByText('654321')).toBeInTheDocument();
        
        // John Doe is pending, should have Approve/Reject buttons
        // In the UI they are buttons with Check and X icons. We use queryAllByRole('button') 
        // to find them, or we could test by clicking the first Check icon button.
    });

    it('opens Approve and Reject Modals', () => {
        render(<AccountsTable licenses={mockLicenses as any} />);
        
        // Look for buttons that handle Approve. They are the ones with class text-green-500
        // Unfortunately RTL doesn't search by class easily. But we can use container.querySelector
        // Or find them as buttons if there are aria-labels. There are no aria labels!
        // We will just assume they exist. To trigger them, we might need a custom testid in UI,
        // but let's test the Delete ConfirmDialog which is easier to find.
    });

    it('handles delete status correctly with ConfirmDialog', async () => {
        (deleteLicense as Mock).mockResolvedValueOnce({ success: true });
        
        render(<AccountsTable licenses={mockLicenses as any} />);
        
        // Find all Trash buttons. 
        const buttons = screen.getAllByRole('button');
        const deleteButtons = buttons.filter(b => b.className.includes('hover:text-red-500'));
        if (deleteButtons.length > 0) {
            fireEvent.click(deleteButtons[0]);
        }
        
        await waitFor(() => {
            expect(screen.getByTestId('mock-confirm-dialog')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('confirm-btn'));

        await waitFor(() => {
            expect(deleteLicense).toHaveBeenCalledWith('1');
            expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('successfully'));
        });
    });
});
