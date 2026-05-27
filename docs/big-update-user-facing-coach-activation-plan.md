# Big Update: User-Facing Coach And Activation Plan

Last reviewed: 2026-05-27

## Goal

Make TheNextTrade feel like a product that tells each trader exactly what to do next.

This plan covers the big updates except Trade Replay and Mobile-only Auto Sync, which have separate documents:

- `docs/trade-replay-implementation-plan.md`
- `docs/mobile-only-auto-sync-strategy.md`

Risk Guardrails is intentionally not a standalone module in this plan. Risk-related behavior should be folded into coach signals, weekly reports, lessons, and notifications.

## Product Principles

1. New users should never land in the app and wonder what to do next.
2. Trade data should turn into a simple next action, not just charts.
3. Notifications should be useful and low-noise.
4. Email should be reserved for high-value lifecycle moments.
5. Admin reports should lead to concrete support actions.
6. Public sharing should build trust without exposing private trading data.

## Modules Included

| Module | User value | Priority |
| --- | --- | --- |
| Next Best Action Engine | Tells user what to do now | P0 |
| Personalized Learning Path | Recommends Academy lessons and public articles from trade weaknesses without changing the fixed Academy curriculum page | P0 |
| Weekly Coach Report | Turns weekly data into conclusion and next-week plan | P0 |
| Smart Notifications/Nudges | Keeps users moving without spam | P1 |
| Public Trader Card 2.0 | Better shareable credibility and referral loop | P1 |
| Admin Activation Inbox | Shows admins where users are stuck and what to do | P1 |

## Existing System Audit

This audit prevents duplicate work. Most modules already exist as partial features; the big update should upgrade and connect them instead of rebuilding from scratch.

| Module | Existing state | Current source | Build decision |
| --- | --- | --- | --- |
| Next Best Action Engine | Partial | `src/lib/activation/activation.server.ts`, `src/components/dashboard/WelcomeHero.tsx`, `src/components/dashboard/ActivationChecklist.tsx`, `src/components/dashboard/missions/NextBestActionCard.tsx` | Upgrade into shared signal-driven `getNextBestAction()`. Do not remove current activation checklist. |
| Personalized Learning Path | Partial | `src/lib/services/mistake-lessons.service.ts`, `Article`, `Lesson`, `UserProgress` models | Extend from article-only mapping into mixed Academy lesson + article recommendations, but surface it on Dashboard/Reports, not as a new Academy section. |
| Weekly Coach Report | Partial | `src/app/dashboard/reports/weekly/page.tsx`, `src/components/reports/ReportView.tsx`, `src/lib/services/report-insights.service.ts`, `src/lib/services/report-generator.service.ts` | Replace the redundant `Weekly Focus` UI with `Weekly Coach Plan`. Delete unused Weekly Focus UI/code after migration. |
| Smart Notifications/Nudges | Foundation exists | `Notification` model, `src/hooks/useNotifications.ts`, `src/components/layout/NotificationBell.tsx`, `src/app/api/user/notifications/route.ts`, `src/app/api/cron/generate-reports/route.ts`, `src/actions/notifications.ts` | Add signal-based nudges + cooldown rules. Reuse notification UI and email service. |
| Public Trader Card 2.0 | Mostly exists | `src/app/trader/[username]/page.tsx`, `src/components/profile/PublicProfileCard.tsx`, `src/lib/profile-queries.ts`, `src/app/api/og/trader/[username]/route.tsx` | Polish UI/CTA/privacy. Top 3 pairs and real badges already exist. |
| Admin Activation Inbox | Partial | `src/lib/admin/reports/action-queue.server.ts`, `src/components/admin/reports/ActionQueuePanel.tsx`, `src/lib/admin/release-health.server.ts` | Upgrade action queue into user-level activation inbox with admin actions. |
| Trade Replay | Not in this plan | `lightweight-charts` exists, `TradingViewMiniChart` exists | Separate plan: `docs/trade-replay-implementation-plan.md`. |
| Mobile-only Auto Sync | Not in this plan | TNT Connect, EA Sync, Manual Journal, Sync Wizard exist | Separate plan: `docs/mobile-only-auto-sync-strategy.md`. |

### What Not To Rebuild

- Do not rebuild the dashboard activation checklist from scratch.
- Do not rebuild `/dashboard/academy` as a personalized recommendation page. Academy remains a fixed learning curriculum.
- Do not create a second notification system.
- Do not create a second public trader profile route.
- Do not create a separate admin report center for activation before extending the existing action queue.
- Do not keep both `Weekly Coach Plan` and `Weekly Focus` visible. `Weekly Focus` is redundant after the coach plan exists and should be removed from the weekly report UI.

### What Is Truly New

- Persistent `TraderSignal` layer.
- Shared `getNextBestAction()` service driven by signals.
- Mixed Academy lesson + article recommendation service.
- Academy continuation nudge based on learning inactivity, without changing the fixed Academy curriculum structure.
- `Weekly Coach Plan` output with next-week checklist.
- Notification cooldown logic for signal nudges.
- User-level admin activation inbox actions such as contacted, dismissed, assigned, or noted.

## Current Code To Reuse

Activation:

- `src/lib/activation/activation.server.ts`
- `src/components/get-started/OnboardingChecklist.tsx`
- `src/components/dashboard/missions/NextBestActionCard.tsx`

Reports:

- `src/lib/services/report-generator.service.ts`
- `src/lib/services/report-insights.service.ts`
- `src/components/reports/ReportView.tsx`
- `src/app/api/cron/generate-reports/route.ts`

Learning/content:

- `src/lib/services/mistake-lessons.service.ts`
- `src/app/dashboard/academy/*`
- `src/app/articles/*`
- `Article` model for public article recommendations
- `Lesson`, `Module`, `UserProgress`, and `UserQuizAttempt` models for Academy learning recommendations

Notifications:

- `src/hooks/useNotifications.ts`
- `src/components/layout/NotificationBell.tsx`
- `src/app/api/user/notifications/route.ts`
- `src/lib/services/email.service.ts`
- `Notification` model

Admin:

- `src/lib/admin/reports/action-queue.server.ts`
- `src/components/admin/reports/ActionQueuePanel.tsx`
- `/admin/reports`
- `/admin/users`

Public profile:

- `src/app/trader/[username]/page.tsx`
- `src/components/profile/PublicProfileCard.tsx`
- `src/app/api/og/trader/[username]/route.tsx`
- `src/lib/profile-queries.ts`

Referrals:

- `src/lib/referrals.ts`
- `/dashboard/settings/referrals`

## Shared Concept: Trader Signal

Create a centralized signal layer. Every recommendation, notification, report conclusion, and admin action should come from the same signal logic.

A signal is a detected condition:

- User has no account.
- User added account but never synced.
- User synced trades but never reviewed.
- User has repeated losses.
- User hits BE often.
- User increases lot size after losses.
- User has low plan compliance.
- User has recurring mistakes.
- User is inactive after signup.

## Data Model

Add persistent signals so dashboards, reports, admin, and notifications do not recompute everything separately.

```prisma
model TraderSignal {
  id           String   @id @default(cuid())
  userId       String   @db.Uuid
  signalType   String   @db.VarChar(80)
  severity     String   @default("INFO") @db.VarChar(20)
  status       String   @default("ACTIVE") @db.VarChar(20)
  sourceType   String?  @db.VarChar(80)
  sourceId     String?  @db.VarChar(120)
  title        String   @db.VarChar(160)
  summary      String
  actionLabel  String?  @db.VarChar(80)
  actionHref   String?
  metadata     Json?
  firstSeenAt  DateTime @default(now()) @db.Timestamptz(6)
  lastSeenAt   DateTime @default(now()) @db.Timestamptz(6)
  resolvedAt   DateTime? @db.Timestamptz(6)

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, signalType, sourceType, sourceId])
  @@index([userId, status, severity])
  @@index([signalType, status])
  @@map("trader_signals")
}
```

Add coach action plan for weekly reports and dashboard.

```prisma
model CoachActionPlan {
  id            String   @id @default(cuid())
  userId        String   @db.Uuid
  periodStart   DateTime? @db.Timestamptz(6)
  periodEnd     DateTime? @db.Timestamptz(6)
  type          String   @default("WEEKLY") @db.VarChar(30)
  title         String   @db.VarChar(160)
  summary       String
  keepDoing     String?
  fixNext       String?
  nextActions   Json
  lessonSlugs   String[] @default([])
  status        String   @default("ACTIVE") @db.VarChar(20)
  createdAt     DateTime @default(now()) @db.Timestamptz(6)
  completedAt   DateTime? @db.Timestamptz(6)

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, status])
  @@index([userId, type, createdAt])
  @@map("coach_action_plans")
}
```

Optional admin follow-up tracking:

```prisma
model AdminActivationTask {
  id             String   @id @default(cuid())
  userId          String   @db.Uuid
  assignedAdminId String?  @db.Uuid
  taskType        String   @db.VarChar(80)
  status          String   @default("OPEN") @db.VarChar(20)
  severity        String   @default("MEDIUM") @db.VarChar(20)
  title           String   @db.VarChar(160)
  summary         String
  recommendedAction String?
  userHref        String?
  metadata        Json?
  createdAt       DateTime @default(now()) @db.Timestamptz(6)
  completedAt     DateTime? @db.Timestamptz(6)

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([status, severity])
  @@index([userId, status])
  @@map("admin_activation_tasks")
}
```

If the team wants fewer migrations in v1, `TraderSignal` can be implemented first, and `CoachActionPlan`/`AdminActivationTask` can follow later.

## Signal Engine

Add:

- `src/lib/coach/signal-types.ts`
- `src/lib/coach/signal-engine.server.ts`
- `src/lib/coach/next-action.server.ts`
- `src/lib/coach/lesson-recommendations.server.ts`
- `src/lib/coach/weekly-action-plan.server.ts`

### Core Function

```ts
export async function computeTraderSignals(userId: string, options?: {
  accountId?: string;
  periodStart?: Date;
  periodEnd?: Date;
  persist?: boolean;
}): Promise<TraderSignalInput[]>
```

### Signal Severity

- `INFO`: helpful progress prompt.
- `LOW`: mild improvement.
- `MEDIUM`: repeated friction or pattern.
- `HIGH`: high-intent user is blocked, or repeated painful trade pattern.

Do not use alarming language unless real money/security risk exists.

## Signal Rules

### Activation Signals

| Signal | Trigger | Action |
| --- | --- | --- |
| `NO_ACCOUNT` | User has 0 trading accounts | Add MT5 account |
| `ACCOUNT_NEVER_SYNCED` | Account exists, no `lastSync`, no trades | Set up TNT Connect |
| `SYNC_STALE` | Account had sync but stale beyond threshold | Troubleshoot sync |
| `NO_FIRST_TRADE` | User has account but 0 journal entries | Sync or log first trade |
| `NO_WEEKLY_REVIEW` | User has trades but no weekly report | Generate weekly review |
| `NO_LESSON_STARTED` | User has no completed lesson | Start first lesson |

### Trade Weakness Signals

| Signal | Trigger | Recommended action |
| --- | --- | --- |
| `LOSS_STREAK` | 3 or more LOSS trades in a row | Review loss streak and emotion lesson |
| `SL_CLUSTER` | 3 or more losing trades in same day/session | Lesson on handling SL and cooldown |
| `REVENGE_SIZE_UP` | Lot size increases after a loss by 50% or more | Lesson on revenge trading |
| `LOW_PLAN_COMPLIANCE` | `followedPlan=false` on more than 40% of reviewed trades | Create pre-trade checklist |
| `BE_HEAVY` | BE result is more than 40% of decisive exits with enough sample | Lesson on trade management |
| `WEAK_SYMBOL` | Symbol has at least 5 trades and negative net P/L | Pause or review that symbol |
| `WEAK_SESSION` | Session has at least 5 trades and negative net P/L | Trade only strongest session next week |
| `RECURRING_MISTAKE` | Same mistake code appears 3 or more times | Recommend mapped lesson |

Important:

- Missing SL data from imported trades must not be treated as risky behavior.
- Break-even trades should be handled separately from wins/losses.
- Avoid recommendation if sample size is too small.

## Next Best Action Engine

### Purpose

Return one primary action for the user.

Add:

- `getNextBestAction(userId)`

Return shape:

```ts
type NextBestAction = {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  priority: number;
  reason: string;
  sourceSignalIds: string[];
}
```

### Priority Order

1. Complete email verification/onboarding if incomplete.
2. Add account.
3. Set up chosen sync method.
4. Sync or log first trade.
5. Generate first weekly review.
6. Fix stale sync.
7. Review highest-severity trade weakness.
8. Complete recommended lesson.
9. Claim available Edge mission.
10. Share public card/referral only after user has enough credibility data.

### Surfaces

Show primary action in:

- `/dashboard` top area.
- `/dashboard/missions`.
- `/get-started` for logged-in users.
- `/dashboard/reports` empty/summary state.

Do not show multiple competing primary CTAs.

## Personalized Learning Path

### Purpose

Recommend the right learning content from actual trading behavior.

This should combine two content sources:

1. **Academy lessons** for structured learning, quizzes, progress, and Edge missions.
2. **Public articles** for fast reading, SEO content reuse, and softer educational guidance.

The recommendation should not only say "study more". It should explain why the content is relevant to the user's trade data.

### Current Status

Partially exists.

Existing service:

- `src/lib/services/mistake-lessons.service.ts`

Current limitation:

- It maps mistake IDs to article slugs.
- The service name says "lessons", but it currently queries `Article` and returns `/articles/{slug}` links.
- It does not yet combine Academy `Lesson` progress with article recommendations.
- It does not yet rank recommendations by user stage, signal severity, completion status, or current report.

### Target Behavior

For every strong signal, return a mixed recommendation set:

- 1 primary Academy lesson when a structured lesson exists.
- 1 to 2 supporting articles when relevant.
- Do not recommend a completed Academy lesson unless it is intentionally a refresher.
- Do not recommend unpublished articles.
- Do not recommend more than 3 items in one surface.

Recommendation types:

```ts
type LearningContentType = "ACADEMY_LESSON" | "ARTICLE";

type LearningRecommendation = {
  id: string;
  type: LearningContentType;
  slug: string;
  title: string;
  url: string;
  reason: string;
  signalType: string;
  priority: number;
  estimatedMinutes?: number;
  completed?: boolean;
};
```

### Content Mapping

Create one mapping that can point to both Academy lessons and articles.

```ts
const SIGNAL_CONTENT_MAP = {
  LOSS_STREAK: {
    academyLessonSlugs: ["trading-routine-for-consistency"],
    articleSlugs: ["revenge-trading-and-how-to-stop-it", "what-to-do-after-a-losing-streak"],
    reason: "You had several losses close together. Review how to pause, reset, and avoid forcing the next trade.",
  },
  SL_CLUSTER: {
    academyLessonSlugs: ["risk-management-foundations"],
    articleSlugs: ["stop-loss-strategies-forex", "risk-management-plan-template-traders"],
    reason: "Your losses clustered around stop-loss outcomes. Review SL placement and post-SL behavior.",
  },
  REVENGE_SIZE_UP: {
    academyLessonSlugs: ["trading-psychology-discipline"],
    articleSlugs: ["revenge-trading-and-how-to-stop-it"],
    reason: "Lot size increased after a loss. This is a common revenge-trading pattern.",
  },
  LOW_PLAN_COMPLIANCE: {
    academyLessonSlugs: ["build-your-trading-plan"],
    articleSlugs: ["trading-plan-how-to-create-one", "trading-rules-every-trader-needs"],
    reason: "Several trades were marked as not following plan. Tighten the pre-trade checklist.",
  },
  BE_HEAVY: {
    academyLessonSlugs: ["trade-management-basics"],
    articleSlugs: ["risk-reward-ratio-explained"],
    reason: "Many trades reached break-even. Review whether exits are too defensive or entries need more confirmation.",
  },
  WEAK_SYMBOL: {
    academyLessonSlugs: ["market-selection-basics"],
    articleSlugs: ["price-action-trading-for-beginners"],
    reason: "One symbol is dragging down results. Review whether it fits your playbook.",
  },
};
```

Claude should adapt slugs to real existing Academy lesson/article slugs in the database. Do not hardcode broken links.

### Recommendation Service

Add:

- `src/lib/coach/learning-recommendations.server.ts`

Responsibilities:

- Accept `TraderSignal[]`.
- Resolve matching `Lesson` and `Article` records.
- Check `UserProgress` so completed lessons are ranked lower.
- Return at most 3 high-signal recommendations.
- Prefer Academy lesson first when the user has not completed it.
- Fall back to articles when no matching lesson exists.

### UI Surfaces

Dashboard:

- Card title: `Recommended for you`
- Shows one primary recommendation.
- CTA: `Start lesson` or `Read article`.
- This surface should be compact. It should not push core dashboard KPIs far below the fold.

Reports:

- Section title: `Study before next week`
- Shows the recommendations tied to the weekly report's biggest leak.

Academy:

- Do **not** add a new personalized recommendation block such as `Based on your trades`.
- `/dashboard/academy` is a fixed curriculum page and should remain stable.
- Add only a lightweight continuation nudge when the user has stopped learning for a meaningful period.
- Example copy:
  - `You paused your learning path for 12 days. Continue where you left off.`
  - `Your next lesson is ready. Keep your trading routine sharp.`
- CTA:
  - `Continue learning`
  - Link to the next incomplete lesson when available.
  - Fall back to `/dashboard/academy`.
- The nudge should be dismissible for the current session/day.
- Do not show the nudge if the user completed a lesson recently.

Notifications:

- In-app only when a new high-confidence recommendation appears.
- No email for every recommendation.

### Acceptance Criteria

- Recommendations can include both Academy lessons and articles.
- Completed lessons are not repeatedly pushed as the top action.
- Missing/unpublished article slugs do not break the UI.
- Every recommendation includes a clear reason tied to trade behavior.
- A user with repeated SL/loss patterns sees content about SL handling, emotional reset, and risk discipline.
- `/dashboard/academy` keeps its fixed curriculum layout.
- `/dashboard/academy` only adds a small learning-inactivity nudge when the user has paused learning for the configured threshold.
- The Academy nudge does not duplicate dashboard/report recommendations.

## Weekly Coach Report

### Purpose

The report should not only say what happened. It must tell the user what to do next week.

### Current Status Of `/dashboard/reports/weekly`

Partially exists.

Current route and components:

- `src/app/dashboard/reports/weekly/page.tsx`
- `src/components/reports/ReportView.tsx`
- `src/lib/services/report-insights.service.ts`
- `src/lib/services/report-generator.service.ts`

What already exists:

- `/dashboard/reports/weekly` loads weekly reports through `getReports("WEEKLY", 1, 20)`.
- `ReportView` renders a `WeeklyFocus` block.
- `WeeklyFocus` calls `buildWeeklyInsights()`.
- `buildWeeklyInsights()` returns up to 3 insight cards.
- Current insight types include strengths, warnings, and actions:
  - win rate improvement/drop
  - plan compliance
  - strong profit factor
  - risk/reward imbalance
  - worst symbol
  - recurring mistake
  - best session
- `ReportsDashboard` can generate the latest weekly review and handles "no trades this week".

What is still missing:

- No single coach headline for the week.
- No plain-English executive summary.
- No explicit `keep doing` / `fix next` structure.
- No next-week checklist.
- No mixed Academy lesson + article recommendations.
- No persistent `CoachActionPlan`.
- No completion state for next-week actions.
- No notification tied to a new coach action, beyond existing report-ready/mission behavior.

Decision:

- Do not rebuild the weekly report from scratch.
- `Weekly Coach Plan` becomes the only user-facing weekly insight/action layer.
- Remove `Weekly Focus` from the weekly report UI.
- Delete or stop exporting unused `WeeklyFocus` component/code after verifying nothing else imports it.
- `buildWeeklyInsights()` may be deleted if it becomes unused, or kept only if another route/service still consumes it. Do not keep dead UI code.
- Generate the stronger action plan from `TradingReport`, `TraderSignal`, and learning recommendations.

Extend `TradingReport` data output without necessarily adding many database columns. Existing JSON fields can support v1, but `CoachActionPlan` is cleaner.

Add to report payload:

```ts
type WeeklyCoachSummary = {
  headline: string;
  plainEnglishSummary: string;
  keepDoing: string;
  biggestLeak: string;
  nextWeekPlan: Array<{
    label: string;
    detail: string;
    ctaHref?: string;
  }>;
  recommendedLessons: Array<{
    slug: string;
    title: string;
    url: string;
    type: "ACADEMY_LESSON" | "ARTICLE";
    reason: string;
  }>;
}
```

Example output:

- Headline: `Your best edge came from XAUUSD during London.`
- Keep doing: `You followed your plan on 82% of reviewed trades.`
- Biggest leak: `Losses clustered after the first SL of the day.`
- Next week plan:
  1. `Stop after 2 losses in one session.`
  2. `Trade only London for 3 sessions.`
  3. `Review the SL lesson before next trading day.`

### UI Placement

In `ReportView`, the weekly report order should become:

1. Period navigator.
2. `Weekly Coach Plan` section.
3. Core stats.
4. Existing breakdowns/details.

Remove this old block:

- `Weekly Focus`
- `WeeklyFocus` render call in `ReportView`
- Any dedicated Weekly Focus component if it is no longer imported
- Any unused imports caused by removing it

`Weekly Coach Plan` should be compact:

- One headline.
- One sentence summary.
- Two small blocks:
  - `Keep doing`
  - `Fix next`
- Three next-week actions with optional CTA links.
- One small `Study before next week` row with lesson/article CTA.

### Implementation Notes

- `Weekly Focus` is now considered redundant and should be removed from user-facing weekly report UI.
- `report-insights.service.ts` should only remain if another active feature still uses it. Otherwise remove it and clean up imports.
- Add `weekly-action-plan.server.ts` for the new coach output.
- The weekly action plan should consume:
  - `TradingReport`
  - active `TraderSignal[]`
  - learning recommendations from `learning-recommendations.server.ts`
- Store generated plan in `CoachActionPlan` or in `TradingReport` JSON if the team wants fewer migrations.
- If no strong weakness exists, generate a positive maintenance plan instead of an empty section.

## Smart Notifications And Nudges

### Principle

In-app notification first. Email only when it is worth inbox attention.

### In-App Notifications

Create notification when:

- Weekly report is ready.
- User has a new high-confidence coach action.
- Sync is stale.
- First trade synced.
- First weekly review available.
- Referral qualifies.

### Email Notifications

Email only:

- Welcome after email verification.
- Password/security events.
- Weekly report ready.
- No-trades nudge if user opted in or default lifecycle email is enabled.
- Sync disconnected if user enabled sync email alerts.
- Desktop setup link requested by user.

Do not email:

- Every SL.
- Every loss streak.
- Every daily check-in.
- Every low-severity coach signal.

### Cooldowns

Add notification cooldown logic:

- Same signal type: once per 7 days.
- Sync stale: once per 24 hours per account.
- Weekly report: once per report.
- Lesson recommendation: once per lesson per user per 14 days.

Implementation option:

- Store sent notification metadata in `TraderSignal.metadata.notificationSentAt`.
- Or create a `NotificationDeliveryLog` later.

## Public Trader Card 2.0

### Purpose

Turn public trader profile into a clean credibility/share page.

Route:

- `/trader/[username]`

Current:

- Shows public trading card.

Upgrade:

- Gold accent tone.
- Top 3 traded pairs only.
- Clear verified period.
- Edge tier/badge.
- Consistency stat.
- Optional "Join TheNextTrade" CTA with referral code.
- Better share image through existing OG route.

Privacy rules:

- Do not show email.
- Do not show Telegram.
- Do not show MT5 account number.
- Do not show exact balance/equity.
- Exact P/L hidden by default unless user explicitly enables public P/L later.

Use existing profile visibility flags:

- `showBadges`
- `showPairStats`
- `showSessionStats`
- `showTradeScore`

Add if needed:

- `showPublicPnL`
- `showPublicWinRate`
- `showPublicTradeCount`

## Admin Activation Inbox

### Purpose

Admin should not only see "users are stuck". Admin should know what action to take.

Route option:

- Add panel inside `/admin/reports` first.
- Later split to `/admin/activation` if it grows.

Admin sees:

- New users stuck before account.
- Users added account but never synced.
- Users synced but no first review.
- High-intent users who requested Pro but did not qualify.
- Users with repeated sync failures.
- Users with stale connected accounts.

Each row should include:

- User
- Stage
- Reason
- Last activity
- Recommended admin action
- CTA

Admin actions:

- Open user detail.
- Send setup nudge.
- Send TNT Connect guide.
- Mark contacted.
- Add admin note.
- Assign owner.
- Dismiss for 7 days.

This answers: "Admin sees user stuck. What now?"

## Implementation Phases

### Phase 1: Signal Engine And Next Best Action

Tasks:

- Add `TraderSignal` model.
- Implement `computeTraderSignals`.
- Implement `getNextBestAction`.
- Replace scattered "next action" logic where practical.
- Show primary next action on `/dashboard`.
- Keep existing onboarding checklist, but let it use the new action source when possible.

Verification:

- New user sees Add Account.
- User with account/no sync sees Sync Setup.
- User with trades/no report sees Generate Weekly Review.
- User with report and weakness sees learning/review action.

### Phase 2: Personalized Learning Path

Tasks:

- Replace the current article-only mistake mapping with mixed Academy lesson + article recommendations.
- Resolve real `Lesson` and `Article` records by slug before rendering links.
- Check `UserProgress` so completed Academy lessons are not repeatedly promoted as the top recommendation.
- Add `RecommendedForYou` component.
- Add to dashboard and report view.
- Do not add a new `Based on your trades` section to `/dashboard/academy`.
- Keep `/dashboard/academy` as a fixed curriculum page.
- Add only a small learning-inactivity nudge to `/dashboard/academy`:
  - Detect the user's most recent completed lesson, quiz attempt, or `UserProgress.updatedAt`.
  - If there has been no learning activity for `LEARNING_NUDGE_IDLE_DAYS` days, show a compact banner.
  - Suggested default threshold: 7 days.
  - Banner copy: `You paused your learning path for X days. Continue where you left off.`
  - CTA: `Continue learning`.
  - CTA target: next incomplete lesson if available, otherwise `/dashboard/academy`.
  - Allow dismiss for the current session/day.
- Do not recommend unpublished/missing articles.

Verification:

- Repeated loss/streak test data produces at least one Academy lesson or article recommendation.
- When both exist, uncompleted Academy lesson is ranked first and supporting articles follow.
- Missing content does not break UI.
- Recommendation links route correctly.
- `/dashboard/academy` does not become a personalized recommendation feed.
- Learning inactivity nudge appears only for idle learners and stays hidden for recently active learners.

### Phase 3: Weekly Coach Report

Tasks:

- Add `weekly-action-plan.server.ts`.
- Generate `Weekly Coach Plan` from `TradingReport`, `TraderSignal`, and learning recommendations.
- Store `CoachActionPlan` or report JSON.
- Update `ReportView` to show `Weekly Coach Plan` and remove `Weekly Focus`.
- Remove `WeeklyFocus` component/render path and clean up imports.
- Delete `buildWeeklyInsights()` / `report-insights.service.ts` only if no other active feature imports it.
- Include mixed Academy lesson + article recommendations in `Study before next week`.
- Update report email template with one headline and one CTA.

Verification:

- Weekly report shows conclusion, keep-doing, biggest leak, next-week plan.
- `Weekly Focus` no longer renders on `/dashboard/reports/weekly`.
- No dead import/build warning remains from deleted Weekly Focus code.
- Weekly report includes a relevant study CTA when content exists.
- Email remains concise.
- No report crash for 0 trades.

### Phase 4: Smart Notifications

Tasks:

- Add notification builder service:
  - `src/lib/coach/coach-notifications.server.ts`
- Add cooldown checks.
- Create in-app notifications for high-value events.
- Email only where allowed by preferences.

Verification:

- Same signal does not spam notifications.
- Weekly report notification links to `/dashboard/reports`.
- Sync stale notification links to account sync troubleshooting.

### Phase 5: Public Trader Card 2.0

Tasks:

- Rebuild card style around current gold direction.
- Show top 3 pairs only.
- Ensure achievements come from real `UserBadge`.
- Add referral-aware CTA:
  - `/auth/signup?ref=<username-or-user-id>`
- Update OG image route.

Verification:

- `/trader/[username]` is readable mobile/desktop.
- No private user data leaks.
- Share CTA works.

### Phase 6: Admin Activation Inbox

Tasks:

- Extend `action-queue.server.ts` or add `activation-inbox.server.ts`.
- Create `AdminActivationInboxPanel`.
- Add actions: mark contacted, dismiss, admin note.
- Link to user detail.

Verification:

- Admin can see users by stuck stage.
- Admin can take a next action from the row.
- Dismissed items do not immediately reappear.

## Suggested Files

Add:

- `src/lib/coach/signal-types.ts`
- `src/lib/coach/signal-engine.server.ts`
- `src/lib/coach/next-action.server.ts`
- `src/lib/coach/lesson-recommendations.server.ts`
- `src/lib/coach/weekly-action-plan.server.ts`
- `src/lib/coach/coach-notifications.server.ts`
- `src/components/coach/NextBestActionPanel.tsx`
- `src/components/coach/RecommendedForYou.tsx`
- `src/components/coach/WeeklyCoachPlan.tsx`
- `src/components/admin/reports/AdminActivationInboxPanel.tsx`
- Optional: `src/components/academy/LearningResumeNudge.tsx` or equivalent lightweight nudge component for `/dashboard/academy`.

Modify:

- `prisma/schema.prisma`
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/DashboardClient.tsx`
- `src/app/dashboard/reports/page.tsx`
- `src/app/dashboard/academy/page.tsx`
- `src/components/reports/ReportView.tsx`
- `src/lib/services/report-generator.service.ts`
- `src/lib/services/report-insights.service.ts` only if still used; otherwise remove it with Weekly Focus cleanup.
- `src/lib/services/mistake-lessons.service.ts`
- `src/app/api/cron/generate-reports/route.ts`
- `src/app/trader/[username]/page.tsx`
- `src/components/profile/PublicProfileCard.tsx`
- `src/app/api/og/trader/[username]/route.tsx`
- `src/lib/admin/reports/action-queue.server.ts`

Remove if no longer imported:

- `WeeklyFocus` component/export.
- `buildWeeklyInsights()` and `src/lib/services/report-insights.service.ts` if Weekly Focus was the only consumer.
- Unused imports from `ReportView` after removing Weekly Focus.

## QA Checklist

Run:

```bash
npm run type-check
npm run lint
npm test
```

Playwright routes:

- `/dashboard`
- `/dashboard/accounts`
- `/dashboard/journal`
- `/dashboard/reports`
- `/dashboard/missions`
- `/dashboard/academy`
- `/dashboard/settings/referrals`
- `/trader/keeloren`
- `/admin/reports`
- `/admin/users`

Test personas:

1. Brand new verified user.
2. User completed onboarding but has no account.
3. User has account but no sync.
4. User has trades but no report.
5. User has repeated losses.
6. User has many BE trades.
7. User has no activity for 7 days.
8. Public profile user.
9. Admin user.

## Acceptance Criteria

- A new user always sees one clear next action.
- Reports include a conclusion and next-week plan.
- Learning recommendations come from trade data, not fake static data.
- Notifications do not spam.
- Email sends only for high-value events.
- Public trader card is more credible and private by default.
- Admin report/action queue tells admin what to do next.

## Notes For Claude

- Keep the current Edge system.
- Do not revive generic XP wording in user-facing UI.
- Do not add Risk Guardrails as a separate page/module.
- Do not send low-value daily emails.
- Do not expose private trading/account details on public pages.
- Build signal logic in shared services so dashboard, reports, notifications, and admin do not diverge.
