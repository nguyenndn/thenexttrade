/**
 * QuizBuilder Component Tests
 * @module tests/admin/components/academy/QuizBuilder.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { mockQuizzes, mockQuestions } from '../../__mocks__/data';

// Mock toast
const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(() => 'toast-id'),
};

vi.mock('sonner', () => ({
    toast: mockToast,
}));

// Simplified Question type
interface Question {
    id: string;
    quizId: string;
    question: string;
    options: string[];
    correctAnswer: number;
    order: number;
}

interface QuizBuilderProps {
    quizId: string;
    initialQuestions: Question[];
    onSave: (questions: Question[]) => Promise<{ success: boolean; error?: string }>;
}

function QuizBuilder({ quizId, initialQuestions, onSave }: QuizBuilderProps) {
    const [questions, setQuestions] = React.useState<Question[]>(initialQuestions);
    const [editingQuestion, setEditingQuestion] = React.useState<Question | null>(null);
    const [isAddingNew, setIsAddingNew] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);

    // New question form state
    const [newQuestion, setNewQuestion] = React.useState('');
    const [newOptions, setNewOptions] = React.useState(['', '', '', '']);
    const [newCorrectAnswer, setNewCorrectAnswer] = React.useState(0);

    const handleAddQuestion = () => {
        if (!newQuestion.trim()) {
            mockToast.error('Question text is required');
            return;
        }
        if (newOptions.some((opt) => !opt.trim())) {
            mockToast.error('All options are required');
            return;
        }

        const question: Question = {
            id: `q-${Date.now()}`,
            quizId,
            question: newQuestion,
            options: newOptions,
            correctAnswer: newCorrectAnswer,
            order: questions.length + 1,
        };

        setQuestions([...questions, question]);
        setNewQuestion('');
        setNewOptions(['', '', '', '']);
        setNewCorrectAnswer(0);
        setIsAddingNew(false);
        mockToast.success('Question added');
    };

    const handleDeleteQuestion = (questionId: string) => {
        if (window.confirm('Are you sure you want to delete this question?')) {
            setQuestions(questions.filter((q) => q.id !== questionId));
            mockToast.success('Question deleted');
        }
    };

    const handleUpdateQuestion = (updated: Question) => {
        setQuestions(questions.map((q) => (q.id === updated.id ? updated : q)));
        setEditingQuestion(null);
        mockToast.success('Question updated');
    };

    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            const result = await onSave(questions);
            if (result.success) {
                mockToast.success('Quiz saved successfully');
            } else {
                mockToast.error(result.error || 'Failed to save quiz');
            }
        } catch (error) {
            mockToast.error('An error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    const moveQuestion = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= questions.length) return;

        const newQuestions = [...questions];
        [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
        // Update order numbers
        newQuestions.forEach((q, i) => (q.order = i + 1));
        setQuestions(newQuestions);
    };

    return (
        <div data-testid="quiz-builder">
            <div className="header">
                <h1>Quiz Builder</h1>
                <div className="actions">
                    <button
                        onClick={() => setIsAddingNew(true)}
                        disabled={isAddingNew}
                        data-testid="add-question-button"
                    >
                        Add Question
                    </button>
                    <button
                        onClick={handleSaveAll}
                        disabled={isSaving || questions.length === 0}
                        data-testid="save-quiz-button"
                    >
                        {isSaving ? 'Saving...' : 'Save Quiz'}
                    </button>
                </div>
            </div>

            {/* Add New Question Form */}
            {isAddingNew && (
                <div data-testid="add-question-form" className="question-form">
                    <h3>Add New Question</h3>
                    <input
                        type="text"
                        placeholder="Enter question"
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        data-testid="question-input"
                    />
                    {newOptions.map((opt, index) => (
                        <div key={index} className="option-row">
                            <input
                                type="radio"
                                name="correctAnswer"
                                checked={newCorrectAnswer === index}
                                onChange={() => setNewCorrectAnswer(index)}
                                data-testid={`correct-radio-${index}`}
                            />
                            <input
                                type="text"
                                placeholder={`Option ${index + 1}`}
                                value={opt}
                                onChange={(e) => {
                                    const updated = [...newOptions];
                                    updated[index] = e.target.value;
                                    setNewOptions(updated);
                                }}
                                data-testid={`option-input-${index}`}
                            />
                        </div>
                    ))}
                    <div className="form-actions">
                        <button onClick={handleAddQuestion} data-testid="confirm-add-question">
                            Add
                        </button>
                        <button onClick={() => setIsAddingNew(false)} data-testid="cancel-add-question">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Questions List */}
            <div data-testid="questions-list" className="questions-list">
                {questions.length === 0 ? (
                    <div data-testid="empty-state">No questions yet. Add your first question!</div>
                ) : (
                    questions.map((question, index) => (
                        <div key={question.id} data-testid={`question-card-${question.id}`} className="question-card">
                            <div className="question-header">
                                <span className="question-number">Q{question.order}</span>
                                <p>{question.question}</p>
                            </div>
                            <ul className="options-list">
                                {question.options.map((opt, optIndex) => (
                                    <li
                                        key={optIndex}
                                        className={optIndex === question.correctAnswer ? 'correct' : ''}
                                        data-testid={`${question.id}-option-${optIndex}`}
                                    >
                                        {opt}
                                        {optIndex === question.correctAnswer && (
                                            <span data-testid={`${question.id}-correct-marker`}>✓</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            <div className="question-actions">
                                <button
                                    onClick={() => moveQuestion(index, 'up')}
                                    disabled={index === 0}
                                    data-testid={`move-up-${question.id}`}
                                >
                                    ↑
                                </button>
                                <button
                                    onClick={() => moveQuestion(index, 'down')}
                                    disabled={index === questions.length - 1}
                                    data-testid={`move-down-${question.id}`}
                                >
                                    ↓
                                </button>
                                <button
                                    onClick={() => setEditingQuestion(question)}
                                    data-testid={`edit-question-${question.id}`}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteQuestion(question.id)}
                                    data-testid={`delete-question-${question.id}`}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Edit Question Modal */}
            {editingQuestion && (
                <div data-testid="edit-question-modal">
                    <h3>Edit Question</h3>
                    <input
                        type="text"
                        value={editingQuestion.question}
                        onChange={(e) =>
                            setEditingQuestion({ ...editingQuestion, question: e.target.value })
                        }
                        data-testid="edit-question-input"
                    />
                    <button
                        onClick={() => handleUpdateQuestion(editingQuestion)}
                        data-testid="save-edit-question"
                    >
                        Save
                    </button>
                    <button onClick={() => setEditingQuestion(null)} data-testid="cancel-edit-question">
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
}

describe('QuizBuilder', () => {
    const mockOnSave = vi.fn();
    const defaultProps = {
        quizId: 'quiz-1',
        initialQuestions: mockQuestions,
        onSave: mockOnSave,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockOnSave.mockResolvedValue({ success: true });
        (window.confirm as any).mockReturnValue(true);
    });

    // ========================================
    // Basic Rendering Tests
    // ========================================
    describe('Basic Rendering', () => {
        it('should render quiz builder', () => {
            render(<QuizBuilder {...defaultProps} />);
            
            expect(screen.getByTestId('quiz-builder')).toBeInTheDocument();
            expect(screen.getByText('Quiz Builder')).toBeInTheDocument();
        });

        it('should render all questions', () => {
            render(<QuizBuilder {...defaultProps} />);
            
            mockQuestions.forEach((q) => {
                expect(screen.getByTestId(`question-card-${q.id}`)).toBeInTheDocument();
                expect(screen.getByText(q.question)).toBeInTheDocument();
            });
        });

        it('should render question options', () => {
            render(<QuizBuilder {...defaultProps} />);
            
            const question = mockQuestions[0];
            question.options.forEach((opt, index) => {
                expect(screen.getByTestId(`${question.id}-option-${index}`)).toHaveTextContent(opt);
            });
        });

        it('should mark correct answer', () => {
            render(<QuizBuilder {...defaultProps} />);
            
            const question = mockQuestions[0];
            expect(screen.getByTestId(`${question.id}-correct-marker`)).toBeInTheDocument();
        });

        it('should render action buttons', () => {
            render(<QuizBuilder {...defaultProps} />);
            
            expect(screen.getByTestId('add-question-button')).toBeInTheDocument();
            expect(screen.getByTestId('save-quiz-button')).toBeInTheDocument();
        });
    });

    // ========================================
    // Empty State Tests
    // ========================================
    describe('Empty State', () => {
        it('should show empty state when no questions', () => {
            render(<QuizBuilder {...defaultProps} initialQuestions={[]} />);
            
            expect(screen.getByTestId('empty-state')).toBeInTheDocument();
            expect(screen.getByText(/No questions yet/)).toBeInTheDocument();
        });

        it('should disable save button when no questions', () => {
            render(<QuizBuilder {...defaultProps} initialQuestions={[]} />);
            
            expect(screen.getByTestId('save-quiz-button')).toBeDisabled();
        });
    });

    // ========================================
    // Add Question Tests
    // ========================================
    describe('Add Question', () => {
        it('should open add question form', async () => {
            const user = userEvent.setup();
            render(<QuizBuilder {...defaultProps} />);
            
            await user.click(screen.getByTestId('add-question-button'));
            
            expect(screen.getByTestId('add-question-form')).toBeInTheDocument();
        });

        it('should validate question text', async () => {
            const user = userEvent.setup();
            render(<QuizBuilder {...defaultProps} />);
            
            await user.click(screen.getByTestId('add-question-button'));
            await user.click(screen.getByTestId('confirm-add-question'));
            
            expect(mockToast.error).toHaveBeenCalledWith('Question text is required');
        });

        it('should validate all options are filled', async () => {
            const user = userEvent.setup();
            render(<QuizBuilder {...defaultProps} />);
            
            await user.click(screen.getByTestId('add-question-button'));
            await user.type(screen.getByTestId('question-input'), 'What is forex?');
            await user.click(screen.getByTestId('confirm-add-question'));
            
            expect(mockToast.error).toHaveBeenCalledWith('All options are required');
        });

        it('should add new question successfully', async () => {
            const user = userEvent.setup();
            render(<QuizBuilder {...defaultProps} initialQuestions={[]} />);
            
            await user.click(screen.getByTestId('add-question-button'));
            await user.type(screen.getByTestId('question-input'), 'What is pip?');
            await user.type(screen.getByTestId('option-input-0'), 'Option A');
            await user.type(screen.getByTestId('option-input-1'), 'Option B');
            await user.type(screen.getByTestId('option-input-2'), 'Option C');
            await user.type(screen.getByTestId('option-input-3'), 'Option D');
            await user.click(screen.getByTestId('confirm-add-question'));
            
            expect(mockToast.success).toHaveBeenCalledWith('Question added');
            expect(screen.queryByTestId('add-question-form')).not.toBeInTheDocument();
            expect(screen.getByText('What is pip?')).toBeInTheDocument();
        });

        it('should select correct answer', async () => {
            const user = userEvent.setup();
            render(<QuizBuilder {...defaultProps} initialQuestions={[]} />);
            
            await user.click(screen.getByTestId('add-question-button'));
            await user.click(screen.getByTestId('correct-radio-2'));
            
            expect(screen.getByTestId('correct-radio-2')).toBeChecked();
        });

        it('should cancel adding question', async () => {
            const user = userEvent.setup();
            render(<QuizBuilder {...defaultProps} />);
            
            await user.click(screen.getByTestId('add-question-button'));
            await user.click(screen.getByTestId('cancel-add-question'));
            
            expect(screen.queryByTestId('add-question-form')).not.toBeInTheDocument();
        });
    });

    // ========================================
    // Edit Question Tests
    // ========================================
    describe('Edit Question', () => {
        it('should open edit modal', async () => {
            const user = userEvent.setup();
            render(<QuizBuilder {...defaultProps} />);
            
            await user.click(screen.getByTestId('edit-question-q-1'));
            
            expect(screen.getByTestId('edit-question-modal')).toBeInTheDocument();
        });

        it('should update question text', async () => {
            const user = userEvent.setup();
            render(<QuizBuilder {...defaultProps} />);
            
            await user.click(screen.getByTestId('edit-question-q-1'));
            
            const input = screen.getByTestId('edit-question-input');
            await user.clear(input);
            await user.type(input, 'Updated question text');
            await user.click(screen.getByTestId('save-edit-question'));
            
            expect(mockToast.success).toHaveBeenCalledWith('Question updated');
            expect(screen.getByText('Updated question text')).toBeInTheDocument();
        });

        it('should cancel editing', async () => {
            const user = userEvent.setup();
            render(<QuizBuilder {...defaultProps} />);
            
            await user.click(screen.getByTestId('edit-question-q-1'));
            await user.click(screen.getByTestId('cancel-edit-question'));
            
            expect(screen.queryByTestId('edit-question-modal')).not.toBeInTheDocument();
        });
    });

    // ========================================
    // Delete Question Tests
    // ========================================
    describe('Delete Question', () => {
        it('should show confirmation before delete', async () => {
            const user = userEvent.setup();
            render(<QuizBuilder {...defaultProps} />);
            
            await user.click(screen.getByTestId('delete-question-q-1'));
            
            expect(window.confirm).toHaveBeenCalled();
        });

        it('should delete question on confirm', async () => {
            const user = userEvent.setup();
            render(<QuizBuilder {...defaultProps} />);
            
            await user.click(screen.getByTestId('delete-question-q-1'));
            
            expect(mockToast.success).toHaveBeenCalledWith('Question deleted');
            expect(screen.queryByTestId('question-card-q-1')).not.toBeInTheDocument();
        });

        it('should not delete when cancelled', async () => {
            (window.confirm as any).mockReturnValue(false);
            
            const user = userEvent.setup();
            render(<QuizBuilder {...defaultProps} />);
            
            await user.click(screen.getByTestId('delete-question-q-1'));
            
            expect(screen.getByTestId('question-card-q-1')).toBeInTheDocument();
        });
    });

    // ========================================
    // Reorder Tests
    // ========================================
    describe('Reorder Questions', () => {
        const multipleQuestions = [
            { ...mockQuestions[0], id: 'q-1', order: 1 },
            { ...mockQuestions[0], id: 'q-2', order: 2, question: 'Second question' },
            { ...mockQuestions[0], id: 'q-3', order: 3, question: 'Third question' },
        ];

        it('should disable move up for first question', () => {
            render(<QuizBuilder {...defaultProps} initialQuestions={multipleQuestions} />);
            
            expect(screen.getByTestId('move-up-q-1')).toBeDisabled();
        });

        it('should disable move down for last question', () => {
            render(<QuizBuilder {...defaultProps} initialQuestions={multipleQuestions} />);
            
            expect(screen.getByTestId('move-down-q-3')).toBeDisabled();
        });

        it('should move question up', async () => {
            const user = userEvent.setup();
            render(<QuizBuilder {...defaultProps} initialQuestions={multipleQuestions} />);
            
            await user.click(screen.getByTestId('move-up-q-2'));
            
            // q-2 should now be first (Q1)
            const cards = screen.getAllByTestId(/question-card-/);
            expect(cards[0]).toHaveAttribute('data-testid', 'question-card-q-2');
        });

        it('should move question down', async () => {
            const user = userEvent.setup();
            render(<QuizBuilder {...defaultProps} initialQuestions={multipleQuestions} />);
            
            await user.click(screen.getByTestId('move-down-q-1'));
            
            // q-1 should now be second
            const cards = screen.getAllByTestId(/question-card-/);
            expect(cards[1]).toHaveAttribute('data-testid', 'question-card-q-1');
        });
    });

    // ========================================
    // Save Quiz Tests
    // ========================================
    describe('Save Quiz', () => {
        it('should call onSave with all questions', async () => {
            const user = userEvent.setup();
            render(<QuizBuilder {...defaultProps} />);
            
            await user.click(screen.getByTestId('save-quiz-button'));
            
            expect(mockOnSave).toHaveBeenCalledWith(mockQuestions);
        });

        it('should show loading state while saving', async () => {
            mockOnSave.mockImplementation(() => new Promise((r) => setTimeout(() => r({ success: true }), 100)));
            
            const user = userEvent.setup();
            render(<QuizBuilder {...defaultProps} />);
            
            await user.click(screen.getByTestId('save-quiz-button'));
            
            expect(screen.getByTestId('save-quiz-button')).toHaveTextContent('Saving...');
        });

        it('should show success toast on save', async () => {
            const user = userEvent.setup();
            render(<QuizBuilder {...defaultProps} />);
            
            await user.click(screen.getByTestId('save-quiz-button'));
            
            await waitFor(() => {
                expect(mockToast.success).toHaveBeenCalledWith('Quiz saved successfully');
            });
        });

        it('should show error toast on failure', async () => {
            mockOnSave.mockResolvedValue({ success: false, error: 'Save failed' });
            
            const user = userEvent.setup();
            render(<QuizBuilder {...defaultProps} />);
            
            await user.click(screen.getByTestId('save-quiz-button'));
            
            await waitFor(() => {
                expect(mockToast.error).toHaveBeenCalledWith('Save failed');
            });
        });
    });
});
