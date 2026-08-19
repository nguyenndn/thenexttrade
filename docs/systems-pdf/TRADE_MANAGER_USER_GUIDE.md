# GoldScalperNinja - Trade Manager User Guide (v1.3)

## Welcome!
Hey there! So you've got your hands on the GoldScalperNinja Trade Manager. Think of it as your personal trading assistant that sits right on your MT5 chart. It's built to make order management easier, help you control risk better, and let you take profits at multiple levels without the headache of doing everything manually.

The panel features a **flat modern theme** with **sharp square corners** designed for comfortable long-session trading — clean, high-contrast, and extremely easy on the eyes.

Now with a **Multi-Timeframe Dashboard** and a **Semi-Auto DCA Grid System** built right in — manage manual trades, run concurrent dual-direction grids, adopt mobile trades, and use virtual trailing take profit to maximize your gains.

---

## Getting Started

### 📥 Install the EA

1. **Download the EA files**

   Download the `.zip` file from our Telegram channel: [https://t.me/+zS-_Gmt8SCQxYzA1](https://t.me/+zS-_Gmt8SCQxYzA1)

2. **Extract the downloaded file**

   Find the `.zip` file in your Downloads folder. Right-click it → **Extract All** → Click **Extract**. You'll see a folder named `GoldScalperNinja` containing these files:
   - `GoldScalperNinja - TradeManager.ex5` — Main EA file
   - `GoldScalperNinja_Statistics.ex5` — Statistics indicator (optional)

3. **Open MetaTrader 5**

   Launch your MetaTrader 5 application and log in to your trading account.

4. **Open the MT5 Data Folder**

   In MT5, click **File** (top menu) → click **Open Data Folder**. A Windows Explorer window will open showing your MT5 data directory.

5. **Navigate to the Experts folder**

   In the Explorer window that just opened, double-click **MQL5** → double-click **Experts**. 
   
   If you don't see a folder named `GoldScalperNinja` inside Experts, create one: right-click in empty space → **New** → **Folder** → type `GoldScalperNinja` → press **Enter**.

6. **Copy the EA file into the Experts folder**

   Go back to the extracted folder from Step 2. Right-click on `GoldScalperNinja - TradeManager.ex5` → click **Copy** (or press `Ctrl+C`).
   
   Then go back to the `MQL5` → `Experts` → `GoldScalperNinja` folder. Right-click in empty space → click **Paste** (or press `Ctrl+V`).

7. **Copy the Indicator file into the Indicators folder** *(optional)*

   Go back to the MT5 Data Folder (the Explorer window from Step 4). Navigate to `MQL5` → `Indicators`. 
   
   If there's no `GoldScalperNinja` folder, create one (same as Step 5).
   
   Copy `GoldScalperNinja_Statistics.ex5` from the extracted folder and paste it into `MQL5` → `Indicators` → `GoldScalperNinja`.

8. **Restart MT5 to load the new files**

   Close MetaTrader 5 completely, then open it again. Or, in the Navigator panel (left side), right-click on **Expert Advisors** → click **Refresh**.

9. **Verify installation**

   In the Navigator panel (left side of MT5), expand **Expert Advisors**. You should see **GoldScalperNinja - TradeManager** in the list. If you see it — installation is complete! ✅

---

### ⚙️ Configure WebRequest (Required for Real Accounts)

1. **Open the Options window**

   In MT5, click **Tools** (top menu) → click **Options**. Or press `Ctrl+O` on your keyboard.

2. **Go to the Expert Advisors tab**

   In the Options window, click the **Expert Advisors** tab at the top.

3. **Enable WebRequest**

   Check the box ☑ next to **"Allow WebRequest for listed URL"**.

4. **Add the first URL**

   In the URL list area below, double-click the green `+` button. A new empty row will appear. Type (or copy-paste) this URL:
   ```
   https://raw.githubusercontent.com/
   ```

5. **Add the second URL**

   Double-click the green `+` button again. Type (or copy-paste) this URL:
   ```
   https://api.github.com/
   ```

6. **Click OK to save**

   Click **OK** at the bottom of the Options window. The WebRequest configuration is done! ✅

---

### 🚀 Load the EA onto a Chart

1. **Open a chart**

   If you don't have a chart open yet, go to **File** → **New Chart** → select your symbol (e.g., **XAUUSD** for Gold).

2. **Drag the EA onto the chart**

   In the Navigator panel (left side), expand **Expert Advisors** → find **GoldScalperNinja - TradeManager**. Click and hold it, then drag it onto the chart and release.

3. **Allow Algo Trading in the popup**

   A settings dialog will appear. Go to the **Common** tab and make sure ☑ **"Allow Algo Trading"** is checked. Then click **OK**.

4. **Enable AutoTrading on the toolbar**

   Look at the MT5 toolbar at the top. Find the **"AutoTrading"** button (it says "Algo Trading" in some versions). Click it so it turns **green/active**. If it's already green, you're good.

5. **Confirm the EA is running**

   Look at the **top-right corner** of your chart. You should see a **smiley face icon** 😊. 
   - 😊 **Smiley face** = EA is running — you're all set!
   - 😞 **Frowning face** = Something went wrong — check Steps 3 and 4 above.

> **Note**: Demo accounts work immediately — no license needed. Real accounts require license activation — send your account number to the developer via Telegram.

> **Switching accounts**: The EA automatically clears the license cache on every startup, so you can freely switch between accounts without any manual cleanup.

---

## Panel Layout Overview

The panel is organized into four main tabs selectable via the top navigation buttons:
- **TRADE** — Manual trade settings, multi-TP scaling, and risk calculations.
- **S&R** — Auto-drawn support and resistance levels.
- **TREND** — Comprehensive multi-timeframe indicator matrix.
- **SEMI AUTO** — DCA grid, Mobile trade adoption, and Trailing TP parameters.

---

## Understanding Your Panel (By Tab)

### Global Elements (Always Visible)

#### The Info Bar (What's Going On Right Now)
Right below the header, you'll see four important numbers updating in real-time:
- **BUY**: Your current BUY positions PnL (green when positive, red when negative)
- **SELL**: Your current SELL positions PnL (green when positive, red when negative)
- **LOTS**: Total lot size of all your positions combined
- **POS**: How many positions you've got open

#### Win Rate & Stats Row (Live Trading Performance)
Located below the active tab content, shows your **today's** live trading performance:
- **5W/2L (71%) +$320.5** — Win count / Loss count, win rate %, and total P&L
- **B:3 (+$180.0)** — Closed buy deals and their profit
- **S:2 (+$140.0)** — Closed sell deals and their profit

#### Candle Timer & Max Pips
- **Left side**: `CANDLE TIME : MM:SS` — countdown to when the current candle closes
- **Right side**: `XX Pips` — **Max Pips high-water-mark** showing the best unrealized profit (in pips) of your current positions. Resets when all positions are closed.

---

### TAB 1 — TRADE (Manual Execution & Risk)

This tab contains three columns:

#### Column 1 — Trade Settings
- **Lot Size**: Type in how big you want your trades. Click to edit and type the value directly, then hit Enter.
- **Zone (pips)**: For manual grid setups — spacing distance between orders.
- **BE Offset (Breakeven)**: Set in pips. Moves SL to entry plus this offset.
- **Max Risk (%)**: Safety net. Blocks new positions if current risk exceeds this percentage. Set to 0 to disable.
- **SL Loss Display**: Shows your current risk as a **percentage** and **dollar amount** in real-time.

#### Column 2 — Price Levels
- **Entry Point**: Specific entry price.
- **Stop Loss**: Protects your order. Set to 0 for no stop.
- **TP1, TP2, TP3**: Set three different profit targets. The **count box** next to each tells the EA how many positions to close at that level.
- **CLEAR ALL**: Resets all input fields back to defaults.

#### Column 3 — Action Buttons
- **GET BUY / GET SELL**: Grabs current Ask/Bid price into the Entry Point box.
- **BUY NOW / SELL NOW**: Opens a market order immediately.
- **SET PENDING / CLOSE PENDING**: Places or cancels manual grid limit orders.
- **BE SET**: Moves all stop losses to breakeven (+ BE Offset).
- **SYNC TP**: Applies TP1/TP2/TP3 levels and counts to all positions.
- **SYNC SL**: Applies your Stop Loss value to all open positions.
- **CLEAR SL**: Removes all stop losses from open positions.

#### TP Summary Row
Shows estimated profit for each TP level based on your current lot size and TP prices.

#### Take Profit Row (Partial Close)
- **TAKE PROFIT %**: Percentage input field (default: 50%).
- **TP BUY / TP SELL**: Closes the specified percentage of BUY/SELL positions:
  - If multiple positions: Sorts by profit and closes the least profitable ones first.
  - If single position: Performs a partial close by volume (e.g. closes 5.0 lots of a 10.0 lot trade).

---

### TAB 2 — S&R (Support & Resistance Zones)

Shows auto-detected Support and Resistance levels:
- Green lines represent Support levels.
- Red lines represent Resistance levels.
- Drawn dynamically on the chart based on higher timeframe swings.
- Proximity warning displays `SUP`, `MID`, or `RES` on the dashboard.

---

### TAB 3 — TREND (Multi-Timeframe Analysis)

Provides a comprehensive multi-timeframe indicator matrix.

#### Top Status Row:
- **DAILY TREND**: D1 direction consensus (BUY, SELL, or WAIT).
- **CURRENT TREND**: Current chart timeframe direction (green = BUY, red = SELL).
- **BUY POWER / SELL POWER**: Perceptron-inspired neural scoring based on weighted indicators:
  - **EMA (Sonic R)**: Weight 2.0
  - **S&R**: Weight 1.8
  - **ADX**: Weight 1.5
  - **BREAK**: Weight 1.5
  - **MACD**: Weight 1.2
  - **RSI**: Weight 1.0
  - **Volume Confidence Multiplier**: Signals are boosted/penalized by market volume.
  - **Volume Divergence Detection**: Price UP + Vol DOWN (or vice versa) penalizes momentum signals by 50% to prevent false breakout signals.

#### Indicator Matrix (6 rows × 7 timeframes):
Timeframes: **M1, M5, M15, M30, 1H, 4H, D1**
- **EMA**: Sonic R crossover (EMA 34 vs EMA 89).
- **ADX**: Trend strength + direction (ADX > 25 filter).
- **RSI**: Momentum direction (BUY if >55, SELL if <45).
- **MACD**: Signal line crossover and value relative to zero line.
- **S&R**: Proximity to daily levels (Bresenham hammer/shooting star confirmation).
- **BREAK**: Volume-confirmed breakout detection.

---

### TAB 4 — SEMI AUTO (DCA & Martingale Grid)

This is a powerful utility designed to manage grids of orders automatically.

#### 1. Direct Inline Editing (No +/- Buttons)
All parameter inputs are presented as wide, clean, border boxes.
- **Starting Lot**: Lot size of the initial order.
- **Multiplier**: Martingale multiplier for subsequent orders (e.g. 1.5x).
- **Max Trades**: Maximum allowed positions in the grid.
- **DCA Step (Pips)**: Spacing between orders.
- **Target TP (Pips)**: Target profit in pips from the average price of the grid.
- **Target SL (Pips)**: Safety stop loss in pips from the average price.
- **How to Edit**: Simply click inside any value box, type the new number, and press **Enter** on your keyboard.

#### 2. DCA Mobile Trade Adoption
- **ON/OFF Button**: Toggles `MOBILE DCA`.
- **How it works**: When turned **ON**, the EA monitors the account for manual trades opened from your mobile phone (Magic 0) on the symbol. As soon as a mobile trade is opened, the EA adopts it, modifies its SL/TP, and begins managing it under the DCA grid logic.

#### 3. Concurrent Dual-Direction Grid
- Unlike other EAs that restrict you to one direction, GoldScalperNinja allows **BUY and SELL grids to run concurrently**!
- If both grids are active, the monitor displays `DUAL GRID ACTIVE` in amber yellow.
- Each grid is managed independently with its own average entry price, total lot size, position count, and target TP.

#### 4. Grid Trailing Take Profit (Trailing TP)
- **Virtual TP**: When `EnableSATrailingTP = true` is configured in the EA inputs, the EA sets broker-side TP lines to `0` (hidden). This protects your trades from broker-side stop hunting.
- **Activation**: When the price crosses the average target TP level, the EA enters trailing mode.
- **Trailing Stop**: The trailing TP price is locked at `Target TP - SATrailingDistancePips`. As the price moves in your favor, the trailing TP follows.
- **Trigger**: If the price reverses by the trailing distance and touches the trailing TP price, the EA closes the entire grid instantly.

#### 5. State Persistence & Auto-Reconnection
- **Real-Time Saving**: Every configuration change on the panel is saved instantly to the MT5 terminal database (`GlobalVariables`).
- **Auto-Restore**: Changing timeframes, profiles, or restarting MT5 will not reset your settings. The EA restores everything instantly on load.
- **Auto-Reconnect**: If the EA restarts while grid positions are running, it automatically detects them, reconnects, and turns `DCA SYSTEM: ON` to ensure grid continuity.

#### 6. Auto Broker Pip Size Detection
- Features auto-decimal detection (2 vs 3 digits on Gold/JPY, 4 vs 5 digits on Forex).
- It automatically normalizes all pip calculations (e.g. 1 pip on Gold is always 0.1 USD price change), ensuring SL/TP and Grid Step are always accurate regardless of your broker's decimal configuration.

---

## Input Parameters (Customization)

Inputs are organized into **7 groups** with separator labels:

### Auto Trade Management
- **AutoBEOnTP1** (true): Auto move SL to breakeven when TP1 is hit.
- **AutoClosePendingOnTP1** (true): Auto close all pending orders when TP1 is hit.
- **AutoMoveSLToTP1OnTP2** (true): Auto move SL to TP1 price when TP2 is hit.

### Lock Profit Settings (Step Trailing)
- **EnableLockProfit** (true): Enable/disable step trailing.
- **LockStep1_Trigger / Lock** (30 / 10): Move SL to +10 pips when price reaches +30 pips.
- **LockStep2_Trigger / Lock** (60 / 30): Move SL to +30 pips when price reaches +60 pips.
- **LockStep3_Trigger / Lock** (100 / 60): Move SL to +60 pips when price reaches +100 pips.
- **LockStep4_Trigger / Lock** (150 / 100): Move SL to +100 pips when price reaches +150 pips.

### Trade Settings
- **MinRandomPips / MaxRandomPips** (5.0 / 10.0): Random pips added to order spacing.
- **DefaultZonePips** (70): Default manual grid spacing.
- **DefaultSLPips** (100): Default stop loss in pips.
- **DefaultTP1/2/3Pips** (50/100/200): Default take profit levels.

### Semi Auto DCA Settings [NEW]
- **EnableSATrailingTP** (false): Enable Trailing TP for the Semi-Auto grid.
- **SATrailingDistancePips** (5.0): Trailing distance in pips for grid chốt lời.

### Panel & Colors
- **PanelCorner** (Bottom Left): Anchors the panel.
- **PanelX / PanelY** (2 / 2): Panel offsets.
- **HeaderColor** (Dark Navy): Header color.
- **BackgroundColor** (Dark Blue-Black): Panel background.
- **TPTextColor** (Green): Unified green for text.
- **ThemeColorYellow** (Orange): Action buttons color.
- **ThemeColorOrange** (Gold): Title/border color.

### Auto S&R Settings
- **EnableAutoSNR** (true): Enable auto S&R lines.
- **SNR_LookbackDays** (60): Days scanned for swing points.
- **SNR_MinDistancePips** (50): Minimum distance between lines.
- **SonicR_FastEMA / SlowEMA** (34 / 89): Sonic R EMA periods.

### Other Settings
- **EA_MAGIC_NUMBER** (123456): Magic number for Trade Tab manual orders.

---

## Troubleshooting

### Orders Won't Place?
- Check if you hit your **Max Risk %** limit — it might be protecting you.
- Make sure you've got enough margin in your account.
- Is trading actually allowed? Check your EA permissions (Allow Algo Trading).

### Can't See the Panel?
- Is AutoTrading turned on? Look for the smile icon in the top-right corner.
- If it's a frowning face, right-click chart → Expert Advisors → Properties → Common → Allow Algo Trading.

### Panel Hidden Behind Chart Objects?
- The panel uses `CHART_FOREGROUND = false` and background canvases are forced to the foreground to cover chart candles and indicators.
- If objects are still visible over the panel, ensure no other custom indicator on the chart has `CHART_FOREGROUND = true` forced.

### Copy/Paste Not Working?
- Click inside the input field first.
- Try right-click → Paste instead of Ctrl+V.
- Make sure what you're pasting is actually a number.

---

## Important Rules
- ⚠️ **One Chart Only**: Load the EA on only ONE chart per symbol to prevent order collisions.
- ⚠️ **Internet**: Required for real account license validation.
- ⚠️ **Risk Warning**: Grid trading carries high risk. Keep lot sizes small and use safety stops.

---

## Support & Help
- Need license activation?
- Telegram: [https://t.me/+zS-_Gmt8SCQxYzA1](https://t.me/+zS-_Gmt8SCQxYzA1)
- © 2026 Gold ScalperNinja. All rights reserved.
