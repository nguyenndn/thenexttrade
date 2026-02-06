# Psychology & Emotion Tracking - Detailed Implementation Specification

> **Version:** 1.0  
> **Created:** February 3, 2026  
> **Purpose:** Track trader emotions and identify psychological patterns  
> **Inspired By:** Edgewonk Psychology Tracking

---

## 1. Overview

### 1.1 Mục tiêu
Cho phép traders ghi lại cảm xúc trước/sau trade, identify patterns giữa emotional state và trading performance.

### 1.2 User Stories
> "Tôi muốn biết khi nào tôi trade tốt nhất - lúc confident hay lúc calm?"  
> "Tôi hay revenge trade sau khi thua liên tiếp - cần tool để nhận biết pattern này"

### 1.3 Key Insight từ Research
- Traders on Reddit: "I blow accounts when I'm frustrated"
- Edgewonk: Tracks emotions per trade, shows correlation with results
- Top request: Identify "tilt" (emotional trading) patterns

---

## 2. Database Changes

### 2.1 Add Emotion Fields to Journal Trades

**Migration SQL:**

```sql
-- Add emotion columns to journal_trades
ALTER TABLE journal_trades 
ADD COLUMN emotion_before VARCHAR(50) DEFAULT NULL,
ADD COLUMN emotion_after VARCHAR(50) DEFAULT NULL,
ADD COLUMN confidence_level INTEGER DEFAULT NULL CHECK (confidence_level >= 1 AND confidence_level <= 5),
ADD COLUMN followed_plan BOOLEAN DEFAULT NULL,
ADD COLUMN notes_psychology TEXT DEFAULT NULL;

-- Create index for queries
CREATE INDEX idx_journal_trades_emotion_before ON journal_trades(emotion_before);
CREATE INDEX idx_journal_trades_emotion_after ON journal_trades(emotion_after);
CREATE INDEX idx_journal_trades_followed_plan ON journal_trades(followed_plan);
```

### 2.2 Prisma Schema Update

**File:** `prisma/schema.prisma`

```prisma
model JournalTrade {
  // ... existing fields ...
  
  // NEW: Psychology fields
  emotionBefore     String?   @map("emotion_before") @db.VarChar(50)
  emotionAfter      String?   @map("emotion_after") @db.VarChar(50)
  confidenceLevel   Int?      @map("confidence_level")
  followedPlan      Boolean?  @map("followed_plan")
  notesPsychology   String?   @map("notes_psychology")
  
  // ... existing relations ...
}
```

### 2.3 Emotion Options

Predefined emotions for consistent tracking:

```typescript
export const EMOTIONS = {
  positive: [
    { value: "confident", label: "Confident", emoji: "😎" },
    { value: "calm", label: "Calm", emoji: "😌" },
    { value: "focused", label: "Focused", emoji: "🎯" },
    { value: "patient", label: "Patient", emoji: "⏳" },
    { value: "excited", label: "Excited", emoji: "🤩" },
  ],
  negative: [
    { value: "anxious", label: "Anxious", emoji: "😰" },
    { value: "fearful", label: "Fearful", emoji: "😨" },
    { value: "greedy", label: "Greedy", emoji: "🤑" },
    { value: "frustrated", label: "Frustrated", emoji: "😤" },
    { value: "impatient", label: "Impatient", emoji: "⏰" },
    { value: "revenge", label: "Revenge", emoji: "😡" },
    { value: "fomo", label: "FOMO", emoji: "🏃" },
    { value: "overconfident", label: "Overconfident", emoji: "🦸" },
  ],
  neutral: [
    { value: "neutral", label: "Neutral", emoji: "😐" },
    { value: "tired", label: "Tired", emoji: "😴" },
    { value: "uncertain", label: "Uncertain", emoji: "🤷" },
  ],
} as const;

export const ALL_EMOTIONS = [
  ...EMOTIONS.positive,
  ...EMOTIONS.negative,
  ...EMOTIONS.neutral,
];
```

---

## 3. API Endpoints

### 3.1 Psychology Analytics API

**File:** `src/app/api/analytics/psychology/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, parseISO } from "date-fns";

interface EmotionStats {
  emotion: string;
  totalTrades: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  totalPnL: number;
  avgPnL: number;
}

interface PsychologyAnalytics {
  emotionBeforeStats: EmotionStats[];
  emotionAfterStats: EmotionStats[];
  confidenceCorrelation: {
    level: number;
    winRate: number;
    avgPnL: number;
    tradeCount: number;
  }[];
  planAdherenceStats: {
    followed: { count: number; winRate: number; totalPnL: number };
    notFollowed: { count: number; winRate: number; totalPnL: number };
  };
  tiltIndicators: {
    revengeTradeCount: number;
    fomoTradeCount: number;
    avgPnLAfterLoss: number;
    avgPnLAfterWin: number;
  };
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

    // Fetch closed trades with psychology data
    const trades = await prisma.journalTrade.findMany({
      where: {
        userId: user.id,
        status: "CLOSED",
        entryDate: { gte: startDate, lte: endDate },
      },
      orderBy: { entryDate: "asc" },
      select: {
        id: true,
        pnl: true,
        result: true,
        emotionBefore: true,
        emotionAfter: true,
        confidenceLevel: true,
        followedPlan: true,
      },
    });

    // Calculate emotion before stats
    const emotionBeforeMap = new Map<string, { wins: number; losses: number; pnl: number }>();
    for (const trade of trades) {
      if (!trade.emotionBefore) continue;
      const current = emotionBeforeMap.get(trade.emotionBefore) || { wins: 0, losses: 0, pnl: 0 };
      current.pnl += trade.pnl || 0;
      if (trade.result === "WIN") current.wins++;
      if (trade.result === "LOSS") current.losses++;
      emotionBeforeMap.set(trade.emotionBefore, current);
    }

    const emotionBeforeStats: EmotionStats[] = Array.from(emotionBeforeMap.entries())
      .map(([emotion, data]) => {
        const total = data.wins + data.losses;
        return {
          emotion,
          totalTrades: total,
          winCount: data.wins,
          lossCount: data.losses,
          winRate: total > 0 ? (data.wins / total) * 100 : 0,
          totalPnL: data.pnl,
          avgPnL: total > 0 ? data.pnl / total : 0,
        };
      })
      .sort((a, b) => b.winRate - a.winRate);

    // Calculate emotion after stats (similar logic)
    const emotionAfterMap = new Map<string, { wins: number; losses: number; pnl: number }>();
    for (const trade of trades) {
      if (!trade.emotionAfter) continue;
      const current = emotionAfterMap.get(trade.emotionAfter) || { wins: 0, losses: 0, pnl: 0 };
      current.pnl += trade.pnl || 0;
      if (trade.result === "WIN") current.wins++;
      if (trade.result === "LOSS") current.losses++;
      emotionAfterMap.set(trade.emotionAfter, current);
    }

    const emotionAfterStats: EmotionStats[] = Array.from(emotionAfterMap.entries())
      .map(([emotion, data]) => {
        const total = data.wins + data.losses;
        return {
          emotion,
          totalTrades: total,
          winCount: data.wins,
          lossCount: data.losses,
          winRate: total > 0 ? (data.wins / total) * 100 : 0,
          totalPnL: data.pnl,
          avgPnL: total > 0 ? data.pnl / total : 0,
        };
      });

    // Confidence level correlation
    const confidenceMap = new Map<number, { wins: number; total: number; pnl: number }>();
    for (const trade of trades) {
      if (trade.confidenceLevel === null) continue;
      const current = confidenceMap.get(trade.confidenceLevel) || { wins: 0, total: 0, pnl: 0 };
      current.total++;
      current.pnl += trade.pnl || 0;
      if (trade.result === "WIN") current.wins++;
      confidenceMap.set(trade.confidenceLevel, current);
    }

    const confidenceCorrelation = Array.from(confidenceMap.entries())
      .map(([level, data]) => ({
        level,
        winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
        avgPnL: data.total > 0 ? data.pnl / data.total : 0,
        tradeCount: data.total,
      }))
      .sort((a, b) => a.level - b.level);

    // Plan adherence stats
    const followed = trades.filter(t => t.followedPlan === true);
    const notFollowed = trades.filter(t => t.followedPlan === false);

    const planAdherenceStats = {
      followed: {
        count: followed.length,
        winRate: followed.length > 0 
          ? (followed.filter(t => t.result === "WIN").length / followed.length) * 100 
          : 0,
        totalPnL: followed.reduce((sum, t) => sum + (t.pnl || 0), 0),
      },
      notFollowed: {
        count: notFollowed.length,
        winRate: notFollowed.length > 0 
          ? (notFollowed.filter(t => t.result === "WIN").length / notFollowed.length) * 100 
          : 0,
        totalPnL: notFollowed.reduce((sum, t) => sum + (t.pnl || 0), 0),
      },
    };

    // Tilt indicators
    const revengeTrades = trades.filter(t => t.emotionBefore === "revenge");
    const fomoTrades = trades.filter(t => t.emotionBefore === "fomo");

    // Calculate avg PnL after previous trade result
    let afterLossPnL = 0;
    let afterLossCount = 0;
    let afterWinPnL = 0;
    let afterWinCount = 0;

    for (let i = 1; i < trades.length; i++) {
      const prevTrade = trades[i - 1];
      const currentTrade = trades[i];
      
      if (prevTrade.result === "LOSS") {
        afterLossPnL += currentTrade.pnl || 0;
        afterLossCount++;
      } else if (prevTrade.result === "WIN") {
        afterWinPnL += currentTrade.pnl || 0;
        afterWinCount++;
      }
    }

    const tiltIndicators = {
      revengeTradeCount: revengeTrades.length,
      fomoTradeCount: fomoTrades.length,
      avgPnLAfterLoss: afterLossCount > 0 ? afterLossPnL / afterLossCount : 0,
      avgPnLAfterWin: afterWinCount > 0 ? afterWinPnL / afterWinCount : 0,
    };

    return NextResponse.json({
      emotionBeforeStats,
      emotionAfterStats,
      confidenceCorrelation,
      planAdherenceStats,
      tiltIndicators,
    });
  } catch (error) {
    console.error("Psychology analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch psychology analytics" },
      { status: 500 }
    );
  }
}
```

---

## 4. Component Structure

### 4.1 File Tree

```
src/
├── app/
│   └── dashboard/
│       └── psychology/
│           └── page.tsx           # Psychology page
├── components/
│   └── psychology/                # NEW folder
│       ├── PsychologyDashboard.tsx
│       ├── EmotionSelector.tsx
│       ├── EmotionPerformanceChart.tsx
│       ├── ConfidenceCorrelation.tsx
│       ├── PlanAdherence.tsx
│       ├── TiltIndicators.tsx
│       └── index.ts
└── lib/
    └── emotions.ts               # Emotion constants
```

### 4.2 EmotionSelector Component

**File:** `src/components/psychology/EmotionSelector.tsx`

```typescript
"use client";

import { EMOTIONS, ALL_EMOTIONS } from "@/lib/emotions";

interface EmotionSelectorProps {
  value: string | null;
  onChange: (value: string) => void;
  label: string;
}

export function EmotionSelector({ value, onChange, label }: EmotionSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      
      {/* Positive emotions */}
      <div>
        <p className="text-xs text-green-500 mb-2 uppercase tracking-wider font-bold">
          Positive
        </p>
        <div className="flex flex-wrap gap-2">
          {EMOTIONS.positive.map((emotion) => (
            <button
              key={emotion.value}
              type="button"
              onClick={() => onChange(emotion.value)}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium transition-all
                flex items-center gap-1.5
                ${value === emotion.value
                  ? "bg-green-500 text-white ring-2 ring-green-300 ring-offset-2 dark:ring-offset-gray-900"
                  : "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/20"
                }
              `}
            >
              <span>{emotion.emoji}</span>
              <span>{emotion.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Neutral emotions */}
      <div>
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-bold">
          Neutral
        </p>
        <div className="flex flex-wrap gap-2">
          {EMOTIONS.neutral.map((emotion) => (
            <button
              key={emotion.value}
              type="button"
              onClick={() => onChange(emotion.value)}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium transition-all
                flex items-center gap-1.5
                ${value === emotion.value
                  ? "bg-gray-500 text-white ring-2 ring-gray-300 ring-offset-2 dark:ring-offset-gray-900"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500/20"
                }
              `}
            >
              <span>{emotion.emoji}</span>
              <span>{emotion.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Negative emotions */}
      <div>
        <p className="text-xs text-red-500 mb-2 uppercase tracking-wider font-bold">
          Negative (Watch out!)
        </p>
        <div className="flex flex-wrap gap-2">
          {EMOTIONS.negative.map((emotion) => (
            <button
              key={emotion.value}
              type="button"
              onClick={() => onChange(emotion.value)}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium transition-all
                flex items-center gap-1.5
                ${value === emotion.value
                  ? "bg-red-500 text-white ring-2 ring-red-300 ring-offset-2 dark:ring-offset-gray-900"
                  : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20"
                }
              `}
            >
              <span>{emotion.emoji}</span>
              <span>{emotion.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 4.3 Update JournalForm

**File:** `src/components/journal/JournalForm.tsx`

Add psychology section after existing fields:

```typescript
// Import
import { EmotionSelector } from "@/components/psychology/EmotionSelector";

// Add to form state
const [formData, setFormData] = useState({
  // ... existing fields ...
  emotionBefore: null as string | null,
  emotionAfter: null as string | null,
  confidenceLevel: null as number | null,
  followedPlan: null as boolean | null,
  notesPsychology: "",
});

// Add to form JSX after notes field
<div className="border-t border-gray-100 dark:border-gray-800 pt-6 mt-6">
  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
    <Brain size={20} className="text-purple-500" />
    Psychology Tracking
    <span className="text-xs font-normal text-gray-400">(optional)</span>
  </h3>

  <div className="space-y-6">
    {/* Emotion Before Entry */}
    <EmotionSelector
      value={formData.emotionBefore}
      onChange={(value) => setFormData({ ...formData, emotionBefore: value })}
      label="How did you feel BEFORE entering this trade?"
    />

    {/* Emotion After Exit (show only for closed trades) */}
    {formData.status === "CLOSED" && (
      <EmotionSelector
        value={formData.emotionAfter}
        onChange={(value) => setFormData({ ...formData, emotionAfter: value })}
        label="How did you feel AFTER closing this trade?"
      />
    )}

    {/* Confidence Level */}
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Confidence level before entry
      </label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => setFormData({ ...formData, confidenceLevel: level })}
            className={`
              w-12 h-12 rounded-xl font-bold text-lg transition-all
              ${formData.confidenceLevel === level
                ? "bg-purple-500 text-white ring-2 ring-purple-300 ring-offset-2 dark:ring-offset-gray-900"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }
            `}
          >
            {level}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400">
        1 = Very uncertain, 5 = Very confident
      </p>
    </div>

    {/* Followed Plan */}
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Did you follow your trading plan?
      </label>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setFormData({ ...formData, followedPlan: true })}
          className={`
            flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2
            ${formData.followedPlan === true
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }
          `}
        >
          <Check size={18} />
          Yes, I followed my plan
        </button>
        <button
          type="button"
          onClick={() => setFormData({ ...formData, followedPlan: false })}
          className={`
            flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2
            ${formData.followedPlan === false
              ? "bg-red-500 text-white"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }
          `}
        >
          <X size={18} />
          No, I deviated
        </button>
      </div>
    </div>

    {/* Psychology Notes */}
    <div className="space-y-2">
      <Label htmlFor="notesPsychology">Psychology Notes</Label>
      <Textarea
        id="notesPsychology"
        value={formData.notesPsychology}
        onChange={(e) => setFormData({ ...formData, notesPsychology: e.target.value })}
        placeholder="What thoughts influenced your decision? Any lessons learned?"
        rows={3}
      />
    </div>
  </div>
</div>
```

### 4.4 Psychology Dashboard

**File:** `src/components/psychology/PsychologyDashboard.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import { Brain, AlertTriangle, Target, TrendingUp, TrendingDown } from "lucide-react";

import { EmotionPerformanceChart } from "./EmotionPerformanceChart";
import { ConfidenceCorrelation } from "./ConfidenceCorrelation";
import { PlanAdherence } from "./PlanAdherence";
import { TiltIndicators } from "./TiltIndicators";

interface PsychologyData {
  emotionBeforeStats: Array<{
    emotion: string;
    totalTrades: number;
    winRate: number;
    totalPnL: number;
    avgPnL: number;
  }>;
  emotionAfterStats: Array<{
    emotion: string;
    totalTrades: number;
    winRate: number;
    totalPnL: number;
  }>;
  confidenceCorrelation: Array<{
    level: number;
    winRate: number;
    avgPnL: number;
    tradeCount: number;
  }>;
  planAdherenceStats: {
    followed: { count: number; winRate: number; totalPnL: number };
    notFollowed: { count: number; winRate: number; totalPnL: number };
  };
  tiltIndicators: {
    revengeTradeCount: number;
    fomoTradeCount: number;
    avgPnLAfterLoss: number;
    avgPnLAfterWin: number;
  };
}

export function PsychologyDashboard() {
  const [data, setData] = useState<PsychologyData | null>(null);
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

      const res = await fetch(`/api/analytics/psychology?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      
      const json = await res.json();
      setData(json);
    } catch (error) {
      toast.error("Failed to load psychology data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  if (isLoading) {
    return <PsychologyLoadingSkeleton />;
  }

  if (!data) {
    return <PsychologyEmptyState />;
  }

  // Find best emotion for trading
  const bestEmotion = data.emotionBeforeStats.length > 0
    ? data.emotionBeforeStats.reduce((best, current) => 
        current.winRate > best.winRate ? current : best
      )
    : null;

  // Check for tilt warning
  const hasTiltWarning = 
    data.tiltIndicators.revengeTradeCount > 0 ||
    data.tiltIndicators.fomoTradeCount > 0 ||
    data.tiltIndicators.avgPnLAfterLoss < 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Brain className="text-purple-500" />
            Psychology Analysis
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Understand how emotions affect your trading
          </p>
        </div>
        {/* Date picker would go here */}
      </div>

      {/* Tilt Warning Banner */}
      {hasTiltWarning && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-red-700 dark:text-red-400">
              Tilt Warning Detected
            </h4>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              {data.tiltIndicators.revengeTradeCount > 0 && 
                `You made ${data.tiltIndicators.revengeTradeCount} revenge trade(s). `}
              {data.tiltIndicators.fomoTradeCount > 0 && 
                `${data.tiltIndicators.fomoTradeCount} FOMO trade(s) detected. `}
              {data.tiltIndicators.avgPnLAfterLoss < 0 && 
                "Your performance drops after losses. Consider taking a break after losing trades."}
            </p>
          </div>
        </div>
      )}

      {/* Key Insight Card */}
      {bestEmotion && (
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-200 dark:border-purple-500/20 rounded-2xl p-6">
          <h3 className="text-sm uppercase tracking-wider text-purple-500 font-bold mb-2">
            Key Insight
          </h3>
          <p className="text-lg text-gray-900 dark:text-white">
            You trade best when feeling <span className="font-bold text-purple-500">{bestEmotion.emotion}</span> with a{" "}
            <span className="font-bold text-green-500">{bestEmotion.winRate.toFixed(0)}% win rate</span>.
          </p>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EmotionPerformanceChart 
          data={data.emotionBeforeStats} 
          title="Performance by Emotion (Before Trade)"
        />
        <ConfidenceCorrelation data={data.confidenceCorrelation} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlanAdherence data={data.planAdherenceStats} />
        <TiltIndicators data={data.tiltIndicators} />
      </div>
    </div>
  );
}

function PsychologyLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64" />
      <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
      <div className="grid grid-cols-2 gap-6">
        <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
      </div>
    </div>
  );
}

function PsychologyEmptyState() {
  return (
    <div className="text-center py-20">
      <Brain size={48} className="mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        No psychology data yet
      </h3>
      <p className="text-gray-500">
        Start tracking emotions when logging trades to see insights here.
      </p>
    </div>
  );
}
```

### 4.5 Confidence Correlation Chart

**File:** `src/components/psychology/ConfidenceCorrelation.tsx`

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

interface ConfidenceCorrelationProps {
  data: Array<{
    level: number;
    winRate: number;
    avgPnL: number;
    tradeCount: number;
  }>;
}

export function ConfidenceCorrelation({ data }: ConfidenceCorrelationProps) {
  const chartData = data.map(d => ({
    ...d,
    label: `Level ${d.level}`,
  }));

  return (
    <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
      <h3 className="font-bold text-gray-900 dark:text-white mb-2">
        Confidence vs Win Rate
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Does higher confidence lead to better results?
      </p>

      {data.length === 0 ? (
        <div className="h-[250px] flex items-center justify-center text-gray-400">
          No confidence data tracked yet
        </div>
      ) : (
        <>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis 
                  dataKey="label" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "none",
                    borderRadius: "12px",
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(1)}%`,
                    "Win Rate",
                  ]}
                />
                <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.winRate >= 50 ? "#00C888" : "#EF4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Insight */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            {chartData.length >= 3 && (() => {
              const bestLevel = [...chartData].sort((a, b) => b.winRate - a.winRate)[0];
              return (
                <p className="text-sm text-gray-500">
                  💡 Best performance at confidence level{" "}
                  <span className="font-bold text-purple-500">{bestLevel.level}</span>{" "}
                  ({bestLevel.winRate.toFixed(0)}% win rate)
                </p>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
```

### 4.6 Plan Adherence Card

**File:** `src/components/psychology/PlanAdherence.tsx`

```typescript
"use client";

import { Check, X } from "lucide-react";

interface PlanAdherenceProps {
  data: {
    followed: { count: number; winRate: number; totalPnL: number };
    notFollowed: { count: number; winRate: number; totalPnL: number };
  };
}

export function PlanAdherence({ data }: PlanAdherenceProps) {
  const totalTrades = data.followed.count + data.notFollowed.count;
  const adherenceRate = totalTrades > 0 
    ? (data.followed.count / totalTrades) * 100 
    : 0;

  return (
    <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
      <h3 className="font-bold text-gray-900 dark:text-white mb-2">
        Trading Plan Adherence
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        How following your plan affects results
      </p>

      {totalTrades === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-gray-400">
          No plan adherence data tracked yet
        </div>
      ) : (
        <>
          {/* Adherence Rate Circle */}
          <div className="flex justify-center mb-6">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(adherenceRate / 100) * 352} 352`}
                  className="text-green-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-black text-gray-900 dark:text-white">
                  {adherenceRate.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* Followed Plan */}
            <div className="bg-green-50 dark:bg-green-500/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-green-500 rounded-full">
                  <Check size={12} className="text-white" />
                </div>
                <span className="text-sm font-bold text-green-700 dark:text-green-400">
                  Followed Plan
                </span>
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">
                {data.followed.winRate.toFixed(0)}%
              </p>
              <p className="text-xs text-gray-500">
                Win rate ({data.followed.count} trades)
              </p>
              <p className={`text-sm font-bold mt-2 ${
                data.followed.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {data.followed.totalPnL >= 0 ? '+' : ''}${data.followed.totalPnL.toFixed(0)}
              </p>
            </div>

            {/* Did Not Follow */}
            <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-red-500 rounded-full">
                  <X size={12} className="text-white" />
                </div>
                <span className="text-sm font-bold text-red-700 dark:text-red-400">
                  Deviated
                </span>
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">
                {data.notFollowed.winRate.toFixed(0)}%
              </p>
              <p className="text-xs text-gray-500">
                Win rate ({data.notFollowed.count} trades)
              </p>
              <p className={`text-sm font-bold mt-2 ${
                data.notFollowed.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {data.notFollowed.totalPnL >= 0 ? '+' : ''}${data.notFollowed.totalPnL.toFixed(0)}
              </p>
            </div>
          </div>

          {/* Insight */}
          {data.followed.winRate > data.notFollowed.winRate && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-sm text-green-600 dark:text-green-400">
                ✅ Following your plan increases win rate by{" "}
                <span className="font-bold">
                  {(data.followed.winRate - data.notFollowed.winRate).toFixed(0)}%
                </span>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

---

## 5. Navigation Update

**File:** `src/config/navigation.ts`

```typescript
// ADD import
import { Brain } from "lucide-react";

// MODIFY dashboardMenuItems - add after Strategies
export const dashboardMenuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Journal", href: "/dashboard/journal", icon: BookOpen },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Strategies", href: "/dashboard/strategies", icon: Target },
    { name: "Psychology", href: "/dashboard/psychology", icon: Brain }, // NEW
    { name: "Trading Accounts", href: "/dashboard/accounts", icon: Wallet },
    { name: "Academy", href: "/dashboard/academy", icon: GraduationCap },
    { name: "Trading Systems", href: "/dashboard/trading-systems", icon: Download },
];
```

---

## 6. Files Summary

### Files to CREATE:

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `src/lib/emotions.ts` | Emotion constants |
| 2 | `src/app/api/analytics/psychology/route.ts` | Psychology analytics API |
| 3 | `src/app/dashboard/psychology/page.tsx` | Page wrapper |
| 4 | `src/components/psychology/PsychologyDashboard.tsx` | Main container |
| 5 | `src/components/psychology/EmotionSelector.tsx` | Emotion picker UI |
| 6 | `src/components/psychology/EmotionPerformanceChart.tsx` | Bar chart |
| 7 | `src/components/psychology/ConfidenceCorrelation.tsx` | Chart |
| 8 | `src/components/psychology/PlanAdherence.tsx` | Stats card |
| 9 | `src/components/psychology/TiltIndicators.tsx` | Warning card |
| 10 | `src/components/psychology/index.ts` | Exports |

### Files to MODIFY:

| # | File Path | Change |
|---|-----------|--------|
| 1 | `prisma/schema.prisma` | Add psychology fields |
| 2 | `src/config/navigation.ts` | Add Psychology menu item |
| 3 | `src/components/journal/JournalForm.tsx` | Add psychology section |
| 4 | `src/app/api/journal/route.ts` | Handle new fields |
| 5 | `src/app/api/journal/[id]/route.ts` | Handle new fields |

### Migration Required:

```bash
npx prisma migrate dev --name add_psychology_fields
npx prisma generate
```

---

## 7. Implementation Priority

1. **Phase 1:** Database migration + emotions constants
2. **Phase 2:** Update JournalForm to capture emotions
3. **Phase 3:** Create Psychology API
4. **Phase 4:** Build Psychology dashboard components
5. **Phase 5:** Add navigation link

---

*Document End - Ready for Implementation*
