# Implementation Checklist: Admin Core Feature Suite (4 Plans)

## 1. Admin ↔ User Data Coverage Plan (GAP-1 to GAP-12)
- [x] 1.1 Control Plane & Security (GAP-11 & GAP-12): QuickActionsWidget expanded from 3 to 6 high-leverage cards; audit logging for impersonate sessions & login security verified.
- [x] 1.2 Core Trading Data Inspectors (GAP-1 & GAP-2): `UserJournalTab.tsx` with KPI cards, filters, and Trade Telemetry Inspector modal; `UserTradePlansTab.tsx` with Plan vs Actual execution inspection.
- [x] 1.3 Playbook, Rules, & Strategic Execution (GAP-3 & GAP-4): `UserRulesGoalsTab.tsx` with active rules, severity badges, trader goals, and rule check logs; Playbook strategies in `UserTradePlansTab.tsx`.
- [x] 1.4 Growth, Missions, Coach, & Experiments (GAP-5, GAP-6, GAP-7): `UserGrowthCoachTab.tsx` with Edge XP event telemetry, mission progress, 10-trade improvement sprints, and Coach weekly action checklists.
- [x] 1.5 Performance Reports, Notes, & Article Votes (GAP-8, GAP-9, GAP-10): `UserReportsNotesTab.tsx` with weekly/monthly trading reports, calendar day reflection notes, and algorithmic leak radar; Article helpful votes audit modal with purge action in `/admin/articles`.
- [x] 1.6 Unified Navigation & Tabs Wrapper: `UserDetailTabsWrapper.tsx` updated with 8 tabs, icons, and dynamic badge counts; data fetching in `src/app/admin/users/[id]/page.tsx`.

## 2. Admin User Behavior Segmentation Console (Doc #2)
- [x] 2.1 Signal Engine Extension: Added `WIN_STREAK` signal to `signal-engine.server.ts` and `signal-types.ts`; added `signalTypes` filter in `getAdminActivationSignals`.
- [x] 2.2 Shared Classification & Activity Engine: Created `src/lib/admin/behavior/types.ts`, `classify.server.ts` (`classifyUser`, `buildNarrative`, `buildChips`), and `activity.server.ts` (`computeUserTradingActivity`, `getBatchProductAdoption`, `getBatchLastActivity`).
- [x] 2.3 Segmentation Server Actions: Created `src/app/admin/users/behavior/actions.ts` with pagination, urgency sorting, filters, and `isAdminRole` authorization.
- [x] 2.4 Segmentation Client UI: Created `src/app/admin/users/behavior/client.tsx` with Tab A (Needs Attention with risk badges & direct outreach) and Tab B (Value Radar with IB tier, tempo, lot trend, stayed after loss).
- [x] 2.5 Route & Navigation: Created `src/app/admin/users/behavior/page.tsx` with `requireAdminPageAccess()`; linked "Trader Behavior" in `adminMenuItems` and `QuickActionsWidget`.

## 3. Admin User Narrative Summary (Doc #4)
- [x] 3.1 Narrative Summary Component: Created `src/components/admin/users/UserNarrativeSummary.tsx` (Server Component) with risk alerts, tempo, product adoption, and value indicator.
- [x] 3.2 On-The-Fly Computation Guarantee: Verified `persist: false` guarantee (zero DB writes on view) via test script `prisma/_test_persist_false.cjs`.
- [x] 3.3 Page Integration: Integrated `UserNarrativeSummary` into `src/app/admin/users/[id]/page.tsx` above tabs inside a graceful `try/catch`.

## 4. Admin Revenue (IB Commission) Pipeline (Doc #3)
- [x] 4.1 Schema & Migration: Added `BrokerCommissionRate` model and `ibAttribution*` fields on `TradingAccount` in `prisma/schema.prisma`; executed `prisma db push` and `prisma generate`.
- [x] 4.2 Seed Scripts: Seeded default commission rates ($17/lot for partner brokers XAUUSD, wildcard $0) and initial IB attribution data.
- [x] 4.3 Eligible Volume Filtering: Created `src/lib/admin/ib/eligible-volume.server.ts`; applied lot filtering across admin dashboard, lead actions, and IB monitor (excluding demo/paper/manual syncs).
- [x] 4.4 Accurate Revenue Computation: Upgraded `estimatedIbRevenue` in `src/lib/services/ib-snapshot.service.ts` to compute per-symbol rates and only count `ibAttribution === "CONFIRMED"`.
- [x] 4.5 IB Telemetry & UI Updates: Updated `IbTargetTrackerHero.tsx` with dynamic commission rate and Out-of-IB Active Ratio telemetry card in `src/app/admin/ib/client.tsx`.
- [x] 4.6 Commission Rates Management: Created `CommissionRatesTab.tsx` and `EABrokersTabsClient.tsx` in `src/app/admin/trading-systems/brokers/` with CRUD and audit logging.
- [x] 4.7 Account IB Attribution Badge: Created `AccountIbAttributionBadge.tsx` with interactive attribution dropdown and integrated into user detail and IB traders table.

## 5. Verification & Compliance
- [x] 5.1 Type Check: `npx tsc --noEmit` -> 0 errors.
- [x] 5.2 Linter: `npm run lint` -> 0 errors.
- [x] 5.3 Automated Tests: `npx vitest run` -> 61 test files passed, 361 unit tests passed.
- [x] 5.4 UI Guide & Standards: Breek UI Guide compliance verified (English UI, rounded-xl, <Button>, 2x2 Matrix Cards, no automatic browser testing).
- [x] 5.5 Documentation: All 4 plan documents in `docs/features/` annotated with `> **Trạng thái:** Đã dev`; `docs/FEATURE_SPECS.md` updated.

## 6. Unified Sync Console (/admin/ib/sync-requests)
- [ ] 6.1 Backend action update: Refactor `getAdminSyncRequests` to return normalized `UnifiedSyncItem[]` and compute consolidated stats across both sources.
- [ ] 6.2 Filter toolbar update: Add `Type: All / Cloud Sync / Support Ticket` dropdown to `SyncFilterToolbar.tsx`.
- [ ] 6.3 Slide-over drawer component: Create `AdminTicketDetailDrawer.tsx` with credentials inspector, 1-click copy, and resolve/fail actions.
- [ ] 6.4 Unified client UI: Refactor `client.tsx` to render a single data table with Type badges, relative time, unified status, and drawer integration; remove `SupportTicketsTab.tsx`.
- [ ] 6.5 Quality & Typecheck: Run `npx tsc --noEmit` and `npm run lint`.
