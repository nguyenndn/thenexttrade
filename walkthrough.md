# Walkthrough — Admin Core Features Implementation (4 Plans)

We have completed the complete implementation and end-to-end verification of the 4 Admin core feature plans:
1. `docs/features/admin-user-data-coverage-plan.md` (GAP-1 to GAP-12)
2. `docs/features/admin-user-behavior-segmentation-plan.md` (Trader Behavior & Value Radar Console)
3. `docs/features/admin-user-narrative-summary-plan.md` (Hero User Narrative on `users/[id]`)
4. `docs/features/admin-revenue-pipeline-plan.md` (Commission Rates & IB Revenue Pipeline)

All work adheres to the `AGENTS.md` execution contract, Breek UI Guide standards (English-only UI, no generic placeholders, `<Button>`, `<DropdownMenu>`, `rounded-xl`, Lucide icons, 2x2 Matrix Cards), with zero TypeScript errors, zero ESLint errors, and 100% unit test pass rate.

---

## 1. Feature Breakdown & Key Deliverables

### A. Admin ↔ User Data Coverage Plan (GAP-1 to GAP-12)
- **Control Plane & Security (GAP-11, GAP-12)**:
  - Expanded `QuickActionsWidget.tsx` from 3 to 6 high-leverage cards.
  - Verified `prisma.auditLog.create` on impersonation start/revert and `/admin/login` security logging.
- **Core Trading Data Inspectors (GAP-1, GAP-2)**:
  - Created `UserJournalTab.tsx` with KPI summary cards, symbol/result/direction filters, trades table, and Trade Telemetry Inspector modal.
  - Created `UserTradePlansTab.tsx` with pre-trade execution plans and Plan vs Actual comparison modal.
- **Playbook, Rules, & Strategic Execution (GAP-3, GAP-4)**:
  - Created `UserRulesGoalsTab.tsx` displaying active trading rules, severity levels, trader goals, and rule check logs.
  - Displayed user's playbook strategies with target pairs and minimum R:R.
- **Growth, Missions, Coach, & Experiments (GAP-5, GAP-6, GAP-7)**:
  - Created `UserGrowthCoachTab.tsx` featuring Edge XP event telemetry, Mission progression, 10-Trade Improvement Experiments, and AI Coach weekly action plans.
- **Performance Reports, Notes, & Article Votes (GAP-8, GAP-9, GAP-10)**:
  - Created `UserReportsNotesTab.tsx` with weekly/monthly trading reports, calendar day reflection notes, and algorithmic leak radar.
  - Created `src/actions/admin-article-votes.ts` and `ArticleVotesAuditModal.tsx` in `/admin/articles` for inspecting and purging anomalous vote spam.
- **Tabs Integration**:
  - Expanded `UserDetailTabsWrapper.tsx` to 8 comprehensive tabs with dynamic counter pills.

### B. User Behavior Segmentation Console (Doc #2)
- **Classification Engine**:
  - Added `WIN_STREAK` signal to `src/lib/coach/signal-engine.server.ts` and `signal-types.ts`.
  - Created shared module `src/lib/admin/behavior/classify.server.ts` (`classifyUser`, `buildNarrative`, `buildChips`).
  - Created query module `src/lib/admin/behavior/activity.server.ts` (`computeUserTradingActivity`, `getBatchProductAdoption`, `getBatchLastActivity`).
- **Console UI & Server Actions**:
  - Route `/admin/users/behavior` with server action `getBehaviorUsersAction` in `src/app/admin/users/behavior/actions.ts`.
  - Tab A: **Needs Attention** sorted by urgency score, with risk chip alerts (TILT, REVENGE, DRAWDOWN, WIN_STREAK, INACTIVE), quick contact links (Telegram / Email), and one-click impersonation.
  - Tab B: **Value Radar** highlighting high IB value traders, active real account telemetry, trading tempo, lot size trend, stayed-after-loss loyalty indicator, and product adoption.
  - Added "Trader Behavior" entry to `adminMenuItems` and `QuickActionsWidget.tsx`.

### C. User Narrative Summary (Doc #4)
- **Hero Synopsis Component**:
  - Created `src/components/admin/users/UserNarrativeSummary.tsx` (Server Component).
  - Mounted directly above tabs in `src/app/admin/users/[id]/page.tsx` inside a graceful `try/catch`.
  - Renders behavioral narrative text, risk alerts, trading tempo, product adoption, and value indicator.
  - **Zero DB Writes Guarantee**: Verified `persist: false` guarantee via `prisma/_test_persist_false.cjs` (viewing user detail never mutates the database).

### D. Revenue (IB Commission) Pipeline (Doc #3)
- **Schema & Database Updates**:
  - Added `BrokerCommissionRate` model with `brokerId`, `symbol`, `commissionPerLot`, `currency`, `effectiveFrom`.
  - Added `ibAttribution`, `ibAttributionSource`, `ibAttributionUpdatedAt`, and `ibAttributionUpdatedBy` on `TradingAccount`.
  - Pushed to Postgres via `prisma db push` and generated Prisma client.
- **Volume & Revenue Refinements**:
  - Created `src/lib/admin/ib/eligible-volume.server.ts` (`buildEligibleJournalWhere`). Excludes demo, paper, and manual accounts from IB volume.
  - Upgraded `estimatedIbRevenue` in `src/lib/services/ib-snapshot.service.ts` to use per-broker & per-symbol commission rates and strictly count `ibAttribution === "CONFIRMED"`.
  - Updated `IbTargetTrackerHero.tsx` with dynamic commission rate and Out-of-IB Active Ratio telemetry card in `src/app/admin/ib/client.tsx`.
- **Admin Configuration UI**:
  - Created `CommissionRatesTab.tsx` and `EABrokersTabsClient.tsx` in `/admin/trading-systems/brokers` for managing commission rates with audit logging.
  - Created `AccountIbAttributionBadge.tsx` with interactive dropdown for updating IB attribution status in user detail and IB traders table.

---

## 2. Sync Support Requests: Slide-over Drawer Rebuild
- **Problem Solved**:
  - The previous implementation rendered a massive 100% full-width amber card directly below the Page Header, pushing all key metrics and accounts table down and leaving 80% blank empty space when only 1 ticket was active.
- **Key Architectural & UI Improvements**:
  1. **Removed Full-Width Page Banner**: Cleaned up lines 538–615 in `AccountListClient.tsx`. Account Hub returns to 100% focused layout.
  2. **Created `SyncSupportDrawer.tsx`**:
     - Built using Radix UI `Sheet` primitive (`side="right"`).
     - Sticky Header with `LifeBuoy` badge, title, subtitle, and close button.
     - Dual-tab navigation: `Support Tickets ({count})` and `+ New Request`.
     - 2x2 Specs Grid per ticket (Active Server, Requested time, Trader notes, Status badges: `PENDING` with pulse, `VERIFIED`, `FAILED`, `CANCELLED`).
     - In-drawer cancellation with optimistic states and error handling.
     - New request form with Account Selector (or Custom account), credential validation warning, server/broker inputs, and diagnostic notes.
  3. **Live Badge on Header Button**:
     - Upgraded `Sync Support` button on the PageHeader with dynamic badge count `({pendingCount})` and pulse indicator when active requests exist.
  4. **Contextual Account Table Integration**:
     - `AccountTable.tsx` now receives `userTickets`.
     - Displays an inline `🟡 Support Pending` chip next to the account number on the affected account row with 1-click trigger to open the drawer.
     - Added `Sync Support` action item directly in the row's 3-dots `Actions` dropdown menu.

---

## 3. Verification & Compliance
- **TypeScript**: `npx tsc --noEmit` &rarr; 0 errors.
- **ESLint**: `npm run lint` &rarr; 0 errors (604 pre-existing warnings in scripts/proxies).
- **Automated Tests**: `npx vitest run` &rarr; 62 test files passed (366 unit tests passed, 1 skipped).
- **Breek Design System**: Fully adheres to English-only UI, `<Button>`, `<DropdownMenu>`, `rounded-xl`, Lucide icons, 2x2 matrix cards.

---

## 4. Verification Results

| Check | Command | Result |
|---|---|---|
| **TypeScript Type Check** | `npx tsc --noEmit` | **0 errors** (Exit code 0) |
| **ESLint Check** | `npm run lint` | **0 errors** (596 pre-existing warnings) |
| **Unit Test Suite** | `npx vitest run` | **61 test files passed, 361 unit tests passed** |
| **Persist Guarantee** | `node prisma/_test_persist_false.cjs` | **0 writes on view** |
| **Live Behavior Engine** | `node prisma/_verify_behavior.cjs` | **Verified against live DB** |
| **Design System Audit** | Manual code audit | **100% compliant with Breek UI Guide** |

---

## 5. Admin Unified Sync Console (`admin/ib/sync-requests`)
- **Problem Solved**:
  - The previous `admin/ib/sync-requests` page was fragmented into 2 separate tabs (`Support Tickets (Manual Sync)` rendering cards vs `Cloud Sync Jobs (Worker Telemetry)` rendering a table), duplicating filters and cluttering the admin interface.
- **Architectural & UI Upgrades**:
  1. **Consolidated Backend Server Action (`src/actions/admin-sync-requests.ts`)**:
     - Extended `SyncRequestFilterParams` with `type: "ALL" | "CLOUD" | "SUPPORT"`.
     - Standardized `UnifiedSyncItem` combining both `Mt5ImportJob` and `SupportSyncTicket`.
     - Aggregated stats across both sources: `totalAll`, `completedCount`, `failedCount`, `queueCount`, `cloudTotal`, `supportTotal`, `successRate`.
     - Added hard deletion support for both job records and tickets in `deleteSyncJobAdmin`.
  2. **Unified Filter Toolbar (`SyncFilterToolbar.tsx`)**:
     - Added Type Dropdown menu (`All Types`, `Cloud Sync (Worker)`, `Support Tickets (Manual)`) directly adjacent to Range filter.
     - Consolidated Status Tabs into 4 unified buckets: `All Requests`, `In Queue / Pending`, `Completed / Verified`, `Failed`.
  3. **Slide-over Drawer for Support Tickets (`AdminTicketDetailDrawer.tsx`)**:
     - Built using Radix UI `Sheet` (`side="right"`).
     - Displays trader profile, Telegram direct link, 2x2 Matrix Specs card (`grid-cols-2 divide-x/y`), user notes, and Investor Password box with 1-click Copy Passview & Copy All.
     - Integrated `Mark Synced` resolution and `Mark Failed` dialog with required failure reason.
  4. **Single Unified Table (`client.tsx`)**:
     - Replaced the split view tabs with 1 master table displaying 7 columns: `Trader / User`, `Type` (Cyan `Cloud Sync` vs Amber `Support Ticket`), `MT5 Account & Server`, `Telemetry / Notes`, `Status` (pulsing dot + badge), `Requested` (relative time), and `Actions`.
     - Row clicking or clicking "Inspect & Resolve" opens the `AdminTicketDetailDrawer`.
  5. **Cleaned Up Obsolete Code**:
     - Deleted `src/app/admin/ib/sync-requests/SupportTicketsTab.tsx`.
  6. **Bulk Selection & Hard Deletion (`client.tsx` & `admin-sync-requests.ts`)**:
     - Added `deleteBulkSyncRequestsAdmin` running an atomic Prisma `$transaction` across both `mt5ImportJob` and `supportSyncTicket`.
     - Checkbox column with Select All / Deselect All support.
     - Dynamic Bulk Action banner appearing above the table when items are selected.
     - Bulk Delete Confirmation modal detailing the number of requests to be permanently removed.

---

## 6. Documentation & Specs Updated

- `docs/features/admin-user-data-coverage-plan.md` -> `> **Trạng thái:** Đã dev`
- `docs/features/admin-user-behavior-segmentation-plan.md` -> `> **Trạng thái:** Đã dev`
- `docs/features/admin-user-narrative-summary-plan.md` -> `> **Trạng thái:** Đã dev`
- `docs/features/admin-revenue-pipeline-plan.md` -> `> **Trạng thái:** Đã dev`
- `docs/features/admin-sync-cloud-support-plan.md` -> `> **Trạng thái:** Đã dev`
- `docs/FEATURE_SPECS.md` -> Added `## Admin Routes & Operations Console` section with full specs for `/admin/users/behavior`, `/admin/users/[id]`, `/admin/trading-systems/brokers`, and `/admin/ib/sync-requests`.
