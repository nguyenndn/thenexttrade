# Mobile-Only Auto Sync Strategy

Last reviewed: 2026-05-27

## Goal

Define a realistic strategy for users who only have a phone and want trades to sync automatically.

The key product issue: a mobile browser cannot directly read a user's MT5 desktop terminal history. Without a running sync agent, broker API, or third-party MetaTrader cloud service, true auto sync is not possible.

## Core Decision

Do not promise mobile-only auto sync in the free/core product.

The product should say:

- Mobile is excellent for review, check-in, reports, lessons, notifications, and quick manual notes.
- Auto sync still needs one of:
  - TNT Connect running on Windows with MT5.
  - EA Sync running inside MT5, often on desktop or VPS.
  - Future paid Cloud Sync through a third-party service.

This avoids a bad user expectation: "I signed in on my phone, so why are my MT5 trades not syncing?"

## Current Sync Paths

### TNT Connect

Best for:

- Windows users.
- Users who can open MT5 on desktop.
- Users who want period sync without placing an EA on a chart.

Current code:

- `apps/tnt-connect`
- `src/app/api/sync/*`
- `src/components/trading-accounts/TradeSyncWizard.tsx`

### EA Sync

Best for:

- VPS users.
- Users who want continuous heartbeat.
- Users comfortable attaching an Expert Advisor to MT5.

Current code:

- `public/downloads/TheNextTrade_TradeSync.mq5`
- `src/app/api/ea/*`

### Manual Journal

Best for:

- Users who only have mobile today.
- Users who want to start immediately before setting up sync.

Current code:

- `/dashboard/journal`
- `src/components/journal/*`

## Product UX For Mobile-Only Users

### Mobile Sync Status

On mobile `/dashboard/accounts`, show a clear state:

Title:

- `Auto sync needs MT5 running somewhere`

Body:

- `Your phone can review trades, reports, and lessons. To auto-sync MT5 history, keep TNT Connect or EA Sync running on a computer/VPS.`

Primary CTA:

- `Log a trade manually`
  - `/dashboard/journal?action=log-trade`

Secondary CTA:

- `Send setup link to desktop`

Tertiary CTA:

- `View sync options`
  - Opens Sync Wizard.

### Send Setup Link To Desktop

Add a low-cost helper:

- User enters their own email.
- System sends a setup link:
  - `/dashboard/accounts?setup=sync&method=tnt`
  - Include download link for TNT Connect.
  - Include EA setup link.

This is not auto sync, but it solves the practical mobile problem: user discovers the product on phone and needs to continue on desktop.

Email should be rate-limited:

- Max 2 sends per user per day.
- Use existing SMTP service.
- In-app notification should also be created.

### Mobile Quick Manual Log

For mobile-only users, reduce friction:

- Add a quick journal CTA on dashboard empty state.
- Make `/dashboard/journal?action=log-trade` mobile-first.
- Let user enter:
  - Symbol
  - BUY/SELL
  - Entry
  - Exit
  - Lot
  - PnL
  - Screenshot optional
  - One sentence note

This gives value without pretending auto sync exists.

### Mobile Review Mode

Mobile should focus on:

- Today summary.
- Recent trades.
- Weekly report.
- Coach recommendation.
- Daily check-in.
- Lessons recommended from trade weakness.

Do not make mobile sync setup the main mobile experience unless the user explicitly opens Sync Wizard.

## Future Option: Paid Cloud Sync

If the business needs true mobile-only auto sync later, implement it as a paid Pro add-on called `Cloud Sync`.

Recommended research candidate:

- MetaApi

Why it matters:

- MetaApi provides MetaTrader account APIs.
- It has endpoints for history orders and historical candles.
- It can support a cloud sync model where a user does not need their own desktop app constantly open.

References:

- MetaApi history orders by time range: https://metaapi.cloud/docs/client/restApi/api/retrieveHistoricalData/readHistoryOrdersByTimeRange/
- MetaApi historical candles: https://metaapi.cloud/docs/client/restApi/api/retrieveMarketData/readHistoricalCandles/

Important:

- This adds cost, credential/security risk, provider dependency, support complexity, and user trust issues.
- It should not be bundled into the free default experience.

## Cloud Sync Product Shape

Route:

- `/dashboard/accounts?setup=cloud-sync`

Plan gating:

- Pro only.
- Optional extra paid add-on if vendor cost is high.

Flow:

1. User selects `Cloud Sync`.
2. User sees a clear security explanation:
   - What credentials/provider access is needed.
   - What TheNextTrade stores and does not store.
   - How to disconnect.
3. User connects MT4/MT5 account through provider flow.
4. Backend creates `CloudSyncConnection`.
5. Worker syncs:
   - Account info.
   - Open positions.
   - Historical deals/orders.
   - Optional candles for Trade Replay.
6. User sees sync status in Account Hub.

## Cloud Sync Data Model

Only add this when implementing paid Cloud Sync.

```prisma
model CloudSyncConnection {
  id                 String   @id @default(cuid())
  userId             String   @db.Uuid
  tradingAccountId   String?
  provider           String   @default("METAAPI") @db.VarChar(30)
  providerAccountId  String   @db.VarChar(120)
  status             String   @default("PENDING") @db.VarChar(30)
  lastSyncAt         DateTime? @db.Timestamptz(6)
  lastError          String?
  region             String?  @db.VarChar(50)
  createdAt          DateTime @default(now()) @db.Timestamptz(6)
  updatedAt          DateTime @updatedAt @db.Timestamptz(6)

  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tradingAccount     TradingAccount? @relation(fields: [tradingAccountId], references: [id], onDelete: SetNull)

  @@index([userId, status])
  @@unique([provider, providerAccountId])
  @@map("cloud_sync_connections")
}
```

```prisma
model CloudSyncRun {
  id                 String   @id @default(cuid())
  connectionId        String
  status             String   @default("RUNNING") @db.VarChar(30)
  startedAt           DateTime @default(now()) @db.Timestamptz(6)
  completedAt         DateTime? @db.Timestamptz(6)
  tradesImported      Int      @default(0)
  tradesUpdated       Int      @default(0)
  candlesImported     Int      @default(0)
  errorMessage        String?

  connection          CloudSyncConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)

  @@index([connectionId, startedAt])
  @@map("cloud_sync_runs")
}
```

## Cloud Sync Security Rules

- Do not store raw MT5 password in app database.
- Prefer provider-hosted credential storage if available.
- If any token must be stored, encrypt at rest.
- Add `CLOUD_SYNC_ENCRYPTION_KEY` only when feature is enabled.
- Add explicit disconnect/delete flow.
- Add audit log for connect/disconnect.
- Never send MT account credentials, account number, or broker data to GA4.
- Add Terms/Privacy update before release.

## Email/Notification Cost Control

Mobile-only nudges should not become an email cost problem.

Recommended hierarchy:

1. In-app notification by default.
2. Email only for important lifecycle events:
   - Setup link requested.
   - Sync disconnected for more than configured threshold.
   - Weekly report ready.
3. No email for every missed sync, every SL, or every daily reminder.

Provider context as of 2026-05-27:

- Brevo transactional email has a free tier of 300 emails/day and paid plans from $9/month.
- Resend free tier includes 3,000 emails/month with 100/day limit, Pro starts at $20/month.
- AWS SES is much cheaper per email but requires more deliverability and ops work.

References:

- Brevo transactional email: https://www.brevo.com/products/transactional-email/
- Resend pricing: https://resend.com/docs/knowledge-base/what-is-resend-pricing
- AWS SES pricing: https://aws.amazon.com/ses/pricing/

## Implementation Plan

### Phase 1: Fix Product Messaging

Update:

- Sync Wizard mobile state.
- Account Hub empty/no-sync state.
- Onboarding sync method explanation.
- `/get-started` sync section.

Add copy:

- `Auto sync requires MT5 running on desktop or VPS. You can still review, learn, and log trades from mobile.`

Done when:

- A mobile-only user understands why no trades appear.
- User has a useful next action.

### Phase 2: Send Setup Link To Desktop

Add:

- Button: `Send setup link to desktop`.
- Server action/API with rate limit.
- Email template in existing email service.
- In-app notification copy.

Suggested route/action:

- `src/actions/sync-setup-email.ts`

Done when:

- User can send themselves a desktop setup link.
- Rate limit prevents spam.

### Phase 3: Mobile Quick Log

Optimize:

- `/dashboard/journal?action=log-trade`
- Mobile form layout.
- Dashboard empty state CTA.

Done when:

- User can log a basic trade on mobile in under one minute.

### Phase 4: Cloud Sync Research Gate

Before building:

- Estimate vendor cost per active connected user.
- Confirm provider terms allow this use case.
- Define credential handling.
- Define pricing model.
- Decide if Cloud Sync is Pro add-on or standalone paid feature.

Done when:

- Business approves cost/security tradeoff.

## Acceptance Criteria

- Mobile UI no longer implies phone-only auto sync is available.
- Mobile users have a clear manual path and desktop continuation path.
- No new paid provider is required for MVP.
- Future Cloud Sync is documented as optional and gated.

## Notes For Claude

- Do not implement MetaApi in the core app unless explicitly requested.
- Do not ask users for broker credentials in current MVP.
- Do not remove TNT Connect or EA Sync.
- Keep manual journal useful because it is the only honest mobile-only path without third-party APIs.
