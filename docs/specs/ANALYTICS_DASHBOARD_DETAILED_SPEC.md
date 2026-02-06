# Analytics Dashboard - Detailed Implementation Specification

> **Version:** 2.0  
> **Created:** February 3, 2026  
> **Purpose:** Detailed spec cho AI Agent implement  
> **Status:** Ready for Implementation

---

## 📋 Table of Contents

1. [Overview](#1-overview)
2. [Current System Analysis](#2-current-system-analysis)
3. [New Feature: Analytics Tab](#3-new-feature-analytics-tab)
4. [Database Schema](#4-database-schema)
5. [API Endpoints](#5-api-endpoints)
6. [Component Structure](#6-component-structure)
7. [Implementation Steps](#7-implementation-steps)
8. [File-by-File Implementation](#8-file-by-file-implementation)
9. [Testing Requirements](#9-testing-requirements)

---

## 1. Overview

### 1.1 Mục tiêu
Thêm tính năng **Analytics** vào Dashboard hiện có, cho phép traders xem và phân tích performance trading của họ một cách chi tiết.

### 1.2 Scope
- **KHÔNG** thay thế Dashboard hiện tại
- **THÊM** một menu item mới "Analytics" vào sidebar
- **THÊM** route mới `/dashboard/analytics`
- **SỬ DỤNG** data từ `journal_trades` table hiện có

### 1.3 User Flow
```
User → Dashboard → Sidebar Menu → Analytics → Xem performance data
```

---

## 2. Current System Analysis

### 2.1 Existing Dashboard Structure

```
/dashboard                    → DashboardClient.tsx (Overview page)
/dashboard/journal           → JournalList.tsx (Trade list)
/dashboard/accounts          → Trading accounts management
/dashboard/academy           → Learning content
/dashboard/trading-systems   → EA downloads
```

### 2.2 Existing Menu (src/config/navigation.ts)

```typescript
export const dashboardMenuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Journal", href: "/dashboard/journal", icon: BookOpen },
    { name: "Trading Accounts", href: "/dashboard/accounts", icon: Wallet },
    { name: "Academy", href: "/dashboard/academy", icon: GraduationCap },
    { name: "Trading Systems", href: "/dashboard/trading-systems", icon: Download },
];
```

### 2.3 Existing Journal Stats (src/components/journal/JournalStats.tsx)

Currently shows basic stats:
- Total Trades
- Win Rate
- Net Profit
- W/L Ratio

**Limitation:** Chỉ là summary đơn giản, không có charts, không có breakdown chi tiết.

### 2.4 Existing Database (journal_trades)

```sql
-- Current fields available:
id, user_id, account_id, symbol, type (BUY/SELL), 
entry_price, exit_price, lot_size, pnl, 
entry_date, exit_date, status, result, notes
```

---

## 3. New Feature: Analytics Tab

### 3.1 Feature Description

Thêm menu item "Analytics" với icon `BarChart3` vào sidebar. Khi click sẽ navigate đến `/dashboard/analytics`.

### 3.2 Analytics Page Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📊 Analytics                              [Date Range ▼] [Account ▼]       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    KPI SUMMARY CARDS (5 cards)                        │  │
│  │  [Win Rate] [Profit Factor] [Total P&L] [Avg RRR] [Total Trades]     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌────────────────────────────────────┐ ┌────────────────────────────────┐ │
│  │                                    │ │                                │ │
│  │     EQUITY CURVE CHART             │ │     PROFIT CALENDAR            │ │
│  │     (Line chart)                   │ │     (Monthly calendar view)    │ │
│  │                                    │ │                                │ │
│  └────────────────────────────────────┘ └────────────────────────────────┘ │
│                                                                             │
│  ┌────────────────────────────────────┐ ┌────────────────────────────────┐ │
│  │                                    │ │                                │ │
│  │     PERFORMANCE BY PAIR            │ │     PERFORMANCE BY DAY         │ │
│  │     (Horizontal bar chart)         │ │     (Bar chart - Mon-Fri)      │ │
│  │                                    │ │                                │ │
│  └────────────────────────────────────┘ └────────────────────────────────┘ │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    RECENT TRADES TABLE (last 10)                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 KPI Cards Specification

| Card | Label | Calculation | Icon | Color |
|------|-------|-------------|------|-------|
| 1 | Win Rate | `(wins / total) * 100` | `Target` | Purple |
| 2 | Profit Factor | `grossProfit / grossLoss` | `Scale` | Blue |
| 3 | Total P&L | `SUM(pnl)` | `DollarSign` | Green/Red |
| 4 | Avg RRR | `avgWin / avgLoss` | `Percent` | Yellow |
| 5 | Total Trades | `COUNT(*)` | `Activity` | Gray |

### 3.4 Charts Specification

#### 3.4.1 Equity Curve Chart
- **Type:** Line chart (Recharts)
- **Data:** Running balance over time
- **X-axis:** Date
- **Y-axis:** Account balance
- **Features:**
  - Show starting balance line
  - Highlight drawdown periods (red area)
  - Tooltip with date and balance

#### 3.4.2 Profit Calendar
- **Type:** Custom calendar grid
- **Data:** Daily P&L aggregated
- **Colors:**
  - Green: Profit day (opacity based on amount)
  - Red: Loss day (opacity based on amount)
  - Gray: No trades
- **Features:**
  - Click on day to see trades
  - Month navigation

#### 3.4.3 Performance by Pair
- **Type:** Horizontal bar chart
- **Data:** P&L grouped by symbol
- **Sorting:** By P&L descending
- **Colors:** Green for profit, Red for loss

#### 3.4.4 Performance by Day
- **Type:** Vertical bar chart
- **Data:** P&L grouped by day of week (Mon-Fri)
- **Helps:** Identify best trading days

---

## 4. Database Schema

### 4.1 No New Tables Required

Analytics sử dụng data từ `journal_trades` table hiện có. Không cần tạo table mới.

### 4.2 Query Optimization (Optional)

Nếu performance chậm, có thể thêm materialized view:

```sql
-- Optional: Create materialized view for analytics
CREATE MATERIALIZED VIEW analytics_daily_summary AS
SELECT 
    user_id,
    account_id,
    DATE(entry_date) as trade_date,
    COUNT(*) as trade_count,
    SUM(CASE WHEN result = 'WIN' THEN 1 ELSE 0 END) as wins,
    SUM(CASE WHEN result = 'LOSS' THEN 1 ELSE 0 END) as losses,
    SUM(pnl) as total_pnl,
    SUM(CASE WHEN pnl > 0 THEN pnl ELSE 0 END) as gross_profit,
    SUM(CASE WHEN pnl < 0 THEN ABS(pnl) ELSE 0 END) as gross_loss
FROM journal_trades
WHERE status = 'CLOSED'
GROUP BY user_id, account_id, DATE(entry_date);

-- Refresh daily
REFRESH MATERIALIZED VIEW analytics_daily_summary;
```

---

## 5. API Endpoints

### 5.1 Main Analytics Endpoint

**File:** `src/app/api/analytics/route.ts`

```typescript
// GET /api/analytics?startDate=&endDate=&accountId=

interface AnalyticsResponse {
  summary: {
    totalTrades: number;
    winCount: number;
    lossCount: number;
    breakEvenCount: number;
    winRate: number;
    profitFactor: number;
    totalPnL: number;
    grossProfit: number;
    grossLoss: number;
    avgWin: number;
    avgLoss: number;
    avgRRR: number;
    bestTrade: number;
    worstTrade: number;
    currentStreak: {
      type: 'win' | 'loss';
      count: number;
    };
  };
  equityCurve: Array<{
    date: string;      // ISO date
    balance: number;   // Running balance
    pnl: number;       // Day's P&L
  }>;
  dailyPnL: Array<{
    date: string;      // ISO date
    pnl: number;
    tradeCount: number;
  }>;
  pairPerformance: Array<{
    symbol: string;
    pnl: number;
    tradeCount: number;
    winRate: number;
  }>;
  dayOfWeekPerformance: Array<{
    day: string;       // 'Monday', 'Tuesday', etc.
    dayIndex: number;  // 0-6
    pnl: number;
    tradeCount: number;
  }>;
  recentTrades: Array<{
    id: string;
    symbol: string;
    type: 'BUY' | 'SELL';
    pnl: number;
    entryDate: string;
    result: 'WIN' | 'LOSS' | 'BREAK_EVEN';
  }>;
}
```

### 5.2 API Implementation

**File:** `src/app/api/analytics/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { 
  startOfMonth, 
  endOfMonth, 
  parseISO, 
  format, 
  getDay 
} from "date-fns";

export async function GET(request: NextRequest) {
  try {
    // 1. Auth check
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse query params
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const accountId = searchParams.get("accountId");

    // Default to current month if no dates provided
    const now = new Date();
    const startDate = startDateParam 
      ? parseISO(startDateParam) 
      : startOfMonth(now);
    const endDate = endDateParam 
      ? parseISO(endDateParam) 
      : endOfMonth(now);

    // 3. Build where clause
    const whereClause: any = {
      userId: user.id,
      status: "CLOSED",
      entryDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (accountId) {
      whereClause.accountId = accountId;
    }

    // 4. Fetch all closed trades in date range
    const trades = await prisma.journalTrade.findMany({
      where: whereClause,
      orderBy: { entryDate: "asc" },
      select: {
        id: true,
        symbol: true,
        type: true,
        pnl: true,
        entryDate: true,
        exitDate: true,
        result: true,
        lotSize: true,
        entryPrice: true,
        exitPrice: true,
      },
    });

    // 5. Calculate summary
    const totalTrades = trades.length;
    const wins = trades.filter(t => t.result === "WIN");
    const losses = trades.filter(t => t.result === "LOSS");
    const breakEvens = trades.filter(t => t.result === "BREAK_EVEN");

    const winCount = wins.length;
    const lossCount = losses.length;
    const breakEvenCount = breakEvens.length;
    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

    const grossProfit = wins.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0));
    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    const avgWin = winCount > 0 ? grossProfit / winCount : 0;
    const avgLoss = lossCount > 0 ? grossLoss / lossCount : 0;
    const avgRRR = avgLoss > 0 ? avgWin / avgLoss : 0;

    const pnlValues = trades.map(t => t.pnl || 0);
    const bestTrade = pnlValues.length > 0 ? Math.max(...pnlValues) : 0;
    const worstTrade = pnlValues.length > 0 ? Math.min(...pnlValues) : 0;

    // Calculate current streak
    let currentStreak = { type: "win" as "win" | "loss", count: 0 };
    const reversedTrades = [...trades].reverse();
    if (reversedTrades.length > 0) {
      const firstResult = reversedTrades[0].result;
      if (firstResult === "WIN" || firstResult === "LOSS") {
        currentStreak.type = firstResult.toLowerCase() as "win" | "loss";
        for (const trade of reversedTrades) {
          if (trade.result === firstResult) {
            currentStreak.count++;
          } else {
            break;
          }
        }
      }
    }

    // 6. Calculate equity curve
    // Get starting balance from account or use 10000 as default
    let runningBalance = 10000; // TODO: Get from account
    const equityCurve: Array<{ date: string; balance: number; pnl: number }> = [];
    
    // Group trades by date
    const tradesByDate = new Map<string, number>();
    for (const trade of trades) {
      const dateKey = format(trade.entryDate, "yyyy-MM-dd");
      const currentPnL = tradesByDate.get(dateKey) || 0;
      tradesByDate.set(dateKey, currentPnL + (trade.pnl || 0));
    }

    // Build equity curve
    for (const [dateKey, pnl] of tradesByDate) {
      runningBalance += pnl;
      equityCurve.push({
        date: dateKey,
        balance: runningBalance,
        pnl: pnl,
      });
    }

    // 7. Calculate daily P&L for calendar
    const dailyPnL = Array.from(tradesByDate.entries()).map(([date, pnl]) => {
      const tradesOnDate = trades.filter(
        t => format(t.entryDate, "yyyy-MM-dd") === date
      );
      return {
        date,
        pnl,
        tradeCount: tradesOnDate.length,
      };
    });

    // 8. Calculate pair performance
    const pairMap = new Map<string, { pnl: number; count: number; wins: number }>();
    for (const trade of trades) {
      const current = pairMap.get(trade.symbol) || { pnl: 0, count: 0, wins: 0 };
      pairMap.set(trade.symbol, {
        pnl: current.pnl + (trade.pnl || 0),
        count: current.count + 1,
        wins: current.wins + (trade.result === "WIN" ? 1 : 0),
      });
    }
    const pairPerformance = Array.from(pairMap.entries())
      .map(([symbol, data]) => ({
        symbol,
        pnl: data.pnl,
        tradeCount: data.count,
        winRate: (data.wins / data.count) * 100,
      }))
      .sort((a, b) => b.pnl - a.pnl);

    // 9. Calculate day of week performance
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayMap = new Map<number, { pnl: number; count: number }>();
    for (const trade of trades) {
      const dayIndex = getDay(trade.entryDate);
      const current = dayMap.get(dayIndex) || { pnl: 0, count: 0 };
      dayMap.set(dayIndex, {
        pnl: current.pnl + (trade.pnl || 0),
        count: current.count + 1,
      });
    }
    const dayOfWeekPerformance = Array.from(dayMap.entries())
      .map(([dayIndex, data]) => ({
        day: dayNames[dayIndex],
        dayIndex,
        pnl: data.pnl,
        tradeCount: data.count,
      }))
      .sort((a, b) => a.dayIndex - b.dayIndex);

    // 10. Get recent trades
    const recentTrades = trades.slice(-10).reverse().map(t => ({
      id: t.id,
      symbol: t.symbol,
      type: t.type,
      pnl: t.pnl || 0,
      entryDate: t.entryDate.toISOString(),
      result: t.result || "BREAK_EVEN",
    }));

    // 11. Return response
    return NextResponse.json({
      summary: {
        totalTrades,
        winCount,
        lossCount,
        breakEvenCount,
        winRate,
        profitFactor,
        totalPnL,
        grossProfit,
        grossLoss,
        avgWin,
        avgLoss,
        avgRRR,
        bestTrade,
        worstTrade,
        currentStreak,
      },
      equityCurve,
      dailyPnL,
      pairPerformance,
      dayOfWeekPerformance,
      recentTrades,
    });
  } catch (error) {
    console.error("Analytics API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
```

---

## 6. Component Structure

### 6.1 File Tree

```
src/
├── app/
│   └── dashboard/
│       └── analytics/
│           └── page.tsx           # NEW: Analytics page
├── components/
│   └── analytics/                 # NEW: Analytics components folder
│       ├── AnalyticsDashboard.tsx # Main container
│       ├── KPICards.tsx           # 5 KPI summary cards
│       ├── EquityCurve.tsx        # Line chart component
│       ├── ProfitCalendar.tsx     # Calendar grid component
│       ├── PairPerformance.tsx    # Horizontal bar chart
│       ├── DayPerformance.tsx     # Vertical bar chart
│       └── RecentTradesTable.tsx  # Last 10 trades table
└── config/
    └── navigation.ts              # MODIFY: Add Analytics menu item
```

### 6.2 Component Specifications

#### 6.2.1 AnalyticsDashboard.tsx

```typescript
// src/components/analytics/AnalyticsDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";

import { KPICards } from "./KPICards";
import { EquityCurve } from "./EquityCurve";
import { ProfitCalendar } from "./ProfitCalendar";
import { PairPerformance } from "./PairPerformance";
import { DayPerformance } from "./DayPerformance";
import { RecentTradesTable } from "./RecentTradesTable";
import { DateRangePicker } from "@/components/ui/DateRangePicker"; // Create if not exists
import { AccountSelector } from "@/components/dashboard/AccountSelector";

interface AnalyticsData {
  summary: {
    totalTrades: number;
    winCount: number;
    lossCount: number;
    breakEvenCount: number;
    winRate: number;
    profitFactor: number;
    totalPnL: number;
    grossProfit: number;
    grossLoss: number;
    avgWin: number;
    avgLoss: number;
    avgRRR: number;
    bestTrade: number;
    worstTrade: number;
    currentStreak: {
      type: 'win' | 'loss';
      count: number;
    };
  };
  equityCurve: Array<{ date: string; balance: number; pnl: number }>;
  dailyPnL: Array<{ date: string; pnl: number; tradeCount: number }>;
  pairPerformance: Array<{ symbol: string; pnl: number; tradeCount: number; winRate: number }>;
  dayOfWeekPerformance: Array<{ day: string; dayIndex: number; pnl: number; tradeCount: number }>;
  recentTrades: Array<{ id: string; symbol: string; type: string; pnl: number; entryDate: string; result: string }>;
}

export function AnalyticsDashboard() {
  const searchParams = useSearchParams();
  const accountId = searchParams.get("accountId");
  
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        startDate: format(dateRange.start, "yyyy-MM-dd"),
        endDate: format(dateRange.end, "yyyy-MM-dd"),
      });
      if (accountId) params.set("accountId", accountId);

      const res = await fetch(`/api/analytics?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      
      const json = await res.json();
      setData(json);
    } catch (error) {
      toast.error("Failed to load analytics");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, accountId]);

  if (isLoading) {
    return <AnalyticsLoadingSkeleton />;
  }

  if (!data) {
    return <AnalyticsEmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Analyze your trading performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
          <AccountSelector />
        </div>
      </div>

      {/* KPI Summary Cards */}
      <KPICards summary={data.summary} />

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EquityCurve data={data.equityCurve} />
        <ProfitCalendar data={data.dailyPnL} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PairPerformance data={data.pairPerformance} />
        <DayPerformance data={data.dayOfWeekPerformance} />
      </div>

      {/* Recent Trades */}
      <RecentTradesTable trades={data.recentTrades} />
    </div>
  );
}

function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
      <div className="grid grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
      </div>
    </div>
  );
}

function AnalyticsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <BarChart3 className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        No trading data yet
      </h3>
      <p className="text-gray-500 text-center max-w-md">
        Start logging trades in your journal to see analytics here.
      </p>
    </div>
  );
}
```

#### 6.2.2 KPICards.tsx

```typescript
// src/components/analytics/KPICards.tsx
"use client";

import { 
  Target, 
  Scale, 
  DollarSign, 
  Percent, 
  Activity,
  TrendingUp,
  TrendingDown 
} from "lucide-react";

interface KPICardsProps {
  summary: {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    totalPnL: number;
    avgRRR: number;
    currentStreak: {
      type: 'win' | 'loss';
      count: number;
    };
  };
}

export function KPICards({ summary }: KPICardsProps) {
  const cards = [
    {
      title: "Win Rate",
      value: `${summary.winRate.toFixed(1)}%`,
      icon: Target,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-500/10",
      description: summary.winRate >= 50 ? "Above average" : "Below average",
    },
    {
      title: "Profit Factor",
      value: summary.profitFactor === Infinity 
        ? "∞" 
        : summary.profitFactor.toFixed(2),
      icon: Scale,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-500/10",
      description: summary.profitFactor >= 1.5 ? "Healthy" : "Needs improvement",
    },
    {
      title: "Total P&L",
      value: `$${Math.abs(summary.totalPnL).toLocaleString()}`,
      icon: summary.totalPnL >= 0 ? TrendingUp : TrendingDown,
      color: summary.totalPnL >= 0 ? "text-green-500" : "text-red-500",
      bg: summary.totalPnL >= 0 
        ? "bg-green-50 dark:bg-green-500/10" 
        : "bg-red-50 dark:bg-red-500/10",
      prefix: summary.totalPnL >= 0 ? "+" : "-",
    },
    {
      title: "Avg R:R",
      value: `1:${summary.avgRRR.toFixed(1)}`,
      icon: Percent,
      color: "text-yellow-500",
      bg: "bg-yellow-50 dark:bg-yellow-500/10",
      description: summary.avgRRR >= 2 ? "Excellent" : "Review exits",
    },
    {
      title: "Total Trades",
      value: summary.totalTrades.toString(),
      icon: Activity,
      color: "text-gray-500",
      bg: "bg-gray-50 dark:bg-gray-500/10",
      description: `${summary.currentStreak.count} ${summary.currentStreak.type} streak`,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-white dark:bg-[#0B0E14] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2.5 rounded-xl ${card.bg}`}>
                <Icon size={18} className={card.color} />
              </div>
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
              {card.title}
            </h3>
            <p className={`text-2xl font-black ${card.color.includes('green') || card.color.includes('red') ? card.color : 'text-gray-900 dark:text-white'}`}>
              {card.prefix && card.prefix}
              {card.value}
            </p>
            {card.description && (
              <p className="text-xs text-gray-400 mt-1">{card.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

#### 6.2.3 EquityCurve.tsx

```typescript
// src/components/analytics/EquityCurve.tsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";
import { format, parseISO } from "date-fns";

interface EquityCurveProps {
  data: Array<{
    date: string;
    balance: number;
    pnl: number;
  }>;
}

export function EquityCurve({ data }: EquityCurveProps) {
  // Format data for chart
  const chartData = data.map(item => ({
    ...item,
    dateLabel: format(parseISO(item.date), "MMM dd"),
  }));

  // Calculate min/max for Y axis
  const balances = data.map(d => d.balance);
  const minBalance = Math.min(...balances) * 0.98;
  const maxBalance = Math.max(...balances) * 1.02;

  return (
    <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4">
        Equity Curve
      </h3>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00C888" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00C888" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#374151" 
              opacity={0.1} 
            />
            <XAxis 
              dataKey="dateLabel" 
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              domain={[minBalance, maxBalance]}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "none",
                borderRadius: "12px",
                padding: "12px",
              }}
              labelStyle={{ color: "#9CA3AF" }}
              formatter={(value: number, name: string) => [
                `$${value.toLocaleString()}`,
                name === "balance" ? "Balance" : "P&L",
              ]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#00C888"
              strokeWidth={2}
              fill="url(#colorBalance)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

#### 6.2.4 ProfitCalendar.tsx

```typescript
// src/components/analytics/ProfitCalendar.tsx
"use client";

import { useState } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProfitCalendarProps {
  data: Array<{
    date: string;
    pnl: number;
    tradeCount: number;
  }>;
}

export function ProfitCalendar({ data }: ProfitCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get all days in current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get starting day offset (0 = Sunday, 1 = Monday, etc.)
  const startDayOffset = getDay(monthStart);

  // Create data map for quick lookup
  const dataMap = new Map(
    data.map(d => [d.date, { pnl: d.pnl, tradeCount: d.tradeCount }])
  );

  // Calculate max absolute PnL for color intensity
  const maxPnL = Math.max(...data.map(d => Math.abs(d.pnl)), 1);

  const getColorClass = (pnl: number) => {
    const intensity = Math.min(Math.abs(pnl) / maxPnL, 1);
    if (pnl > 0) {
      if (intensity > 0.7) return "bg-green-500 text-white";
      if (intensity > 0.4) return "bg-green-400 text-white";
      return "bg-green-200 dark:bg-green-500/30 text-green-800 dark:text-green-300";
    } else if (pnl < 0) {
      if (intensity > 0.7) return "bg-red-500 text-white";
      if (intensity > 0.4) return "bg-red-400 text-white";
      return "bg-red-200 dark:bg-red-500/30 text-red-800 dark:text-red-300";
    }
    return "bg-gray-100 dark:bg-gray-800 text-gray-400";
  };

  return (
    <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white">
          Profit Calendar
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft size={18} className="text-gray-500" />
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronRight size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div
            key={day}
            className="text-center text-xs font-bold text-gray-400 uppercase py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for offset */}
        {[...Array(startDayOffset)].map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Day cells */}
        {days.map(day => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayData = dataMap.get(dateKey);
          const hasTrades = dayData && dayData.tradeCount > 0;

          return (
            <div
              key={dateKey}
              className={`
                aspect-square rounded-lg flex flex-col items-center justify-center
                text-xs cursor-pointer transition-all hover:scale-105
                ${hasTrades ? getColorClass(dayData.pnl) : "bg-gray-50 dark:bg-gray-800/50"}
              `}
              title={hasTrades ? `$${dayData.pnl.toFixed(0)} (${dayData.tradeCount} trades)` : "No trades"}
            >
              <span className="font-medium">{format(day, "d")}</span>
              {hasTrades && (
                <span className="text-[10px] font-bold">
                  {dayData.pnl >= 0 ? "+" : ""}${Math.abs(dayData.pnl).toFixed(0)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-xs text-gray-500">Profit</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-xs text-gray-500">Loss</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs text-gray-500">No trades</span>
        </div>
      </div>
    </div>
  );
}
```

#### 6.2.5 PairPerformance.tsx

```typescript
// src/components/analytics/PairPerformance.tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface PairPerformanceProps {
  data: Array<{
    symbol: string;
    pnl: number;
    tradeCount: number;
    winRate: number;
  }>;
}

export function PairPerformance({ data }: PairPerformanceProps) {
  // Sort by PnL and take top 8
  const chartData = [...data]
    .sort((a, b) => b.pnl - a.pnl)
    .slice(0, 8);

  return (
    <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4">
        Performance by Pair
      </h3>

      {data.length === 0 ? (
        <div className="h-[250px] flex items-center justify-center text-gray-400">
          No data available
        </div>
      ) : (
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#374151" 
                opacity={0.1}
                horizontal={false}
              />
              <XAxis 
                type="number"
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <YAxis 
                type="category"
                dataKey="symbol"
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px",
                }}
                formatter={(value: number, name: string, props: any) => [
                  `$${value.toLocaleString()}`,
                  "P&L",
                ]}
                labelFormatter={(label) => `${label}`}
              />
              <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.pnl >= 0 ? "#00C888" : "#EF4444"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top performers list */}
      {data.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Best: {chartData[0]?.symbol}</span>
            <span className="text-green-500 font-bold">
              +${chartData[0]?.pnl.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### 6.2.6 DayPerformance.tsx

```typescript
// src/components/analytics/DayPerformance.tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DayPerformanceProps {
  data: Array<{
    day: string;
    dayIndex: number;
    pnl: number;
    tradeCount: number;
  }>;
}

export function DayPerformance({ data }: DayPerformanceProps) {
  // Ensure we have all weekdays (Mon-Fri)
  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const chartData = weekdays.map((day, index) => {
    const dayData = data.find(d => d.day === day);
    return {
      day: day.substring(0, 3), // Mon, Tue, etc.
      fullDay: day,
      pnl: dayData?.pnl || 0,
      tradeCount: dayData?.tradeCount || 0,
    };
  });

  // Find best day
  const bestDay = [...chartData].sort((a, b) => b.pnl - a.pnl)[0];

  return (
    <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4">
        Performance by Day
      </h3>

      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#374151" 
              opacity={0.1}
              vertical={false}
            />
            <XAxis 
              dataKey="day"
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "none",
                borderRadius: "12px",
                padding: "12px",
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, "P&L"]}
              labelFormatter={(label) => {
                const day = chartData.find(d => d.day === label);
                return `${day?.fullDay} (${day?.tradeCount} trades)`;
              }}
            />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.pnl >= 0 ? "#00C888" : "#EF4444"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Best day insight */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Best day: {bestDay?.fullDay}</span>
          <span className={`font-bold ${bestDay?.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {bestDay?.pnl >= 0 ? '+' : ''}${bestDay?.pnl.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
```

#### 6.2.7 RecentTradesTable.tsx

```typescript
// src/components/analytics/RecentTradesTable.tsx
"use client";

import { format, parseISO } from "date-fns";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";

interface RecentTradesTableProps {
  trades: Array<{
    id: string;
    symbol: string;
    type: string;
    pnl: number;
    entryDate: string;
    result: string;
  }>;
}

export function RecentTradesTable({ trades }: RecentTradesTableProps) {
  const getResultIcon = (result: string) => {
    switch (result) {
      case "WIN":
        return <TrendingUp size={14} className="text-green-500" />;
      case "LOSS":
        return <TrendingDown size={14} className="text-red-500" />;
      default:
        return <Minus size={14} className="text-gray-400" />;
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case "WIN":
        return "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400";
      case "LOSS":
        return "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400";
    }
  };

  return (
    <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white">
          Recent Trades
        </h3>
        <Link
          href="/dashboard/journal"
          className="text-sm text-[#00C888] hover:underline font-medium"
        >
          View all →
        </Link>
      </div>

      {trades.length === 0 ? (
        <div className="py-8 text-center text-gray-400">
          No trades to display
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-400 font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">Date</th>
                <th className="px-4 py-3">Pair</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3 rounded-r-xl text-right">P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {trades.map((trade) => (
                <tr
                  key={trade.id}
                  className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-500">
                    {format(parseISO(trade.entryDate), "MMM dd, HH:mm")}
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                    {trade.symbol}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded ${
                        trade.type === "BUY"
                          ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                      }`}
                    >
                      {trade.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded ${getResultBadge(
                        trade.result
                      )}`}
                    >
                      {getResultIcon(trade.result)}
                      {trade.result}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-bold ${
                      trade.pnl >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

---

## 7. Implementation Steps

### Step 1: Update Navigation

**File:** `src/config/navigation.ts`

```typescript
// ADD this import at top
import { BarChart3 } from "lucide-react";

// MODIFY dashboardMenuItems array - add after "Journal"
export const dashboardMenuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Journal", href: "/dashboard/journal", icon: BookOpen },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 }, // NEW
    { name: "Trading Accounts", href: "/dashboard/accounts", icon: Wallet },
    { name: "Academy", href: "/dashboard/academy", icon: GraduationCap },
    { name: "Trading Systems", href: "/dashboard/trading-systems", icon: Download },
];
```

### Step 2: Create API Route

**File:** `src/app/api/analytics/route.ts`

Create the file with the full implementation from Section 5.2.

### Step 3: Create Analytics Page

**File:** `src/app/dashboard/analytics/page.tsx`

```typescript
import { Metadata } from "next";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Analytics | Trading Dashboard",
    description: "Analyze your trading performance",
};

export default function AnalyticsPage() {
    return <AnalyticsDashboard />;
}
```

### Step 4: Create Components

Create all component files in `src/components/analytics/`:

1. `AnalyticsDashboard.tsx` (Section 6.2.1)
2. `KPICards.tsx` (Section 6.2.2)
3. `EquityCurve.tsx` (Section 6.2.3)
4. `ProfitCalendar.tsx` (Section 6.2.4)
5. `PairPerformance.tsx` (Section 6.2.5)
6. `DayPerformance.tsx` (Section 6.2.6)
7. `RecentTradesTable.tsx` (Section 6.2.7)

### Step 5: Install Dependencies

```bash
npm install recharts
```

Note: `recharts` might already be installed. Check `package.json`.

### Step 6: Create Index Export

**File:** `src/components/analytics/index.ts`

```typescript
export { AnalyticsDashboard } from "./AnalyticsDashboard";
export { KPICards } from "./KPICards";
export { EquityCurve } from "./EquityCurve";
export { ProfitCalendar } from "./ProfitCalendar";
export { PairPerformance } from "./PairPerformance";
export { DayPerformance } from "./DayPerformance";
export { RecentTradesTable } from "./RecentTradesTable";
```

---

## 8. File-by-File Implementation

### Files to CREATE:

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `src/app/api/analytics/route.ts` | API endpoint |
| 2 | `src/app/dashboard/analytics/page.tsx` | Page component |
| 3 | `src/components/analytics/AnalyticsDashboard.tsx` | Main container |
| 4 | `src/components/analytics/KPICards.tsx` | KPI cards |
| 5 | `src/components/analytics/EquityCurve.tsx` | Line chart |
| 6 | `src/components/analytics/ProfitCalendar.tsx` | Calendar |
| 7 | `src/components/analytics/PairPerformance.tsx` | Bar chart |
| 8 | `src/components/analytics/DayPerformance.tsx` | Bar chart |
| 9 | `src/components/analytics/RecentTradesTable.tsx` | Table |
| 10 | `src/components/analytics/index.ts` | Exports |

### Files to MODIFY:

| # | File Path | Change |
|---|-----------|--------|
| 1 | `src/config/navigation.ts` | Add Analytics menu item |

### Dependencies:

| Package | Purpose | Install |
|---------|---------|---------|
| recharts | Charts | `npm install recharts` (if not installed) |
| date-fns | Date utilities | Already installed |

---

## 9. Testing Requirements

### 9.1 Unit Tests

Create test file: `tests/user/components/analytics/AnalyticsDashboard.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

// Mock fetch
global.fetch = vi.fn();

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<AnalyticsDashboard />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders KPI cards with data', async () => {
    const mockData = {
      summary: {
        totalTrades: 100,
        winRate: 65,
        profitFactor: 1.8,
        totalPnL: 5000,
        avgRRR: 2.1,
        currentStreak: { type: 'win', count: 3 },
      },
      equityCurve: [],
      dailyPnL: [],
      pairPerformance: [],
      dayOfWeekPerformance: [],
      recentTrades: [],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('65.0%')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  it('shows empty state when no data', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    });

    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/no trading data/i)).toBeInTheDocument();
    });
  });
});
```

### 9.2 API Tests

Create test file: `tests/user/api/analytics.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/auth-cache', () => ({
  getAuthUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    journalTrade: {
      findMany: vi.fn(),
    },
  },
}));

import { GET } from '@/app/api/analytics/route';
import { getAuthUser } from '@/lib/auth-cache';
import { prisma } from '@/lib/prisma';

describe('GET /api/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if not authenticated', async () => {
    (getAuthUser as any).mockResolvedValue(null);

    const request = new Request('http://localhost/api/analytics');
    const response = await GET(request as any);

    expect(response.status).toBe(401);
  });

  it('returns analytics data for authenticated user', async () => {
    (getAuthUser as any).mockResolvedValue({ id: 'user-1' });
    (prisma.journalTrade.findMany as any).mockResolvedValue([
      {
        id: '1',
        symbol: 'EURUSD',
        type: 'BUY',
        pnl: 100,
        result: 'WIN',
        entryDate: new Date(),
      },
      {
        id: '2',
        symbol: 'EURUSD',
        type: 'SELL',
        pnl: -50,
        result: 'LOSS',
        entryDate: new Date(),
      },
    ]);

    const request = new Request('http://localhost/api/analytics');
    const response = await GET(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.summary.totalTrades).toBe(2);
    expect(data.summary.winCount).toBe(1);
    expect(data.summary.lossCount).toBe(1);
    expect(data.summary.winRate).toBe(50);
  });
});
```

### 9.3 Acceptance Criteria Checklist

- [ ] Navigation shows "Analytics" menu item with `BarChart3` icon
- [ ] `/dashboard/analytics` page loads without errors
- [ ] KPI cards display correct calculations
- [ ] Equity curve chart renders with data
- [ ] Profit calendar shows correct colors for profit/loss days
- [ ] Calendar navigation (previous/next month) works
- [ ] Performance by pair chart sorts by P&L
- [ ] Performance by day chart shows Mon-Fri
- [ ] Recent trades table shows last 10 trades
- [ ] Date range filter works correctly
- [ ] Account filter works correctly
- [ ] Empty state displays when no trades
- [ ] Loading state displays while fetching
- [ ] Error handling shows toast on API error
- [ ] Mobile responsive on all screen sizes
- [ ] Dark mode support for all components

---

## Summary for AI Agent

### Priority Order:

1. **Create API** (`src/app/api/analytics/route.ts`) - Most critical, provides data
2. **Modify Navigation** (`src/config/navigation.ts`) - Quick change
3. **Create Page** (`src/app/dashboard/analytics/page.tsx`) - Simple wrapper
4. **Create Components** (in order):
   - AnalyticsDashboard.tsx
   - KPICards.tsx
   - EquityCurve.tsx
   - ProfitCalendar.tsx
   - PairPerformance.tsx
   - DayPerformance.tsx
   - RecentTradesTable.tsx

### Key Dependencies:
- `recharts` for charts
- `date-fns` for date handling
- Existing `journal_trades` table for data

### Existing Components to Reuse:
- `AccountSelector` from `/components/dashboard/AccountSelector`
- UI components from `/components/ui`

---

*Document End - Ready for Implementation*
