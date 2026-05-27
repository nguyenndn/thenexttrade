# First Session Onboarding Wizard Implementation Plan

Last updated: 2026-05-27

## Goal

Build a focused first-session activation wizard that helps a new user know exactly what to do in the first 5 minutes:

1. Connect an MT5 account.
2. Choose a sync path.
3. Bring in the first trade data or log the first trade manually.
4. Open the dashboard with useful data.

This is not a marketing page and not a second profile onboarding flow. It is a lightweight activation assistant that connects the existing `/onboarding`, `/dashboard`, `/dashboard/accounts`, Trade Sync Wizard, and Journal flows.

## Current System Context

The product already has these pieces:

- `/onboarding`
  - 4-step profile and preference wizard.
  - Stores state in `User.settings.onboarding`.
  - Captures `tradingGoal` and `preferredSyncMethod`.
  - Final CTA redirects to Account Hub or Journal.

- `/dashboard`
  - Shows dashboard metrics.
  - Has `ActivationChecklist`.
  - Has coach/action nudges.

- `/dashboard/accounts`
  - Handles account setup.
  - Query params already supported:
    - `?action=add`
    - `?setup=sync`
    - `?setup=sync&method=tnt`
    - `?setup=sync&method=ea`
  - Has `AddAccountModal`.
  - Has `TradeSyncWizard`.

- `/dashboard/journal`
  - Manual trade logging entry point.

The new wizard should orchestrate these existing pieces instead of rebuilding account add, sync setup, or manual journal UI.

## Product Definition

### What The Wizard Is

The First Session Onboarding Wizard is a modal or compact overlay shown to users who have not reached first value yet.

First value means:

- User has at least one trading account, and
- User has either synced at least one trade or logged at least one trade manually.

### What The Wizard Is Not

- Do not rebuild profile setup.
- Do not ask for username, avatar, country, or bio again.
- Do not duplicate the Add Account modal.
- Do not duplicate the Trade Sync Wizard.
- Do not add a new database table for V1.
- Do not force every existing active user through it.
- Do not show a large persistent banner above the dashboard after the user dismisses it.

## User Segments

| User State | Wizard Behavior |
| --- | --- |
| New verified user, no account | Show wizard on first dashboard visit and guide to Add Account. |
| User skipped `/onboarding`, no account | Show wizard because setup is incomplete. |
| User has account, no sync/trade data | Start from sync method / first data step. |
| User selected Manual Journal | Skip sync install explanation and guide to log first trade. |
| User already has account and trades | Do not auto-show. Mark first session complete quietly. |
| Existing active user | Do not interrupt. Keep optional launcher only if setup is incomplete. |

## State Model

Use the existing `User.settings.onboarding` JSON object. No Prisma migration is required for V1.

Extend the existing onboarding settings with:

```ts
type FirstSessionStep =
  | "CONNECT_ACCOUNT"
  | "CHOOSE_SYNC_METHOD"
  | "BRING_FIRST_DATA"
  | "REVIEW_DASHBOARD";

type FirstSessionWizardState = {
  currentStep?: FirstSessionStep;
  selectedAccountId?: string;
  selectedSyncMethod?: "TNT_CONNECT" | "EA_SYNC" | "MANUAL";
  startedAt?: string;
  lastShownAt?: string;
  dismissedUntil?: string;
  completedAt?: string;
};

type OnboardingSettings = {
  lastCompletedStep?: number;
  tradingGoal?: string;
  preferredSyncMethod?: "TNT_CONNECT" | "EA_SYNC" | "MANUAL";
  completedAt?: string;
  skippedAt?: string;
  firstSession?: FirstSessionWizardState;
};
```

Important:

- Reuse `preferredSyncMethod` when available.
- Store wizard-specific state inside `onboarding.firstSession`.
- Preserve all existing user settings when updating JSON.
- Never overwrite unrelated settings such as admin notes, UI preferences, or notification preferences.

## State Engine

Create:

`src/lib/onboarding/first-session.server.ts`

Suggested API:

```ts
export type FirstSessionComputedState = {
  shouldAutoOpen: boolean;
  isCompleted: boolean;
  currentStep: "CONNECT_ACCOUNT" | "CHOOSE_SYNC_METHOD" | "BRING_FIRST_DATA" | "REVIEW_DASHBOARD";
  preferredSyncMethod: "TNT_CONNECT" | "EA_SYNC" | "MANUAL";
  accountCount: number;
  tradeCount: number;
  hasSyncActivity: boolean;
  selectedAccountId?: string;
  nextHref: string;
  nextLabel: string;
};

export async function getFirstSessionState(userId: string): Promise<FirstSessionComputedState>;
export async function updateFirstSessionSettings(userId: string, patch: Partial<FirstSessionWizardState>): Promise<void>;
export async function dismissFirstSessionWizard(userId: string): Promise<void>;
export async function completeFirstSessionWizard(userId: string): Promise<void>;
```

### Computation Rules

1. Load user settings.
2. Count trading accounts.
3. Count journal entries.
4. Check sync activity from trading accounts:
   - `lastSync`
   - `lastHeartbeat`
   - `appLastHeartbeat`
   - `syncSource`
   - `totalTrades > 0`
5. Determine the current step:

| Condition | Step |
| --- | --- |
| `accountCount === 0` | `CONNECT_ACCOUNT` |
| `accountCount > 0` and no preferred sync method | `CHOOSE_SYNC_METHOD` |
| `accountCount > 0` and `tradeCount === 0` | `BRING_FIRST_DATA` |
| `tradeCount > 0` | `REVIEW_DASHBOARD` |

6. Mark completed quietly when:
   - `tradeCount > 0`, or
   - `firstSession.completedAt` exists.

7. Auto-open only when:
   - User is not completed.
   - User has not dismissed until a future time.
   - User is on `/dashboard`.
   - User is not an existing active user with historical data.

### Dismiss Rules

Use a soft dismiss:

- Button text: `Remind me later`.
- Store `dismissedUntil` as current time + 24 hours.
- Do not use `skippedAt` for first-session dismiss, because skipped profile onboarding and skipped activation wizard are different concepts.

Optional secondary action:

- `Do not show again` can set `completedAt`, but keep this out of V1 unless product explicitly wants it.

## User-Facing Flow

### Step 1: Connect Account

Shown when user has no trading account.

Copy:

- Title: `Connect your first MT5 account`
- Description: `Add your account number so TheNextTrade can organize your trades, sync history, and build your dashboard.`
- Primary CTA: `Add Account`
- Secondary CTA: `I want to log manually`

CTA behavior:

- `Add Account` links to `/dashboard/accounts?action=add&source=first-session`.
- `I want to log manually` saves `preferredSyncMethod = "MANUAL"` and links to `/dashboard/journal?action=log-trade&source=first-session`.

### Step 2: Choose Sync Method

Shown when account exists but sync path is not clear.

Copy:

- Title: `Choose how trades get into your journal`
- Description: `Pick the setup that matches how you use MT5. You can change this later.`

Options:

| Method | Label | Description | CTA |
| --- | --- | --- | --- |
| TNT Connect | Recommended | Best for Windows MT5 users. Sync selected periods from the desktop app. | `Set up TNT Connect` |
| EA Sync | Advanced | Best for VPS or continuous chart-based sync. | `Set up EA Sync` |
| Manual Journal | Manual | Best if you want to test the journal before installing anything. | `Log manually` |

CTA behavior:

- TNT: save preference, route to `/dashboard/accounts?setup=sync&method=tnt&source=first-session`.
- EA: save preference, route to `/dashboard/accounts?setup=sync&method=ea&source=first-session`.
- Manual: save preference, route to `/dashboard/journal?action=log-trade&source=first-session`.

### Step 3: Bring First Data

Shown when account exists but there are no trades yet.

Copy changes by method:

- TNT Connect:
  - Title: `Sync your first trades`
  - Description: `Open TNT Connect, paste your Sync API Key, then sync Today or Last Week.`
  - CTA: `Open Sync Setup`

- EA Sync:
  - Title: `Verify EA Sync`
  - Description: `Attach the EA to MT5, paste your Sync API Key, and confirm the heartbeat.`
  - CTA: `Open EA Setup`

- Manual:
  - Title: `Log your first trade`
  - Description: `One trade is enough to unlock the first useful dashboard and review flow.`
  - CTA: `Log First Trade`

CTA behavior:

- TNT: `/dashboard/accounts?setup=sync&method=tnt&source=first-session`
- EA: `/dashboard/accounts?setup=sync&method=ea&source=first-session`
- Manual: `/dashboard/journal?action=log-trade&source=first-session`

### Step 4: Review Dashboard

Shown after first trade exists.

Copy:

- Title: `Your dashboard is ready`
- Description: `You can now review win rate, P/L, symbols, reports, and next actions from real trade data.`
- Primary CTA: `Open Dashboard`
- Secondary CTA: `Generate Weekly Review` if enough trade data exists.

CTA behavior:

- `Open Dashboard`: mark wizard completed and route `/dashboard`.
- `Generate Weekly Review`: mark wizard completed and route `/dashboard/reports/weekly`.

## UI Requirements

Create:

- `src/components/onboarding/FirstSessionWizard.tsx`
- `src/components/onboarding/FirstSessionLauncher.tsx`
- Optional: `src/components/onboarding/FirstSessionStepCard.tsx`

### Modal Layout

- Max width: 640-720px.
- Mobile: full-screen sheet or near full-width dialog.
- Use gold visual language, but keep it calm and professional.
- Top progress indicator:
  - `Account`
  - `Sync`
  - `First Data`
  - `Review`
- One primary CTA per step.
- One secondary action max per step.
- Include `Remind me later` in the footer.
- Add a small support link:
  - `Need help? Open setup guide`
  - Link to `/get-started` or `/dashboard/accounts`.

### Dashboard Surface

Do not place a large banner above KPI cards.

Use a compact launcher if the wizard is incomplete:

- Location: near existing activation checklist or inside `WelcomeHero` right side.
- Title: `Finish setup`
- Subtitle: dynamic:
  - `Add your first account`
  - `Choose your sync method`
  - `Sync or log your first trade`
- CTA: `Continue`

The compact launcher opens the wizard modal.

## Route Integration

### `/dashboard`

Update:

- `src/app/dashboard/page.tsx`
- `src/app/dashboard/DashboardClient.tsx`

Server should fetch:

- `activationState`
- `firstSessionState`

Client should:

- Auto-open wizard if `firstSessionState.shouldAutoOpen === true`.
- Open wizard if URL contains `?onboarding=1` or `?firstSession=1`.
- Show compact launcher when incomplete and not auto-opened.

### `/dashboard/accounts`

Existing query support is good. Add source awareness only if needed:

- `source=first-session`

Expected behavior:

- `?action=add&source=first-session` opens Add Account modal.
- After successful add, if `source=first-session`, show a toast:
  - `Account added. Next: choose a sync method.`
- Optionally route back to `/dashboard?firstSession=1` after add success.

Do not duplicate Add Account UI in the first-session modal.

### `/dashboard/journal`

If `?action=log-trade&source=first-session`, open the manual trade form if that behavior already exists. If not, add support separately in Journal.

After the first manual trade is saved:

- Mark first-session step as `REVIEW_DASHBOARD`.
- Show success toast:
  - `First trade logged. Your dashboard is ready.`

## Server Actions

Create:

`src/actions/first-session-onboarding.ts`

Suggested actions:

```ts
export async function saveFirstSessionSyncMethodAction(method: "TNT_CONNECT" | "EA_SYNC" | "MANUAL");
export async function dismissFirstSessionWizardAction();
export async function completeFirstSessionWizardAction();
```

Rules:

- Require authenticated user.
- Preserve existing settings.
- Revalidate `/dashboard`, `/dashboard/accounts`, and `/dashboard/journal` as needed.
- Track analytics events where available.

## Analytics Events

Use existing `trackEvent` client helper where possible.

Events:

| Event | When |
| --- | --- |
| `first_session_wizard_shown` | Wizard auto-opens or user opens launcher. |
| `first_session_step_viewed` | Step changes. |
| `first_session_cta_clicked` | Primary CTA clicked. Include `step` and `href`. |
| `first_session_sync_method_selected` | User selects TNT, EA, or Manual. |
| `first_session_wizard_dismissed` | User clicks Remind me later. |
| `first_session_wizard_completed` | User reaches review step and opens dashboard/report. |

## Copy Reference

### Header

`Set up your trading workspace`

Subcopy:

`One account, one sync path, and one useful dashboard. This takes a few minutes.`

### Step Labels

- `Account`
- `Sync`
- `First Data`
- `Review`

### Empty/Blocked States

When no account:

`You need at least one MT5 account before trade sync can work.`

When account exists but no trades:

`Your account is connected, but there is no trade data yet. Sync history or log one trade manually.`

When manual path selected:

`Manual journal is fine for starting. You can set up TNT Connect or EA Sync later from Account Hub.`

## Edge Cases

| Edge Case | Expected Behavior |
| --- | --- |
| User completed `/onboarding` but never added account | Show first-session wizard at Connect Account. |
| User skipped `/onboarding` | Show first-session wizard; default sync method to TNT Connect. |
| User has account but deleted all trades | Show Bring First Data, not Connect Account. |
| User has multiple accounts | Use main account if available; otherwise first account. |
| User uses Manual Journal | Do not nag about TNT/EA in first-session wizard. |
| User dismisses wizard | Do not show again for 24 hours. Compact launcher can remain visible. |
| Existing user with trades | Do not auto-open. Mark completed quietly. |
| Mobile user | Wizard should still offer Manual Journal and explain that MT5 auto-sync needs desktop/VPS. |

## Implementation Tasks

### Task 1: Add First-Session State Helper

Files:

- `src/lib/onboarding/first-session.server.ts`

Build `getFirstSessionState(userId)` and JSON update helpers.

Verify:

- New user with no accounts returns `CONNECT_ACCOUNT`.
- User with account and no trades returns `BRING_FIRST_DATA`.
- User with trades returns completed.

### Task 2: Add Server Actions

Files:

- `src/actions/first-session-onboarding.ts`

Add actions for:

- Save sync method.
- Dismiss for 24 hours.
- Complete wizard.

Verify:

- Actions preserve existing `User.settings`.
- Actions revalidate the correct pages.

### Task 3: Build Wizard UI

Files:

- `src/components/onboarding/FirstSessionWizard.tsx`
- `src/components/onboarding/FirstSessionLauncher.tsx`

Build modal UI and compact launcher.

Verify:

- Step copy changes correctly.
- Primary CTA routes correctly.
- Dismiss closes modal and persists.
- Mobile layout has no horizontal overflow.

### Task 4: Integrate Dashboard

Files:

- `src/app/dashboard/page.tsx`
- `src/app/dashboard/DashboardClient.tsx`

Fetch first-session state and pass it to client.

Verify:

- `/dashboard?firstSession=1` opens wizard.
- Incomplete new user auto-opens wizard once.
- Activated user does not see the wizard.

### Task 5: Integrate Account Hub Return Path

Files:

- `src/components/trading-accounts/AccountListClient.tsx`

Respect `source=first-session` query where useful.

Verify:

- `/dashboard/accounts?action=add&source=first-session` opens Add Account.
- `/dashboard/accounts?setup=sync&method=tnt&source=first-session` opens TNT setup.
- `/dashboard/accounts?setup=sync&method=ea&source=first-session` opens EA setup.

### Task 6: Integrate Manual Journal Path

Files:

- `src/app/dashboard/journal/*`
- relevant Journal client component.

Add or verify support for:

- `/dashboard/journal?action=log-trade&source=first-session`

Verify:

- Manual trade form opens.
- After save, first-session state progresses to review/dashboard-ready.

### Task 7: Add Analytics

Files:

- Wizard component.
- CTA handlers.

Verify:

- Events fire once per user action.
- No duplicate analytics events from auto-open re-renders.

### Task 8: QA With Playwright

Run these cases:

1. New user, no accounts:
   - Visit `/dashboard`.
   - Wizard opens at Connect Account.
   - Add Account CTA points to `/dashboard/accounts?action=add&source=first-session`.

2. User has account, no trades:
   - Visit `/dashboard`.
   - Wizard starts at Bring First Data or Choose Sync Method depending on saved preference.

3. User selects TNT:
   - CTA opens `/dashboard/accounts?setup=sync&method=tnt&source=first-session`.

4. User selects EA:
   - CTA opens `/dashboard/accounts?setup=sync&method=ea&source=first-session`.

5. User selects Manual:
   - CTA opens `/dashboard/journal?action=log-trade&source=first-session`.

6. User has at least one trade:
   - Wizard does not auto-open.
   - Compact launcher is hidden or shows completed state.

7. Dismiss:
   - Click `Remind me later`.
   - Refresh dashboard.
   - Wizard does not auto-open again within 24 hours.

8. Mobile:
   - Test 390x844.
   - Modal is readable.
   - CTA buttons do not overflow.

## Acceptance Criteria

- A new user can understand the next action within 5 seconds on first dashboard visit.
- The wizard never asks profile questions already handled by `/onboarding`.
- The wizard reuses Account Hub, Add Account modal, Trade Sync Wizard, and Journal.
- Existing active users are not interrupted.
- Dismiss behavior prevents repeated popups.
- TNT Connect, EA Sync, and Manual Journal are all supported paths.
- No new Prisma migration is required for V1.
- Playwright passes all QA cases above.

## Recommended Release Scope

V1 should include:

- First-session state engine.
- Dashboard modal and compact launcher.
- Links into Account Hub / Journal.
- Dismiss and completed state.
- Basic analytics events.

Do not include in V1:

- Email reminders.
- Admin intervention queue.
- Full mobile-only auto sync.
- New database tables.
- In-app live sync status polling beyond what Trade Sync Wizard already supports.

