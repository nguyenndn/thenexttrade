---
description: Quality Assurance Process (Code-Test-Fix-Test Cycle)
---
# QA Process Workflow

This workflow ensures code reliability and UI correctness through automated checks and automated/manual verification.

1.  **Code Implementation**
    *   Implement changes or new features.
    *   Ensure strict type safety (no `any` types if possible).

2.  **Static Code Verification**
    *   **Goal**: Ensure no syntax or type errors that cause 500s.
    *   **Command**: `npm run lint`
    *   **Action**: Run this immediately after changes. If it fails, fix the errors before verifying UI.
    *   **Note**: This effectively prevents most 500 Server Errors caused by syntax/typos.

3.  **Automated Testing (Unit/Integration)**
    *   **Goal**: Verify logic correctness using Vitest.
    *   **Command**: `npm run test`
    *   **Action**: Fix any failing tests before proceeding.

4.  **Manual Verification**
    *   **Goal**: Check UI/UX, responsiveness, and visual elements.
    *   **Tools**:
        *   `view_browser` (to check layout/rendering).
        *   Ask USER to verify specific UI interactions if needed.

5.  **Design Compliance Check (CRITICAL)**
    *   **Goal**: Ensure exact match with "Breek Premium" style.
    *   **Checklist**:
        *   [ ] No generic classes (e.g., `rounded`, `bg-blue-500`).
        *   [ ] Primary buttons use `#00C888` + `shadow`.
        *   [ ] Dark backgrounds use `#0F1117` / `#0B0E14`.
        *   [ ] Border radius is `rounded-xl` or `rounded-3xl` (not sm/md).
    *   **Action**: If violatons found -> REFACTOR immediately.

6.  **Final Review**
    *   Ensure all linting errors are resolved (`npm run lint`).
    *   Verify build success (`npm run build` if critical).
