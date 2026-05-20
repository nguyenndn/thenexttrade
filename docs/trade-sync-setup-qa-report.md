# Trade Sync Setup QA Report

Date: 2026-05-20
Final retest: 2026-05-20

Scope:
- `trade-sync-setup-optimization-plan.md`
- `/dashboard/accounts`
- TNT Connect app source under `apps/tnt-connect`
- EA source/downloads under `public/downloads`
- Sync APIs under `src/app/api/sync` and `src/app/api/ea`

## Current Summary

The user-facing Account Hub UI is working in authenticated Playwright testing. The single `Set up Trade Sync` button appears, the setup modal opens, TNT Connect and EA Sync download links are correct, TNT/EA sync badges render correctly, and no browser runtime errors were observed.

The backend sync-source issues from the previous pass are fixed.

The previous artifact blockers are also fixed. The EA `.ex5`, TNT Connect `.exe`, and `app-release.json` are now updated in this workspace, and `/api/app/version` returns the new TNT Connect version.

## Test Commands Run

```bash
npm run type-check
npx eslint src/components/trading-accounts/AccountListClient.tsx src/components/trading-accounts/AccountCard.tsx src/actions/accounts.ts src/app/api/sync src/app/api/ea
```

Authenticated Playwright smoke was also run with a temporary Supabase user and temporary trading accounts. The test opened `/dashboard/accounts`, verified TNT and EA sync badges, clicked `Set up Trade Sync`, and verified modal content and download links.

TNT Connect API smoke was run against `POST /api/sync/trades` with a temporary user, temporary `syncApiKey`, and temporary MT5 account.

Download smoke was run against:
- `/downloads/TheNextTrade_TradeSync.ex5`
- `/downloads/TheNextTradeConnect.exe`
- `/api/app/version`

## Passing Checks

- `/dashboard/accounts` is protected and redirects unauthenticated users to `/auth/login`.
- Authenticated `/dashboard/accounts` loads successfully.
- `Set up Trade Sync` button is visible.
- `Trade Sync Setup` modal opens successfully.
- Modal includes TNT Connect as the recommended option.
- Modal includes EA Sync as the advanced option.
- TNT Connect download link points to `/downloads/TheNextTradeConnect.exe`.
- EA Sync download link points to `/downloads/TheNextTrade_TradeSync.ex5`.
- Settings link points to `/dashboard/settings/tnt-connect`.
- Account card shows sync status text such as `Synced via TNT Connect`.
- Account card correctly shows `Synced via TNT Connect` for `syncSource: "APP"`.
- Account card correctly shows `Synced via EA Sync` for `syncSource: "EA_SYNC"`, even when `appLastHeartbeat` exists.
- `POST /api/sync/trades` now creates TNT Connect journal entries with `syncSource: "APP"`.
- `TheNextTrade_TradeSync.ex5` is rebuilt and available from the public download URL.
- `TheNextTradeConnect.exe` is rebuilt and available from the public download URL.
- `app-release.json` is updated to `1.0.1`.
- `/api/app/version` returns `1.0.1`.
- `npm run type-check` passes.
- ESLint has no errors.
- EA `.mq5` source no longer contains the old hardcoded API key or localhost URL.
- EA `.mq5` source uses:
  - `#property version "1.06"`
  - `InpApiKey = ""`
  - `InpApiUrl = "https://thenexttrade.com"`
  - TheNextTrade-facing user copy.

## Remaining Confirmed Bugs

No confirmed blocking bugs remain in this QA pass.

## Fixed Since Previous QA

### FIXED: BUG-001: EA compiled download was not rebuilt

Status: Passed retest

Evidence:

```text
TheNextTrade_TradeSync.mq5  LastWriteTime: 2026-05-20
TheNextTrade_TradeSync.ex5  LastWriteTime: 2026-05-20
GET /downloads/TheNextTrade_TradeSync.ex5  200, 62234 bytes
```

The compiled EA download is now fresh and served correctly.

### FIXED: BUG-002: TNT Connect executable and app release metadata are still old

Status: Passed retest

Evidence:

```text
TheNextTradeConnect.exe  LastWriteTime: 2026-05-20
app-release.json         LastWriteTime: 2026-05-20
app-release.json version: 1.0.1
GET /api/app/version     version: 1.0.1
GET /downloads/TheNextTradeConnect.exe  200, 33756446 bytes
```

The downloadable TNT Connect executable and version metadata are now updated.

### FIXED: BUG-003: TNT Connect imported journal entries are stored as `EA_SYNC`

Status: Passed retest

Retest evidence from API smoke:

```json
{
  "savedAccount": {
    "syncSource": "APP"
  },
  "entry": {
    "syncSource": "APP",
    "entryReason": "Synced from TNT Connect"
  }
}
```

`POST /api/sync/trades` now stores both the account and the journal entry with `syncSource: "APP"`.

### FIXED: BUG-004: Account sync method can be mislabeled after mixed EA/TNT usage

Status: Passed retest

Retest evidence:
- Authenticated Playwright created one `syncSource: "APP"` account and one `syncSource: "EA_SYNC"` account.
- UI rendered `Synced via TNT Connect` once and `Synced via EA Sync` once.
- No page runtime errors.

`AccountCard.tsx` uses both `lastHeartbeat` and `appLastHeartbeat`, but `lastHeartbeat` is also updated by TNT Connect heartbeat.

Current improved logic:

```ts
if (source === "APP") return { label: "Synced via TNT Connect", variant: "tnt" };
if (source === "EA_SYNC" || source === "EA_HISTORY") return { label: "Synced via EA Sync", variant: "ea" };
```

## Cleanup / Warnings

These are not release blockers, but should be cleaned up.

### WARN-001: ESLint warnings remain

ESLint result after retest: 0 errors, 10 warnings.

The previous `AccountListClient.tsx` unused import/parameter warnings are now gone. Remaining warnings are in account actions and sync/EA API files.

### WARN-002: Legacy tour id remains on the new setup button

The new `Set up Trade Sync` button still has:

```tsx
id="onborda-ea-download"
```

Recommendation:
- Rename to something like `onborda-trade-sync-setup`.
- Update any tour/test references if needed.

### WARN-003: Type interface does not include all account sync fields

`AccountListClient.tsx` account type does not explicitly include all fields used by `AccountCard`, such as:
- `syncSource`
- `appLastHeartbeat`
- `eaVersion`
- `useForLeaderboard`
- `eligibility`
- `eaAccess`

This currently works because `AccountCard` accepts `account: any`, but it weakens type safety.

Recommendation:
- Add a shared `TradingAccountViewModel` type for Account Hub UI.

## Final QA Status

Ready from the web-app QA side.

Remaining manual check:
- Install the rebuilt EA `.ex5` in MT5 once and confirm the input defaults and panel branding inside MetaTrader.
