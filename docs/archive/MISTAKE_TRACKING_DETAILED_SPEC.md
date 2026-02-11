# Mistake Tracking - Detailed Implementation Specification

> **Version:** 1.0  
> **Created:** February 3, 2026  
> **Purpose:** Track and analyze trading mistakes to improve performance  
> **Priority:** P3

---

## 1. Overview

### 1.1 Mục tiêu
Cho phép traders tag các mistakes phổ biến khi logging trades, sau đó phân tích patterns để tránh lặp lại.

### 1.2 User Stories
> "Tôi hay moved SL to breakeven quá sớm - cần track cái này"  
> "Tôi muốn biết mistake nào cost tôi nhiều tiền nhất"

### 1.3 Key Insight từ Research
- Edgewonk: "Trading mistakes" feature is most requested
- Top mistakes: Moving SL, early exit, overtrading, not following rules
- Knowing your mistakes = fixing them

### 1.4 Common Trading Mistakes (Predefined)

| Category | Mistakes |
|----------|----------|
| Entry | Entered too early, Entered too late, Chased price, FOMO entry |
| Exit | Exited too early, Exited too late, Moved SL, Trailed too tight |
| Position | Oversized, Undersized, Added to loser, Cut winner early |
| Psychology | Revenge trade, Fear exit, Greed hold, Impatient entry |
| Rules | Broke rules, Wrong timeframe, Wrong session, No confirmation |

---

## 2. Database Changes

### 2.1 Add Mistakes Field

```sql
-- Add mistakes column (JSON array of mistake codes)
ALTER TABLE journal_trades 
ADD COLUMN mistakes JSONB DEFAULT '[]'::jsonb;

-- Create GIN index for JSONB queries
CREATE INDEX idx_journal_trades_mistakes ON journal_trades USING GIN (mistakes);

-- Optional: Mistakes catalog table
CREATE TABLE IF NOT EXISTS mistake_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    severity VARCHAR(10) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default mistakes
INSERT INTO mistake_types (code, category, name, description, severity, is_default) VALUES
-- Entry mistakes
('ENTRY_EARLY', 'Entry', 'Entered Too Early', 'Did not wait for confirmation', 'medium', true),
('ENTRY_LATE', 'Entry', 'Entered Too Late', 'Missed optimal entry point', 'low', true),
('ENTRY_CHASED', 'Entry', 'Chased Price', 'Entered after price already moved', 'medium', true),
('ENTRY_FOMO', 'Entry', 'FOMO Entry', 'Fear of missing out entry', 'high', true),

-- Exit mistakes
('EXIT_EARLY', 'Exit', 'Exited Too Early', 'Closed position before target', 'medium', true),
('EXIT_LATE', 'Exit', 'Exited Too Late', 'Held position too long', 'medium', true),
('EXIT_MOVED_SL', 'Exit', 'Moved Stop Loss', 'Widened SL during trade', 'high', true),
('EXIT_TIGHT_TRAIL', 'Exit', 'Trailed Too Tight', 'Trailing SL was too close', 'low', true),

-- Position mistakes
('POS_OVERSIZE', 'Position', 'Oversized Position', 'Position too large for risk', 'high', true),
('POS_UNDERSIZE', 'Position', 'Undersized Position', 'Position too small', 'low', true),
('POS_ADD_LOSER', 'Position', 'Added to Loser', 'Averaged down on losing trade', 'high', true),
('POS_CUT_WINNER', 'Position', 'Cut Winner Early', 'Closed winning trade too soon', 'medium', true),

-- Psychology mistakes
('PSY_REVENGE', 'Psychology', 'Revenge Trade', 'Trading to recover losses', 'high', true),
('PSY_FEAR', 'Psychology', 'Fear Exit', 'Exited due to fear, not plan', 'medium', true),
('PSY_GREED', 'Psychology', 'Greed Hold', 'Held too long due to greed', 'medium', true),
('PSY_IMPATIENT', 'Psychology', 'Impatient Entry', 'Entered without waiting', 'medium', true),

-- Rule violations
('RULE_BROKE', 'Rules', 'Broke Trading Rules', 'Violated trading plan', 'high', true),
('RULE_TIMEFRAME', 'Rules', 'Wrong Timeframe', 'Used incorrect timeframe', 'medium', true),
('RULE_SESSION', 'Rules', 'Wrong Session', 'Traded outside planned session', 'low', true),
('RULE_NO_CONFIRM', 'Rules', 'No Confirmation', 'Entered without confirmation', 'medium', true);
```

### 2.2 Prisma Schema Update

**File:** `prisma/schema.prisma`

```prisma
model JournalTrade {
  // ... existing fields ...
  
  // NEW: Mistakes field (JSON array)
  mistakes      Json      @default("[]") @db.JsonB
  
  // ... existing relations ...
}

// Optional: Mistakes catalog
model MistakeType {
  id          String   @id @default(uuid()) @db.Uuid
  code        String   @unique @db.VarChar(50)
  category    String   @db.VarChar(50)
  name        String   @db.VarChar(100)
  description String?
  severity    String   @default("medium") @db.VarChar(10)
  isDefault   Boolean  @default(false) @map("is_default")
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("mistake_types")
}
```

---

## 3. Mistake Constants

**File:** `src/lib/mistakes.ts`

```typescript
export interface Mistake {
  code: string;
  category: string;
  name: string;
  description: string;
  severity: "low" | "medium" | "high";
  emoji: string;
}

export const MISTAKE_CATEGORIES = [
  "Entry",
  "Exit",
  "Position",
  "Psychology",
  "Rules",
] as const;

export const MISTAKES: Record<string, Mistake[]> = {
  Entry: [
    {
      code: "ENTRY_EARLY",
      category: "Entry",
      name: "Entered Too Early",
      description: "Did not wait for confirmation",
      severity: "medium",
      emoji: "⏰",
    },
    {
      code: "ENTRY_LATE",
      category: "Entry",
      name: "Entered Too Late",
      description: "Missed optimal entry point",
      severity: "low",
      emoji: "🐢",
    },
    {
      code: "ENTRY_CHASED",
      category: "Entry",
      name: "Chased Price",
      description: "Entered after price already moved",
      severity: "medium",
      emoji: "🏃",
    },
    {
      code: "ENTRY_FOMO",
      category: "Entry",
      name: "FOMO Entry",
      description: "Fear of missing out entry",
      severity: "high",
      emoji: "😱",
    },
  ],
  Exit: [
    {
      code: "EXIT_EARLY",
      category: "Exit",
      name: "Exited Too Early",
      description: "Closed position before target",
      severity: "medium",
      emoji: "🚪",
    },
    {
      code: "EXIT_LATE",
      category: "Exit",
      name: "Exited Too Late",
      description: "Held position too long",
      severity: "medium",
      emoji: "⏳",
    },
    {
      code: "EXIT_MOVED_SL",
      category: "Exit",
      name: "Moved Stop Loss",
      description: "Widened SL during trade",
      severity: "high",
      emoji: "🚫",
    },
    {
      code: "EXIT_TIGHT_TRAIL",
      category: "Exit",
      name: "Trailed Too Tight",
      description: "Trailing SL was too close",
      severity: "low",
      emoji: "📏",
    },
  ],
  Position: [
    {
      code: "POS_OVERSIZE",
      category: "Position",
      name: "Oversized Position",
      description: "Position too large for risk",
      severity: "high",
      emoji: "📈",
    },
    {
      code: "POS_UNDERSIZE",
      category: "Position",
      name: "Undersized Position",
      description: "Position too small",
      severity: "low",
      emoji: "📉",
    },
    {
      code: "POS_ADD_LOSER",
      category: "Position",
      name: "Added to Loser",
      description: "Averaged down on losing trade",
      severity: "high",
      emoji: "💸",
    },
    {
      code: "POS_CUT_WINNER",
      category: "Position",
      name: "Cut Winner Early",
      description: "Closed winning trade too soon",
      severity: "medium",
      emoji: "✂️",
    },
  ],
  Psychology: [
    {
      code: "PSY_REVENGE",
      category: "Psychology",
      name: "Revenge Trade",
      description: "Trading to recover losses",
      severity: "high",
      emoji: "😡",
    },
    {
      code: "PSY_FEAR",
      category: "Psychology",
      name: "Fear Exit",
      description: "Exited due to fear, not plan",
      severity: "medium",
      emoji: "😨",
    },
    {
      code: "PSY_GREED",
      category: "Psychology",
      name: "Greed Hold",
      description: "Held too long due to greed",
      severity: "medium",
      emoji: "🤑",
    },
    {
      code: "PSY_IMPATIENT",
      category: "Psychology",
      name: "Impatient Entry",
      description: "Entered without waiting",
      severity: "medium",
      emoji: "⚡",
    },
  ],
  Rules: [
    {
      code: "RULE_BROKE",
      category: "Rules",
      name: "Broke Trading Rules",
      description: "Violated trading plan",
      severity: "high",
      emoji: "❌",
    },
    {
      code: "RULE_TIMEFRAME",
      category: "Rules",
      name: "Wrong Timeframe",
      description: "Used incorrect timeframe",
      severity: "medium",
      emoji: "📊",
    },
    {
      code: "RULE_SESSION",
      category: "Rules",
      name: "Wrong Session",
      description: "Traded outside planned session",
      severity: "low",
      emoji: "🌙",
    },
    {
      code: "RULE_NO_CONFIRM",
      category: "Rules",
      name: "No Confirmation",
      description: "Entered without confirmation",
      severity: "medium",
      emoji: "❓",
    },
  ],
};

export const ALL_MISTAKES = Object.values(MISTAKES).flat();

export function getMistakeByCode(code: string): Mistake | undefined {
  return ALL_MISTAKES.find(m => m.code === code);
}

export function getMistakeSeverityColor(severity: string): string {
  switch (severity) {
    case "high": return "text-red-500 bg-red-50 dark:bg-red-500/10";
    case "medium": return "text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10";
    case "low": return "text-blue-500 bg-blue-50 dark:bg-blue-500/10";
    default: return "text-gray-500 bg-gray-50 dark:bg-gray-500/10";
  }
}
```

---

## 4. API Endpoints

### 4.1 Mistakes Analytics API

**File:** `src/app/api/analytics/mistakes/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, parseISO } from "date-fns";
import { getMistakeByCode } from "@/lib/mistakes";

interface MistakeStats {
  code: string;
  name: string;
  category: string;
  severity: string;
  emoji: string;
  count: number;
  totalPnL: number;
  avgPnL: number;
  winRate: number;
}

interface MistakeAnalytics {
  mistakeStats: MistakeStats[];
  totalMistakes: number;
  mostCostlyMistake: string | null;
  mostFrequentMistake: string | null;
  mistakesByCategory: Record<string, number>;
  tradesWithMistakes: number;
  tradesWithoutMistakes: number;
  cleanTradeWinRate: number;
  mistakeTradeWinRate: number;
  costOfMistakes: number;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const now = new Date();
    const startDate = startDateParam ? parseISO(startDateParam) : startOfMonth(now);
    const endDate = endDateParam ? parseISO(endDateParam) : endOfMonth(now);

    // Fetch closed trades
    const trades = await prisma.journalTrade.findMany({
      where: {
        userId: user.id,
        status: "CLOSED",
        entryDate: { gte: startDate, lte: endDate },
      },
      select: {
        id: true,
        pnl: true,
        result: true,
        mistakes: true,
      },
    });

    // Separate trades with and without mistakes
    const tradesWithMistakes = trades.filter(t => {
      const mistakes = t.mistakes as string[];
      return mistakes && mistakes.length > 0;
    });
    const tradesWithoutMistakes = trades.filter(t => {
      const mistakes = t.mistakes as string[];
      return !mistakes || mistakes.length === 0;
    });

    // Calculate win rates
    const cleanWins = tradesWithoutMistakes.filter(t => t.result === "WIN").length;
    const cleanTradeWinRate = tradesWithoutMistakes.length > 0
      ? (cleanWins / tradesWithoutMistakes.length) * 100
      : 0;

    const mistakeWins = tradesWithMistakes.filter(t => t.result === "WIN").length;
    const mistakeTradeWinRate = tradesWithMistakes.length > 0
      ? (mistakeWins / tradesWithMistakes.length) * 100
      : 0;

    // Aggregate mistakes
    const mistakeMap = new Map<string, {
      count: number;
      totalPnL: number;
      wins: number;
      losses: number;
    }>();

    for (const trade of tradesWithMistakes) {
      const mistakes = trade.mistakes as string[];
      const pnl = trade.pnl || 0;
      
      for (const code of mistakes) {
        const current = mistakeMap.get(code) || {
          count: 0, totalPnL: 0, wins: 0, losses: 0,
        };
        
        current.count++;
        current.totalPnL += pnl;
        
        if (trade.result === "WIN") current.wins++;
        if (trade.result === "LOSS") current.losses++;
        
        mistakeMap.set(code, current);
      }
    }

    // Build mistake stats
    const mistakeStats: MistakeStats[] = Array.from(mistakeMap.entries())
      .map(([code, data]) => {
        const mistake = getMistakeByCode(code);
        const total = data.wins + data.losses;
        
        return {
          code,
          name: mistake?.name || code,
          category: mistake?.category || "Other",
          severity: mistake?.severity || "medium",
          emoji: mistake?.emoji || "❓",
          count: data.count,
          totalPnL: data.totalPnL,
          avgPnL: total > 0 ? data.totalPnL / total : 0,
          winRate: total > 0 ? (data.wins / total) * 100 : 0,
        };
      })
      .sort((a, b) => a.totalPnL - b.totalPnL); // Sort by PnL (most costly first)

    // Aggregate by category
    const mistakesByCategory: Record<string, number> = {};
    for (const stat of mistakeStats) {
      mistakesByCategory[stat.category] = (mistakesByCategory[stat.category] || 0) + stat.count;
    }

    // Find most costly and frequent
    const mostCostlyMistake = mistakeStats.length > 0 ? mistakeStats[0].code : null;
    const mostFrequentMistake = mistakeStats.length > 0
      ? [...mistakeStats].sort((a, b) => b.count - a.count)[0].code
      : null;

    // Calculate total cost of mistakes
    const costOfMistakes = tradesWithMistakes.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalMistakes = Array.from(mistakeMap.values()).reduce((sum, m) => sum + m.count, 0);

    return NextResponse.json({
      mistakeStats,
      totalMistakes,
      mostCostlyMistake,
      mostFrequentMistake,
      mistakesByCategory,
      tradesWithMistakes: tradesWithMistakes.length,
      tradesWithoutMistakes: tradesWithoutMistakes.length,
      cleanTradeWinRate,
      mistakeTradeWinRate,
      costOfMistakes,
    });
  } catch (error) {
    console.error("Mistakes analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch mistake analytics" },
      { status: 500 }
    );
  }
}
```

---

## 5. Component Structure

### 5.1 File Tree

```
src/
├── app/
│   └── dashboard/
│       └── mistakes/
│           └── page.tsx           # Mistakes page
├── components/
│   └── mistakes/                  # NEW folder
│       ├── MistakeDashboard.tsx   # Main container
│       ├── MistakeSelector.tsx    # Multi-select for mistakes
│       ├── MistakeStats.tsx       # Stats cards
│       ├── MistakeCostChart.tsx   # Bar chart by cost
│       ├── MistakeFrequencyChart.tsx # Pie/bar chart by frequency
│       ├── MistakeByCategory.tsx  # Grouped view
│       ├── MistakeImpact.tsx      # Clean vs mistake trades
│       └── index.ts
└── lib/
    └── mistakes.ts                # Mistake constants
```

### 5.2 Mistake Selector Component

**File:** `src/components/mistakes/MistakeSelector.tsx`

```typescript
"use client";

import { useState } from "react";
import { X, ChevronDown, AlertTriangle } from "lucide-react";
import { MISTAKES, MISTAKE_CATEGORIES, getMistakeSeverityColor, Mistake } from "@/lib/mistakes";

interface MistakeSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
}

export function MistakeSelector({ value, onChange, label }: MistakeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>(MISTAKE_CATEGORIES[0]);

  const toggleMistake = (code: string) => {
    if (value.includes(code)) {
      onChange(value.filter(c => c !== code));
    } else {
      onChange([...value, code]);
    }
  };

  const removeMistake = (code: string) => {
    onChange(value.filter(c => c !== code));
  };

  const getMistakeByCode = (code: string): Mistake | undefined => {
    for (const category of Object.values(MISTAKES)) {
      const found = category.find(m => m.code === code);
      if (found) return found;
    }
    return undefined;
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <AlertTriangle size={14} className="text-yellow-500" />
          {label}
        </label>
      )}

      {/* Selected Mistakes */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map(code => {
            const mistake = getMistakeByCode(code);
            if (!mistake) return null;
            
            return (
              <span
                key={code}
                className={`
                  inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                  ${getMistakeSeverityColor(mistake.severity)}
                `}
              >
                <span>{mistake.emoji}</span>
                <span>{mistake.name}</span>
                <button
                  type="button"
                  onClick={() => removeMistake(code)}
                  className="hover:opacity-70"
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-left"
      >
        <span className="text-sm text-gray-500">
          {value.length === 0 ? "Select mistakes (if any)..." : `${value.length} mistake(s) selected`}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute z-20 left-0 right-0 mt-2 bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
            {/* Category Tabs */}
            <div className="flex border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
              {MISTAKE_CATEGORIES.map(category => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`
                    px-4 py-2.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors
                    ${activeCategory === category
                      ? "text-[#00C888] border-b-2 border-[#00C888]"
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    }
                  `}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Mistakes List */}
            <div className="p-2 max-h-60 overflow-y-auto">
              {MISTAKES[activeCategory]?.map(mistake => (
                <button
                  key={mistake.code}
                  type="button"
                  onClick={() => toggleMistake(mistake.code)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
                    ${value.includes(mistake.code)
                      ? "bg-[#00C888]/10 text-[#00C888]"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }
                  `}
                >
                  <span className="text-lg">{mistake.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {mistake.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {mistake.description}
                    </p>
                  </div>
                  <span
                    className={`
                      text-[10px] font-bold uppercase px-2 py-0.5 rounded
                      ${getMistakeSeverityColor(mistake.severity)}
                    `}
                  >
                    {mistake.severity}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

### 5.3 Mistake Dashboard Component

**File:** `src/components/mistakes/MistakeDashboard.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import { AlertTriangle, TrendingDown, CheckCircle, XCircle } from "lucide-react";

import { MistakeCostChart } from "./MistakeCostChart";
import { MistakeFrequencyChart } from "./MistakeFrequencyChart";
import { MistakeImpact } from "./MistakeImpact";
import { getMistakeByCode } from "@/lib/mistakes";

interface MistakeData {
  mistakeStats: Array<{
    code: string;
    name: string;
    category: string;
    severity: string;
    emoji: string;
    count: number;
    totalPnL: number;
    avgPnL: number;
    winRate: number;
  }>;
  totalMistakes: number;
  mostCostlyMistake: string | null;
  mostFrequentMistake: string | null;
  mistakesByCategory: Record<string, number>;
  tradesWithMistakes: number;
  tradesWithoutMistakes: number;
  cleanTradeWinRate: number;
  mistakeTradeWinRate: number;
  costOfMistakes: number;
}

export function MistakeDashboard() {
  const [data, setData] = useState<MistakeData | null>(null);
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

      const res = await fetch(`/api/analytics/mistakes?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      
      const json = await res.json();
      setData(json);
    } catch (error) {
      toast.error("Failed to load mistake data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  if (isLoading) {
    return <MistakeLoadingSkeleton />;
  }

  if (!data || data.mistakeStats.length === 0) {
    return <MistakeEmptyState />;
  }

  const mostCostly = data.mostCostlyMistake ? getMistakeByCode(data.mostCostlyMistake) : null;
  const mostFrequent = data.mostFrequentMistake ? getMistakeByCode(data.mostFrequentMistake) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <AlertTriangle className="text-yellow-500" />
            Mistake Analysis
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Learn from your trading mistakes
          </p>
        </div>
      </div>

      {/* Cost of Mistakes Banner */}
      {data.costOfMistakes < 0 && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl">
              <TrendingDown size={24} className="text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-red-700 dark:text-red-400">
                Cost of Mistakes
              </h3>
              <p className="text-2xl font-black text-red-500">
                ${Math.abs(data.costOfMistakes).toLocaleString()}
              </p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                Lost due to {data.totalMistakes} mistakes in {data.tradesWithMistakes} trades
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Most Costly"
          value={mostCostly?.name || "-"}
          subValue={mostCostly?.emoji}
          icon={TrendingDown}
          color="text-red-500"
        />
        <StatCard
          label="Most Frequent"
          value={mostFrequent?.name || "-"}
          subValue={mostFrequent?.emoji}
          icon={AlertTriangle}
          color="text-yellow-500"
        />
        <StatCard
          label="Clean Win Rate"
          value={`${data.cleanTradeWinRate.toFixed(0)}%`}
          subValue={`${data.tradesWithoutMistakes} trades`}
          icon={CheckCircle}
          color="text-green-500"
        />
        <StatCard
          label="Mistake Win Rate"
          value={`${data.mistakeTradeWinRate.toFixed(0)}%`}
          subValue={`${data.tradesWithMistakes} trades`}
          icon={XCircle}
          color="text-red-500"
        />
      </div>

      {/* Win Rate Comparison */}
      {data.cleanTradeWinRate > data.mistakeTradeWinRate && (
        <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-4 border border-green-200 dark:border-green-500/20">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            💡 <span className="font-bold">Insight:</span> Your win rate drops by{" "}
            <span className="font-bold text-red-500">
              {(data.cleanTradeWinRate - data.mistakeTradeWinRate).toFixed(0)}%
            </span>{" "}
            when you make mistakes. Focus on trading clean!
          </p>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MistakeCostChart data={data.mistakeStats} />
        <MistakeFrequencyChart data={data.mistakeStats} />
      </div>

      {/* Impact Comparison */}
      <MistakeImpact
        cleanTrades={data.tradesWithoutMistakes}
        cleanWinRate={data.cleanTradeWinRate}
        mistakeTrades={data.tradesWithMistakes}
        mistakeWinRate={data.mistakeTradeWinRate}
        costOfMistakes={data.costOfMistakes}
      />

      {/* Detailed Mistake List */}
      <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">
          All Mistakes (Sorted by Cost)
        </h3>
        
        <div className="space-y-3">
          {data.mistakeStats.map((mistake) => (
            <div
              key={mistake.code}
              className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl"
            >
              <span className="text-2xl">{mistake.emoji}</span>
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-white">
                  {mistake.name}
                </p>
                <p className="text-xs text-gray-400">
                  {mistake.category} • {mistake.count} occurrences
                </p>
              </div>
              <div className="text-right">
                <p className={`font-bold ${mistake.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {mistake.totalPnL >= 0 ? '+' : ''}${mistake.totalPnL.toFixed(0)}
                </p>
                <p className="text-xs text-gray-400">
                  {mistake.winRate.toFixed(0)}% win rate
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  subValue?: string;
  icon: any;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-[#0B0E14] p-4 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={color} />
        <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">
          {label}
        </span>
      </div>
      <p className="text-lg font-bold text-gray-900 dark:text-white">
        {subValue && <span className="mr-1">{subValue}</span>}
        {value}
      </p>
    </div>
  );
}

function MistakeLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64" />
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function MistakeEmptyState() {
  return (
    <div className="text-center py-20">
      <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        No mistakes recorded! 🎉
      </h3>
      <p className="text-gray-500">
        Either you're trading perfectly, or you haven't logged any mistakes yet.
      </p>
    </div>
  );
}
```

### 5.4 Mistake Cost Chart

**File:** `src/components/mistakes/MistakeCostChart.tsx`

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

interface MistakeCostChartProps {
  data: Array<{
    code: string;
    name: string;
    emoji: string;
    totalPnL: number;
    count: number;
  }>;
}

export function MistakeCostChart({ data }: MistakeCostChartProps) {
  // Take top 8 by absolute cost
  const chartData = [...data]
    .sort((a, b) => a.totalPnL - b.totalPnL) // Most negative first
    .slice(0, 8)
    .map(d => ({
      ...d,
      label: `${d.emoji} ${d.name.split(' ')[0]}`,
    }));

  return (
    <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
      <h3 className="font-bold text-gray-900 dark:text-white mb-2">
        Cost by Mistake Type
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Which mistakes cost you the most?
      </p>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis 
              type="number"
              stroke="#9CA3AF"
              fontSize={12}
              tickFormatter={(value) => `$${value}`}
            />
            <YAxis 
              type="category"
              dataKey="label"
              stroke="#9CA3AF"
              fontSize={11}
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "none",
                borderRadius: "12px",
              }}
              formatter={(value: number, name: string, props: any) => [
                `$${value.toLocaleString()}`,
                "Total P&L",
              ]}
              labelFormatter={(label) => {
                const item = chartData.find(d => d.label === label);
                return `${item?.name} (${item?.count} times)`;
              }}
            />
            <Bar dataKey="totalPnL" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.totalPnL >= 0 ? "#00C888" : "#EF4444"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

---

## 6. Update JournalForm

**File:** `src/components/journal/JournalForm.tsx`

Add mistakes section:

```typescript
// Import
import { MistakeSelector } from "@/components/mistakes/MistakeSelector";

// Add to form state
const [formData, setFormData] = useState({
  // ... existing fields ...
  mistakes: [] as string[],
});

// Add to form JSX (after psychology section or notes)
<div className="border-t border-gray-100 dark:border-gray-800 pt-6 mt-6">
  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
    <AlertTriangle size={20} className="text-yellow-500" />
    Mistakes (Optional)
  </h3>
  
  <MistakeSelector
    value={formData.mistakes}
    onChange={(mistakes) => setFormData({ ...formData, mistakes })}
    label="Did you make any mistakes on this trade?"
  />
</div>
```

---

## 7. Navigation Update

**File:** `src/config/navigation.ts`

```typescript
// ADD import
import { AlertTriangle } from "lucide-react";

// Add to dashboardMenuItems
{ name: "Mistakes", href: "/dashboard/mistakes", icon: AlertTriangle },
```

---

## 8. Files Summary

### Files to CREATE:

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `src/lib/mistakes.ts` | Mistake constants |
| 2 | `src/app/api/analytics/mistakes/route.ts` | Analytics API |
| 3 | `src/app/dashboard/mistakes/page.tsx` | Page wrapper |
| 4 | `src/components/mistakes/MistakeDashboard.tsx` | Main container |
| 5 | `src/components/mistakes/MistakeSelector.tsx` | Multi-select |
| 6 | `src/components/mistakes/MistakeCostChart.tsx` | Bar chart |
| 7 | `src/components/mistakes/MistakeFrequencyChart.tsx` | Pie chart |
| 8 | `src/components/mistakes/MistakeImpact.tsx` | Comparison |
| 9 | `src/components/mistakes/index.ts` | Exports |

### Files to MODIFY:

| # | File Path | Change |
|---|-----------|--------|
| 1 | `prisma/schema.prisma` | Add mistakes JSON field |
| 2 | `src/config/navigation.ts` | Add Mistakes menu item |
| 3 | `src/components/journal/JournalForm.tsx` | Add MistakeSelector |
| 4 | `src/app/api/journal/route.ts` | Handle mistakes field |

### Migration:

```bash
npx prisma migrate dev --name add_mistakes_field
npx prisma generate
```

---

## 9. Test Cases

### 9.1 Unit Tests - Mistake Utilities

**File:** `src/lib/mistakes.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import {
  getMistakeByCode,
  getMistakeSeverityColor,
  ALL_MISTAKES,
  MISTAKES,
  MISTAKE_CATEGORIES,
} from "./mistakes";

describe("Mistake Constants", () => {
  it("should have 5 mistake categories", () => {
    expect(MISTAKE_CATEGORIES).toHaveLength(5);
    expect(MISTAKE_CATEGORIES).toContain("Entry");
    expect(MISTAKE_CATEGORIES).toContain("Exit");
    expect(MISTAKE_CATEGORIES).toContain("Position");
    expect(MISTAKE_CATEGORIES).toContain("Psychology");
    expect(MISTAKE_CATEGORIES).toContain("Rules");
  });

  it("should have 4 mistakes per category", () => {
    for (const category of MISTAKE_CATEGORIES) {
      expect(MISTAKES[category]).toHaveLength(4);
    }
  });

  it("should have 20 total mistakes", () => {
    expect(ALL_MISTAKES).toHaveLength(20);
  });

  it("each mistake should have required properties", () => {
    for (const mistake of ALL_MISTAKES) {
      expect(mistake).toHaveProperty("code");
      expect(mistake).toHaveProperty("category");
      expect(mistake).toHaveProperty("name");
      expect(mistake).toHaveProperty("description");
      expect(mistake).toHaveProperty("severity");
      expect(mistake).toHaveProperty("emoji");
    }
  });

  it("each mistake code should be unique", () => {
    const codes = ALL_MISTAKES.map((m) => m.code);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });
});

describe("getMistakeByCode", () => {
  it("should return correct mistake for valid code", () => {
    const mistake = getMistakeByCode("ENTRY_FOMO");
    expect(mistake).toBeDefined();
    expect(mistake?.name).toBe("FOMO Entry");
    expect(mistake?.category).toBe("Entry");
    expect(mistake?.severity).toBe("high");
  });

  it("should return undefined for invalid code", () => {
    const mistake = getMistakeByCode("INVALID_CODE");
    expect(mistake).toBeUndefined();
  });

  it("should find psychology mistakes", () => {
    const revenge = getMistakeByCode("PSY_REVENGE");
    expect(revenge?.name).toBe("Revenge Trade");
    expect(revenge?.severity).toBe("high");
  });
});

describe("getMistakeSeverityColor", () => {
  it("should return red colors for high severity", () => {
    const color = getMistakeSeverityColor("high");
    expect(color).toContain("red");
  });

  it("should return yellow colors for medium severity", () => {
    const color = getMistakeSeverityColor("medium");
    expect(color).toContain("yellow");
  });

  it("should return blue colors for low severity", () => {
    const color = getMistakeSeverityColor("low");
    expect(color).toContain("blue");
  });

  it("should return gray for unknown severity", () => {
    const color = getMistakeSeverityColor("unknown");
    expect(color).toContain("gray");
  });
});
```

### 9.2 API Tests - Mistakes Analytics

**File:** `src/app/api/analytics/mistakes/route.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock data
const mockTrades = [
  {
    id: "1",
    pnl: -100,
    result: "LOSS",
    mistakes: ["ENTRY_FOMO", "PSY_REVENGE"],
  },
  {
    id: "2",
    pnl: 200,
    result: "WIN",
    mistakes: ["EXIT_EARLY"],
  },
  {
    id: "3",
    pnl: 150,
    result: "WIN",
    mistakes: [],
  },
  {
    id: "4",
    pnl: -50,
    result: "LOSS",
    mistakes: ["ENTRY_FOMO"],
  },
];

describe("Mistake Analytics Calculations", () => {
  it("should separate trades with and without mistakes", () => {
    const withMistakes = mockTrades.filter(
      (t) => t.mistakes && t.mistakes.length > 0
    );
    const withoutMistakes = mockTrades.filter(
      (t) => !t.mistakes || t.mistakes.length === 0
    );

    expect(withMistakes).toHaveLength(3);
    expect(withoutMistakes).toHaveLength(1);
  });

  it("should calculate clean trade win rate", () => {
    const cleanTrades = mockTrades.filter(
      (t) => !t.mistakes || t.mistakes.length === 0
    );
    const cleanWins = cleanTrades.filter((t) => t.result === "WIN");
    const winRate =
      cleanTrades.length > 0 ? (cleanWins.length / cleanTrades.length) * 100 : 0;

    expect(winRate).toBe(100); // 1 clean trade, 1 win
  });

  it("should calculate mistake trade win rate", () => {
    const mistakeTrades = mockTrades.filter(
      (t) => t.mistakes && t.mistakes.length > 0
    );
    const mistakeWins = mistakeTrades.filter((t) => t.result === "WIN");
    const winRate =
      mistakeTrades.length > 0
        ? (mistakeWins.length / mistakeTrades.length) * 100
        : 0;

    expect(winRate).toBeCloseTo(33.33, 1); // 1 win out of 3 trades
  });

  it("should count mistake occurrences correctly", () => {
    const mistakeCount = new Map<string, number>();

    for (const trade of mockTrades) {
      for (const code of trade.mistakes) {
        mistakeCount.set(code, (mistakeCount.get(code) || 0) + 1);
      }
    }

    expect(mistakeCount.get("ENTRY_FOMO")).toBe(2);
    expect(mistakeCount.get("PSY_REVENGE")).toBe(1);
    expect(mistakeCount.get("EXIT_EARLY")).toBe(1);
  });

  it("should calculate cost per mistake", () => {
    const mistakePnL = new Map<string, number>();

    for (const trade of mockTrades) {
      for (const code of trade.mistakes) {
        mistakePnL.set(code, (mistakePnL.get(code) || 0) + trade.pnl);
      }
    }

    // ENTRY_FOMO: -100 + -50 = -150
    expect(mistakePnL.get("ENTRY_FOMO")).toBe(-150);
    // PSY_REVENGE: -100
    expect(mistakePnL.get("PSY_REVENGE")).toBe(-100);
    // EXIT_EARLY: +200
    expect(mistakePnL.get("EXIT_EARLY")).toBe(200);
  });

  it("should calculate total cost of mistakes", () => {
    const tradesWithMistakes = mockTrades.filter(
      (t) => t.mistakes && t.mistakes.length > 0
    );
    const totalCost = tradesWithMistakes.reduce((sum, t) => sum + t.pnl, 0);

    // -100 + 200 + -50 = 50
    expect(totalCost).toBe(50);
  });

  it("should identify most frequent mistake", () => {
    const mistakeCount = new Map<string, number>();

    for (const trade of mockTrades) {
      for (const code of trade.mistakes) {
        mistakeCount.set(code, (mistakeCount.get(code) || 0) + 1);
      }
    }

    const sorted = Array.from(mistakeCount.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    const mostFrequent = sorted[0]?.[0];

    expect(mostFrequent).toBe("ENTRY_FOMO");
  });

  it("should identify most costly mistake", () => {
    const mistakePnL = new Map<string, number>();

    for (const trade of mockTrades) {
      for (const code of trade.mistakes) {
        mistakePnL.set(code, (mistakePnL.get(code) || 0) + trade.pnl);
      }
    }

    const sorted = Array.from(mistakePnL.entries()).sort((a, b) => a[1] - b[1]);
    const mostCostly = sorted[0]?.[0];

    expect(mostCostly).toBe("ENTRY_FOMO"); // -150 is most negative
  });
});

describe("Mistake Analytics Edge Cases", () => {
  it("should handle empty trades array", () => {
    const trades: typeof mockTrades = [];
    const withMistakes = trades.filter(
      (t) => t.mistakes && t.mistakes.length > 0
    );

    expect(withMistakes).toHaveLength(0);
  });

  it("should handle trades with no mistakes", () => {
    const trades = [
      { id: "1", pnl: 100, result: "WIN", mistakes: [] },
      { id: "2", pnl: 50, result: "WIN", mistakes: [] },
    ];

    const cleanWinRate = 100;
    const mistakeWinRate = 0;
    const totalMistakes = 0;

    expect(cleanWinRate).toBe(100);
    expect(mistakeWinRate).toBe(0);
    expect(totalMistakes).toBe(0);
  });

  it("should handle null mistakes field", () => {
    const trade = { id: "1", pnl: 100, result: "WIN", mistakes: null as any };
    const hasMistakes = trade.mistakes && trade.mistakes.length > 0;

    expect(hasMistakes).toBeFalsy();
  });
});
```

### 9.3 Component Tests - MistakeSelector

**File:** `src/components/mistakes/MistakeSelector.test.tsx`

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MistakeSelector } from "./MistakeSelector";

describe("MistakeSelector", () => {
  it("should render with empty value", () => {
    const onChange = vi.fn();
    render(<MistakeSelector value={[]} onChange={onChange} />);

    expect(screen.getByText(/select mistakes/i)).toBeInTheDocument();
  });

  it("should show selected mistake count", () => {
    const onChange = vi.fn();
    render(
      <MistakeSelector
        value={["ENTRY_FOMO", "PSY_REVENGE"]}
        onChange={onChange}
      />
    );

    expect(screen.getByText(/2 mistake\(s\) selected/i)).toBeInTheDocument();
  });

  it("should display selected mistakes as chips", () => {
    const onChange = vi.fn();
    render(
      <MistakeSelector value={["ENTRY_FOMO"]} onChange={onChange} />
    );

    expect(screen.getByText(/FOMO Entry/i)).toBeInTheDocument();
  });

  it("should open dropdown on click", () => {
    const onChange = vi.fn();
    render(<MistakeSelector value={[]} onChange={onChange} />);

    const trigger = screen.getByText(/select mistakes/i);
    fireEvent.click(trigger);

    // Should show category tabs
    expect(screen.getByText("Entry")).toBeInTheDocument();
    expect(screen.getByText("Exit")).toBeInTheDocument();
  });

  it("should add mistake when clicked", () => {
    const onChange = vi.fn();
    render(<MistakeSelector value={[]} onChange={onChange} />);

    // Open dropdown
    fireEvent.click(screen.getByText(/select mistakes/i));

    // Click on a mistake
    const fomoButton = screen.getByText("FOMO Entry");
    fireEvent.click(fomoButton);

    expect(onChange).toHaveBeenCalledWith(["ENTRY_FOMO"]);
  });

  it("should remove mistake when X clicked", () => {
    const onChange = vi.fn();
    render(
      <MistakeSelector value={["ENTRY_FOMO"]} onChange={onChange} />
    );

    // Find and click remove button
    const chip = screen.getByText(/FOMO Entry/i).closest("span");
    const removeButton = chip?.querySelector("button");
    if (removeButton) {
      fireEvent.click(removeButton);
    }

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("should toggle mistake selection", () => {
    const onChange = vi.fn();
    render(
      <MistakeSelector value={["ENTRY_FOMO"]} onChange={onChange} />
    );

    // Open dropdown
    fireEvent.click(screen.getByText(/1 mistake\(s\) selected/i));

    // Click on already selected mistake
    fireEvent.click(screen.getByText("FOMO Entry"));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("should switch categories", () => {
    const onChange = vi.fn();
    render(<MistakeSelector value={[]} onChange={onChange} />);

    // Open dropdown
    fireEvent.click(screen.getByText(/select mistakes/i));

    // Switch to Psychology tab
    fireEvent.click(screen.getByText("Psychology"));

    // Should show psychology mistakes
    expect(screen.getByText("Revenge Trade")).toBeInTheDocument();
    expect(screen.getByText("Fear Exit")).toBeInTheDocument();
  });

  it("should display severity badges", () => {
    const onChange = vi.fn();
    render(<MistakeSelector value={[]} onChange={onChange} />);

    // Open dropdown
    fireEvent.click(screen.getByText(/select mistakes/i));

    // Should show severity badges
    expect(screen.getAllByText("high").length).toBeGreaterThan(0);
    expect(screen.getAllByText("medium").length).toBeGreaterThan(0);
  });

  it("should show label when provided", () => {
    const onChange = vi.fn();
    render(
      <MistakeSelector
        value={[]}
        onChange={onChange}
        label="Trading Mistakes"
      />
    );

    expect(screen.getByText("Trading Mistakes")).toBeInTheDocument();
  });
});
```

### 9.4 Integration Tests

**File:** `tests/mistakes/integration.test.ts`

```typescript
import { describe, it, expect } from "vitest";

describe("Mistake Tracking Integration", () => {
  describe("Journal Entry with Mistakes", () => {
    it("should save trade with multiple mistakes", async () => {
      const tradeData = {
        symbol: "EURUSD",
        type: "BUY",
        entryPrice: 1.1,
        exitPrice: 1.095,
        pnl: -50,
        result: "LOSS",
        mistakes: ["ENTRY_FOMO", "EXIT_MOVED_SL"],
      };

      // Simulate API call
      expect(tradeData.mistakes).toHaveLength(2);
      expect(tradeData.mistakes).toContain("ENTRY_FOMO");
      expect(tradeData.mistakes).toContain("EXIT_MOVED_SL");
    });

    it("should save trade with no mistakes", async () => {
      const tradeData = {
        symbol: "GBPUSD",
        type: "SELL",
        pnl: 100,
        result: "WIN",
        mistakes: [],
      };

      expect(tradeData.mistakes).toHaveLength(0);
    });
  });

  describe("Mistake Analytics Dashboard", () => {
    const mockAnalytics = {
      mistakeStats: [
        { code: "ENTRY_FOMO", name: "FOMO Entry", count: 5, totalPnL: -250 },
        { code: "PSY_REVENGE", name: "Revenge Trade", count: 3, totalPnL: -180 },
        { code: "EXIT_EARLY", name: "Exited Too Early", count: 4, totalPnL: -80 },
      ],
      totalMistakes: 12,
      tradesWithMistakes: 8,
      tradesWithoutMistakes: 42,
      cleanTradeWinRate: 68,
      mistakeTradeWinRate: 25,
      costOfMistakes: -510,
    };

    it("should show win rate difference", () => {
      const difference =
        mockAnalytics.cleanTradeWinRate - mockAnalytics.mistakeTradeWinRate;

      expect(difference).toBe(43); // 68% - 25% = 43% drop
    });

    it("should calculate average cost per mistake", () => {
      const avgCost =
        mockAnalytics.costOfMistakes / mockAnalytics.totalMistakes;

      expect(avgCost).toBeCloseTo(-42.5);
    });

    it("should identify most impactful mistakes", () => {
      const sorted = [...mockAnalytics.mistakeStats].sort(
        (a, b) => a.totalPnL - b.totalPnL
      );

      expect(sorted[0].code).toBe("ENTRY_FOMO"); // -250
      expect(sorted[1].code).toBe("PSY_REVENGE"); // -180
    });

    it("should calculate mistake percentage of trades", () => {
      const total =
        mockAnalytics.tradesWithMistakes + mockAnalytics.tradesWithoutMistakes;
      const mistakePercent = (mockAnalytics.tradesWithMistakes / total) * 100;

      expect(mistakePercent).toBe(16); // 8/50 = 16%
    });
  });
});
```

---

## 10. Test Commands

```bash
# Run all mistake tests
pnpm test src/lib/mistakes.test.ts
pnpm test src/app/api/analytics/mistakes
pnpm test src/components/mistakes

# Run with coverage
pnpm test --coverage --include="**/mistakes/**"

# Run specific test file
pnpm vitest run src/lib/mistakes.test.ts
```

---

*Document End - Ready for Implementation*
