# Personalized Trading Improvement Loop - Master Implementation Plan

## Document Status

- Purpose: implementation contract for Gemini or another coding agent.
- Scope: all 10 approved user-facing and admin improvements.
- Product loop: `Sync -> Find one leak -> Take one action -> Measure the result -> Improve`.
- Repository: TheNextTrade (`Next.js + Prisma + PostgreSQL`).
- This is an upgrade of existing systems. It is not permission to rebuild working onboarding, reports, AI Coach, Academy, notifications, or admin reports from scratch.

---

## 1. Mandatory Gemini Execution Contract

Gemini must follow every rule in this section.

### 1.1 Before writing code

- [ ] Read this entire document.
- [ ] Read `docs/FEATURE_SPECS.md`, `docs/PRODUCT.md`, and the relevant source files listed in each epic.
- [ ] Run `git status --short` and preserve all existing user changes.
- [ ] Create a task checklist grouped by the phases in section 18.
- [ ] For every checklist item, name the exact files to change and the exact test that will prove completion.
- [ ] Confirm from source whether an existing service already owns the behavior before adding a new service.
- [ ] Inspect the current Prisma schema before adding or renaming any field.
- [ ] Use the current supported sync-method registry. Do not reintroduce retired sync options such as TNT Connect or VPS import through hardcoded copy.
- [ ] Do not start implementation until the checklist covers all acceptance criteria in this document.

### 1.2 While coding

- [ ] Reuse the existing `TraderSignal`, `CoachActionPlan`, `TradingReport`, `TradingRule`, onboarding, activation, AI gateway, and notification systems.
- [ ] Do not create a second signal engine, a second notification center, or a second weekly-report engine.
- [ ] Keep business rules in server modules. UI components must render a server-produced view model and must not independently recalculate maturity, confidence, or action priority.
- [ ] Do not use fake metrics, placeholder recommendations, random values, or hardcoded user/account IDs.
- [ ] Do not let an LLM invent evidence or calculate canonical metrics. Deterministic application code computes facts; AI may only summarize approved evidence.
- [ ] Do not show more than one primary Next Best Action on the dashboard.
- [ ] Do not produce duplicate alerts for the same condition across dashboard banners, local notifications, and persisted notifications.
- [ ] Preserve legacy users with existing accounts and trade data. New-user UI must never hide or replace experienced-user workflows.
- [ ] Maintain light mode, dark mode, desktop, tablet, and mobile behavior.
- [ ] Keep changes scoped. No unrelated refactors, style rewrites, dependency changes, or metadata churn.
- [ ] Add succinct comments only for non-obvious business rules.

### 1.3 After each phase

- [ ] Mark every completed checklist item.
- [ ] Run the focused unit and integration tests for that phase.
- [ ] Run `npm run type-check`.
- [ ] Run targeted ESLint for changed files, then `npm run lint` before final handoff.
- [ ] Run relevant Playwright scenarios at desktop and mobile viewports.
- [ ] Check browser console errors and failed network requests.
- [ ] Re-run regression scenarios for an existing data-rich user.
- [ ] Update `docs/FEATURE_SPECS.md` and `docs/PRODUCT.md` only after behavior is verified.
- [ ] Report any intentionally deferred requirement. Silent omission is not allowed.

### 1.4 Stop conditions

Gemini may ask for confirmation only when one of these conditions is true:

1. A required external credential or provider is unavailable.
2. A destructive data migration cannot be made backward compatible.
3. Existing source behavior directly conflicts with this plan and no compatibility path exists.

Naming preferences, UI copy, default thresholds, and implementation details already defined below are not reasons to stop.

---

## 2. Product Goal

The release is successful when a trader can answer these questions without searching the application:

1. Where am I in the setup or improvement journey?
2. What is the single best thing I should do next?
3. What evidence caused the system to recommend it?
4. What specific action should I take?
5. How will the system measure whether that action helped?

The product must serve both audiences:

- New trader: needs direction, education, safe setup, and simple language.
- Experienced trader: needs credible evidence, fast diagnosis, configurable rules, and measurable improvement.

---

## 3. Existing Capabilities That Must Be Reused

### 3.1 Existing source of truth

| Capability | Existing implementation | Required treatment |
|---|---|---|
| Four-step onboarding | `/onboarding`, `src/lib/onboarding/onboarding.server.ts` | Extend intent/profile data only; do not rebuild |
| First-session setup | `src/lib/onboarding/first-session.server.ts`, `FirstSessionWizard` | Reuse for setup progression |
| Activation checklist | `src/lib/activation/activation.server.ts` | Feed from shared maturity state |
| Trader signals | `src/lib/coach/signal-engine.server.ts`, `TraderSignal` | Remains canonical deterministic detection engine |
| Next Best Action | `src/lib/coach/next-action.server.ts` | Refactor into the single priority orchestrator |
| Weekly Coach Plan | `src/lib/coach/weekly-action-plan.server.ts`, `CoachActionPlan` | Attach measurable experiment; do not replace |
| Learning recommendations | `src/lib/coach/lesson-recommendations.server.ts` | Upgrade ranking and evidence explanation |
| AI Coach | `src/actions/ai-coach.ts`, `src/lib/ai-coach.ts` | Reuse evidence boundary and AI gateway |
| Weekly eligibility | `src/lib/reports/weekly-review-eligibility.ts` | Remains report eligibility source of truth |
| Trading rules | `TradingRule`, `TradeRuleCheck`, `/dashboard/rules` | Connect accepted experiments to rules when appropriate |
| Notifications | `Notification`, Notification Bell, coach notifications | Add dedupe/cooldown; do not add another notification store |
| Funnel reporting | `/admin/reports`, `src/lib/admin/reports/*` | Expand to first-value and improvement-loop funnel |
| Analytics events | `AnalyticsEvent` | Use for product events and funnel timestamps |

### 3.2 What must not be rebuilt

- Authentication, email verification, signup, or profile identity collection.
- MT5 account creation and current supported sync transport.
- Journal storage and canonical trade outcome classification.
- Report generation calculations.
- Existing Academy lesson completion and article publishing systems.
- AI provider routing and OpenRouter integration.
- Public Trader Card, Missions, Edge points, or leaderboard.
- Admin broadcast system.

### 3.3 Required cleanup discovered during audit

- `docs/FEATURE_SPECS.md` and `docs/PRODUCT.md` still mention retired sync paths in places. Documentation must be corrected after implementation to match the runtime-supported sync registry.
- There are currently two first-insight implementations: `src/lib/first-insight.ts` and `src/lib/onboarding/first-insight.server.ts`. They must be consolidated behind one canonical service without breaking current callers.
- Dashboard currently orchestrates suppression in `dashboard-data.server.ts` and also injects local notifications in `DashboardClient.tsx`. The new action orchestrator must own deduplication so these paths cannot disagree.

---

## 4. Shared Domain Architecture

All 10 epics depend on one shared domain layer. Implement this foundation first.

### 4.1 Derived trader maturity state

Create `src/lib/trader-growth/maturity.server.ts` and `src/lib/trader-growth/types.ts`.

Do not store one mutable `maturityStatus` column. Derive state from canonical facts so it cannot become stale.

```ts
export type TraderMaturityStage =
    | "PROFILE_PENDING"
    | "NO_ACCOUNT"
    | "ACCOUNT_NO_DATA"
    | "DATA_BUILDING"
    | "INSIGHT_READY"
    | "ACTION_ACTIVE"
    | "ACTION_REVIEW_READY"
    | "IMPROVING";
```

Evaluation order is strict:

1. `PROFILE_PENDING`: onboarding identity/profile is incomplete and not intentionally skipped.
2. `NO_ACCOUNT`: no trading account exists.
3. `ACCOUNT_NO_DATA`: account exists but no usable trade record exists.
4. `DATA_BUILDING`: usable closed trades exist but no sufficiently confident actionable insight exists.
5. `INSIGHT_READY`: a sufficiently confident insight exists and no experiment has been accepted from it.
6. `ACTION_ACTIVE`: one accepted experiment is collecting follow-up trades.
7. `ACTION_REVIEW_READY`: the experiment reached its trade/time target and can be evaluated.
8. `IMPROVING`: no blocking setup issue exists and the user has completed at least one measured experiment or current signals are maintenance-level only.

Return a complete view model:

```ts
type TraderMaturity = {
    stage: TraderMaturityStage;
    reasonCode: string;
    accountCount: number;
    usableClosedTradeCount: number;
    latestSyncAt: Date | null;
    onboardingDone: boolean;
    firstInsightReady: boolean;
    activeExperimentId: string | null;
    reviewReadyExperimentId: string | null;
};
```

Rules:

- Use all accounts for setup state, but respect the selected account when producing account-scoped insights.
- A demo account is valid for product learning unless an existing feature explicitly requires a real account.
- `TradeResult.BREAK_EVEN` is neutral, not a win and not a loss.
- Open positions are not counted as closed-trade evidence.
- Imported/synced/manual trades are valid when canonical required fields are present.
- Existing users with historical data must derive into `DATA_BUILDING`, `INSIGHT_READY`, `ACTION_ACTIVE`, `ACTION_REVIEW_READY`, or `IMPROVING`, never back into first-session onboarding.

### 4.2 User intent

Store user intent inside the existing `User.settings.onboarding` JSON to avoid a migration solely for onboarding preference.

Canonical values:

```ts
type TraderIntent = "LEARN_FIRST" | "ANALYZE_TRADES";
```

Compatibility mapping:

- Existing `tradingGoal` remains intact.
- If intent is missing, infer display behavior from facts but do not persist an assumption silently.
- Existing user with trades defaults to the analyze experience for rendering only.
- Existing user with no trades defaults to the learn/setup experience for rendering only.
- Explicit user selection always wins.

### 4.3 Supported sync method registry

Create or extend one server-safe registry instead of scattering method names through UI copy.

Required fields:

```ts
type SupportedSyncMethod = {
    id: string;
    enabled: boolean;
    label: string;
    setupHref: string;
    supportsMobileSetup: boolean;
    description: string;
};
```

Current product defaults:

- Trade Manager EA based sync.
- Manual journal fallback.

Never add TNT Connect or VPS import to UI merely because an old document or stale string mentions it.

### 4.4 One orchestration boundary

Create `src/lib/trader-growth/orchestrator.server.ts` as the server entry point used by the dashboard and user-facing growth surfaces.

It returns:

```ts
type TraderGrowthViewModel = {
    maturity: TraderMaturity;
    nextAction: NextBestActionView | null;
    firstInsight: InsightSnapshotView | null;
    activeExperiment: ImprovementExperimentView | null;
    dataConfidence: DataConfidenceView;
    learningRecommendations: LearningRecommendation[];
    notificationCandidates: NotificationCandidate[];
};
```

The orchestrator composes existing services. It must not duplicate their queries or calculations.

---

## 5. Schema and Migration Design

### 5.1 New `TraderInsightSnapshot` model

Persist only actionable, versioned evidence snapshots. Do not persist every transient dashboard metric.

Required fields:

```prisma
model TraderInsightSnapshot {
  id                 String   @id @default(cuid())
  userId             String   @db.Uuid
  accountId          String?
  insightType        String   @db.VarChar(80)
  fingerprint        String   @db.VarChar(160)
  title              String   @db.VarChar(160)
  summary            String
  evidence           Json
  sampleSize         Int
  confidence         String   @db.VarChar(20)
  periodStart        DateTime @db.Timestamptz(6)
  periodEnd          DateTime @db.Timestamptz(6)
  sourceLastSyncAt   DateTime? @db.Timestamptz(6)
  engineVersion      String   @db.VarChar(30)
  status             String   @default("ACTIVE") @db.VarChar(20)
  viewedAt           DateTime? @db.Timestamptz(6)
  dismissedAt        DateTime? @db.Timestamptz(6)
  supersededAt       DateTime? @db.Timestamptz(6)
  createdAt          DateTime @default(now()) @db.Timestamptz(6)
  updatedAt          DateTime @updatedAt @db.Timestamptz(6)

  user       User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  account    TradingAccount?  @relation(fields: [accountId], references: [id], onDelete: SetNull)
  experiments ImprovementExperiment[]

  @@unique([userId, fingerprint, engineVersion])
  @@index([userId, status, createdAt])
  @@index([userId, accountId, insightType])
  @@map("trader_insight_snapshots")
}
```

Add matching relations to `User` and `TradingAccount`.

### 5.2 New `ImprovementExperiment` model

One experiment represents one measurable action accepted by the user.

```prisma
model ImprovementExperiment {
  id                  String   @id @default(cuid())
  userId              String   @db.Uuid
  accountId           String?
  sourceInsightId     String?
  coachActionPlanId   String?
  coachPlanItemId     String?
  actionType          String   @db.VarChar(80)
  title               String   @db.VarChar(160)
  hypothesis          String
  instruction         String
  primaryMetric       String   @db.VarChar(60)
  targetTradeCount    Int      @default(10)
  baseline            Json
  followUp            Json?
  result              Json?
  status              String   @default("DRAFT") @db.VarChar(30)
  outcome             String?  @db.VarChar(30)
  acceptedAt          DateTime? @db.Timestamptz(6)
  reviewReadyAt       DateTime? @db.Timestamptz(6)
  completedAt         DateTime? @db.Timestamptz(6)
  cancelledAt         DateTime? @db.Timestamptz(6)
  createdAt           DateTime @default(now()) @db.Timestamptz(6)
  updatedAt           DateTime @updatedAt @db.Timestamptz(6)

  user          User                   @relation(fields: [userId], references: [id], onDelete: Cascade)
  account       TradingAccount?        @relation(fields: [accountId], references: [id], onDelete: SetNull)
  sourceInsight TraderInsightSnapshot? @relation(fields: [sourceInsightId], references: [id], onDelete: SetNull)

  @@index([userId, status, createdAt])
  @@index([userId, accountId, acceptedAt])
  @@index([sourceInsightId])
  @@map("improvement_experiments")
}
```

Allowed status values in TypeScript constants:

- `DRAFT`
- `ACTIVE`
- `READY_FOR_REVIEW`
- `COMPLETED`
- `CANCELLED`
- `SUPERSEDED`

Allowed outcomes:

- `IMPROVED`
- `NO_CHANGE`
- `WORSE`
- `INCONCLUSIVE`

Enforce one active experiment per user/account in application transaction logic. PostgreSQL partial unique index may be added through raw SQL migration if the project migration convention supports it. Otherwise, lock and verify inside a serializable transaction.

### 5.3 Extend `Notification`

Add:

```prisma
dedupeKey String?   @map("dedupe_key") @db.VarChar(180)
metadata  Json?
expiresAt DateTime? @map("expires_at") @db.Timestamptz(6)
```

Add `@@unique([userId, dedupeKey])` and an index on `[userId, createdAt]` if Prisma/PostgreSQL behavior is verified with nullable values. If nullable composite uniqueness is problematic in the current Prisma version, create a dedicated idempotent write helper using a deterministic notification ID. Do not ship without an idempotency guarantee.

### 5.4 Migration safety

- Migration must only add nullable fields/new tables/indexes.
- No destructive rename or drop in this release.
- No backfill is required for insights or experiments.
- Existing users are derived from current facts at runtime.
- Run `prisma generate` after migration.
- Test migration against a copy of current schema and with existing data.

---

## 6. Epic 1 - Split New and Experienced User Paths

### URLs

- `/`
- `/auth/signup`
- `/onboarding`
- `/dashboard`

### Objective

Ask users what value they want first, then adapt wording and initial CTA without creating separate products.

### Required changes

1. Homepage must expose two clear paths after the promise/proof area:
   - `Learn trading` -> `/academy` for public users, `/dashboard/academy` for authenticated users.
   - `Analyze my trades` -> `/auth/signup?intent=analyze-trades` for guests, `/dashboard/accounts` or current next action for authenticated users.
2. Signup must preserve `intent` through email verification and callback redirects.
3. Onboarding must preselect or ask intent and persist `User.settings.onboarding.intent`.
4. Onboarding copy may adapt by intent, but the existing four-step structure stays.
5. New users who choose learning are still shown optional account setup after identity/goal; do not block Academy access.
6. Users who choose analysis receive the current account/sync path as the primary setup action.
7. Existing users are never forced to answer intent again.

### Event contract

- `homepage_path_selected` `{ intent, authState }`
- `signup_intent_captured` `{ intent }`
- `onboarding_intent_saved` `{ intent, source }`
- `intent_primary_cta_clicked` `{ intent, maturityStage, href }`

### Acceptance criteria

- Guest intent survives signup, verification, and onboarding.
- Existing authenticated user gets a destination based on maturity, not a generic signup CTA.
- No open redirect is introduced.
- Query parameters are validated against the two allowed values.

---

## 7. Epic 2 - Single Next Best Action

### URLs

- `/dashboard`
- `/dashboard/notifications`
- Supporting destinations such as `/dashboard/accounts`, `/dashboard/journal`, `/dashboard/reports`, `/dashboard/rules`, `/dashboard/academy`

### Objective

The dashboard displays one primary action. Secondary reminders move to the notification center or contextual pages.

### Required server refactor

Refactor `src/lib/coach/next-action.server.ts` to accept maturity, signals, report eligibility, active experiment, and user intent. It must not call and persist the signal engine repeatedly if the orchestrator already has the results.

Canonical priority order:

| Priority | Condition | Primary action |
|---:|---|---|
| 1 | Profile incomplete | Complete profile |
| 2 | No account | Add trading account |
| 3 | Account has no data | Sync first trades or log manually |
| 4 | Critical sync interruption | Restore sync |
| 5 | Experiment review ready | Review result |
| 6 | High-severity credible leak | Review insight and accept action |
| 7 | First insight ready | View first insight |
| 8 | Weekly review eligible | Generate weekly review |
| 9 | Active experiment | Continue current experiment |
| 10 | No Academy lesson started and learn-first intent | Start recommended lesson |
| 99 | Healthy maintenance state | Review journal or continue learning |

Rules:

- Setup blockers always beat coaching actions.
- Review-ready experiments beat new insight generation.
- An active experiment suppresses competing low/medium leak actions unless a critical safety/data-quality issue appears.
- A weekly report CTA must not duplicate a coach CTA for the same report.
- Positive "keep it up" messages are not primary actions.
- `INSUFFICIENT_DATA` must request more data, not claim a weakness.

### Required UI behavior

- Use one compact dashboard action surface.
- Do not show a large coach block, activation checklist, weekly banner, and notification for the same next step.
- The action surface includes title, one-sentence reason, one CTA, and optional `Why this?` evidence disclosure.
- Existing modal/details behavior can be reused.
- On mobile, it must fit above dashboard content without occupying most of the viewport.

### Acceptance criteria

- Every maturity stage returns zero or one primary action.
- Duplicate action fingerprint cannot render twice on one dashboard response.
- Dashboard local notification and persisted notification share the same dedupe key.
- Regression: data-rich user still sees account/date filters and analytics.

---

## 8. Epic 3 - Strong First Insight Moment

### URLs

- `/dashboard`
- `/dashboard/intelligence`
- `/dashboard/analytics`

### Objective

After initial data arrives, show one trustworthy observation that demonstrates value without pretending a tiny sample is statistically meaningful.

### Consolidation requirement

- Create `src/lib/insights/first-insight.server.ts` as the canonical service.
- Migrate callers from both existing first-insight modules.
- Keep compatibility exports temporarily if necessary, but mark them deprecated and do not duplicate calculations.

### Insight quality gates

Use configurable constants in `src/lib/insights/constants.ts`:

```ts
MIN_OBSERVATION_TRADES = 3
MIN_ACTIONABLE_TRADES = 20
MIN_SEGMENT_TRADES = 5
HIGH_CONFIDENCE_TRADES = 50
```

Interpretation:

- 1-2 usable closed trades: celebrate successful sync only; no pattern claim.
- 3-19 trades: show descriptive observation with `LOW` confidence; no behavioral diagnosis.
- 20-49 trades: allow actionable insight if the compared segment has at least 5 trades.
- 50+ trades: eligible for `HIGH` confidence when completeness checks pass.

### Evidence contract

Every insight must contain:

```ts
type InsightEvidence = {
    metric: string;
    segment: string | null;
    sampleSize: number;
    segmentValue: number | null;
    baselineValue: number | null;
    absoluteDelta: number | null;
    relativeDelta: number | null;
    periodStart: string;
    periodEnd: string;
    accountIds: string[];
    sourceLastSyncAt: string | null;
};
```

### Candidate ordering

1. Repeated rule violation or recurring mistake with adequate sample.
2. Loss streak/revenge sizing pattern.
3. Weak session/day/symbol with valid segment comparison.
4. Strongest repeatable setup or positive discipline pattern.
5. Missing journal context.
6. Descriptive most-traded symbol only when nothing more useful is valid.

### AI boundary

- Deterministic code selects and calculates evidence.
- AI Coach may rewrite summary and action wording using evidence IDs only.
- If AI fails, deterministic fallback renders the insight.
- Store `engineVersion` and evidence snapshot.
- Never expose chain-of-thought or raw prompts.

### UX

- First sync success modal: confirms data arrival, sample size, and one observation.
- Use `Early observation` for low confidence and `Actionable pattern` for medium/high confidence.
- Include `Based on X closed trades`, period, account scope, and last sync.
- Primary CTA goes to the evidence view or creates an experiment when eligible.
- Secondary CTA may open journal/analytics but must not compete visually.

### Acceptance criteria

- A 1-trade user never gets a "best day", "worst session", or behavior diagnosis.
- Break-even trades do not inflate win/loss rates.
- Same evidence/version creates one snapshot through fingerprint idempotency.
- First-insight viewed event is emitted once.

---

## 9. Epic 4 - Measurable Action Experiments

### URLs

- `/dashboard/reports`
- `/dashboard/reports/weekly`
- `/dashboard/rules`
- `/dashboard/intelligence`
- `/dashboard`

### Objective

Convert coaching from advice into a measurable experiment with a baseline, follow-up sample, and result.

### Experiment creation

An experiment may originate from:

- a `TraderInsightSnapshot`;
- a weekly `CoachActionPlanItem`;
- a user-created rule from `/dashboard/rules`.

Required action payload:

```ts
type CreateExperimentInput = {
    accountId?: string;
    sourceInsightId?: string;
    coachActionPlanId?: string;
    coachPlanItemId?: string;
    actionType: string;
    title: string;
    hypothesis: string;
    instruction: string;
    primaryMetric: string;
    targetTradeCount?: number;
};
```

### Baseline

- Default baseline: latest 20 usable closed trades before acceptance.
- If fewer than 20 exist, use all available actionable trades but mark baseline confidence low.
- Store immutable baseline JSON at acceptance time.
- Baseline includes sample size, win rate, net PnL, average R:R when valid, plan compliance when relevant, target-pattern count/rate, and period.
- Money-based comparisons must respect user currency/account scope.

### Follow-up

- Count trades closed after `acceptedAt`.
- Default target is 10 closed trades.
- Do not count edits to historical trades as new follow-up trades.
- If account scope is set, only that account advances progress.
- When target is reached, atomically set `READY_FOR_REVIEW` and emit one notification.

### Evaluation

Create `src/lib/experiments/evaluate.server.ts`.

- Compare the primary metric first.
- Use secondary metrics as context, not to override the primary result arbitrarily.
- Use minimum practical delta constants per metric.
- Return `INCONCLUSIVE` when data is missing, the sample is too small, or trade context changed materially.
- Never promise causality. UI copy says "performance changed during this experiment," not "this rule caused profit."

### Rule integration

- If an action is a durable execution rule, offer `Add to My Rules`.
- Do not automatically create a rule without user confirmation.
- If a matching active rule exists, link it instead of creating a duplicate.
- Use normalized rule fingerprint by category/title/scope.

### Weekly Coach integration

- Keep maximum three checklist items.
- Only one item may be promoted as the measurable experiment.
- Completing a checklist item is not the same as completing an experiment.
- The weekly report must show current experiment progress and previous experiment result when available.

### Acceptance criteria

- User can have at most one active experiment per account scope.
- Accepting an action stores immutable baseline evidence.
- Progress updates from canonical closed trades.
- Re-running a sync does not double-count follow-up trades.
- Result screen clearly shows before, during, sample sizes, outcome, and next step.

---

## 10. Epic 5 - Personalized Learning From Real Weaknesses

### URLs

- `/dashboard/academy`
- `/dashboard/intelligence`
- `/dashboard/reports/weekly`
- `/knowledge`
- `/articles/[slug]`

### Objective

Recommend one lesson and one article that directly address the current evidence-backed weakness.

### Required service changes

Upgrade `src/lib/coach/lesson-recommendations.server.ts`.

1. Keep `SIGNAL_CONTENT_MAP` as fallback compatibility.
2. Introduce normalized weakness taxonomy:
   - `RISK_DISCIPLINE`
   - `LOSS_RECOVERY`
   - `PLAN_COMPLIANCE`
   - `SESSION_SELECTION`
   - `SYMBOL_SELECTION`
   - `TRADE_MANAGEMENT`
   - `OVERTRADING`
   - `JOURNAL_QUALITY`
   - `PSYCHOLOGY`
3. Map signal types to one taxonomy key.
4. Rank content by:
   - evidence relevance;
   - not completed/read;
   - difficulty fit;
   - user intent/trading goal;
   - content availability/status;
   - recency as a tie breaker only.
5. Query lessons/articles in batches. Do not run one DB query per signal.
6. Return maximum two primary recommendations in the Next Best Action surface and maximum three in expanded views.

### Explanation contract

Every recommendation must answer:

- `Why`: the validated weakness or goal.
- `Evidence`: sample and metric reference.
- `Expected use`: what the user should apply to the next trades.
- `Status`: not started, in progress, completed, or read where trackable.

### Academy behavior

- Preserve the fixed Academy curriculum.
- Add a compact `Recommended for your current edge` section without rearranging the entire path.
- If the user has stopped learning, show one contextual reminder with elapsed time and a resume CTA.
- Do not show the same recommendation in three dashboard blocks at once.

### Acceptance criteria

- Completed lesson is not recommended again unless explicitly useful as a review, in which case label it `Review`.
- Missing/unpublished slugs do not produce broken cards.
- Recommendations are based on active credible signals, not only generic popularity.
- At least one article and one lesson can be returned when both valid types exist.

---

## 11. Epic 6 - Adaptive Dashboard by Maturity

### URL

- `/dashboard`

### Objective

Use one dashboard route and one responsive layout that adapts its hierarchy to the user's current maturity.

### Rendering matrix

| Stage | First viewport | Hidden/de-emphasized |
|---|---|---|
| `PROFILE_PENDING` | Continue onboarding | Charts, filters, coach metrics |
| `NO_ACCOUNT` | Add account + short value preview | Account/date filters, empty analytics |
| `ACCOUNT_NO_DATA` | Sync first trades/manual fallback | Empty charts, weekly review, positive risk claims |
| `DATA_BUILDING` | Data confidence + collect-more-data action | Strong pattern claims |
| `INSIGHT_READY` | First/current insight + accept action | Competing coach prompts |
| `ACTION_ACTIVE` | Experiment progress + core metrics | New low-priority actions |
| `ACTION_REVIEW_READY` | Review result CTA | Generic weekly prompt |
| `IMPROVING` | Current leak/strength, active plan, performance | Setup guidance |

### Required code changes

- `src/app/dashboard/dashboard-data.server.ts` consumes the growth orchestrator once.
- `DashboardClient.tsx` renders stage-aware sections but does not recompute stage.
- Existing suppression booleans become a server-produced `surfacePolicy` with explicit keys.
- Remove client-side creation of business-critical local notifications. The client may display ephemeral UI state, but persisted candidates are created server-side with dedupe.
- Keep account/date filters for users with canonical trade data.
- Keep current experienced-user analytics and dashboard customization behavior.

### Surface policy

```ts
type DashboardSurfacePolicy = {
    showFilters: boolean;
    showSetupGuide: boolean;
    showPrimaryAction: boolean;
    showActivationChecklist: boolean;
    showExperimentProgress: boolean;
    showCoreMetrics: boolean;
    showCharts: boolean;
    showPositiveInsight: boolean;
};
```

### Acceptance criteria

- No-data users see no misleading `0%`, `999`, empty charts, or generic "excellent risk" claims.
- Existing user with data sees all current analytics and filters.
- Dashboard has one dominant action and a stable layout with no large content jump after hydration.
- Mobile first viewport shows greeting plus primary action, not multiple full-width banners.

---

## 12. Epic 7 - Data Confidence and Trust Layer

### URLs

- `/dashboard`
- `/dashboard/intelligence`
- `/dashboard/reports`
- `/dashboard/reports/weekly`
- `/dashboard/analytics`

### Objective

Make every important diagnosis auditable and avoid false certainty.

### Confidence calculation

Create `src/lib/insights/data-confidence.ts` as a deterministic pure module.

Inputs:

- usable closed trade count;
- segment sample size;
- selected date span;
- latest sync age;
- PnL completeness;
- result completeness;
- stop-loss completeness;
- session/symbol completeness;
- duplicate/import integrity warnings;
- account scope.

Output:

```ts
type DataConfidence = {
    level: "INSUFFICIENT" | "LOW" | "MEDIUM" | "HIGH";
    score: number;
    sampleSize: number;
    reasons: string[];
    warnings: string[];
    lastSyncAt: string | null;
    periodStart: string | null;
    periodEnd: string | null;
    accountScope: string[];
};
```

Score rules must be documented in code and unit-tested. UI labels use levels, not a pseudo-scientific percentage alone.

### UI component

Create reusable `DataConfidenceBadge` and `DataEvidenceDrawer`.

- Badge is compact and includes a tooltip.
- Drawer shows sample, period, account scope, latest sync, missing fields, and how break-even trades were handled.
- Do not expose broker credentials, full API keys, internal prompts, or sensitive IDs.
- Never call missing SL data "bad risk management." Label it `SL data unavailable` unless actual behavior is known.

### Acceptance criteria

- Same input yields same confidence result.
- Every first insight, AI Coach analysis, and experiment result can display evidence metadata.
- Low confidence changes wording and prevents strong prescriptive claims.
- Stale sync state is visible but not confused with bad trading performance.

---

## 13. Epic 8 - Behavior-Triggered Notifications

### URLs

- Global notification bell
- `/dashboard/notifications`
- Optional email destination links to the relevant dashboard page

### Objective

Notify only when the trader has a meaningful next step, with strict deduplication and cooldowns.

### Event types and defaults

| Event | Trigger | Cooldown | Default channel |
|---|---|---:|---|
| `SETUP_STALLED_NO_ACCOUNT` | verified/onboarded, no account after 24h | 72h | in-app; email once |
| `SETUP_STALLED_NO_DATA` | account exists, no trade data after 24h | 72h | in-app; email once |
| `SYNC_INTERRUPTED` | previously syncing account exceeds configured threshold | 24h | in-app; email if enabled |
| `FIRST_INSIGHT_READY` | first actionable/descriptive insight created | once per fingerprint | in-app |
| `EXPERIMENT_REVIEW_READY` | target trades reached | once per experiment | in-app; email optional |
| `WEEKLY_REVIEW_READY` | canonical eligibility returns ready | once per eligible period | in-app |
| `LEARNING_STALLED` | started curriculum but inactive for 7 days | 7 days | in-app; email optional |

### Dedupe key format

`{eventType}:{scopeId}:{periodKeyOrFingerprint}`

Examples:

- `FIRST_INSIGHT_READY:all:abc123`
- `EXPERIMENT_REVIEW_READY:experimentId:target10`
- `WEEKLY_REVIEW_READY:accountId:2026-W32`

### Delivery rules

- One persisted notification per dedupe key.
- Read/dismissed state must not be overwritten by repeated cron runs.
- Email is not sent if the user opted out of non-transactional product mail.
- Security/verification email preferences remain separate.
- Clicking the notification emits `notification_action_clicked` with type and destination.
- Resolve or expire stale setup notifications when the condition is completed.

### Required integration

- Extend existing activation reminder cron and coach notification service.
- Do not create notifications inside React effects for canonical product events.
- Use transactions for condition check plus create when race conditions are possible.

### Acceptance criteria

- Running the cron repeatedly creates no duplicate records or emails.
- Completing the target action resolves the related notification.
- Existing Notification Bell categories still work.
- Mobile links open the exact action destination.

---

## 14. Epic 9 - Admin Activation and Improvement Funnel

### URL

- `/admin/reports`

### Objective

Show where users fail to reach first value and whether users enter the improvement loop. Admin must see actionable cohorts, not merely vanity totals.

### Canonical funnel stages

1. `Signed Up`
2. `Verified`
3. `Intent Selected`
4. `Onboarding Completed or Skipped`
5. `Account Connected`
6. `First Trade Data`
7. `First Insight Viewed`
8. `Action Accepted`
9. `Experiment Completed`
10. `Returned Next Week`

Keep `Onboarding Completed` and `Onboarding Skipped` as separate breakdowns, even if both continue through the funnel.

### Stage definitions

- Signed Up: `User.createdAt` in selected cohort.
- Verified: `User.emailVerified` present.
- Intent Selected: valid `User.settings.onboarding.intent` or `homepage_path_selected`/onboarding event tied to user.
- Onboarding Completed/Skipped: existing settings timestamps.
- Account Connected: first `TradingAccount.createdAt`.
- First Trade Data: earliest usable `JournalEntry.createdAt/syncedAt`.
- First Insight Viewed: `TraderInsightSnapshot.viewedAt`; compatibility fallback to existing first-session timestamp during rollout.
- Action Accepted: first `ImprovementExperiment.acceptedAt`.
- Experiment Completed: first completed experiment.
- Returned Next Week: at least one authenticated/product event 7-14 days after first value. Define event set explicitly in query code.

### Admin UI

- Add `Activation & Improvement` section to current reports; do not create a separate admin analytics product.
- Show cohort selector: 7, 30, 90 days and custom range if current report controls support it.
- Show stage count, stage conversion, median time to stage, and drop-off.
- Clicking a stage opens filtered user rows with user ID/email, current stage, time stuck, intent, account count, trade count, last activity, and recommended admin response.
- Add exception cohorts:
  - verified but no onboarding after 24h;
  - account but no data after 24h;
  - data but no first insight after processing window;
  - insight viewed but no action accepted after 72h;
  - experiment review ready but not reviewed after 7 days.
- Admin action is operational: inspect user, send approved template, or dismiss with note. Do not encourage ad hoc spam.

### Query/performance rules

- Build aggregate queries in `src/lib/admin/reports/`.
- Avoid loading every user and processing the entire funnel in JavaScript for large ranges.
- Add indexes required by query plans.
- Cache aggregate report data with the current admin report caching convention.
- Drilldowns must paginate.

### Acceptance criteria

- Funnel counts are monotonic by reached-stage logic.
- Skipped and completed onboarding are visible separately.
- Existing partial Pro funnel remains available but is clearly separated as monetization, not activation.
- User drilldown matches underlying timestamps.
- Empty cohorts render a useful empty state without fake data.

---

## 15. Epic 10 - Homepage Single Promise With Two Paths

### URL

- `/`

### Objective

Reduce the "mixed pot" feeling while preserving SEO value for Academy, tools, brokers, and articles.

### Primary promise

The first viewport must communicate one product promise:

`Turn your MT5 trade history into one clear action for your next trading week.`

Supporting copy may mention sync, evidence, journal, and weekly coaching. Do not list every product feature in the hero.

### Required hierarchy

1. Hero promise.
2. Product proof: real workflow preview or credible live product metrics.
3. Two-path selector: Learn trading / Analyze my trades.
4. Three-step improvement loop.
5. Product evidence/comparison.
6. Academy preview.
7. Selected tools/broker support content for SEO.
8. FAQ.
9. Final signup CTA.

### CTA rules

- Guest primary CTA: `Start Free` -> signup with analyze intent.
- Guest secondary path: `Learn Trading` -> Academy.
- Logged-in primary CTA derives from Next Best Action and must never say Sign Up.
- Header CTA remains visible; hero does not need multiple equivalent buttons.
- Avoid repeating signup CTAs in every section.

### SEO rules

- One H1 only.
- Server-render meaningful copy and links.
- Preserve crawlable links to Academy, knowledge, tools, brokers, FAQ, and trading systems.
- Do not remove structured data or metadata currently in use.
- Keep section headings aligned with search intent without keyword stuffing.

### Performance rules

- Do not add a new heavy hero video or autoplay media.
- Lazy-load below-fold interactive previews.
- Keep primary hero text and CTA server-rendered.
- Avoid client hydration for static sections.
- Preserve image optimization and explicit dimensions.

### Acceptance criteria

- User can explain the core value after reading the first viewport.
- New and experienced paths are distinct but remain within one brand/system.
- Logged-in and guest CTAs are correct.
- Lighthouse/benchmark does not regress beyond the thresholds in section 20.

---

## 16. API and Server Action Contract

Prefer server actions for authenticated mutations already following project conventions. Use route handlers where cron/external calls require them.

### Required operations

| Operation | Suggested location | Method/behavior |
|---|---|---|
| Read growth view model | `src/lib/trader-growth/orchestrator.server.ts` | Server-only function |
| Save intent | extend onboarding actions | Validated server action |
| View/dismiss insight | `src/actions/insights.ts` | Idempotent mutation |
| Accept experiment | `src/actions/improvement-experiments.ts` | Transactional |
| Cancel experiment | same | Owner-only mutation |
| Review/complete experiment | same | Recompute server-side, do not trust client metrics |
| Add action as trading rule | same or rules action | Deduped mutation |
| Notification generation | existing services/cron | Idempotent |
| Admin funnel aggregate | `src/lib/admin/reports/activation-improvement.server.ts` | Admin-only server query |
| Admin funnel drilldown | server action/route consistent with current report UI | Paginated, admin-only |

### Validation and authorization

- Use Zod for all client-originated input.
- Confirm the authenticated user owns account, insight, plan, rule, and experiment IDs.
- Admin queries must use current admin authorization helper.
- Do not accept baseline/follow-up metrics from the client.
- Limit free-text action fields and sanitize display.
- Rate-limit AI analysis/experiment wording generation using current AI gateway controls.

---

## 17. Analytics Event Specification

Use the existing analytics collector and `AnalyticsEvent`. Do not send trade PnL, account number, broker credentials, journal notes, or sensitive personal data to third-party analytics.

Required events:

| Event | Required properties |
|---|---|
| `homepage_path_selected` | `intent`, `authState` |
| `growth_primary_action_viewed` | `actionId`, `maturityStage`, `source` |
| `growth_primary_action_clicked` | `actionId`, `maturityStage`, `href` |
| `first_insight_created` | `insightType`, `confidence`, `sampleBucket`, `engineVersion` |
| `first_insight_viewed` | `insightType`, `confidence` |
| `improvement_experiment_accepted` | `actionType`, `targetTradeCount`, `accountScoped` |
| `improvement_experiment_progressed` | `progressBucket` |
| `improvement_experiment_review_ready` | `actionType`, `targetTradeCount` |
| `improvement_experiment_completed` | `actionType`, `outcome`, `confidence` |
| `learning_recommendation_clicked` | `contentType`, `signalType`, `sourceSurface` |
| `notification_action_clicked` | `notificationType`, `sourceSurface` |
| `data_confidence_opened` | `level`, `sourceSurface` |

Rules:

- Emit viewed events once per page/surface impression, not every React render.
- Use coarse sample buckets, not raw sensitive trading values.
- Add unit tests for payload sanitizer.

---

## 18. Implementation Phases and Mandatory Checklist

Gemini must implement in this order. Do not mark a phase complete until its verification passes.

### Phase 0 - Foundation and compatibility

- [ ] Add shared trader-growth types and maturity derivation.
- [ ] Add supported sync method registry and remove hardcoded retired method use from touched flows.
- [ ] Add insight snapshot and experiment Prisma models.
- [ ] Extend Notification idempotency fields.
- [ ] Create and test non-destructive migration.
- [ ] Add feature flags with server defaults disabled for risky surfaces:
  - `GROWTH_ORCHESTRATOR_ENABLED`
  - `IMPROVEMENT_EXPERIMENTS_ENABLED`
  - `ADAPTIVE_DASHBOARD_ENABLED`
  - `ADMIN_IMPROVEMENT_FUNNEL_ENABLED`
- [ ] Add compatibility adapters for existing first-insight callers.

Verify:

- [ ] `prisma generate` succeeds.
- [ ] Existing data-rich user derives a non-onboarding maturity stage.
- [ ] Existing new-user first-session tests still pass.
- [ ] Feature flags off preserve current UI.

### Phase 1 - Clarity

- [ ] Implement intent capture across homepage, signup, verification, onboarding.
- [ ] Refactor Next Best Action into canonical priority orchestration.
- [ ] Make dashboard render one primary action.
- [ ] Implement adaptive surface policy for no-data vs data-rich users.
- [ ] Update homepage hierarchy and two paths.

Verify:

- [ ] New learn-first and analyze-first E2E flows.
- [ ] No-data dashboard has no account/date filters or empty analytics.
- [ ] Data-rich dashboard retains filters, analytics, and current features.
- [ ] Only one primary action appears per state.

### Phase 2 - First value and trust

- [ ] Consolidate first-insight service.
- [ ] Add deterministic quality gates and evidence model.
- [ ] Persist idempotent insight snapshots.
- [ ] Add Data Confidence badge/drawer to insight, intelligence, and report surfaces.
- [ ] Connect AI Coach summaries to evidence IDs only.

Verify:

- [ ] 1, 5, 20, and 50-trade fixtures produce correct claim strength.
- [ ] Break-even and missing-SL fixtures behave correctly.
- [ ] AI failure renders deterministic fallback.
- [ ] Repeated analysis creates no duplicate insight snapshot.

### Phase 3 - Measurable improvement loop

- [ ] Implement experiment create/accept/cancel/progress/review lifecycle.
- [ ] Integrate experiment with Weekly Coach Plan and intelligence.
- [ ] Add optional Add to My Rules action with dedupe.
- [ ] Show active experiment progress on dashboard.
- [ ] Show result comparison and next step.

Verify:

- [ ] Historical resync does not advance progress incorrectly.
- [ ] Only correct account trades count.
- [ ] One active experiment rule holds under concurrent requests.
- [ ] Outcome calculation fixtures pass.

### Phase 4 - Retention

- [ ] Upgrade lesson/article recommendation ranking.
- [ ] Implement deduped behavior-triggered notifications.
- [ ] Add learning-stalled and experiment-ready reminders.
- [ ] Expand admin activation/improvement funnel and drilldown.

Verify:

- [ ] Repeated cron runs create one notification.
- [ ] Completed lessons do not appear as new lessons.
- [ ] Funnel stage counts match fixture timestamps.
- [ ] Admin drilldown is paginated and authorized.

### Phase 5 - Rollout and documentation

- [ ] Enable flags for admin/internal test users.
- [ ] Run complete E2E matrix.
- [ ] Compare dashboard and homepage performance baseline.
- [ ] Enable by cohort, then 100% after error/metric review.
- [ ] Update `docs/FEATURE_SPECS.md`.
- [ ] Update `docs/PRODUCT.md`.
- [ ] Remove deprecated first-insight adapters only after all callers migrate.
- [ ] Delete obsolete implementation plans only after verified production-equivalent QA.

---

## 19. Test Matrix

### 19.1 Unit tests

- [ ] Maturity state for every stage.
- [ ] Intent compatibility inference.
- [ ] Next Best Action priority and tie breaking.
- [ ] Surface dedupe fingerprints.
- [ ] Insight confidence at boundary values 0, 1, 2, 3, 19, 20, 49, 50.
- [ ] Break-even classification.
- [ ] Weak segment minimum sample.
- [ ] Data confidence completeness penalties.
- [ ] Experiment baseline capture.
- [ ] Experiment progress/account scope.
- [ ] Experiment result outcomes.
- [ ] Notification dedupe/cooldown.
- [ ] Learning recommendation ranking and batching.
- [ ] Analytics payload sanitization.

### 19.2 Integration tests

- [ ] Accepting an experiment creates one active record transactionally.
- [ ] Concurrent accept calls cannot create two active experiments.
- [ ] New closed trades advance progress once.
- [ ] Historical updates/resync do not double-count.
- [ ] Insight fingerprint upsert is idempotent.
- [ ] Notification service is idempotent across cron retries.
- [ ] Admin funnel stage timestamps and monotonic reached counts.
- [ ] Authorization rejects cross-user insight/experiment access.

### 19.3 Playwright personas

Use dedicated fixtures. Do not mutate a real admin/trader account.

1. Fresh verified user, onboarding incomplete.
2. Learn-first user, no account.
3. Analyze-first user, no account.
4. Account connected, no trade data.
5. Five closed trades, insufficient confidence.
6. Twenty closed trades with a valid weak segment.
7. Fifty trades with strong evidence.
8. Active experiment at 3/10 trades.
9. Experiment review ready at 10/10 trades.
10. Existing data-rich legacy user with multiple accounts/reports.
11. Stale sync user.
12. User with only break-even trades.

For each relevant persona verify:

- correct primary action;
- no duplicate banner/notification;
- correct filters and dashboard sections;
- correct evidence/confidence copy;
- CTA destination;
- no console errors;
- no failed API requests;
- desktop 1440x900;
- mobile 390x844;
- light and dark mode for changed dashboard components.

### 19.4 Admin Playwright tests

- [ ] `/admin/reports` loads aggregate funnel.
- [ ] Date range changes counts.
- [ ] Stage drilldown opens and paginates.
- [ ] Completed and skipped onboarding are separate.
- [ ] Improvement stages appear only when feature is enabled.
- [ ] Non-admin cannot access report data.

---

## 20. Performance and Reliability Budgets

### Dashboard

- Growth orchestration must not add more than two net database round trips compared with current dashboard loading after query consolidation.
- Avoid invoking `computeTraderSignals` more than once per dashboard request.
- Avoid N+1 lesson/article queries.
- Avoid blocking dashboard response on notification delivery or optional AI summarization.
- Cache deterministic insight snapshots and AI summaries by engine/prompt version, account, date range, and latest-trade timestamp.

### Homepage

- No new above-fold video.
- No new render-blocking third-party script.
- Added client JavaScript target: under 10 KB gzip for intent interaction.
- No CLS from delayed personalized CTA.

### Admin reports

- Aggregate report target: under 2 seconds for 90-day range on production-like data.
- Drilldown page size: 25-50 users.
- Query plans must use indexes; inspect with production-safe EXPLAIN where available.

### Reliability

- All AI surfaces have deterministic fallback.
- Cron/retry operations are idempotent.
- Failed notification email must not roll back the in-app state transition.
- Experiment evaluation can be safely retried.

---

## 21. Security and Privacy Requirements

- Never send account credentials, API keys, full account numbers, private notes, or personal contact data to analytics.
- AI prompts include only fields required for coaching and continue through the internal AI gateway.
- Admin funnel data is admin-only and audited where current admin audit conventions apply.
- Experiment actions cannot be used as direct Buy/Sell signals.
- AI output must not prescribe guaranteed returns, leverage, or lot sizes.
- User-visible language must state that observations are educational/performance-review support, not financial advice.
- Validate all redirect/CTA URLs as internal allowlisted paths unless an existing vetted external link is required.

---

## 22. Rollout and Rollback

### Rollout

1. Ship schema and server code with feature flags off.
2. Enable for admin/internal QA users.
3. Enable for new users only.
4. Enable for 10% of existing users.
5. Review errors, duplicate notifications, action acceptance, and dashboard performance.
6. Expand to 50%, then 100%.

### Rollback

- Disable feature flags without reverting schema.
- Keep old dashboard data shape adapters until full rollout is stable.
- Do not delete insight/experiment data during rollback.
- Notification candidates for disabled features must stop generating immediately.
- Homepage intent query remains harmless if downstream personalization is disabled.

---

## 23. Required File Map

### Existing files likely to change

- `prisma/schema.prisma`
- `src/app/page.tsx`
- `src/app/auth/signup/page.tsx`
- `src/app/auth/actions.ts`
- `src/app/onboarding/OnboardingClient.tsx`
- `src/app/onboarding/actions.ts`
- `src/lib/onboarding/onboarding.server.ts`
- `src/lib/onboarding/first-session.server.ts`
- `src/lib/activation/activation.server.ts`
- `src/lib/coach/signal-engine.server.ts`
- `src/lib/coach/next-action.server.ts`
- `src/lib/coach/weekly-action-plan.server.ts`
- `src/lib/coach/lesson-recommendations.server.ts`
- `src/lib/coach/coach-notifications.server.ts`
- `src/lib/reports/weekly-review-eligibility.ts`
- `src/actions/ai-coach.ts`
- `src/lib/ai-coach.ts`
- `src/app/dashboard/dashboard-data.server.ts`
- `src/app/dashboard/DashboardClient.tsx`
- `src/components/coach/DashboardCoachNudge.tsx`
- `src/components/coach/WeeklyCoachPlan.tsx`
- `src/components/coach/RecommendedForYou.tsx`
- `src/components/analytics/AiCoachCard.tsx`
- `src/components/reports/ReportView.tsx`
- `src/app/admin/reports/page.tsx`
- `src/components/admin/reports/AdminReportsDashboard.tsx`
- `src/lib/admin/reports/types.ts`
- `docs/FEATURE_SPECS.md`
- `docs/PRODUCT.md`

### New files expected

- `src/lib/trader-growth/types.ts`
- `src/lib/trader-growth/maturity.server.ts`
- `src/lib/trader-growth/orchestrator.server.ts`
- `src/lib/trader-growth/sync-methods.ts`
- `src/lib/insights/constants.ts`
- `src/lib/insights/first-insight.server.ts`
- `src/lib/insights/data-confidence.ts`
- `src/lib/experiments/types.ts`
- `src/lib/experiments/baseline.server.ts`
- `src/lib/experiments/progress.server.ts`
- `src/lib/experiments/evaluate.server.ts`
- `src/actions/insights.ts`
- `src/actions/improvement-experiments.ts`
- `src/components/insights/DataConfidenceBadge.tsx`
- `src/components/insights/DataEvidenceDrawer.tsx`
- `src/components/experiments/ExperimentProgress.tsx`
- `src/components/experiments/ExperimentResult.tsx`
- `src/lib/admin/reports/activation-improvement.server.ts`
- focused `*.test.ts` files beside each pure/server domain module according to current project convention.

This is a likely file map, not permission to modify every listed file. Gemini must confirm actual ownership and touch only files required by its checklist.

---

## 24. Definition of Done

The entire master plan is done only when all conditions below are true:

- [ ] Both user intents work through signup and onboarding.
- [ ] Every dashboard maturity state has exactly one primary action or an intentional no-action maintenance state.
- [ ] First insight is evidence-based, confidence-aware, idempotent, and uses one canonical service.
- [ ] User can accept one measurable action and see progress/result.
- [ ] Durable actions can be added to Trading Rules without duplication.
- [ ] Academy and article recommendations explain their relationship to the user's actual weakness.
- [ ] New-user dashboard is simple; existing-user dashboard retains all current data features.
- [ ] Insight/report/AI surfaces show data confidence and evidence details.
- [ ] Product notifications are deduped, cooled down, and resolve after completion.
- [ ] Admin reports show the full first-value and improvement-loop funnel with drilldowns.
- [ ] Homepage communicates one promise and two paths without becoming feature-heavy again.
- [ ] Unit, integration, Playwright, mobile, dark-mode, security, and performance checks pass.
- [ ] No regressions for existing users with accounts and historical trades.
- [ ] Documentation matches verified runtime behavior.
- [ ] Gemini provides a final checklist showing every item as passed or explicitly deferred with a reason.
