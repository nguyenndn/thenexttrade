# TheNextTrade Trading Journal Improvement Loop

**Implementation status:** Ready for development  
**Source research:** [`docs/trading-journal-competitor-gap-research-report.md`](docs/trading-journal-competitor-gap-research-report.md)  
**Product principle:** `MT5 data -> evidence -> learning -> one next action -> measurable improvement`

## Goal

Upgrade the existing TheNextTrade journal experience so it feels like one connected improvement system instead of a collection of Dashboard, Journal, Analytics, Reports, Academy, and Missions pages.

The release must help a trader answer four questions quickly:

1. What happened in my trading?
2. Why did it happen?
3. What should I learn or change?
4. What is the one action I should take next?

The implementation must preserve the current MT5-first strategy:

- TNT Connect remains the primary desktop sync path.
- EA Sync remains the advanced/VPS path.
- Manual journal remains the mobile and fallback path.
- Existing users with accounts and trade history must not see onboarding-only empty states.

## Existing Product Surface

Reuse the current architecture and routes before creating new ones.

| Capability | Existing surface | Implementation direction |
|---|---|---|
| MT5 ingestion | `/dashboard/accounts` | Keep as the source of synced-trade status and recovery. |
| EA ingestion | `/dashboard/accounts`, `/api/ea/*` | Keep as the VPS/continuous-sync path. |
| Manual journal | `/dashboard/journal` | Make it the first-class mobile fallback, not a hidden backup. |
| Rules and goals | `/dashboard/rules` | Connect rules to pre-trade checks and later compliance evidence. |
| Pre-trade plans | `/dashboard/journal?tab=plans` | Add a fast TradeCheck step without duplicating plans. |
| Analytics | `/dashboard/analytics`, `/dashboard/sessions`, `/dashboard/psychology` | Add only missing breakdowns; reuse central metric definitions. |
| Coach | `/dashboard`, `/dashboard/reports/weekly`, `/dashboard/intelligence` | Make every recommendation explainable and actionable. |
| Academy | `/academy`, `/dashboard/academy` | Recommend lessons/articles from observed weaknesses. |
| Missions | `/dashboard/missions` | Tie missions to real review behavior instead of generic points. |
| Reports | `/dashboard/reports`, `/dashboard/reports/weekly` | Add evidence, definitions, sample size, and next action. |
| Public proof | `/trader/[username]`, `/share/[id]` | Show process proof with privacy and sample-size context. |

## Non-Goals

Do not add the following in this implementation:

- Prop-firm challenge tracking or prop-firm marketing.
- Copy trading, signal selling, market calls, or guaranteed-outcome language.
- A fake backtest or simulated EA equity curve presented as proof.
- CSV-first onboarding for MT5 users.
- A broad multi-broker connector matrix.
- A second psychology product separate from `/dashboard/psychology`.
- A new page for every insight type.
- More dashboard banners without a priority/orchestration model.
- AI explanations that cannot cite authorized user data.

## Task 1: Establish The Shared Evidence And Metric Contract

**Priority:** P0  
**Owner area:** `src/lib`, existing journal/report/coach actions  
**Dependency:** Must be completed before insight, calendar, and TradeCheck work.

### 1.1 Inspect and reuse existing code

Before adding code, inspect:

- `prisma/schema.prisma` and existing trade/journal/rule/plan/report models.
- `src/lib/metrics/metric-definitions.ts`.
- `src/lib/journalUtils.ts`.
- `src/actions/journal.ts`.
- `src/actions/trade-plans.ts`.
- `src/actions/trading-rules.ts`.
- `src/actions/rule-violations.ts`.
- `src/actions/reports.ts`.
- `src/lib/reports/weekly-review-eligibility.ts`.
- `src/lib/coach/*`.

Do not create duplicate models or a second metric calculator when an equivalent model/helper already exists.

### 1.2 Define a shared evidence shape

Create a shared server-safe type in the existing local convention, for example `src/lib/insights/types.ts`:

```ts
type InsightEvidenceKind =
  | "TRADE_SET"
  | "METRIC"
  | "RULE"
  | "SESSION"
  | "PSYCHOLOGY"
  | "SYNC";

type InsightEvidence = {
  id: string;
  kind: InsightEvidenceKind;
  label: string;
  description?: string;
  count?: number;
  sampleSize?: number;
  dateFrom?: string;
  dateTo?: string;
  href?: string;
  filter?: Record<string, string | number | boolean>;
};

type CoachAction = {
  key: string;
  title: string;
  observation: string;
  recommendation: string;
  evidence: InsightEvidence[];
  learningHref?: string;
  status: "AVAILABLE" | "IN_PROGRESS" | "COMPLETED" | "NOT_ENOUGH_DATA";
  generatedAt: string;
};
```

Use the project’s existing naming and serialization conventions if equivalent types already exist.

### 1.3 Centralize metric rules

All new surfaces must use the same rules as the current dashboard:

- Only closed positions contribute to realized win rate and profit factor.
- `BE` is not a win and is not a loss.
- Open, unknown, stale, or incomplete positions must be excluded from final outcome metrics.
- No-trade dates are neutral.
- Small samples must display a sample-size note instead of a confident conclusion.
- Account, date range, and timezone must be preserved across links.

### Done when

- There is one reusable evidence type and one reusable metric path.
- Existing dashboard numbers do not change unexpectedly.
- `npm run lint`, type-check, and existing metric tests pass.
- New features can link to evidence without embedding ad hoc database queries in UI components.

## Task 2: Build Evidence-Grounded First Insight And Alert Orchestration

**Priority:** P0  
**Routes:** `/dashboard`, `/dashboard/reports/weekly`, `/dashboard/intelligence`, `/dashboard/journal`  
**Existing code to extend:** `src/lib/coach/*`, `src/components/coach/*`, `src/actions/reports.ts`, dashboard alert components.

### 2.1 Generate one primary action

The dashboard must show at most:

1. One primary coach action.
2. One secondary operational reminder, only when it is relevant.

Do not render separate banners for the same underlying condition. For example, a first weekly review, a coach plan, and a positive risk message must be composed into one coherent state rather than three competing alerts.

### 2.2 Make each insight explainable

Every non-trivial coach action must expose:

- `What happened`: plain-language observation.
- `Why it matters`: a short consequence or risk explanation.
- `What to do next`: exactly one action.
- `Evidence`: count, date range, relevant symbol/session/tag/rule, and a link to filtered journal data.
- `Sample size`: show when the conclusion is based on a small number of trades.
- `Learning link`: Academy lesson or article only when a real matching destination exists.

Example:

> Three losses followed two consecutive wins in the selected period. Review those three trades and complete the risk-management lesson before the next session.

The evidence link must preserve `accountId`, `from`, `to`, and any supported filters.

### 2.3 Add honest empty and insufficient-data states

Use distinct states:

- `NO_ACCOUNT`: connect or add an account.
- `NO_TRADE_DATA`: sync or log the first trade.
- `INSUFFICIENT_SAMPLE`: show what data is still needed.
- `READY`: show the evidence-backed insight.
- `STALE_SYNC`: show the last successful sync and recovery action.

Never show “excellent risk management” merely because no loss is present in a tiny or incomplete sample.

### 2.4 Acceptance criteria

- A user can trace every weekly action to at least one metric or trade set.
- Clicking evidence opens the same account/date context in Journal.
- One root cause produces one primary action, not duplicate alert banners.
- Fresh users see onboarding guidance; legacy users with real trade data see real analytics.
- No unsupported causal language is shown.

## Task 3: Add A Canonical P&L Calendar And Review Timeline

**Priority:** P0  
**Routes:** `/dashboard/journal`, `/dashboard/reports`, `/dashboard/reports/weekly`  
**Existing code to reuse:** `src/components/journal/CalendarHeatmap.tsx`, `src/components/reports/*`, metric helpers.

### 3.1 Calendar requirements

Add a compact monthly calendar to the Journal/review flow with:

- Daily realized net P&L.
- Closed-trade count.
- Wins, losses, and BE counts.
- Neutral no-trade days.
- Account selector and date-range context.
- Explicit timezone label or tooltip.
- Day click that filters the journal table/list.

The calendar is a review navigation tool, not a second analytics dashboard.

### 3.2 Week review mode

Allow the user to switch from month to week review and see:

- Daily net result.
- Number of closed trades.
- Most active symbol/session.
- One linked coach observation when available.

Keep session heatmaps and psychology heatmaps in their existing specialized routes. Do not duplicate all charts inside the calendar.

### 3.3 Mobile behavior

At mobile widths:

- Replace a wide desktop grid with a compact calendar plus selected-day list.
- Keep day cells tappable with adequate targets.
- Open day details in a sheet or inline panel.
- Avoid horizontal overflow.
- Keep the selected account/date state when navigating back from Journal detail.

### 3.4 Acceptance criteria

- BE never changes win rate.
- Open/unknown trades never change realized daily P&L.
- Clicking a day shows exactly the trades used by that day’s total.
- Calendar totals match Dashboard and Weekly Report totals.
- No-trade days do not appear as negative or positive performance.

## Task 4: Ship Mobile Quick Review And Manual Capture As A First-Class Path

**Priority:** P0  
**Routes:** `/dashboard/journal`, `/dashboard/accounts`, `/dashboard`, `/onboarding`  
**Existing code to reuse:** `src/actions/journal.ts`, `src/components/journal/JournalEntryModal.tsx`, `JournalForm.tsx`, existing upload helpers.

### 4.1 Quick Review entry point

Add a prominent but compact `Quick Review` action to the mobile journal and the dashboard’s next-action area. It must be usable without desktop MT5 access.

The minimum capture flow should support:

- Mood/emotion.
- Setup tag.
- Plan followed: `Yes`, `No`, or `Not applicable`.
- Mistake tag.
- Short note.
- *Note: Image upload feature is deferred for this release per product decision.*

Do not make every field required. The user should be able to save a useful review in under 60 seconds.

### 4.2 MT5 mobile fallback copy

When a user selects TNT Connect or EA Sync from a phone, explain the constraint clearly:

- MT5 synchronization requires the desktop app, terminal, or VPS.
- The user can send/copy setup instructions to a desktop.
- The user can log a manual review now and link it to synced data later.

Provide these actions:

- `Send setup link to desktop`.
- `Copy setup instructions`.
- `Log manually for now`.

Never present manual review as a failure path.

### 4.3 Data behavior

- Manual entries are marked `MANUAL` until linked to a synced trade.
- Upload failure must not discard text, tags, or selected emotion.
- The UI must allow retrying an attachment.
- The user must see whether an entry is linked, unlinked, or pending sync.
- A later TNT/EA sync must not silently duplicate a manual entry.

### 4.4 Acceptance criteria

- The complete flow works at 390px and 430px widths.
- No form control is hidden behind the keyboard or viewport edge.
- A review can be saved without a screenshot.
- A failed screenshot upload preserves all other fields.
- Existing desktop journal creation remains unchanged.

## Task 5: Connect Rules And Plans To A Reusable TradeCheck Snapshot

**Priority:** P0  
**Routes:** `/dashboard/rules`, `/dashboard/journal?tab=plans`, `/dashboard/accounts`  
**Existing code to reuse:** `src/actions/trading-rules.ts`, `src/actions/trade-plans.ts`, `src/components/rules/*`, `src/components/journal/TradePlanModal.tsx`, `PlanVsActualPanel.tsx`.

### 5.1 TradeCheck flow

Add a compact pre-trade check to the existing plan flow. Do not create a separate rules product.

Recommended checks:

- Setup selected.
- Risk and stop-loss defined.
- Position size reviewed.
- Session/time window acceptable.
- Emotional state acknowledged.
- Active rulebook acknowledged.

The checklist may be skipped, but the skip must be explicit so the later report can distinguish `NOT_CHECKED` from `PASSED`.

### 5.2 Snapshot semantics

When a TradeCheck is saved:

- Store a snapshot of the selected rule/goals and answers.
- **Architecture Decision:** Create a new dedicated Prisma model `TradeCheckSnapshot` to store these records relationally, allowing for scalable SQL aggregations (e.g., plan-followed rates) in the future.
- Preserve account, plan, and trade linkage.
- Record `createdAt`, source, and completion state.

### 5.3 Review integration

Show TradeCheck results in:

- Trade detail.
- Plan-vs-actual.
- Weekly report.
- Mistake/rule violation context.

Weekly metrics should include plan-followed rate only when a stored plan/check snapshot exists. Missing data must not be treated as a failed plan.

### 5.4 Acceptance criteria

- A user can begin TradeCheck from an existing plan.
- A synced trade can be linked without retyping the trade.
- Historical snapshots remain stable after rule edits.
- Weekly reports distinguish passed, failed, skipped, and unavailable checks.

## Task 6: Add Trade Evidence Context And Open-To-Closed Lifecycle States

**Priority:** P1  
**Routes:** `/dashboard/accounts`, `/dashboard/journal`, `/dashboard`  
**Existing code to reuse:** `src/components/journal/TradeDetailSheet.tsx`, `TradingViewMiniChart.tsx`, sync health components, trade API/server queries.

### 6.1 Context fields

Support optional context on a trade or linked journal entry:

- Screenshot/chart attachment.
- Setup tag.
- Emotion tag.
- Thesis and invalidation note.
- Plan-followed state.
- Post-trade lesson.
- Source: `TNT_CONNECT`, `EA_SYNC`, `MANUAL`, or `IMPORTED`.

Keep the form compact. Use progressive disclosure for advanced fields.

### 6.2 Lifecycle states

Expose a clear lifecycle:

- `OPEN`: position is not closed.
- `CLOSED`: final result is available.
- `BE`: closed at break-even. **Algorithm:** Auto-detected when `Gross Profit == 0`.
- `BE+`: closed slightly in profit. **Algorithm:** Auto-detected when `Gross Profit > 0` but less than a defined small threshold (e.g., `< 0.2R` or `< 0.05% Balance`).
- *Manual Override:* Allow users to manually toggle between `Win`, `BE`, and `BE+` if the auto-detection is incorrect due to early manual closes.
- `UNKNOWN`: source data is incomplete or cannot be classified.
- `STALE`: the sync heartbeat is too old to trust current state.

Open and unknown positions must show “waiting for close” or “data incomplete”, not a misleading loss/win warning.

### 6.3 Existing mini-chart boundary

`src/components/journal/TradingViewMiniChart.tsx` is a compact visualization, not true bar-by-bar replay. Keep its naming and copy honest. Do not describe it as replay until a separate replay implementation is completed.

### 6.4 Acceptance criteria

- Source and lifecycle are visible in trade detail.
- Open positions are excluded from realized metrics.
- Stale sync is distinguishable from a healthy account with no open positions.
- Attachment and context failures do not corrupt trade data.
- Sensitive broker credentials and raw account secrets never render in public surfaces.

## Task 7: Turn Weekly Coach, Academy, Reports, Missions, And Public Cards Into One Loop

**Priority:** P1  
**Routes:** `/dashboard`, `/dashboard/reports/weekly`, `/dashboard/intelligence`, `/academy`, `/dashboard/academy`, `/dashboard/missions`, `/trader/[username]`, `/share/[id]`.

### 7.1 Weekly coach output

The weekly report must contain:

- One strength to keep.
- One leak to fix.
- One next action.
- Evidence count/date range.
- Link to filtered trades.
- Link to one relevant lesson/article when available.
- Completion state.
- `Not enough data` state when no reliable conclusion exists.

The dashboard should summarize this instead of duplicating the full weekly report.

### 7.2 Academy recommendation

Recommendations must be derived from an existing evidence key:

- rule violation;
- repeated mistake;
- psychology tag;
- session/symbol pattern;
- plan adherence issue;
- sync/setup issue.

Each recommendation must link to a real Academy lesson or article. No dead CTA and no generic “learn more” link.

### 7.3 Missions

Keep the Edge/daily check-in loop, but prioritize useful behavior:

- complete a Quick Review;
- complete TradeCheck;
- review evidence for a coach action;
- complete the recommended lesson;
- return for the next weekly review.

Avoid missions that only reward page views or arbitrary clicks.

### 7.4 Public trader card and share surfaces

Add process-proof context where privacy allows:

- date range;
- sample size;
- metric definitions;
- current improvement focus;
- verified source label where applicable.

Provide a privacy preview before publishing. Never expose raw account number, broker credentials, or sensitive account metadata.

### 7.5 Acceptance criteria

- A user can move from coach action to evidence to lesson to completion.
- The same action is not rendered as multiple unrelated banners.
- Missions reflect actual review/learning behavior.
- Public cards remain safe and understandable without internal route knowledge.

## Task 8: Add Backup, Export, Privacy, And Performance Hardening

**Priority:** P1  
**Scope:** user data and all new surfaces.

### 8.1 Data portability

Improve existing export capabilities without making CSV the primary ingestion path:

- Versioned JSON backup containing user-owned journal/rule/plan/context data.
- CSV export for analysis.
- PDF weekly report.
- Restore validation with schema version and a preview before applying changes.
- Clear distinction between synced broker data and user-authored data.

### 8.2 Authorization and privacy

- Every evidence query must be scoped to the authenticated user and selected account.
- Do not trust `accountId` from the client without server authorization.
- Public routes must use an allowlisted projection.
- Attachment URLs must be authorized and time-limited where applicable.
- AI/coach services may access only the user’s authorized metrics, notes, rules, and selected trade evidence.

### 8.3 Performance

- Keep heavy analytics and evidence aggregation server-side.
- Avoid one request per calendar cell, trade, or evidence item.
- Batch counts and daily totals in one query/service call.
- Lazy-load advanced charts, attachment previews, and large report sections.
- Use stable loading skeletons and avoid layout shifts.
- Preserve the current page-speed work; do not add a large chart library for P0.

### 8.4 Color and UI rules

Use the existing light-first identity:

- Canvas: `#F8FAFC` or warm white `#FFFCF5`.
- Primary ink: `#182033`.
- Gold action/coach accent: `#F59E0B` and `#D97706`.
- Emerald healthy/connected/completed state: `#10B981`.
- Restrained blue for information.
- Restrained red for loss, risk, and failure only.

Gold must be used for selected states, educational emphasis, and primary action, not as a full-page fill. Keep grid/dot backgrounds subtle and avoid turning every section into a card.

## Task 9: Migration, Feature Flags, And Compatibility

**Priority:** P1  
**Dependency:** Complete before broad rollout.

### 9.1 Existing users

Explicitly test three user states:

1. Fresh account with no trading account.
2. Account with a connected trading account but no trade data.
3. Legacy account with real account and trade history.

The third state must retain the current dashboard, metrics, and navigation behavior. New-user onboarding conditions must never leak into it.

### 9.2 Migration rules

- Prefer derived evidence over backfilling every historical trade.
- If new context columns are required, make them nullable.
- Do not rewrite existing trade outcomes.
- Do not mark old trades as “failed TradeCheck” when no check existed.
- Backfill only deterministic fields such as source/lifecycle when source data is reliable.

### 9.3 Rollout

Use feature flags or staged release for:

- evidence-backed coach cards;
- P&L calendar;
- Quick Review;
- TradeCheck;
- public proof layer.

Each flag must have a safe disabled state and must not break existing routes.

## Task 10: Playwright QA, Metrics Verification, And Release Gate

**Priority:** Required before release  
**This task must be completed last.**

### 10.1 Playwright scenarios

Run at minimum:

#### Fresh user

- Sign up/login.
- Open `/onboarding` and confirm the setup path.
- Open `/dashboard` with no account.
- Confirm no fake performance insight is shown.
- Confirm mobile fallback copy and Quick Review path.

#### Connected account with no trades

- Open `/dashboard/accounts`.
- Confirm `sync first trades` is the primary CTA.
- Confirm calendar and reports show a truthful empty state.
- Confirm no weekly coach conclusion is generated.

#### Legacy user with trade data

- Open `/dashboard`.
- Confirm only one primary coach action and one relevant reminder.
- Open evidence link and verify account/date/filter preservation.
- Open `/dashboard/journal` and test calendar day filtering.
- Open trade detail and verify source/lifecycle/context.
- Open `/dashboard/rules` and create/complete TradeCheck.
- Open `/dashboard/reports/weekly` and verify evidence, sample size, lesson, and completion.
- Open `/dashboard/psychology`, `/dashboard/sessions`, and `/dashboard/analytics` to confirm existing data still matches.

#### Mobile

- Test at 390x844 and 430x932.
- Complete Quick Review in under 60 seconds.
- Test screenshot failure/retry without data loss.
- Confirm no horizontal overflow, clipped CTA, or hidden modal action.

#### Public/privacy

- Open `/trader/[username]` and `/share/[id]`.
- Confirm only allowlisted public data appears.
- Confirm private account number, credentials, and internal evidence IDs are absent.

### 10.2 Metric assertions

Use deterministic fixtures to verify:

- wins, losses, BE, open, and unknown states;
- realized P&L;
- win rate and profit factor;
- daily calendar totals;
- plan-followed and TradeCheck states;
- insufficient sample behavior;
- timezone/date boundary behavior.

### 10.3 Release gate

Release only when all of the following are true:

- Existing metric tests pass.
- New server/action tests pass.
- Playwright fresh, no-trade, legacy, mobile, and public/privacy scenarios pass.
- No console errors or failed requests on the touched routes.
- No duplicate coach/weekly/risk banners for one root condition.
- No regression in MT5 sync, EA sync, manual journal, rules, plans, Academy, or reports.
- Loading, error, empty, insufficient-data, stale-sync, and success states are all covered.

## Final Definition Of Done

This initiative is complete when TheNextTrade can demonstrate the following end-to-end flow with real or deterministic test data:

1. A trade arrives through TNT Connect, EA Sync, or manual capture.
2. The user can attach or select lightweight context.
3. The system calculates the result using the central metric rules.
4. The calendar and analytics show the same result.
5. The coach explains the finding and links to the evidence.
6. The Academy provides one relevant lesson/article.
7. The user receives one next action and can mark it complete.
8. The next weekly report compares the action with later behavior.
9. The public/share surface can prove process without exposing private data.
10. The complete flow works for both a legacy desktop-sync user and a mobile-only manual-review user.

The product should feel more useful because every feature points to the next improvement, not because the product contains more pages.
