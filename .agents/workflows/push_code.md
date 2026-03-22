---
description: Automates the process of staging, committing, and pushing code to GitHub following strict Conventional Commits standards.
---

# Push Code Workflow (/push_code)

## Pre-Push Checks (BẮT BUỘC trước khi commit)
Chạy `/check_syntax` trước — đảm bảo:
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run lint` → 0 critical warnings
- [ ] `npx vitest run` → 100% pass

## Steps

### 1. Analyze Status and Diff
// turbo
```powershell
git status
```
// turbo
```powershell
git diff --stat
```
Review changes để xác định commit type và scope phù hợp.

### 2. Stage Changes
// turbo
```powershell
git add .
```
> Note: Nếu cần stage file cụ thể, User handle trước khi chạy workflow.

### 3. Generate Commit Message
Tuân thủ [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

**Format:** `<type>(<scope>): <description>`

| Type | Sử dụng |
|------|---------|
| `feat` | Tính năng mới |
| `fix` | Fix bug |
| `docs` | Thay đổi documentation |
| `style` | Format code (không ảnh hưởng logic) |
| `refactor` | Restructure code (không fix bug, không thêm feature) |
| `perf` | Cải thiện hiệu năng |
| `test` | Thêm/sửa tests |
| `build` | Thay đổi build system / dependencies |
| `ci` | Thay đổi CI/CD config |
| `chore` | Các thay đổi khác (không ảnh hưởng src/test) |
| `revert` | Revert commit trước |

**Rules:**
- Imperative mood ("add" not "added")
- Không dấu chấm cuối
- Description ≤ 72 ký tự
- Breaking changes: footer `BREAKING CHANGE: ...`
- Scope phản ánh module/component thay đổi (VD: `feat(journal): add filter bar`)

### 4. Execute Commit
```powershell
git commit -m "<type>(<scope>): <description>"
```

### 5. Push to Remote
```powershell
git push origin main
```
> ⚠️ Assumes credentials are cached. User may need to authenticate manually if not.
