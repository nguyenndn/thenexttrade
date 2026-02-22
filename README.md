# GSN-CRM - Forex Education & Trading Platform

> **Web app giáo dục và hỗ trợ phân tích forex với hệ thống học liệu, quiz, trading journal, risk calculator và performance dashboard.**

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development (local database - recommended)
npm run dev:local
```

📖 **Full guide:** [docs/QUICK_START.md](docs/QUICK_START.md)

---

## 📚 Technical Documentation

We have organized the documentation into the following sections:

### 🏗️ Architecture
- [System Overview](docs/architecture/overview.md) - Tech stack & High-level architecture.
- [Database Schema](docs/architecture/database.md) - ER Diagram & Data Models.
- [Project Documentation Index](DOCUMENTATION_INDEX.md) - Complete directory guides.

### 🧩 Key Features
- [Authentication](docs/features/authentication.md) - Auth flows & RBAC.
- [Analytics Dashboard](docs/features/analytics.md) - Performance metrics & calculations.
- [Trading Journal](docs/features/trading-journal.md) - Logging trades & psychology.
- [Academy & Knowledge](#) - Educational content and lesson progress mapping.
- [Trader Tools](docs/features/trader-tools.md) - Risk calculator, market hours, etc.

### 🔌 API Reference
- [API Endpoints](docs/api/endpoints.md) - Backend API Routes.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Database:** PostgreSQL (Supabase) + Prisma ORM
- **Styling:** Tailwind CSS (Breek Premium Design)
- **State:** React Hooks + Server Components

## 🧪 Development Commands

- `npm run dev:local` - Run local dev server.
- `npm run db:migrate` - Run Prisma migrations.
- `npm run type-check` - Run TypeScript compiler check.

## 🛡️ Testing & QA

We maintain a rigorous testing standard including Security Hardening and Logic Verification.

- **Full Regression:** `npm test` (Runs all unit tests)
- **Security Audit:** `npx vitest tests/security/hardening.test.ts` (CSRF, XSS, RBAC)
- **System Logic:** `npx vitest tests/user/integration/system-logic.test.ts` (Calculators, Access Control)
- **Profile Logic:** `npx vitest tests/user/api/profile-advanced.test.ts` (File Uploads, Validation)

---

**Version:** 1.0.0 | **Maintainer:** GSN Team
