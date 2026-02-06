/**
 * JournalStats Component Tests
 * @module tests/user/components/journal/JournalStats.test
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import JournalStats from '@/components/journal/JournalStats';

describe('JournalStats Component', () => {
    const defaultStats = {
        totalPnL: 2500,
        winRate: 65.5,
        totalTrades: 50,
        winCount: 33,
        lossCount: 17,
    };

    // ========================================
    // Render Tests
    // ========================================
    describe('Rendering', () => {
        it('should render all stat cards', () => {
            render(<JournalStats stats={defaultStats} />);

            expect(screen.getByText('Total Trades')).toBeInTheDocument();
            expect(screen.getByText('Win Rate')).toBeInTheDocument();
            expect(screen.getByText('Net Profit')).toBeInTheDocument();
            expect(screen.getByText('W/L Ratio')).toBeInTheDocument();
        });

        it('should display total trades', () => {
            render(<JournalStats stats={defaultStats} />);

            expect(screen.getByText('50')).toBeInTheDocument();
        });

        it('should display win rate with percentage', () => {
            render(<JournalStats stats={defaultStats} />);

            expect(screen.getByText('65.5%')).toBeInTheDocument();
        });

        it('should display total PnL', () => {
            render(<JournalStats stats={defaultStats} />);

            expect(screen.getByText('$2,500')).toBeInTheDocument();
        });

        it('should display win/loss ratio', () => {
            render(<JournalStats stats={defaultStats} />);

            expect(screen.getByText('33/17')).toBeInTheDocument();
        });
    });

    // ========================================
    // Styling Tests
    // ========================================
    describe('Styling', () => {
        it('should apply green color for positive PnL', () => {
            render(<JournalStats stats={defaultStats} />);

            const pnlElement = screen.getByText('$2,500');
            expect(pnlElement).toHaveClass('text-[#00C888]');
        });

        it('should apply red color for negative PnL', () => {
            const negativeStats = { ...defaultStats, totalPnL: -500 };
            render(<JournalStats stats={negativeStats} />);

            const pnlElement = screen.getByText('$-500');
            expect(pnlElement).toHaveClass('text-red-500');
        });

        it('should apply green color for zero PnL', () => {
            const zeroStats = { ...defaultStats, totalPnL: 0 };
            render(<JournalStats stats={zeroStats} />);

            const pnlElement = screen.getByText('$0');
            expect(pnlElement).toHaveClass('text-[#00C888]');
        });
    });

    // ========================================
    // Number Formatting Tests
    // ========================================
    describe('Number Formatting', () => {
        it('should format large PnL with commas', () => {
            const largeStats = { ...defaultStats, totalPnL: 125000 };
            render(<JournalStats stats={largeStats} />);

            expect(screen.getByText('$125,000')).toBeInTheDocument();
        });

        it('should format win rate to one decimal place', () => {
            const preciseStats = { ...defaultStats, winRate: 66.6667 };
            render(<JournalStats stats={preciseStats} />);

            expect(screen.getByText('66.7%')).toBeInTheDocument();
        });

        it('should handle zero win rate', () => {
            const zeroWinRate = { ...defaultStats, winRate: 0 };
            render(<JournalStats stats={zeroWinRate} />);

            expect(screen.getByText('0.0%')).toBeInTheDocument();
        });

        it('should handle 100% win rate', () => {
            const perfectStats = { ...defaultStats, winRate: 100, winCount: 50, lossCount: 0 };
            render(<JournalStats stats={perfectStats} />);

            expect(screen.getByText('100.0%')).toBeInTheDocument();
            expect(screen.getByText('50/0')).toBeInTheDocument();
        });
    });

    // ========================================
    // Edge Cases Tests
    // ========================================
    describe('Edge Cases', () => {
        it('should handle zero trades', () => {
            const zeroStats = {
                totalPnL: 0,
                winRate: 0,
                totalTrades: 0,
                winCount: 0,
                lossCount: 0,
            };
            render(<JournalStats stats={zeroStats} />);

            expect(screen.getByText('0')).toBeInTheDocument();
            expect(screen.getByText('0/0')).toBeInTheDocument();
        });

        it('should handle very small PnL', () => {
            const smallStats = { ...defaultStats, totalPnL: 0.5 };
            render(<JournalStats stats={smallStats} />);

            expect(screen.getByText('$0.5')).toBeInTheDocument();
        });
    });

    // ========================================
    // Icon Tests
    // ========================================
    describe('Icons', () => {
        it('should render icons for each stat', () => {
            render(<JournalStats stats={defaultStats} />);

            // Check that icon containers exist
            const iconContainers = document.querySelectorAll('.p-2');
            expect(iconContainers.length).toBe(4);
        });
    });

    // ========================================
    // Responsive Layout Tests
    // ========================================
    describe('Layout', () => {
        it('should use grid layout', () => {
            render(<JournalStats stats={defaultStats} />);

            const container = screen.getByText('Total Trades').closest('.grid');
            expect(container).toHaveClass('grid-cols-2');
            expect(container).toHaveClass('md:grid-cols-4');
        });
    });
});
