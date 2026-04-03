# Environment Setup Guide

## 🎯 TL;DR - Đơn Giản

```bash
# Chỉ cần nhớ:
npm run dev:local    # Development (local DB - FAST)
npm run dev:prod     # Test production (remote DB - SLOW)
```

**Xong!** Scripts tự động switch environment cho bạn.

---

## 📁 Environment Files

### 3 Files Quan Trọng:
- **`.env.local`** - Local development (ServBay PostgreSQL)
  - Password: `ServBay.dev`
  - Fast: ~16ms average
  
- **`.env.production`** - Production (Supabase remote)
  - Slow: ~1200ms average (network latency)
  
- **`.env`** - Active environment (auto-generated, git ignored)

---

## 🚀 Usage

### Daily Work (99%):
```bash
npm run dev:local
```

### Test Production:
```bash
npm run dev:prod
```

**Scripts tự động:**
1. ✅ Switch environment
2. ✅ Backup `.env` cũ
3. ✅ Copy environment mới
4. ✅ Load variables
5. ✅ Start server

**Không cần làm gì thêm!**

---

## 📊 Performance Comparison

| Environment | Command | Speed | Use Case |
|-------------|---------|-------|----------|
| **Local** | `npm run dev:local` | ⚡ 16ms | Daily dev (recommended) |
| **Production** | `npm run dev:prod` | 🐌 1200ms | Test production setup |

---

## 🔧 Configuration

### Local (.env.local)
```env
DATABASE_URL="postgresql://postgres:ServBay.dev@localhost:5432/gsn_crm"
REDIS_URL="redis://localhost:6379"
NODE_ENV="development"

# AI Content Pipeline
GEMINI_API_KEY="xxx"
FIRECRAWL_API_KEY="xxx"
SERPER_API_KEY="xxx"
```

### Production (.env.production)
```env
DATABASE_URL="postgresql://postgres.xxx@aws-xxx.pooler.supabase.com:5432/postgres"
NODE_ENV="production"
```

---

## ⚠️ Troubleshooting

### Database Connection Failed
```bash
# Check password trong .env.local
# Should be: ServBay.dev
```

### Environment Not Switching
```bash
# View current environment
cat .env

# Force switch
npm run env:local
cat .env  # Verify
```

---

## 💡 Tips

1. **Luôn dùng** `npm run dev:local` cho development
2. **Scripts tự động** load environment variables
3. **Backup tự động** mỗi lần switch: `.env.backup.timestamp`
4. **Git ignore** `.env`, `.env.local`, `.env.production`

**Đơn giản vậy thôi!** 🎉

---

## 🔧 Manual Environment Switch

### Option 1: Using PowerShell Script
```powershell
# Switch to local
.\scripts\switch-env.ps1 local

# Switch to production
.\scripts\switch-env.ps1 production
```

### Option 2: Manual Copy
```bash
# Local
Copy-Item .env.local .env -Force

# Production
Copy-Item .env.production .env -Force
```

---

## 📝 Configuration Details

### .env.local (Local Development)
```env
DATABASE_URL="postgresql://postgres:ServBay.dev@localhost:5432/gsn_crm"
REDIS_URL="redis://localhost:6379"
```
- ✅ Fast queries (<100ms)
- ✅ No network latency
- ✅ Full control over data
- ⚠️ Auth still uses remote Supabase

### .env.production (Remote Production)
```env
DATABASE_URL="postgresql://postgres.xxx@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"
REDIS_URL="redis://..."  # Optional
```
- ✅ Production-ready
- ✅ Auth integrated
- ✅ Managed backups
- ⚠️ Network latency 200-400ms

---

## 🎯 Workflow Examples

### Scenario 1: Daily Development
```bash
# Morning - Start with local
npm run env:local
npm run dev

# Develop features...

# Test performance
npm run perf:test
```

### Scenario 2: Testing Production Setup
```bash
# Switch to production env
npm run env:prod

# Test with production data
npm run dev

# Verify everything works
npm run perf:test

# Switch back to local
npm run env:local
```

### Scenario 3: Database Migration
```bash
# Create migration
npx prisma migrate dev --name add_feature

# Test locally
npm run env:local
npm run db:migrate

# Test on production
npm run env:prod
npm run db:migrate
```

---

## 🔒 Security Notes

### Files in `.gitignore`:
- ✅ `.env` (active environment - auto-generated)
- ✅ `.env.local` (contains ServBay password)
- ✅ `.env.production` (contains Supabase credentials)
- ✅ `.env.backup.*` (backup files)

### Files in Git:
- ✅ `.env.example` (template only - safe to commit)

### Best Practices:
1. **Never commit** `.env`, `.env.local`, `.env.production`
2. **Always use** `npm run env:local` or `npm run env:prod`
3. **Backup** `.env` before switching (script does this automatically)
4. **Verify** environment after switching: `cat .env`

---

## 📊 Performance Testing

### Test Current Environment:
```bash
npm run perf:test
```

### Compare Environments:
```bash
# Test local
npm run env:local
npm run perf:test
# Note results

# Test production
npm run env:prod
npm run perf:test
# Compare results
```

### Expected Results:

**Local Environment:**
```
✅ Homepage: ~80ms (Fast)
✅ Academy: ~50ms (Fast)
✅ Average: ~100ms
✅ All queries <300ms
```

**Production Environment:**
```
🟡 Homepage: ~1300ms (Slow - network)
🟡 Academy: ~700ms (Slow - network)
🟡 Average: ~1200ms
⚠️ Network latency unavoidable
```

---

## 🛠️ Troubleshooting

### Issue: "Environment variable not found"
```bash
# Verify .env exists
cat .env

# If not, switch environment
npm run env:local
```

### Issue: "Database connection failed"
```bash
# Check ServBay is running
# Or switch to production
npm run env:prod
```

### Issue: "Redis connection error"
```bash
# Start Redis in ServBay
# Or comment out REDIS_URL in .env
```

### Issue: "Migration failed"
```bash
# Reset database
npx prisma migrate reset

# Re-run migrations
npm run db:migrate
npm run db:seed
```

---

## 📦 New Developer Setup

1. **Clone repository**
2. **Copy environment template:**
   ```bash
   Copy-Item .env.example .env.local
   ```
3. **Update credentials in `.env.local`:**
   - PostgreSQL password
   - Supabase keys
   - Redis URL
4. **Switch to local:**
   ```bash
   npm run env:local
   ```
5. **Setup database:**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
6. **Start development:**
   ```bash
   npm run dev
   ```

---

## 🎉 Summary

**npm Scripts:**
- `npm run env:local` - Switch to local environment
- `npm run env:prod` - Switch to production
- `npm run db:migrate` - Run migrations
- `npm run db:seed` - Seed database
- `npm run perf:test` - Test performance
- `npm run dev` - Start dev server

**Files:**
- `.env.local` - Local config (ServBay)
- `.env.production` - Production config (Supabase)
- `.env.example` - Template
- `.env` - Active (auto-generated, git ignored)

**Switch environments easily with one command!** 🚀
