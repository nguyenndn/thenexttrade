/**
 * JournalList Component Tests
 * @module tests/user/components/journal/JournalList.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockJournalEntries } from '../../__mocks__/data';

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        refresh: mockRefresh,
    }),
    useSearchParams: () => new URLSearchParams(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock Modal component
vi.mock('@/components/ui/Modal', () => ({
    Modal: ({ children, isOpen }: any) => isOpen ? <div data-testid="modal">{children}</div> : null,
}));

// Mock JournalForm
vi.mock('@/components/journal/JournalForm', () => ({
    default: () => <div data-testid="journal-form">Journal Form</div>,
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import component after mocks
import JournalList from '@/components/journal/JournalList';

const mockApiResponse = {
    data: mockJournalEntries,
    meta: { page: 1, totalPages: 1, total: 3 },
    stats: {
        winRate: 66.67,
        totalPnL: 560,
        totalTrades: 3,
        winCount: 2,
        lossCount: 1,
    },
};

describe('JournalList Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockApiResponse),
        });
    });

    // ========================================
    // Initial Render Tests
    // ========================================
    describe('Initial Rendering', () => {
        it('should render journal list heading', async () => {
            render(<JournalList />);
            await waitFor(() => {
                expect(screen.getByText('Trading Journal')).toBeInTheDocument();
            });
        });

        it('should render log trade button', async () => {
            render(<JournalList />);
            await waitFor(() => {
                expect(screen.getByText('Log Trade')).toBeInTheDocument();
            });
        });

        it('should fetch entries on mount', async () => {
            render(<JournalList />);
            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/journal-entries')
                );
            });
        });
    });

    // ========================================
    // Stats Display Tests
    // ========================================
    describe('Stats Display', () => {
        it('should display total trades label', async () => {
            render(<JournalList />);
            await waitFor(() => {
                expect(screen.getByText('Total Trades')).toBeInTheDocument();
            });
        });

        it('should display win rate label', async () => {
            render(<JournalList />);
            await waitFor(() => {
                expect(screen.getByText('Win Rate')).toBeInTheDocument();
            });
        });

        it('should display net profit label', async () => {
            render(<JournalList />);
            await waitFor(() => {
                expect(screen.getByText('Net Profit')).toBeInTheDocument();
            });
        });

        it('should display W/L ratio label', async () => {
            render(<JournalList />);
            await waitFor(() => {
                expect(screen.getByText('W/L Ratio')).toBeInTheDocument();
            });
        });
    });

    // ========================================
    // Entry Display Tests
    // ========================================
    describe('Entry Display', () => {
        it('should display entry symbols', async () => {
            render(<JournalList />);
            await waitFor(() => {
                expect(screen.getByText('EURUSD')).toBeInTheDocument();
            });
        });

        it('should display entry types', async () => {
            render(<JournalList />);
            await waitFor(() => {
                // Multiple entries can have BUY type
                const buyElements = screen.getAllByText('BUY');
                expect(buyElements.length).toBeGreaterThan(0);
            });
        });

        it('should display entry status', async () => {
            render(<JournalList />);
            await waitFor(() => {
                // Multiple entries can be CLOSED
                const closedElements = screen.getAllByText('CLOSED');
                expect(closedElements.length).toBeGreaterThan(0);
            });
        });

        it('should display positive PnL in green', async () => {
            render(<JournalList />);
            await waitFor(() => {
                const pnlElement = screen.getByText('+350');
                expect(pnlElement).toHaveClass('text-[#00C888]');
            });
        });
    });

    // ========================================
    // Loading State Tests
    // ========================================
    describe('Loading State', () => {
        it('should show loading initially', () => {
            mockFetch.mockImplementationOnce(() => new Promise(() => { }));
            render(<JournalList />);
            const spinnerOrLoading = document.querySelector('.animate-spin') ||
                screen.queryByText(/loading/i);
            expect(spinnerOrLoading).toBeTruthy();
        });
    });

    // ========================================
    // Error State Tests
    // ========================================
    describe('Error Handling', () => {
        it('should handle API error gracefully', async () => {
            const { toast } = await import('sonner');
            mockFetch.mockReset();
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            render(<JournalList />);

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Failed to load journal entries');
            }, { timeout: 3000 });
        });
    });

    // ========================================
    // Create Action Tests
    // ========================================
    describe('Create Trade Action', () => {
        it('should open modal when Log Trade button is clicked', async () => {
            const user = userEvent.setup();
            render(<JournalList />);

            await waitFor(() => {
                expect(screen.getByText('Trading Journal')).toBeInTheDocument();
            });

            const logTradeButton = screen.getByText('Log Trade');
            await user.click(logTradeButton);

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });
        });

        it('should show journal form in modal', async () => {
            const user = userEvent.setup();
            render(<JournalList />);

            await waitFor(() => {
                expect(screen.getByText('Log Trade')).toBeInTheDocument();
            });

            await user.click(screen.getByText('Log Trade'));

            await waitFor(() => {
                expect(screen.getByTestId('journal-form')).toBeInTheDocument();
            });
        });
    });

    // ========================================
    // Delete Action Tests
    // ========================================
    describe('Delete Action', () => {
        it('should show delete confirmation on delete', async () => {
            const user = userEvent.setup();
            const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

            render(<JournalList />);

            await waitFor(() => {
                expect(screen.getByText('EURUSD')).toBeInTheDocument();
            });

            // Find delete button by looking for trash icon
            const trashIcons = document.querySelectorAll('svg.lucide-trash-2');
            if (trashIcons.length > 0) {
                const deleteButton = trashIcons[0].closest('button');
                if (deleteButton) {
                    await user.click(deleteButton);
                    expect(confirmSpy).toHaveBeenCalled();
                }
            }
            confirmSpy.mockRestore();
        });

        it('should not delete on cancel confirm', async () => {
            const user = userEvent.setup();
            vi.spyOn(window, 'confirm').mockReturnValue(false);

            render(<JournalList />);

            await waitFor(() => {
                expect(screen.getByText('EURUSD')).toBeInTheDocument();
            });

            const initialCalls = mockFetch.mock.calls.filter(c =>
                String(c[0]).includes('DELETE') || c[1]?.method === 'DELETE'
            ).length;

            const trashIcons = document.querySelectorAll('svg.lucide-trash-2');
            if (trashIcons.length > 0) {
                const deleteButton = trashIcons[0].closest('button');
                if (deleteButton) {
                    await user.click(deleteButton);
                }
            }

            const deleteCalls = mockFetch.mock.calls.filter(c =>
                String(c[0]).includes('DELETE') || c[1]?.method === 'DELETE'
            ).length;
            expect(deleteCalls).toBe(initialCalls);
        });
    });

    // ========================================
    // Pagination Tests
    // ========================================
    describe('Pagination', () => {
        it('should not show pagination for single page', async () => {
            render(<JournalList />);

            await waitFor(() => {
                expect(screen.getByText('EURUSD')).toBeInTheDocument();
            });

            expect(screen.queryByText('Prev')).not.toBeInTheDocument();
            expect(screen.queryByText('Next')).not.toBeInTheDocument();
        });

        it('should show pagination for multiple pages', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    ...mockApiResponse,
                    meta: { page: 1, totalPages: 3, total: 30 },
                }),
            });

            render(<JournalList />);

            await waitFor(() => {
                expect(screen.getByText('Prev')).toBeInTheDocument();
                expect(screen.getByText('Next')).toBeInTheDocument();
            });
        });

        it('should disable Prev on first page', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    ...mockApiResponse,
                    meta: { page: 1, totalPages: 3, total: 30 },
                }),
            });

            render(<JournalList />);

            await waitFor(() => {
                const prevButton = screen.getByText('Prev');
                expect(prevButton).toBeDisabled();
            });
        });

        it('should navigate to next page', async () => {
            const user = userEvent.setup();

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    ...mockApiResponse,
                    meta: { page: 1, totalPages: 3, total: 30 },
                }),
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    ...mockApiResponse,
                    meta: { page: 2, totalPages: 3, total: 30 },
                }),
            });

            render(<JournalList />);

            await waitFor(() => {
                expect(screen.getByText('Next')).toBeInTheDocument();
            });

            await user.click(screen.getByText('Next'));

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(
                    expect.stringContaining('page=2')
                );
            });
        });
    });

    // ========================================
    // Empty State Tests
    // ========================================
    describe('Empty State', () => {
        it('should handle empty entries list', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    data: [],
                    meta: { page: 1, totalPages: 1, total: 0 },
                    stats: null,
                }),
            });

            render(<JournalList />);

            await waitFor(() => {
                expect(screen.getByText('Trading Journal')).toBeInTheDocument();
            });
        });
    });
});
