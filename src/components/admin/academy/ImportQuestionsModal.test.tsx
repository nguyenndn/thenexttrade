import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImportQuestionsModal } from "./ImportQuestionsModal";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Lucide icons
vi.mock("lucide-react", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        // @ts-ignore
        ...actual,
        Search: () => <div data-testid="icon-search" />,
        Check: () => <div data-testid="icon-check" />,
        X: () => <div data-testid="icon-x" />,
        Loader2: () => <div data-testid="icon-loader" />,
        ChevronRight: () => <div data-testid="icon-chevron-right" />,
        CheckCircle2: () => <div data-testid="icon-check-circle-2" />,
        Circle: () => <div data-testid="icon-circle" />,
    };
});

// Mock Dialog to render content immediately (since Radix Dialog usually requires portal handling)
// But simpler: just rely on standard testing-library behavior which usually handles portals if configured, 
// or simple distinct checks.
// Actually, since we use Shadcn Dialog, passing `open={true}` should render content.

describe("ImportQuestionsModal Design Compliance", () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        targetQuizId: "target-123",
        onImportSuccess: vi.fn(),
    };

    beforeEach(() => {
        // Mock global fetch
        global.fetch = vi.fn().mockImplementation((url) => {
            if (url === "/api/quizzes") {
                return Promise.resolve({
                    json: () => Promise.resolve([
                        { id: "q1", title: "Source Quiz 1", _count: { questions: 5 } }
                    ])
                });
            }
            if (url.includes("/api/academy/quizzes/q1")) {
                return Promise.resolve({
                    json: () => Promise.resolve({
                        questions: [
                            { id: "ques1", text: "Question 1", options: [] }
                        ]
                    })
                });
            }
            return Promise.resolve({ json: () => Promise.resolve({}) });
        });
    });

    it("renders Primary and Ghost buttons with correct Breek Premium classes", async () => {
        render(<ImportQuestionsModal {...defaultProps} />);

        // Wait for quizzes to load
        await waitFor(() => {
            expect(screen.getByText("Source Quiz 1")).toBeDefined();
        });

        // Click the quiz to go to Step 2
        fireEvent.click(screen.getByText("Source Quiz 1"));

        // Wait for Step 2 content
        await waitFor(() => {
            expect(screen.getByText("Back")).toBeDefined();
        });

        const backBtn = screen.getByText("Back");
        const importBtn = screen.getByText(/Import 0 Questions/i).closest("button"); // Text is inside span

        // 1. Verify Back Button (Ghost Style)
        // Check for 'rounded-xl' and 'text-gray-500'
        expect(backBtn.className).toContain("rounded-xl");
        expect(backBtn.className).toContain("text-gray-500");
        expect(backBtn.className).not.toContain("bg-[#00C888]");

        // 2. Verify Import Button (Primary Style)
        // Check for 'bg-[#00C888]', 'rounded-xl', 'shadow-lg'
        expect(importBtn?.className).toContain("bg-[#00C888]");
        expect(importBtn?.className).toContain("rounded-xl");
        expect(importBtn?.className).toContain("shadow-lg");
        expect(importBtn?.className).toContain("font-bold");
    });
});
