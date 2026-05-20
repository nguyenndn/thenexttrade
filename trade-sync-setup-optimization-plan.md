# Trade Sync Setup Optimization Plan

## Goal

Rebuild the `dashboard/accounts` sync setup experience so users clearly understand the recommended sync path, while hardening both sync packages before release:

- TNT Connect = recommended path for most users.
- EA Sync = advanced/alternative path for MT5 users who prefer attaching an EA to a chart.
- Remove unsafe defaults from the EA source/package.
- Make sync status and setup instructions clearer inside Account Hub.

## Current State

### User-facing entry point

Current file:

- `src/components/trading-accounts/AccountListClient.tsx`

Current UI shows two separate download buttons:

- `EA Sync` -> `/downloads/TheNextTrade_TradeSync.ex5`
- `TNT Connect` -> `/downloads/TheNextTradeConnect.exe`

Problem:

- Both buttons look equally important.
- User does not know which one to choose.
- No quick explanation of the difference.
- No setup checklist before downloading.

### TNT Connect

Folder:

- `apps/tnt-connect`

Important files:

- `apps/tnt-connect/main.py`
- `apps/tnt-connect/config.py`
- `apps/tnt-connect/api_client.py`
- `apps/tnt-connect/sync_engine.py`
- `apps/tnt-connect/mt5_bridge.py`
- `apps/tnt-connect/web/index.html`
- `apps/tnt-connect/web/app.js`
- `apps/tnt-connect/README.md`

Current behavior:

- Uses user-level sync API key.
- Calls `/api/sync/connect`, `/api/sync/heartbeat`, `/api/sync/trades`, `/api/sync/config`.
- Auto-detects MT5.
- Can sync closed positions.
- Has auto-update support through `/api/app/version`.

Recommended positioning:

- Primary sync method.
- Best for non-technical users.
- Best for background sync and future updates.

### EA Sync

Source:

- `public/downloads/TheNextTrade_TradeSync.mq5`

Compiled package:

- `public/downloads/TheNextTrade_TradeSync.ex5`

Current issues:

- Hardcoded default API key exists in `InpApiKey`.
- Default `InpApiUrl` is `http://127.0.0.1:3000`.
- Branding still says `GSN`, `GSN Platform`, `GSN Trade Sync`.
- Version is `1.05`.
- `.mq5` is publicly downloadable because it is under `public/downloads`.

Risk:

- A user can accidentally use a shared/default key.
- Public source exposes implementation details.
- Localhost default will fail for real users.
- Old branding lowers trust.

## Product Decision

Use one primary entry point in Account Hub:

### Primary Button

Replace separate `EA Sync` and `TNT Connect` buttons with:

```text
Set up Trade Sync
```

Click opens a modal:

```text
Trade Sync Setup
Choose how you want to sync your MT5 trades to TheNextTrade.
```

Inside modal, show two options:

1. `TNT Connect` with badge `Recommended`
2. `EA Sync` with badge `Advanced`

Keep direct downloads inside the modal, not as two unexplained top-level buttons.

## UX Requirements

### Account Hub Header

File:

- `src/components/trading-accounts/AccountListClient.tsx`

Change:

- Remove top-level `EA Sync` button.
- Remove top-level `TNT Connect` button.
- Add one button:

```text
Set up Trade Sync
```

Suggested icon:

- `MonitorCog`, `RefreshCw`, `Cable`, or `DownloadCloud` from `lucide-react`.

Suggested style:

- Premium blue/emerald accent.
- It should be more important than `Refresh`, but less important than `Add Account`.

### Trade Sync Setup Modal

Add modal state:

```ts
| { type: "SYNC_SETUP" }
```

Modal content:

```text
Trade Sync Setup
Sync your MT5 account automatically with TheNextTrade.
```

Option 1: TNT Connect

```text
Recommended
Best for most users
Runs on Windows, detects MT5 automatically, syncs in the background, and supports auto-updates.
```

CTA:

```text
Download TNT Connect
```

Secondary action:

```text
Open setup guide
```

Guide target:

- `/dashboard/settings/tnt-connect`

Option 2: EA Sync

```text
Advanced
For MT5 users who prefer running an Expert Advisor directly on a chart.
```

CTA:

```text
Download EA Sync
```

Secondary note:

```text
Requires enabling WebRequest in MT5 and pasting your Sync API Key into EA inputs.
```

CTA target:

- `/downloads/TheNextTrade_TradeSync.ex5`

### Modal Checklist

Inside modal, include short checklist:

```text
Before syncing:
1. Add your MT5 account number in Account Hub.
2. Generate your Sync API Key in Settings > TNT Connect.
3. Keep MT5 logged into the same account number.
```

Use compact UI. Do not make the modal feel like a documentation page.

## Sync Status Requirements

### Account Card Sync Method

Files to inspect:

- `src/components/trading-accounts/AccountCard.tsx`
- `src/components/trading-accounts/AccountListClient.tsx`
- `src/app/api/trading-accounts/route.ts`
- account data loader for `/dashboard/accounts`

Goal:

Each account card should show a clear sync source:

- `Synced via TNT Connect`
- `Synced via EA Sync`
- `Not connected`
- `Sync paused`

Source fields:

- `syncSource`
- `lastHeartbeat`
- `appLastHeartbeat`
- `eaVersion`
- `autoSync`

Suggested display logic:

```ts
if (!autoSync) return "Sync paused";
if (!lastHeartbeat && !appLastHeartbeat) return "Not connected";
if (syncSource === "APP" || appLastHeartbeat) return "Synced via TNT Connect";
if (eaVersion || syncSource === "EA_SYNC" || syncSource === "EA_HISTORY") return "Synced via EA Sync";
return "Connected";
```

Important:

- If both EA and TNT have touched the account, prefer the most recent heartbeat timestamp.
- `appLastHeartbeat` means TNT Connect.
- `lastHeartbeat` alone may mean EA or legacy.

### API Data Requirement

Make sure `/dashboard/accounts` receives:

- `syncSource`
- `appLastHeartbeat`
- `eaVersion`
- `autoSync`
- `lastHeartbeat`
- `lastSync`

If any field is missing from the server query, add it.

## EA Sync Hardening

### File

- `public/downloads/TheNextTrade_TradeSync.mq5`

### Required changes

1. Remove hardcoded API key.

Current:

```mql5
input string InpApiKey = "7f354055...";
```

Change to:

```mql5
input string InpApiKey = "";
```

2. Change default API URL.

Current:

```mql5
input string InpApiUrl = "http://127.0.0.1:3000";
```

Production default:

```mql5
input string InpApiUrl = "https://thenexttrade.com";
```

Local development can still override manually.

3. Update branding.

Replace user-facing strings:

- `GSN Trade Sync` -> `TheNextTrade Trade Sync`
- `GSN Platform` -> `TheNextTrade`
- `GSN Dashboard` -> `TheNextTrade Dashboard`
- `GSN TRADE SYNC` -> `THENEXTTRADE SYNC`

Internal object names like `GSN_Panel` can stay if changing them is risky. User-facing text must be updated.

4. Update metadata.

Suggested:

```mql5
#property copyright "Copyright 2026, TheNextTrade"
#property link "https://thenexttrade.com"
#property version "1.06"
#property description "Auto sync closed MT5 trades to TheNextTrade Trading Journal"
```

5. Improve validation message.

When API key is missing, show:

```text
TheNextTrade Trade Sync: Please paste your Sync API Key.
Find it at Dashboard > Settings > TNT Connect.
```

6. Improve WebRequest warning.

Make the required allowed URL explicit:

```text
MT5 > Tools > Options > Expert Advisors > Allow WebRequest for:
https://thenexttrade.com
```

7. Confirm payload compatibility.

EA currently sends:

- `/api/ea/heartbeat`
- `/api/ea/trades`
- `/api/ea/commands/pending`
- `/api/ea/commands/:id`

Keep endpoint compatibility unless intentionally migrating EA to `/api/sync/*`.

Do not rename JSON fields unless backend is updated too.

## EA Package Release Requirement

After editing `.mq5`:

1. Compile the EA in MetaEditor.
2. Replace:

```text
public/downloads/TheNextTrade_TradeSync.ex5
```

3. Keep source file only if intentionally public.

Recommendation:

- Do not serve `.mq5` publicly in production unless there is a reason.
- Move source to a non-public folder later, for example:

```text
apps/ea-sync/TheNextTrade_TradeSync.mq5
```

Then keep only `.ex5` under `public/downloads`.

For this implementation, do not move the source unless requested. Just remove unsafe defaults now.

## TNT Connect Improvements

### Files

- `apps/tnt-connect/config.py`
- `apps/tnt-connect/web/index.html`
- `apps/tnt-connect/web/app.js`
- `apps/tnt-connect/README.md`

### Required changes

1. Confirm default base URL is production:

```py
"api_base_url": "https://thenexttrade.com"
```

Already appears correct.

2. Improve user-facing copy in the app:

Current app should clearly say:

```text
Paste your Sync API Key from TheNextTrade > Settings > TNT Connect.
```

3. Improve empty account message.

Current:

```text
Add trading accounts on TheNextTrade web first
```

Better:

```text
Add your MT5 account number in Account Hub, then reconnect TNT Connect.
```

4. Add a visible account mismatch warning.

If MT5 account is not found in web account list, app already logs:

```text
Account #... not on web
```

Make sure UI shows a user-friendly message:

```text
This MT5 account is not added in Account Hub.
Add account #ACCOUNT_NUMBER on TheNextTrade, then reconnect.
```

5. Keep auto-update flow.

No backend change needed unless version is bumped.

If TNT Connect is rebuilt, update:

- `apps/tnt-connect/main.py` `VERSION`
- `public/downloads/app-release.json`
- `public/downloads/TheNextTradeConnect.exe`

## Backend Review Items

### Existing endpoints

TNT Connect:

- `src/app/api/sync/connect/route.ts`
- `src/app/api/sync/heartbeat/route.ts`
- `src/app/api/sync/trades/route.ts`
- `src/app/api/sync/config/route.ts`

EA Sync:

- `src/app/api/ea/heartbeat/route.ts`
- `src/app/api/ea/trades/route.ts`
- `src/app/api/ea/history/route.ts`
- `src/app/api/ea/commands/route.ts`
- `src/app/api/ea/commands/pending/route.ts`
- `src/app/api/ea/commands/[id]/route.ts`

### Required checks

1. Confirm both `X-Sync-Key` and `X-API-Key` continue to work.
2. Confirm account lookup is always scoped to `userId + accountNumber`.
3. Confirm unknown account returns useful error.
4. Confirm duplicate trade handling still uses:

```prisma
@@unique([accountId, externalTicket])
@@unique([userId, accountId, externalTicket])
```

5. Confirm TNT Connect and EA do not create duplicate entries for the same closed MT5 position.

Expected:

- Same `accountId`
- Same `externalTicket`
- second sync updates/skips, not duplicates.

## Implementation Tasks

### Task 1: Replace top-level sync buttons with setup modal

Files:

- `src/components/trading-accounts/AccountListClient.tsx`

Steps:

- Remove top-level `EA Sync` and `TNT Connect` download anchors.
- Add `Set up Trade Sync` button.
- Add `SYNC_SETUP` modal state.
- Build modal with TNT Connect and EA Sync option cards.
- Preserve download URLs.

Verify:

- `/dashboard/accounts` shows one sync setup button.
- Clicking it opens modal.
- TNT Connect download works.
- EA Sync download works.
- Free vs Pro and Add Account still work.

### Task 2: Add sync method badge to account cards

Files:

- `src/components/trading-accounts/AccountCard.tsx`
- account list data source/API as needed

Steps:

- Include missing sync fields in account type.
- Compute sync method label.
- Show compact badge near account connection status.

Verify:

- TNT account shows `Synced via TNT Connect`.
- EA account shows `Synced via EA Sync`.
- Account with no heartbeat shows `Not connected`.
- Account with `autoSync=false` shows `Sync paused`.

### Task 3: Harden EA source defaults

File:

- `public/downloads/TheNextTrade_TradeSync.mq5`

Steps:

- Empty out default API key.
- Set default URL to `https://thenexttrade.com`.
- Update user-facing branding from GSN to TheNextTrade.
- Bump version to `1.06`.
- Improve missing key and WebRequest messages.

Verify:

- `rg "7f354055|GSN Trade Sync|GSN Platform|127.0.0.1:3000" public/downloads/TheNextTrade_TradeSync.mq5` returns no unsafe user-facing matches.
- EA source still compiles in MetaEditor.

### Task 4: Rebuild EA package

File:

- `public/downloads/TheNextTrade_TradeSync.ex5`

Steps:

- Compile `.mq5` in MetaEditor.
- Replace `.ex5` in public downloads.
- Confirm file timestamp/size changed.

Verify:

- Download `/downloads/TheNextTrade_TradeSync.ex5`.
- Attach EA to MT5 chart.
- Missing key message appears if API key is blank.
- With valid key and allowed WebRequest, heartbeat succeeds.

### Task 5: Improve TNT Connect copy

Files:

- `apps/tnt-connect/web/index.html`
- `apps/tnt-connect/web/app.js`
- `apps/tnt-connect/README.md`

Steps:

- Clarify where to get Sync API Key.
- Improve account-not-added message.
- Improve mismatch message if MT5 account is not in web account list.

Verify:

- Running `python main.py` shows updated copy.
- Connecting with unknown MT5 account shows actionable message.

### Task 6: Optional TNT Connect rebuild

Only needed if Task 5 changes shipped app UI.

Files:

- `apps/tnt-connect/main.py`
- `public/downloads/TheNextTradeConnect.exe`
- `public/downloads/app-release.json`

Steps:

- Bump `VERSION` in `main.py`.
- Run build.
- Replace exe.
- Update `app-release.json`.

Verify:

- `/api/app/version` returns new version.
- Existing app detects update.
- Download URL points to `/downloads/TheNextTradeConnect.exe`.

### Task 7: Backend smoke test

Endpoints:

- `/api/sync/connect`
- `/api/sync/heartbeat`
- `/api/sync/trades`
- `/api/ea/heartbeat`
- `/api/ea/trades`

Verify:

- Missing key returns 401.
- Invalid key returns 401.
- Valid key + unknown account returns useful 404.
- Valid key + known account syncs heartbeat.
- Duplicate trade does not create duplicate journal entry.

### Task 8: Browser QA

Use Playwright.

Pages:

- `/dashboard/accounts`
- `/dashboard/settings/tnt-connect`

Verify:

- Desktop layout does not overflow.
- Mobile layout stacks correctly.
- Setup modal works.
- Download links exist.
- Account cards show sync method cleanly.
- No console errors.

## Acceptance Criteria

- Users see one clear sync setup entry point.
- TNT Connect is visually recommended.
- EA Sync is still available but framed as advanced.
- EA source has no hardcoded API key.
- EA default URL is production.
- EA user-facing branding says TheNextTrade, not GSN.
- Account cards show how each account is syncing.
- Both sync methods remain backward compatible.
- No duplicate trades are created when both methods sync the same account.
- Type-check and lint pass.

## Commands

Run after code changes:

```bash
npm run type-check
npx eslint src/components/trading-accounts src/app/api/sync src/app/api/ea
```

Run TNT Connect manually:

```bash
cd apps/tnt-connect
venv\Scripts\activate
python main.py
```

Build TNT Connect if needed:

```bash
cd apps/tnt-connect
venv\Scripts\activate
pyinstaller build.spec --clean --noconfirm
```

## Important Notes For Claude

- Do not delete EA Sync. It is still useful for advanced MT5 users.
- Do not break existing users using `X-API-Key`.
- Do not remove `/api/ea/*` endpoints.
- Do not move `.mq5` out of `public/downloads` in this task unless explicitly approved.
- Do not change trade payload field names without updating both EA/TNT Connect and backend parsers.
- Treat TNT Connect as the recommended user journey.
