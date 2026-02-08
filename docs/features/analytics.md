# Analytics Dashboard

## Overview
The Analytics Dashboard is the heart of the trader's performance tracking. It consolidates data from the trade journal to provide actionable insights.

## Access
Navigate to **Dashboard -> Analytics** via the sidebar.

## Components

### 1. KPI Cards
Displays key performance indicators:
- **Win Rate:** Percentage of winning trades (Wins / Total * 100).
- **Profit Factor:** Gross Profit / Gross Loss.
- **Total P&L:** Net Profit or Loss.
- **Avg R:R:** Average Risk-Reward Ratio (Avg Win / Avg Loss).
- **Total Trades:** Count of closed trades.

### 2. Equity Curve
An interactive line chart showing account balance growth over time.
- Supports zooming and panning.
- Shows drawdown periods.

### 3. Profit Calendar (Heatmap)
Visualizes daily performance:
- **Green:** Profitable day.
- **Red:** Losing day.
- **Gray:** No trading activity.
- Intensity based on profit magnitude.

### 4. Performance by Breakdown
- **By Symbol:** Which pairs are most profitable?
- **By Day:** Which day of the week yields the best results?
- **By Session:** Performance during Asian, London, and NY sessions.

## Data Sources
All data is derived from the `JournalTrade` table in Supabase. The calculations are performed backend-side via API routes for accuracy and performance.

## How Calculation Works

### 1. Win Rate
- formula: `(Winning Trades / Total Trades) * 100`
- *Note:* Breakeven trades are typically excluded or counted as neutral depending on user settings.

### 2. Profit Factor
- formula: `Gross Profit ($) / Gross Loss ($)`
- Indicates how much you make for every dollar you lose. > 1.0 is profitable.

### 3. Expectancy (Avg R per trade)
- formula: `(Win Rate * Avg Win R) - (Loss Rate * Avg Loss R)`
- Measures the expected return per unit of risk over the long run.

