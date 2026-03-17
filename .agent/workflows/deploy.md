---
description: Automated Vercel deployment. Pre-flight checks, git push, production deploy, and health verification.
---

# /deploy - TheNextTrade Production Deployment

// turbo-all

---

## Steps

### 1. Pre-flight: TypeScript Check
// turbo
```powershell
npx tsc --noEmit
```
> ❌ Nếu fail → STOP. Fix lỗi trước khi tiếp tục.

### 2. Clean Build Cache
// turbo
```powershell
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
Write-Host "✅ .next cache cleared"
```

### 3. Check Git Status
// turbo
```powershell
git status --short
```
Review changes trước khi commit.

### 4. Stage All Changes
// turbo
```powershell
git add .
```

### 5. Generate Commit Message & Commit
Tuân thủ Conventional Commits. Phân tích diff để tạo commit message phù hợp.
```powershell
git commit -m "<type>(<scope>): <description>"
```

### 6. Push to Remote
// turbo
```powershell
git push origin TheNextTrade
```

### 7. Prisma DB Sync (If Schema Changed)
Chỉ chạy nếu `prisma/schema.prisma` có thay đổi trong commit.
```powershell
npx dotenv -e .env.production -- npx prisma db push --accept-data-loss
```
> ⚠️ Hỏi user trước khi chạy nếu có `--accept-data-loss`.

### 8. Deploy to Vercel Production
```powershell
vercel --prod --yes
```
> Vercel sẽ tự động: `npm install` → `prisma generate` → `next build` → deploy.

### 9. Health Check
Sau khi deploy xong, kiểm tra:
// turbo
```powershell
curl -s -o /dev/null -w "%{http_code}" https://thenexttrade.vercel.app
```
> ✅ Expected: `200`

### 10. Verify API Health
// turbo
```powershell
curl -s -o /dev/null -w "%{http_code}" https://thenexttrade.vercel.app/api/health
```

### 11. Report
Sau khi hoàn tất, báo cáo cho user:
```markdown
## 🚀 Deployment Complete

### Summary
- **Branch:** TheNextTrade
- **URL:** https://thenexttrade.vercel.app
- **Status:** ✅ Live
- **Health:** API responding

### What Changed
[list changes from commit]
```

---

## Rollback (Nếu Cần)
```powershell
vercel rollback --yes
```

---

## Sub-commands

| Command | Mô tả |
|---------|--------|
| `/deploy` | Full deploy (check → push → build → verify) |
| `/deploy check` | Chỉ chạy pre-flight checks (steps 1-3) |
| `/deploy push` | Git push only (steps 3-6) |
| `/deploy production` | Skip git, deploy trực tiếp từ code hiện tại |
| `/deploy rollback` | Rollback về version trước |

---

## Environment Variables (Vercel Dashboard)

Các biến cần set trên Vercel Dashboard > Project Settings > Environment Variables:

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | ✅ | Port 6543 (Pooler) + `?pgbouncer=true` |
| `DIRECT_URL` | ✅ | Port 5432 (Direct) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key |
| `NEXT_PUBLIC_APP_URL` | ✅ | `https://thenexttrade.vercel.app` |
| `REDIS_URL` | ✅ | Upstash/Railway Redis URL |
| `SMTP_HOST` | ✅ | Email SMTP server |
| `SMTP_PORT` | ✅ | Usually `587` |
| `SMTP_USER` | ✅ | SMTP username |
| `SMTP_PASS` | ✅ | SMTP password |
| `SMTP_SECURE` | ⚪ | `true` for port 465 |
| `SMTP_FROM_EMAIL` | ✅ | Sender email address |
| `SMTP_FROM_NAME` | ⚪ | `The Next Trade` |
| `GEMINI_API_KEY` | ⚪ | Google AI Studio key |
| `GITHUB_TOKEN` | ⚪ | GitHub Models API (AI Studio) |
