# Risk Calculator - Detailed Implementation Specification

> **Version:** 1.0  
> **Created:** February 3, 2026  
> **Purpose:** Position sizing and risk management calculator  
> **Priority:** P2

---

## 1. Overview

### 1.1 Mục tiêu
Cung cấp các calculators để traders tính toán position size, risk amount, và R:R ratio trước khi vào lệnh.

### 1.2 User Stories
> "Tôi muốn biết nên đặt bao nhiêu lot để chỉ risk 1% account"  
> "Tôi cần tính nhanh R:R trước khi vào lệnh"

### 1.3 Calculators Included
1. **Position Size Calculator** - Tính lot size dựa trên risk %
2. **Risk/Reward Calculator** - Tính R:R ratio
3. **Pip Value Calculator** - Tính giá trị pip cho mỗi pair
4. **Margin Calculator** - Tính margin cần thiết
5. **Profit/Loss Calculator** - Tính P/L dự kiến

---

## 2. No Database Changes Required

Calculators chỉ là client-side computation, không cần lưu database.

Tuy nhiên, có thể lưu user preferences:

```sql
-- Optional: Save user's default settings
ALTER TABLE user_preferences
ADD COLUMN default_risk_percent DECIMAL(5,2) DEFAULT 1.00,
ADD COLUMN default_leverage INTEGER DEFAULT 100,
ADD COLUMN default_account_currency VARCHAR(3) DEFAULT 'USD';
```

---

## 3. Calculator Logic

### 3.1 Position Size Formula

```typescript
/**
 * Position Size Calculator
 * 
 * Formula:
 * Position Size (lots) = (Account Balance × Risk %) / (Stop Loss in Pips × Pip Value)
 * 
 * For Forex:
 * - Standard Lot = 100,000 units
 * - Mini Lot = 10,000 units
 * - Micro Lot = 1,000 units
 */

interface PositionSizeInput {
  accountBalance: number;      // e.g., 10000 USD
  riskPercent: number;         // e.g., 1 (means 1%)
  stopLossPips: number;        // e.g., 50 pips
  pair: string;                // e.g., "EURUSD"
  accountCurrency: string;     // e.g., "USD"
}

interface PositionSizeResult {
  lotSize: number;             // Standard lots
  miniLots: number;            // Mini lots
  microLots: number;           // Micro lots
  units: number;               // Raw units
  riskAmount: number;          // Dollar amount at risk
  pipValue: number;            // Value per pip
}

function calculatePositionSize(input: PositionSizeInput): PositionSizeResult {
  const { accountBalance, riskPercent, stopLossPips, pair, accountCurrency } = input;
  
  // Calculate risk amount in account currency
  const riskAmount = accountBalance * (riskPercent / 100);
  
  // Get pip value for the pair
  const pipValue = getPipValue(pair, accountCurrency);
  
  // Calculate position size in units
  const units = riskAmount / (stopLossPips * pipValue);
  
  // Convert to lots
  const lotSize = units / 100000;
  const miniLots = units / 10000;
  const microLots = units / 1000;
  
  return {
    lotSize: Math.floor(lotSize * 100) / 100,      // Round down to 2 decimals
    miniLots: Math.floor(miniLots * 10) / 10,
    microLots: Math.floor(microLots),
    units: Math.floor(units),
    riskAmount,
    pipValue,
  };
}
```

### 3.2 Pip Value Calculation

```typescript
/**
 * Pip Value varies by currency pair and account currency
 * 
 * For XXX/USD pairs (where USD is quote currency):
 * - Pip Value = 0.0001 × Lot Size
 * - For 1 standard lot: 0.0001 × 100,000 = $10 per pip
 * 
 * For USD/XXX pairs (where USD is base currency):
 * - Pip Value = (0.0001 / Exchange Rate) × Lot Size
 * 
 * For Cross pairs (no USD):
 * - Need to convert through USD
 */

// Pip value per micro lot (1000 units) in USD
const PIP_VALUES: Record<string, number> = {
  // USD quote currency - $0.10 per pip per micro lot
  "EURUSD": 0.10,
  "GBPUSD": 0.10,
  "AUDUSD": 0.10,
  "NZDUSD": 0.10,
  
  // USD base currency - varies with exchange rate
  // These are approximate, should be fetched live
  "USDJPY": 0.09,
  "USDCHF": 0.11,
  "USDCAD": 0.08,
  
  // Cross pairs - approximate values
  "EURJPY": 0.09,
  "GBPJPY": 0.09,
  "EURGBP": 0.13,
  "AUDCAD": 0.08,
  
  // Gold and commodities
  "XAUUSD": 1.00,  // $1 per point per micro lot
  "XAGUSD": 0.50,
  
  // Indices (CFDs) - per point
  "US30": 1.00,
  "US100": 1.00,
  "US500": 1.00,
};

function getPipValue(pair: string, accountCurrency: string = "USD"): number {
  // Get base pip value in USD
  let pipValue = PIP_VALUES[pair.toUpperCase()] || 0.10;
  
  // Convert to account currency if not USD
  if (accountCurrency !== "USD") {
    // Would need live exchange rate here
    // For simplicity, using approximate conversion
    const conversionRates: Record<string, number> = {
      "EUR": 0.92,
      "GBP": 0.79,
      "JPY": 149.50,
      "AUD": 1.53,
      "CAD": 1.36,
    };
    
    const rate = conversionRates[accountCurrency] || 1;
    pipValue = pipValue * rate;
  }
  
  return pipValue;
}
```

### 3.3 Risk/Reward Calculator

```typescript
interface RiskRewardInput {
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  direction: "LONG" | "SHORT";
}

interface RiskRewardResult {
  riskPips: number;
  rewardPips: number;
  rrRatio: number;
  rrString: string;           // e.g., "1:2.5"
  winRateToBreakeven: number; // Minimum win rate needed
}

function calculateRiskReward(input: RiskRewardInput): RiskRewardResult {
  const { entryPrice, stopLoss, takeProfit, direction } = input;
  
  let riskPips: number;
  let rewardPips: number;
  
  if (direction === "LONG") {
    riskPips = (entryPrice - stopLoss) * 10000;   // Convert to pips
    rewardPips = (takeProfit - entryPrice) * 10000;
  } else {
    riskPips = (stopLoss - entryPrice) * 10000;
    rewardPips = (entryPrice - takeProfit) * 10000;
  }
  
  const rrRatio = rewardPips / riskPips;
  
  // Win rate needed to break even: 1 / (1 + R:R)
  // If R:R = 2, need 33.3% win rate
  // If R:R = 1, need 50% win rate
  const winRateToBreakeven = (1 / (1 + rrRatio)) * 100;
  
  return {
    riskPips: Math.abs(riskPips),
    rewardPips: Math.abs(rewardPips),
    rrRatio: Math.round(rrRatio * 100) / 100,
    rrString: `1:${rrRatio.toFixed(1)}`,
    winRateToBreakeven: Math.round(winRateToBreakeven * 10) / 10,
  };
}
```

### 3.4 Margin Calculator

```typescript
interface MarginInput {
  lotSize: number;
  pair: string;
  leverage: number;           // e.g., 100 for 1:100
  currentPrice: number;
  accountCurrency: string;
}

interface MarginResult {
  requiredMargin: number;
  freeMarginAfter: number;    // If account balance provided
  marginLevel: number;        // Percentage
}

function calculateMargin(input: MarginInput): MarginResult {
  const { lotSize, pair, leverage, currentPrice, accountCurrency } = input;
  
  // Contract size for forex = 100,000
  const contractSize = 100000;
  
  // Position value
  const positionValue = lotSize * contractSize * currentPrice;
  
  // Required margin
  const requiredMargin = positionValue / leverage;
  
  return {
    requiredMargin: Math.round(requiredMargin * 100) / 100,
    freeMarginAfter: 0, // Would need account balance
    marginLevel: 0,     // Would need equity
  };
}
```

### 3.5 Profit/Loss Calculator

```typescript
interface ProfitLossInput {
  entryPrice: number;
  exitPrice: number;
  lotSize: number;
  direction: "LONG" | "SHORT";
  pair: string;
}

interface ProfitLossResult {
  pips: number;
  profitLoss: number;         // In USD
  profitLossPercent: number;  // If account size provided
}

function calculateProfitLoss(input: ProfitLossInput): ProfitLossResult {
  const { entryPrice, exitPrice, lotSize, direction, pair } = input;
  
  // Calculate pips
  let pips: number;
  if (direction === "LONG") {
    pips = (exitPrice - entryPrice) * 10000;
  } else {
    pips = (entryPrice - exitPrice) * 10000;
  }
  
  // Calculate profit/loss
  const pipValue = getPipValue(pair, "USD") * lotSize * 10; // Per standard lot
  const profitLoss = pips * pipValue;
  
  return {
    pips: Math.round(pips * 10) / 10,
    profitLoss: Math.round(profitLoss * 100) / 100,
    profitLossPercent: 0, // Would need account balance
  };
}
```

---

## 4. Component Structure

### 4.1 File Tree

```
src/
├── app/
│   └── dashboard/
│       └── calculator/
│           └── page.tsx           # Calculator page (may already exist)
├── components/
│   └── calculator/                # Calculator components
│       ├── CalculatorHub.tsx      # Main container with tabs
│       ├── PositionSizeCalc.tsx   # Position size calculator
│       ├── RiskRewardCalc.tsx     # R:R calculator
│       ├── PipValueCalc.tsx       # Pip value lookup
│       ├── MarginCalc.tsx         # Margin calculator
│       ├── ProfitLossCalc.tsx     # P/L calculator
│       ├── CurrencyPairSelect.tsx # Pair dropdown
│       └── index.ts
└── lib/
    └── calculators.ts             # Calculator functions (may exist)
```

### 4.2 Calculator Hub Component

**File:** `src/components/calculator/CalculatorHub.tsx`

```typescript
"use client";

import { useState } from "react";
import { Calculator, Target, DollarSign, Percent, TrendingUp } from "lucide-react";
import { PositionSizeCalc } from "./PositionSizeCalc";
import { RiskRewardCalc } from "./RiskRewardCalc";
import { PipValueCalc } from "./PipValueCalc";
import { MarginCalc } from "./MarginCalc";
import { ProfitLossCalc } from "./ProfitLossCalc";

const CALCULATORS = [
  {
    id: "position-size",
    name: "Position Size",
    icon: Calculator,
    description: "Calculate lot size based on risk %",
  },
  {
    id: "risk-reward",
    name: "Risk/Reward",
    icon: Target,
    description: "Calculate R:R ratio",
  },
  {
    id: "pip-value",
    name: "Pip Value",
    icon: DollarSign,
    description: "Pip value by currency pair",
  },
  {
    id: "margin",
    name: "Margin",
    icon: Percent,
    description: "Required margin for position",
  },
  {
    id: "profit-loss",
    name: "Profit/Loss",
    icon: TrendingUp,
    description: "Calculate potential P/L",
  },
];

export function CalculatorHub() {
  const [activeCalc, setActiveCalc] = useState("position-size");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Trading Calculators
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Calculate position size, risk, and more
        </p>
      </div>

      {/* Calculator Tabs */}
      <div className="flex flex-wrap gap-2">
        {CALCULATORS.map((calc) => {
          const Icon = calc.icon;
          return (
            <button
              key={calc.id}
              onClick={() => setActiveCalc(calc.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all
                ${activeCalc === calc.id
                  ? "bg-[#00C888] text-white shadow-lg shadow-[#00C888]/25"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }
              `}
            >
              <Icon size={16} />
              {calc.name}
            </button>
          );
        })}
      </div>

      {/* Calculator Content */}
      <div className="bg-white dark:bg-[#0B0E14] rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm">
        {activeCalc === "position-size" && <PositionSizeCalc />}
        {activeCalc === "risk-reward" && <RiskRewardCalc />}
        {activeCalc === "pip-value" && <PipValueCalc />}
        {activeCalc === "margin" && <MarginCalc />}
        {activeCalc === "profit-loss" && <ProfitLossCalc />}
      </div>
    </div>
  );
}
```

### 4.3 Position Size Calculator Component

**File:** `src/components/calculator/PositionSizeCalc.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { Calculator, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyPairSelect } from "./CurrencyPairSelect";
import { calculatePositionSize } from "@/lib/calculators";

export function PositionSizeCalc() {
  const [inputs, setInputs] = useState({
    accountBalance: 10000,
    riskPercent: 1,
    stopLossPips: 50,
    pair: "EURUSD",
    accountCurrency: "USD",
  });

  const [result, setResult] = useState<{
    lotSize: number;
    miniLots: number;
    microLots: number;
    units: number;
    riskAmount: number;
    pipValue: number;
  } | null>(null);

  // Calculate on input change
  useEffect(() => {
    if (inputs.accountBalance > 0 && inputs.stopLossPips > 0) {
      const calc = calculatePositionSize(inputs);
      setResult(calc);
    }
  }, [inputs]);

  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
        <Info size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Calculate the correct lot size to risk exactly{" "}
          <span className="font-bold">{inputs.riskPercent}%</span> of your account
          with a <span className="font-bold">{inputs.stopLossPips} pip</span> stop loss.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white">
            Input Parameters
          </h3>

          {/* Account Balance */}
          <div className="space-y-2">
            <Label htmlFor="accountBalance">Account Balance</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                $
              </span>
              <Input
                id="accountBalance"
                type="number"
                value={inputs.accountBalance}
                onChange={(e) =>
                  setInputs({ ...inputs, accountBalance: parseFloat(e.target.value) || 0 })
                }
                className="pl-7"
              />
            </div>
          </div>

          {/* Risk Percent */}
          <div className="space-y-2">
            <Label htmlFor="riskPercent">Risk Percentage</Label>
            <div className="relative">
              <Input
                id="riskPercent"
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={inputs.riskPercent}
                onChange={(e) =>
                  setInputs({ ...inputs, riskPercent: parseFloat(e.target.value) || 0 })
                }
                className="pr-7"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                %
              </span>
            </div>
            <div className="flex gap-2">
              {[0.5, 1, 1.5, 2].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setInputs({ ...inputs, riskPercent: pct })}
                  className={`
                    px-3 py-1 text-xs font-medium rounded-lg transition-colors
                    ${inputs.riskPercent === pct
                      ? "bg-[#00C888] text-white"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }
                  `}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Stop Loss Pips */}
          <div className="space-y-2">
            <Label htmlFor="stopLossPips">Stop Loss (pips)</Label>
            <Input
              id="stopLossPips"
              type="number"
              value={inputs.stopLossPips}
              onChange={(e) =>
                setInputs({ ...inputs, stopLossPips: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          {/* Currency Pair */}
          <div className="space-y-2">
            <Label>Currency Pair</Label>
            <CurrencyPairSelect
              value={inputs.pair}
              onChange={(pair) => setInputs({ ...inputs, pair })}
            />
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white">
            Calculated Position Size
          </h3>

          {result && (
            <div className="space-y-4">
              {/* Main Result */}
              <div className="bg-gradient-to-br from-[#00C888]/10 to-[#00C888]/5 rounded-2xl p-6 text-center">
                <p className="text-sm text-gray-500 mb-1">Lot Size</p>
                <p className="text-4xl font-black text-[#00C888]">
                  {result.lotSize.toFixed(2)}
                </p>
                <p className="text-sm text-gray-400 mt-1">Standard Lots</p>
              </div>

              {/* Additional Results */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-gray-400">Mini Lots</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {result.miniLots.toFixed(1)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-gray-400">Micro Lots</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {result.microLots}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-gray-400">Units</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {result.units.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-gray-400">Risk Amount</p>
                  <p className="text-xl font-bold text-red-500">
                    ${result.riskAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Info */}
              <div className="text-sm text-gray-500 bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                <p>
                  <span className="font-medium">Pip Value:</span>{" "}
                  ${result.pipValue.toFixed(2)} per pip per micro lot
                </p>
                <p className="mt-1">
                  With this position size, if your stop loss is hit, you will lose{" "}
                  <span className="font-bold text-red-500">
                    ${result.riskAmount.toFixed(2)}
                  </span>{" "}
                  ({inputs.riskPercent}% of your account).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 4.4 Risk/Reward Calculator Component

**File:** `src/components/calculator/RiskRewardCalc.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { Target, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateRiskReward } from "@/lib/calculators";

export function RiskRewardCalc() {
  const [inputs, setInputs] = useState({
    entryPrice: 1.0850,
    stopLoss: 1.0800,
    takeProfit: 1.0950,
    direction: "LONG" as "LONG" | "SHORT",
  });

  const [result, setResult] = useState<{
    riskPips: number;
    rewardPips: number;
    rrRatio: number;
    rrString: string;
    winRateToBreakeven: number;
  } | null>(null);

  useEffect(() => {
    if (inputs.entryPrice && inputs.stopLoss && inputs.takeProfit) {
      const calc = calculateRiskReward(inputs);
      setResult(calc);
    }
  }, [inputs]);

  // Visual R:R bar
  const getBarWidth = () => {
    if (!result) return { risk: 33, reward: 67 };
    const total = result.riskPips + result.rewardPips;
    return {
      risk: (result.riskPips / total) * 100,
      reward: (result.rewardPips / total) * 100,
    };
  };

  const barWidth = getBarWidth();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white">
            Trade Parameters
          </h3>

          {/* Direction Toggle */}
          <div className="space-y-2">
            <Label>Direction</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setInputs({ ...inputs, direction: "LONG" })}
                className={`
                  flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2
                  ${inputs.direction === "LONG"
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }
                `}
              >
                <ArrowUp size={18} />
                LONG
              </button>
              <button
                type="button"
                onClick={() => setInputs({ ...inputs, direction: "SHORT" })}
                className={`
                  flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2
                  ${inputs.direction === "SHORT"
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }
                `}
              >
                <ArrowDown size={18} />
                SHORT
              </button>
            </div>
          </div>

          {/* Entry Price */}
          <div className="space-y-2">
            <Label htmlFor="entryPrice">Entry Price</Label>
            <Input
              id="entryPrice"
              type="number"
              step="0.0001"
              value={inputs.entryPrice}
              onChange={(e) =>
                setInputs({ ...inputs, entryPrice: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          {/* Stop Loss */}
          <div className="space-y-2">
            <Label htmlFor="stopLoss" className="text-red-500">
              Stop Loss
            </Label>
            <Input
              id="stopLoss"
              type="number"
              step="0.0001"
              value={inputs.stopLoss}
              onChange={(e) =>
                setInputs({ ...inputs, stopLoss: parseFloat(e.target.value) || 0 })
              }
              className="border-red-200 dark:border-red-500/30"
            />
          </div>

          {/* Take Profit */}
          <div className="space-y-2">
            <Label htmlFor="takeProfit" className="text-green-500">
              Take Profit
            </Label>
            <Input
              id="takeProfit"
              type="number"
              step="0.0001"
              value={inputs.takeProfit}
              onChange={(e) =>
                setInputs({ ...inputs, takeProfit: parseFloat(e.target.value) || 0 })
              }
              className="border-green-200 dark:border-green-500/30"
            />
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white">
            Risk/Reward Analysis
          </h3>

          {result && (
            <div className="space-y-4">
              {/* Main Result */}
              <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl p-6 text-center">
                <p className="text-sm text-gray-500 mb-1">Risk : Reward</p>
                <p className="text-4xl font-black text-purple-500">
                  {result.rrString}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  {result.rrRatio >= 2
                    ? "✅ Good R:R ratio"
                    : result.rrRatio >= 1.5
                    ? "⚠️ Acceptable R:R"
                    : "❌ Poor R:R ratio"}
                </p>
              </div>

              {/* Visual Bar */}
              <div className="space-y-2">
                <div className="flex h-8 rounded-xl overflow-hidden">
                  <div
                    className="bg-red-500 flex items-center justify-center text-white text-xs font-bold"
                    style={{ width: `${barWidth.risk}%` }}
                  >
                    {result.riskPips.toFixed(1)} pips
                  </div>
                  <div
                    className="bg-green-500 flex items-center justify-center text-white text-xs font-bold"
                    style={{ width: `${barWidth.reward}%` }}
                  >
                    {result.rewardPips.toFixed(1)} pips
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Risk</span>
                  <span>Reward</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-4">
                  <p className="text-xs text-red-500">Risk (SL)</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {result.riskPips.toFixed(1)} pips
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-500/10 rounded-xl p-4">
                  <p className="text-xs text-green-500">Reward (TP)</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {result.rewardPips.toFixed(1)} pips
                  </p>
                </div>
              </div>

              {/* Breakeven Win Rate */}
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Breakeven Win Rate:</span>{" "}
                  <span className="font-bold text-gray-900 dark:text-white">
                    {result.winRateToBreakeven.toFixed(1)}%
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  You need to win at least {result.winRateToBreakeven.toFixed(1)}% of
                  trades to break even with this R:R ratio.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 4.5 Currency Pair Select Component

**File:** `src/components/calculator/CurrencyPairSelect.tsx`

```typescript
"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";

const CURRENCY_PAIRS = {
  "Major Pairs": [
    "EURUSD",
    "GBPUSD",
    "USDJPY",
    "USDCHF",
    "AUDUSD",
    "USDCAD",
    "NZDUSD",
  ],
  "Cross Pairs": [
    "EURGBP",
    "EURJPY",
    "GBPJPY",
    "AUDCAD",
    "AUDNZD",
    "EURAUD",
    "EURCHF",
  ],
  "Commodities": [
    "XAUUSD",
    "XAGUSD",
  ],
  "Indices": [
    "US30",
    "US100",
    "US500",
    "GER40",
    "UK100",
  ],
};

interface CurrencyPairSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function CurrencyPairSelect({ value, onChange }: CurrencyPairSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredPairs = Object.entries(CURRENCY_PAIRS).reduce(
    (acc, [category, pairs]) => {
      const filtered = pairs.filter((pair) =>
        pair.toLowerCase().includes(search.toLowerCase())
      );
      if (filtered.length > 0) {
        acc[category] = filtered;
      }
      return acc;
    },
    {} as Record<string, string[]>
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 font-medium"
      >
        <span>{value}</span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl max-h-80 overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-gray-100 dark:border-gray-800">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search pairs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-[#00C888]"
                />
              </div>
            </div>

            {/* Pairs List */}
            <div className="overflow-y-auto max-h-60">
              {Object.entries(filteredPairs).map(([category, pairs]) => (
                <div key={category}>
                  <p className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50">
                    {category}
                  </p>
                  {pairs.map((pair) => (
                    <button
                      key={pair}
                      type="button"
                      onClick={() => {
                        onChange(pair);
                        setIsOpen(false);
                        setSearch("");
                      }}
                      className={`
                        w-full text-left px-4 py-2.5 text-sm font-medium transition-colors
                        ${value === pair
                          ? "bg-[#00C888]/10 text-[#00C888]"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }
                      `}
                    >
                      {pair}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

---

## 5. Calculator Functions Library

**File:** `src/lib/calculators.ts`

```typescript
/**
 * Trading Calculators Library
 * All calculation functions for position sizing, risk, margin, etc.
 */

// Pip values per micro lot (1000 units) in USD
const PIP_VALUES: Record<string, number> = {
  EURUSD: 0.10,
  GBPUSD: 0.10,
  AUDUSD: 0.10,
  NZDUSD: 0.10,
  USDJPY: 0.09,
  USDCHF: 0.11,
  USDCAD: 0.08,
  EURJPY: 0.09,
  GBPJPY: 0.09,
  EURGBP: 0.13,
  AUDCAD: 0.08,
  XAUUSD: 1.00,
  XAGUSD: 0.50,
  US30: 1.00,
  US100: 1.00,
  US500: 1.00,
};

export function getPipValue(pair: string, accountCurrency: string = "USD"): number {
  return PIP_VALUES[pair.toUpperCase()] || 0.10;
}

export interface PositionSizeInput {
  accountBalance: number;
  riskPercent: number;
  stopLossPips: number;
  pair: string;
  accountCurrency: string;
}

export interface PositionSizeResult {
  lotSize: number;
  miniLots: number;
  microLots: number;
  units: number;
  riskAmount: number;
  pipValue: number;
}

export function calculatePositionSize(input: PositionSizeInput): PositionSizeResult {
  const { accountBalance, riskPercent, stopLossPips, pair, accountCurrency } = input;

  const riskAmount = accountBalance * (riskPercent / 100);
  const pipValuePerMicro = getPipValue(pair, accountCurrency);
  
  // Risk = Pips × Pip Value per Micro × Micro Lots
  // Micro Lots = Risk / (Pips × Pip Value per Micro)
  const microLots = riskAmount / (stopLossPips * pipValuePerMicro);
  const units = microLots * 1000;
  const lotSize = units / 100000;
  const miniLots = units / 10000;

  return {
    lotSize: Math.floor(lotSize * 100) / 100,
    miniLots: Math.floor(miniLots * 10) / 10,
    microLots: Math.floor(microLots),
    units: Math.floor(units),
    riskAmount,
    pipValue: pipValuePerMicro,
  };
}

export interface RiskRewardInput {
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  direction: "LONG" | "SHORT";
}

export interface RiskRewardResult {
  riskPips: number;
  rewardPips: number;
  rrRatio: number;
  rrString: string;
  winRateToBreakeven: number;
}

export function calculateRiskReward(input: RiskRewardInput): RiskRewardResult {
  const { entryPrice, stopLoss, takeProfit, direction } = input;

  let riskPips: number;
  let rewardPips: number;

  if (direction === "LONG") {
    riskPips = (entryPrice - stopLoss) * 10000;
    rewardPips = (takeProfit - entryPrice) * 10000;
  } else {
    riskPips = (stopLoss - entryPrice) * 10000;
    rewardPips = (entryPrice - takeProfit) * 10000;
  }

  const rrRatio = Math.abs(rewardPips) / Math.abs(riskPips);
  const winRateToBreakeven = (1 / (1 + rrRatio)) * 100;

  return {
    riskPips: Math.abs(riskPips),
    rewardPips: Math.abs(rewardPips),
    rrRatio: Math.round(rrRatio * 100) / 100,
    rrString: `1:${rrRatio.toFixed(1)}`,
    winRateToBreakeven: Math.round(winRateToBreakeven * 10) / 10,
  };
}

export interface MarginInput {
  lotSize: number;
  leverage: number;
  currentPrice: number;
}

export interface MarginResult {
  requiredMargin: number;
}

export function calculateMargin(input: MarginInput): MarginResult {
  const { lotSize, leverage, currentPrice } = input;
  const contractSize = 100000;
  const positionValue = lotSize * contractSize * currentPrice;
  const requiredMargin = positionValue / leverage;

  return {
    requiredMargin: Math.round(requiredMargin * 100) / 100,
  };
}

export interface ProfitLossInput {
  entryPrice: number;
  exitPrice: number;
  lotSize: number;
  direction: "LONG" | "SHORT";
  pair: string;
}

export interface ProfitLossResult {
  pips: number;
  profitLoss: number;
}

export function calculateProfitLoss(input: ProfitLossInput): ProfitLossResult {
  const { entryPrice, exitPrice, lotSize, direction, pair } = input;

  let pips: number;
  if (direction === "LONG") {
    pips = (exitPrice - entryPrice) * 10000;
  } else {
    pips = (entryPrice - exitPrice) * 10000;
  }

  // Pip value for standard lot = pip value per micro × 100
  const pipValuePerMicro = getPipValue(pair, "USD");
  const pipValuePerLot = pipValuePerMicro * 100;
  const profitLoss = pips * pipValuePerLot * lotSize;

  return {
    pips: Math.round(pips * 10) / 10,
    profitLoss: Math.round(profitLoss * 100) / 100,
  };
}
```

---

## 6. Files Summary

### Files to CREATE:

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `src/components/calculator/CalculatorHub.tsx` | Main container |
| 2 | `src/components/calculator/PositionSizeCalc.tsx` | Position size |
| 3 | `src/components/calculator/RiskRewardCalc.tsx` | R:R calculator |
| 4 | `src/components/calculator/PipValueCalc.tsx` | Pip value lookup |
| 5 | `src/components/calculator/MarginCalc.tsx` | Margin calculator |
| 6 | `src/components/calculator/ProfitLossCalc.tsx` | P/L calculator |
| 7 | `src/components/calculator/CurrencyPairSelect.tsx` | Pair dropdown |
| 8 | `src/components/calculator/index.ts` | Exports |

### Files to MODIFY:

| # | File Path | Change |
|---|-----------|--------|
| 1 | `src/lib/calculators.ts` | Add/update calculator functions |
| 2 | `src/app/dashboard/calculator/page.tsx` | Use new CalculatorHub |

---

## 7. Testing

**File:** `src/lib/calculators.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  calculatePositionSize,
  calculateRiskReward,
  calculateMargin,
  calculateProfitLoss,
} from './calculators';

describe('calculatePositionSize', () => {
  it('calculates correct lot size for 1% risk', () => {
    const result = calculatePositionSize({
      accountBalance: 10000,
      riskPercent: 1,
      stopLossPips: 50,
      pair: 'EURUSD',
      accountCurrency: 'USD',
    });

    expect(result.riskAmount).toBe(100);
    expect(result.microLots).toBe(20); // $100 / (50 pips × $0.10) = 20 micro lots
    expect(result.lotSize).toBe(0.2);  // 20 micro = 0.2 standard
  });

  it('calculates correct lot size for 2% risk', () => {
    const result = calculatePositionSize({
      accountBalance: 5000,
      riskPercent: 2,
      stopLossPips: 25,
      pair: 'EURUSD',
      accountCurrency: 'USD',
    });

    expect(result.riskAmount).toBe(100);
    expect(result.microLots).toBe(40);
    expect(result.lotSize).toBe(0.4);
  });
});

describe('calculateRiskReward', () => {
  it('calculates correct R:R for long trade', () => {
    const result = calculateRiskReward({
      entryPrice: 1.0850,
      stopLoss: 1.0800,
      takeProfit: 1.1000,
      direction: 'LONG',
    });

    expect(result.riskPips).toBe(50);
    expect(result.rewardPips).toBe(150);
    expect(result.rrRatio).toBe(3);
    expect(result.rrString).toBe('1:3.0');
  });

  it('calculates correct breakeven win rate', () => {
    const result = calculateRiskReward({
      entryPrice: 1.0850,
      stopLoss: 1.0800,
      takeProfit: 1.0950,
      direction: 'LONG',
    });

    // R:R = 2, breakeven = 1/(1+2) = 33.3%
    expect(result.rrRatio).toBe(2);
    expect(result.winRateToBreakeven).toBeCloseTo(33.3, 0);
  });
});

describe('calculateMargin', () => {
  it('calculates correct margin for 1:100 leverage', () => {
    const result = calculateMargin({
      lotSize: 1,
      leverage: 100,
      currentPrice: 1.0850,
    });

    // 1 lot × 100,000 × 1.0850 / 100 = $1,085
    expect(result.requiredMargin).toBe(1085);
  });
});

describe('calculateProfitLoss', () => {
  it('calculates profit for winning long trade', () => {
    const result = calculateProfitLoss({
      entryPrice: 1.0800,
      exitPrice: 1.0850,
      lotSize: 1,
      direction: 'LONG',
      pair: 'EURUSD',
    });

    expect(result.pips).toBe(50);
    expect(result.profitLoss).toBe(500); // 50 pips × $10 per pip
  });

  it('calculates loss for losing long trade', () => {
    const result = calculateProfitLoss({
      entryPrice: 1.0850,
      exitPrice: 1.0800,
      lotSize: 0.5,
      direction: 'LONG',
      pair: 'EURUSD',
    });

    expect(result.pips).toBe(-50);
    expect(result.profitLoss).toBe(-250);
  });
});
```

---

*Document End - Ready for Implementation*
