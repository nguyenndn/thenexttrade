# Strategy Tracking - Detailed Implementation Specification

> **Version:** 1.0  
> **Created:** February 3, 2026  
> **Purpose:** Detailed spec cho AI Agent implement  
> **Depends On:** Existing Journal system

---

## 1. Overview

### 1.1 Mục tiêu
Cho phép traders gắn tag Strategy vào mỗi trade, sau đó phân tích performance theo từng strategy.

### 1.2 User Story
> "Là một trader, tôi muốn biết strategy nào đang hoạt động tốt nhất và strategy nào cần cải thiện."

### 1.3 Current Limitation
Hiện tại JournalEntry chỉ có:
```typescript
interface JournalEntry {
    symbol, type, pnl, status, result, entryPrice, exitPrice, accountId
    // KHÔNG có: strategy field
}
```

---

## 2. Database Changes

### 2.1 Add Strategy Field to Journal Trades

**Migration SQL:**

```sql
-- Add strategy column to journal_trades table
ALTER TABLE journal_trades 
ADD COLUMN strategy VARCHAR(100) DEFAULT NULL;

-- Create index for faster queries
CREATE INDEX idx_journal_trades_strategy ON journal_trades(strategy);

-- Optional: Create strategies reference table
CREATE TABLE IF NOT EXISTS strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rules TEXT,
    color VARCHAR(7) DEFAULT '#6366F1', -- Hex color for UI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

CREATE INDEX idx_strategies_user ON strategies(user_id);
```

### 2.2 Prisma Schema Update

**File:** `prisma/schema.prisma`

```prisma
// ADD to JournalTrade model
model JournalTrade {
  // ... existing fields ...
  strategy   String?   @db.VarChar(100)
  
  // ... existing relations ...
}

// ADD new Strategy model
model Strategy {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  name        String   @db.VarChar(100)
  description String?
  rules       String?
  color       String   @default("#6366F1") @db.VarChar(7)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, name])
  @@index([userId])
  @@map("strategies")
}

// UPDATE User model to add strategies relation
model User {
  // ... existing fields ...
  strategies  Strategy[]
}
```

### 2.3 Run Migration

```bash
npx prisma migrate dev --name add_strategy_field
npx prisma generate
```

---

## 3. API Endpoints

### 3.1 Strategies CRUD API

**File:** `src/app/api/strategies/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const strategySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  rules: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

// GET - List all strategies
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const strategies = await prisma.strategy.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        rules: true,
        color: true,
      },
    });

    return NextResponse.json({ strategies });
  } catch (error) {
    console.error("Get strategies error:", error);
    return NextResponse.json({ error: "Failed to fetch strategies" }, { status: 500 });
  }
}

// POST - Create new strategy
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = strategySchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, rules, color } = validation.data;

    // Check for duplicate
    const existing = await prisma.strategy.findUnique({
      where: { userId_name: { userId: user.id, name } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Strategy with this name already exists" },
        { status: 409 }
      );
    }

    const strategy = await prisma.strategy.create({
      data: {
        userId: user.id,
        name,
        description,
        rules,
        color: color || "#6366F1",
      },
    });

    return NextResponse.json({ strategy }, { status: 201 });
  } catch (error) {
    console.error("Create strategy error:", error);
    return NextResponse.json({ error: "Failed to create strategy" }, { status: 500 });
  }
}
```

**File:** `src/app/api/strategies/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  rules: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

// GET - Get single strategy
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const strategy = await prisma.strategy.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!strategy) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ strategy });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch strategy" }, { status: 500 });
  }
}

// PATCH - Update strategy
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    // Check ownership
    const existing = await prisma.strategy.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const strategy = await prisma.strategy.update({
      where: { id: params.id },
      data: validation.data,
    });

    return NextResponse.json({ strategy });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update strategy" }, { status: 500 });
  }
}

// DELETE - Delete strategy
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check ownership
    const existing = await prisma.strategy.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Clear strategy from trades first
    await prisma.journalTrade.updateMany({
      where: { userId: user.id, strategy: existing.name },
      data: { strategy: null },
    });

    // Delete strategy
    await prisma.strategy.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete strategy" }, { status: 500 });
  }
}
```

### 3.2 Strategy Performance API

**File:** `src/app/api/strategies/performance/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, parseISO } from "date-fns";

interface StrategyPerformance {
  strategy: string;
  color: string;
  totalTrades: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  totalPnL: number;
  avgPnL: number;
  profitFactor: number;
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

    // Get user's strategies with colors
    const strategies = await prisma.strategy.findMany({
      where: { userId: user.id },
      select: { name: true, color: true },
    });
    const strategyColors = new Map(strategies.map(s => [s.name, s.color]));

    // Get closed trades with strategy
    const trades = await prisma.journalTrade.findMany({
      where: {
        userId: user.id,
        status: "CLOSED",
        strategy: { not: null },
        entryDate: { gte: startDate, lte: endDate },
      },
      select: {
        strategy: true,
        pnl: true,
        result: true,
      },
    });

    // Aggregate by strategy
    const strategyMap = new Map<string, {
      wins: number;
      losses: number;
      grossProfit: number;
      grossLoss: number;
      totalPnL: number;
    }>();

    for (const trade of trades) {
      if (!trade.strategy) continue;
      
      const current = strategyMap.get(trade.strategy) || {
        wins: 0,
        losses: 0,
        grossProfit: 0,
        grossLoss: 0,
        totalPnL: 0,
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

      strategyMap.set(trade.strategy, current);
    }

    // Build response
    const performance: StrategyPerformance[] = Array.from(strategyMap.entries())
      .map(([strategy, data]) => {
        const total = data.wins + data.losses;
        return {
          strategy,
          color: strategyColors.get(strategy) || "#6366F1",
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

    return NextResponse.json({ performance });
  } catch (error) {
    console.error("Strategy performance error:", error);
    return NextResponse.json(
      { error: "Failed to fetch strategy performance" },
      { status: 500 }
    );
  }
}
```

---

## 4. Component Updates

### 4.1 Update JournalForm - Add Strategy Field

**File:** `src/components/journal/JournalForm.tsx`

**Changes Required:**
1. Add `strategy` field to form
2. Fetch strategies list for dropdown
3. Add "Create new strategy" option inline

```typescript
// ADD to form fields (after notes field)
<div className="space-y-2">
  <Label htmlFor="strategy">Strategy (optional)</Label>
  <div className="flex gap-2">
    <Select
      value={formData.strategy || ""}
      onValueChange={(value) => 
        setFormData({ ...formData, strategy: value === "none" ? null : value })
      }
    >
      <SelectTrigger className="flex-1">
        <SelectValue placeholder="Select strategy" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No strategy</SelectItem>
        {strategies.map((s) => (
          <SelectItem key={s.id} value={s.name}>
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: s.color }} 
              />
              {s.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => setShowNewStrategyModal(true)}
    >
      <Plus size={16} />
    </Button>
  </div>
</div>
```

### 4.2 Create Strategy Management Page

**File:** `src/app/dashboard/strategies/page.tsx`

```typescript
import { Metadata } from "next";
import { StrategyManager } from "@/components/strategies/StrategyManager";

export const metadata: Metadata = {
  title: "Strategies | Trading Dashboard",
  description: "Manage your trading strategies",
};

export default function StrategiesPage() {
  return <StrategyManager />;
}
```

### 4.3 Strategy Manager Component

**File:** `src/components/strategies/StrategyManager.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Target, TrendingUp, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StrategyModal } from "./StrategyModal";
import { StrategyPerformanceChart } from "./StrategyPerformanceChart";

interface Strategy {
  id: string;
  name: string;
  description: string | null;
  rules: string | null;
  color: string;
}

interface StrategyPerformance {
  strategy: string;
  color: string;
  totalTrades: number;
  winRate: number;
  totalPnL: number;
  profitFactor: number;
}

export function StrategyManager() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [performance, setPerformance] = useState<StrategyPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);

  const fetchStrategies = async () => {
    try {
      const res = await fetch("/api/strategies");
      const data = await res.json();
      setStrategies(data.strategies || []);
    } catch (error) {
      toast.error("Failed to load strategies");
    }
  };

  const fetchPerformance = async () => {
    try {
      const res = await fetch("/api/strategies/performance");
      const data = await res.json();
      setPerformance(data.performance || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    Promise.all([fetchStrategies(), fetchPerformance()])
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this strategy? Trades will be untagged.")) return;

    try {
      const res = await fetch(`/api/strategies/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      
      toast.success("Strategy deleted");
      fetchStrategies();
      fetchPerformance();
    } catch (error) {
      toast.error("Failed to delete strategy");
    }
  };

  const handleSave = () => {
    setShowModal(false);
    setEditingStrategy(null);
    fetchStrategies();
    fetchPerformance();
  };

  if (isLoading) {
    return <StrategiesLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-700 dark:text-white">
            Strategies
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Track performance by trading strategy
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={16} className="mr-2" />
          New Strategy
        </Button>
      </div>

      {/* Performance Chart */}
      {performance.length > 0 && (
        <StrategyPerformanceChart data={performance} />
      )}

      {/* Strategy Cards */}
      {strategies.length === 0 ? (
        <EmptyState onAdd={() => setShowModal(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {strategies.map((strategy) => {
            const perf = performance.find(p => p.strategy === strategy.name);
            return (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                performance={perf}
                onEdit={() => {
                  setEditingStrategy(strategy);
                  setShowModal(true);
                }}
                onDelete={() => handleDelete(strategy.id)}
              />
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <StrategyModal
          strategy={editingStrategy}
          onClose={() => {
            setShowModal(false);
            setEditingStrategy(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function StrategyCard({
  strategy,
  performance,
  onEdit,
  onDelete,
}: {
  strategy: Strategy;
  performance?: StrategyPerformance;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white dark:bg-[#0B0E14] p-5 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: strategy.color }}
          />
          <h3 className="font-bold text-gray-700 dark:text-white">
            {strategy.name}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Edit2 size={14} className="text-gray-500" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 size={14} className="text-red-400" />
          </button>
        </div>
      </div>

      {/* Description */}
      {strategy.description && (
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
          {strategy.description}
        </p>
      )}

      {/* Stats */}
      {performance ? (
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-gray-50 dark:bg-white/5 rounded-xl">
            <Target size={14} className="mx-auto mb-1 text-purple-500" />
            <p className="text-sm font-bold text-gray-700 dark:text-white">
              {performance.winRate.toFixed(0)}%
            </p>
            <p className="text-[10px] text-gray-500">Win Rate</p>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-white/5 rounded-xl">
            <TrendingUp size={14} className={`mx-auto mb-1 ${performance.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            <p className={`text-sm font-bold ${performance.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${Math.abs(performance.totalPnL).toFixed(0)}
            </p>
            <p className="text-[10px] text-gray-500">Total P&L</p>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-white/5 rounded-xl">
            <Percent size={14} className="mx-auto mb-1 text-blue-500" />
            <p className="text-sm font-bold text-gray-700 dark:text-white">
              {performance.profitFactor === Infinity ? "∞" : performance.profitFactor.toFixed(1)}
            </p>
            <p className="text-[10px] text-gray-500">PF</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">
          No trades with this strategy yet
        </p>
      )}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <Target size={24} className="text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 dark:text-white mb-2">
        No strategies yet
      </h3>
      <p className="text-gray-500 mb-4">
        Create strategies to track which setups work best
      </p>
      <Button onClick={onAdd}>
        <Plus size={16} className="mr-2" />
        Create First Strategy
      </Button>
    </div>
  );
}

function StrategiesLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
```

### 4.4 Strategy Modal Component

**File:** `src/components/strategies/StrategyModal.tsx`

```typescript
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Strategy {
  id: string;
  name: string;
  description: string | null;
  rules: string | null;
  color: string;
}

interface StrategyModalProps {
  strategy: Strategy | null;
  onClose: () => void;
  onSave: () => void;
}

const PRESET_COLORS = [
  "#6366F1", // Indigo
  "#00C888", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#EC4899", // Pink
  "#10B981", // Emerald
];

export function StrategyModal({ strategy, onClose, onSave }: StrategyModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: strategy?.name || "",
    description: strategy?.description || "",
    rules: strategy?.rules || "",
    color: strategy?.color || "#6366F1",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Strategy name is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = strategy 
        ? `/api/strategies/${strategy.id}` 
        : "/api/strategies";
      
      const method = strategy ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      toast.success(strategy ? "Strategy updated" : "Strategy created");
      onSave();
    } catch (error: any) {
      toast.error(error.message || "Failed to save strategy");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-[#0B0E14] rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-700 dark:text-white">
            {strategy ? "Edit Strategy" : "New Strategy"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Breakout, ICT, Supply & Demand"
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full transition-all ${
                    formData.color === color 
                      ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900" 
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the strategy"
              rows={2}
            />
          </div>

          {/* Rules */}
          <div className="space-y-2">
            <Label htmlFor="rules">Rules / Entry Criteria</Label>
            <Textarea
              id="rules"
              value={formData.rules}
              onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
              placeholder="List your entry rules..."
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Saving..." : strategy ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

## 5. Navigation Update

**File:** `src/config/navigation.ts`

```typescript
// ADD import
import { Target } from "lucide-react";

// MODIFY dashboardMenuItems - add after Analytics
export const dashboardMenuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Journal", href: "/dashboard/journal", icon: BookOpen },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Strategies", href: "/dashboard/strategies", icon: Target }, // NEW
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
| 1 | `src/app/api/strategies/route.ts` | List & Create strategies |
| 2 | `src/app/api/strategies/[id]/route.ts` | Get, Update, Delete |
| 3 | `src/app/api/strategies/performance/route.ts` | Performance analytics |
| 4 | `src/app/dashboard/strategies/page.tsx` | Page wrapper |
| 5 | `src/components/strategies/StrategyManager.tsx` | Main UI |
| 6 | `src/components/strategies/StrategyModal.tsx` | Create/Edit modal |
| 7 | `src/components/strategies/StrategyPerformanceChart.tsx` | Bar chart |
| 8 | `src/components/strategies/index.ts` | Exports |

### Files to MODIFY:

| # | File Path | Change |
|---|-----------|--------|
| 1 | `prisma/schema.prisma` | Add strategy field & Strategy model |
| 2 | `src/config/navigation.ts` | Add Strategies menu item |
| 3 | `src/components/journal/JournalForm.tsx` | Add strategy dropdown |
| 4 | `src/components/journal/JournalList.tsx` | Add strategy filter |

### Migration Required:

```bash
npx prisma migrate dev --name add_strategy_field
npx prisma generate
```

---

## 7. Integration with Analytics

Update Analytics page to show "Performance by Strategy" chart:

**File:** `src/components/analytics/StrategyPerformance.tsx`

```typescript
// Similar to PairPerformance but grouped by strategy
// Fetch from /api/strategies/performance
// Show horizontal bar chart with strategy colors
```

Add to `AnalyticsDashboard.tsx`:

```typescript
// Add after PairPerformance chart
<StrategyPerformance data={strategyData} />
```

---

*Document End - Ready for Implementation*
