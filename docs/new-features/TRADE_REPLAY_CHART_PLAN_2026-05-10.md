# Trade Replay / Trade Autopsy - 3 Phase Implementation Plan

Date: 2026-05-10

Product: TheNextTrade

Purpose:

Build a replay chart that helps traders replay their own trades, see where money leaked, identify the exact mistake, and learn the rule that would have prevented it.

This is not a TradingView clone. The chart is only the surface. The real product is the autopsy: "This is where you lost discipline, this is what it cost, and this is how to fix it next time."

## Executive Summary

This feature is feasible and strongly aligned with TheNextTrade's positioning.

The codebase already has:

- `lightweight-charts` installed.
- `src/components/journal/TradingViewMiniChart.tsx` with candlesticks, entry/exit markers, SL/TP lines.
- `JournalEntry` with trade execution fields.
- `TradingAccount` with trading rule settings.
- Mistake taxonomy and mistake analytics.
- Pro gating.
- Rule violation tracker.
- EA/import sync routes.

The only hard dependency for exact replay is candle data. Phase 1 can ship without real candle data by using generated preview candles. Phase 2 adds exact replay by storing candle snapshots. Phase 3 turns replay into a personal coaching system.

## The 3 Phases

| Phase | Name | Goal | Data Needed | Ship Value |
| --- | --- | --- | --- | --- |
| Phase 1 | Replay Preview MVP | Let users replay any trade using generated candles | Existing `JournalEntry` only | Fast visible feature, strong UX, no schema migration |
| Phase 2 | Exact Replay Data | Store and replay real OHLC candle snapshots | `TradeReplaySnapshot` + EA/import candles | Trustworthy replay, accurate MAE/MFE, exact analysis |
| Phase 3 | Autopsy Intelligence | Turn replay into coaching and money-leak analysis | Replay + mistakes + rules + AI | Differentiation, Pro value, retention moat |

Recommended build order:

1. Phase 1 first, because it can ship fast and proves the UX.
2. Phase 2 next, because exact candles create trust.
3. Phase 3 after user feedback, because coaching quality depends on replay data quality.

## Product Principle

Every screen should answer one question:

> What mistake cost this trader money, and what rule would have saved it?

Avoid building generic chart tooling. Do not add drawing tools, indicator libraries, scanners, or terminal-like behavior in the first three phases.

## Existing Codebase Context

### Existing Relevant Files

| File | Current Role | How To Use |
| --- | --- | --- |
| `src/components/journal/TradingViewMiniChart.tsx` | Existing lightweight chart preview | Reuse chart setup patterns, do not turn this file into replay |
| `src/components/journal/TradeDetailSheet.tsx` | Current trade detail drawer | Add a new `Replay` tab here |
| `src/actions/journal.ts` | Journal CRUD and queries | Reference ownership/query patterns |
| `src/actions/rule-violations.ts` | Pro rule violation logic | Reuse concepts later for Phase 3 overlays |
| `src/lib/mistakes.ts` | Mistake metadata | Use to render mistake names, severity, descriptions |
| `src/lib/services/mistake-lessons.service.ts` | Mistake-to-lesson mapping | Use in Phase 3 |
| `src/components/pro/ProGate.tsx` | Pro gating component | Use for advanced replay/autopsy features |
| `src/app/api/sync/trades/route.ts` | Sync endpoint | Candidate for Phase 2 candle payload integration |
| `src/app/api/mt5/sync/route.ts` | MT5 sync endpoint | Candidate for Phase 2 candle payload integration |

### Existing Data

`JournalEntry` already stores:

- `id`
- `userId`
- `symbol`
- `type`
- `entryPrice`
- `exitPrice`
- `stopLoss`
- `takeProfit`
- `lotSize`
- `pnl`
- `commission`
- `swap`
- `status`
- `result`
- `entryReason`
- `exitReason`
- `entryDate`
- `exitDate`
- `notes`
- `images`
- `emotionBefore`
- `emotionAfter`
- `confidenceLevel`
- `followedPlan`
- `mistakes`
- `tags`
- `tradingSession`
- `strategy`
- `accountId`
- `externalTicket`
- `syncSource`

This is enough for Phase 1.

## Shared Concepts For All Phases

### Feature Name

Recommended product name:

**Trade Autopsy**

UI label can be:

`Replay`

Reason:

- "Replay" is clear as an action.
- "Trade Autopsy" is better as the feature category and marketing/product name.

### Free vs Pro Split

Recommended:

Free users:

- Basic replay preview.
- Entry/exit markers.
- SL/TP lines.
- Generated preview label.

Pro users:

- Full replay controls.
- Exact candle replay.
- Mistake overlays.
- Rule violation overlays.
- MAE/MFE.
- Mistake cost.
- AI autopsy.
- Weekly replay playlist.

This fits the IB-powered Pro model: users get advanced coaching free when they verify through the IB/VIP flow.

### Replay Quality Labels

Always label replay quality clearly:

- `Generated Preview`
- `Exact Replay`

Generated Preview means:

- Candles are generated from trade data.
- Useful for reviewing trade structure.
- Not exact market data.

Exact Replay means:

- Candles came from EA sync/import/market provider.
- Useful for accurate MAE/MFE and path analysis.

### Canonical Types

Create:

`src/lib/trade-replay/types.ts`

```ts
export type ReplayTimeframe = "M1" | "M5" | "M15" | "H1";

export type ReplayDataSource =
  | "SYNTHETIC"
  | "EA_SYNC"
  | "IMPORT"
  | "MARKET_PROVIDER"
  | "MANUAL_UPLOAD";

export type ReplayQuality = "preview" | "exact";

export interface ReplayCandle {
  time: number; // Unix seconds UTC
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface ReplayTrade {
  id: string;
  symbol: string;
  type: "BUY" | "SELL";
  status: "OPEN" | "CLOSED";
  result: "WIN" | "LOSS" | "BREAK_EVEN" | null;
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  lotSize: number;
  pnl: number | null;
  commission: number | null;
  swap: number | null;
  entryDate: string;
  exitDate: string | null;
  entryReason: string | null;
  exitReason: string | null;
  strategy: string | null;
  mistakes: string[];
  tags: string[];
  emotionBefore: string | null;
  emotionAfter: string | null;
  confidenceLevel: number | null;
  followedPlan: boolean | null;
  accountId: string | null;
}

export type ReplayEventType =
  | "entry"
  | "exit"
  | "stop_loss"
  | "take_profit"
  | "mistake"
  | "rule_violation"
  | "mfe"
  | "mae"
  | "current";

export interface ReplayEvent {
  id: string;
  type: ReplayEventType;
  time: number;
  price?: number;
  label: string;
  severity?: "info" | "success" | "warning" | "danger";
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface TradeAutopsy {
  rMultiple: number | null;
  mfePrice: number | null;
  maePrice: number | null;
  plannedRiskPrice: number | null;
  actualMovePrice: number | null;
  earlyExitCostPrice: number | null;
  disciplineLeakAmount: number | null;
  primaryMistake: string | null;
  summary: string;
  lessons: string[];
}

export interface TradeReplayResponse {
  trade: ReplayTrade;
  candles: ReplayCandle[];
  events: ReplayEvent[];
  autopsy: TradeAutopsy;
  source: ReplayDataSource;
  quality: ReplayQuality;
  timeframe: ReplayTimeframe;
  warnings: string[];
}
```

### Shared Calculation Helpers

Create:

`src/lib/trade-replay/calculations.ts`

Functions:

- `calculateRMultiple(trade)`
- `calculateMFE(trade, candles)`
- `calculateMAE(trade, candles)`
- `calculatePlannedRiskPrice(trade)`
- `calculateActualMovePrice(trade)`
- `calculateEarlyExitCostPrice(trade)`
- `calculateDisciplineLeakAmount(trade)`
- `buildAutopsySummary(trade, metrics)`
- `chooseReplayTimeframe(trade)`
- `findEntryCandleIndex(candles, entryDate)`
- `findExitCandleIndex(candles, exitDate)`

Important:

- If there is no SL, `rMultiple` should be `null`.
- If there are no real candles, MAE/MFE can still be estimated from generated candles, but UI must treat it as preview.
- Keep money calculations conservative. If symbol pip value is unknown, label as estimated or show price/R only.

### Shared Candle Validation

Create:

`src/lib/trade-replay/candle-validation.ts`

Functions:

- `normalizeReplayCandles(input)`
- `validateReplayCandle(candle)`
- `dedupeReplayCandles(candles)`
- `sortReplayCandles(candles)`
- `trimCandlesToWindow(candles, from, to)`

Validation rules:

- `time` must be finite positive number.
- `open/high/low/close` must be finite positive numbers.
- `high >= low`.
- `open` and `close` must be within high/low range.
- Candles sorted ascending.
- Deduplicate by `time`.
- Reject payloads over configured max.

Suggested max:

- Phase 1: 300 generated candles.
- Phase 2: 1000 uploaded/synced candles per trade.

## Phase 1 - Replay Preview MVP

### Goal

Ship a working replay experience using only existing `JournalEntry` data and generated candles.

No Prisma migration.

No external market data.

No EA changes.

### User Value

User can open any trade and replay a visual approximation of:

- Entry.
- Exit.
- SL.
- TP.
- PnL.
- Mistakes.
- Basic trade lesson.

This creates the "wow" moment fast.

### Scope

In scope:

- Add `Replay` tab to trade detail sheet.
- Generate synthetic candles from trade entry/exit.
- Render candle chart with `lightweight-charts`.
- Add play/pause controls.
- Add step forward/back controls.
- Add jump to entry/exit controls.
- Add speed selector.
- Add progress slider.
- Add generated preview badge.
- Add autopsy side panel.
- Add mobile responsive layout.
- Add basic unit tests.
- Add basic Playwright test.

Out of scope:

- Prisma migration.
- Exact market candles.
- EA sync changes.
- AI-generated autopsy.
- Weekly replay playlist.
- Shareable replay.

### Files To Add

```txt
src/lib/trade-replay/types.ts
src/lib/trade-replay/calculations.ts
src/lib/trade-replay/synthetic-candles.ts
src/lib/trade-replay/events.ts
src/actions/trade-replay.ts
src/components/journal/replay/ReplayQualityBadge.tsx
src/components/journal/replay/TradeReplayChart.tsx
src/components/journal/replay/TradeReplayControls.tsx
src/components/journal/replay/TradeAutopsyPanel.tsx
src/components/journal/replay/TradeReplayTab.tsx
src/lib/trade-replay/calculations.test.ts
src/lib/trade-replay/synthetic-candles.test.ts
tests/e2e/trade-replay-qa.spec.ts
```

### Files To Modify

```txt
src/components/journal/TradeDetailSheet.tsx
```

Optional:

```txt
src/components/pro/ProGate.tsx
src/config/navigation.ts
```

Only modify optional files if a feature key is needed.

### Server Action

Create:

`src/actions/trade-replay.ts`

Main action:

```ts
export async function getTradeReplay(tradeId: string): Promise<TradeReplayResponse | { error: string }>
```

Rules:

- Must call `getAuthUser()`.
- Must query trade by `{ id: tradeId, userId: user.id }`.
- Must return `Unauthorized` if no user.
- Must return `Not found` if trade belongs to another user.
- Must normalize `mistakes` to `string[]`.
- Must generate synthetic candles.
- Must return `source: "SYNTHETIC"` and `quality: "preview"`.

Pseudo-flow:

```ts
const user = await getAuthUser();
const trade = await prisma.journalEntry.findFirst({
  where: { id: tradeId, userId: user.id },
});

const replayTrade = normalizeJournalEntryToReplayTrade(trade);
const timeframe = chooseReplayTimeframe(replayTrade);
const candles = generateSyntheticCandles(replayTrade, timeframe);
const events = buildReplayEvents(replayTrade, candles);
const autopsy = buildTradeAutopsy(replayTrade, candles, events);

return {
  trade: replayTrade,
  candles,
  events,
  autopsy,
  source: "SYNTHETIC",
  quality: "preview",
  timeframe,
  warnings: ["Generated preview. This is not exact market candle data."],
};
```

### Synthetic Candle Generator

Create:

`src/lib/trade-replay/synthetic-candles.ts`

Requirements:

- Deterministic output per trade ID.
- Always includes entry candle.
- If closed trade, includes exit candle.
- Uses trade direction to shape price path.
- Generates enough candles before and after entry.
- Does not make impossible candles.

Function:

```ts
export function generateSyntheticCandles(
  trade: ReplayTrade,
  timeframe: ReplayTimeframe,
  options?: {
    preEntryCandles?: number;
    postExitCandles?: number;
  }
): ReplayCandle[]
```

Defaults:

- `preEntryCandles = 60`
- `postExitCandles = 60`

Behavior:

- If `exitDate` exists, interpolate from entry to exit.
- If `exitDate` does not exist, generate post-entry drift around entry price.
- Add noise, but keep first/last key prices close to entry/exit.
- Include stop/take profit in visible price range when present.

UX warning:

Generated candles must never be labeled exact.

### Replay Chart Component

Create:

`src/components/journal/replay/TradeReplayChart.tsx`

Responsibilities:

- Use `createChart`.
- Add `CandlestickSeries`.
- Render candles up to `currentIndex`.
- Create price lines:
  - Entry.
  - SL.
  - TP.
  - Exit if closed.
- Render markers:
  - Entry.
  - Exit.
  - Current candle.
  - Mistake/rule events if available.
- Resize with `ResizeObserver`.
- Clean up chart on unmount.

Props:

```ts
interface TradeReplayChartProps {
  trade: ReplayTrade;
  candles: ReplayCandle[];
  events: ReplayEvent[];
  currentIndex: number;
  quality: ReplayQuality;
  className?: string;
}
```

Important implementation notes:

- Avoid recreating chart every tick.
- Create chart once.
- Update series data when `currentIndex` changes.
- Clean up `chart.remove()`.
- Use stable height.
- Do not render blank chart if candles empty. Show empty state.

### Replay Controls

Create:

`src/components/journal/replay/TradeReplayControls.tsx`

Controls:

- Play / Pause.
- Step back.
- Step forward.
- Jump to entry.
- Jump to exit.
- Speed selector: `1x`, `2x`, `4x`, `8x`.
- Slider from candle 0 to last candle.

Use icons from `lucide-react`:

- `Play`
- `Pause`
- `SkipBack`
- `SkipForward`
- `StepBack`
- `StepForward`

Do not use text-heavy rounded buttons if icon can communicate the action. Use tooltips or `aria-label`.

### Trade Replay State

Create state in:

`src/components/journal/replay/TradeReplayTab.tsx`

State:

```ts
const [data, setData] = useState<TradeReplayResponse | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [currentIndex, setCurrentIndex] = useState(0);
const [isPlaying, setIsPlaying] = useState(false);
const [speed, setSpeed] = useState<1 | 2 | 4 | 8>(1);
```

Playback:

- Use `setInterval`.
- Base interval: 500ms.
- Effective interval: `500 / speed`.
- Stop when `currentIndex >= candles.length - 1`.
- Clear interval on unmount.
- Pause when tab is hidden if practical.

### Autopsy Panel

Create:

`src/components/journal/replay/TradeAutopsyPanel.tsx`

Show:

- Result.
- PnL.
- R multiple if available.
- Entry price.
- Exit price.
- SL.
- TP.
- Followed plan status.
- Mistakes.
- Basic lesson.

Basic lesson rules:

- If `mistakes.length > 0`, use primary mistake from first mistake code.
- If `followedPlan === false`, emphasize plan deviation.
- If no SL, warn "No stop loss recorded."
- If losing trade with SL, show planned vs actual.
- If winning trade with mistakes, warn "Winning trade still had execution flaws."

Example copy:

```txt
This trade was profitable, but it still had 2 recorded mistakes. Do not treat a lucky win as a repeatable setup.
```

### Trade Detail Integration

Modify:

`src/components/journal/TradeDetailSheet.tsx`

Add:

- `PlayCircle` or `RotateCcw` icon import.
- `TradeReplayTab` import.
- Third tab trigger: `Replay`.
- Third tab content.

Example:

```tsx
<TabsTrigger value="replay" ...>
  <PlayCircle size={16} />
  Replay
</TabsTrigger>

<TabsContent value="replay" className="space-y-6">
  <TradeReplayTab tradeId={entry.id} />
</TabsContent>
```

### Phase 1 Acceptance Criteria

Functional:

- User can open a journal trade.
- User can click `Replay`.
- Replay tab loads without errors.
- Chart renders candles.
- Entry marker visible.
- Exit marker visible for closed trades.
- SL/TP lines visible when present.
- Play starts playback.
- Pause stops playback.
- Step forward/back changes candle index.
- Jump to entry/exit works.
- Speed selector affects playback speed.
- Autopsy panel renders trade data.
- Mistakes render with readable names.
- Generated preview badge is visible.

Security:

- User cannot fetch replay for another user's trade.

Responsive:

- Desktop layout has chart and side panel.
- Mobile layout stacks chart, controls, panel.
- No clipped controls on 390x844.

Quality:

- `npx tsc --noEmit` passes.
- `npm run lint` has no new errors.
- Unit tests pass.
- E2E test passes.

### Phase 1 Tests

Unit:

- `calculateRMultiple` for BUY/SELL/win/loss/no SL.
- `calculateMFE` for BUY and SELL.
- `calculateMAE` for BUY and SELL.
- `generateSyntheticCandles` returns sorted valid candles.
- `generateSyntheticCandles` is deterministic for same trade ID.

E2E:

Create:

`tests/e2e/trade-replay-qa.spec.ts`

Test:

- Create user.
- Create trading account.
- Create closed JournalEntry:
  - symbol `XAUUSD`
  - type `BUY`
  - entry price
  - exit price
  - SL
  - TP
  - mistakes
- Login.
- Navigate to `/dashboard/journal`.
- Open trade detail.
- Click `Replay`.
- Assert chart container visible.
- Assert `Generated Preview` visible.
- Assert controls visible.
- Click play.
- Assert progress changes.
- Click pause.
- Click jump to exit.
- Test mobile viewport.

### Phase 1 Claude Prompt

```text
Implement Phase 1 from docs/TRADE_REPLAY_CHART_PLAN_2026-05-10.md.

Build the Trade Replay Preview MVP.

Constraints:
- Do not add Prisma schema changes.
- Do not add external market data.
- Use existing lightweight-charts.
- Keep TradingViewMiniChart.tsx intact.
- Add replay as a new tab in TradeDetailSheet.
- Generated candles must be clearly labeled "Generated Preview".
- Server action must enforce trade ownership.
- Keep UI consistent with the current dashboard.

Files to add:
- src/lib/trade-replay/types.ts
- src/lib/trade-replay/calculations.ts
- src/lib/trade-replay/synthetic-candles.ts
- src/lib/trade-replay/events.ts
- src/actions/trade-replay.ts
- src/components/journal/replay/ReplayQualityBadge.tsx
- src/components/journal/replay/TradeReplayChart.tsx
- src/components/journal/replay/TradeReplayControls.tsx
- src/components/journal/replay/TradeAutopsyPanel.tsx
- src/components/journal/replay/TradeReplayTab.tsx
- tests for calculation helpers
- tests/e2e/trade-replay-qa.spec.ts

File to modify:
- src/components/journal/TradeDetailSheet.tsx

Verification:
- npx tsc --noEmit
- npm run lint
- npm test -- trade-replay
- npx dotenv -e .env -- npx playwright test tests/e2e/trade-replay-qa.spec.ts --project=chromium --reporter=list
```

## Phase 2 - Exact Replay Data

### Goal

Add real candle snapshot storage so replay becomes exact when candle data exists.

Phase 2 turns the feature from "preview" into "trustworthy replay."

### User Value

User sees the actual market path around their trade:

- Real candles before entry.
- Real movement after entry.
- Whether price touched SL/TP.
- Accurate MAE/MFE.
- Accurate missed opportunity.
- Accurate trade path review.

### Scope

In scope:

- Add `TradeReplaySnapshot` model.
- Add Prisma migration.
- Add snapshot read/write server logic.
- Add candle validation.
- Update `getTradeReplay` to prefer exact snapshot.
- Add admin/dev seed utility if needed.
- Extend import/sync endpoint to accept optional candle snapshots.
- Update replay UI badge to show `Exact Replay` when snapshot is used.
- Add tests for snapshot authorization and fallback.

Out of scope:

- Paid market data provider.
- Full broker symbol normalization.
- Bulk historical backfill.
- Advanced AI autopsy.

### Prisma Schema

Add enum:

```prisma
enum ReplayDataSource {
  SYNTHETIC
  EA_SYNC
  IMPORT
  MARKET_PROVIDER
  MANUAL_UPLOAD
}
```

Add model:

```prisma
model TradeReplaySnapshot {
  id             String           @id @default(cuid())
  userId         String           @db.Uuid
  user           User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  journalEntryId String           @unique
  journalEntry   JournalEntry     @relation(fields: [journalEntryId], references: [id], onDelete: Cascade)

  accountId      String?
  symbol         String           @db.VarChar(30)
  timeframe      String           @default("M5") @db.VarChar(10)
  source         ReplayDataSource @default(SYNTHETIC)

  fromTime       DateTime         @db.Timestamptz
  toTime         DateTime         @db.Timestamptz

  candles        Json             @db.JsonB
  metadata       Json?            @db.JsonB

  createdAt      DateTime         @default(now()) @db.Timestamptz
  updatedAt      DateTime         @updatedAt @db.Timestamptz

  @@index([userId, symbol])
  @@index([journalEntryId])
  @@index([source])
}
```

Add to `JournalEntry`:

```prisma
replaySnapshot TradeReplaySnapshot?
```

Important:

- Use `onDelete: Cascade`.
- Snapshot has both `userId` and `journalEntryId` for secure filtering.
- `candles` as JSONB is acceptable because snapshots are per trade and capped.

### Migration Commands

After schema update:

```bash
npx prisma format
npx dotenv -e .env -- npx prisma migrate dev --name add_trade_replay_snapshots
npx prisma generate
```

If local workflow uses `db push`, use the repo's existing process. Do not guess production migration behavior.

### Server Action Changes

Update:

`src/actions/trade-replay.ts`

Add:

```ts
export async function createTradeReplaySnapshot(input: {
  tradeId: string;
  timeframe: ReplayTimeframe;
  source: Exclude<ReplayDataSource, "SYNTHETIC">;
  candles: ReplayCandle[];
  metadata?: Record<string, unknown>;
})
```

Rules:

- Auth required.
- Trade ownership required.
- Normalize and validate candles.
- Reject empty candles.
- Reject too many candles.
- Set `fromTime` and `toTime` from candle range.
- Upsert by `journalEntryId`.
- Revalidate `/dashboard/journal`.

Update `getTradeReplay`:

Flow:

1. Fetch owned trade.
2. Fetch snapshot by `journalEntryId` and `userId`.
3. If snapshot exists:
   - normalize candles.
   - return `source = snapshot.source`.
   - return `quality = "exact"`.
4. Else:
   - return generated synthetic preview as Phase 1.

### API / Sync Integration

Candidate endpoint:

`src/app/api/sync/trades/route.ts`

Optional payload shape:

```ts
interface SyncedTradePayload {
  ticket: string;
  symbol: string;
  type: "BUY" | "SELL";
  entryPrice: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  lotSize: number;
  pnl?: number;
  entryDate: string;
  exitDate?: string;
  replay?: {
    timeframe: "M1" | "M5" | "M15" | "H1";
    candles: ReplayCandle[];
  };
}
```

Server behavior:

- Sync trade as usual.
- If `replay.candles` exists:
  - validate candles.
  - save `TradeReplaySnapshot`.
  - source `EA_SYNC`.

Important:

- Do not make candles required.
- A bad replay payload should not fail trade sync unless the whole payload is invalid.
- Log or return warning for invalid candle snapshot.

### Manual Import Integration

If there is an import flow:

- Allow future CSV candle upload.
- Not required in Phase 2 MVP if EA sync is enough.

### Exact Replay UI

Update:

`ReplayQualityBadge.tsx`

Badge rules:

- `quality === "exact"`:
  - Label: `Exact Replay`
  - Description: `Uses saved candle data from your synced/imported trade.`
  - Color: emerald/green.

- `quality === "preview"`:
  - Label: `Generated Preview`
  - Description: `Generated from your trade data. Not exact market candles.`
  - Color: amber.

### Phase 2 Acceptance Criteria

Data:

- Prisma migration applies.
- Snapshot can be created for owned trade.
- Snapshot cannot be created for another user's trade.
- Snapshot candles are validated.
- Snapshot upsert works.
- Deleting trade deletes snapshot.

Replay:

- Trade with snapshot uses exact candles.
- Trade without snapshot falls back to generated preview.
- Badge changes correctly.
- MAE/MFE uses exact candles when available.
- Chart still works on mobile.

Sync:

- Sync endpoint accepts optional replay candles.
- Invalid candle snapshot does not break regular trade sync.

Security:

- User cannot read another user's snapshot.
- User cannot write snapshot to another user's trade.

### Phase 2 Tests

Unit:

- Candle validation accepts valid OHLC.
- Candle validation rejects bad high/low.
- Candle validation sorts and dedupes.
- Snapshot mapper converts DB JSON to `ReplayCandle[]`.

Integration:

- `createTradeReplaySnapshot` owned trade succeeds.
- Another user's trade fails.
- `getTradeReplay` uses exact snapshot when present.
- `getTradeReplay` uses synthetic fallback when missing.

E2E:

- Create test user/trade/snapshot.
- Open replay.
- Verify `Exact Replay` badge.
- Verify chart loads with snapshot candles.
- Create another trade without snapshot.
- Verify `Generated Preview` badge.

### Phase 2 Claude Prompt

```text
Implement Phase 2 from docs/TRADE_REPLAY_CHART_PLAN_2026-05-10.md.

Goal:
- Add exact replay snapshots.

Scope:
- Add Prisma enum ReplayDataSource.
- Add TradeReplaySnapshot model.
- Add JournalEntry relation.
- Add migration.
- Add candle validation helper.
- Update src/actions/trade-replay.ts to read snapshot first and fallback to synthetic.
- Add createTradeReplaySnapshot action with ownership checks.
- Update sync trade endpoint to accept optional replay candles if straightforward.
- Update UI quality badge for Exact Replay vs Generated Preview.
- Add tests for validation, ownership, exact/fallback behavior.

Constraints:
- Do not remove synthetic fallback.
- Do not make replay candles required for trade sync.
- Do not expose another user's replay data.
- Limit candle payload size.

Verification:
- npx prisma format
- npx prisma generate
- npx tsc --noEmit
- npm run lint
- npm test -- trade-replay
- npx dotenv -e .env -- npx playwright test tests/e2e/trade-replay-qa.spec.ts --project=chromium --reporter=list
```

## Phase 3 - Autopsy Intelligence

### Goal

Turn replay into a personal coaching engine.

Phase 3 is the moat. Competitors can show charts. TheNextTrade should explain the mistake, calculate the leak, and recommend the next lesson/rule.

### User Value

User should be able to answer:

- What did I do wrong?
- How much did it cost?
- Did I repeat this mistake before?
- What rule would have protected me?
- What lesson should I study next?
- Which trades should I replay this week?

### Scope

In scope:

- MAE/MFE display.
- Planned vs actual outcome.
- Mistake cost estimates.
- Rule violation overlays.
- AI autopsy summary.
- Lesson recommendations.
- Weekly replay playlist.
- Replay analytics events.
- Pro gating for advanced autopsy.

Out of scope:

- Fully automated trading advice.
- Entry signal generation.
- Prediction of future trades.
- Order placement.
- Guaranteed PnL claims.

### Advanced Autopsy Model

Add a service:

`src/lib/services/trade-autopsy.service.ts`

Functions:

- `buildAdvancedTradeAutopsy(trade, candles, accountRules)`
- `detectReplayMistakes(trade, candles, historicalTrades)`
- `estimateMistakeCost(trade, candles)`
- `recommendLessonsForAutopsy(autopsy)`
- `buildAutopsyPromptContext(trade, metrics, mistakes, rules)`

### Autopsy Output Type

Extend `TradeAutopsy`:

```ts
export interface TradeAutopsy {
  rMultiple: number | null;
  mfePrice: number | null;
  maePrice: number | null;
  plannedRiskPrice: number | null;
  actualMovePrice: number | null;
  earlyExitCostPrice: number | null;
  disciplineLeakAmount: number | null;
  primaryMistake: string | null;
  summary: string;
  lessons: string[];

  mistakeCosts?: Array<{
    mistakeId: string;
    label: string;
    estimatedCostAmount: number | null;
    estimatedCostR: number | null;
    confidence: "low" | "medium" | "high";
    explanation: string;
  }>;

  ruleViolations?: Array<{
    type: string;
    label: string;
    severity: "warning" | "danger";
    explanation: string;
  }>;

  aiSummary?: {
    title: string;
    whatHappened: string;
    mainMistake: string;
    moneyLeak: string;
    nextRule: string;
  };
}
```

### Mistake Cost Examples

#### Early Exit

If TP exists and price later reached TP after user exited early:

- Cost = planned TP result - actual result.
- Confidence high if exact candles show TP touched.

#### No Stop Loss

If no SL recorded:

- Cost cannot be exact.
- Confidence low.
- Lesson: "Record and respect SL before entry."

#### Over-risk

If account has `maxRiskPercent` and trade risk estimate exceeds it:

- Cost = excess risk above allowed risk.
- Confidence medium unless symbol pip value is known.

#### Revenge Trade / Cooldown Violation

If trade happened within cooldown window after loss streak:

- Cost = trade PnL if loss.
- Confidence medium.

#### Moved SL / Late Exit

Only calculate when planned SL exists and actual loss exceeds planned SL.

- Cost = actual loss - planned loss.
- Confidence medium/high depending on data.

### Rule Violation Overlay

Use existing `TradingAccount` fields:

- `maxDailyLoss`
- `maxDailyTrades`
- `maxRiskPercent`
- `cooldownAfterLosses`

For the selected trade, detect:

- Risk % limit exceeded.
- Trade happened after cooldown threshold.
- Trade happened on a day exceeding max daily trades.
- Trade happened on a day exceeding max daily loss.

Display on chart:

- Event marker near entry candle.
- Badge in autopsy panel.

Example:

```txt
Cooldown Rule Violated
You entered this trade 18 minutes after your second loss. Your rule requires a cooldown.
```

### AI Autopsy

Create action:

`src/actions/trade-autopsy-ai.ts`

Or keep in:

`src/actions/trade-replay.ts`

Recommended:

- Separate action for AI to keep replay fast.

Function:

```ts
export async function generateTradeAutopsy(tradeId: string)
```

Rules:

- Auth required.
- User owns trade.
- Pro required.
- Use structured input only.
- Do not send secrets, API keys, account number.
- Do not claim certainty beyond data.
- Return short structured JSON.

Prompt rules:

- Mention concrete trade facts.
- Mention mistake by name.
- Mention cost if calculable.
- Give one next rule.
- Give one next lesson.
- No generic motivational paragraphs.
- No financial advice or future prediction.

Output:

```ts
interface AiTradeAutopsy {
  title: string;
  whatHappened: string;
  mainMistake: string;
  moneyLeak: string;
  nextRule: string;
  lesson: string;
}
```

### Weekly Replay Playlist

Create:

`src/actions/replay-playlist.ts`

Function:

```ts
export async function getWeeklyReplayPlaylist(accountId?: string)
```

Selection rules:

Pick up to 5 trades:

1. Biggest loss.
2. Biggest estimated mistake cost.
3. Most repeated mistake.
4. Worst rule violation.
5. Best execution or best R trade.

Return:

```ts
interface ReplayPlaylistItem {
  tradeId: string;
  symbol: string;
  entryDate: string;
  pnl: number | null;
  reason: string;
  priority: "high" | "medium" | "low";
  mistakeIds: string[];
}
```

UI:

- Add card on `/dashboard/intelligence` or `/dashboard/journal`.
- Title: `Trades Worth Replaying This Week`
- Each item opens `TradeDetailSheet` directly on `Replay` tab if possible.

### Lesson Recommendations

Use:

`src/lib/services/mistake-lessons.service.ts`

Flow:

- Collect mistake IDs from trade.
- Collect detected rule violations.
- Map to lesson recommendations.
- Show `Recommended lesson` cards in autopsy panel.

CTA:

- `Study this lesson`
- Link to Academy lesson if available.

### Pro Gating

Advanced autopsy should be Pro.

Recommended split:

Free:

- Basic replay preview.
- Entry/exit/SL/TP.
- Simple result panel.

Pro:

- AI autopsy.
- Exact replay if data exists.
- Mistake cost.
- Rule overlays.
- Weekly playlist.
- Lesson recommendations.

Implementation:

- Use `useProAccess()` in client for UI gating.
- Use `getUserProAccess()` in server actions for real enforcement.

Do not rely only on client gating.

### Analytics Events

Track:

- `trade_replay_opened`
- `trade_replay_play_clicked`
- `trade_replay_completed`
- `trade_replay_seeked`
- `trade_autopsy_generated`
- `trade_autopsy_lesson_clicked`
- `trade_replay_pro_gate_clicked`

Payload:

```ts
{
  tradeId,
  symbol,
  result,
  quality,
  source,
  hasMistakes,
  isPro
}
```

Do not include sensitive account number or broker API key.

### Phase 3 Acceptance Criteria

Autopsy:

- Trade with SL shows R multiple.
- Trade with exact candles shows MAE/MFE.
- Losing trade with late exit shows estimated discipline leak if calculable.
- Trade with mistakes shows mistake explanations.
- Trade with rule violations shows rule badges.
- AI autopsy returns structured short summary.
- AI autopsy does not generate trading signals.

Playlist:

- Weekly replay playlist returns 3-5 meaningful trades when data exists.
- Empty state is useful when no trades exist.

Pro:

- Free user cannot call Pro-only autopsy actions.
- Pro user can access advanced autopsy.

UI:

- Advanced autopsy panel remains readable.
- Mobile layout works.
- No hidden overflow or clipped controls.

### Phase 3 Tests

Unit:

- Mistake cost estimation.
- Rule violation detection for selected trade.
- Playlist selection priority.
- Lesson recommendation mapping.

Integration:

- Pro user can call AI autopsy.
- Free user receives `Pro required`.
- User cannot generate autopsy for another user's trade.

E2E:

- Create Pro test user.
- Create trades with repeated mistake.
- Open replay.
- Verify mistake cost card.
- Verify lesson recommendation.
- Verify AI autopsy button/summary.
- Verify weekly playlist appears.
- Test mobile.

### Phase 3 Claude Prompt

```text
Implement Phase 3 from docs/TRADE_REPLAY_CHART_PLAN_2026-05-10.md.

Goal:
- Add advanced Trade Autopsy intelligence on top of existing replay.

Scope:
- Add trade-autopsy service for MAE/MFE, mistake cost, rule overlays, and lesson recommendations.
- Add Pro-gated AI autopsy action with structured output.
- Add weekly replay playlist action and UI card.
- Use existing mistake taxonomy and mistake-lessons.service.ts.
- Use existing TradingAccount rule settings.
- Add analytics events for replay/autopsy usage.
- Enforce Pro gating server-side for advanced features.

Constraints:
- Do not generate entry signals or future predictions.
- Do not expose secrets/account numbers.
- Keep AI copy short, concrete, and based on trade data.
- Avoid broad refactors.

Verification:
- npx tsc --noEmit
- npm run lint
- npm test -- trade-autopsy
- npx dotenv -e .env -- npx playwright test tests/e2e/trade-replay-qa.spec.ts --project=chromium --reporter=list
```

## Cross-Phase UX Details

### Empty States

No trade selected:

```txt
Select a trade to replay its execution.
```

No candles:

```txt
Replay data is not available for this trade.
```

Synthetic only:

```txt
Generated Preview
This replay is generated from your trade data. Connect MT5 sync for exact candle replay.
```

No SL:

```txt
No stop loss recorded. R multiple and planned risk cannot be calculated.
```

Open trade:

```txt
This trade is still open. Replay shows candles after entry only.
```

### Copy Tone

Good:

```txt
You entered after two consecutive losses and risked above your account rule.
This trade lost -$220. Your planned SL would have limited the loss to about -$80.
Next rule: stop trading for 60 minutes after two losses.
```

Bad:

```txt
This trade highlights the importance of discipline and strong risk management.
```

### Accessibility

Controls must have:

- `aria-label`.
- Keyboard reachable buttons.
- Visible focus states.
- Slider label.

Chart must have:

- Text summary outside canvas.
- Autopsy panel that does not rely only on color.

## Risk Register

| Risk | Phase | Mitigation |
| --- | --- | --- |
| User thinks synthetic replay is real | Phase 1 | Strong `Generated Preview` badge and warning |
| Candle payload too large | Phase 2 | Limit candle count and payload size |
| Wrong symbol pip calculation | Phase 3 | Label money estimates as estimated until symbol-aware pip values are implemented |
| AI gives generic advice | Phase 3 | Strict structured prompt and short output |
| Free user bypasses Pro UI gate | Phase 3 | Server-side `getUserProAccess()` enforcement |
| Chart performance poor | All | Limit candles, clean intervals, avoid re-creating chart |
| Mobile controls cramped | All | Stack layout, stable chart height, icon controls |

## Final Recommendation

Build all three phases, but do not build them at once.

Recommended release sequence:

1. Phase 1: ship replay preview fast.
2. QA and let real users react.
3. Phase 2: add exact candle snapshots through EA sync/import.
4. Phase 3: add autopsy intelligence and Pro value.

The strategic goal:

> TheNextTrade should not be the place where traders look at charts. It should be the place where traders finally understand why they lost money.
