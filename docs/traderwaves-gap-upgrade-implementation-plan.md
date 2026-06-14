# TraderWaves Gap Upgrade Implementation Plan

Date: 2026-06-14
Owner: Product / Engineering
Purpose: Turn the strongest remaining competitor-research gaps into TheNextTrade-native features without rebuilding what already works.

## Executive Summary

TheNextTrade is already much stronger than before in onboarding, homepage positioning, MT5 sync setup, weekly coach reports, metric explanations, and first-session activation.

The remaining high-value gaps are not "more dashboards." They are:

1. Sync Health Center
2. Privacy Mode for public sharing
3. Pre-trade / open-trade journal lifecycle
4. Trading Rulebook plus behavior goals

The key principle:

> Keep TheNextTrade focused on "Track trades, understand behavior, improve the next decision." Do not copy TraderWaves feature-for-feature.

This plan assumes the current codebase already has:

- TNT Connect and EA Sync
- Account Hub
- First Session Wizard
- First Insight
- Weekly Coach / action plan
- Public Trader Card
- Journal templates
- Strategy rules
- Account-level protection rules
- Admin activation/reporting foundation

The work below upgrades those foundations into clearer product systems.

## Current Baseline

### Existing Sync Foundation

Already available:

- `src/lib/sync-health.ts`
- `src/components/trading-accounts/SyncHealthBadge.tsx`
- `src/components/trading-accounts/SyncTroubleshootingPanel.tsx`
- `src/components/trading-accounts/TradeSyncWizard.tsx`
- `src/app/api/sync/status/route.ts`
- `TradingAccount.lastHeartbeat`
- `TradingAccount.appLastHeartbeat`
- `TradingAccount.lastSync`
- `TradingAccount.totalTrades`
- `TradingAccount.syncSource`
- `SyncHistory`
- `ImportHistory`
- Admin stale-sync reporting in `src/lib/admin/reports/*`

Current weakness:

- Sync state is scattered across Account Hub, setup wizard, dashboard nudges, and admin reports.
- `syncSource` naming is inconsistent:
  - `computeSyncHealth` expects `TNT_CONNECT`, `EA`, `MANUAL`.
  - `AccountCard` checks `APP`, `EA_SYNC`, `EA_HISTORY`.
  - `/api/sync/status` checks `TNT` and `EA`.
- Users still need a single place that says:
  - Is my sync healthy?
  - What broke?
  - What should I do next?

### Existing Privacy / Public Sharing Foundation

Already available:

- Public trader route: `src/app/trader/[username]/page.tsx`
- Public profile card: `src/components/profile/PublicProfileCard.tsx`
- Public profile query: `src/lib/profile-queries.ts`
- OG route: `src/app/api/og/trader/[username]/route.tsx`
- Profile privacy fields:
  - `Profile.isPublicProfile`
  - `Profile.showBadges`
  - `Profile.showPairStats`
  - `Profile.showSessionStats`
  - `Profile.showTradeScore`
  - `Profile.showMoney`
  - `Profile.showBroker`
  - `Profile.showAccountNumber`
  - `Profile.showRealName`
  - `Profile.showPercentMetrics`
- Trade share fields:
  - `JournalEntry.shareMode`
  - `JournalEntry.shareDescription`
- Trade share components:
  - `src/components/journal/ShareTradeModal.tsx`
  - `src/components/journal/TradeShareCard.tsx`

Current weakness:

- Privacy exists as low-level toggles, but not as a clear user-facing "privacy mode."
- Public sharing should be safer by default.
- The user should see a preview before making the card public.
- Trade share privacy and public profile privacy should feel like one system.

### Existing Journal Lifecycle Foundation

Already available:

- Journal route: `/dashboard/journal`
- Manual journal form: `src/components/journal/JournalForm.tsx`
- Journal templates: `src/components/journal/JournalTemplateSelector.tsx`
- Existing templates:
  - `pre_trade`
  - `post_trade`
  - `daily_review`
  - `weekly_review`
- `JournalEntry.status` supports:
  - `OPEN`
  - `CLOSED`
- `JournalEntry` already stores:
  - `entryReason`
  - `exitReason`
  - `emotionBefore`
  - `emotionAfter`
  - `confidenceLevel`
  - `followedPlan`
  - `notesPsychology`
  - `mistakes`
  - `images`
  - `tags`
  - `strategy`

Current weakness:

- The UI still behaves mostly like "log a trade" instead of "plan, execute, close, review."
- Pre-trade templates exist, but there is no strong product lifecycle.
- Imported/synced trades are not reconciled against a pre-trade plan.
- Users cannot easily compare:
  - what they planned
  - what happened
  - what they learned

### Existing Rulebook / Goals Foundation

Already available:

- Strategy rules:
  - `Strategy.rules`
  - `src/components/strategies/StrategyModal.tsx`
- Account protection rules:
  - `TradingAccount.maxDailyLoss`
  - `TradingAccount.maxDailyTrades`
  - `TradingAccount.maxRiskPercent`
  - `TradingAccount.cooldownAfterLosses`
- Rule actions:
  - `src/actions/trading-rules.ts`
  - `src/actions/rule-violations.ts`
- Dashboard warning:
  - `src/components/dashboard/TradingAlertBanner.tsx`
- Coach signals already detect:
  - low plan compliance
  - loss streak
  - SL cluster
  - revenge size-up
  - recurring mistake
- Onboarding stores trading goal:
  - `User.settings.onboarding.tradingGoal`
- Goal-based lesson recommendations:
  - `src/lib/coach/goal-content-map.ts`
  - `src/lib/coach/lesson-recommendations.server.ts`

Current weakness:

- Rules are split across strategy free text and account-level protection settings.
- There is no structured personal rulebook.
- Rules are not attached to each trade as followed/broken/skipped.
- Goals are not visible as progress targets after onboarding.
- Weekly report can recommend action, but it does not yet show "which rules you broke most" as a primary loop.

## Product Direction

Build a stronger improvement loop:

1. User connects or logs trades.
2. System shows sync health and first insight.
3. User plans trades with rules and goals.
4. User reviews trades against the original plan.
5. Weekly Coach summarizes leaks, rules broken, and next actions.
6. Public sharing is safe and privacy-first.

Do not build:

- CSV import as a main MT5 workflow.
- Native mobile app in this scope.
- Extra broker integrations in this scope.
- Complex drag-and-drop dashboard builder.
- Noisy notification system.

## Feature 1: Sync Health Center

### Goal

Give every user one clear place to understand sync status, diagnose issues, and take the next recovery action.

### Current State To Reuse

Reuse:

- `src/lib/sync-health.ts`
- `SyncHealthBadge`
- `SyncTroubleshootingPanel`
- `TradeSyncWizard`
- `/api/sync/status`
- Account Hub cards
- Admin stale-sync reports

### Required Upgrade

Create a unified Sync Health system that powers:

- Account Hub health overview
- Account card health badges
- Sync setup verification
- Dashboard stale-sync nudges
- Admin reporting

### Data / API Changes

Add canonical sync source helper:

- New file: `src/lib/sync/sync-source.ts`

Required exports:

```ts
export type CanonicalSyncSource =
  | "TNT_CONNECT"
  | "EA_SYNC"
  | "MANUAL"
  | "UNKNOWN";

export function normalizeSyncSource(value: string | null | undefined): CanonicalSyncSource;
export function getSyncSourceLabel(source: CanonicalSyncSource): string;
export function isAutoSyncSource(source: CanonicalSyncSource): boolean;
```

Normalize these legacy/current values:

- `APP` -> `TNT_CONNECT`
- `TNT` -> `TNT_CONNECT`
- `TNT_CONNECT` -> `TNT_CONNECT`
- `EA` -> `EA_SYNC`
- `EA_SYNC` -> `EA_SYNC`
- `EA_HISTORY` -> `EA_SYNC`
- `MANUAL` -> `MANUAL`

Update these files to use the helper:

- `src/lib/sync-health.ts`
- `src/components/trading-accounts/AccountCard.tsx`
- `src/app/api/sync/status/route.ts`
- `src/components/trading-accounts/TradeSyncWizard.tsx`
- Any sync endpoint that writes `TradingAccount.syncSource`

Add user-facing API:

- New route: `src/app/api/sync/health/route.ts`

Response shape:

```ts
{
  accounts: Array<{
    accountId: string;
    accountNumber: string | null;
    broker: string | null;
    name: string;
    source: "TNT_CONNECT" | "EA_SYNC" | "MANUAL" | "UNKNOWN";
    health: SyncHealth;
    lastSyncHistory: {
      tradesReceived: number;
      tradesImported: number;
      tradesSkipped: number;
      createdAt: string;
    } | null;
    nextAction: {
      label: string;
      href?: string;
      action?: "open_sync_setup" | "sync_first_trades" | "reconnect" | "contact_support";
    };
  }>;
  summary: {
    totalAccounts: number;
    healthy: number;
    needsAttention: number;
    neverSynced: number;
    stale: number;
    disconnected: number;
  };
}
```

Optional DB migration, only if current error visibility is insufficient:

- Extend `SyncHistory`:

```prisma
source       String? @db.VarChar(30)
status       String  @default("SUCCESS") @db.VarChar(20)
errorCode    String? @map("error_code") @db.VarChar(80)
errorMessage String? @map("error_message")
completedAt  DateTime? @map("completed_at") @db.Timestamptz(6)
```

If adding this migration, update:

- `/api/sync/trades`
- `/api/ea/trades`
- `/api/ea/history`
- TNT Connect sync endpoint writer

### UI Changes

Add component group:

- `src/components/trading-accounts/SyncHealthCenter.tsx`
- `src/components/trading-accounts/SyncHealthSummaryCard.tsx`
- `src/components/trading-accounts/SyncHealthAccountRow.tsx`
- `src/components/trading-accounts/SyncRecoveryAction.tsx`

Where it appears:

1. `/dashboard/accounts`
   - Add a compact "Sync Health" block above account cards or inside existing Account Hub header area.
   - It should show:
     - `All synced`
     - `Needs attention`
     - `Never synced`
     - `Last sync`
   - Include button: `Review Sync Health`.

2. `/dashboard/accounts?health=sync`
   - Open Sync Health Center modal or drawer.
   - Do not create a heavy new page unless the UI becomes too large.

3. Account cards
   - Keep current compact sync method label.
   - Add health-specific microcopy only when there is a problem.
   - Avoid showing duplicate states like "Disconnected" plus "Not connected" plus "No trades yet."

4. `/dashboard/settings/tnt-connect`
   - Show API key plus account health list.
   - Make this page the place to regenerate key and inspect connected accounts.

### User Copy Rules

Use direct status language:

- Healthy: `Connected`
- Never synced: `No trades synced yet`
- Stale: `Sync is stale`
- Disconnected: `Reconnect required`
- Missing data: `Sync completed but no trades imported`
- Manual: `Manual journal`

Every non-healthy status must have one primary action.

### QA Checklist

- Account with TNT heartbeat and trades shows `Connected`.
- Account with EA heartbeat and trades shows `Connected`.
- Account with zero trades but recent heartbeat shows `No trades synced yet`.
- Account with no heartbeat shows `Reconnect required`.
- Account with old heartbeat shows `Sync is stale`.
- Manual account shows `Manual journal`, not an error.
- `/api/sync/health` returns no 500 for users with zero accounts.
- `syncSource` labels are consistent across Account Hub, wizard, and settings.
- Mobile Account Hub has no horizontal overflow.
- Existing active users with trade data are not interrupted by new sync banners.

## Feature 2: Privacy Mode For Public Sharing

### Goal

Make public sharing safe by default and easy to understand.

Users should be able to share progress without exposing:

- real name
- broker
- account number
- account balance
- raw money values

### Current State To Reuse

Reuse existing `Profile` fields:

- `isPublicProfile`
- `showMoney`
- `showBroker`
- `showAccountNumber`
- `showRealName`
- `showPercentMetrics`
- `showTradeScore`
- `showBadges`
- `showPairStats`
- `showSessionStats`

Reuse:

- `src/components/profile/PublicProfileCard.tsx`
- `src/lib/profile-queries.ts`
- `src/app/trader/[username]/page.tsx`
- `src/app/api/og/trader/[username]/route.tsx`
- `src/app/dashboard/settings/profile/ProfileClient.tsx`
- `src/components/journal/ShareTradeModal.tsx`
- `src/components/journal/TradeShareCard.tsx`

### Required Upgrade

Add privacy presets and preview, using existing fields first.

Recommended presets:

| Preset | Purpose | Settings |
| --- | --- | --- |
| `Private` | Public card disabled | `isPublicProfile=false` |
| `Safe Public` | Default public mode | Hide money, broker, account number, real name. Show percent metrics, score, badges. |
| `Performance Only` | Strong privacy | Hide money and broker. Show win rate, trade score, top pairs, badges. |
| `Full Public` | User explicitly opts in | User can show real name, broker, money, and account number if desired. |

Implementation approach:

- No migration required for V1.
- Store preset in `User.settings.publicProfile.privacyPreset` for convenience.
- Keep existing `Profile` booleans as the actual enforcement layer.

Add helper:

- New file: `src/lib/profile-privacy.ts`

Required exports:

```ts
export type PublicPrivacyPreset =
  | "PRIVATE"
  | "SAFE_PUBLIC"
  | "PERFORMANCE_ONLY"
  | "FULL_PUBLIC";

export function applyPrivacyPreset(preset: PublicPrivacyPreset): Partial<ProfilePrivacyFields>;
export function sanitizePublicProfileData(data: PublicProfileData): PublicProfileData;
export function canExposeSensitiveProfileField(profile: Profile, field: string): boolean;
```

### UI Changes

Update `/dashboard/settings/profile`:

- Add `Public Sharing` section.
- Add preset segmented control:
  - Private
  - Safe Public
  - Performance Only
  - Full Public
- Add live preview:
  - `Preview my public card`
  - preview should use the same `PublicProfileCard` data shape.
- Keep advanced toggles collapsed under:
  - `Advanced privacy controls`

Update `/trader/[username]`:

- Enforce privacy through `getPublicProfileData`.
- If profile is not public, show clean not-found or private state.
- Never expose hidden broker/account/money through HTML, metadata, JSON, or OG image.

Update `/api/og/trader/[username]`:

- Apply the same privacy rules.
- If profile is private, return a generic private image or 404.

Update trade sharing:

- In `ShareTradeModal`, default to privacy-safe mode.
- Add share modes:
  - `private_summary`: no money, no broker, no account number
  - `percent_only`: percentages and setup only
  - `full`: explicit opt-in
- `TradeShareCard` must respect `JournalEntry.shareMode`.

### User Copy Rules

Use simple copy:

- `Safe Public: Share progress without exposing account size or broker details.`
- `Performance Only: Show percentages and scores, not money.`
- `Full Public: You choose to reveal more details. Use carefully.`

### QA Checklist

- Private profile cannot be viewed at `/trader/[username]`.
- Safe Public hides:
  - real name
  - money
  - broker
  - account number
- Performance Only shows percent metrics and no dollar values.
- Full Public only exposes sensitive details after explicit save.
- OG route respects privacy.
- Public card top pairs still show only top 3.
- Share button copies the correct public URL.
- Mobile profile settings preview is not clipped.
- No hidden sensitive fields appear in page source or API response.

## Feature 3: Pre-Trade / Open-Trade Journal Lifecycle

### Goal

Turn the journal from "record what happened" into "plan, execute, close, review."

This is one of the most behavior-improving upgrades because it reduces hindsight bias.

### Current State To Reuse

Reuse:

- `/dashboard/journal`
- `JournalForm`
- `JournalTemplateSelector`
- `JournalEntry.status = OPEN/CLOSED`
- `entryReason`
- `exitReason`
- `emotionBefore`
- `emotionAfter`
- `confidenceLevel`
- `followedPlan`
- `notesPsychology`
- `mistakes`
- `images`
- `tags`
- `strategy`
- `TradingViewMiniChart`
- `TradeDetailSheet`

### Recommended Architecture

Do not overload `JournalEntry` too much.

Add a new model for pre-trade planning:

```prisma
model TradePlan {
  id              String    @id @default(cuid())
  userId          String    @db.Uuid
  accountId       String?
  journalEntryId  String?   @unique

  symbol          String    @db.VarChar(30)
  type            TradeType?
  plannedEntry    Float?
  plannedStopLoss Float?
  plannedTakeProfit Float?
  plannedLotSize  Float?
  riskAmount      Float?
  setupName       String?   @db.VarChar(120)

  thesis          String?
  invalidation    String?
  emotionBefore   String?   @db.VarChar(50)
  confidenceLevel Int?
  ruleChecklist   Json?
  tags            String[]  @default([])
  images          String[]  @default([])

  status          String    @default("PLANNED") @db.VarChar(30)
  plannedAt       DateTime  @default(now()) @db.Timestamptz(6)
  openedAt        DateTime? @db.Timestamptz(6)
  cancelledAt     DateTime? @db.Timestamptz(6)
  reviewedAt      DateTime? @db.Timestamptz(6)
  createdAt       DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt       DateTime  @updatedAt @db.Timestamptz(6)

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  account         TradingAccount? @relation(fields: [accountId], references: [id])
  journalEntry    JournalEntry?   @relation(fields: [journalEntryId], references: [id])

  @@index([userId, status])
  @@index([userId, accountId, plannedAt])
  @@index([userId, symbol, plannedAt])
  @@map("trade_plans")
}
```

Why a new model:

- Keeps imported/synced `JournalEntry` stable.
- Lets users plan before a broker trade exists.
- Lets the app reconcile a synced closed trade to the original plan.
- Avoids breaking existing journal table filters.

### Required UI Changes

Update `/dashboard/journal`:

- Add tabs:
  - `Trades`
  - `Plans`
  - `Open`
  - `Reviews`
- `Trades` keeps the current Journal list.
- `Plans` shows `TradePlan` records with status `PLANNED`.
- `Open` shows:
  - `TradePlan.status = ACTIVE`
  - optionally `JournalEntry.status = OPEN`
- `Reviews` shows closed trades that still need review.

Add components:

- `src/components/journal/TradePlanModal.tsx`
- `src/components/journal/TradePlanCard.tsx`
- `src/components/journal/TradePlanList.tsx`
- `src/components/journal/PlanVsActualPanel.tsx`
- `src/components/journal/ReviewPromptCard.tsx`

Actions/API:

- `src/actions/trade-plans.ts`
- `src/app/api/trade-plans/route.ts`
- `src/app/api/trade-plans/[id]/route.ts`
- `src/app/api/trade-plans/[id]/link-trade/route.ts`

### Lifecycle States

| State | Meaning | User action |
| --- | --- | --- |
| `PLANNED` | User wrote a plan before entry | Mark active, cancel, edit |
| `ACTIVE` | Trade is running or user is monitoring setup | Link to open trade or wait |
| `MATCHED` | Plan is linked to a synced/manual trade | Review actual vs plan |
| `REVIEWED` | User completed post-trade review | Done |
| `CANCELLED` | User did not take trade | Store why |

### Sync Reconciliation

When new synced trades arrive:

1. Find unmatched `TradePlan` records for same user/account.
2. Match by:
   - symbol
   - type
   - plannedAt within configurable time window
   - plannedEntry close to actual entry, if available
3. If one strong match exists:
   - set `TradePlan.journalEntryId`
   - set `TradePlan.status = MATCHED`
4. If multiple possible matches:
   - show `Possible plan match` in Journal detail.
   - user manually links.

Do not auto-match if confidence is low.

### Review Experience

When a trade has a linked plan:

- Show `Plan vs Actual` in `TradeDetailSheet`.
- Show:
  - Planned entry vs actual entry
  - Planned SL/TP vs synced SL/TP
  - Planned risk vs actual result
  - Emotion before vs emotion after
  - Rules committed vs rules followed
- Ask:
  - `Did you follow the plan?`
  - `What changed during execution?`
  - `What should you repeat or avoid next time?`

### QA Checklist

- Create a pre-trade plan without a broker trade.
- Mark plan as active.
- Cancel plan and store reason.
- Create manual trade from plan.
- Sync a trade and link it to a plan.
- Ambiguous sync match does not auto-link.
- Linked trade shows Plan vs Actual panel.
- Reviewed trade no longer appears in "Needs Review."
- Mobile journal plan creation is usable.
- Existing imported trades still render normally.
- No regression to `/dashboard/journal?from=&to=&accountId=`.

## Feature 4: Trading Rulebook Plus Behavior Goals

### Goal

Make discipline measurable.

Users should not only write notes. They should define rules, check trades against them, and see which rules are helping or leaking.

### Current State To Reuse

Reuse:

- `Strategy.rules`
- `TradingAccount.maxDailyLoss`
- `TradingAccount.maxDailyTrades`
- `TradingAccount.maxRiskPercent`
- `TradingAccount.cooldownAfterLosses`
- `getRuleViolations`
- `TradingAlertBanner`
- `TraderSignal`
- `CoachActionPlan`
- `Weekly Coach`
- `goal-content-map`
- onboarding `tradingGoal`
- `JournalEntry.followedPlan`
- `JournalEntry.mistakes`
- `JournalEntry.tags`

### Required Upgrade

Add a structured Rulebook and behavior goal layer.

This should not replace strategy rules. It should unify them into a clearer system.

### Data Model

Add:

```prisma
model TradingRule {
  id          String   @id @default(cuid())
  userId      String   @db.Uuid
  accountId   String?
  strategyId  String?  @db.Uuid

  title       String   @db.VarChar(140)
  description String?
  category    String   @db.VarChar(40) // RISK, ENTRY, EXIT, PSYCHOLOGY, SESSION, MANAGEMENT
  severity    String   @default("MEDIUM") @db.VarChar(20)
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)

  createdAt   DateTime @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @db.Timestamptz(6)

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  account     TradingAccount? @relation(fields: [accountId], references: [id])
  strategy    Strategy? @relation(fields: [strategyId], references: [id])
  checks      TradeRuleCheck[]

  @@index([userId, isActive])
  @@index([userId, accountId])
  @@index([userId, strategyId])
  @@map("trading_rules")
}

model TradeRuleCheck {
  id             String   @id @default(cuid())
  userId         String   @db.Uuid
  journalEntryId String
  tradingRuleId  String
  status         String   @db.VarChar(20) // FOLLOWED, BROKEN, SKIPPED
  note           String?
  checkedAt      DateTime @default(now()) @db.Timestamptz(6)

  user           User @relation(fields: [userId], references: [id], onDelete: Cascade)
  journalEntry   JournalEntry @relation(fields: [journalEntryId], references: [id], onDelete: Cascade)
  tradingRule    TradingRule @relation(fields: [tradingRuleId], references: [id], onDelete: Cascade)

  @@unique([journalEntryId, tradingRuleId])
  @@index([userId, status])
  @@index([tradingRuleId, status])
  @@map("trade_rule_checks")
}

model TraderGoal {
  id          String   @id @default(cuid())
  userId      String   @db.Uuid
  accountId   String?

  title       String   @db.VarChar(140)
  type        String   @db.VarChar(40) // JOURNAL_COUNT, REVIEW_LOSSES, CHECK_RULES, STOP_AFTER_LOSSES, STUDY, CUSTOM
  period      String   @db.VarChar(20) // DAILY, WEEKLY, MONTHLY
  targetValue Int?
  metadata    Json?
  status      String   @default("ACTIVE") @db.VarChar(20)

  startsAt    DateTime @default(now()) @db.Timestamptz(6)
  endsAt      DateTime?
  createdAt   DateTime @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @db.Timestamptz(6)

  user        User @relation(fields: [userId], references: [id], onDelete: Cascade)
  account     TradingAccount? @relation(fields: [accountId], references: [id])

  @@index([userId, status])
  @@index([userId, period, startsAt])
  @@map("trader_goals")
}
```

### UI Routes

Add route:

- `/dashboard/rules`

Navigation:

- Add under Execution or Review section.
- Also link from:
  - `/dashboard/strategies`
  - Journal form
  - Account Settings
  - Weekly Report

Page tabs:

- `Rulebook`
- `Goals`
- `Compliance`

### Rulebook UI

Components:

- `src/components/rules/RulebookClient.tsx`
- `src/components/rules/TradingRuleCard.tsx`
- `src/components/rules/TradingRuleModal.tsx`
- `src/components/rules/RuleCategoryTabs.tsx`
- `src/components/rules/RuleComplianceSummary.tsx`
- `src/components/rules/GoalCard.tsx`
- `src/components/rules/GoalModal.tsx`

Default starter rules:

- Risk:
  - `Risk max 1-2% per trade`
  - `Stop after 2 consecutive losses`
- Entry:
  - `Only trade confirmed setup`
  - `No trade during high-impact news unless planned`
- Psychology:
  - `No revenge entry after a loss`
  - `Do not increase lot size after a loss`
- Review:
  - `Review every losing trade`
  - `Tag mistake before closing the day`

### Journal Integration

In `JournalForm` and `TradeDetailSheet`:

- Show active rules checklist.
- Filter rules by:
  - global rules
  - selected account
  - selected strategy
- Save rule check statuses:
  - followed
  - broken
  - skipped
- If user marks `followedPlan=false`, prompt:
  - `Which rule was broken?`

### Goals UI

Goals should be behavior-first, not profit-first.

Recommended goal types:

- `Journal 5 trades this week`
- `Review every losing trade`
- `Complete 1 weekly review`
- `Do daily check-in 5 days`
- `Stop after 2 losses`
- `Complete 1 lesson tied to current leak`

Goal progress can be computed from existing data:

- `JournalEntry`
- `TradingReport`
- `UserProgress`
- `UserMissionProgress`
- `checkInHistory`
- `TradeRuleCheck`

Avoid storing progress snapshots in V1 unless needed for performance.

### Weekly Coach Integration

Update:

- `src/lib/coach/weekly-action-plan.server.ts`
- `src/lib/coach/signal-engine.server.ts`
- `src/components/reports/*`

Weekly report should include:

- Top broken rule
- Most followed rule
- Goal progress
- One next rule to focus on
- Lesson/article recommendation tied to broken rule

Example output:

```text
Biggest leak: You broke "Stop after 2 losses" on 3 days this week.
Next action: Set a hard 4-hour cooldown after the second loss.
Study: Trading Rules Every Trader Needs
```

### Admin Integration

Update `/admin/reports` later, not required for V1 release:

- Show adoption:
  - users with at least one rule
  - users with active goals
  - users checking rules on trades
- Show stuck users:
  - account connected but no rulebook
  - many losses but no rule checks

### QA Checklist

- Create global rule.
- Create account-specific rule.
- Create strategy-specific rule.
- Edit/deactivate rule.
- Journal form shows relevant active rules.
- Save trade with followed/broken/skipped rule checks.
- Trade detail shows saved rule checks.
- Weekly report includes top broken rule when rule data exists.
- Goals compute progress correctly.
- User with no rules gets a clear starter empty state.
- Existing users with no rules do not see scary warnings.
- Mobile rule checklist remains tappable.

## Implementation Order

### Phase 0: Safety Audit

Tasks:

- Confirm current `syncSource` values in database.
- Confirm existing public profile privacy fields are present in all environments.
- Confirm `JournalEntry` API accepts `OPEN` trades safely.
- Confirm current rule fields on `TradingAccount` are migrated in production.

Verification:

- `npm run type-check`
- Prisma generate/migrate dry run.
- Local DB query for distinct `TradingAccount.syncSource`.

### Phase 1: Sync Health Center

Why first:

- It reduces support load immediately.
- It is tightly connected to onboarding and first value.
- It is lower risk than trade lifecycle schema.

Done when:

- User can open Sync Health from Account Hub.
- All account sync statuses use the same labels.
- Every non-healthy state has one clear next action.

### Phase 2: Privacy Mode

Why second:

- Public sharing is already live.
- Current flags exist, so this is mostly UX and enforcement.
- Safer public sharing helps leaderboard/profile growth.

Done when:

- User can choose privacy preset.
- Public card and OG image respect it.
- Trade share cards default to safe mode.

### Phase 3: Rulebook Plus Goals

Why third:

- Existing rules are scattered.
- Rulebook gives Weekly Coach better data.
- Goals deepen retention without adding sync complexity.

Done when:

- User can define rules and goals.
- Journal entries can be checked against rules.
- Weekly Coach can summarize rule compliance.

### Phase 4: Pre-Trade / Open-Trade Journal Lifecycle

Why fourth:

- Highest product value, but largest workflow change.
- Should build on Rulebook so pre-trade plans can include rule checklist.

Done when:

- User can create a plan before entry.
- User can link plan to actual synced/manual trade.
- User can compare plan vs actual in review.

## Release Strategy

Release behind feature flags if possible:

```env
NEXT_PUBLIC_ENABLE_SYNC_HEALTH_CENTER=true
NEXT_PUBLIC_ENABLE_PRIVACY_PRESETS=true
NEXT_PUBLIC_ENABLE_RULEBOOK_GOALS=true
NEXT_PUBLIC_ENABLE_TRADE_PLANS=true
```

If feature flags do not exist, keep rollout conservative:

- Sync Health and Privacy Mode can ship broadly.
- Rulebook and Trade Plans can start as opt-in beta UI.

## Test Plan

### Required Commands

```bash
npm run type-check
npm run lint
npm test
npx playwright test
```

If the repo does not have full tests for a feature, add targeted tests rather than relying only on manual QA.

### Unit Tests

Add tests for:

- `normalizeSyncSource`
- `computeSyncHealth`
- `applyPrivacyPreset`
- `sanitizePublicProfileData`
- trade plan matching logic
- rule compliance aggregation
- goal progress computation

### Playwright Routes

Test these routes:

- `/dashboard/accounts`
- `/dashboard/accounts?health=sync`
- `/dashboard/settings/profile`
- `/trader/{username}`
- `/api/og/trader/{username}`
- `/dashboard/journal`
- `/dashboard/journal?action=log-trade`
- `/dashboard/rules`
- `/dashboard/reports/weekly`
- `/admin/reports`

### Regression States

Use at least these users:

1. Fresh user, no account, no trades.
2. User with account but no sync.
3. User with TNT account and trades.
4. User with EA account and trades.
5. User with stale/disconnected account.
6. User with public profile enabled.
7. User with public profile disabled.
8. User with rules and goals.
9. User with no rules and no goals.

## Documentation Updates

Update after implementation:

- `docs/PRODUCT.md`
- `docs/FEATURE_SPECS.md`
- `docs/SYSTEM.md`

Add route specs for:

- `/dashboard/rules`
- `/dashboard/accounts?health=sync`

Update existing specs for:

- `/dashboard/accounts`
- `/dashboard/settings/profile`
- `/trader/[username]`
- `/dashboard/journal`
- `/dashboard/reports/weekly`

## Success Criteria

This project is successful when:

- Users can understand sync problems without asking admin.
- Public sharing is safe by default.
- Users can plan a trade before it becomes a result.
- Weekly Coach can say not only "you lost money," but "you broke this rule and should focus on this next."
- New features do not interrupt existing users with account/trade history.
- Mobile remains usable for journal, privacy settings, and sync health.

