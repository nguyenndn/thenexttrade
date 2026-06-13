# Trade Improvement Loop + Performance Optimization Scope

Status: Ready for implementation  
Owner intent: Improve user-facing product value while also reducing CSS/JS load cost.  
Important decision: CSV import/export is no longer a P0 product item. MT5 users should use TNT Connect or EA Sync. CSV import is only a later migration/admin fallback.

## Executive Summary

Build the next product sprint around one clear loop:

> Sync trade data -> detect the first useful insight -> guide better journaling -> let users share safely.

This scope has two tracks:

1. Product UX: make TheNextTrade feel smarter and more guided.
2. Performance: reduce CSS/JS bloat and prevent slow user-facing pages.

Do not add broad broker integrations, native mobile app, CSV-first import, or dashboard widget-builder features in this sprint.

## Source Scan Findings

Commands run:

- `npm run build` failed at `prisma generate` because Windows locked `node_modules/.prisma/client/query_engine-windows.dll.node`.
- `npx next build` succeeded.

Build result:

- Next.js: `16.2.6`
- Compile: `19.2s`
- TypeScript: `33.5s`
- Static generation: `166` pages in `2.6s`
- Most dashboard/admin routes are dynamic.

Largest generated assets found:

- `.next/static/chunks/14kr9b4r~ttdi.css`: `471,784 bytes`
- `.next/static/media/icon...png`: `539,140 bytes`
- `.next/static/media/apple-icon...png`: `539,140 bytes`
- Multiple JS chunks: `464KB`, `449KB`, `324KB`, `252KB`, `231KB`, `220KB`

Heavy dependency usage found:

- `lucide-react`: `393` import locations
- `recharts`: `34` files
- `framer-motion`: `28` files
- `@dnd-kit`: `8` files
- `canvas-confetti`: `7` files
- `html-to-image`: `5` files
- `@tiptap`: `2` files
- `react-date-range`: `1` file
- `react-day-picker`: `1` file
- `lightweight-charts`: `1` file
- `react-simple-maps`: `1` file

Runtime/client-side risk:

- `214` `useEffect` occurrences found.
- `183` `fetch()` occurrences found.
- Several large client files perform multiple client fetches:
  - `src/components/copy-trading/CopyTradingMyAccount.tsx`
  - `src/components/admin/articles/ArticleForm.tsx`
  - `src/app/admin/analytics/page.tsx`
  - `src/app/admin/security/page.tsx`
  - `src/components/journal/JournalForm.tsx`
  - `src/components/trading-accounts/TradeSyncWizard.tsx`

Already-good patterns:

- `next.config.js` already uses `experimental.optimizePackageImports` for `lucide-react`, `recharts`, `date-fns`, `framer-motion`, `@dnd-kit`, and TipTap.
- Dashboard below-fold charts are already using `next/dynamic`.
- Homepage already lazy-loads several sections.
- Dashboard server data fetch already uses `Promise.all()` for the main query bundle.

Main risks:

- CSS bundle is too large, likely from DaisyUI + Tailwind utilities + global styling.
- Icons and PWA image assets are too large.
- Chart/editor/export libraries must never enter first-load bundles unless the route needs them.
- Some public layouts/components still fetch data on mount.
- Admin-only dependencies should never affect user-facing pages.

## Product Scope

### P0.1 Guided Journal Templates

Goal:

Make journal entry creation guided instead of blank.

User problem:

New traders often do not know what to write. They need a structure that teaches good journaling behavior.

Affected surfaces:

- `/dashboard/journal`
- `JournalEntryModal`
- `JournalForm`
- `TradeDetailSheet`
- Weekly report generation logic, if it consumes journal fields

Recommended template types:

1. Pre-trade plan
2. Post-trade review
3. Daily session review
4. Weekly review input

Data model approach:

- Avoid a large schema change for MVP.
- Reuse existing `JournalEntry` fields first:
  - `entryReason`
  - `exitReason`
  - `emotionBefore`
  - `emotionAfter`
  - `followedPlan`
  - `notes`
  - `notesPsychology`
  - `mistakes`
  - `tags`
- Add a small JSON field only if current fields cannot support template answers cleanly.

MVP UI:

- Add a segmented template selector at the top of the journal form.
- Default template should be `Post-trade review` for synced closed trades.
- If user clicks "Log manually" before sync, default to `Pre-trade plan`.
- Each template should show 4-7 focused prompts, not a long questionnaire.

Suggested prompts:

Pre-trade plan:

- What setup are you trading?
- What must happen to invalidate the idea?
- Where is stop loss?
- What emotion are you feeling before entry?
- Which rule are you committing to follow?

Post-trade review:

- Did you follow the plan?
- What was the main reason for entry?
- What was the main reason for exit?
- What emotion showed up during the trade?
- What is one lesson from this trade?

Daily review:

- What was today's best decision?
- What was today's biggest mistake?
- Did you overtrade?
- What should you repeat tomorrow?

Acceptance criteria:

- User can create/edit a journal entry with template prompts.
- Existing journal entries still render correctly.
- Synced trades can be enriched with template answers.
- No template UI appears as a blocking modal.
- Mobile layout remains usable.

Do not:

- Do not build a full custom template builder in this sprint.
- Do not force every field to be required.
- Do not turn journal into a long survey.

### P0.2 Sync Health Center

Goal:

Make every account's sync state obvious and actionable.

User problem:

When trades do not appear, users need to know whether the account is disconnected, stale, missing data, or simply has no new trades.

Affected surfaces:

- `/dashboard/accounts`
- Account card footer/status area
- Trade Sync setup modal
- TNT Connect settings page
- Dashboard new-user activation banners

Existing useful fields:

- `TradingAccount.lastSync`
- `TradingAccount.lastHeartbeat`
- `TradingAccount.appLastHeartbeat`
- `TradingAccount.totalTrades`
- `TradingAccount.syncSource`
- `TradingAccount.status`
- `TradingAccount.resyncRequest`
- `SyncHistory.tradesReceived`
- `SyncHistory.tradesImported`
- `SyncHistory.tradesSkipped`
- `SyncHistory.createdAt`

Create a shared server helper:

`src/lib/sync-health.ts`

Suggested output:

```ts
type SyncHealthStatus =
  | "healthy"
  | "no_trades_yet"
  | "stale"
  | "disconnected"
  | "missing_trade_data"
  | "sync_error"
  | "unsupported";

type SyncHealth = {
  status: SyncHealthStatus;
  label: string;
  description: string;
  source: "TNT_CONNECT" | "EA" | "MANUAL" | "UNKNOWN";
  lastHeartbeatAt: string | null;
  lastSyncAt: string | null;
  totalTrades: number;
  primaryAction: {
    label: string;
    href?: string;
    action?: "open_sync_setup" | "sync_first_trades" | "reconnect" | "view_dashboard";
  };
};
```

Status rules:

- `healthy`: heartbeat/sync is recent and account has trades.
- `no_trades_yet`: account exists but no imported trades.
- `stale`: last heartbeat/sync older than threshold.
- `disconnected`: no heartbeat and account expected to use TNT Connect or EA.
- `missing_trade_data`: sync occurred but imported count is zero or critical fields are missing.
- `unsupported`: broker/account cannot use Pro/EA path.

MVP UI:

- On each account card, show one compact health row:
  - Source: `TNT Connect` or `EA Sync`
  - Health badge
  - Last sync/heartbeat
  - Primary CTA
- Replace generic `Sync` button for empty accounts with `Sync first trades`.
- Keep `Dashboard` as secondary if trade data exists.

Acceptance criteria:

- No duplicate ONLINE/OFFLINE + Not Eligible style confusion.
- Account with no trades points user to sync first trades.
- Account with stale heartbeat shows reconnect/setup guidance.
- Sync health text is human-readable.
- Works for both TNT Connect and EA.

Do not:

- Do not create noisy alert banners for every minor sync issue.
- Do not show raw technical errors to users without a readable explanation.

### P0.3 First Insight Moment

Goal:

After the first successful sync, show one useful insight immediately.

User problem:

The first sync should feel rewarding. The user should immediately understand why the product matters.

Affected surfaces:

- `/dashboard`
- First sync success modal
- Dashboard first insight banner
- Notification system

Existing related pieces:

- `FirstSyncSuccessModal`
- `FirstSessionWizard`
- `firstSessionState.firstInsight`
- `InsightBanner`
- `WeeklyReviewEligibility`
- Dashboard data layer

Insight rules:

Only show first insight when:

- User has at least one account.
- User has imported at least one trade.
- Insight has not already been viewed/dismissed.
- Dashboard has enough data to produce a meaningful statement.

Insight priority:

1. Most traded symbol.
2. Best session by P&L.
3. Biggest loss/leak.
4. Best winning trade.
5. Missing journal data.

Example copy:

- "Your first data is in. Most of your trades are on XAUUSD."
- "London session produced most of your profit this week."
- "You have synced trades, but most are missing journal notes. Start with one review."

Data storage:

- Store viewed/dismissed state in user settings or existing onboarding state.
- Avoid localStorage-only state for core lifecycle.

Acceptance criteria:

- First sync modal is not shown again after user closes it.
- Insight has one clear action.
- The user is not hit by multiple dashboard banners at the same time.
- Weekly review banner does not appear until eligibility conditions are truly met.

Do not:

- Do not generate "No critical issues" positive alert immediately after first sync if there is not enough history.
- Do not show weekly review CTA too early.

### P0.4 Privacy Mode For Public Sharing

Goal:

Let users share public trader surfaces without exposing sensitive money/account details.

User problem:

Users want to share performance, but not account size, balance, broker, or account number.

Affected surfaces:

- `/trader/[username]`
- Public Trader Card
- Share trade modal/card
- Future report sharing
- Settings public profile tab

MVP settings:

- `showMoney`: default `false` for public pages.
- `showBroker`: default `false`.
- `showAccountNumber`: default `false`.
- `showRealName`: default `false`.
- `showPercentMetrics`: default `true`.

Where to store:

- User profile public settings JSON, or existing `Profile` fields if already present.

UI:

- Add "Public privacy" section in settings.
- Show preview: public viewer sees `ROI`, `win rate`, `score`, `top pairs`, not raw balance.
- On public card, use nickname/username.

Acceptance criteria:

- Public pages never show account number by default.
- Public pages never show balance/profit dollars unless user explicitly enables it.
- Existing public trader card still renders if settings are missing.
- Share card respects privacy settings.

Do not:

- Do not make privacy settings complicated.
- Do not expose broker/account number in metadata/OG image when hidden.

## Product Scope Not Included

Do not build these in this sprint:

- CSV import as a main user flow.
- Native mobile app.
- Extra broker/API integrations.
- Public competition platform.
- Full dashboard widget builder.
- Custom journal template builder.
- Telegram alerts.
- Open-trade matching engine.

## Performance Scope

### P0 Performance Fixes

#### 1. CSS bundle reduction

Problem:

Generated CSS chunk is approximately `471KB`.

Likely causes:

- DaisyUI generated styles.
- Tailwind utilities from broad content scanning.
- Global animations/utilities.
- Component library styles.

Actions:

- Review if DaisyUI is still necessary for user-facing pages.
- If DaisyUI remains, disable unused DaisyUI features:
  - `logs: false`
  - consider `styled: false` or `utils: false` only if safe
  - keep only required themes
- Move decorative animation CSS out of `globals.css` if only used on a few pages.
- Replace repeated custom global animations with scoped component CSS/classes.
- Ensure Tailwind content does not scan unused generated/temp folders.

Acceptance criteria:

- CSS chunk decreases measurably after build.
- No visual regression on:
  - `/`
  - `/dashboard`
  - `/dashboard/accounts`
  - `/dashboard/journal`
  - `/auth/login`
  - `/auth/signup`

#### 2. Optimize icon assets

Problem:

Generated `icon.png` and `apple-icon.png` are each around `539KB`.

Actions:

- Replace oversized PNG app icons with optimized PNG/WebP where supported.
- Ensure favicon/PWA icon dimensions are correct, not huge originals.
- Keep visual quality but target:
  - `icon-192`: under `50KB`
  - `icon-512`: under `120KB`
  - apple touch icon: under `80KB`

Acceptance criteria:

- PWA icons still render.
- Build media output no longer contains 500KB icon files.

#### 3. Lazy-load export/image/PDF libraries

Problem:

Export libraries are heavy:

- `html-to-image`
- `dom-to-image-more`
- `jspdf`
- `jspdf-autotable`
- `@react-pdf/renderer`

Actions:

- Ensure these are imported only inside click handlers or dynamically loaded modals.
- Do not import export libraries at top-level of page/client components.
- Convert patterns like `import * as htmlToImage from "html-to-image"` to inside-action dynamic imports:

```ts
const htmlToImage = await import("html-to-image");
```

High-risk files:

- `src/components/journal/ShareTradeModal.tsx`
- `src/components/academy/CertificateCard.tsx`
- `src/components/analytics/ProfitCalendar.tsx`
- `src/components/copy-trading/CopyTradingMyAccount.tsx`
- `src/components/copy-trading/CopyTradingPerformance.tsx`
- `src/lib/pdf-utils.ts`

Acceptance criteria:

- Export features still work after click.
- Initial page bundle does not include export libs unless needed.

#### 4. Defer chart libraries below fold

Problem:

`recharts` appears in `34` files. Dashboard has some dynamic imports already, but other analytics/admin/chart components may still load chart bundles too early.

Actions:

- Keep above-fold dashboard charts only if truly above fold.
- Dynamic import all below-fold Recharts components.
- For admin analytics, load chart panels only when visible/tab selected.
- Consider one shared chart wrapper that is dynamically imported.

High-risk areas:

- `src/components/admin/analytics/*`
- `src/components/analytics/*`
- `src/components/psychology/*`
- `src/components/sessions/*`
- `src/components/mistakes/*`

Acceptance criteria:

- Dashboard first content appears without waiting for all chart modules.
- Admin analytics tabs do not load every chart on initial render.

#### 5. Defer TipTap editor

Problem:

TipTap is heavy and should only load on article edit/create pages.

Actions:

- Ensure `RichTextEditor` is not imported by article list or ops pages.
- Dynamically import editor in article create/edit only.
- Keep read-only article pages free from TipTap code.

Acceptance criteria:

- Public article pages do not include editor bundle.
- Admin article editor still works.

### P1 Performance Fixes

#### 6. Reduce client-side fetch waterfalls

Problem:

There are `183` fetch calls and many client components with `useEffect` data loading.

Actions:

- Move initial data fetching to server components when possible.
- Use SWR only when data must refresh client-side.
- Deduplicate config/profile/status requests:
  - `/api/system/config`
  - `/api/profile`
  - `/api/pro-status`
  - `/api/missions/claimable-count`
- Create providers for shared data already loaded by layout.

Known candidates:

- `SystemAnnouncementBanner`
- `PublicHeader`
- `ProProvider`
- `DashboardLayoutClient`
- `Sidebar`
- `MobileBottomTabBar`

Acceptance criteria:

- Navigating dashboard should not duplicate the same API request multiple times.
- Public pages should not fetch profile/config if not needed.

#### 7. Optimize dashboard server data

Problem:

Dashboard fetches many data groups at once. It already uses `Promise.all`, but some below-fold data can be deferred.

Actions:

- Split dashboard data into:
  - critical above-fold data
  - below-fold analytics data
- Use Suspense/streaming or client-triggered lazy APIs for lower sections.
- Keep new-user zero-data path minimal.

Critical above fold:

- user/account/date
- total balance
- P&L
- win rate
- trade score
- next action / onboarding state

Below fold:

- lot distribution
- monthly chart
- day-of-week analytics
- session analytics
- best/worst trades

Acceptance criteria:

- `/dashboard` first paint is faster.
- New users do not load trade analytics they cannot use.

#### 8. Reduce global layout payload

Problem:

Root layout always includes:

- `NextTopLoader`
- `SystemAnnouncementBanner`
- `Toaster`
- `GoogleAnalytics`
- two JSON-LD blocks
- service worker registration script

Actions:

- Confirm `GoogleAnalytics` is no-op unless configured.
- Keep service worker registration idle.
- Consider making `SystemAnnouncementBanner` server-fed or cached.
- Avoid profile/auth fetches in public layout.

Acceptance criteria:

- Public pages have minimal hydration.
- Admin/dashboard-only code does not leak into public pages.

#### 9. Admin route isolation

Problem:

Admin pages include heavy components and many client pages. This is less critical for users, but can pollute shared chunks.

Actions:

- Keep admin-heavy libs inside admin route chunks.
- Dynamic import admin charts/maps/editors.
- Avoid shared exports that pull admin components into common chunks.

Acceptance criteria:

- User-facing routes do not include admin chart/editor/map code.

### P2 Performance Fixes

#### 10. Framer Motion audit

Problem:

`framer-motion` appears in `28` files.

Actions:

- Remove motion from small hover/fade effects where CSS can do the job.
- Keep Framer Motion only for complex transitions.
- Dynamic import large motion-heavy sections if below fold.

#### 11. Virtualize large tables/lists

Problem:

Admin/users/journal/trade lists can grow large.

Actions:

- Use pagination where possible.
- Add virtualization only for lists above 100 rows.

#### 12. Production measurement

Actions:

- Add Lighthouse/Web Vitals baseline for:
  - `/`
  - `/auth/login`
  - `/auth/signup`
  - `/dashboard`
  - `/dashboard/accounts`
  - `/dashboard/journal`
  - `/articles/[slug]`
- Add repeatable script/report artifact.

## Implementation Order

### Phase 1 - Product Core

1. Implement Guided Journal Templates.
2. Implement Sync Health helper and Account Hub UI.
3. Implement First Insight Moment.
4. Implement Public Privacy Mode.

### Phase 2 - Performance Critical

1. Optimize app/PWA icons.
2. Reduce DaisyUI/global CSS output.
3. Lazy-load export/PDF/image libraries.
4. Audit chart imports and dynamic-load below-fold charts.
5. Ensure TipTap editor is admin-editor-only.

### Phase 3 - Performance Data Flow

1. Deduplicate common client fetches.
2. Split dashboard data into above-fold and below-fold.
3. Cache or server-feed system config/profile/pro-status where possible.
4. Re-run build and compare assets.

### Phase 4 - Verification

Run:

```bash
npm run type-check
npx next build
npm run lint
```

Manual QA:

- `/dashboard`
- `/dashboard/accounts`
- `/dashboard/journal`
- `/trader/[username]`
- `/auth/login`
- `/auth/signup`
- `/`
- `/articles/[slug]`

Performance QA:

- Compare `.next/static/chunks` before/after.
- Confirm CSS chunk decreases.
- Confirm export libraries are not in initial chunks for journal/dashboard unless user opens export/share.
- Confirm dashboard no-data user path is fast and not loading full analytics.

## Done Criteria

Product:

- User can journal with guided templates.
- Account Hub has clear sync health and next action.
- First successful sync produces one useful insight.
- Public trader surfaces hide sensitive account/money details by default.

Performance:

- Build succeeds with `npx next build`.
- CSS chunk and largest media/icon files are reduced.
- Heavy export/editor/chart libraries are lazy-loaded.
- Duplicate common API requests are reduced.
- No visible regression on main user-facing routes.

## Notes For Developer

- Keep changes incremental and test after each phase.
- Do not refactor unrelated admin pages unless they affect shared bundles.
- Do not introduce new heavy dependencies.
- Prefer server components and server data loading where possible.
- Use dynamic imports for heavy client-only features.
- Keep mobile layouts polished; this sprint should not trade UX quality for raw speed.

