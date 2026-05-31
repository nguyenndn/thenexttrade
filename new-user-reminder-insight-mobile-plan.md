# New User Reminder, First Insight, Mobile Fallback Plan

## Goal

Improve the new-user path after onboarding without adding more heavy onboarding UI:

1. Light reminders for users stuck before first value.
2. A stronger first insight moment after the first synced/logged trade.
3. A mobile fallback for users who cannot sync MT5 from phone.

Sample/demo dashboard is intentionally out of scope for this plan.

## Current Baseline

Already shipped:

- `/onboarding` collects profile, goal, and preferred sync method.
- `/dashboard` has First Session Wizard, compact setup launcher, 24h first-data reminder, and first-sync success modal.
- `/dashboard/accounts` can deep-link sync setup with `?setup=sync&method=tnt|ea`.
- `/dashboard/journal` can deep-link manual trade logging with `?action=log-trade`.
- `TraderSignal`, `Notification`, and `/admin/reports` already exist.
- `/admin/reports` has a partial funnel: `New Users -> Connected -> First Trade -> Weekly Review -> Pro Request -> Pro Active`.

Definitions:

- **First value**: user has at least one `TradingAccount` and at least one `JournalEntry` or account `totalTrades > 0`.
- **First insight viewed**: user has first trade data and has seen/dismissed the first insight success moment.
- **Mobile sync fallback**: user on mobile chooses TNT Connect or EA Sync, but cannot complete desktop/VPS sync from that device.

## Workstream 1: Light Stuck-User Reminders

### Product Rules

- In-app reminder first. Email is backup only.
- Never interrupt users who already reached first value.
- Never send more than two activation emails in the first 7 days after verification.
- Respect product email preferences.
- Do not duplicate reminders if the user already dismissed one recently.

Reminder states:

| State | Condition | Primary CTA |
| --- | --- | --- |
| `NO_ACCOUNT_24H` | verified user, 24h old, no `TradingAccount` | `/dashboard/accounts?action=add&source=activation-reminder` |
| `NO_FIRST_DATA_24H` | has account, 24h old, no trade data | preferred sync/manual CTA |
| `STILL_NO_FIRST_VALUE_72H` | verified 72h ago and still no first value | preferred sync/manual CTA |
| `MOBILE_SYNC_FALLBACK` | mobile user chose TNT/EA but did not sync | send desktop setup link or log manually |

### Data And State

Use `User.settings.onboarding.activationReminders` for V1. Do not add a migration unless a send-log table already exists and is clearly reusable.

Suggested shape:

```ts
type ActivationReminderState = {
  sent: Array<{
    type: "NO_ACCOUNT_24H" | "NO_FIRST_DATA_24H" | "STILL_NO_FIRST_VALUE_72H" | "MOBILE_SYNC_FALLBACK";
    sentAt: string;
    channel: "in_app" | "email";
    idempotencyKey: string;
  }>;
  dismissedUntil?: string;
  lastEmailSentAt?: string;
};
```

Also continue using:

- `User.settings.onboarding.firstSession.firstDataReminderDismissedUntil`
- `TraderSignal.metadata.notificationSentAt`
- `Notification` table for in-app reminders

### Implementation Tasks

- [ ] Create `src/lib/onboarding/activation-reminder-state.ts`.
  - Expose `getActivationReminderState(userId)`, `appendActivationReminderSend(userId, send)`, `dismissActivationReminder(userId, until)`.
  - Verify: unit/manual call returns stable JSON and preserves unrelated `User.settings`.

- [ ] Create `src/lib/onboarding/activation-reminders.server.ts`.
  - Computes eligible users for each reminder state.
  - Uses first value definition.
  - Uses email cap: max 2 activation emails within 7 days.
  - Verify: seed/test users in each state return exactly one reminder candidate.

- [ ] Add cron route `src/app/api/cron/activation-reminders/route.ts`.
  - Use existing `requireCronSecret(request)`.
  - Default to dry summary in development when no SMTP is configured.
  - Sends in-app `Notification` first.
  - Sends email only when eligible and product email preference allows.
  - Verify: unauthorized request blocked when `CRON_SECRET` is set; authorized request returns counts by state.

- [ ] Add email builders in `src/lib/emails/activation-reminders.ts`.
  - Templates:
    - `no-account-24h`
    - `no-first-data-24h`
    - `still-no-first-value-72h`
    - `mobile-desktop-setup-link`
  - Each template has one CTA, plain text fallback, and unsubscribe/preferences footer.
  - Verify: generated HTML contains no raw API key, no MT5 account number, no sensitive broker data.

- [ ] Extend `/admin/reports` data to show reminder health.
  - Add counts: eligible reminders, sent today, email capped, dismissed, first-value reached after reminder.
  - Add to Action Queue if many users are stuck after 72h.
  - Verify: `/admin/reports` shows reminder state without crashing on empty data.

### QA Checklist

- [ ] New verified user under 24h, no account: no email reminder.
- [ ] Verified user over 24h, no account: one in-app/email reminder candidate.
- [ ] User with account over 24h, no trade: first-data reminder candidate uses preferred method.
- [ ] User over 72h, still no first value: 72h reminder candidate.
- [ ] User with first trade: no activation reminder.
- [ ] Product emails disabled: in-app only, no email.
- [ ] Reminder already sent twice in 7 days: no more activation email.
- [ ] Admin report shows counts and last reminder state.

## Workstream 2: First Insight Moment

### Product Rules

After the first synced or manually logged trade, show one compact success moment that answers:

- What changed?
- What can I see now?
- What should I do next?

Do not just say "success". Give a real first insight from the available trade data.

### Insight Priority

Use the first available insight in this order:

1. `trade_count`: "You synced/logged X trades."
2. `net_pnl`: "Your imported period is +$X / -$X."
3. `win_rate`: only if there are decisive closed trades.
4. `top_symbol`: most traded symbol.
5. `session_hint`: if session data exists.

Keep the modal readable. Do not show more than three facts.

### Data And State

Use existing `User.settings.onboarding.firstSession`:

```ts
type FirstSessionWizardState = {
  firstSyncCelebratedAt?: string;
  firstInsightViewedAt?: string;
  firstInsightPrimaryCta?: string;
};
```

`firstSyncCelebratedAt` can remain backward-compatible. New code should prefer `firstInsightViewedAt` when deciding whether to show the insight.

### Implementation Tasks

- [ ] Create `src/lib/onboarding/first-insight.server.ts`.
  - Function: `getFirstInsightPayload(userId)`.
  - Returns `{ shouldShow, facts, primaryCta, secondaryCta }`.
  - Verify: zero trades returns `shouldShow: false`; first trade returns payload.

- [ ] Update `src/lib/onboarding/first-session.server.ts`.
  - Include first insight payload in computed state or call the new helper from dashboard loader.
  - Show only when first value exists and no `firstInsightViewedAt`.
  - Verify: existing users with `firstSyncCelebratedAt` do not see duplicate modal.

- [ ] Rebuild `src/components/onboarding/FirstSyncSuccessModal.tsx` into a "First Insight" modal.
  - Title example: `Your first insight is ready`.
  - Facts section: max three compact stat rows.
  - Primary CTA: `View my first insight` -> route based on best next action.
  - Secondary CTA: `Generate first review` if no report exists.
  - Tertiary/dismiss: `Continue to dashboard`.
  - Verify: desktop and mobile modal is compact and no text wraps awkwardly.

- [ ] Update `src/actions/first-session-onboarding.ts`.
  - Rename/add action to mark first insight viewed.
  - Persist `firstInsightViewedAt` and keep `firstSyncCelebratedAt` for compatibility.
  - Track event `first_insight_viewed` and `first_insight_cta_clicked`.
  - Verify: refresh after dismiss does not show modal again.

- [ ] Add `/admin/reports` funnel stage `First Insight Viewed`.
  - Count users with `firstSession.firstInsightViewedAt` or `firstSyncCelebratedAt`.
  - Show drop-off from `First Trade Data -> First Insight Viewed`.
  - Verify: admin funnel changes when state is set.

### QA Checklist

- [ ] User with zero trades never sees First Insight modal.
- [ ] User syncs/logs first trade and sees modal once.
- [ ] Modal includes real trade facts, not placeholder text.
- [ ] Primary CTA routes to useful page.
- [ ] Dismiss persists and does not repeat after reload.
- [ ] Existing user with old `firstSyncCelebratedAt` does not see duplicate.
- [ ] Admin funnel counts First Insight Viewed.

## Workstream 3: Mobile Fallback

### Product Rules

Be honest. MT5 auto-sync requires desktop/VPS today.

When mobile user chooses TNT Connect or EA Sync:

- Explain that setup requires Windows desktop/VPS with MT5.
- Offer `Send setup link to desktop email`.
- Offer `Log manually for now`.
- Keep `Continue anyway` for users on remote desktop/VPS from mobile.

Do not imply mobile can auto-sync directly until a real broker/API integration exists.

### Detection

Use client-side viewport/user-agent detection in UI, not only server-side detection.

Suggested helper:

- `src/lib/device.ts` or component-local hook `useIsMobileSyncDevice()`
- Mobile when `window.innerWidth < 768` or UA matches iPhone/Android/iPad.

Store fallback state in `User.settings.onboarding.mobileSyncFallback`:

```ts
type MobileSyncFallbackState = {
  method: "TNT_CONNECT" | "EA_SYNC";
  firstSeenAt: string;
  lastSeenAt: string;
  desktopLinkSentAt?: string;
  manualFallbackClickedAt?: string;
  continuedAnywayAt?: string;
};
```

### Implementation Tasks

- [ ] Add mobile fallback UI to `/onboarding` sync-path step.
  - If mobile + TNT/EA selected, show a compact warning block before final CTA.
  - Verify: mobile viewport shows fallback; desktop does not.

- [ ] Add mobile fallback UI to `FirstSessionWizard`.
  - When user chooses TNT/EA on mobile, show fallback actions before routing to setup.
  - Verify: mobile user can choose `Send setup link`, `Log manually`, or `Continue anyway`.

- [ ] Add mobile fallback UI to `TradeSyncWizard`.
  - If opened on mobile with TNT/EA, show fallback at top of Prepare/Connect step.
  - Verify: direct URL `/dashboard/accounts?setup=sync&method=tnt` on mobile shows honest copy.

- [ ] Add action `sendDesktopSetupLinkAction(method, source)`.
  - Sends setup link email to user's account email.
  - Links:
    - TNT: `/dashboard/accounts?setup=sync&method=tnt&source=desktop-link`
    - EA: `/dashboard/accounts?setup=sync&method=ea&source=desktop-link`
  - Persist `desktopLinkSentAt`.
  - Verify: action is auth-protected and sends only to current user email.

- [ ] Add manual fallback action.
  - CTA routes to `/dashboard/journal?action=log-trade&source=mobile-fallback`.
  - Persist `manualFallbackClickedAt`.
  - Verify: manual route opens correctly and admin can see fallback state.

- [ ] Track events.
  - `mobile_sync_fallback_viewed`
  - `mobile_sync_desktop_link_sent`
  - `mobile_sync_manual_fallback_clicked`
  - `mobile_sync_continue_anyway_clicked`
  - Verify: events appear in internal analytics without sensitive payloads.

- [ ] Add `/admin/reports` visibility.
  - Count mobile fallback users.
  - Add action queue item if many mobile users choose sync but never reach first value.
  - Verify: admin can identify the stuck segment.

### QA Checklist

- [ ] Desktop TNT setup: no mobile fallback shown.
- [ ] Mobile TNT setup: fallback shown.
- [ ] Mobile EA setup: fallback shown.
- [ ] Send desktop setup link works and persists timestamp.
- [ ] Log manually routes to Journal.
- [ ] Continue anyway opens normal sync instructions.
- [ ] Events are tracked.
- [ ] Admin reports include mobile fallback count.

## Final Verification

- [ ] `npm run type-check`
- [ ] `npm run lint`
- [ ] Playwright desktop:
  - new user no account
  - account no trades
  - first trade synced/logged
  - first insight dismissed and refresh
- [ ] Playwright mobile 390x844:
  - onboarding sync method TNT
  - Account Hub TNT setup
  - Account Hub EA setup
  - manual fallback route
- [ ] Cron/API:
  - unauthorized cron blocked with `CRON_SECRET`
  - dev dry-run returns counts
  - reminders do not duplicate
- [ ] Admin:
  - `/admin/reports` loads
  - activation funnel includes First Insight Viewed
  - mobile fallback count visible
  - reminder counts visible

## Done When

- New users get gentle reminders without email spam.
- First trade data creates a clear "aha" moment.
- Mobile users understand sync limitations and still have a path forward.
- Admin can see which users are stuck in reminder, first insight, or mobile fallback states.
- No sample/demo dashboard work is included.
