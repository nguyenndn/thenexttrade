# Dashboard Alert Orchestration And Weekly Review Gating Plan

## Goal

Fix the dashboard experience after a new user syncs trades for the first time, especially when the first sync imports historical data such as `Last Week`.

The dashboard must not show multiple competing alerts at the same time. Weekly Review prompts must appear only when the user has enough eligible trade data and should use the correct first-time vs returning-user copy.

## Problem

Observed on production/Vercel:

- User creates a new account.
- User adds a trading account.
- User syncs trades for the first time using TNT Connect `Last Week`.
- Dashboard shows too many messages at once:
  - `Generate your first Weekly Coach Plan`
  - `Your next step`
  - `No critical issues — keep it up! — Excellent Risk Management`
  - `Your weekly review is ready`

This feels noisy and contradictory.

The root problem is not one individual banner. The dashboard currently has several independent systems that all decide to show a message:

- Activation checklist.
- Coach signals / next best action.
- Weekly report nudge.
- Positive insight banner.
- First-session onboarding state.

These systems need one shared display policy.

## Desired UX

After a user's first successful sync, the dashboard should guide them to exactly one obvious next action.

Expected first-sync experience:

```text
Your first trades are synced.
Generate your first Weekly Review to understand your strengths, leaks, and next action.
CTA: Generate First Review
```

Do not show at the same time:

- `Generate your first Weekly Coach Plan`
- `Your weekly review is ready`
- `No critical issues — keep it up`
- duplicate activation prompts that lead to the same report action

## Core Product Rule

Dashboard top-of-page messaging should show a maximum of:

1. One primary action message.
2. One setup checklist/card only while the user is still activating.
3. No positive reassurance banner above core KPIs during first-sync / first-review state.

Positive insights are not urgent. They should not compete with activation or review CTAs.

## Message Priority

Use this priority order when deciding what to display near the top of the dashboard:

| Priority | Message Type | Example | Should Hide Lower Priority? |
| --- | --- | --- | --- |
| P0 | Critical sync/account issue | Account disconnected, sync stale, account error | Yes |
| P1 | First sync / first review activation | Generate First Review | Yes |
| P2 | Returning-user weekly review due | Your weekly review is ready | Yes for positive insight |
| P3 | Learning / academy recommendation | Start lesson based on weakness | No |
| P4 | Positive reassurance | No critical issues, keep it up | No, but should be low placement |

If P1 is active, hide P2/P4.

If P2 is active, hide P4.

## Weekly Review Eligibility

Weekly Review must not be shown simply because `weeklyReportCount === 0`.

Eligibility must be based on actual closed trade data dates and whether a report already exists for the relevant period.

### Required Data Points

Compute these for the current user and selected account if account filter exists:

| Field | Meaning |
| --- | --- |
| `closedTradeCount` | Count of closed trades eligible for review. |
| `firstClosedTradeDate` | Oldest eligible closed trade exit date. |
| `latestClosedTradeDate` | Latest eligible closed trade exit date. |
| `tradeDateSpanDays` | Days between first and latest eligible closed trade. |
| `weeklyReportCount` | Number of generated weekly reports. |
| `lastWeeklyReportPeriodEnd` | End date of latest weekly report. |
| `hasClosedTradesAfterLastReport` | Whether new closed trades exist after latest report period. |
| `hasPreviousWeekTrades` | Whether there are closed trades in the previous completed calendar week. |

Use `exitDate` for closed trade date. If `exitDate` is missing but status is `CLOSED`, fallback to `entryDate`.

### First-Time Weekly Review Rule

For users with no weekly report yet:

```ts
const isFirstWeeklyReview = weeklyReportCount === 0;

const showFirstWeeklyReview =
  isFirstWeeklyReview &&
  closedTradeCount > 0 &&
  (
    closedTradeCount >= 5 ||
    tradeDateSpanDays >= 5 ||
    hasPreviousWeekTrades
  );
```

Meaning:

- If user syncs `Last Week` and has enough historical trade data, show first review CTA.
- If user only synced 1-2 trades from today, do not show Weekly Review yet.
- If user has no closed trades, do not show Weekly Review.

### Returning User Weekly Review Rule

For users who already generated at least one weekly report:

```ts
const showReturningWeeklyReview =
  weeklyReportCount > 0 &&
  lastWeeklyReportPeriodEnd != null &&
  daysSince(lastWeeklyReportPeriodEnd) >= 7 &&
  hasClosedTradesAfterLastReport;
```

Meaning:

- Existing users should only get a weekly review nudge when there is new trade data after the last report.
- Do not show "It's been a while" if there are no new trades.
- Do not show a returning-user nudge to a brand-new user with zero reports.

### Copy Rules

First-time copy:

```text
Your first review is ready
We found enough synced trades to build your first Weekly Review. Generate it to see one strength, one leak, and one next action.
CTA: Generate First Review
```

Returning-user copy:

```text
Your weekly review is ready
You have new trade data since your last review. Generate the latest review to update your action plan.
CTA: Generate Review
```

Do not use:

```text
It's been a while since your last report
```

for users with `weeklyReportCount === 0`.

## Positive Insight Gating

The dashboard currently can show:

```text
No critical issues — keep it up!
Excellent Risk Management
```

This should not appear during first activation or first-review state.

Show positive insight only when:

```ts
const canShowPositiveInsight =
  weeklyReportCount > 0 ||
  closedTradeCount >= 20;
```

Also hide positive insight when:

- First weekly review CTA is active.
- Returning weekly review nudge is active.
- Critical sync/account warning is active.

Rationale:

- A new user who just synced data needs direction, not a broad verdict.
- `Excellent Risk Management` can feel misleading if the user has not generated a proper review yet.

## Coach Signal Gating

Current source:

- `src/lib/coach/signal-engine.server.ts`

The signal `NO_WEEKLY_REVIEW` currently appears when:

```ts
trades.length > 0 && countWeeklyReports === 0
```

This is too broad.

Update it to use the same first-time weekly review eligibility:

```ts
if (showFirstWeeklyReview) {
  signals.push({
    signalType: "NO_WEEKLY_REVIEW",
    severity: "MEDIUM",
    title: "Generate your first Weekly Review",
    summary: "You have enough synced trade data to generate your first review.",
    actionLabel: "Generate First Review",
    actionHref: "/dashboard/reports?type=weekly-review"
  });
}
```

If `showFirstWeeklyReview === false`, do not create `NO_WEEKLY_REVIEW`.

## Activation Checklist Gating

Current source:

- `src/lib/activation/activation.server.ts`
- `src/components/dashboard/ActivationChecklist.tsx`

The activation checklist can keep the weekly review step, but completion/readiness must be different concepts.

Recommended fields per activation step:

```ts
{
  id: "GENERATE_WEEKLY_REVIEW",
  title: "Generate your first weekly review",
  completed: weeklyReportCount > 0,
  available: showFirstWeeklyReview,
  disabledReason: "Sync more trades before your first weekly review is ready."
}
```

Behavior:

- If weekly review is not ready, do not make it the primary highlighted next action.
- If weekly review is ready, it can become the primary next action.
- If weekly review is not ready, next action should be Academy lesson, daily check-in, or another useful activation step.

Minimum implementation if changing `ActivationStep` type is too broad:

- Keep step visible but do not select it as `nextStep` unless `showFirstWeeklyReview === true`.
- Or hide this step until it is ready.

Preferred UX:

- Show completed prior steps.
- Show "Generate First Review" only when eligible.

### Known QA Bug: Duplicate Review CTA

After implementing weekly review eligibility, a duplicate CTA can still happen:

- `Report Nudge Card` shows `Your first review is ready`.
- `ActivationChecklist` also highlights `Generate your first weekly review` as `nextStep`.

This still violates the main product rule: one primary dashboard action at a time.

Expected behavior:

- If `weeklyReviewEligibility.ready === true`
- And `activationState.nextStep?.id === "GENERATE_WEEKLY_REVIEW"`
- And the dashboard is already rendering the first/returning weekly review nudge as the primary message
- Then hide the full `ActivationChecklist` for that render, or at minimum hide its highlighted next-step CTA.

Preferred fix in `src/app/dashboard/DashboardClient.tsx`:

```ts
const shouldHideActivationChecklistForPrimaryReview =
  weeklyReviewEligibility?.ready &&
  activationState.nextStep?.id === "GENERATE_WEEKLY_REVIEW";
```

Then guard checklist rendering:

```tsx
{activationState.completedCount < activationState.totalCount &&
  !suppress?.activationChecklist &&
  !shouldHideActivationChecklistForPrimaryReview && (
    <ActivationChecklist state={activationState} />
  )}
```

Alternative fix:

- Set `suppress.activationChecklist = true` server-side when first/returning review nudge is selected as the primary dashboard message.

Do not solve this by hiding the review nudge. The review nudge is the clearer primary action.

## Dashboard Display Orchestration

Current source:

- `src/app/dashboard/DashboardClient.tsx`
- `src/app/dashboard/dashboard-data.server.ts`

Create one server-side object, for example:

```ts
type DashboardMessageState = {
  primaryMessage: null | {
    id: string;
    priority: number;
    tone: "critical" | "warning" | "success" | "info";
    title: string;
    description: string;
    ctaLabel?: string;
    ctaHref?: string;
    dismissible?: boolean;
  };
  suppress: {
    activationChecklist?: boolean;
    reportNudge?: boolean;
    positiveInsight?: boolean;
    coachNudge?: boolean;
  };
  weeklyReview: {
    isFirstWeeklyReview: boolean;
    isReady: boolean;
    reason: "NO_TRADES" | "NOT_ENOUGH_DATA" | "READY_FIRST_REVIEW" | "READY_RETURNING_REVIEW" | "NO_NEW_TRADES_AFTER_LAST_REPORT";
  };
};
```

If adding a new type is too much, implement equivalent boolean flags in `dashboard-data.server.ts`.

### Recommended Display Logic

```ts
if (criticalSyncIssue) {
  primaryMessage = criticalSyncIssue;
  suppress.reportNudge = true;
  suppress.positiveInsight = true;
}
else if (showFirstWeeklyReview) {
  primaryMessage = firstWeeklyReviewMessage;
  suppress.reportNudge = true;
  suppress.positiveInsight = true;
  suppress.coachNudge = true;
}
else if (showReturningWeeklyReview) {
  primaryMessage = returningWeeklyReviewMessage;
  suppress.positiveInsight = true;
}
else {
  primaryMessage = nextBestActionOrNull;
}
```

Then in `DashboardClient.tsx`:

- Render `primaryMessage` once.
- Render report nudge only when `!suppress.reportNudge`.
- Render positive insight only when `!suppress.positiveInsight`.
- Render coach nudge only when `!suppress.coachNudge`.

## Helper Function To Add

Recommended file:

- `src/lib/reports/weekly-review-eligibility.ts`

Function:

```ts
export type WeeklyReviewEligibility = {
  isFirstWeeklyReview: boolean;
  firstReviewReady: boolean;
  returningReviewReady: boolean;
  ready: boolean;
  reason:
    | "NO_TRADES"
    | "NOT_ENOUGH_DATA"
    | "READY_FIRST_REVIEW"
    | "READY_RETURNING_REVIEW"
    | "NO_NEW_TRADES_AFTER_LAST_REPORT";
  closedTradeCount: number;
  firstClosedTradeDate: Date | null;
  latestClosedTradeDate: Date | null;
  tradeDateSpanDays: number;
  weeklyReportCount: number;
};

export async function getWeeklyReviewEligibility(params: {
  userId: string;
  accountId?: string;
  now?: Date;
}): Promise<WeeklyReviewEligibility>;
```

Use this helper in:

- `dashboard-data.server.ts`
- `activation.server.ts`
- `signal-engine.server.ts`
- report page if needed

Do not duplicate the eligibility rules in multiple files.

## Query Logic

Use `JournalEntry`:

- `userId`
- `accountId` if selected
- `status = CLOSED`
- `exitDate` or fallback `entryDate`

Use `TradingReport`:

- `userId`
- `type = WEEKLY`
- latest by `periodEnd desc`

Pseudo:

```ts
const closedTrades = await prisma.journalEntry.findMany({
  where: {
    userId,
    ...(accountId ? { accountId } : {}),
    status: "CLOSED",
  },
  select: {
    id: true,
    entryDate: true,
    exitDate: true,
  },
  orderBy: [
    { exitDate: "asc" },
    { entryDate: "asc" },
  ],
});

const latestWeeklyReport = await prisma.tradingReport.findFirst({
  where: { userId, type: "WEEKLY" },
  orderBy: { periodEnd: "desc" },
  select: { periodEnd: true },
});
```

Important:

- If `exitDate` is null, use `entryDate`.
- Filter out invalid dates.
- Use app timezone rules consistently with existing report generation if available.

## Previous Completed Week Logic

`hasPreviousWeekTrades` means:

- Previous calendar week is complete.
- There is at least one closed trade in that previous week.

For MVP, use server timezone or account timezone if available.

Simple implementation:

```ts
const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 });
const startOfPreviousWeek = subDays(startOfThisWeek, 7);
const endOfPreviousWeek = subMilliseconds(startOfThisWeek, 1);

hasPreviousWeekTrades = closedTradeDates.some((d) =>
  d >= startOfPreviousWeek && d <= endOfPreviousWeek
);
```

If date-fns is already in the project, use it. Otherwise use existing date utilities.

## Existing Code Paths To Update

### Dashboard Display

- `src/app/dashboard/DashboardClient.tsx`
- `src/app/dashboard/dashboard-data.server.ts`

Tasks:

- Add/use `weeklyReviewEligibility`.
- Replace current report nudge condition.
- Suppress positive insight when first-review CTA is active.
- Prevent duplicate coach/report/activation messages.

### Activation

- `src/lib/activation/activation.server.ts`

Tasks:

- Weekly review step should be available only when eligibility says ready.
- Do not make weekly review the next step when not enough trade data exists.

### Coach Signals

- `src/lib/coach/signal-engine.server.ts`
- `src/lib/coach/next-action.server.ts`

Tasks:

- Create `NO_WEEKLY_REVIEW` only when first weekly review is eligible.
- Returning review nudges should not be produced by `NO_WEEKLY_REVIEW`; that belongs to dashboard report nudge logic.

### Smart Insight

- `src/app/dashboard/dashboard-data.server.ts`
- `src/lib/smart-analytics.ts` if needed

Tasks:

- Suppress positive insight display during first-review state.
- Do not remove intelligence calculation entirely; only control dashboard placement/display.

## Acceptance Criteria

### New User, No Account

- No weekly review prompt.
- No positive `No critical issues` insight.
- Shows setup/onboarding CTA.

### New User, Account But No Trades

- No weekly review prompt.
- No positive `No critical issues` insight.
- Shows sync/log first trade CTA.

### New User, First Sync Today With 1-2 Trades

- No weekly review prompt.
- Shows dashboard metrics if data exists.
- Activation next action should be useful but not force weekly review.

### New User, First Sync Last Week With Enough Trades

- Shows exactly one primary CTA: `Generate First Review`.
- Does not show `Your weekly review is ready`.
- Does not show `Generate your first Weekly Coach Plan` separately.
- Does not show `No critical issues — keep it up`.
- Activation checklist should not duplicate the same CTA as a separate alert.
- If `ActivationChecklist.nextStep.id === GENERATE_WEEKLY_REVIEW`, hide the checklist or its highlighted CTA while the review nudge is visible.

### New User, First Sync Last Week But Only 1 Trade

- No weekly review prompt unless `tradeDateSpanDays >= 5`.
- No positive insight above KPIs.

### Existing User, Has Weekly Report, No New Trades

- No weekly review nudge.

### Existing User, Has Weekly Report, New Trades After Last Report And >= 7 Days

- Shows returning-user weekly review nudge.
- Copy says new trade data is available.
- Positive insight is suppressed while nudge is shown.

### Existing User, Critical Sync Issue

- Critical sync issue wins priority.
- Weekly review nudge hidden until sync issue resolved or deprioritized.

## QA Checklist

Test with Playwright on local and production-like data:

1. Fresh user with no account.
2. Fresh user with account but zero trades.
3. Fresh user syncing `Today`.
4. Fresh user syncing `Last Week`.
5. Fresh user syncing `Last Month`.
6. Existing user with latest weekly report less than 7 days ago.
7. Existing user with latest weekly report more than 7 days ago but no new trades.
8. Existing user with latest weekly report more than 7 days ago and new trades.
9. User with positive intelligence strengths but first weekly review not generated.
10. User with critical sync/account warning.

Visual checks:

- Top dashboard does not stack more than one alert for the same intent.
- Alert copy matches first-time vs returning-user state.
- Mobile layout remains compact.
- Dismiss button only appears on dismissible nudges.

## Suggested Event Tracking

Add/keep events:

- `weekly_review_first_ready_shown`
- `weekly_review_returning_ready_shown`
- `weekly_review_generate_clicked`
- `weekly_review_suppressed_not_enough_data`
- `dashboard_message_suppressed`

Useful metadata:

- `closedTradeCount`
- `tradeDateSpanDays`
- `weeklyReportCount`
- `reason`
- `accountId`
- `source: "dashboard"`

## What Not To Do

- Do not simply hide all alerts.
- Do not remove Activation Checklist.
- Do not treat `lastSync` alone as proof that Weekly Review is ready.
- Do not show `It's been a while` to users who never generated a report.
- Do not duplicate weekly review CTA in both Coach Plan and Report Nudge.
- Do not show positive "No critical issues" as the top alert for brand-new users.

## Implementation Order

1. Add `getWeeklyReviewEligibility`.
2. Use it in dashboard data loader.
3. Replace report nudge condition in `DashboardClient`.
4. Suppress positive insight when first/returning review CTA is active.
5. Update activation weekly-review next-step selection.
6. Update coach `NO_WEEKLY_REVIEW` signal condition.
7. Test all acceptance cases.
8. Update `docs/FEATURE_SPECS.md` dashboard section after implementation.

## Final Expected Outcome

After a first `Last Week` sync, the user sees a calm dashboard with one clear next action:

```text
Your first review is ready
Generate your first Weekly Review to understand your strengths, leaks, and next action.
```

The dashboard should feel guided, not noisy.
