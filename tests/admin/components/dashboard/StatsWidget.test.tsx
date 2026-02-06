/**
 * StatsWidget Component Tests
 * @module tests/admin/components/dashboard/StatsWidget.test
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsWidget } from '@/components/admin/widgets/StatsWidget';
import { Users, FileText, BookOpen, HelpCircle } from 'lucide-react';

describe('StatsWidget', () => {
    // ========================================
    // Basic Rendering Tests
    // ========================================
    describe('Basic Rendering', () => {
        it('should render with title and value', () => {
            render(
                <StatsWidget
                    title="Total Users"
                    value={1500}
                    icon={Users}
                />
            );

            expect(screen.getByText('Total Users')).toBeInTheDocument();
            expect(screen.getByText('1500')).toBeInTheDocument();
        });

        it('should render string value correctly', () => {
            render(
                <StatsWidget
                    title="Active Users"
                    value="1,250"
                    icon={Users}
                />
            );

            expect(screen.getByText('1,250')).toBeInTheDocument();
        });

        it('should render icon correctly', () => {
            const { container } = render(
                <StatsWidget
                    title="Total Articles"
                    value={120}
                    icon={FileText}
                />
            );

            // Check if SVG icon is rendered
            const svg = container.querySelector('svg');
            expect(svg).toBeInTheDocument();
        });
    });

    // ========================================
    // Trend Tests
    // ========================================
    describe('Trend Display', () => {
        it('should render positive trend with + sign', () => {
            render(
                <StatsWidget
                    title="New Users"
                    value={120}
                    icon={Users}
                    trend={{
                        value: 15,
                        label: 'this week',
                        isPositive: true,
                    }}
                />
            );

            expect(screen.getByText(/\+15%/)).toBeInTheDocument();
            expect(screen.getByText('this week')).toBeInTheDocument();
        });

        it('should render negative trend without + sign', () => {
            render(
                <StatsWidget
                    title="Inactive Users"
                    value={50}
                    icon={Users}
                    trend={{
                        value: 8,
                        label: 'this month',
                        isPositive: false,
                    }}
                />
            );

            expect(screen.getByText('8%')).toBeInTheDocument();
        });

        it('should not render trend when not provided', () => {
            render(
                <StatsWidget
                    title="Total Lessons"
                    value={85}
                    icon={BookOpen}
                />
            );

            expect(screen.queryByText('%')).not.toBeInTheDocument();
        });
    });

    // ========================================
    // Color Variants Tests
    // ========================================
    describe('Color Variants', () => {
        it('should render with default blue color', () => {
            const { container } = render(
                <StatsWidget
                    title="Default Color"
                    value={100}
                    icon={Users}
                />
            );

            const iconWrapper = container.querySelector('.text-blue-500');
            expect(iconWrapper).toBeInTheDocument();
        });

        it('should render with green color', () => {
            const { container } = render(
                <StatsWidget
                    title="Green Color"
                    value={100}
                    icon={Users}
                    color="green"
                />
            );

            const iconWrapper = container.querySelector('.text-emerald-500');
            expect(iconWrapper).toBeInTheDocument();
        });

        it('should render with purple color', () => {
            const { container } = render(
                <StatsWidget
                    title="Purple Color"
                    value={100}
                    icon={HelpCircle}
                    color="purple"
                />
            );

            const iconWrapper = container.querySelector('.text-purple-500');
            expect(iconWrapper).toBeInTheDocument();
        });

        it('should render with orange color', () => {
            const { container } = render(
                <StatsWidget
                    title="Orange Color"
                    value={100}
                    icon={Users}
                    color="orange"
                />
            );

            const iconWrapper = container.querySelector('.text-orange-500');
            expect(iconWrapper).toBeInTheDocument();
        });
    });

    // ========================================
    // Edge Cases
    // ========================================
    describe('Edge Cases', () => {
        it('should render with zero value', () => {
            render(
                <StatsWidget
                    title="Pending Items"
                    value={0}
                    icon={FileText}
                />
            );

            expect(screen.getByText('0')).toBeInTheDocument();
        });

        it('should render with large number value', () => {
            render(
                <StatsWidget
                    title="Total Views"
                    value={1000000}
                    icon={FileText}
                />
            );

            expect(screen.getByText('1000000')).toBeInTheDocument();
        });

        it('should render with zero trend value', () => {
            render(
                <StatsWidget
                    title="Static Metric"
                    value={500}
                    icon={Users}
                    trend={{
                        value: 0,
                        label: 'no change',
                        isPositive: true,
                    }}
                />
            );

            expect(screen.getByText('+0%')).toBeInTheDocument();
        });
    });
});
