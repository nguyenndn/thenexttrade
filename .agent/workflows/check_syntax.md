---
description: Check for syntax errors and type safety
---

# Syntax & Type Check Workflow

Always run this workflow before delivering a task to ensure the code is error-free.

1. **Type Check**: Run TypeScript compiler to catch type errors.
   ```powershell
   npx tsc --noEmit
   ```

2. **Lint Check**: Run ESLint to catch syntax and code style errors.
   ```powershell
   npm run lint
   ```

3. **Verify Build**: Ensure the project builds successfully (optional but recommended for complex changes).
   ```powershell
   npm run build
   ```

4. **Fix Errors**: If any errors are reported, fix them immediately and re-run the checks.
