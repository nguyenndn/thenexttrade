---
description: Check for syntax errors, type safety, and unit tests before delivery
---

# Syntax & Type Check Workflow (/check_syntax)

Always run this workflow **before delivering any task** to ensure code quality.

## Pre-Delivery Checks (Chạy theo thứ tự)

### 1. TypeScript Type Check
Bắt lỗi type mismatch, missing props, `any` abuse.
// turbo
```powershell
npx tsc --noEmit
```

### 2. Lint Check
Bắt lỗi code style, unused imports, React anti-patterns.
// turbo
```powershell
npm run lint
```

### 3. Unit Tests
Đảm bảo không regression — tất cả tests phải pass.
// turbo
```powershell
npx vitest run
```

### 4. Build Verification (Optional — cho thay đổi lớn)
Đảm bảo production build không fail.
```powershell
npm run build
```

### 5. Fix Errors
- Nếu bất kỳ bước nào fail → fix ngay lập tức.
- Re-run lại từ bước 1 sau khi fix.
- **KHÔNG báo cáo "Done" khi còn errors.**
