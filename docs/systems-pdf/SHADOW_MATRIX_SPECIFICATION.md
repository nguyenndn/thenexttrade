# GOLD SCALPER NINJA — SHADOW MATRIX
## Complete Operating Manual & Technical Specification · From First Install to Confident Live Operation

*Platform: MetaTrader 5 · Instrument: XAUUSD / GOLD · Timeframe: M5 Signal + M15 Grid Engine · Edition: Shadow Matrix (v3.34 Baseline)*

> *"A good automated system is not one that never loses. It is one that loses only in the way you planned for."*

---

## Welcome — Read This Page Before Anything Else

Thank you for running **Gold Scalper Ninja — Shadow Matrix**. This document is written as a complete operating manual and technical specification, not just a parameter lookup table: every subsystem and setting is explained by **why it exists** before we talk about **what value to use**. Every setting is called by the exact English label you see in the EA's settings window (press `F7` on the chart) or on the interactive **Obsidian 3-Tab Control Panel**.

Take twenty minutes to read **Part I** and **Part II** before attaching the EA to a chart. Those pages will save you months of trial and error.

### How to Read the Callout Boxes in This Manual

- **✓ Recommended** — The setting or workflow we suggest for 90% of accounts. Start here; only deviate once you have seen at least 30 trading days of live behavior.
- **i Explanation** — Plain-English explanation of a trading concept or internal MQL5 algorithm, with a concrete number example on XAUUSD.
- **★ Pro Tip** — A subtle behavior of the EA that experienced operators use to squeeze out extra safety or extra return.
- **! Warning** — Settings or habits that can blow an account if misunderstood. Read every warning twice.

### A Quick Word About "Points" on Gold (XAUUSD)

Throughout this manual, distances are measured in **points** — the smallest price unit your broker quotes on Gold:

- On a **2-decimal** broker (price looks like `2650.25`), `1 point = $0.01`, so **`100 points = $1.00` of gold price movement**.
- On a **3-decimal** broker (price looks like `2650.250`), `1 raw point = $0.001`, so **`1,000 raw points = $1.00` of gold price movement**.

> **i Automatic Broker Digit Normalization (`GetPointScale` & `GetGoldPoint`)**
> Shadow Matrix automatically normalizes 2-decimal and 3-decimal brokers inside [`GetPointScale()`](file:///C:/Users/Kee/AppData/Roaming/MetaQuotes/Terminal/D0E8209F77C8CF37AD8BF550E51FF075/MQL5/Experts/GoldScalperNinja/GoldScalperNinja%20-%20EA/GoldScalperNinja%20-%20Shadow%20Matrix.mq5#L3712-L3724). When `Digits == 3`, the EA multiplies point inputs by `10`. Therefore, **`100 points` in your settings always equals `$1.00` of gold movement** regardless of whether your broker quotes 2 or 3 decimals (`90 points = $0.90`, `150 points = $1.50`, `250 points = $2.50`).

---

## Table of Contents

- **Part I — How Shadow Matrix Trades**
  - In One Sentence & The Five Core Weapons
  - Lesson 1 · The Life of One Trading Cycle (6 Stages)
  - Lesson 2 · Three Numbers That Decide If You Survive (With Worked Example)
  - Lesson 3 · Installation & License Setup in Ten Minutes
- **Part II — The Obsidian 3-Tab Control Panel (`500 × 508 px`)**
  - View 0 (`VIEW_MAIN`) · Live Telemetry Monitor & Action Bar
  - View 1 (`VIEW_SETTINGS`) · Interactive Strategy & Risk Settings
  - View 2 (`VIEW_STATS`) · Monthly Profit Calendar & Weekly Heatmap
- **Part III — Input Settings (`F7`) — Every Setting, in Plain Words**
  - Section 1 · General Settings & Persistent Dashboard Controls
  - Section 2 · Money Management (Asymmetric Multipliers & EMA-34 Reversal Brake)
  - Section 3 · Grid & Hedge Engine (M15 Step, ATR Spacing, Hedge Distance & Hard Tier Ceiling)
  - Section 4 · Recovery Grid / RECO Trap (`RecovLine_Upper` & `RecovLine_Lower`)
  - Section 5 · Smart Pruning Defense (Same-Side Tail Trimming)
  - Section 6 · First Order Take Profit (Fast Single-Order Scalp)
  - Section 7 · Strategy 1–6 (`M5` Seed Entry Filters)
  - Section 8 · Trading Sessions & System Theme
- **Part IV — Capital Management, Stress-Test Scorecard & 30-Day Roadmap**
  - The Five Golden Rules of Capital
  - Three Starting Configurations & July 2026 Stress-Test Benchmark
  - Your First 30 Days & Troubleshooting

---

# PART I · HOW SHADOW MATRIX TRADES

*Before you touch a single parameter, understand the personality of the machine you are putting in charge of your money.*

## In One Sentence

**Shadow Matrix** is a trend-seeded, asymmetric **Dual Grid & Counter-Hedge** gold trading system on **XAUUSD** that opens its initial seed position on closed **`M5`** candle signals, harvests fast single-order scalps when price moves immediately in favor (`+90 points / $0.90`), locks in a counter-hedge at `-250 points (-$2.50)` when price pushes against the seed, and expands a simultaneous two-way `BUY + SELL` grid on **`M15`** (`150 points / $1.50`) — combining **EMA-34 Trend Reversal Lot Braking**, a **Recovery Corridor Trap (RECO Trap)**, and **Same-Side Smart Pruning** to close the entire basket via non-blocking **`OrderSendAsync`** the moment combined floating profit reaches **`$50.00`**.

---

## The Five Core Weapons of Shadow Matrix

Traditional single-direction martingale grid EAs suffer from one fatal flaw: in a relentless $80–$120 one-way gold trend without a pullback, exponentially multiplied counter-trend lots eventually exhaust free margin. Shadow Matrix eliminates that single-point failure with five integrated mechanisms:

### Weapon 1 · Six `M5` Seed Strategy Filters & Fast First-Order Scalp ([`CheckEntrySignal`](file:///C:/Users/Kee/AppData/Roaming/MetaQuotes/Terminal/D0E8209F77C8CF37AD8BF550E51FF075/MQL5/Experts/GoldScalperNinja/GoldScalperNinja%20-%20EA/GoldScalperNinja%20-%20Shadow%20Matrix.mq5#L3971-L4072) & [`CheckFirstOrderTP`](file:///C:/Users/Kee/AppData/Roaming/MetaQuotes/Terminal/D0E8209F77C8CF37AD8BF550E51FF075/MQL5/Experts/GoldScalperNinja/GoldScalperNinja%20-%20EA/GoldScalperNinja%20-%20Shadow%20Matrix.mq5#L3923-L3968))
Shadow Matrix never opens a cycle blind. When the chart has zero open orders (`total_orders == 0`), it evaluates closed-candle (`shift = 1`) signals on `M5` using one of **6 selectable institutional filters** (`MA (EMA/SMA)` [Default], `SuperTrend`, `Ichimoku`, `ADX + RSI Pullback`, `Bollinger Bands`, or `MACD Trend`).
- If the initial seed order (`0.02 lot` with comment `"Start Buy"` or `"Start Sell"`) moves favorably right away, [`CheckFirstOrderTP()`](file:///C:/Users/Kee/AppData/Roaming/MetaQuotes/Terminal/D0E8209F77C8CF37AD8BF550E51FF075/MQL5/Experts/GoldScalperNinja/GoldScalperNinja%20-%20EA/GoldScalperNinja%20-%20Shadow%20Matrix.mq5#L3923-L3968) closes it at **`First Order TP (Points) = 90`** (`$0.90`), banks the quick scalp profit, and immediately arms a fresh cycle (`g_need_reentry = true`).

### Weapon 2 · Initial Counter-Hedge & Symmetric Dual Grid ([`CheckHedgeLogic`](file:///C:/Users/Kee/AppData/Roaming/MetaQuotes/Terminal/D0E8209F77C8CF37AD8BF550E51FF075/MQL5/Experts/GoldScalperNinja/GoldScalperNinja%20-%20EA/GoldScalperNinja%20-%20Shadow%20Matrix.mq5#L4228-L4336) & [`OpenGridPair`](file:///C:/Users/Kee/AppData/Roaming/MetaQuotes/Terminal/D0E8209F77C8CF37AD8BF550E51FF075/MQL5/Experts/GoldScalperNinja/GoldScalperNinja%20-%20EA/GoldScalperNinja%20-%20Shadow%20Matrix.mq5#L4341-L4360))
- **Initial Counter-Hedge (`!is_hedged`)**: If the single seed order drops **`Hedge Distance (Points) = 250`** (`$2.50`) into drawdown (`total_buy == 1 && total_sell == 0` or vice versa), the EA opens a counter-direction position (`" Hedge Start"`) to lock floating drawdown inside a $2.50 corridor.
- **Simultaneous Dual Grid Expansion (`is_hedged == true`)**: Once both `BUY` and `SELL` legs exist on the chart, every new **`M15`** bar (`IsNewBar(InpGridTF, g_last_grid_bar)`) where price has moved at least `effective_step` (`150 points = $1.50` fixed, or `150 + ATR(14) × 1.0` when Dynamic ATR Spacing is enabled) away from the boundary orders triggers [`OpenGridPair()`](file:///C:/Users/Kee/AppData/Roaming/MetaQuotes/Terminal/D0E8209F77C8CF37AD8BF550E51FF075/MQL5/Experts/GoldScalperNinja/GoldScalperNinja%20-%20EA/GoldScalperNinja%20-%20Shadow%20Matrix.mq5#L4341-L4360), opening **both** `" Grid Buy"` and `"Grid Sell"` at the same time.

### Weapon 3 · Asymmetric Lot Ladder & EMA-34 Trend Reversal Brake ([`CalculateLot`](file:///C:/Users/Kee/AppData/Roaming/MetaQuotes/Terminal/D0E8209F77C8CF37AD8BF550E51FF075/MQL5/Experts/GoldScalperNinja/GoldScalperNinja%20-%20EA/GoldScalperNinja%20-%20Shadow%20Matrix.mq5#L4170-L4223))
When expanding the grid, Shadow Matrix inspects the **most recently opened order (`TimeMsc()`)** of each side:
- **Winning Side (`Winning Side Multiplier = 1.05`)**: If current price is in profit relative to the newest order of that direction, the next lot scales gently by `1.05x`.
- **Losing Side (`Losing Side Multiplier = 1.60`)**: If current price is losing relative to the newest order of that direction, the raw multiplier is `1.60x`.
- **EMA-34 Trend Reversal Brake (`Reduce Lot on Trend Reversal = true`, `Reversal Reduction Ratio = 0.50`)**: Whenever an order is placed **against** the current `M5 EMA-34` trend (`BUY` while `Close < EMA-34`, or `SELL` while `Close > EMA-34`), the multiplier is cut in half (`× 0.50`). Thus, a losing counter-trend side gets `1.60 × 0.50 = 0.80x` (clamped at `Base Lot Size = 0.02`), preventing runaway martingale lot inflation during one-way breakouts while allowing the winning trend side to compound (`0.02 -> 0.03 -> 0.04 -> 0.05...` via `MathCeil`).

### Weapon 4 · Recovery Corridor Trap ("RECO Trap" — [`CheckRecoveryLogic`](file:///C:/Users/Kee/AppData/Roaming/MetaQuotes/Terminal/D0E8209F77C8CF37AD8BF550E51FF075/MQL5/Experts/GoldScalperNinja/GoldScalperNinja%20-%20EA/GoldScalperNinja%20-%20Shadow%20Matrix.mq5#L4077-L4133) & [`DrawRecoveryLines`](file:///C:/Users/Kee/AppData/Roaming/MetaQuotes/Terminal/D0E8209F77C8CF37AD8BF550E51FF075/MQL5/Experts/GoldScalperNinja/GoldScalperNinja%20-%20EA/GoldScalperNinja%20-%20Shadow%20Matrix.mq5#L4409-L4443))
Once the basket is hedged (`total_buy > 0 && total_sell > 0`), the EA tracks the **earliest BUY open price** and **earliest SELL open price** and draws two horizontal dotted lines on the chart:
- `RecovLine_Upper` (Green dotted line) at the higher boundary (`upper_bound`).
- `RecovLine_Lower` (Red dotted line) at the lower boundary (`lower_bound`).
On every tick (without waiting for the `M15` candle close), if price re-tests either boundary within **`Recovery Boundary Buffer = 50` points (`$0.50`)** and is at least `Grid Step = 150` points away from the newest `BUY` and newest `SELL` orders ([`IsFarFromLastOrder`](file:///C:/Users/Kee/AppData/Roaming/MetaQuotes/Terminal/D0E8209F77C8CF37AD8BF550E51FF075/MQL5/Experts/GoldScalperNinja/GoldScalperNinja%20-%20EA/GoldScalperNinja%20-%20Shadow%20Matrix.mq5#L4138-L4165)), Shadow Matrix fires a fresh `OpenGridPair(" Recov Buy", " Recov Sell")` to accelerate basket breakeven on whipsaw breakouts.

### Weapon 5 · Same-Side Smart Pruning ([`CheckPruningLogic`](file:///C:/Users/Kee/AppData/Roaming/MetaQuotes/Terminal/D0E8209F77C8CF37AD8BF550E51FF075/MQL5/Experts/GoldScalperNinja/GoldScalperNinja%20-%20EA/GoldScalperNinja%20-%20Shadow%20Matrix.mq5#L3796-L3806)) & Lightning Async Basket Exit ([`CloseAll`](file:///C:/Users/Kee/AppData/Roaming/MetaQuotes/Terminal/D0E8209F77C8CF37AD8BF550E51FF075/MQL5/Experts/GoldScalperNinja/GoldScalperNinja%20-%20EA/GoldScalperNinja%20-%20Shadow%20Matrix.mq5#L4365-L4404))
- **Same-Side Smart Pruning**: When either direction accumulates **`>= 5` open orders (`Danger Tier Threshold = 5`)**, [`PruneSideSequence()`](file:///C:/Users/Kee/AppData/Roaming/MetaQuotes/Terminal/D0E8209F77C8CF37AD8BF550E51FF075/MQL5/Experts/GoldScalperNinja/GoldScalperNinja%20-%20EA/GoldScalperNinja%20-%20Shadow%20Matrix.mq5#L3808-L3900) pairs the **newest profitable order** on that side with the **oldest deepest-losing order on that same side**. As soon as their combined net profit (including commission and swap) reaches **`>= $1.00` (`Pruning Surplus Profit`)**, both orders are closed sequentially — **Losing Leg First, Winning Leg Second** — freeing tier capacity under the `Max Grid Tiers = 8` ceiling.
- **Lightning Async Basket Exit**: The instant total floating profit across all open orders reaches **`Basket Take Profit ($) = $50.00`**, [`CloseAll()`](file:///C:/Users/Kee/AppData/Roaming/MetaQuotes/Terminal/D0E8209F77C8CF37AD8BF550E51FF075/MQL5/Experts/GoldScalperNinja/GoldScalperNinja%20-%20EA/GoldScalperNinja%20-%20Shadow%20Matrix.mq5#L4365-L4404) switches `CTrade` to `AsyncMode(true)` and dispatches parallel `OrderSendAsync` close instructions for the entire basket within milliseconds.

---

## Lesson 1 · The Life of One Trading Cycle

Every dollar Shadow Matrix makes comes from repeating one clean 6-stage cycle over and over. Understanding this cycle is 80% of mastering the EA:

```mermaid
flowchart TD
    A["Stage 1: Gate & License Check<br/>EA ACTIVE = ON · Trading Session Valid · Total Orders = 0"] --> B["Stage 2: M5 Seed Entry<br/>Evaluate Closed Bar (Shift 1) on Selected Strategy Filter (1..6)<br/>Open 0.02 Lot 'Start Buy' or 'Start Sell'"]
    B --> C{"Moves +90 pts ($0.90)<br/>while Total Orders == 1?"}
    C -- "Yes (Fast Scalp)" --> D["CheckFirstOrderTP()<br/>Close Seed Order · Arm Immediate Re-entry (g_need_reentry = true)"]
    C -- "No, drops -250 pts ($2.50)" --> E["Stage 3: Initial Counter-Hedge<br/>Open Opposite 'Hedge Start' Order<br/>Basket enters Hedged State (is_hedged = true)"]
    E --> F["Stage 4: Dual Grid & RECO Trap<br/>• Every M15 bar beyond 150 pts: OpenGridPair ('Grid Buy' + 'Grid Sell')<br/>• Every Tick near RecovLine (50 pts buffer): OpenGridPair ('Recov Buy' + 'Recov Sell')<br/>• Hard Ceiling: InpMaxGridTiers = 8 per side"]
    F --> G{"Stage 5: Any Side >= 5 Orders<br/>(InpPruneDangerTier = 5)?"}
    G -- "Yes & Newest Win + Oldest Loss >= +$1.00" --> H["PruneSideSequence()<br/>Close Oldest Loser First -> Close Newest Winner Second"]
    H --> I{"Stage 6: Total Basket Profit<br/>>= InpTPTotal ($50.00)?"}
    G -- "No" --> I
    I -- "Yes" --> J["CloseAll() via OrderSendAsync<br/>Delete RecovLines · Reset Cycle · Re-enter if Not Last Round"]
```

| Stage | What Happens on the Chart | Governing Functions & Parameters |
| :--- | :--- | :--- |
| **1. Gate & License Check** | On every tick, the EA verifies license status (`<AccountValidator.mqh>`), checks `EA ACTIVE` toggle, and checks `IsTradingAllowed()` session windows when starting a new cycle. | `OnTick()`, `IsTradingAllowed()`, `g_stop_after_close` (`LAST ROUND`) |
| **2. Seed Entry & Fast Scalp** | When `total_orders == 0`, evaluates closed `M5` bar (`shift = 1`) on the active strategy (`FILTER_MA` by default). Opens `0.02 lot` seed order. If it hits `+90 points ($0.90)` before hedging, closes immediately. | `CheckEntrySignal()`, `CheckFirstOrderTP()`, `InpTPFirstPoints = 90`, `InpTPFirstMoney = 0` |
| **3. Initial Counter-Hedge** | If the solitary seed order moves `-250 points (-$2.50)` against entry, opens an opposite `" Hedge Start"` order (`CalculateLot` using `InpMultLose = 1.60` + EMA-34 check). | `CheckHedgeLogic()`, `InpHedgeDist = 250` |
| **4. Dual Grid & RECO Trap** | Once `is_hedged == true`, expands `BUY + SELL` pairs on `M15` every `150 points ($1.50)` beyond boundary orders, or on any tick within `50 points ($0.50)` of `RecovLine_Upper` / `RecovLine_Lower`. Capped at `8` tiers per side. | `OpenGridPair()`, `CheckRecoveryLogic()`, `InpGridStep = 150`, `InpRecovBuffer = 50`, `InpMaxGridTiers = 8` |
| **5. Same-Side Smart Pruning** | When `BUY` or `SELL` count reaches `>= 5`, pairs the newest winner with the oldest loser of that **same direction** whenever net profit `>= $1.00`. Closes loser first, winner second. | `CheckPruningLogic()`, `PruneSideSequence()`, `InpPruneDangerTier = 5`, `InpPruneMinProfit = 1.0` |
| **6. Async Basket Exit** | When total floating net profit across all open positions reaches **`$50.00`**, fires parallel `OrderSendAsync` to flatten all positions, deletes recovery lines, and starts the next cycle. | `CloseAll()`, `InpTPTotal = 50.0` |

---

## Lesson 2 · Three Numbers That Decide If You Survive

Every grid trader eventually asks: *"How much money do I need to run this safely?"* The answer is governed by three numbers:

1. **Depth of Tolerance (in USD of gold movement)**:
   With `Hedge Distance = 250` (`$2.50`), `Grid Step = 150` (`$1.50`), and `Max Grid Tiers = 8`, the 8 tiers span `$2.50 + (7 × $1.50) = $13.00` of direct grid spacing, while **Same-Side Smart Pruning** continuously recycles tiers `5..8` as price trends or oscillates.
2. **Total Lot Progression (Protected by EMA-34 Trend Reversal Brake)**:
   Because `CalculateLot()` uses `MathCeil(lot / step) * step` (`step = 0.01`) and applies `InpTrendRevMult = 0.50` whenever an order is against the `M5 EMA-34` trend, your lot exposure during a one-way trend stays remarkably light compared to a standard `1.60x` martingale.
3. **Net Basket Offset (`With-Trend Winning Ladder` vs. `Counter-Trend Flat Ladder`)**:
   In a sustained bullish breakout (`Close > EMA-34`), `BUY` orders are with-trend winners (`× 1.05`, rounded up via `MathCeil`), while `SELL` orders are losing counter-trend orders (`× 1.60 × 0.50 = 0.80x`, clamped back to `0.02 lot` minimum).

### Worked Example in Numbers (Base Lot `0.02`, Sustained Bullish Trend `Close > EMA-34`)

See how `CalculateLot()` behaves across 8 tiers when Gold rallies relentlessly above `EMA-34`:

| Tier # | With-Trend `BUY` Lot (`× 1.05` + `MathCeil`) | Counter-Trend `SELL` Lot (`1.60 × 0.50 = 0.80x` -> Clamped `0.02`) | Unprotected Martingale `1.60x` (`InpUseTrendRev = false`) |
| :---: | :---: | :---: | :---: |
| **Tier 1** | `0.02` | `0.02` | `0.02` |
| **Tier 2** | `0.03` (`0.02 × 1.05 = 0.021 -> 0.03`) | `0.02` (`0.02 × 0.80 = 0.016 -> 0.02`) | `0.04` |
| **Tier 3** | `0.04` (`0.03 × 1.05 = 0.0315 -> 0.04`) | `0.02` | `0.07` |
| **Tier 4** | `0.05` (`0.04 × 1.05 = 0.042 -> 0.05`) | `0.02` | `0.12` |
| **Tier 5** | `0.06` *(Smart Pruning Active)* | `0.02` *(Smart Pruning Active)* | `0.20` |
| **Tier 6** | `0.07` | `0.02` | `0.32` |
| **Tier 7** | `0.08` | `0.02` | `0.52` |
| **Tier 8 (Cap)** | `0.09` | `0.02` | `0.84` |
| **Cumulative Side Lots** | **`0.44 lots` (Winning Direction)** | **`0.16 lots` (Losing Direction!)** | **`2.13 lots` (Losing Direction)** |

> **★ Why This Matters**
> Notice the difference in the table above: in a violent one-way rally, an unprotected `1.60x` martingale accumulates **`2.13 lots` of losing `SELL` positions** by Tier 8. With Shadow Matrix's **EMA-34 Trend Reversal Brake** enabled (`InpUseTrendRev = true`), the losing `SELL` side holds only **`0.16 lots` total** (`8 × 0.02`), while the winning `BUY` side holds **`0.44 lots`**, naturally pushing net basket equity toward the **`$50.00` Basket Take Profit** even without a deep pullback!

---

## Lesson 3 · Installation & License Setup in Ten Minutes

### Step 1 · Copy the Compiled EA File
1. Open MetaTrader 5 and click **File → Open Data Folder**.
2. Navigate to `MQL5\Experts\GoldScalperNinja\GoldScalperNinja - EA\`.
3. Confirm `GoldScalperNinja - Shadow Matrix.ex5` (and source `.mq5` if compiling locally) is present.
4. In MT5's **Navigator** panel (`Ctrl+N`), right-click **Expert Advisors** and click **Refresh**.

### Step 2 · Enable WebRequest for Online License Validation (`<AccountValidator.mqh>`)
1. In the top menu, click **Tools → Options** (`Ctrl+O`) and select the **Expert Advisors** tab.
2. Check **☑ Allow Algorithmic Trading**.
3. Check **☑ Allow WebRequest for listed URL** and add these two exact URLs:
   - `https://raw.githubusercontent.com`
   - `https://api.github.com`
4. Click **OK**.

> **i Graceful License Protection (`LICENSE_STATE_REVOKED`)**
> Shadow Matrix validates your MT5 account number at startup (`OnInit`) and re-checks silently every **30 minutes** (`CheckLicensePeriodic()`). If a license expires or is revoked while a basket is open (`LICENSE_STATE_REVOKED`), the EA **does NOT abandon or force-close your open trades in drawdown**. Instead, it enters a protective drain mode: it blocks new cycle entries (`total_orders == 0`) while continuing full grid management, smart pruning, and basket take-profit closure until all open positions reach `$50.00` and close cleanly.

### Step 3 · Attach to an XAUUSD Chart
1. Open a clean **XAUUSD** (or **GOLD**) chart. You can view any timeframe (`M5` or `M15` recommended), because the EA locks its signal and grid timeframes internally in code (`M5` for seed entry filters and `EMA-34`, `M15` for grid candle spacing).
2. Drag **GoldScalperNinja - Shadow Matrix** onto the chart.
3. In the pop-up window, under the **Common** tab, check **☑ Allow Algo Trading**, then click **OK**.
4. Verify that the **Obsidian Control Panel** appears in the top-left corner and the status pill reads **`EA ACTIVE : ON`** in green.

---

# PART II · THE OBSIDIAN 3-TAB CONTROL PANEL (`500 × 508 px`)

*Everything you need during the trading day is on the chart. You rarely need to open `F7` after initial setup.*

Shadow Matrix features the **CGSPDashboard Obsidian UI** (`500 px` wide × `508 px` tall) rendered directly on the chart with anti-aliased fonts (`Arial Bold` / `Consolas`), dark-gold borders (`C'210,140,20'`), and full **mouse drag-and-drop** positioning (click and drag the top header bar anywhere on the chart).

---

## 1. View 0 (`VIEW_MAIN`) — Live Telemetry Monitor

This is your default cockpit view during live trading:

### Header Bar (`x = 22, y = 20`)
- **Title Banner**: Displays **`GOLD SCALPER NINJA - SHADOW MATRIX`** in bright gold (`C'255,196,0'`).
- **`[ HIDE ]` / `[ SHOW ]` Button (Top-Right)**: Collapses the entire `500 × 508 px` panel into a compact `180 px` mini-bar (`GoldScalper | [ SHOW ]`) so you can inspect raw price action uncluttered.

### Row 1 & Row 2 · Account & Intraday KPI Cards
- **`BALANCE` Card (Top-Left)**: Displays current account balance in white and today's realized profit vs. daily target in green/red right beside the title: `( +$XX.XX / 50.00 )`.
- **`EQUITY` Card (Top-Right)**: Displays real-time account equity and tracks peak-to-trough floating drawdown (`Max DD : X.XX%`), color-coded automatically:
  - **Emerald Green (`< 2.0%`)**: Normal operating range.
  - **Amber Gold (`2.0% – 4.0%`)**: Active grid absorption.
  - **Crimson Red (`>= 4.0%`)**: Heavy basket load.
- **Row 2 (3 Mini Cards)**:
  - **`PnL Today`**: Today's closed net profit (`+$XX.XX`) in green/red.
  - **`FLOATING P/L`**: Current open basket net profit (`+$XX.XX`) including swap and commission.
  - **`LOTS TOTAL`**: Combined open `BUY + SELL` volume (`X.XX`) across the basket.

### Middle Section · `CHART INFORMATION REVIEW`
- **`EA ACTIVE : ON / OFF` Toggle Pill**: Click directly on the chart to pause or resume all automated trading immediately (`m_ea_active`).
- **Left Column (Broker & Dynamic Strategy Telemetry)**:
  - `Broker`, `Spread` (live raw spread), `Leverage` (`1:XXX`), and `Acc Type` (`Real` / `Demo`).
  - **3 Dynamic Indicator Rows (`InfoInd1..3`)**: Automatically adapts to whichever of the 6 strategies you selected! For example, under `MA (EMA/SMA)` it displays `Strategy: MA (EMA/SMA)`, `MA Cross: BULLISH / BEARISH`, and `Entry Mode: Dual Grid | Step 150`. Under `ADX + RSI`, it shows live `ADX(14)` and `RSI(14)` values and `PULLBACK BUY / SELL / WAIT`.
- **Right Column (Grid & Basket Telemetry)**:
  - **`ATR SPACING : [ON] / [OFF]`**: One-click inline badge to toggle `Dynamic ATR Grid Spacing` directly from the main screen.
  - **`Trend`**: Current `M5` directional bias (`UPTREND` in green, `DOWNTREND` in red, `NEUTRAL` in silver).
  - **`Positions`**: Open order count split by side (`X (Buy: B / Sell: S)`).
  - **`Real Net PnL`**: Exact floating P/L of the active basket (`+$XX.XX`).
  - **`TP Target`**: Active basket target (`$50.00`).
  - **`Pair Close` & `Pair Rate Limit`**: Displays `Active (>= Tier 5)` when Smart Pruning is armed and `< 0.5% Equity` safety rate status.

### Bottom Section · Four Tactical Action Buttons
1. **`[ CLOSE ALL ]` (Crimson Red)**: Emergency panic button. Immediately fires `CloseAll()` via `OrderSendAsync` to flatten all open `BUY` and `SELL` orders at market and resets the cycle.
2. **`[ LAST ROUND ]` (Amber Gold when Armed)**: Graceful stop toggle (`g_stop_after_close`). While armed (`LAST ROUND: ON`), the EA continues managing and hedging the current basket normally until it hits `$50.00` TP and closes — then **stops opening any new cycles**. Always click this before high-impact news (CPI, NFP, FOMC) or before the weekend.
3. **`[ STRATEGY SETTINGS ]`**: Switches the panel to **View 1 (`VIEW_SETTINGS`)**.
4. **`[ PROFIT CALENDAR ]`**: Switches the panel to **View 2 (`VIEW_STATS`)**.

---

## 2. View 1 (`VIEW_SETTINGS`) — Interactive Strategy & Risk Settings

Clicking **`[ STRATEGY SETTINGS ]`** opens the on-chart configuration tab where you can tune the 5 core trading parameters live without opening `F7`. Every change made here is automatically saved to MT5 **Terminal GlobalVariables** (`GSN_SM_<Account>_<Symbol>_<Magic>_*`), so your customizations survive chart timeframe changes and terminal restarts:

1. **Card 1 · `ENTRY SIGNAL STRATEGY` (2×3 Direct Selection Grid)**:
   Six side-by-side buttons representing the 6 `M5` seed filters. The active strategy is highlighted in gold with a `[✔]` prefix:
   - `[✔] MA (EMA/SMA)` | `SuperTrend` | `Ichimoku`
   - `ADX + RSI` | `Bollinger Bands` | `MACD Trend`
2. **Card 2 · `BASE LOT SIZE`**:
   `[ - ]` / `[ + ]` steppers (`±0.01`) and direct text input box (`Default: 0.02`).
3. **Card 3 · `GRID STEP DISTANCE (POINTS)`**:
   `[ - ]` / `[ + ]` steppers (`±10 points`) and direct text input box (`Default: 150`).
4. **Card 4 · `DYNAMIC ATR GRID SPACING`**:
   Single toggle button switching between **`OFF (FIXED)`** (`C'45,50,60'`, fixed `150` points on `M15`) and **`ENABLED (ATR)`** (Green `C'20,100,55'`, `150 + ATR(14) × 1.0`).
5. **Card 5 · `BASKET TAKE PROFIT ($)`**:
   `[ - ]` / `[ + ]` steppers (`±$5.0`) and direct text input box (`Default: 50.0`).

---

## 3. View 2 (`VIEW_STATS`) — Monthly Profit Calendar & Heatmap

Clicking **`[ PROFIT CALENDAR ]`** opens a full visual analytics suite built into the chart:
- **Month Navigation Bar**: Flip backward (`<`) and forward (`>`) through historical months, or click **`THIS MONTH`** to jump back to the current month.
- **3 Monthly KPI Summary Cards**:
  - **`TOTAL P/L`**: Cumulative realized net profit for the displayed month (`+$XXXX.XX`).
  - **`TOTAL TRADES`**: Total closed deals in the month.
  - **`TOTAL LOTS`**: Total closed volume (`XX.XX lots`) in the month.
- **7×5 Daily Heatmap Grid (`SUN` .. `SAT`) + `WEEK 1..5` Summary Column**:
  - Every profitable day cell is shaded **Emerald Green (`C'20,76,44'`)** with centered white P/L figures (`154.20`).
  - Every net-loss day cell is shaded **Crimson Red (`C'72,22,30'`)** with soft pink text.
  - Today's cell is highlighted with a bright gold border (`C'210,140,20'`).
  - The right-most column aggregates weekly net performance (`WEEK 1` through `WEEK 5`).

---

# PART III · INPUT SETTINGS (`F7`) — EVERY SETTING, IN PLAIN WORDS

*Press `F7` on the chart to open the Inputs window. Below is every parameter in the exact order and exact English label it appears in `GoldScalperNinja - Shadow Matrix.mq5`.*

---

## Section 1 · `────────────────[GENERAL SETTINGS]───────`

### `Magic Number` (`InpMagicNumber`)
- **Default**: `6868686` · **Type**: Integer
- **What it is**: The unique ID tag that Shadow Matrix stamps onto every order it opens. It allows the EA to distinguish its own positions from manual trades or other EAs running on the same MT5 account.
- **✓ Recommended**: Leave at `6868686` if you run Shadow Matrix on a single XAUUSD chart. Change it (e.g., `6868687`) only if you run a second instance on another chart on the same account.

### On-Chart Persistent Controls (Managed via Dashboard & `GlobalVariable`)
The following five variables are declared directly in the EA state and controlled live from **View 1 (`STRATEGY SETTINGS`)** on the chart:

| Variable Name | Default Value | Unit / Options | How to Adjust |
| :--- | :---: | :--- | :--- |
| **`InpFilterType`** | `FILTER_MA` (`0`) | `0..5` (6 M5 Strategies) | View 1 → Card 1 (`ENTRY SIGNAL STRATEGY` 2×3 Grid) |
| **`InpBaseLot`** | `0.02` | Lots (`Min: 0.01`) | View 1 → Card 2 (`BASE LOT SIZE`) |
| **`InpGridStep`** | `150` | Points (`$1.50`) | View 1 → Card 3 (`GRID STEP DISTANCE`) |
| **`InpUseDynamicATR`** | `false` | `false` (Fixed) / `true` (ATR) | View 0 Badge (`ATR SPACING`) or View 1 → Card 4 |
| **`InpTPTotal`** | `50.0` | USD (`$50.00`) | View 1 → Card 5 (`BASKET TAKE PROFIT ($)`) |

---

## Section 2 · `────────────────[MONEY MANAGEMENT]─────────`

*These four settings govern [`CalculateLot()`](file:///C:/Users/Kee/AppData/Roaming/MetaQuotes/Terminal/D0E8209F77C8CF37AD8BF550E51FF075/MQL5/Experts/GoldScalperNinja/GoldScalperNinja%20-%20EA/GoldScalperNinja%20-%20Shadow%20Matrix.mq5#L4170-L4223) — how Shadow Matrix sizes every order after the initial seed trade.*

### `Winning Side Multiplier` (`InpMultWin`)
- **Default**: `1.05` · **Safe Range**: `1.00 – 1.15`
- **What it does**: When expanding the grid, if current market price is **in profit** compared to the newest open order (`TimeMsc()`) of that direction, the next lot is multiplied by `1.05` and rounded up to the nearest `0.01` lot step via `MathCeil`.
- **i Why it works**: Gently scales into the winning direction (`0.02 -> 0.03 -> 0.04 -> 0.05...`) so trending moves reach the `$50.00` basket target faster without over-leveraging the top of a move.

### `Losing Side Multiplier` (`InpMultLose`)
- **Default**: `1.6` · **Safe Range**: `1.4 – 1.7`
- **What it does**: When current price is **in loss** compared to the newest open order of that direction, the base multiplier before trend-reversal braking is `1.60x`.
- **! Warning**: Do not raise `Losing Side Multiplier` above `1.7` unless you have tested the resulting margin curve across a $100+ gold trend.

### `Reduce Lot on Trend Reversal` (`InpUseTrendRev`)
- **Default**: `true`
- **What it does**: Activates the **EMA-34 Trend Reversal Brake** inside [`CalculateLot()`](file:///C:/Users/Kee/AppData/Roaming/MetaQuotes/Terminal/D0E8209F77C8CF37AD8BF550E51FF075/MQL5/Experts/GoldScalperNinja/GoldScalperNinja%20-%20EA/GoldScalperNinja%20-%20Shadow%20Matrix.mq5#L4198-L4207). Whenever a new grid or hedge order is placed **against** the current `M5 EMA-34` trend (`ORDER_TYPE_BUY` when `Close < EMA-34`, or `ORDER_TYPE_SELL` when `Close > EMA-34`), the lot multiplier is multiplied by `Reversal Reduction Ratio` (`0.50`).
- **✓ Recommended**: **Always keep `true`**. This is the primary shield that keeps counter-trend losing orders flat at `0.02 lot` (`1.60 × 0.50 = 0.80x -> clamped to Base Lot`) during violent one-way gold rallies or crashes.

### `Reversal Reduction Ratio (0.5 = 50%)` (`InpTrendRevMult`)
- **Default**: `0.5` · **Safe Range**: `0.4 – 0.6`
- **What it does**: The exact reduction factor applied when `Reduce Lot on Trend Reversal = true`. At `0.5`, any counter-trend multiplier is halved (`1.60 × 0.50 = 0.80`).

---

## Section 3 · `────────────────[GRID & HEDGE ENGINE]───────`

*Controls when the counter-hedge engages and how the `M15` dual grid spaces its tiers.*

### `Grid Entry Mode` (`InpGridMode`)
- **Default**: `ATR Dynamic Step` (`ENTRY_MODE_ATR_STEP`) · **Options**: `ATR Dynamic Step` | `Fixed Step on New Bar`
- **What it does**: Selects the grid engine mode. Note that dynamic ATR expansion only adds ATR points on top of `Grid Step (150)` when **both** `Grid Entry Mode == ATR Dynamic Step` **and** `Dynamic ATR Grid Spacing` (`InpUseDynamicATR`) is toggled **ON** on the dashboard. By default (`InpUseDynamicATR = false`), the EA uses a crisp, deterministic **`150 points ($1.50)` fixed step** on every new `M15` bar.

### `Grid Bar Timeframe (TF)` (`InpGridTF`)
- **Default**: `15 Minutes` (`PERIOD_M15`)
- **What it does**: Once the basket is hedged (`is_hedged == true`), regular grid expansion (`OpenGridPair`) only triggers on the opening tick of a new bar on this timeframe (`IsNewBar(InpGridTF, g_last_grid_bar)`).
- **★ Why `M15` is ideal**: Waiting for a new `M15` bar prevents the EA from firing multiple grid levels inside a single 60-second news spike candle. Even if Gold spikes $15 in one minute, Shadow Matrix opens at most **one** regular grid pair on that `M15` candle.

### `ATR Period (for ATR Mode)` (`InpATRPeriod`) & `ATR Multiplier` (`InpATRMulti`)
- **Defaults**: `14` and `1.0`
- **What they do**: When `Dynamic ATR Grid Spacing` is enabled (`[ON]`), the required distance between grid tiers becomes:
  $$\text{Effective Step} = \text{InpGridStep} + (\text{ATR}_{14}(\text{M15}) \times \text{InpATRMulti})$$
  Automatically widening grid spacing during high-volatility sessions.

### `Hedge Distance (Points)` (`InpHedgeDist`)
- **Default**: `250` (`$2.50` on Gold) · **Safe Range**: `200 – 350`
- **What it does**: When the initial seed order (`total_buy == 1 && total_sell == 0` or vice versa) drops `250 points ($2.50)` against entry price, [`CheckHedgeLogic()`](file:///C:/Users/Kee/AppData/Roaming/MetaQuotes/Terminal/D0E8209F77C8CF37AD8BF550E51FF075/MQL5/Experts/GoldScalperNinja/GoldScalperNinja%20-%20EA/GoldScalperNinja%20-%20Shadow%20Matrix.mq5#L4247-L4269) opens the first opposite order (`" Hedge Start"`), locking the cycle into hedged mode (`is_hedged = true`).
- **i Why 250 points?**: Gives the initial `M5` seed trade `$2.50` of breathing room to hit its `$0.90` `First Order TP` without premature hedging on normal spread noise, while still capping initial single-order drawdown tightly.

### `Max Grid Tiers Per Direction (Hard Ceiling 7-8)` (`InpMaxGridTiers`)
- **Default**: `8` · **Recommended Range**: `7 – 8`
- **What it does**: Enforces a hard ceiling on the number of open `BUY` orders and open `SELL` orders (`total_buy < InpMaxGridTiers` and `total_sell < InpMaxGridTiers`). Once a side reaches `8` open positions, no additional orders are opened on that side until **Same-Side Smart Pruning** trims existing tiers (starting from Tier 5) or the basket closes.

---

## Section 4 · `────────────────[RECOVERY GRID / RECO TRAP]─`

*Governs [`CheckRecoveryLogic()`](file:///C:/Users/Kee/AppData/Roaming/MetaQuotes/Terminal/D0E8209F77C8CF37AD8BF550E51FF075/MQL5/Experts/GoldScalperNinja/GoldScalperNinja%20-%20EA/GoldScalperNinja%20-%20Shadow%20Matrix.mq5#L4077-L4133) — the tick-responsive boundary trap at the upper and lower edges of a hedged corridor.*

### `Enable Recovery Grid` (`InpUseRecovery`)
- **Default**: `true`
- **What it does**: Draws `RecovLine_Upper` (green dotted line) and `RecovLine_Lower` (red dotted line) at the earliest `BUY` and earliest `SELL` open prices whenever the basket is hedged. If price re-approaches either boundary within `Recovery Boundary Buffer (50 points)` and is at least `Grid Step (150 points)` away from the newest `BUY` and newest `SELL` orders (`IsFarFromLastOrder`), the EA immediately fires `OpenGridPair(" Recov Buy", " Recov Sell")` on tick.

### `Recovery Boundary Buffer (Points)` (`InpRecovBuffer`)
- **Default**: `50` (`$0.50` on Gold)
- **What it does**: The proximity zone (`±50 points`) around `upper_bound` and `lower_bound` where the RECO Trap triggers:
  - Upper zone: `Bid >= upper_bound - 50 pts` and `Bid <= upper_bound + 50 pts`
  - Lower zone: `Ask <= lower_bound + 50 pts` and `Ask >= lower_bound - 50 pts`

### `Enable Recovery XLot` (`InpUseRecoveryXLot`) & `Recovery XLot Multiplier` (`InpRecoveryXLotMult`)
- **Defaults**: `false` and `1.4`
- **What they do**: Optional aggressive mode. If `Enable Recovery XLot = true`, orders triggered by the RECO Trap use `Recovery XLot Multiplier (1.4x)` instead of `Winning Side Multiplier (1.05x)` when price breaks outside the recovery corridor (`PRICE > upper_bound` for `BUY` or `PRICE < lower_bound` for `SELL`).
- **✓ Recommended**: Keep `Enable Recovery XLot = false` for standard prop-firm and conservative live operation.

---

## Section 5 · `────────────────[SMART PRUNING DEFENSE]───`

*Governs [`CheckPruningLogic()`](file:///C:/Users/Kee/AppData/Roaming/MetaQuotes/Terminal/D0E8209F77C8CF37AD8BF550E51FF075/MQL5/Experts/GoldScalperNinja/GoldScalperNinja%20-%20EA/GoldScalperNinja%20-%20Shadow%20Matrix.mq5#L3796-L3806) and [`PruneSideSequence()`](file:///C:/Users/Kee/AppData/Roaming/MetaQuotes/Terminal/D0E8209F77C8CF37AD8BF550E51FF075/MQL5/Experts/GoldScalperNinja/GoldScalperNinja%20-%20EA/GoldScalperNinja%20-%20Shadow%20Matrix.mq5#L3808-L3900) — the self-healing engine that prevents grid saturation.*

### `Enable Smart Pruning` (`InpEnablePruning`)
- **Default**: `true`
- **What it does**: Enables automatic **Same-Side Smart Pruning**. Unlike cross-side pruning (which can unbalance hedge delta), Shadow Matrix prunes **strictly within the same direction** (`BUY` with `BUY`, `SELL` with `SELL`).

### `Danger Tier Threshold (Min orders to prune)` (`InpPruneDangerTier`)
- **Default**: `5` · **Safe Range**: `4 – 6`
- **What it does**: Smart Pruning activates on a direction only when that side holds at least **`5` open orders** (`count >= 5`). It identifies:
  1. **Newest Winning Order (`newest_win_ticket`)**: The most recently opened order on that side (`open_time > newest_win_time`) currently in net profit (`net_profit > 0`).
  2. **Oldest Losing Order (`oldest_loss_ticket`)**: The earliest opened order on that same side (`open_time < oldest_loss_time`) currently in net loss (`net_profit < 0`).

### `Pruning Surplus Profit ($)` (`InpPruneMinProfit`)
- **Default**: `1.0` (`$1.00` net USD)
- **What it does**: When `newest_win_profit + oldest_loss_profit >= $1.00` (after accounting for `POSITION_PROFIT + POSITION_COMMISSION + POSITION_SWAP`), the EA closes both positions sequentially:
  - **Step 1**: Closes `oldest_loss_ticket` first (`PositionClose`).
  - **Step 2**: Only after confirming the losing leg closed (`ResultRetcode == DONE`), closes `newest_win_ticket`.
- **★ Why "Losing Leg First" is critical**: If a broker requote or network hiccup rejects Step 1, Step 2 is aborted so your winning position remains open on the chart. You never accidentally close the winner while leaving the deep loser stranded.

---

## Section 6 · `────────────────[FIRST ORDER TAKE PROFIT]───`

*Governs [`CheckFirstOrderTP()`](file:///C:/Users/Kee/AppData/Roaming/MetaQuotes/Terminal/D0E8209F77C8CF37AD8BF550E51FF075/MQL5/Experts/GoldScalperNinja/GoldScalperNinja%20-%20EA/GoldScalperNinja%20-%20Shadow%20Matrix.mq5#L3923-L3968) — fast single-order scalping when `total_orders == 1`.*

### `First Order TP ($) (0=Disabled)` (`InpTPFirstMoney`)
- **Default**: `0` (`Disabled`)
- **What it does**: Optional dollar take-profit for the initial seed order when it is the only open trade on the chart (`total_orders == 1`). Set to `0` to rely on point distance instead.

### `First Order TP (Points) (0=Disabled)` (`InpTPFirstPoints`)
- **Default**: `90` (`$0.90` of gold movement)
- **What it does**: When `total_orders == 1`, as soon as the seed order moves **`+90 points ($0.90)`** in profit (`Bid - OpenPrice >= $0.90` for `BUY`, or `OpenPrice - Ask >= $0.90` for `SELL`), the EA closes it immediately and sets `g_need_reentry = true` to enter the next cycle on the very next valid tick.
- **i Why 90 points?**: Most `M5` impulses deliver at least `$1.00–$1.50` of follow-through. Banking `$0.90` on clean first-order entries turns 65–70% of cycles into fast, zero-stress single-order scalps that never even need to hedge.

---

## Section 7 · Strategy 1–6 (`M5` Seed Entry Filters)

*When `total_orders == 0`, [`CheckEntrySignal()`](file:///C:/Users/Kee/AppData/Roaming/MetaQuotes/Terminal/D0E8209F77C8CF37AD8BF550E51FF075/MQL5/Experts/GoldScalperNinja/GoldScalperNinja%20-%20EA/GoldScalperNinja%20-%20Shadow%20Matrix.mq5#L3971-L4072) evaluates closed-bar (`shift = 1`) signals on the active strategy selected in **View 1 (`STRATEGY SETTINGS`)**. In addition, [`GetTrendDirection()`](file:///C:/Users/Kee/AppData/Roaming/MetaQuotes/Terminal/D0E8209F77C8CF37AD8BF550E51FF075/MQL5/Experts/GoldScalperNinja/GoldScalperNinja%20-%20EA/GoldScalperNinja%20-%20Shadow%20Matrix.mq5#L4225-L4226) always monitors the `M5 EMA-34` to power the Trend Reversal Lot Brake.*

### `────────────────[STRATEGY 1: MA TREND]─────` (`FILTER_MA` — Default)
- **Parameters**:
  - `MA Method` (`InpMAType` = `Exponential (EMA)`)
  - `MA Period` (`InpMAPeriod` = `34`)
  - `Signal Bar Shift (1=closed bar)` (`InpMAShift` = `1`)
  - `Entry Timeframe (Filter TF)` (`InpMATimeframe` = `5 Minutes`)
- **Exact Entry Rule**:
  - **BUY (`1`)**: Closed `M5` candle closes above `EMA(34)` (`Close[1] > MA[0]`).
  - **SELL (`-1`)**: Closed `M5` candle closes below `EMA(34)` (`Close[1] < MA[0]`).

### `────────────────[STRATEGY 2: SUPERTREND M5]─` (`FILTER_SUPERTREND`)
- **Parameters**:
  - `SuperTrend ATR Period` (`InpSTPeriod` = `10`)
  - `SuperTrend ATR Multiplier` (`InpSTMultiplier` = `3.0`)
  - `SuperTrend Timeframe` (`InpSTTimeframe` = `5 Minutes`)
- **Exact Entry Rule**: Computes dynamic trailing bands `HL2 ± (3.0 × ATR(10))` across 150 bars on `M5`. Returns **BUY (`1`)** when the closed bar is in `dir == 1` (bullish regime) and **SELL (`-1`)** when in `dir == -1` (bearish regime).

### `────────────────[STRATEGY 3: ICHIMOKU]──────` (`FILTER_ICHIMOKU`)
- **Parameters**:
  - `Ichimoku Tenkan` (`InpIchiTenkan` = `9`)
  - `Ichimoku Kijun` (`InpIchiKijun` = `26`)
  - `Ichimoku Senkou Span B` (`InpIchiSenkou` = `52`)
  - `Ichimoku Timeframe` (`InpIchimokuTF` = `5 Minutes`)
- **Exact Entry Rule**:
  - **BUY (`1`)**: `Tenkan-sen > Kijun-sen` AND `Close[1] > max(Senkou Span A, Senkou Span B)` (price cleanly above the Kumo cloud).
  - **SELL (`-1`)**: `Tenkan-sen < Kijun-sen` AND `Close[1] < min(Senkou Span A, Senkou Span B)` (price cleanly below the Kumo cloud).
  - **WAIT (`0`)**: Price is inside the Kumo cloud or Tenkan/Kijun do not confirm.

### `────────────────[STRATEGY 4: ADX + RSI]─────` (`FILTER_ADX_RSI`)
- **Parameters**:
  - `ADX Period` (`InpADXPeriod` = `14`), `ADX Trend Threshold` (`InpADXThreshold` = `25.0`)
  - `RSI Period` (`InpRSIPeriod` = `14`)
  - `RSI Pullback Buy Level (<=)` (`InpRSIPullbackBuy` = `40.0`)
  - `RSI Pullback Sell Level (>=)` (`InpRSIPullbackSell` = `60.0`)
  - `ADX + RSI Timeframe` (`InpADXRSITF` = `5 Minutes`)
- **Exact Entry Rule**: Trend-pullback sniper. Requires an established trend (`ADX(14) >= 25.0`), then waits for a temporary counter-move exhaustion:
  - **BUY (`1`)**: `ADX >= 25.0` AND `+DI > -DI` AND `RSI(14) <= 40.0`.
  - **SELL (`-1`)**: `ADX >= 25.0` AND `-DI > +DI` AND `RSI(14) >= 60.0`.

### `────────────────[STRATEGY 5: BOLLINGER BANDS]` (`FILTER_BOLLINGER`)
- **Parameters**:
  - `BB Period` (`InpBBPeriod` = `20`), `BB Deviation` (`InpBBDeviation` = `2.0`), `BB Applied Price` (`InpBBAppliedPrice` = `Close price`), `BB Timeframe` (`InpBBTF` = `5 Minutes`)
  - `BB Require Re-entry Inside Bands` (`InpBBRequireReentry` = `true`)
- **Exact Entry Rule**: Mean-reversion rubber-band filter:
  - When `BB Require Re-entry Inside Bands = true` (Default): Waits for candle `shift = 2` to pierce outside the band (`Low[2] <= Lower[2]` or `High[2] >= Upper[2]`) and candle `shift = 1` to close back inside the band (`Close[1] > Lower[1]` for **BUY**, `Close[1] < Upper[1]` for **SELL**).

### `────────────────[STRATEGY 6: MACD TREND M5]─` (`FILTER_MACD`)
- **Parameters**:
  - `MACD Fast EMA` (`InpMACDFast` = `12`), `MACD Slow EMA` (`InpMACDSlow` = `26`), `MACD Signal SMA` (`InpMACDSignal` = `9`), `MACD Timeframe` (`InpMACDTimeframe` = `5 Minutes`)
- **Exact Entry Rule**:
  - **BUY (`1`)**: `MACD Main > Signal` AND `MACD Main > 0` (bullish momentum above zero line).
  - **SELL (`-1`)**: `MACD Main < Signal` AND `MACD Main < 0` (bearish momentum below zero line).

---

## Section 8 · `────────────────[TRADING SESSIONS]─────────` & `────────────────[SYSTEM & THEME]────────────`

*Session filters control when a **new cycle (`total_orders == 0`)** is permitted to start. Once a cycle is open, grid hedging, smart pruning, and basket take-profit remain active 24/5 until the basket closes.*

### Server Time Window (`InpUseTimeServer`, `InpStartTime`, `InpEndTime`)
- **Defaults**: `Enable Server Time Trading = false`, `Trading Start Time = "07:30"`, `Trading End Time = "23:59"`
- **What it does**: When set to `true`, restricts new cycle entries to a single continuous broker server time window (`07:30` to `23:59`). Supports overnight wrap-around windows (e.g., `21:00` to `05:00`).

### Four Custom Intraday Sessions (`InpUseTimeCustom`, `Session 1..4 Start/End`)
- **Defaults**: `Enable Custom Time Trading = false`
  - `Session 1`: `"07:30"` – `"11:30"` (Asian Close / Early London)
  - `Session 2`: `"13:30"` – `"17:00"` (London – New York Overlap)
  - `Session 3`: `"19:00"` – `"22:30"` (New York Afternoon)
  - `Session 4`: `"01:00"` – `"03:00"` (Tokyo Open)
- **What it does**: When `Enable Custom Time Trading = true`, new cycles may only start inside any of the 4 configured time slots.

### `Slippage (Points)` (`InpSlippage`)
- **Default**: `80` (`$0.80` max deviation)
- **What it does**: Maximum price deviation allowed on market order execution (`m_trade.SetDeviationInPoints(80)`).

### `Apply Dark Chart Theme (Auto)` (`InpApplyDarkTheme`)
- **Default**: `true`
- **What it does**: Automatically styles your MT5 chart on startup (`ApplyDarkChartTheme()`) with a deep obsidian background (`C'12,16,23'`), subtle grid lines, emerald green bull candles (`C'38,166,154'`), and crimson bear candles (`C'239,83,80'`) to match the CGSPDashboard UI.

---

# PART IV · CAPITAL MANAGEMENT, STRESS-TEST SCORECARD & PRACTICE

*The EA handles the trades. You handle the account. This division of labor only works when both sides do their job.*

## The Five Golden Rules of Capital

1. **Respect Minimum Capital Per `0.02` Base Lot**:
   - **Standard Account (`$100,000` contract size, `1:200+` leverage)**: Minimum **`$3,000 – $5,000`** per `0.01–0.02` base lot (`$10,000` recommended for institutional sub-4% drawdown comfort).
   - **Cent Account (`$300` USD = `30,000 USC`)**: Ideal starting ground for running the default `0.02` base lot with full 8-tier resilience.
2. **Withdraw Profits on a Schedule**:
   Grid systems compound best when you periodically skim realized profits off the account (for example, withdrawing 50% of net gains every Friday or at the end of each month). Money sitting in your bank account has a **0% maximum drawdown**.
3. **Use `[ LAST ROUND ]` Before Red-Folder Event Clusters**:
   Two hours before **FOMC Interest Rate Decisions**, **US Non-Farm Payrolls (NFP)**, or **US CPI**, click **`[ LAST ROUND ]`** on the dashboard. Let the active basket finish and close at `$50.00`, then wait 30 minutes after the news release before clicking `[ LAST ROUND ]` off.
4. **Never Manually Close Only the Winning Side of an Active Basket**:
   Shadow Matrix relies on the winning trend ladder (`0.02 -> 0.03 -> 0.04...`) and newest winning tiers to fund **Same-Side Smart Pruning** and the **`$50.00` Basket Take Profit**. If you manually close the green trades while leaving the red trades open, you strip the basket of its recovery engine.
5. **Run on a Low-Latency VPS (`< 15 ms` to Broker)**:
   Because [`CloseAll()`](file:///C:/Users/Kee/AppData/Roaming/MetaQuotes/Terminal/D0E8209F77C8CF37AD8BF550E51FF075/MQL5/Experts/GoldScalperNinja/GoldScalperNinja%20-%20EA/GoldScalperNinja%20-%20Shadow%20Matrix.mq5#L4365-L4404) dispatches parallel `OrderSendAsync` instructions and `CheckRecoveryLogic()` monitors tick-level boundary re-tests, run the EA 24/5 on a dedicated VPS close to your broker's trade server.

---

## July 2026 Stress-Test Benchmark (`$10,000` Deposit, `M5` / `M15`)

Below is the verified MT5 Strategy Tester benchmark for the default **Shadow Matrix** configuration (`Base Lot = 0.02`, `Grid Step = 150`, `Hedge Distance = 250`, `Max Grid Tiers = 8`, `Smart Pruning = Tier 5 / $1.00`, `Reduce Lot on Trend Reversal = true`, `Basket TP = $50.00`) across the full month of **July 2026 (`2026.07.01 – 2026.07.31`)**:

| Performance Metric | Verified Benchmark Result | Institutional Pass Criteria |
| :--- | :---: | :---: |
| **Initial Deposit** | `$10,000.00` | `$10,000.00` Standard / Prop Account |
| **Total Net Profit** | **`+$2,929.40` (`+29.29%` Monthly ROI)** | `> +10.0%` Monthly |
| **Gross Profit / Gross Loss** | `+$6,506.95` / `-$3,577.55` | Positive Net Expectancy |
| **Profit Factor** | **`1.82`** | `> 1.40` (Excellent `> 1.70`) |
| **Expected Payoff** | **`$3.64` per deal** | `> $2.00` |
| **Recovery Factor** | **`8.08`** | `> 4.00` (Exceptional) |
| **Sharpe Ratio** | **`5.83`** | `> 1.50` |
| **Balance Drawdown Maximal** | `$311.61` (`2.57%`) | `< 5.0%` |
| **Equity Drawdown Maximal** | **`$362.58` (`2.88%`)** | `< 10.0%` (Prop Firm Safe `< 4.0%`) |
| **Total Trades (Deals)** | `804` (`1,608` deals) | High statistical significance |

---

## Three Recommended Profiles

| Setting Label (`F7` / Dashboard) | Profile A: Conservative / Prop Firm (`$10,000`) | Profile B: Shadow Matrix Default (`$5,000–$10,000`) | Profile C: High-Volatility / News Week |
| :--- | :---: | :---: | :---: |
| **`Base Lot Size`** | `0.01` | **`0.02`** | `0.01` |
| **`Grid Step Distance (Points)`** | `180` (`$1.80`) | **`150` (`$1.50`)** | `180` (`$1.80`) |
| **`Dynamic ATR Grid Spacing`** | `OFF (FIXED)` | **`OFF (FIXED)`** | `ENABLED (ATR)` |
| **`Hedge Distance (Points)`** | `250` (`$2.50`) | **`250` (`$2.50`)** | `300` (`$3.00`) |
| **`Max Grid Tiers Per Direction`** | `7` | **`8`** | `7` |
| **`Danger Tier Threshold`** | `4` | **`5`** | `4` |
| **`Basket Take Profit ($)`** | `$25.00` | **`$50.00`** | `$30.00` |
| **`First Order TP (Points)`** | `90` (`$0.90`) | **`90` (`$0.90`)** | `100` (`$1.00`) |

---

## Troubleshooting Quick Reference

| Symptom on Chart | Root Cause | Immediate Fix |
| :--- | :--- | :--- |
| **Dashboard shows `EA ACTIVE : OFF` or does not open trades** | Either the on-chart `EA ACTIVE` pill is toggled `OFF`, MT5 `Algo Trading` button is red, or `LAST ROUND` finished a cycle and paused. | Click `EA ACTIVE` pill on the panel so it turns green (`ON`), ensure MT5 `Algo Trading` is enabled, and verify `[ LAST ROUND ]` is not highlighted in gold. |
| **Alert: `Account is not authorized` or `WebRequest failed`** | GitHub license endpoint URLs are not added in MT5 Options, or account number is not yet registered. | Go to **Tools → Options → Expert Advisors**, check **Allow WebRequest**, and add `https://raw.githubusercontent.com` and `https://api.github.com`. |
| **Changes in `F7` for Base Lot, Grid Step, or Basket TP don't overwrite the panel** | By design, **View 1 (`STRATEGY SETTINGS`)** persists those 5 settings in MT5 `GlobalVariables` (`GSN_SM_*`) so chart reloads don't wipe live adjustments. | Change `Base Lot Size`, `Grid Step Distance`, `Dynamic ATR Spacing`, `Entry Strategy`, and `Basket Take Profit` directly inside **View 1 (`[ STRATEGY SETTINGS ]`)** on the chart, or press `F3` in MT5 to clear `GSN_SM_*` GlobalVariables. |
| **Grid reaches 8 orders on one side and stops adding more** | `Max Grid Tiers Per Direction = 8` hard ceiling is protecting your margin. | Normal behavior. Wait for **Same-Side Smart Pruning** (`Pair Close: Active (>= Tier 5)`) to trim the oldest losing order + newest winning order when their combined net reaches `+$1.00`, or wait for basket TP. |

---

*Gold Scalper Ninja — Shadow Matrix · Precision Engineered for XAUUSD · Trade the Plan, Protect the Capital.*
