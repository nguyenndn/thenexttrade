# News CRM Web App Roadmap

### 1. Scope & Goals
- **Platform**: Comprehensive Forex Education & Analytics Platform.
- **Roles**: Reader, Editor, Analyst, Admin.
- **Core Features**:
    - **CMS**: Articles, Categories, Media Management.
    - **Academy**: Leveled Courses, Quizzes, Progress Tracking ("Trader's Ascent").
    - **Forex Tools**: Risk Calculator, Economic Calendar, Trading Journal.
    - **Dashboard**: Personalized stats, "Cockpit" view, Performance Analytics.

### 2. Architecture & Technology (Updated)
- **Frontend/Backend**: Next.js 14+ (App Router) - Monorepo structure.
- **Database**: Supabase (PostgreSQL) + Prisma ORM.
- **Auth**: Supabase Auth (Client & Server Actions).
- **Styling**: Tailwind CSS + Shadcn/UI (Design System).
- **Deployment**: Vercel (recommended) or Docker.

### 3. Data Design
- **Identity**: `users`, `Profile` (extended attributes), `roles`.
- **Content**: `Article`, `Category`, `Tag`, `Comment`.
- **Learning**: `Course`, `Module`, `Lesson`, `Quiz`, `UserProgress`.
- **Tools**: `JournalEntry`, `EconomicEvent` (optional local cache).

### 4. Sprint Status

**Sprint 1 – Foundation & Auth [COMPLETED ✅]**
- Setup Next.js App Router & Supabase Client/Server.
- Implemented Auth (Login/Signup/Reset) & Route Guards.
- Built Core Design System (UI Guide, Components).

**Sprint 2 – Content & Learning Engine [COMPLETED ✅]**
- **CMS**: Article CRUD, Rich Text Editor, Media Uploads.
- **Academy**: Course/Lesson/Quiz CRUD with Drag & Drop reordering.
- **Tools**: Risk Calculator complete.

**Sprint 3 – Dashboard & Interaction [COMPLETED ✅]**
- **Admin Dashboard**: Analytics, Users/Articles Management.
- **Journal**: Full Trading Journal with P/L stats.
- **Economic Calendar**: Events view & filters.
- **Comments**: Discussion system.

**Sprint 4 – Performance & Polish [COMPLETED ✅]**
- **Optimization**: SEO (Sitemap/Meta), Caching strategy, Image Opt.
- **Security**: CSP, Rate Limiting, Audit.
- **Academy Redesign**: "Galaxy Map", Premium UI, Gamification.

### 5. Future Roadmap (Backlog)
- **Signal Service**: Real-time trading signals (Analyst role).
- **Notification System**: In-app & Email alerts (using Queue).
- **Community**: Forum or Social Feed.
- **Mobile App**: React Native bridge.

### 6. DevOps & Deployment
- **Environments**: Dev / Staging / Prod.
- **Monitoring**: Sentry (Error Tracking) & Vercel Analytics.
- **CI/CD**: GitHub Actions (Lint/Test).

> Last Updated: Sprint 4 Completion
