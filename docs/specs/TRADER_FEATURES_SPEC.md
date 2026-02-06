# TheNextTrade - Trader Features Specification

> **Version:** 1.0  
> **Created:** February 3, 2026  
> **Author:** Development Team  
> **Status:** Draft

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Research Background](#research-background)
3. [Feature Specifications](#feature-specifications)
   - [P1: Analytics Dashboard](#p1-analytics-dashboard)
   - [P1: Profit Calendar](#p1-profit-calendar)
   - [P1: Strategy Tracking](#p1-strategy-tracking)
   - [P2: Psychology & Emotions Tracking](#p2-psychology--emotions-tracking)
   - [P2: Risk Calculator](#p2-risk-calculator)
   - [P2: Session Analysis](#p2-session-analysis)
   - [P3: Weekly/Monthly Reports](#p3-weeklymonthly-reports)
   - [P3: Mistake Tracking](#p3-mistake-tracking)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [UI/UX Guidelines](#uiux-guidelines)
7. [Implementation Timeline](#implementation-timeline)

---

## Executive Summary

Dựa trên research từ **Edgewonk** (trading journal #1 thế giới, 10+ năm kinh nghiệm) và **Reddit communities** (r/Forex, r/Daytrading với 100K+ members), chúng tôi đã xác định các tính năng quan trọng nhất mà traders thực sự cần.

### Key Insights từ Research:

> *"Journaling is boring. But it's also the only way to get profitable."*

> *"We don't need AI predictions or fancy social features. We need to track our edge, master the basics, and stop making the same mistakes."*

> *"99% of us just need to master the basics"*

### Priority Matrix:

| Priority | Features | Business Value |
|----------|----------|----------------|
| **P1** | Analytics Dashboard, Profit Calendar, Strategy Tracking | Core differentiator |
| **P2** | Psychology Tracking, Risk Calculator, Session Analysis | User retention |
| **P3** | Reports, Mistake Tracking | Nice-to-have |

---

## Research Background

### Sources:
- **Edgewonk.com** - Leading trading journal with 10+ years of data
- **Reddit r/Forex** - 100K+ members
- **Reddit r/Daytrading** - Active trading community

### Validated User Needs:

| Need | Source | Validation |
|------|--------|------------|
| Performance tracking | Edgewonk, Reddit | Multiple mentions |
| Editable entries | Reddit (112 upvotes) | Critical feedback |
| Multiple positions per trade | Reddit user feedback | High demand |
| Strategy-wise analytics | Edgewonk core feature | Industry standard |
| Emotion/psychology tracking | Edgewonk "Tiltmeter" | Proven effective |
| Session-based analysis | Edgewonk, traders | Common request |

---

## Feature Specifications

---

## P1: Analytics Dashboard

### Overview
Dashboard tổng hợp hiển thị performance metrics quan trọng nhất của trader.

### User Stories
- As a trader, I want to see my overall win rate so I can track my improvement
- As a trader, I want to see my equity curve so I can visualize my growth
- As a trader, I want to compare performance across different timeframes

### Functional Requirements

#### 1.1 Key Performance Metrics
| Metric | Description | Formula |
|--------|-------------|---------|
| **Win Rate** | Tỷ lệ trade thắng | (Winning Trades / Total Trades) × 100 |
| **Profit Factor** | Ratio lợi nhuận | Gross Profit / Gross Loss |
| **Average RRR** | Risk-Reward Ratio trung bình | Avg Win / Avg Loss |
| **Expectancy** | Expected value per trade | (Win% × Avg Win) - (Loss% × Avg Loss) |
| **Sharpe Ratio** | Risk-adjusted return | (Return - Risk Free Rate) / Std Dev |
| **Max Drawdown** | Largest peak-to-trough decline | Max(Peak - Trough) |
| **Recovery Factor** | Net Profit / Max Drawdown | |
| **Total P&L** | Tổng lợi nhuận/lỗ | Sum of all trade P&L |

#### 1.2 Equity Curve Chart
```
Requirements:
- Line chart showing account balance over time
- Support zoom in/out (1D, 1W, 1M, 3M, 6M, 1Y, ALL)
- Show peak equity line
- Highlight drawdown periods
- Toggle between: Balance, Equity, % Return
```

#### 1.3 Performance Breakdown
```
Filters:
- By date range (custom, this week, this month, this year)
- By trading account
- By instrument/pair
- By strategy/setup
- By session (Asian, London, NY)
- By day of week
```

#### 1.4 Quick Stats Cards
```
Display:
- Today's P&L (with % change)
- This week's P&L
- This month's P&L
- Current streak (win/loss)
- Best trade
- Worst trade
```

### UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📊 Analytics Dashboard                              [Date Range ▼]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Win Rate │ │ Profit   │ │ Avg RRR  │ │ Total    │ │ Trades   │      │
│  │  67.5%   │ │ Factor   │ │  1:2.3   │ │ +$4,250  │ │    47    │      │
│  │   ▲ 5%   │ │  2.14    │ │   ▲ 0.2  │ │  ▲ 12%   │ │   ▲ 8    │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Equity Curve                                 │   │
│  │     ╱──────╲                                        ╱────       │   │
│  │    ╱        ╲           ╱╲    ╱╲                  ╱              │   │
│  │   ╱          ╲         ╱  ╲  ╱  ╲               ╱                │   │
│  │  ╱            ╲       ╱    ╲╱    ╲             ╱                 │   │
│  │ ╱              ╲     ╱            ╲           ╱                  │   │
│  │╱                ╲___╱              ╲_________╱                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│   [1D] [1W] [1M] [3M] [6M] [1Y] [ALL]                                  │
│                                                                         │
│  ┌────────────────────────────┐ ┌────────────────────────────┐         │
│  │ Performance by Pair        │ │ Performance by Day          │         │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━ │ │ ━━━━━━━━━━━━━━━━━━━━━━━━━ │         │
│  │ EURUSD    +$1,200  ████   │ │ Mon  +$320   ███            │         │
│  │ XAUUSD    +$890    ███    │ │ Tue  +$450   ████           │         │
│  │ GBPUSD    +$340    ██     │ │ Wed  -$120   █              │         │
│  │ USDJPY    -$180    █      │ │ Thu  +$680   █████          │         │
│  └────────────────────────────┘ │ Fri  +$210   ██            │         │
│                                  └────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Technical Requirements

```typescript
// Types
interface AnalyticsData {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  averageRRR: number;
  expectancy: number;
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  totalPnL: number;
  totalPnLPercent: number;
  bestTrade: Trade;
  worstTrade: Trade;
  currentStreak: {
    type: 'win' | 'loss';
    count: number;
  };
  equityCurve: {
    date: Date;
    balance: number;
    equity: number;
  }[];
}

interface PerformanceBreakdown {
  byPair: Record<string, PairStats>;
  byDay: Record<string, DayStats>;
  bySession: Record<string, SessionStats>;
  byStrategy: Record<string, StrategyStats>;
}
```

### Acceptance Criteria
- [ ] Dashboard loads within 2 seconds
- [ ] All metrics calculate correctly based on trade data
- [ ] Equity curve is interactive (zoom, hover for details)
- [ ] Filters work correctly and update all components
- [ ] Mobile responsive design
- [ ] Dark/Light mode support

---

## P1: Profit Calendar

### Overview
Calendar view hiển thị P&L hàng ngày, giúp trader visualize performance theo thời gian.

### User Stories
- As a trader, I want to see my daily P&L in a calendar view
- As a trader, I want to quickly identify my best and worst trading days
- As a trader, I want to see patterns in my trading performance

### Functional Requirements

#### 2.1 Calendar Display
```
Features:
- Monthly calendar view (default)
- Weekly view option
- Color coding:
  - Green: Profitable day (intensity based on amount)
  - Red: Loss day (intensity based on amount)
  - Gray: No trades
- Click on day to see trade details
- Navigate between months/years
```

#### 2.2 Day Cell Information
```
Each cell shows:
- Date
- Total P&L ($)
- Number of trades
- Win rate for that day
- Color intensity based on profit/loss amount
```

#### 2.3 Summary Statistics
```
Monthly summary:
- Total P&L
- Total trades
- Profitable days vs Loss days
- Best day
- Worst day
- Average P&L per day
```

### UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📅 Profit Calendar                    ◀ January 2026 ▶   [Week/Month] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐                          │
│  │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │                          │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                          │
│  │     │     │  1  │  2  │  3  │  4  │  5  │                          │
│  │     │     │░░░░░│▓▓▓▓▓│░░░░░│     │     │                          │
│  │     │     │+$85 │+$320│-$45 │     │     │                          │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                          │
│  │  6  │  7  │  8  │  9  │ 10  │ 11  │ 12  │                          │
│  │▓▓▓▓▓│░░░░░│▓▓▓▓▓│████░│░░░░░│     │     │                          │
│  │+$210│-$120│+$450│-$280│+$95 │     │     │                          │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                          │
│  │ ... │     │     │     │     │     │     │                          │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘                          │
│                                                                         │
│  Legend: ▓▓▓ Profit  ███ Loss  ░░░ Small +/-                          │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ January Summary                                                  │   │
│  │ Total P&L: +$1,245  │ Trades: 34  │ Win Days: 12 │ Loss Days: 6 │   │
│  │ Best Day: Jan 8 (+$450)  │  Worst Day: Jan 9 (-$280)            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Technical Requirements

```typescript
interface CalendarDay {
  date: Date;
  totalPnL: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  trades: Trade[];
}

interface CalendarMonth {
  year: number;
  month: number;
  days: CalendarDay[];
  summary: {
    totalPnL: number;
    totalTrades: number;
    profitableDays: number;
    lossDays: number;
    bestDay: CalendarDay;
    worstDay: CalendarDay;
    avgPnLPerDay: number;
  };
}
```

### Acceptance Criteria
- [ ] Calendar displays current month by default
- [ ] Navigation between months works smoothly
- [ ] Color coding accurately reflects P&L
- [ ] Clicking on a day shows trade details
- [ ] Summary statistics are accurate
- [ ] Mobile responsive (swipe navigation)

---

## P1: Strategy Tracking

### Overview
Cho phép traders định nghĩa, tag và track performance của từng trading strategy/setup.

### User Stories
- As a trader, I want to tag my trades with specific strategies
- As a trader, I want to see which strategies are most profitable
- As a trader, I want to compare performance across different setups

### Functional Requirements

#### 3.1 Strategy Management
```
Features:
- Create custom strategies/setups
- Define strategy attributes:
  - Name
  - Description
  - Rules/Criteria
  - Associated pairs
  - Timeframe
  - Entry/Exit conditions
- Edit/Delete strategies
- Archive inactive strategies
```

#### 3.2 Strategy Assignment
```
When logging a trade:
- Select strategy from dropdown
- Can assign multiple setups
- Quick-add new strategy inline
- "No strategy" option for unplanned trades
```

#### 3.3 Strategy Analytics
```
Per strategy metrics:
- Total trades
- Win rate
- Profit factor
- Total P&L
- Average P&L per trade
- Average holding time
- Best performing pair for this strategy
- Performance trend (improving/declining)
```

#### 3.4 Strategy Comparison
```
Features:
- Side-by-side comparison of 2-3 strategies
- Ranking by performance metrics
- Identify underperforming strategies
- Recommendations for focus
```

### UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🎯 Strategy Performance                              [+ New Strategy] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Strategy         │ Trades │ Win Rate │ P&L      │ Profit Factor │   │
│  ├───────────────────────────────────────────────────────────────────   │
│  │ 🟢 Breakout      │   28   │  71.4%   │ +$2,340  │    2.45       │   │
│  │ 🟢 Pullback      │   19   │  68.4%   │ +$1,120  │    1.89       │   │
│  │ 🟡 Scalping      │   45   │  55.6%   │ +$450    │    1.23       │   │
│  │ 🔴 News Trading  │   12   │  41.7%   │ -$380    │    0.72       │   │
│  │ ⚪ No Strategy   │    8   │  37.5%   │ -$520    │    0.54       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Breakout Strategy Details                              [Edit]    │   │
│  │ ─────────────────────────────────────────────────────────────── │   │
│  │ Description: Trade breakouts from key levels                    │   │
│  │ Timeframe: H4, Daily                                            │   │
│  │ Pairs: EURUSD, GBPUSD, XAUUSD                                   │   │
│  │ ─────────────────────────────────────────────────────────────── │   │
│  │ Performance by Pair:                                             │   │
│  │   EURUSD: 75% WR, +$980  │  GBPUSD: 70% WR, +$720              │   │
│  │   XAUUSD: 68% WR, +$640                                         │   │
│  │ ─────────────────────────────────────────────────────────────── │   │
│  │ Trend: ▲ Improving (+5% WR vs last month)                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- New table for strategies
CREATE TABLE trading_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  timeframes TEXT[], -- ['H1', 'H4', 'D1']
  pairs TEXT[], -- ['EURUSD', 'GBPUSD']
  entry_rules TEXT,
  exit_rules TEXT,
  is_active BOOLEAN DEFAULT true,
  color VARCHAR(7), -- Hex color for UI
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add strategy_id to journal_trades
ALTER TABLE journal_trades 
ADD COLUMN strategy_id UUID REFERENCES trading_strategies(id);
```

### Acceptance Criteria
- [ ] User can create/edit/delete strategies
- [ ] User can assign strategy when logging trades
- [ ] Strategy performance metrics calculate correctly
- [ ] Comparison view works for multiple strategies
- [ ] Performance trend shows accurate data
- [ ] Mobile responsive

---

## P2: Psychology & Emotions Tracking

### Overview
Track trạng thái tâm lý và cảm xúc khi trading để identify patterns ảnh hưởng đến performance.

### User Stories
- As a trader, I want to log my emotional state before/after trades
- As a trader, I want to see how emotions affect my trading results
- As a trader, I want to identify emotional patterns that lead to losses

### Functional Requirements

#### 4.1 Emotion Logging
```
Pre-trade emotions:
- Confident / Neutral / Anxious / FOMO / Revenge
- Scale: 1-5

Post-trade emotions:
- Satisfied / Neutral / Frustrated / Regret
- Scale: 1-5

Additional fields:
- Notes (free text)
- Sleep quality (1-5)
- Stress level (1-5)
```

#### 4.2 Tiltmeter (inspired by Edgewonk)
```
Features:
- Real-time tilt detection based on:
  - Consecutive losses
  - Increased position sizes after loss
  - Deviation from rules
  - Trading outside plan
- Visual indicator (Green/Yellow/Red)
- Alert when tilt detected
```

#### 4.3 Psychology Analytics
```
Metrics:
- Win rate by emotion state
- P&L by emotion state
- Most profitable emotional state
- Patterns: e.g., "You win 78% when confident, only 45% when anxious"
- Trading mistakes correlation with emotions
```

### UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🧠 Trading Psychology                                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Tiltmeter: 🟢 All Good                Current Streak: 3 Wins          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Performance by Emotional State                                   │   │
│  │                                                                   │   │
│  │ 😊 Confident    │████████████████████│ 78% WR │ +$1,850         │   │
│  │ 😐 Neutral      │██████████████░░░░░░│ 62% WR │ +$920           │   │
│  │ 😰 Anxious      │████████░░░░░░░░░░░░│ 45% WR │ -$340           │   │
│  │ 😤 FOMO         │██████░░░░░░░░░░░░░░│ 38% WR │ -$580           │   │
│  │ 😠 Revenge      │████░░░░░░░░░░░░░░░░│ 25% WR │ -$890           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 💡 Insights                                                      │   │
│  │                                                                   │   │
│  │ • You perform BEST when feeling confident (78% WR)               │   │
│  │ • Avoid trading when anxious - only 45% win rate                 │   │
│  │ • FOMO and Revenge trades cost you $1,470 this month            │   │
│  │ • Recommendation: Don't trade after 2 consecutive losses        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Add emotion fields to journal_trades
ALTER TABLE journal_trades ADD COLUMN pre_trade_emotion VARCHAR(20);
ALTER TABLE journal_trades ADD COLUMN pre_trade_emotion_scale INTEGER CHECK (1 <= pre_trade_emotion_scale <= 5);
ALTER TABLE journal_trades ADD COLUMN post_trade_emotion VARCHAR(20);
ALTER TABLE journal_trades ADD COLUMN post_trade_emotion_scale INTEGER CHECK (1 <= post_trade_emotion_scale <= 5);
ALTER TABLE journal_trades ADD COLUMN sleep_quality INTEGER CHECK (1 <= sleep_quality <= 5);
ALTER TABLE journal_trades ADD COLUMN stress_level INTEGER CHECK (1 <= stress_level <= 5);
ALTER TABLE journal_trades ADD COLUMN psychology_notes TEXT;

-- Enum for emotions
CREATE TYPE emotion_type AS ENUM (
  'confident', 'neutral', 'anxious', 'fomo', 'revenge',
  'satisfied', 'frustrated', 'regret'
);
```

### Acceptance Criteria
- [ ] User can log emotions before/after trade
- [ ] Tiltmeter updates in real-time
- [ ] Analytics show correlation between emotions and performance
- [ ] Insights are generated based on data
- [ ] Historical emotion data is preserved

---

## P2: Risk Calculator

### Overview
Công cụ tính toán position size, lot size dựa trên risk management parameters.

### User Stories
- As a trader, I want to calculate my position size based on % risk
- As a trader, I want to quickly determine lot size for any pair
- As a trader, I want to save my risk settings as default

### Functional Requirements

#### 5.1 Position Size Calculator
```
Inputs:
- Account balance
- Risk percentage (%)
- Entry price
- Stop loss price
- Pair/Instrument

Outputs:
- Position size (lots)
- Risk amount ($)
- Pip value
- Potential loss at SL
- Potential profit at TP (if provided)
```

#### 5.2 Lot Size Calculator
```
Quick calculation:
- Account currency
- Trade pair
- Account balance
- Risk amount or %
- Stop loss in pips
```

#### 5.3 Risk:Reward Calculator
```
Inputs:
- Entry price
- Stop loss
- Take profit (multiple TPs supported)

Outputs:
- Risk in pips
- Reward in pips
- RRR ratio
- Breakeven percentage needed
```

#### 5.4 Compound Calculator
```
Features:
- Starting balance
- Monthly return %
- Timeframe (months/years)
- Show growth projection
- Show comparison: compound vs linear
```

### UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🧮 Risk Calculator                   [Position] [Lot] [RRR] [Compound]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────┐ ┌─────────────────────────────────┐   │
│  │ Position Size Calculator    │ │ Results                         │   │
│  │                             │ │                                 │   │
│  │ Account Balance:            │ │  Position Size:  0.45 lots      │   │
│  │ [$10,000            ]       │ │                                 │   │
│  │                             │ │  Risk Amount:    $200           │   │
│  │ Risk (%):                   │ │                                 │   │
│  │ [2%                 ] ▼     │ │  Pip Value:      $4.44/pip      │   │
│  │                             │ │                                 │   │
│  │ Pair:                       │ │  At Stop Loss:   -$200          │   │
│  │ [EURUSD             ] ▼     │ │                                 │   │
│  │                             │ │  At Take Profit: +$400          │   │
│  │ Entry Price:                │ │                                 │   │
│  │ [1.0850             ]       │ │  RRR:            1:2            │   │
│  │                             │ │                                 │   │
│  │ Stop Loss:                  │ │ ─────────────────────────────── │   │
│  │ [1.0805             ]       │ │                                 │   │
│  │                             │ │  ⚠️ Risk is within 2% limit     │   │
│  │ Take Profit (optional):     │ │                                 │   │
│  │ [1.0940             ]       │ │  [Copy to Trade Entry]          │   │
│  │                             │ │                                 │   │
│  │ [Calculate]                 │ │                                 │   │
│  └─────────────────────────────┘ └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Technical Requirements

```typescript
interface PositionSizeInput {
  accountBalance: number;
  riskPercent: number;
  pair: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit?: number;
  accountCurrency: string;
}

interface PositionSizeResult {
  positionSize: number; // in lots
  riskAmount: number;
  pipValue: number;
  pipDistance: number;
  potentialLoss: number;
  potentialProfit?: number;
  rrr?: number;
  isWithinRiskLimit: boolean;
}

// Pip value calculation for different pairs
function calculatePipValue(
  pair: string,
  lotSize: number,
  accountCurrency: string
): number;
```

### Acceptance Criteria
- [ ] Calculations are accurate for all major pairs
- [ ] Supports both 4-digit and 5-digit brokers
- [ ] Account currency conversion works correctly
- [ ] Results can be copied to trade entry form
- [ ] User can save default risk settings
- [ ] Works offline (no API needed)

---

## P2: Session Analysis

### Overview
Phân tích performance theo trading sessions (Asian, London, New York).

### User Stories
- As a trader, I want to know which session I perform best in
- As a trader, I want to track my activity during session overlaps
- As a trader, I want to optimize my trading schedule

### Functional Requirements

#### 6.1 Session Definition
```
Sessions:
- Sydney: 22:00 - 07:00 UTC
- Tokyo/Asian: 00:00 - 09:00 UTC
- London: 08:00 - 17:00 UTC
- New York: 13:00 - 22:00 UTC

Overlaps:
- Tokyo-London: 08:00 - 09:00 UTC
- London-NY: 13:00 - 17:00 UTC
```

#### 6.2 Session Analytics
```
Per session metrics:
- Total trades
- Win rate
- Total P&L
- Average P&L per trade
- Best performing pairs
- Volatility analysis
```

#### 6.3 Activity Heatmap
```
24-hour heatmap showing:
- Trading activity by hour
- Profitability by hour
- Volume by hour
- Identify best trading hours
```

### UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🌍 Session Analysis                                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Performance by Session                                           │   │
│  │                                                                   │   │
│  │ 🌏 Asian     │ 12 trades │ 58% WR │ +$340   │ ██████░░░░         │   │
│  │ 🇬🇧 London    │ 28 trades │ 71% WR │ +$1,820 │ ████████████████   │   │
│  │ 🇺🇸 New York  │ 19 trades │ 63% WR │ +$890   │ ██████████░░░░     │   │
│  │ 🔀 Overlap   │  8 trades │ 75% WR │ +$520   │ ████████░░░░       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Hourly Activity Heatmap                                          │   │
│  │                                                                   │   │
│  │    00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 ...    │   │
│  │    ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ▓▓ ▓▓ ██ ██ ██ ▓▓ ▓▓ ▓▓ ░░ ░░       │   │
│  │                                                                   │   │
│  │    ░░ Low activity  ▓▓ Medium  ██ High activity                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  💡 Insight: Your best performance is during London session (71% WR)   │
│              Consider focusing on 08:00-12:00 UTC                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Acceptance Criteria
- [ ] Sessions are correctly calculated based on UTC
- [ ] User can set their local timezone
- [ ] Trade times are accurately assigned to sessions
- [ ] Overlap detection works correctly
- [ ] Heatmap is visually clear
- [ ] Recommendations are data-driven

---

## P3: Weekly/Monthly Reports

### Overview
Auto-generated reports tóm tắt performance theo tuần/tháng.

### Functional Requirements

#### 7.1 Report Content
```
Weekly Report:
- P&L summary
- Win/Loss count
- Best/Worst trades
- Strategy performance
- Key insights
- Goals vs Actual

Monthly Report:
- All weekly data aggregated
- Month-over-month comparison
- Trend analysis
- Recommendations for next month
```

#### 7.2 Delivery Options
```
- View in app
- Email delivery (configurable)
- PDF export
- Share link (read-only)
```

---

## P3: Mistake Tracking

### Overview
Tag và track trading mistakes để identify patterns và improve.

### Functional Requirements

#### 8.1 Mistake Categories
```
Pre-defined mistakes:
- Entered too early
- Entered too late
- Wrong position size
- Moved stop loss
- Didn't follow plan
- FOMO trade
- Revenge trade
- Overtraded
- Wrong pair
- Ignored news

Custom mistakes:
- User can create own categories
```

#### 8.2 Mistake Analytics
```
Metrics:
- Most common mistakes
- Cost of each mistake type
- Trend over time
- Improvement tracking
```

---

## Database Schema

### New Tables

```sql
-- Trading Strategies
CREATE TABLE trading_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  timeframes TEXT[],
  pairs TEXT[],
  entry_rules TEXT,
  exit_rules TEXT,
  is_active BOOLEAN DEFAULT true,
  color VARCHAR(7),
  icon VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_strategies_user ON trading_strategies(user_id);

-- Trading Mistakes
CREATE TABLE trading_mistakes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trade Mistakes Junction
CREATE TABLE trade_mistakes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES journal_trades(id) ON DELETE CASCADE,
  mistake_id UUID NOT NULL REFERENCES trading_mistakes(id) ON DELETE CASCADE,
  notes TEXT,
  UNIQUE(trade_id, mistake_id)
);

-- Analytics Cache (for performance)
CREATE TABLE analytics_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cache_key VARCHAR(100) NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, cache_key)
);
```

### Modifications to Existing Tables

```sql
-- Add columns to journal_trades
ALTER TABLE journal_trades ADD COLUMN IF NOT EXISTS strategy_id UUID REFERENCES trading_strategies(id);
ALTER TABLE journal_trades ADD COLUMN IF NOT EXISTS pre_trade_emotion VARCHAR(20);
ALTER TABLE journal_trades ADD COLUMN IF NOT EXISTS pre_trade_emotion_scale INTEGER;
ALTER TABLE journal_trades ADD COLUMN IF NOT EXISTS post_trade_emotion VARCHAR(20);
ALTER TABLE journal_trades ADD COLUMN IF NOT EXISTS post_trade_emotion_scale INTEGER;
ALTER TABLE journal_trades ADD COLUMN IF NOT EXISTS sleep_quality INTEGER;
ALTER TABLE journal_trades ADD COLUMN IF NOT EXISTS stress_level INTEGER;
ALTER TABLE journal_trades ADD COLUMN IF NOT EXISTS psychology_notes TEXT;
ALTER TABLE journal_trades ADD COLUMN IF NOT EXISTS session VARCHAR(20);
ALTER TABLE journal_trades ADD COLUMN IF NOT EXISTS is_overlap BOOLEAN DEFAULT false;

-- Add indexes
CREATE INDEX idx_trades_strategy ON journal_trades(strategy_id);
CREATE INDEX idx_trades_session ON journal_trades(session);
CREATE INDEX idx_trades_emotion ON journal_trades(pre_trade_emotion);
```

---

## API Endpoints

### Analytics API

```
GET /api/analytics/dashboard
  Query: ?startDate=&endDate=&accountId=
  Response: AnalyticsData

GET /api/analytics/equity-curve
  Query: ?startDate=&endDate=&interval=day|week|month
  Response: EquityCurveData[]

GET /api/analytics/performance
  Query: ?groupBy=pair|day|session|strategy
  Response: PerformanceBreakdown

GET /api/analytics/calendar
  Query: ?year=&month=
  Response: CalendarMonth
```

### Strategy API

```
GET /api/strategies
POST /api/strategies
GET /api/strategies/:id
PUT /api/strategies/:id
DELETE /api/strategies/:id
GET /api/strategies/:id/performance
```

### Psychology API

```
GET /api/psychology/summary
GET /api/psychology/tiltmeter
GET /api/psychology/insights
```

### Calculator API (client-side)

```
// No API needed - all calculations done client-side
```

---

## UI/UX Guidelines

### Design Principles
1. **Data-first**: Show metrics prominently
2. **Actionable insights**: Not just data, but recommendations
3. **Mobile-friendly**: All features work on mobile
4. **Dark/Light mode**: Full support for both themes
5. **Fast loading**: Use caching, lazy loading

### Color Scheme
```
Profit: #00C888 (green)
Loss: #EF4444 (red)
Neutral: #6B7280 (gray)
Warning: #F59E0B (amber)
Info: #3B82F6 (blue)
```

### Component Library
- Use existing UI components from `/components/ui`
- Charts: Recharts or Chart.js
- Calendar: Custom or react-calendar
- Icons: Lucide React

---

## Implementation Timeline

### Phase 1: Foundation (Week 1-2)
- [ ] Database schema updates
- [ ] API endpoints structure
- [ ] Basic Analytics Dashboard UI

### Phase 2: Core Features (Week 3-4)
- [ ] Complete Analytics Dashboard
- [ ] Profit Calendar
- [ ] Strategy Tracking

### Phase 3: Psychology & Tools (Week 5-6)
- [ ] Psychology Tracking
- [ ] Risk Calculator
- [ ] Session Analysis

### Phase 4: Reports & Polish (Week 7-8)
- [ ] Weekly/Monthly Reports
- [ ] Mistake Tracking
- [ ] Mobile optimization
- [ ] Performance tuning
- [ ] Testing & QA

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Dashboard load time | < 2 seconds |
| User engagement (daily active) | +30% |
| Feature adoption (analytics) | > 60% of active users |
| User satisfaction | > 4.5/5 rating |

---

## Appendix

### A. Competitor Analysis

| Feature | Edgewonk | Tradervue | TraderSync | TheNextTrade |
|---------|----------|-----------|------------|--------------|
| Analytics Dashboard | ✅ | ✅ | ✅ | 🔄 Planned |
| Profit Calendar | ✅ | ✅ | ✅ | 🔄 Planned |
| Strategy Tracking | ✅ | ✅ | ✅ | 🔄 Planned |
| Psychology | ✅ (Tiltmeter) | ❌ | ✅ | 🔄 Planned |
| Risk Calculator | ❌ | ❌ | ✅ | 🔄 Planned |
| Price | $169/year | $49/month | $29/month | FREE + Premium |

### B. References
- Edgewonk Features: https://edgewonk.com/features
- Reddit r/Forex: Trading journal discussions
- Reddit r/Daytrading: User feedback

---

*Document End*
