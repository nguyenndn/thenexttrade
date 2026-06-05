# Task: Onboarding + KPI + Sync Wizard Implementation

## Phase 1: KPI Explanation System
- [x] Create `src/lib/metrics/metric-definitions.ts` — central registry
- [x] Create `src/components/metrics/MetricHelp.tsx` — shared UI component
- [x] Modify `DashboardHero.tsx` — replace inline tooltips with MetricHelp
- [x] Modify `DashboardClient.tsx` — replace KPI tooltips with MetricHelp
- [x] Modify `analytics-queries.ts` — `999` → `Infinity`, `0` → `null` winRate
- [x] Modify `briefing-queries.ts` — `999` → `Infinity`
- [x] Modify `report-generator.service.ts` — `999` → `Infinity`
- [x] Fix `dashboard/page.tsx` — coalesce null winRate
- [x] Fix `analytics/page.tsx` — coalesce null winRate
- [x] Fix `email.service.ts` — `>= 999` → `!isFinite`
- [x] Fix `pdf-utils.ts` — `>= 999` → `!isFinite`
- [x] Fix `ReportView.tsx` — `>= 999` → `!isFinite`
- [x] Fix `report-insights.service.ts` — Infinity display
- [x] Fix `smart-analytics.ts` — null winRate coalescing (6 locations)
- [x] Fix `profile-queries.ts` — null winRate coalescing

## Phase 2: Sync Wizard Upgrade
- [x] Create `src/lib/sync/sync-urls.ts` — centralized URL generation
- [x] Create `src/app/api/sync/status/route.ts` — sync verification API
- [x] Modify `TradeSyncWizard.tsx` — 3-step → 4-step with Verify
  - [x] Remove hardcoded Supabase URL
  - [x] Add Manual Journal option
  - [x] Add troubleshooting blocks
  - [x] Add `defaultMethod` prop
  - [x] Add method-specific setup instructions
- [x] Modify `AccountListClient.tsx` — query param support (`?setup=sync&method=tnt|ea`)

## Phase 3: Onboarding Flow
- [x] Create `src/lib/onboarding/onboarding.server.ts` — state management
- [x] Create `src/app/api/onboarding/route.ts` — API endpoint
- [x] Modify `src/app/onboarding/actions.ts` — add step-based actions
- [x] Modify `src/app/onboarding/page.tsx` — 4-step wizard rewrite
  - [x] Step 1: Identity (username, avatar, bio)
  - [x] Step 2: Trading Goal
  - [x] Step 3: Sync Preference
  - [x] Step 4: Next Action with redirect

## Phase 4: Dashboard Activation Alignment
- [x] Modify `activation.server.ts` — read onboarding preferences
  - [x] Personalize CTA copy based on sync method
  - [x] Rename "Do your first check-in" → "Daily check-in"

## Phase 6: CTA Positioning & Premium Design (Requested Update)
- [x] Confirm desktop header has no `Start Here` button squeezed between `Login` and `Sign Up Free` (keeping header clean as requested)
- [x] Upgrade homepage callout card (`New here? Start Here`) in `src/app/page.tsx` to match Breek premium styling
  - [x] Add glassmorphism container and golden/orange border styling
  - [x] Integrate glowing gradient button and lucide `Sparkles` icon
  - [x] Add custom hover interactions (scale, ArrowRight hover slide)
- [x] Verify `Start Here` remains prominent in mobile menu
- [x] Verify `Getting Started` checklist link is present in logged-in user menu

## Phase 7: Relocate Callout Card Below FAQ
- [x] Remove the Premium Callout Card from below the Hero/Latest updates grid in `src/app/page.tsx`
- [x] Paste the Premium Callout Card immediately below the `HomeFAQSection` in `src/app/page.tsx`
- [x] Wrap the relocated card in a `FadeIn` scroll-animate container aligned with the platform's visual grid system
- [x] Run `npx tsc --noEmit` and verify 0 compile errors
- [x] Run `npm run lint` and verify 0 lint errors

## Phase 8: Refine /get-started Page Style to Premium Gold
- [x] Refine `PublicGetStarted.tsx` styling (change bg and vibrant orange to soft luxury gold)
- [x] Refine `OnboardingChecklist.tsx` styling (replace brown/orange panels with gold-accented slate-based panels)
- [x] Run `npx tsc --noEmit` and verify 0 compile errors
- [x] Run `npm run lint` and verify 0 lint errors
- [x] Refine "Recommended path" and footer cards in `/get-started` to dynamically adapt to the active theme (soft gold in Light Mode, dark slate in Dark Mode)
- [x] Align `/get-started` entire background (wrappers + gradient overlays) to exactly match the premium brand design of `/about` (`bg-[#F7F4EC] dark:bg-[#090805]` and linear-gradients)

## Phase 9: Refine Learning Path Timeline CTA Button Sizing
- [x] Refine the bulky `rounded-full` green Academy CTA button (`Start Learning Now`) in `src/app/page.tsx`
- [x] Apply a modern, balanced layout: change fully-rounded pill size to crisp `rounded-xl`, refine padding to standard `px-8 py-3 text-sm`
- [x] Run `npx tsc --noEmit` and verify 0 compile errors
- [x] Run `npm run lint` and verify 0 lint errors

## Verification
- [x] `npx tsc --noEmit` — 0 errors
- [x] Verify header cleanliness on desktop (Login + Sign Up Free)
- [x] Verify mobile menu has Start Here when logged out
- [x] Verify UserMenu dropdown has Getting Started when logged in
- [x] Verify homepage callout styling (light/dark mode compatibility)
- [x] Verify /get-started page styling (softer gold, light/dark mode canvas)
- [x] Verify "Recommended Path" card styling is theme-aware (no hardcoded dark color in Light Mode)
- [x] Verify /get-started background matches /about page perfectly
- [x] Verify timeline CTA button has refined proportions and matches premium design specs

## Phase 10: Academy 5-Step Timeline Regrouping & Star Icon Removal
- [x] Modify `LearningPathTimeline.tsx` — replace star icon with `TrendingUp` and group the 12 Levels into the 5 static steps
- [x] Modify `AcademyMap.tsx` — replace star icon with `TrendingUp`, update `PHASES` to group all 12 Levels, and use true `Shield` and `Crown` icons for Phase 4 and 5
- [x] Run type check (`npx tsc --noEmit`) to verify 0 errors
- [x] Run lint check (`npm run lint`) to verify 0 errors
- [x] Self-review changes and update walkthrough.md

## Phase 11: Tools Preview Card Color Scheme Update
- [x] Modify `ToolsPreviewSection.tsx` — change Forex Market Hours card styling to emerald/primary Breek green theme
- [x] Modify `ToolsPreviewSection.tsx` — change Economic Calendar card styling to premium Gold theme
- [x] Run type check (`npx tsc --noEmit`) to verify 0 errors
- [x] Run lint check (`npm run lint`) to verify 0 errors

## Phase 12: Premium Cardless Homepage Layout Rebuild
- [x] Modify `TrustedPartners.tsx` — remove outer boxes, convert to an elegant 3-column layout with cardless design, and clean background styling
- [x] Modify `WebForexTools.tsx` — remove outer boxes, clean background styling, and convert tools to a cardless premium glassmorphic grid
- [x] Run type check (`npx tsc --noEmit`) to verify 0 errors
- [x] Run lint check (`npm run lint`) to verify 0 errors
- [x] Self-review changes and update walkthrough.md

## Phase 13: Border Hardening & Section Renaming
- [x] Rename section title "Web Forex Tools" to "Trading Calculators" in `WebForexTools.tsx` for cleaner visual identity
- [x] Harden outermost card borders on `TrustedPartners.tsx` vertical column wrappers in Light and Dark Mode using premium gold/amber colors
- [x] Harden inner items border and adjust card backgrounds in `TrustedPartners.tsx` to gold/amber theme to solve blurriness
- [x] Harden card borders on all 8 individual tool cards inside `WebForexTools.tsx` to amber/gold theme
- [x] Remove horizontal dividing border-t line between Trusted Partners and Trading Calculators blocks in `WebForexTools.tsx`
- [x] Center-align the headers inside `WebForexTools.tsx` (Trading Calculators) and `TrustedPartners.tsx` (Trusted Partners)
- [x] Remove the centered Lucide icons above the text headers in both components for cleaner and less bulky layout
- [x] Align the "View all tools" button in `WebForexTools.tsx` to the far right side of the block on desktop while keeping text perfectly centered on the page
- [x] Standardize heading typography font sizes across all three home sections (`text-3xl md:text-4xl font-black text-gray-800`) for perfect parity
- [x] Upgrade review/comment cards in `ReviewsSection.tsx` to use the premium gold/amber borders (`border-amber-200/70`) and primary green theme hover glows
- [x] Increase card item titles to `text-base` and descriptions/subtitles to standard `text-xs` in `TrustedPartners.tsx` and `WebForexTools.tsx` for optimal readability and sharp rendering
- [x] Standardize both components (`TrustedPartners.tsx` & `WebForexTools.tsx`) to use the exact same padding structure (`pt-6 pb-16`) for mathematically perfect layout consistency across sections
- [x] Recolor `AboutUsSection.tsx` elements (Globe icon, Quote icon, Read My Story button, card hover gradients) to Gold/Amber/Orange accents to eliminate color clashes with the adjacent Start Here card and achieve flawless color cohesion
- [x] Verify type check (`npx tsc --noEmit`) returns 0 compilation errors
- [x] Verify lint check (`npm run lint`) returns 0 static analysis errors
- [x] Document updates inside `walkthrough.md`

## Phase 14: Premium Start Here CTA Gold Theme Synchronization
- [x] Refine the `Start Here` CTA block container in `src/app/page.tsx` from vibrant orange/amber to premium soft Breek gold (`border-gold/25`, `from-gold/[0.04] to-amber-500/[0.02]`)
- [x] Convert decorative blur glow and compass icon colors to standard gold (`from-gold/15`, `text-gold`, `bg-gold/10`)
- [x] Replace button vibrant orange styles with gorgeous standard gradient (`from-gold to-amber-500 hover:from-amber-500 hover:to-amber-600`) and matching gold shadow values (`shadow-amber-500/25` / `rgba(245,158,11,0.25)`)
- [x] Run type check (`npx tsc --noEmit`) and ESLint to verify 0 errors
- [x] Self-audit UI and update walkthrough.md

## Phase 15: Homepage FAQ Section Visual Refinement
- [x] Tinh chỉnh padding `HomeFAQSection` thành `pt-6 pb-16` (Đồng bộ nhịp Spacing 88px hoàn hảo)
- [x] Aligned main header to exact typographic scale parity (`text-3xl md:text-4xl font-black text-gray-800 tracking-tight`)
- [x] Aligned main subtitle size to standard clean layout (`text-xs text-gray-500 font-medium`)
- [x] Re-colored sub-header icons to brand **Gold** (`text-amber-500`) and **Emerald** (`text-emerald-500`) to highlight Breek dual-theme accents
- [x] Hardened FAQAccordion outer card borders to `border-gray-200/80 dark:border-white/5 bg-white/80 dark:bg-white/[0.02]`
- [x] Refined accordion question weights to highly professional `font-semibold text-gray-800 dark:text-gray-100`
- [x] Upgraded Dark Mode answer legibility to high-contrast `dark:text-gray-400`
- [x] Verified compilation via `npx tsc --noEmit` returns 0 errors
- [x] Verified code quality via `npm run lint` returns 0 static analysis errors
- [x] Documented all styling upgrades in `walkthrough.md`

## Phase 16: System-Aware FAQ Copy Alignment
- [x] Rà soát và loại bỏ toàn bộ các câu hỏi cũ/không chính xác về Prop Firm theo đúng Product Decision
- [x] Biên soạn lại 6 câu hỏi `PLATFORM_FAQ` bám sát chính xác các tính năng thực tế: TNT Connect, EA Sync, 12 Levels in 5 Phases, Edge daily check-in, calculators
- [x] Biên soạn lại 6 câu hỏi `TRADING_FAQ` bám sát chính xác các định nghĩa chuyên nghiệp: Win Rate (loại bỏ break-even, `--` display), Profit Factor `∞` (drawdown), Mistake Tracking
- [x] Xác thực toàn bộ type check `npx tsc --noEmit` đạt 0 lỗi biên dịch
- [x] Xác thực code quality `npm run lint` đạt 0 lỗi phân tích tĩnh
- [x] Cập nhật chi tiết kết quả vào `walkthrough.md`

## Phase 17: Premium Tools Refinement & Onboarding Gold Rebuild
- [x] Check `tools/market-hours` page visual presentation & readability in light/dark mode
- [x] Check `tools/economic-calendar` page visual presentation & readability in light/dark mode
- [x] Rebuild breadcrumbs in both pages into elegant glassmorphic `w-fit` breadcrumb panels
- [x] Align Economic Calendar canvas to Breek standard `#0B0E14` warm dark background
- [x] Ban purple visual accent in `MarketHoursMonitor.tsx` Session Overlaps
- [x] Completely rebuild `/onboarding` page to match `/about` and `/get-started` design
- [x] Apply premium warm gold canvas background `#F7F4EC` / `#090805` and radial/linear overlay
- [x] Refactor main onboarding wizard card container to custom premium glassmorphism
- [x] Integrate floating theme switcher switcher in `/onboarding` page
- [x] Style progress bar, step indicators, input highlights, and goals selection panels in Gold
- [x] Recolor Step 4 unlocked features to clean Gold accents, complying with Purple Ban
- [x] Verify type check `npx tsc --noEmit` returns 0 compilation errors
- [x] Verify lint check `npm run lint` returns 0 static analysis errors
- [x] Update walkthrough.md and finalize task checklist

## Phase 18: Risk Management Pillar Page Gold Rebuild
- [x] Apply premium warm gold background `#F7F4EC` / `#090805` and ambient gold top-glow overlay
- [x] Convert old breadcrumb layout to Breek standard glassmorphic `w-fit` panel
- [x] Rebuild main hero header to Option B Split-Staggered HUD with Guide Terminal status widget
- [x] Revise all 5 pillar section theoretical copy to align with Breek actual trading platform (TNT Connect, Drawdown mapping, Mistake tracking, professional win rate calculation, Sharpe, Academy Level 9)
- [x] Package calculators grid and advanced publications inside Breek's gold-accented glassmorphic cards
- [x] Refactor Academy Level 9 CTA block to soft gold gradient glow card and explore button to brand gradient
- [x] Verify type check `npx tsc --noEmit` returns 0 compilation errors
- [x] Verify lint check `npm run lint` returns 0 static analysis errors
- [x] Log key accomplishments in walkthrough.md and task.md

## Phase 19: Mathematical Calculator Audits and Dynamic Exchange Rate Correction
- [x] Audit all 16 calculators' math formulas and user-facing copy
- [x] Uncover historical Forex scaling/margin bugs for JPY/CAD/GBP pairs
- [x] Re-engineer core calculators library `src/lib/calculators.ts` with strict dynamic exchange rate conversion logic
- [x] Update `PIP_VALUES` baseline estimates to match 2026 rates
- [x] Refactor `src/components/calculator/MarginCalc.tsx` to destructure and render dynamic positionValue
- [x] Verify type check `npx tsc --noEmit` returns 0 compilation errors
- [x] Verify lint check `npm run lint` returns 0 static analysis errors
- [x] Log accomplishments in walkthrough.md and task.md

## Phase 20: Platform Search Page Gold Rebuild
- [x] Apply premium warm gold background `#F7F4EC` / `#090805` and ambient gold top-glow overlay
- [x] Integrate PublicHeader and SiteFooter for full layout consistency
- [x] Convert old breadcrumb layout to Breek standard glassmorphic `w-fit` panel
- [x] Rebuild main hero header to Option B Split-Staggered HUD with Search Terminal status widget
- [x] Package search input panel and search results cards inside Breek's gold-accented glassmorphic cards
- [x] Color-code search results by type to Breek themes, complying with Purple Ban (Articles -> Gold, Lessons -> Emerald)
- [x] Verify type check `npx tsc --noEmit` returns 0 compilation errors
- [x] Verify lint check `npm run lint` returns 0 static analysis errors
- [x] Log accomplishments in walkthrough.md and task.md

## Phase 21: Platform Search Page Redundant Input Box Removal
- [x] Completely remove redundant "Looking for something specific?" input card from `SearchClient.tsx`
- [x] Remove unused `SearchBar` import in `SearchClient.tsx` to prevent ESLint/type warnings
- [x] Verify type safety and static analysis via `npx tsc --noEmit` and `npm run lint` (0 compilation errors, 0 lint errors)
- [x] Update walkthrough.md and task.md checklist to finalized state

## Phase 22: Knowledge Articles Aspect Ratio Sync (16:9)
- [x] Modify `ArticleCard.tsx` aspect ratio from `aspect-[4/3]` to `aspect-[16/9]` to perfectly mirror the homepage article card format
- [x] Add custom `bg-gray-900` to the card image container for visual loading depth
- [x] Verify type safety and static analysis via `npx tsc --noEmit` and `npm run lint` (0 compilation errors, 0 lint errors)
- [x] Document updates inside walkthrough.md

## Phase 23: Category Pills Premium Gold Glassmorphism
- [x] Implement Option A (Soft Glassmorphic Gold theme) Category Pills in `src/app/knowledge/page.tsx`
- [x] Restore transparent inactive backgrounds `bg-white/40` and `dark:bg-white/5` with custom premium gold borders `border-amber-500/20`
- [x] Style active state with beautiful amber/yellow gradient background `bg-gradient-to-r from-amber-500 to-yellow-500` and gold shadow offsets
- [x] Verify type safety and static analysis via `npx tsc --noEmit` and `npm run lint` (0 compilation errors, 0 lint errors)
- [x] Document accomplishments in walkthrough.md and task.md

## Phase 24: Search Experience & Portal Overhaul
- [x] Implement React Portal in `PublicSearchModal.tsx` to render at `document.body` level, curing visual overlay issues
- [x] Modify `PublicHeader.tsx` to conditionally hide `PublicSearchTrigger` on `/search` page
- [x] Restore and refactor `SearchBar` inside `SearchClient.tsx` in an extremely sleek, integrated body design
- [x] Verify type safety and static analysis via `npx tsc --noEmit` and `npm run lint` (0 compilation errors, 0 lint errors)
- [x] Document accomplishments in walkthrough.md and task.md

## Phase 25: iPhone 15 Pro Max Exact Aspect-Ratio & Width Synchronization
- [x] Increase card container width to standard responsive `max-w-[290px] sm:max-w-[340px]` to improve trading text legibility
- [x] Change screenshot rendering from `object-cover` to `object-contain` to ensure 100% full view with no cropping
- [x] Add high-end tactile dark backgrounds `bg-black dark:bg-[#06080c]` to the image container to merge black screenshots seamlessly
- [x] Verify compilation via `npx tsc --noEmit` and confirm 0 errors
- [x] Log updates in walkthrough.md and task.md

## Phase 26: VIP Benefits Copy Sync (Image 1)
- [x] Update `vipBenefits` array in `src/app/community/page.tsx` to match Image 1 copy exactly
- [x] Verify no other occurrences exist to maintain consistent system-wide copy
- [x] Audit "Everything You Get — For Free" block copy for perfect Fintech SaaS alignment
- [x] Verify compilation via `npx tsc --noEmit` is clean with 0 errors
- [x] Verify lint check via `npm run lint` is clean with 0 errors
- [x] Update walkthrough.md and close tasks


## Phase 27: Futuristic Backgrounds for VIP & Bottom CTA Blocks
- [x] Convert VIP Group section container to deep dark tech layout in both light/dark themes
- [x] Integrate futuristic gold-amber cybernetic grid backdrop pattern
- [x] Insert dual glowing mesh spots (Sky Blue & Amber Gold)
- [x] Stylize benefits grid cards as dark glassmorphic SaaS components
- [x] Rebuild Ready to Join the Community? block container with exact matching tech canvas
- [x] Fix light-mode contrast text wrapping and helper text colors

## Phase 28: Personalized Welcome Modal [REVERTED]
- [x] Fetch onboarding goal state from DB in server-side Dashboard loader (Reverted per product decision)
- [x] Create gold-glassmorphic PersonalizedWelcomeModal component (Removed and deleted file `PersonalizedWelcomeBanner.tsx`)
- [x] Pass tradingGoal prop down to DashboardClient (Cleaned up prop structure)
- [x] Implement local-storage aware daily dismissal mechanism (Reverted)
- [x] Verify flawless TypeScript and ESLint builds (0 errors)

## Phase 29: User-Facing Coach & Activation Plan
- [x] Step 29.1: Fix UserProgress compilation error in `signal-engine.server.ts` (isCompleted check)
- [x] Step 29.2: Implement Smart Notifications service `src/lib/coach/coach-notifications.server.ts` with strict cooldown logic
- [x] Step 29.3: Polish Public Trader Card 2.0 CTA in `PublicProfileCard.tsx` to include `?ref=${profile.username}`
- [x] Step 29.4: Build Admin Activation Inbox actions `src/actions/admin-activation.ts`
- [x] Step 29.5: Implement AdminActivationInboxPanel component in `src/components/admin/reports/AdminActivationInboxPanel.tsx`
- [x] Step 29.6: Mount AdminActivationInboxPanel inside AdminReportsDashboard
- [x] Step 29.7: Run Typecheck, Lint, and Tests to verify complete type safety, lint correctness, and 0 regression
## Phase 30: Next.js 15 Link Deprecation Fix
- [x] Remove `passHref` and `legacyBehavior` from `<Link>` wrapping `<Button>` in `NextBestActionPanel.tsx`
- [x] Remove `passHref` and `legacyBehavior` from `<Link>` wrapping `<Button>` in `WeeklyCoachPlan.tsx`
- [x] Remove `passHref` and `legacyBehavior` from `<Link>` wrapping `<Button>` in `RecommendedForYou.tsx`
- [x] Run typecheck (`npx tsc --noEmit`) to verify 0 errors
- [x] Run ESLint (`npm run lint`) to verify 0 errors
- [x] Run tests (`npx vitest run`) to verify 0 errors

## Phase 31: Academy Inactivity Nudge & Weekly Report Focus Cleanup
- [x] Implement the `LearningResumeNudge` client component for Academy learning path pause warnings (Phase 2)
- [x] Query user's last `UserProgress` (completed lessons) and `UserQuizAttempt` timestamps to compute idle days
- [x] Render `LearningResumeNudge` banner at the top of `/dashboard/academy` if user is idle for >= 7 days
- [x] Remove `WeeklyFocus` component, `buildWeeklyInsights` import, and rendering call from `ReportView.tsx` (Phase 3)
- [x] Cleanly delete the unused `report-insights.service.ts` file from Git
- [x] Run full type-check and linter sweeps to verify 0 errors
- [x] Run vitest suite to ensure complete system consistency (26/26 tests passed)

## Phase 32: QA Report Fixes (BUG-001 & UX-001)
- [x] Resolve BUG-001: Auto-generation of Weekly Coach Action Plan for Weekly Reports
  - [x] Statically import `generateWeeklyActionPlan` in `src/actions/reports.ts` to bypass ESM dynamic import interop quirks
  - [x] Upgrade error handling in `getReports` to include all required context (`userId`, `reportId`, and `type`)
  - [x] Throw errors in development, test, and Playwright QA runs instead of silently swallowing, preventing silent failures and easing debugging
- [x] Resolve UX-001: Consolidated compact nudge bar dialog on Dashboard
  - [x] Refined `DashboardCoachNudge.tsx` to remove deprecated `passHref` from Next.js `<Link>` elements
  - [x] Verified `DashboardClient.tsx` completely removed old bulky panels (`NextBestActionPanel` & `RecommendedForYou`) in favor of `<DashboardCoachNudge>`
  - [x] **[FIXED]** Resolved text-wrapping visual bug inside the Coach Plan dialog:
    - [x] Added `whitespace-normal` class to `DialogContent` base component inside `src/components/ui/Dialog.tsx` to reset standard text wrapping across all dialogs in the app.
    - [x] Added `whitespace-normal` explicitly to `DialogContent` in `src/components/coach/DashboardCoachNudge.tsx`.
    - [x] Added `flex-1 min-w-0` to the text content wrapper of the Primary Action card to prevent horizontal expansion of flex items under long text descriptions.
    - [x] Added `flex-1` to the recommended item cards text content wrapper to correctly compute remaining flex space and enable robust truncation rules.
  - [x] Verified `npx tsc --noEmit` returns exactly 0 compile errors
  - [x] Verified `npm run lint` completes with exactly 0 lint errors
  - [x] Verified `npx vitest run` completes with 100% passing tests (26/26 tests passed)

## Phase 33: New User Reminder, First Insight & Mobile Fallback
- [x] Workstream 1: Light Stuck-User Reminders
  - [x] Create helper `src/lib/onboarding/activation-reminder-state.ts` to manage reminder state & dismissed timestamp in user settings
  - [x] Create server candidate engine `src/lib/onboarding/activation-reminders.server.ts` to filter stuck users, respect caps, and avoid email duplication
  - [x] Create cron route `src/app/api/cron/activation-reminders/route.ts` to coordinate in-app notifications and email channels
  - [x] Design premium email templates (HTML/Text) `src/lib/emails/activation-reminders.ts` for all reminder states
  - [x] Add counts and Action Queue alerts to `/admin/reports` (`src/lib/admin/reports/action-queue.server.ts`)
- [x] Workstream 2: First Insight Moment
  - [x] Build query engine `src/lib/onboarding/first-insight.server.ts` to extract facts (`trade_count`, `net_pnl`, `win_rate`, `top_symbol`, `session_hint`)
  - [x] Integrate first insight loader in dashboard query and connect dismiss server action
  - [x] Rebuild `FirstSyncSuccessModal.tsx` to support gold-glassmorphic stats cards, custom CTAs, and elegant transitions
  - [x] Add funnel step `"First Insight Viewed"` in `/admin/reports` user lifecycle metrics (`src/lib/admin/reports/user-lifecycle.server.ts`)
- [x] Workstream 3: Mobile Sync Fallback
  - [x] Create client/viewport device detector helper `src/lib/device.ts`
  - [x] Integrate warnings and fallback cards into `/onboarding` Step 3 sync preference choosing step (`OnboardingClient.tsx`)
  - [x] Build mobile screen fallback screen inside dashboard wizard `FirstSessionWizard.tsx` with email setup link CTA
  - [x] Integrate warnings at the top of MT5 sync steps in `TradeSyncWizard.tsx`
  - [x] Build backend actions to track fallback events (`mobile_sync_fallback_viewed`, etc.) and send setup link emails (`src/actions/first-session-onboarding.ts`)
- [x] Verification
  - [x] Clean type check (`npx tsc --noEmit` -> 0 errors)
  - [x] Clean lint check (`npm run lint` -> 0 errors)
  - [x] Clean unit tests (`npx vitest run` -> 26/26 tests passed)

## Phase 34: Dashboard Empty State Bug Fix for Historical Users
- [x] Diagnose period-restricted empty state bug causing WelcomeHero to show for active users on flat days
- [x] Add `hasGlobalTrades` boolean flag to `DashboardPageData` interface in `src/app/dashboard/dashboard-data.server.ts`
- [x] Populate `hasGlobalTrades` correctly in `getEmptyDashboardData` (false) and `getFullDashboardData` (globalTradeCount > 0)
- [x] Update `hasNoData` definition inside `DashboardClient.tsx` to check `!hasGlobalTrades`
- [x] Replace unsafe `prisma.journalEntry.count` check with central `getUserTradingDataState` in dashboard `page.tsx` loader to secure historical MT5 active users (0 manual journal entries but synced totalTrades > 0)
- [x] Integrate unified `getUserTradingDataState` check in lightweight `has-trade-data` route `src/app/api/user/has-trade-data/route.ts`
- [x] Re-run and verify type check (`npx tsc --noEmit` -> 0 errors)
- [x] Re-run and verify lint check (`npm run lint` -> 0 errors)
- [x] Re-run and verify unit tests (`npx vitest run` -> 26/26 tests passed)

## Phase 35: Public Pages Spacing Optimization (Mobile & Tablet)
- [x] Optimize spacing in Contact Page (`src/app/contact/page.tsx`)
- [x] Optimize spacing in Brokers Page (`src/app/brokers/page.tsx` & `src/app/brokers/BrokersClient.tsx`)
- [x] Optimize spacing in About Page (`src/app/about/page.tsx`)
- [x] Optimize spacing in Home Page (`src/app/page.tsx`)
- [x] Optimize spacing in Academy Page (`src/app/academy/page.tsx`)
- [x] Optimize spacing in Tools Page (`src/app/tools/page.tsx`)
- [x] Optimize spacing in Knowledge Page (`src/app/knowledge/page.tsx`)
- [x] Optimize spacing in Community Page (`src/app/community/page.tsx`)
- [x] Optimize spacing in Edge Page (`src/app/edge/page.tsx`)
- [x] Run typescript typecheck (`npx tsc --noEmit`) and linter (`npm run lint`) to verify 0 errors
- [x] Run Playwright tests to capture and verify public pages visual layout (`npx playwright test tests/e2e/capture-public-pages.spec.ts`)

## Phase 36: Public Pages Spacing Top Restorations (Mobile & Tablet)
- [x] Restore top padding/margin next to Header on Contact Page (`src/app/contact/page.tsx`)
- [x] Restore top padding/margin next to Header on Brokers Page (`src/app/brokers/page.tsx`)
- [x] Restore top padding/margin next to Header on About Page (`src/app/about/page.tsx`)
- [x] Restore top padding/margin next to Header on Home Page (`src/app/page.tsx`)
- [x] Restore top padding/margin next to Header on Academy Page (`src/app/academy/page.tsx`)
- [x] Restore top padding/margin next to Header on Tools Page (`src/app/tools/page.tsx`)
- [x] Restore top padding/margin next to Header on Knowledge Page (`src/app/knowledge/page.tsx`)
- [x] Restore top padding/margin next to Header on Community Page (`src/app/community/page.tsx`)
- [x] Restore top padding/margin next to Header on Edge Page (`src/app/edge/page.tsx`)
- [x] Run typescript typecheck (`npx tsc --noEmit`) and linter (`npm run lint`) to verify 0 errors
- [x] Run Playwright tests to capture and verify public pages visual layout (`npx playwright test tests/e2e/capture-public-pages.spec.ts`)

## Phase 37: Standardize Contact Page Spacing to Legal Style (Mobile & Tablet)
- [x] Rebuild Contact Page spacing using `legal/cookie-policy` standard (`src/app/contact/page.tsx`)
- [x] Run typescript typecheck (`npx tsc --noEmit`) and linter (`npm run lint`) to verify 0 errors
- [x] Run Playwright tests to capture and verify public pages visual layout (`npx playwright test tests/e2e/capture-public-pages.spec.ts`)

## Phase 38: Delete /tools/risk-calculator & Set Up 301 Redirect
- [x] Delete `src/app/tools/risk-calculator` route code and folder
- [x] Update footer links in `SiteFooter.tsx` from `risk-calculator` to `position-size-calculator`
- [x] Update risk-management guide tools links in `risk-management/page.tsx`
- [x] Remove `risk-calculator` from `sitemap.ts`
- [x] Configure 301 redirect in `next.config.js`
- [x] Verify typescript compile (`npx tsc --noEmit`) and linter (`npm run lint`) has 0 errors

## Phase 39: Responsive Heading Sizing for Tools and Guides on Mobile
- [x] Re-architect heading wrapper from horizontal to flex-col on mobile inside `ToolPageLayout.tsx` (15 calculator pages)
- [x] Reduce heading size to `text-[22px] sm:text-3xl` in `ToolPageLayout.tsx`
- [x] Reduce heading size in Forex Market Hours page (`market-hours/page.tsx`)
- [x] Reduce heading size & adjust wrapper in Economic Calendar page (`EconomicCalendarClient.tsx`)
- [x] Reduce heading size & adjust wrapper in Risk Management Guide page (`risk-management/page.tsx`)
- [x] Reduce heading size & adjust wrapper in Search page (`SearchClient.tsx`)
- [x] Verify type safety and ESLint sweep (0 errors)
- [x] Run Playwright screenshots capture to verify all headings fit perfectly on a single line on mobile


## Phase 40: Auditing Public Pages & E2E Updates
- [x] Scan Next.js app routes for remaining public pages
- [x] Add missing public routes (Legal pages, other tools, community, get-started, auth forms) to Playwright test (`tests/e2e/capture-public-pages.spec.ts`)
- [x] Check mobile/tablet responsiveness, alignment, and top padding on all public routes
- [x] Run type safety check (`npx tsc --noEmit`) and linter (`npm run lint`) to confirm 0 errors

## Phase 41: Dashboard Journal Empty State Alignment
- [x] Analyze empty state UI of `dashboard/sessions` (animated clock, floating icons, sparkles, etc.)
- [x] Refactor empty state rendering in `dashboard/journal` component (`JournalList.tsx`) to match the sessions page empty state structure
- [x] Build premium animated folder/paper icon with floating and sparkle effects
- [x] Integrate `EmptyStateCTAs` to provide guided user action
- [x] Run typescript typecheck (`npx tsc --noEmit`) and linter (`npm run lint`) to verify 0 errors

## Phase 42: EA Sync API Route DB Performance Optimization (Batching)
- [x] Refactor `/api/ea/trades` Route (`src/app/api/ea/trades/route.ts`) to use batch database operations
  - [x] Parse all incoming trades in memory first
  - [x] Query all existing tickets in a single `findMany` call with `{ externalTicket: { in: tickets } }`
  - [x] Filter out existing trades to find new ones
  - [x] Batch insert new trades in a single `createMany` transaction
  - [x] Handle any errors gracefully and return skipped vs imported counts
- [x] Run typescript typecheck (`npx tsc --noEmit`) and linter (`npm run lint`) to verify 0 errors
- [x] Run unit tests (`npx vitest run`) to verify 100% success

## Phase 43: Dashboard Alert Orchestration and Weekly Review Gating
- [x] Create `src/lib/reports/weekly-review-eligibility.ts` central helper
- [x] Modify `src/app/dashboard/dashboard-data.server.ts` to include weeklyReviewEligibility and display suppress flags
- [x] Modify `src/app/dashboard/DashboardClient.tsx` to handle suppress flags, customize review nudges, and prioritize alerts
- [x] Modify `src/lib/activation/activation.server.ts` to make weekly review available check dynamic
- [x] Modify `src/components/dashboard/ActivationChecklist.tsx` to disable weekly review if not ready
- [x] Modify `src/lib/coach/signal-engine.server.ts` to check `showFirstWeeklyReview` for `NO_WEEKLY_REVIEW` signal
- [x] Run typescript typecheck (`npx tsc --noEmit`) and linter (`npm run lint`) to verify 0 errors

## Phase 44: Fix Duplicate Review CTA Bug
- [x] Refine ActivationChecklist suppression condition to check `!reportNudgeDismissed` and `!suppress?.reportNudge`
- [x] Verify build and type checking

