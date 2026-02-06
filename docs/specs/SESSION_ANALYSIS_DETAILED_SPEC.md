# Session Analysis - Detailed Implementation Specification

> **Version:** 1.0  
> **Created:** February 3, 2026  
> **Purpose:** Analyze trading performance by time of day/session  
> **Priority:** P2

---

## 1. Overview

### 1.1 Mục tiêu
Giúp traders hiểu performance của họ theo từng trading session (Asian, London, New York) và thời gian trong ngày.

### 1.2 User Stories
> "Tôi muốn biết session nào tôi trade tốt nhất"  
> "Tôi hay thua vào buổi chiều - cần data để confirm"

### 1.3 Trading Sessions
| Session | UTC Time | Local Markets |
|---------|----------|---------------|
| Sydney | 21:00 - 06:00 | AUD, NZD |
| Tokyo | 00:00 - 09:00 | JPY |
| London | 07:00 - 16:00 | EUR, GBP |
| New York | 12:00 - 21:00 | USD, CAD |

### 1.4 Key Insight từ Research
- Reddit traders: "I lose money trading Asian session on EUR pairs"
- Many traders don't know their best time to trade
- Session analysis reveals patterns hidden in overall stats

---

## 2. Database Changes

### 2.1 Add Session Field (Auto-calculated)

```sql
-- Add session column (auto-populated based on entry_date time)
ALTER TABLE journal_trades 
ADD COLUMN trading_session VARCHAR(20) DEFAULT NULL;

-- Create index for session queries
CREATE INDEX idx_journal_trades_session ON journal_trades(trading_session);
```

### 2.2 Prisma Schema Update

**File:** `prisma/schema.prisma`

```prisma
model JournalTrade {
  // ... existing fields ...
  
  // NEW: Session field (auto-calculated)
  tradingSession    String?   @map("trading_session") @db.VarChar(20)
  
  // ... existing relations ...
}
```

### 2.3 Session Detection Logic

```typescript
// Session definitions in UTC
const SESSIONS = {
  SYDNEY: { start: 21, end: 6 },   // 21:00 - 06:00 UTC
  TOKYO: { start: 0, end: 9 },     // 00:00 - 09:00 UTC
  LONDON: { start: 7, end: 16 },   // 07:00 - 16:00 UTC
  NEW_YORK: { start: 12, end: 21 }, // 12:00 - 21:00 UTC
};

function detectSession(entryDate: Date): string {
  const hour = entryDate.getUTCHours();
  
  // Check overlapping sessions
  const activeSessions: string[] = [];
  
  // Sydney (wraps around midnight)
  if (hour >= 21 || hour < 6) activeSessions.push("SYDNEY");
  
  // Tokyo
  if (hour >= 0 && hour < 9) activeSessions.push("TOKYO");
  
  // London
  if (hour >= 7 && hour < 16) activeSessions.push("LONDON");
  
  // New York
  if (hour >= 12 && hour < 21) activeSessions.push("NEW_YORK");
  
  // Return primary session (highest volume)
  if (activeSessions.includes("LONDON") && activeSessions.includes("NEW_YORK")) {
    return "LONDON_NY_OVERLAP"; // Most volatile period
  }
  if (activeSessions.includes("TOKYO") && activeSessions.includes("LONDON")) {
    return "TOKYO_LONDON_OVERLAP";
  }
  
  // Return first active session
  return activeSessions[0] || "OFF_HOURS";
}
```

---

## 3. API Endpoints

### 3.1 Session Analytics API

**File:** `src/app/api/analytics/sessions/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, parseISO, getHours, format } from "date-fns";

interface SessionStats {
  session: string;
  displayName: string;
  color: string;
  totalTrades: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  totalPnL: number;
  avgPnL: number;
  profitFactor: number;
}

interface HourlyStats {
  hour: number;
  hourLabel: string;
  totalTrades: number;
  winRate: number;
  totalPnL: number;
}

interface SessionAnalytics {
  sessionStats: SessionStats[];
  hourlyStats: HourlyStats[];
  bestSession: string | null;
  worstSession: string | null;
  bestHour: number | null;
  worstHour: number | null;
  recommendations: string[];
}

const SESSION_COLORS: Record<string, string> = {
  SYDNEY: "#F59E0B",      // Amber
  TOKYO: "#EF4444",       // Red
  LONDON: "#3B82F6",      // Blue
  NEW_YORK: "#10B981",    // Green
  LONDON_NY_OVERLAP: "#8B5CF6", // Purple
  TOKYO_LONDON_OVERLAP: "#EC4899", // Pink
  OFF_HOURS: "#6B7280",   // Gray
};

const SESSION_NAMES: Record<string, string> = {
  SYDNEY: "Sydney/Asian",
  TOKYO: "Tokyo",
  LONDON: "London",
  NEW_YORK: "New York",
  LONDON_NY_OVERLAP: "London/NY Overlap",
  TOKYO_LONDON_OVERLAP: "Tokyo/London Overlap",
  OFF_HOURS: "Off Hours",
};

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const accountId = searchParams.get("accountId");

    const now = new Date();
    const startDate = startDateParam ? parseISO(startDateParam) : startOfMonth(now);
    const endDate = endDateParam ? parseISO(endDateParam) : endOfMonth(now);

    const whereClause: any = {
      userId: user.id,
      status: "CLOSED",
      entryDate: { gte: startDate, lte: endDate },
    };

    if (accountId) whereClause.accountId = accountId;

    // Fetch trades
    const trades = await prisma.journalTrade.findMany({
      where: whereClause,
      select: {
        id: true,
        pnl: true,
        result: true,
        entryDate: true,
        tradingSession: true,
      },
    });

    // Calculate session for trades without session field
    const tradesWithSession = trades.map(trade => ({
      ...trade,
      session: trade.tradingSession || detectSession(trade.entryDate),
    }));

    // Group by session
    const sessionMap = new Map<string, {
      wins: number;
      losses: number;
      grossProfit: number;
      grossLoss: number;
      totalPnL: number;
    }>();

    for (const trade of tradesWithSession) {
      const current = sessionMap.get(trade.session) || {
        wins: 0, losses: 0, grossProfit: 0, grossLoss: 0, totalPnL: 0,
      };

      const pnl = trade.pnl || 0;
      current.totalPnL += pnl;

      if (trade.result === "WIN") {
        current.wins++;
        current.grossProfit += pnl;
      } else if (trade.result === "LOSS") {
        current.losses++;
        current.grossLoss += Math.abs(pnl);
      }

      sessionMap.set(trade.session, current);
    }

    // Build session stats
    const sessionStats: SessionStats[] = Array.from(sessionMap.entries())
      .map(([session, data]) => {
        const total = data.wins + data.losses;
        return {
          session,
          displayName: SESSION_NAMES[session] || session,
          color: SESSION_COLORS[session] || "#6B7280",
          totalTrades: total,
          winCount: data.wins,
          lossCount: data.losses,
          winRate: total > 0 ? (data.wins / total) * 100 : 0,
          totalPnL: data.totalPnL,
          avgPnL: total > 0 ? data.totalPnL / total : 0,
          profitFactor: data.grossLoss > 0 
            ? data.grossProfit / data.grossLoss 
            : data.grossProfit > 0 ? Infinity : 0,
        };
      })
      .sort((a, b) => b.totalPnL - a.totalPnL);

    // Group by hour (0-23)
    const hourMap = new Map<number, { wins: number; total: number; pnl: number }>();
    
    for (const trade of tradesWithSession) {
      const hour = trade.entryDate.getUTCHours();
      const current = hourMap.get(hour) || { wins: 0, total: 0, pnl: 0 };
      
      current.total++;
      current.pnl += trade.pnl || 0;
      if (trade.result === "WIN") current.wins++;
      
      hourMap.set(hour, current);
    }

    // Build hourly stats
    const hourlyStats: HourlyStats[] = Array.from(hourMap.entries())
      .map(([hour, data]) => ({
        hour,
        hourLabel: `${hour.toString().padStart(2, '0')}:00`,
        totalTrades: data.total,
        winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
        totalPnL: data.pnl,
      }))
      .sort((a, b) => a.hour - b.hour);

    // Find best/worst
    const bestSession = sessionStats.length > 0 
      ? sessionStats.reduce((best, curr) => curr.totalPnL > best.totalPnL ? curr : best).session
      : null;
    
    const worstSession = sessionStats.length > 0
      ? sessionStats.reduce((worst, curr) => curr.totalPnL < worst.totalPnL ? curr : worst).session
      : null;

    const hourlyWithTrades = hourlyStats.filter(h => h.totalTrades >= 3);
    const bestHour = hourlyWithTrades.length > 0
      ? hourlyWithTrades.reduce((best, curr) => curr.winRate > best.winRate ? curr : best).hour
      : null;
    
    const worstHour = hourlyWithTrades.length > 0
      ? hourlyWithTrades.reduce((worst, curr) => curr.winRate < worst.winRate ? curr : worst).hour
      : null;

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (bestSession) {
      const best = sessionStats.find(s => s.session === bestSession);
      if (best && best.winRate > 55) {
        recommendations.push(
          `Focus on trading during ${SESSION_NAMES[bestSession]} - your best session with ${best.winRate.toFixed(0)}% win rate.`
        );
      }
    }
    
    if (worstSession && worstSession !== bestSession) {
      const worst = sessionStats.find(s => s.session === worstSession);
      if (worst && worst.winRate < 45) {
        recommendations.push(
          `Consider avoiding ${SESSION_NAMES[worstSession]} - your worst session with ${worst.winRate.toFixed(0)}% win rate.`
        );
      }
    }

    if (bestHour !== null && worstHour !== null) {
      recommendations.push(
        `Your best hour is ${bestHour.toString().padStart(2, '0')}:00 UTC. Worst is ${worstHour.toString().padStart(2, '0')}:00 UTC.`
      );
    }

    return NextResponse.json({
      sessionStats,
      hourlyStats,
      bestSession,
      worstSession,
      bestHour,
      worstHour,
      recommendations,
    });
  } catch (error) {
    console.error("Session analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch session analytics" },
      { status: 500 }
    );
  }
}

function detectSession(entryDate: Date): string {
  const hour = entryDate.getUTCHours();
  
  const activeSessions: string[] = [];
  
  if (hour >= 21 || hour < 6) activeSessions.push("SYDNEY");
  if (hour >= 0 && hour < 9) activeSessions.push("TOKYO");
  if (hour >= 7 && hour < 16) activeSessions.push("LONDON");
  if (hour >= 12 && hour < 21) activeSessions.push("NEW_YORK");
  
  if (activeSessions.includes("LONDON") && activeSessions.includes("NEW_YORK")) {
    return "LONDON_NY_OVERLAP";
  }
  if (activeSessions.includes("TOKYO") && activeSessions.includes("LONDON")) {
    return "TOKYO_LONDON_OVERLAP";
  }
  
  return activeSessions[0] || "OFF_HOURS";
}
```

---

## 4. Component Structure

### 4.1 File Tree

```
src/
├── app/
│   └── dashboard/
│       └── sessions/
│           └── page.tsx           # Sessions page
├── components/
│   └── sessions/                  # NEW folder
│       ├── SessionDashboard.tsx   # Main container
│       ├── SessionPerformance.tsx # Bar chart by session
│       ├── HourlyHeatmap.tsx      # 24-hour heatmap
│       ├── SessionClock.tsx       # Visual clock showing active sessions
│       ├── SessionRecommendations.tsx # AI-like recommendations
│       └── index.ts
└── lib/
    └── sessions.ts                # Session detection utilities
```

### 4.2 Session Dashboard Component

**File:** `src/components/sessions/SessionDashboard.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import { Clock, Globe, Sun, Moon, TrendingUp, TrendingDown } from "lucide-react";

import { SessionPerformance } from "./SessionPerformance";
import { HourlyHeatmap } from "./HourlyHeatmap";
import { SessionClock } from "./SessionClock";
import { SessionRecommendations } from "./SessionRecommendations";

interface SessionData {
  sessionStats: Array<{
    session: string;
    displayName: string;
    color: string;
    totalTrades: number;
    winRate: number;
    totalPnL: number;
    profitFactor: number;
  }>;
  hourlyStats: Array<{
    hour: number;
    hourLabel: string;
    totalTrades: number;
    winRate: number;
    totalPnL: number;
  }>;
  bestSession: string | null;
  worstSession: string | null;
  bestHour: number | null;
  worstHour: number | null;
  recommendations: string[];
}

export function SessionDashboard() {
  const [data, setData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        startDate: format(dateRange.start, "yyyy-MM-dd"),
        endDate: format(dateRange.end, "yyyy-MM-dd"),
      });

      const res = await fetch(`/api/analytics/sessions?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      
      const json = await res.json();
      setData(json);
    } catch (error) {
      toast.error("Failed to load session data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  if (isLoading) {
    return <SessionLoadingSkeleton />;
  }

  if (!data || data.sessionStats.length === 0) {
    return <SessionEmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Clock className="text-blue-500" />
            Session Analysis
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            When do you trade best?
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStatCard
          label="Best Session"
          value={data.bestSession ? data.sessionStats.find(s => s.session === data.bestSession)?.displayName || "" : "-"}
          icon={TrendingUp}
          color="text-green-500"
        />
        <QuickStatCard
          label="Worst Session"
          value={data.worstSession ? data.sessionStats.find(s => s.session === data.worstSession)?.displayName || "" : "-"}
          icon={TrendingDown}
          color="text-red-500"
        />
        <QuickStatCard
          label="Best Hour"
          value={data.bestHour !== null ? `${data.bestHour.toString().padStart(2, '0')}:00 UTC` : "-"}
          icon={Sun}
          color="text-yellow-500"
        />
        <QuickStatCard
          label="Worst Hour"
          value={data.worstHour !== null ? `${data.worstHour.toString().padStart(2, '0')}:00 UTC` : "-"}
          icon={Moon}
          color="text-gray-500"
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SessionPerformance data={data.sessionStats} />
        <SessionClock data={data.sessionStats} />
      </div>

      {/* Hourly Heatmap */}
      <HourlyHeatmap data={data.hourlyStats} />

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <SessionRecommendations recommendations={data.recommendations} />
      )}
    </div>
  );
}

function QuickStatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: any;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-[#0B0E14] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className={color} />
        <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">
          {label}
        </span>
      </div>
      <p className="text-lg font-bold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function SessionLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
      </div>
    </div>
  );
}

function SessionEmptyState() {
  return (
    <div className="text-center py-20">
      <Clock size={48} className="mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        No session data yet
      </h3>
      <p className="text-gray-500">
        Log trades with timestamps to see session analysis.
      </p>
    </div>
  );
}
```

### 4.3 Session Performance Chart

**File:** `src/components/sessions/SessionPerformance.tsx`

```typescript
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

interface SessionPerformanceProps {
  data: Array<{
    session: string;
    displayName: string;
    color: string;
    totalTrades: number;
    winRate: number;
    totalPnL: number;
    profitFactor: number;
  }>;
}

export function SessionPerformance({ data }: SessionPerformanceProps) {
  return (
    <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
      <h3 className="font-bold text-gray-900 dark:text-white mb-2">
        P&L by Session
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Total profit/loss for each trading session
      </p>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis 
              type="number"
              stroke="#9CA3AF"
              fontSize={12}
              tickFormatter={(value) => `$${value}`}
            />
            <YAxis 
              type="category"
              dataKey="displayName"
              stroke="#9CA3AF"
              fontSize={12}
              width={120}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "none",
                borderRadius: "12px",
              }}
              formatter={(value: number, name: string, props: any) => {
                const item = props.payload;
                return [
                  <div key="tooltip" className="space-y-1">
                    <p>P&L: ${value.toLocaleString()}</p>
                    <p>Win Rate: {item.winRate.toFixed(0)}%</p>
                    <p>Trades: {item.totalTrades}</p>
                    <p>PF: {item.profitFactor === Infinity ? "∞" : item.profitFactor.toFixed(2)}</p>
                  </div>,
                  "",
                ];
              }}
            />
            <Bar dataKey="totalPnL" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.totalPnL >= 0 ? "#00C888" : "#EF4444"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with session colors */}
      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        {data.map((session) => (
          <div key={session.session} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: session.color }}
            />
            <span className="text-xs text-gray-500">
              {session.displayName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4.4 Hourly Heatmap

**File:** `src/components/sessions/HourlyHeatmap.tsx`

```typescript
"use client";

interface HourlyHeatmapProps {
  data: Array<{
    hour: number;
    hourLabel: string;
    totalTrades: number;
    winRate: number;
    totalPnL: number;
  }>;
}

export function HourlyHeatmap({ data }: HourlyHeatmapProps) {
  // Create full 24-hour array
  const fullHours = Array.from({ length: 24 }, (_, i) => {
    const hourData = data.find(d => d.hour === i);
    return {
      hour: i,
      hourLabel: `${i.toString().padStart(2, '0')}:00`,
      totalTrades: hourData?.totalTrades || 0,
      winRate: hourData?.winRate || 0,
      totalPnL: hourData?.totalPnL || 0,
    };
  });

  // Find max values for color intensity
  const maxTrades = Math.max(...fullHours.map(h => h.totalTrades), 1);
  const maxPnL = Math.max(...fullHours.map(h => Math.abs(h.totalPnL)), 1);

  const getColor = (hour: typeof fullHours[0]) => {
    if (hour.totalTrades === 0) return "bg-gray-100 dark:bg-gray-800";
    
    const pnl = hour.totalPnL;
    const intensity = Math.min(Math.abs(pnl) / maxPnL, 1);
    
    if (pnl > 0) {
      if (intensity > 0.6) return "bg-green-500";
      if (intensity > 0.3) return "bg-green-400";
      return "bg-green-300 dark:bg-green-500/40";
    } else {
      if (intensity > 0.6) return "bg-red-500";
      if (intensity > 0.3) return "bg-red-400";
      return "bg-red-300 dark:bg-red-500/40";
    }
  };

  // Session time ranges for labels
  const sessionRanges = [
    { start: 0, end: 6, label: "Sydney/Tokyo", color: "#F59E0B" },
    { start: 7, end: 11, label: "London", color: "#3B82F6" },
    { start: 12, end: 15, label: "London/NY", color: "#8B5CF6" },
    { start: 16, end: 20, label: "New York", color: "#10B981" },
    { start: 21, end: 23, label: "Sydney", color: "#F59E0B" },
  ];

  return (
    <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
      <h3 className="font-bold text-gray-900 dark:text-white mb-2">
        24-Hour Trading Heatmap
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        P&L distribution across the day (UTC timezone)
      </p>

      {/* Heatmap Grid */}
      <div className="space-y-2">
        {/* Hour cells */}
        <div className="grid grid-cols-24 gap-1">
          {fullHours.map((hour) => (
            <div
              key={hour.hour}
              className={`
                aspect-square rounded-lg flex items-center justify-center
                text-[10px] font-bold cursor-pointer transition-all hover:scale-110
                ${getColor(hour)}
                ${hour.totalTrades === 0 ? 'text-gray-400' : 'text-white'}
              `}
              title={`${hour.hourLabel} UTC\nTrades: ${hour.totalTrades}\nWin Rate: ${hour.winRate.toFixed(0)}%\nP&L: $${hour.totalPnL.toFixed(0)}`}
            >
              {hour.totalTrades > 0 ? hour.totalTrades : ""}
            </div>
          ))}
        </div>

        {/* Hour labels */}
        <div className="grid grid-cols-24 gap-1">
          {fullHours.map((hour) => (
            <div
              key={hour.hour}
              className="text-center text-[8px] text-gray-400"
            >
              {hour.hour}
            </div>
          ))}
        </div>

        {/* Session indicators */}
        <div className="flex mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          {sessionRanges.map((range, index) => {
            const width = ((range.end - range.start + 1) / 24) * 100;
            const left = (range.start / 24) * 100;
            return (
              <div
                key={index}
                className="flex items-center justify-center text-[10px] font-bold text-white px-1 py-1 rounded"
                style={{
                  width: `${width}%`,
                  backgroundColor: range.color,
                }}
              >
                {range.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span className="text-xs text-gray-500">Profit</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span className="text-xs text-gray-500">Loss</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs text-gray-500">No trades</span>
        </div>
      </div>
    </div>
  );
}
```

### 4.5 Session Recommendations

**File:** `src/components/sessions/SessionRecommendations.tsx`

```typescript
"use client";

import { Lightbulb, AlertTriangle, TrendingUp } from "lucide-react";

interface SessionRecommendationsProps {
  recommendations: string[];
}

export function SessionRecommendations({ recommendations }: SessionRecommendationsProps) {
  return (
    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-200 dark:border-blue-500/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-500/20 rounded-xl">
          <Lightbulb size={20} className="text-blue-500" />
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white">
          Session Insights
        </h3>
      </div>

      <ul className="space-y-3">
        {recommendations.map((rec, index) => {
          const isPositive = rec.includes("Focus") || rec.includes("best");
          const isNegative = rec.includes("avoid") || rec.includes("worst");
          
          return (
            <li key={index} className="flex items-start gap-3">
              {isPositive ? (
                <TrendingUp size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              ) : isNegative ? (
                <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              ) : (
                <Lightbulb size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
              )}
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {rec}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

---

## 5. Navigation Update

**File:** `src/config/navigation.ts`

```typescript
// ADD import
import { Clock } from "lucide-react";

// Add to dashboardMenuItems
{ name: "Sessions", href: "/dashboard/sessions", icon: Clock },
```

---

## 6. Files Summary

### Files to CREATE:

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `src/app/api/analytics/sessions/route.ts` | Session analytics API |
| 2 | `src/app/dashboard/sessions/page.tsx` | Page wrapper |
| 3 | `src/components/sessions/SessionDashboard.tsx` | Main container |
| 4 | `src/components/sessions/SessionPerformance.tsx` | Bar chart |
| 5 | `src/components/sessions/HourlyHeatmap.tsx` | 24-hour heatmap |
| 6 | `src/components/sessions/SessionClock.tsx` | Visual clock |
| 7 | `src/components/sessions/SessionRecommendations.tsx` | Insights |
| 8 | `src/components/sessions/index.ts` | Exports |
| 9 | `src/lib/sessions.ts` | Session utilities |

### Files to MODIFY:

| # | File Path | Change |
|---|-----------|--------|
| 1 | `prisma/schema.prisma` | Add tradingSession field |
| 2 | `src/config/navigation.ts` | Add Sessions menu item |
| 3 | `src/app/api/journal/route.ts` | Auto-detect session on create |

### Optional Migration:

```bash
npx prisma migrate dev --name add_trading_session
npx prisma generate
```

---

*Document End - Ready for Implementation*
