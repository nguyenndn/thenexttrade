# GSN-CRM - Forex Education Platform

> Web app giáo dục và hỗ trợ phân tích forex với hệ thống học liệu, quiz, trading journal, risk calculator và performance dashboard.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development (local database - recommended)
npm run dev:local

# Or start with production database
npm run dev:prod
```

📖 **Full guide:** [docs/QUICK_START.md](docs/QUICK_START.md)

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── academy/           # Forex education courses
│   ├── admin/             # Admin dashboard & CMS
│   ├── dashboard/         # User trading dashboard
│   ├── articles/          # News & analysis
│   ├── tools/             # Trading tools (calculator, journal)
│   ├── auth/              # Authentication
│   └── api/               # Backend API routes
├── components/            # React components
├── lib/                   # Utilities, database, auth
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript definitions
```

📖 **Details:** [docs/planning/PROJECT_STRUCTURE.md](docs/planning/PROJECT_STRUCTURE.md)

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router), TypeScript
- **Database:** PostgreSQL (Prisma ORM)
- **Auth:** Supabase Auth
- **Cache:** Redis (ioredis)
- **Styling:** Tailwind CSS + shadcn/ui
- **Rich Text:** TipTap
- **Charts:** Recharts

---

## 📚 Documentation

### Quick Access
- 📖 [Quick Start Guide](docs/QUICK_START.md) - ⭐ Start here!
- ⚙️ [Environment Setup](docs/ENVIRONMENT_SETUP.md) - Configuration guide
- 🚀 [Performance Optimization](docs/performance/PERFORMANCE_OPTIMIZATION_SPEC.md) - Performance docs
- 📋 [Full Documentation Index](docs/README.md) - All documentation

### Development Workflow
```bash
npm run dev:local      # Local dev (fast, ServBay DB)
npm run dev:prod       # Production env (Supabase DB)
npm run db:migrate     # Run migrations
npm run db:seed        # Seed database
npm run perf:test      # Test performance
```

---

## 📊 Performance

| Environment | Homepage | Academy | Average |
|------------|----------|---------|---------|
| **Local** | ~80ms | ~50ms | ~100ms ⚡ |
| **Production** | ~1300ms | ~700ms | ~1200ms 🌐 |

- ✅ All code optimizations applied
- ✅ Database indexes implemented
- ✅ Query optimization completed

📖 **Details:** [docs/performance/](docs/performance/)

---

## 🎯 Key Features

- 📚 **Academy** - Structured forex courses with progress tracking
- 📰 **CMS** - Content management with AI writing assistant
- 📊 **Trading Journal** - Track trades and analyze performance
- 🧮 **Risk Calculator** - Position sizing and risk management
- 📈 **Dashboard** - Trading statistics and analytics
- 🏆 **Gamification** - XP system, levels, achievements

---

## 🔗 Additional Resources

- [Project Status](PROJECT_STATUS.md) - Current development status
- [Deployment Guide](VERCEL_DEPLOYMENT.md) - Vercel deployment
- [Optimization Plan](OPTIMIZATION_PLAN.md) - Performance roadmap

---

**Version:** 1.0.0 | **Last Updated:** January 23, 2026

4. **Mở trình duyệt:**
   ```
   http://localhost:3000
   ```

## Scripts

- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm run start` - Chạy production server
- `npm run lint` - Chạy ESLint
- `npm run type-check` - Kiểm tra TypeScript

## Documentation

- [PLAN.md](./docs/planning/PLAN.md) - Roadmap và kế hoạch phát triển
- [PROJECT_STRUCTURE.md](./docs/planning/PROJECT_STRUCTURE.md) - Cấu trúc project chi tiết
- [UI_GUIDE.md](./design/ui-guide.md) - Hướng dẫn UI/UX
- [SPRINT1_TASKS.md](./docs/sprints/SPRINT1_TASKS.md) - Tasks Sprint 1

## License

ISC
