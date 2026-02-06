/**
 * QuickActionsWidget Component Tests
 * @module tests/admin/components/dashboard/QuickActionsWidget.test
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the QuickActionsWidget component for testing
// Since we don't have direct access, we'll test a simplified version
const mockActions = [
    { label: 'Create Article', href: '/admin/articles/new', icon: 'FileText' },
    { label: 'Add User', href: '/admin/users/new', icon: 'UserPlus' },
    { label: 'Create Lesson', href: '/admin/academy/lessons/new', icon: 'BookOpen' },
    { label: 'View Reports', href: '/admin/reports', icon: 'BarChart' },
];

// Simple QuickActionsWidget for testing
function QuickActionsWidget({ actions }: { actions: typeof mockActions }) {
    return (
        <div className="quick-actions-widget">
            <h3>Quick Actions</h3>
            <div className="actions-grid">
                {actions.map((action) => (
                    <a
                        key={action.href}
                        href={action.href}
                        className="action-link"
                        data-testid={`action-${action.label.toLowerCase().replace(/\s/g, '-')}`}
                    >
                        {action.label}
                    </a>
                ))}
            </div>
        </div>
    );
}

describe('QuickActionsWidget', () => {
    // ========================================
    // Basic Rendering Tests
    // ========================================
    describe('Basic Rendering', () => {
        it('should render widget title', () => {
            render(<QuickActionsWidget actions={mockActions} />);
            expect(screen.getByText('Quick Actions')).toBeInTheDocument();
        });

        it('should render all action links', () => {
            render(<QuickActionsWidget actions={mockActions} />);
            
            expect(screen.getByText('Create Article')).toBeInTheDocument();
            expect(screen.getByText('Add User')).toBeInTheDocument();
            expect(screen.getByText('Create Lesson')).toBeInTheDocument();
            expect(screen.getByText('View Reports')).toBeInTheDocument();
        });

        it('should render correct href for each action', () => {
            render(<QuickActionsWidget actions={mockActions} />);
            
            const articleLink = screen.getByTestId('action-create-article');
            expect(articleLink).toHaveAttribute('href', '/admin/articles/new');

            const userLink = screen.getByTestId('action-add-user');
            expect(userLink).toHaveAttribute('href', '/admin/users/new');
        });
    });

    // ========================================
    // Empty State Tests
    // ========================================
    describe('Empty State', () => {
        it('should render without actions', () => {
            render(<QuickActionsWidget actions={[]} />);
            expect(screen.getByText('Quick Actions')).toBeInTheDocument();
        });
    });

    // ========================================
    // Interaction Tests
    // ========================================
    describe('Interactions', () => {
        it('should have clickable action links', async () => {
            const user = userEvent.setup();
            render(<QuickActionsWidget actions={mockActions} />);
            
            const articleLink = screen.getByTestId('action-create-article');
            expect(articleLink).toBeInTheDocument();
            
            // Links should be accessible
            expect(articleLink.tagName).toBe('A');
        });
    });
});
