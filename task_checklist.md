# Sprint 2 - Content & Learning Platform Foundation

## Phase 1: CMS Core (Articles & Categories)
- [x] **Backend: CMS Module Setup**
    - [x] Create `cms` module structure (controllers/services)
    - [x] Implement Article CRUD (API Endpoints + DTOs)
    - [x] Implement Category/Tag CRUD
- [x] **Frontend: Admin CMS**
    - [x] Create `/admin/articles` (List View)
    - [x] Create `/admin/articles/new` (Editor UI)
    - [x] Create `/admin/categories` (Category Management)

## Phase 2: Learning System (Academy 2.0)
- [x] **Backend: Learning Module**
    - [x] Create `learning` module structure
    - [x] Implement Course/Module/Lesson CRUD
    - [x] Implement Progress Tracking (Lesson completion)
- [x] **Frontend: Academy UI**
    - [x] Upgrade Course Catalog (`/courses`)
    - [x] Build Lesson Detail Viewer (`/courses/:id/lessons/:id`)
    - [x] Implement "My Learning" Dashboard behavior

## Phase 3: Quizzes & Tools
- [x] **Backend: Quiz Engine**
    - [x] Create `quiz` module (Quiz/Question/Answer)
    - [x] Implement Grading Logic & Submission API
- [x] **Frontend: Quiz Interface**
    - [x] Build Quiz Runner UI (Take Quiz flow)
    - [x] Build Quiz Result/Certificate UI
- [x] **Feature: Risk Calculator**
    - [x] Backend: Calculation Service (Optional/Stateless)
    - [x] Frontend: Calculator Tool UI (`/tools/risk-calculator`)

## Phase 4: Polish & Integration (Professional Grade)
- [x] Connect Frontend to Backend (API Integration for all modules)
- [x] End-to-End Testing & Bug Fixes
## Phase 5: Professional UX (Drag-and-Drop)
- [x] **Setup & Infrastructure**
    - [x] Install `@dnd-kit` dependencies
    - [x] Create reusable `SortableItem` component
    - [x] Implement `PUT /api/reorder` utility or specific route handlers
- [x] **Academy Reordering**
    - [x] Backend: Level/Module/Lesson reorder APIs
    - [x] Frontend: Implement Drag & Drop for Academy Dashboard
- [x] **Quiz Reordering**
    - [x] Backend: Question reorder API
    - [x] Frontend: Implement Drag & Drop for Quiz Builder
- [x] **Advanced Media Management**
    - [x] Backend: `POST /api/upload` (Local Storage)
    - [x] Frontend: `ImageUploader` component with preview
- [x] **Testing & Polish**
    - [x] Verify persistence after refresh
    - [x] Add smooth transitions/animations

## Phase 6: Admin Dashboard Overhaul
- [x] **Infrastructure & Layout**
    - [x] Install `recharts`
    - [x] Refactor Admin Layout to `w-full` (Full Width)
- [x] **Overview Page Upgrade**
    - [x] Add `UserGrowthChart` component
    - [x] Add `ContentDistributionChart` component
    - [x] Implement Recent Activity Feed
- [x] **Article Management Upgrade**
    - [x] Update Table to Full Width with new columns (Views, Author Avatar)
    - [x] Add Search/Filter Bar
- [x] **BA Improvements (Users, Academy, Quizzes)**
    - [x] Users: Add Role badge, Join Date, Status
    - [x] Academy: Add Analytics summary (Completed in Dashboard)
    - [x] Quizzes: Add Pass Rate & Avg Score metrics (Completed in Dashboard)
- [x] **Settings Page Implementation**
    - [x] Create Profile Settings Section
    - [x] Create System Configuration Section

## Phase 7: Admin Pages Enrichment (Users, Articles, Academy)
- [x] **Users Page (`/admin/users`)**
    - [x] Stats Row: Total Users, Active This Month, New This Week
    - [x] Widget: User Role Distribution Chart
- [x] **Articles Page (`/admin/articles`)**
    - [x] Stats Row: Total Views, Avg Views/Article, Published Count
    - [x] Widget: Top 5 Categories Chart
- [x] **Academy Page (`/admin/academy`)**
    - [x] Stats Row: Total Lessons, Total Modules, Completion Rate
    - [x] Widget: Lesson Type Distribution

## Phase 8: User Experience Completeness
- [x] **User Settings (`/dashboard/settings`)**
    - [x] Create Profile Form (Name, Bio, Avatar)
    - [x] Create Security Form (Change Password)
    - [x] Wire up with `User` and `Profile` models
- [x] **Login Streak Feature**
    - [x] Schema: `currentStreak`, `checkInHistory`
    - [x] UI: Calendar View & Check-in Button (Streak Page)
    - [x] API: Check-Check-In Endpoint (with XP & Badges)
- [x] **Trading Journal (`/dashboard/journal`)**
    - [x] Connect "Daily Review" to `JournalEntry` model
    - [x] Make Calendar clickable to view/edit entries
    - [x] Implement "Add Trade" modal/form
- [x] **My Learning Hub (`/dashboard/learning`)**
    - [x] Create Dashboard for Enrolled Courses
    - [x] Show Progress Bars & Resume Button

## Phase 9: Interaction & System Health
- [x] **Interaction Engine**
    - [x] Create `Comment` model in API
    - [x] Create API endpoint (`/api/comments`)
    - [x] Create UI Component (`CommentSection`)
    - [x] Integrate into Article/Lesson Pages
- [x] **System Health**
    - [x] Create `ErrorLog` model
    - [x] Implement Error Logging Utility (`src/lib/logger.ts`)
    - [x] Implement Dynamic SEO Meta Tags (Article Page)

## Phase 10: Content Experience Enhancements
- [x] **Engagement Features**
    - [x] Social Share Component (Floating/Inline)
    - [x] Related Articles Block (Algorithm: Same Category)
    - [ ] Author Bio Card (Enhanced)
- [/] **Retention Features**
    - [x] Newsletter/CTA Widget (Sidebar)
    - [ ] Reading Progress Bar

## Phase 11: Design Refinement (Reinv5 Style)
- [x] **Visual Analysis**
    - [x] Analyze Reference Layout
- [x] **Implementation**
    - [x] Refactor Header (Title/Meta placement)
    - [x] Refactor Featured Image (Style/Width)
    - [x] Refactor Content Typography & Spacing
    - [x] Refactor Sidebar & Widgets to match style

## Phase 12: URL Standardization
- [x] **Architecture**
    - [x] Rename `/news` to `/articles`
    - [x] Update internal links (Footer, Widgets)
    - [x] Update Homepage links
    - [x] Verify routing consistency

## Phase 15: Redesign Article Detail (Breek Style)
- [x] **Analysis**
    - [x] Analyze Breek Classic Reference
- [x] **Implementation**
    - [x] Create `SidebarWidgets` (Recent Posts, Tags, Categories)
    - [x] Update `SocialShare` (Vertical Sticky)
    - [x] Refactor `ArticlePage` (Boxed Layout, Grid System)
    - [x] Fix Missing Imports

## Phase 16: Sidebar Widgets (Trusted Brokers)
- [x] **Analysis**
    - [x] Check Schema (No Broker model)
- [x] **Implementation**
    - [x] Create `TrustedBrokersWidget` (Mock Data)
    - [x] Add to `SidebarWidgets`
    - [x] Verify Placement
    - [x] Refine Widget to Banner (User Request)
    - [x] Create `/brokers` Page

## Phase 18: Academy (User Frontend)
- [x] **Analysis**
    - [x] Inspect Existing Pages (`/academy`, `/lesson`, `/quiz`)
    - [x] Check Backend Endpoints (API exists)
- [x] **Academy Home Polish**
    - [x] Refine Hero & Roadmap Design
    - [x] Ensure "Breek" Aesthetic
- [x] **Lesson Player Experience**
    - [x] Enhance Sidebar (Show all modules/course structure)
    - [x] Implement Real Video Player (YouTube/Vimeo Embed)
    - [x] Implement "Mark Complete" Action (API Integration)
    - [x] Mobile Navigation (Drawer)
- [x] **Quiz Interface**
    - [x] Verify Quiz Flow
    - [x] Add Success Animations (Confetti)

## Phase 19: Trading Tools (User Frontend)
- [x] **Analysis**
    - [x] Inspect `/tools/position-size-calculator`
    - [x] Inspect `/dashboard/journal`
- [x] **Position Size Calculator**
    - [x] Implement Calculator Logic (Risk %, SL -> Lots)
    - [x] UI Polish (Input groups, Result display)
    - [x] Live/Mock Pair Rates
- [x] **Trading Journal**
    - [x] Trade List / Calendar View
    - [x] "Log Trade" Form (Modal)
    - [x] Connect to `JournalEntry` API

## Phase 20: Testing & SEO
- [x] **SEO Implementation**
    - [x] Global Metadata (layout.tsx)
    - [x] Academy/Tools Metadata
    - [x] Sitemap/Robots.txt generation
- [x] **Testing Foundation**
    - [x] Setup Jest/Vitest
    - [x] Unit Test: Risk Calculator Logic
    - [x] Unit Test: Journal Metric Calculation
    - [x] Unit Test: Rate Limit & Auth Validation
- [x] **Performance Polish**
    - [x] Audit Bundle Size
    - [x] Optimize Images (`next/image` usage check)

## Phase 21: Admin UI Polish (Premium Style)
- [x] **Dashboard Overview**
    - [x] Premium Header & Typography
    - [x] Enhanced Stat Cards (Interactive, Rings)
- [x] **Article Management**
    - [x] Premium Header & Create Button
    - [x] Premium Stats Grid
- [x] **User Management**
    - [x] Premium Header & Export Button
    - [x] Enhanced Stats Cards
- [x] **Other Modules (Categories, Tags, Academy, Quizzes)**
    - [x] Standardized Header

## Phase 22: Admin UI Refinement Round 2
- [x] **Dashboard Overview**
    - [x] Update StatCard hover effects (match Articles/Users)
- [x] **Clean Up Lists**
    - [x] Remove "All Categories" header
    - [x] Remove "All Tags" header
- [x] **Academy Layout**
    - [x] Fix Full Width issue (remove max-w constraints)

## Phase 23: Admin UI Refinement Round 3
- [x] **Standardize Buttons**
    - [x] Rename all create buttons to "Add New"
    - [x] Fix Academy button size
- [x] **Header Integration**
    - [x] Move Category Header to list component
    - [x] Move Tag Header to list component
    - [x] Align "Add New" buttons with Headerss (Font, Spacing, Highlight)
    - [x] Standardized Action Buttons
- [x] **System Logs**
    - [x] Standardized Header

## Phase 24: Performance Optimization
- [x] **Diagnosis & Fixes**
    - [x] Optimize Dashboard Academy (Parallel Fetching)
    - [x] Fix Metadata Base Warning
    - [x] Optimize Article Stats (GroupBy)
- [x] **Production Readiness**
    - [x] Fix Build & Type Errors (Next.js 15 Migration)
    - [x] Fix dynamic route params (`await params`)
    - [x] Fix `createClient` await
    - [x] Fix Dashboard Prerendering (Wrapper Pattern)
    - [x] Remove legacy `rejectionReason` and `tradingPlan`
    - [x] **Server Component Refactor (Layouts)**
        - [x] Dashboard Layout (`/dashboard`)
        - [ ] Root Layout (`/`)
        - [ ] Admin Layout (`/admin`)
        - [ ] Legal Layout (`/legal`)
- [x] Implement Structured Data (JSON-LD)
    - [x] Add WebSite schema to Root Layout
    - [x] Add Article schema to Article Pages
    - [x] Add Course/Lesson schema to Academy Pages
- [x] Verify Production Build (`npm run build`)

## Phase 25: Admin UI Refinement Round 4
- [x] **Header Enhancements**
    - [x] "Vertical Bar" Title Highlight
    - [x] Green Text Accent for all pages
- [x] **Navigation Sidebar**
    - [x] Update Active State to Green (#00C888)
    - [x] Synchronize Mobile Sidebar Colors
- [x] **Global Standardization**
    - [x] Apply Header Style to Articles, Users, Academy, Quizzes, Categories, Tags, Logs
    - [x] Standardize Add New Buttons (Quizzes)

# Sprint 3 - Workflow, Dashboard & Forex Tools

## Phase 26: Article Workflow & Approval (Admin/Editor)
- [x] **Approval System**
    - [x] Add `status` transitions
    - [x] Editor Submit / Admin Approve APIs
- [x] **Email Notifications** (Deferred to Sprint 4)
- [x] **Scheduled Publishing** (Deferred)

## Phase 27: Admin Dashboard Analytics
- [x] **Statistics API**
    - [x] Aggregated Stats (Articles, Users, Learning)
- [x] **Dashboard UI**
    - [x] Real Data Integration for Charts
    - [x] Recent Activity Feed (Real)

## Phase 28: Economic Calendar (User)
- [x] **Data Model & API**
    - [x] `EconomicEvent` Model
    - [x] CRUD Endpoints (GET /api/economic-events)
    - [x] Sync Service (External Data - ForexFactory)
- [x] **Frontend Pages**
    - [x] Calendar View (`/economic-calendar`)
    - [x] Calendar Filters & Layout
    - [x] Refine Sync & Navigation (Refresh btn, Current Week only)
- [x] **Forex Market Hours Tool**
    - [x] Create Visual Monitor (Sydney, Tokyo, London, New York)
    - [x] Page `/tools/market-hours`
- [x] **Market Ticker (Real-time)**
    - [x] Market Data Service (Twelve Data API)
    - [x] Integrate into Homepage Ticker

## Phase 29: Trading Journal Expansion (User)
- [x] **Journal Enhancements**
    - [x] Expand Model (Entry/Exit Reason, Snapshots)
    - [x] Advanced CRUD (Filter, Sort)
- [x] **Performance Dashboard**
    - [x] Performance Stats API (WinRate, R:R)

## Phase 30: Trading Plan (User)
- [x] **Trading Plan System** (Cancelled - User Request)

## Phase 31: Comments System
- [x] **Interaction**
    - [x] Comments API (Nested/Reply)
    - [x] UI Components (Article/Lesson integration)

## Phase 32: Legal Pages
- [x] **Content Generation**
    - [x] Terms of Service, Privacy Policy, Cookie Policy
- [x] **Implementation**
    - [x] Create `/legal` layout and pages

# Sprint 4 - Performance, Security & Launch Readiness (Outstanding)

## Phase 33: Technical Optimization (Frontend)
- [x] **Core Web Vitals**
    - [x] LCP/CLS Optimization
    - [x] Image Optimization
    - [x] Fix Duplicate Menu
- [x] **SEO Advanced**
    - [x] Dynamic Sitemap
    - [x] Schema.org Structured Data

## Phase 34: Security Hardening
- [x] **Rate Limiting** (API Routes)
- [x] **Input Sanitization**
- [x] **Security Headers** (CSP)

## Phase 35: Homepage Content & UX
- [x] **Hero Section**
    - [x] Latest Articles & Carousel
- [x] **Content Sections**
    - [x] Trending, Guides, Roadmap
- [x] **Technical**
    - [x] Server Component Transition

## Phase 36: Additional SEO Features
- [x] **RSS Feed**
    - [x] Create `/feed.xml` endpoint
    - [x] Generate XML from Articles
    - [x] Add `<link rel="alternate">` to Head
    - [x] **URL Polish**
        - [x] Clean Slug Generation (Increment vs Timestamp)

## Phase 37: Infrastructure & Reliability
- [x] **Background Jobs (Queue)**
    - [x] Setup Redis Connection
    - [x] Install BullMQ
    - [x] Setup Email Queue
    - [x] Create Worker Script
- [x] **Email Service**
    - [x] Configure SMTP/Provider
    - [x] Implement Send Logic
- [x] **Monitoring**
    - [x] Setup Sentry (Frontend/Backend)
    - [x] Setup Error Alerts

## Phase 38: Caching & Performance (Backend)
- [x] **Redis Caching**
    - [x] Implement Redis Cache Wrapper (`src/lib/cache.ts`)
    - [x] Cache Articles/Courses API responses
    - [x] Implement Cache Invalidation (Using TTL Strategy)

## Phase 39: Internationalization (i18n)
- [x] **i18n Setup** (Cancelled - User Request for Global/English only)

# Bonus Feature: Gamification & Engagement

## Phase 40: Gamification System
- [x] **Infrastructure & Schema**
    - [x] Create `Badge` model (Name, Icon, Description, XP)
    - [x] Create `UserBadge` model (Relation with Date Earned)
    - [x] Add `xp`, `level` to User model
- [x] **Core Logic (Achievement Engine)**
    - [x] Implement `grantBadge(userId, badgeCode)` service
    - [x] Implement `addXP(userId, amount)` service
    - [x] Event Listeners (e.g., on `LessonCompleted` -> Check Badges)
- [x] **UI Implementation**
    - [x] Profile: Badge Gallery & Level Progress Bar
    - [x] Dashboard: "Next Achievement" suggestions
    - [x] Notifications: "You earned a badge!" (Toast/Confetti)

## Phase 41: Final Frontend Optimization (Skill-Based)
- [x] **Core Audit (Vercel React Best Practices)**
    - [x] Bundle Size (Imports, Lazy Load, Tree-Shaking)
    - [x] Waterfalls (Dashboard, Admin, Landing, Library)
    - [x] Correct Auth State Propagation (SSR)
- [x] **Stability & Fixes**
    - [x] Scheduler Logic (Production Only)
    - [x] Public Page Imports & Props

## Phase 42: Deep Performance Tuning (DB & Payload)
- [x] **Database Optimization**
    - [x] Replaced Slow `OR` query in `articles/[slug]` with strict `findUnique`
    - [x] Verified Indexes (slug, status, createdAt)
- [x] **Payload Optimization (Select vs Include)**
    - [x] Homepage (`featured`, `latest`, `popular`): Excluded `content`, `bio`, unused relations
    - [x] Library: Excluded `content`, unused relations
- [x] **Client Component Optimization**
    - [x] Market Ticker: Check layout shift & TBT
    - [x] Implemented SSR (Initial Data) for Ticker to remove loading spinner using `getMarketData` in `page.tsx`
- [x] **Academy Optimization**
    - [x] Layout: Replaced waterfalls with cached `getAuthUser` & `prisma`
    - [x] Index: Optimized payload (`select` vs `include`)
    - [x] Lesson: Verified query optimization (Sibling selection)
- [x] **Final System Audit (Polish)**
    - [x] Brokers (`/brokers`): Added `getAuthUser` for consistent Header
    - [x] Economic Calendar (`/economic-calendar`): Refactored to Client/Server Split for SSR Auth
    - [x] Analysis (`/analysis/*`): Added `PublicHeader` & `SiteFooter` to bare pages
- [x] **Admin System Optimization (Skill-Based)**
    - [x] Users (`/admin/users`): Fixed Serial Waterfall & Optimized Count Payload
    - [x] Articles (`/admin/articles`): Excluded `content` field & Optimized Relations
    - [x] Logs (`/admin/system/logs`): Excluded `stack` trace from list view
- [x] **Final Security & Stability Sweep**
    - [x] Quiz API (`api/quizzes/[id]`): Security Fix - Hidden `isCorrect` from client
    - [x] Economic API (`api/economic-events`): Stability Fix - Used Singleton Prisma
- [x] **Final Polish & UX**
    - [x] Quiz Page (`academy/quiz/[id]`): Added Real User Auth & Lazy Loaded Confetti
    - [x] Article Create (`admin/articles/create`): Verified `select` Optimization

## Phase 5: Academy Redesign ("Trader's Ascent")
- [x] **Planning & Dependencies**
    - [x] Audit & Research BabyPips Curriculum
    - [x] Install `framer-motion`
- [x] **UI Implementation**
    - [x] Create `AcademyMap` Component (Galaxy Visualization)
    - [x] Create `CourseNode` Component (Planet UI)
    - [x] Integrate into `academy/page.tsx`
- [x] **Data Logic**
    - [x] Map existing 3 Levels to "5 Phases" Logic
    - [x] Ensure Mobile Responsiveness
    - [x] Remove `slug` from Module interface
- [x] **Dashboard Sync**
    - [x] Implement "Cockpit" Layout in `/dashboard/academy`
    - [x] Sync `AcademyMap` (Light/Dark Mode Support)
    - [x] Add "Firefly & Dot Grid" Effects (80 particles)
- [x] **Lesson Interface Redesign**
    - [x] Refactor `LessonClientView` (Premium Layout)
    - [x] Implement "Cinema Mode" Video Player
    - [x] Add Confetti Completion Effect
