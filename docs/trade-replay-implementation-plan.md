# Trade Replay Implementation Plan

Last reviewed: 2026-05-27

## Goal

Build a Trade Replay feature that lets a trader open one completed trade, replay the market candles around that trade, and review the decision with clear entry, exit, SL, TP, and BE annotations.

This must feel like a review tool, not just a chart. The user should answer: "What did price do before I entered, what happened after, and what should I improve next time?"

## Product Decision

Use TradingView Lightweight Charts for MVP.

Reasons:

- `lightweight-charts` is already installed in `package.json`.
- It supports interactive financial charts and candlestick series.
- It supports series markers for event annotations.
- It is lighter and easier to own than TradingView Advanced Charts.
- It avoids licensing and proprietary integration complexity for the first version.

References:

- Lightweight Charts docs: https://tradingview.github.io/lightweight-charts/
- Series markers: https://tradingview.github.io/lightweight-charts/tutorials/how_to/series-markers
- TradingView chart libraries overview: https://www.tradingview.com/free-charting-libraries/

## Scope

### MVP

User can:

- Open replay from a journal trade row/detail.
- View candles before and after the selected trade.
- See markers for entry and exit.
- See optional price lines for SL, TP, and BE if data exists.
- Play/pause candle reveal.
- Step one candle forward/back.
- Switch timeframe when replay data exists.
- Save a short replay note linked to the trade.

### Not MVP

- Real-time live market playback.
- Paid third-party market data feed.
- Multi-symbol replay.
- Strategy backtesting engine.
- Order simulation or "paper replay" execution.
- Full TradingView Advanced Charts integration.

## User Flow

1. User goes to `/dashboard/journal`.
2. User opens a completed trade.
3. Trade detail shows `Replay Trade` when replay data exists.
4. If replay data does not exist, show `Replay data unavailable` with a CTA:
   - `Sync replay context with TNT Connect`
   - `Resync with EA`
5. User lands on `/dashboard/replay/[tradeId]`.
6. Replay page loads:
   - Trade summary
   - Candlestick chart
   - Timeline controls
   - Review prompts
   - Recommended lesson/action if a pattern is detected

## Routes

Add:

- `src/app/dashboard/replay/[tradeId]/page.tsx`

Optional later:

- `src/app/dashboard/replay/page.tsx`
  - List recent replay-ready trades.

Query params:

- `timeframe=M1|M5|M15|H1`
- `mode=review|share`

Default timeframe:

1. Use trade source timeframe if stored.
2. Else use `M5`.
3. Else use first available replay timeframe.

## Existing Code To Reuse

Current chart component:

- `src/components/journal/TradingViewMiniChart.tsx`

Current journal paths:

- `src/app/dashboard/journal/page.tsx`
- `src/components/journal/JournalList.tsx`
- `src/components/journal/TradeDetailSheet.tsx`
- `src/components/journal/JournalEntryModal.tsx`

Current trade model:

- `JournalEntry`

Current sync paths:

- TNT Connect: `apps/tnt-connect`
- EA Sync: `public/downloads/TheNextTrade_TradeSync.mq5`
- Sync APIs: `src/app/api/sync/*`, `src/app/api/ea/*`

## Data Model

Add reusable candle storage. Do not store chart data inside `JournalEntry` JSON because candles are queryable by account, symbol, timeframe, and time.

```prisma
model MarketCandle {
  id          String   @id @default(cuid())
  userId      String   @db.Uuid
  accountId   String?
  symbol      String   @db.VarChar(40)
  timeframe   String   @db.VarChar(10)
  time        DateTime @db.Timestamptz(6)
  open        Float
  high        Float
  low         Float
  close       Float
  tickVolume  Float?
  volume      Float?
  spread      Float?
  source      String   @default("TNT_CONNECT") @db.VarChar(30)
  createdAt   DateTime @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @db.Timestamptz(6)

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  account     TradingAccount? @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@unique([accountId, symbol, timeframe, time])
  @@index([userId, symbol, timeframe, time])
  @@index([accountId, symbol, timeframe, time])
  @@map("market_candles")
}
```

Add replay capture metadata.

```prisma
model TradeReplayCapture {
  id             String   @id @default(cuid())
  userId         String   @db.Uuid
  journalEntryId String
  accountId      String?
  symbol         String   @db.VarChar(40)
  timeframe      String   @db.VarChar(10)
  periodStart    DateTime @db.Timestamptz(6)
  periodEnd      DateTime @db.Timestamptz(6)
  candleCount     Int      @default(0)
  source          String   @default("TNT_CONNECT") @db.VarChar(30)
  status          String   @default("READY") @db.VarChar(20)
  errorMessage    String?
  capturedAt      DateTime @default(now()) @db.Timestamptz(6)

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  journalEntry    JournalEntry @relation(fields: [journalEntryId], references: [id], onDelete: Cascade)
  account         TradingAccount? @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@unique([journalEntryId, timeframe])
  @@index([userId, status])
  @@index([journalEntryId])
  @@map("trade_replay_captures")
}
```

Add relation fields to `User`, `TradingAccount`, and `JournalEntry` if Prisma requires them.

Optional small addition to `JournalEntry`:

```prisma
replayNotes String?
```

If avoiding a migration for notes, store replay note in a new `TradeReplayReview` model instead.

## Candle Capture Rules

For each closed trade, capture candles around the trade.

Default window:

- 80 candles before entry.
- 80 candles after entry.
- If exit is later than 80 candles after entry, extend until 20 candles after exit.
- Hard cap: 300 candles per trade per timeframe.

Default timeframes:

- `M5`
- `M15`
- `H1`

If storage becomes too large, start with `M5` only and capture other timeframes on demand.

## Sync Source Changes

### TNT Connect

Add candle capture in `apps/tnt-connect`.

Expected behavior:

- After importing closed trades, detect newly imported/updated trades.
- For each trade, request candle data from local MT5 for the target symbol/timeframes.
- POST candle payload to the web app.
- Continue trade import even if replay candle upload fails.
- Log replay upload result in TNT Connect sync log.

Suggested API:

```http
POST /api/sync/replay-candles
Authorization: Bearer <sync api key>
Content-Type: application/json
```

Payload:

```json
{
  "accountNumber": "600001145",
  "source": "TNT_CONNECT",
  "journalEntryExternalTicket": "123456",
  "symbol": "XAUUSD",
  "timeframe": "M5",
  "periodStart": "2026-05-24T08:00:00.000Z",
  "periodEnd": "2026-05-24T12:00:00.000Z",
  "candles": [
    {
      "time": "2026-05-24T08:00:00.000Z",
      "open": 2350.1,
      "high": 2351.2,
      "low": 2349.8,
      "close": 2350.7,
      "tickVolume": 123,
      "spread": 15
    }
  ]
}
```

Validation:

- Authenticate by sync API key.
- Resolve `userId` and `TradingAccount`.
- Resolve `JournalEntry` by `accountId + externalTicket`.
- Validate timeframe enum.
- Validate max candles per request.
- Upsert `MarketCandle`.
- Upsert `TradeReplayCapture`.

### EA Sync

Add optional replay context upload to the EA after trade sync.

Rules:

- Do not block normal trade sync if candle upload fails.
- Upload only for newly closed trades.
- Use same `/api/sync/replay-candles` endpoint or an EA alias endpoint if existing EA auth differs.
- Add EA input option:
  - `Upload Replay Candles = true`
  - `Replay Timeframes = M5,M15`
  - `Replay Candles Before = 80`
  - `Replay Candles After = 80`

## API Endpoints

### `POST /api/sync/replay-candles`

Purpose:

- Receive replay candles from TNT Connect or EA.

Response:

```json
{
  "success": true,
  "candlesImported": 120,
  "candlesSkipped": 0,
  "captureStatus": "READY"
}
```

Failure cases:

- `401`: invalid sync key.
- `404`: account or journal entry not found.
- `400`: invalid timeframe, invalid dates, too many candles.
- `409`: trade exists but does not belong to authenticated account.

### `GET /api/replay/trades/[tradeId]?timeframe=M5`

Purpose:

- Return replay data for the authenticated owner.

Response:

```json
{
  "trade": {
    "id": "trade_id",
    "symbol": "XAUUSD",
    "type": "BUY",
    "entryPrice": 2350.1,
    "exitPrice": 2354.2,
    "stopLoss": 2345.0,
    "takeProfit": 2360.0,
    "entryDate": "2026-05-24T09:00:00.000Z",
    "exitDate": "2026-05-24T09:45:00.000Z",
    "pnl": 77.12,
    "result": "WIN"
  },
  "timeframe": "M5",
  "availableTimeframes": ["M5", "M15", "H1"],
  "candles": [],
  "markers": [],
  "priceLines": []
}
```

### `PATCH /api/replay/trades/[tradeId]/review`

Purpose:

- Save replay note and optional review answers.

Payload:

```json
{
  "note": "Entered after breakout retest. Need to wait for cleaner candle close.",
  "rating": "GOOD_EXECUTION",
  "mistakeIds": ["early-entry"]
}
```

## UI Components

Add:

- `src/components/replay/TradeReplayPage.tsx`
- `src/components/replay/TradeReplayChart.tsx`
- `src/components/replay/ReplayControls.tsx`
- `src/components/replay/TradeReplaySummary.tsx`
- `src/components/replay/ReplayReviewPanel.tsx`
- `src/components/replay/ReplayUnavailableState.tsx`

Reuse:

- `MetricHelp`
- Button/card styles from dashboard.
- `TradingViewMiniChart` logic where useful.

## Chart Behavior

Use client-only rendering:

- Put chart component behind `"use client"`.
- Use `dynamic(() => import(...), { ssr: false })` if needed.
- Destroy chart on unmount.
- Resize chart on container resize.

Markers:

- Entry marker:
  - BUY: below bar, green.
  - SELL: above bar, red.
- Exit marker:
  - WIN: gold or green.
  - LOSS: red.
  - BE: slate/blue.
- Optional marker for moved-to-BE if known later.

Price lines:

- Entry: solid neutral.
- SL: dashed red.
- TP: dashed green.
- Exit: solid gold.

Replay controls:

- Play/pause.
- Step back.
- Step forward.
- Speed: `1x`, `2x`, `4x`.
- Reset.
- Jump to entry.
- Jump to exit.

Implementation detail:

- Keep all candles in memory for current timeframe.
- Display `candles.slice(0, visibleIndex)`.
- Markers should only appear when their candle time is <= current visible candle time.

## Review Panel

Show three lightweight prompts:

1. "Was the entry aligned with your plan?"
2. "What did price do immediately after entry?"
3. "What is one rule for the next similar setup?"

If user has recurring weakness signals later, show recommended lesson:

- "You had 3 losses after impulsive re-entry. Review: Revenge Trading and How to Stop It."

## Journal Integration

Update:

- `TradeDetailSheet`
- Journal row action menu if present.
- Report best/worst trade snippets.

Rules:

- If replay data exists: show `Replay`.
- If replay capture is missing: show `Replay unavailable` with explanation.
- If sync source is `MANUAL`: do not show sync CTA; show "Replay requires synced MT5 candle context."

## Privacy And Permissions

- Only the trade owner can access replay.
- Admin should not access replay unless an explicit support/admin route is added later.
- Public trader pages must not expose replay data.
- Do not send replay candles to GA4.
- Do not include account number in client analytics events.

## Performance

- Cap API response to one timeframe at a time.
- Compress JSON normally through Next/proxy.
- Use indexed query by `accountId + symbol + timeframe + time`.
- Avoid loading replay chart on journal list render.
- Lazy-load replay route only when clicked.

## Implementation Phases

### Phase 1: Data And API

- Add Prisma models: `MarketCandle`, `TradeReplayCapture`.
- Generate migration.
- Add `POST /api/sync/replay-candles`.
- Add `GET /api/replay/trades/[tradeId]`.
- Add ownership checks.

Done when:

- A test payload can import candles.
- Replay GET returns trade plus candles for owner.
- Other users receive `404` or `403`.

### Phase 2: TNT Connect Capture

- Add candle capture after trade sync in `apps/tnt-connect`.
- Add upload retry for failed replay payloads.
- Add sync log lines:
  - `Replay candles: M5 120 imported`
  - `Replay candles unavailable for SYMBOL/TIMEFRAME`

Done when:

- Syncing last week imports trades and replay candles.
- Trade import still succeeds if replay upload fails.

### Phase 3: Replay UI

- Add replay route.
- Add chart, controls, markers, price lines.
- Add unavailable state.
- Add journal CTA.

Done when:

- User can replay a synced trade.
- User sees clear unavailable state for trades without candles.

### Phase 4: Review Notes

- Add replay note save.
- Show saved note in journal detail.
- Optional: record Edge event for first replay review.

Done when:

- User can save and revisit replay notes.

### Phase 5: QA

- Run type-check.
- Run lint on touched files.
- Playwright test:
  - Journal -> trade detail -> Replay.
  - Replay page loads chart.
  - Play/pause changes visible candles.
  - Timeframe switch works.
  - Missing candles state is clear.
  - Unauthorized trade access blocked.

## Acceptance Criteria

- No chart crash during SSR.
- No replay chart on anonymous access.
- Replay data is scoped to the authenticated user.
- A trade with candles shows at least entry and exit markers.
- A trade without candles gives a useful next action.
- The user can understand the trade without reading technical docs.

## Notes For Claude

- Do not replace the existing journal.
- Do not add a paid data vendor in MVP.
- Do not fetch candle data from random public APIs; broker symbols and prices may not match MT5 execution data.
- Prefer local MT5 candle context from TNT Connect/EA because it aligns with the broker account that generated the trade.
