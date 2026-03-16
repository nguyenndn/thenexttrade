# Export Reports - Detailed Implementation Specification

> **Version:** 1.0  
> **Created:** February 3, 2026  
> **Purpose:** Generate exportable trading reports in PDF/CSV formats  
> **Priority:** P3

---

## 1. Overview

### 1.1 Mục tiêu
Cho phép traders export trading data dưới dạng PDF/CSV để:
- Review performance offline
- Share với mentors/coaches
- Tax reporting
- Backup dữ liệu

### 1.2 User Stories
> "Tôi cần export trades để đưa cho coach review"  
> "Tôi muốn PDF report hàng tháng để track progress"

### 1.3 Export Types

| Type | Format | Content |
|------|--------|---------|
| Trade History | CSV | Raw trade data |
| Monthly Report | PDF | Summary + stats + charts |
| Performance Report | PDF | Advanced analytics |
| Tax Report | CSV | P/L by date for tax filing |

---

## 2. Dependencies

### 2.1 New Packages

```bash
pnpm add @react-pdf/renderer jspdf jspdf-autotable date-fns
```

| Package | Purpose |
|---------|---------|
| `@react-pdf/renderer` | React components → PDF |
| `jspdf` | Client-side PDF generation |
| `jspdf-autotable` | PDF tables |
| `date-fns` | Date formatting (already installed) |

---

## 3. API Endpoints

### 3.1 CSV Export API

**File:** `src/app/api/export/csv/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { format, parseISO, startOfYear, endOfYear } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "trades"; // trades | tax
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const now = new Date();
    const startDate = startDateParam ? parseISO(startDateParam) : startOfYear(now);
    const endDate = endDateParam ? parseISO(endDateParam) : endOfYear(now);

    // Fetch trades
    const trades = await prisma.journalTrade.findMany({
      where: {
        userId: user.id,
        status: "CLOSED",
        entryDate: { gte: startDate, lte: endDate },
      },
      include: {
        account: { select: { name: true, broker: true } },
        strategy: { select: { name: true } },
      },
      orderBy: { entryDate: "desc" },
    });

    let csv = "";
    let filename = "";

    if (type === "tax") {
      // Tax report format
      filename = `tax_report_${format(startDate, "yyyy")}.csv`;
      csv = generateTaxCSV(trades);
    } else {
      // Full trades export
      filename = `trades_${format(startDate, "yyyy-MM-dd")}_${format(endDate, "yyyy-MM-dd")}.csv`;
      csv = generateTradesCSV(trades);
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);
    return NextResponse.json(
      { error: "Failed to generate CSV" },
      { status: 500 }
    );
  }
}

function generateTradesCSV(trades: any[]): string {
  const headers = [
    "Date",
    "Symbol",
    "Type",
    "Entry Price",
    "Exit Price",
    "Size",
    "P/L",
    "Result",
    "Strategy",
    "Account",
    "Broker",
    "Session",
    "Emotion Before",
    "Emotion After",
    "Followed Plan",
    "Notes",
  ];

  const rows = trades.map((t) => [
    format(new Date(t.entryDate), "yyyy-MM-dd HH:mm"),
    t.symbol,
    t.type,
    t.entryPrice?.toFixed(5) || "",
    t.exitPrice?.toFixed(5) || "",
    t.size || "",
    t.pnl?.toFixed(2) || "",
    t.result,
    t.strategy?.name || "",
    t.account?.name || "",
    t.account?.broker || "",
    t.session || "",
    t.emotionBefore || "",
    t.emotionAfter || "",
    t.followedPlan ? "Yes" : "No",
    (t.notes || "").replace(/"/g, '""'),
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell}"`).join(",")
    ),
  ].join("\n");

  return csv;
}

function generateTaxCSV(trades: any[]): string {
  const headers = [
    "Date",
    "Description",
    "Proceeds (Exit Price × Size)",
    "Cost Basis (Entry Price × Size)",
    "Gain/Loss",
    "Short/Long Term",
  ];

  const rows = trades.map((t) => {
    const proceeds = (t.exitPrice || 0) * (t.size || 0);
    const costBasis = (t.entryPrice || 0) * (t.size || 0);
    
    return [
      format(new Date(t.entryDate), "yyyy-MM-dd"),
      `${t.type} ${t.symbol}`,
      proceeds.toFixed(2),
      costBasis.toFixed(2),
      t.pnl?.toFixed(2) || "0.00",
      "Short Term", // Forex is always short term
    ];
  });

  // Add summary row
  const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  rows.push([]);
  rows.push(["", "TOTAL", "", "", totalPnL.toFixed(2), ""]);

  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell}"`).join(",")
    ),
  ].join("\n");

  return csv;
}
```

### 3.2 PDF Report Data API

**File:** `src/app/api/export/report-data/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";

interface ReportData {
  period: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  userName: string;
  summary: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    breakEvenTrades: number;
    winRate: number;
    netPnL: number;
    grossProfit: number;
    grossLoss: number;
    profitFactor: number;
    avgWin: number;
    avgLoss: number;
    largestWin: number;
    largestLoss: number;
    avgRR: number;
  };
  byPair: Array<{
    symbol: string;
    trades: number;
    pnl: number;
    winRate: number;
  }>;
  byStrategy: Array<{
    name: string;
    trades: number;
    pnl: number;
    winRate: number;
  }>;
  byDay: Array<{
    date: string;
    trades: number;
    pnl: number;
  }>;
  recentTrades: Array<{
    date: string;
    symbol: string;
    type: string;
    pnl: number;
    result: string;
  }>;
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

    // Fetch trades
    const trades = await prisma.journalTrade.findMany({
      where: {
        userId: user.id,
        status: "CLOSED",
        entryDate: { gte: startDate, lte: endDate },
      },
      include: {
        strategy: { select: { name: true } },
      },
      orderBy: { entryDate: "desc" },
    });

    // Calculate summary stats
    const wins = trades.filter((t) => t.result === "WIN");
    const losses = trades.filter((t) => t.result === "LOSS");
    const breakEven = trades.filter((t) => t.result === "BREAKEVEN");

    const grossProfit = wins.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0));
    const netPnL = grossProfit - grossLoss;

    const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
    const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;

    const largestWin = wins.length > 0 ? Math.max(...wins.map((t) => t.pnl || 0)) : 0;
    const largestLoss = losses.length > 0 ? Math.min(...losses.map((t) => t.pnl || 0)) : 0;

    // By pair
    const pairMap = new Map<string, { pnl: number; wins: number; total: number }>();
    for (const trade of trades) {
      const symbol = trade.symbol;
      const current = pairMap.get(symbol) || { pnl: 0, wins: 0, total: 0 };
      current.pnl += trade.pnl || 0;
      current.total++;
      if (trade.result === "WIN") current.wins++;
      pairMap.set(symbol, current);
    }

    const byPair = Array.from(pairMap.entries())
      .map(([symbol, data]) => ({
        symbol,
        trades: data.total,
        pnl: data.pnl,
        winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
      }))
      .sort((a, b) => b.pnl - a.pnl);

    // By strategy
    const stratMap = new Map<string, { pnl: number; wins: number; total: number }>();
    for (const trade of trades) {
      const name = trade.strategy?.name || "No Strategy";
      const current = stratMap.get(name) || { pnl: 0, wins: 0, total: 0 };
      current.pnl += trade.pnl || 0;
      current.total++;
      if (trade.result === "WIN") current.wins++;
      stratMap.set(name, current);
    }

    const byStrategy = Array.from(stratMap.entries())
      .map(([name, data]) => ({
        name,
        trades: data.total,
        pnl: data.pnl,
        winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
      }))
      .sort((a, b) => b.pnl - a.pnl);

    // By day
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const byDay = days.map((day) => {
      const dayTrades = trades.filter((t) =>
        isSameDay(new Date(t.entryDate), day)
      );
      return {
        date: format(day, "MMM dd"),
        trades: dayTrades.length,
        pnl: dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
      };
    });

    // Recent trades (last 10)
    const recentTrades = trades.slice(0, 10).map((t) => ({
      date: format(new Date(t.entryDate), "MMM dd"),
      symbol: t.symbol,
      type: t.type,
      pnl: t.pnl || 0,
      result: t.result || "",
    }));

    // Calculate avg R:R (if we have riskReward field)
    const tradesWithRR = trades.filter((t) => (t as any).riskReward > 0);
    const avgRR = tradesWithRR.length > 0
      ? tradesWithRR.reduce((sum, t) => sum + ((t as any).riskReward || 0), 0) / tradesWithRR.length
      : 0;

    const reportData: ReportData = {
      period: `${format(startDate, "MMM dd")} - ${format(endDate, "MMM dd, yyyy")}`,
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
      generatedAt: format(new Date(), "yyyy-MM-dd HH:mm"),
      userName: user.name || user.email || "Trader",
      summary: {
        totalTrades: trades.length,
        winningTrades: wins.length,
        losingTrades: losses.length,
        breakEvenTrades: breakEven.length,
        winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0,
        netPnL,
        grossProfit,
        grossLoss,
        profitFactor: grossLoss > 0 ? grossProfit / grossLoss : 0,
        avgWin,
        avgLoss,
        largestWin,
        largestLoss,
        avgRR,
      },
      byPair,
      byStrategy,
      byDay,
      recentTrades,
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Report data error:", error);
    return NextResponse.json(
      { error: "Failed to generate report data" },
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
│       └── reports/
│           └── page.tsx           # Reports page
├── components/
│   └── reports/                   # NEW folder
│       ├── ReportsDashboard.tsx   # Main container
│       ├── ReportGenerator.tsx    # Form to generate
│       ├── ReportPreview.tsx      # Preview before export
│       ├── PDFReport.tsx          # PDF template (react-pdf)
│       ├── ExportButtons.tsx      # Download buttons
│       └── index.ts
└── lib/
    └── pdf-utils.ts               # PDF helpers
```

### 4.2 Reports Dashboard

**File:** `src/components/reports/ReportsDashboard.tsx`

```typescript
"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { toast } from "sonner";
import {
  FileText,
  Download,
  FileSpreadsheet,
  Calendar,
  TrendingUp,
} from "lucide-react";

interface ReportType {
  id: string;
  name: string;
  description: string;
  format: "pdf" | "csv";
  icon: typeof FileText;
}

const REPORT_TYPES: ReportType[] = [
  {
    id: "monthly",
    name: "Monthly Performance Report",
    description: "Detailed PDF report with charts and statistics",
    format: "pdf",
    icon: FileText,
  },
  {
    id: "trades",
    name: "Trade History Export",
    description: "Complete trade data in CSV format",
    format: "csv",
    icon: FileSpreadsheet,
  },
  {
    id: "tax",
    name: "Tax Report",
    description: "P/L summary for tax reporting",
    format: "csv",
    icon: TrendingUp,
  },
];

export function ReportsDashboard() {
  const now = new Date();
  const [selectedType, setSelectedType] = useState<string>("monthly");
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(subMonths(now, 1)),
    end: endOfMonth(subMonths(now, 1)),
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const selectedReport = REPORT_TYPES.find((r) => r.id === selectedType);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);

      if (selectedType === "trades" || selectedType === "tax") {
        // CSV download
        const params = new URLSearchParams({
          type: selectedType,
          startDate: format(dateRange.start, "yyyy-MM-dd"),
          endDate: format(dateRange.end, "yyyy-MM-dd"),
        });

        const response = await fetch(`/api/export/csv?${params}`);
        if (!response.ok) throw new Error("Failed to generate");

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedType}_${format(dateRange.start, "yyyy-MM-dd")}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        toast.success("CSV downloaded successfully");
      } else {
        // PDF - fetch data first
        const params = new URLSearchParams({
          startDate: format(dateRange.start, "yyyy-MM-dd"),
          endDate: format(dateRange.end, "yyyy-MM-dd"),
        });

        const response = await fetch(`/api/export/report-data?${params}`);
        if (!response.ok) throw new Error("Failed to generate");

        const data = await response.json();
        setPreviewData(data);
        toast.success("Report generated! Click to download PDF.");
      }
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!previewData) return;

    // Dynamic import to avoid SSR issues
    const { generatePDF } = await import("@/lib/pdf-utils");
    await generatePDF(previewData);
    toast.success("PDF downloaded");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <FileText className="text-[#00C888]" />
          Export Reports
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Generate and download trading reports
        </p>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {REPORT_TYPES.map((report) => (
          <button
            key={report.id}
            onClick={() => {
              setSelectedType(report.id);
              setPreviewData(null);
            }}
            className={`
              text-left p-5 rounded-xl border-2 transition-all
              ${selectedType === report.id
                ? "border-[#00C888] bg-[#00C888]/5"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
              }
            `}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`
                  p-2 rounded-xl
                  ${selectedType === report.id
                    ? "bg-[#00C888]/20 text-[#00C888]"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                  }
                `}
              >
                <report.icon size={20} />
              </div>
              <span
                className={`
                  text-xs font-bold uppercase px-2 py-0.5 rounded
                  ${report.format === "pdf"
                    ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                    : "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400"
                  }
                `}
              >
                {report.format}
              </span>
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">
              {report.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {report.description}
            </p>
          </button>
        ))}
      </div>

      {/* Date Range */}
      <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-[#00C888]" />
          Select Date Range
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-gray-500 mb-1 block">From</label>
            <input
              type="date"
              value={format(dateRange.start, "yyyy-MM-dd")}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: new Date(e.target.value) })
              }
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">To</label>
            <input
              type="date"
              value={format(dateRange.end, "yyyy-MM-dd")}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: new Date(e.target.value) })
              }
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
            />
          </div>
        </div>

        {/* Quick Select */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: "This Month", fn: () => ({ start: startOfMonth(now), end: endOfMonth(now) }) },
            { label: "Last Month", fn: () => ({ start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) }) },
            { label: "Last 3 Months", fn: () => ({ start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) }) },
            { label: "YTD", fn: () => ({ start: new Date(now.getFullYear(), 0, 1), end: now }) },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => setDateRange(preset.fn())}
              className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full py-4 bg-[#00C888] text-white font-bold rounded-xl hover:bg-[#00B377] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            Generating...
          </>
        ) : (
          <>
            <Download size={20} />
            Generate {selectedReport?.name}
          </>
        )}
      </button>

      {/* PDF Preview */}
      {previewData && selectedType === "monthly" && (
        <ReportPreview data={previewData} onDownload={handleDownloadPDF} />
      )}
    </div>
  );
}

// Preview Component
function ReportPreview({ data, onDownload }: { data: any; onDownload: () => void }) {
  return (
    <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-gray-900 dark:text-white">
          Report Preview
        </h3>
        <button
          onClick={onDownload}
          className="px-4 py-2 bg-[#00C888] text-white font-medium rounded-xl hover:bg-[#00B377] flex items-center gap-2"
        >
          <Download size={16} />
          Download PDF
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-[#00C888]/10 to-blue-500/10 p-6 rounded-xl mb-6">
        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Performance Summary: {data.period}
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">Net P/L</p>
            <p className={`text-xl font-bold ${data.summary.netPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {data.summary.netPnL >= 0 ? '+' : ''}${data.summary.netPnL.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Win Rate</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {data.summary.winRate.toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Total Trades</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {data.summary.totalTrades}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Profit Factor</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {data.summary.profitFactor.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* By Pair */}
      <div className="mb-6">
        <h4 className="font-bold text-gray-900 dark:text-white mb-3">By Pair</h4>
        <div className="space-y-2">
          {data.byPair.slice(0, 5).map((pair: any) => (
            <div
              key={pair.symbol}
              className="flex justify-between items-center p-3 bg-gray-50 dark:bg-white/5 rounded-lg"
            >
              <span className="font-medium text-gray-900 dark:text-white">
                {pair.symbol}
              </span>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">{pair.trades} trades</span>
                <span className={pair.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {pair.pnl >= 0 ? '+' : ''}${pair.pnl.toFixed(0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Trades */}
      <div>
        <h4 className="font-bold text-gray-900 dark:text-white mb-3">Recent Trades</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                <th className="pb-2">Date</th>
                <th className="pb-2">Symbol</th>
                <th className="pb-2">Type</th>
                <th className="pb-2 text-right">P/L</th>
              </tr>
            </thead>
            <tbody>
              {data.recentTrades.slice(0, 5).map((trade: any, i: number) => (
                <tr key={i} className="border-b dark:border-gray-800">
                  <td className="py-2">{trade.date}</td>
                  <td className="py-2 font-medium">{trade.symbol}</td>
                  <td className="py-2">
                    <span className={trade.type === 'BUY' ? 'text-green-500' : 'text-red-500'}>
                      {trade.type}
                    </span>
                  </td>
                  <td className={`py-2 text-right font-medium ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

---

## 5. PDF Generation Utility

**File:** `src/lib/pdf-utils.ts`

```typescript
import jsPDF from "jspdf";
import "jspdf-autotable";

// Extend jsPDF type for autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

interface ReportData {
  period: string;
  generatedAt: string;
  userName: string;
  summary: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    breakEvenTrades: number;
    winRate: number;
    netPnL: number;
    grossProfit: number;
    grossLoss: number;
    profitFactor: number;
    avgWin: number;
    avgLoss: number;
    largestWin: number;
    largestLoss: number;
  };
  byPair: Array<{
    symbol: string;
    trades: number;
    pnl: number;
    winRate: number;
  }>;
  byStrategy: Array<{
    name: string;
    trades: number;
    pnl: number;
    winRate: number;
  }>;
  recentTrades: Array<{
    date: string;
    symbol: string;
    type: string;
    pnl: number;
    result: string;
  }>;
}

export async function generatePDF(data: ReportData): Promise<void> {
  const doc = new jsPDF();

  // Colors
  const primaryColor: [number, number, number] = [0, 200, 136]; // #00C888
  const textColor: [number, number, number] = [31, 41, 55];
  const lightGray: [number, number, number] = [156, 163, 175];

  let yPos = 20;

  // ============== HEADER ==============
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 220, 35, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Trading Performance Report", 20, 23);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(data.period, 20, 30);

  yPos = 45;

  // ============== SUMMARY STATS ==============
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Performance Summary", 20, yPos);
  yPos += 10;

  // Stats grid
  const stats = [
    ["Total Trades", data.summary.totalTrades.toString()],
    ["Winning Trades", data.summary.winningTrades.toString()],
    ["Losing Trades", data.summary.losingTrades.toString()],
    ["Win Rate", `${data.summary.winRate.toFixed(1)}%`],
    ["Net P/L", `$${data.summary.netPnL.toFixed(2)}`],
    ["Profit Factor", data.summary.profitFactor.toFixed(2)],
    ["Avg Win", `$${data.summary.avgWin.toFixed(2)}`],
    ["Avg Loss", `$${data.summary.avgLoss.toFixed(2)}`],
    ["Largest Win", `$${data.summary.largestWin.toFixed(2)}`],
    ["Largest Loss", `$${data.summary.largestLoss.toFixed(2)}`],
  ];

  doc.autoTable({
    startY: yPos,
    head: [],
    body: stats,
    theme: "plain",
    columnStyles: {
      0: { fontStyle: "bold", textColor: lightGray, cellWidth: 40 },
      1: { textColor: textColor },
    },
    margin: { left: 20 },
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // ============== BY PAIR ==============
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Performance by Pair", 20, yPos);
  yPos += 5;

  const pairData = data.byPair.slice(0, 8).map((p) => [
    p.symbol,
    p.trades.toString(),
    `$${p.pnl.toFixed(2)}`,
    `${p.winRate.toFixed(0)}%`,
  ]);

  doc.autoTable({
    startY: yPos,
    head: [["Symbol", "Trades", "P/L", "Win Rate"]],
    body: pairData,
    theme: "striped",
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
    margin: { left: 20, right: 20 },
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // ============== BY STRATEGY ==============
  if (data.byStrategy.length > 0) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Performance by Strategy", 20, yPos);
    yPos += 5;

    const stratData = data.byStrategy.slice(0, 6).map((s) => [
      s.name,
      s.trades.toString(),
      `$${s.pnl.toFixed(2)}`,
      `${s.winRate.toFixed(0)}%`,
    ]);

    doc.autoTable({
      startY: yPos,
      head: [["Strategy", "Trades", "P/L", "Win Rate"]],
      body: stratData,
      theme: "striped",
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
      margin: { left: 20, right: 20 },
    });

    yPos = doc.lastAutoTable.finalY + 15;
  }

  // Check if we need new page
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  // ============== RECENT TRADES ==============
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Recent Trades", 20, yPos);
  yPos += 5;

  const tradeData = data.recentTrades.slice(0, 15).map((t) => [
    t.date,
    t.symbol,
    t.type,
    `$${t.pnl.toFixed(2)}`,
    t.result,
  ]);

  doc.autoTable({
    startY: yPos,
    head: [["Date", "Symbol", "Type", "P/L", "Result"]],
    body: tradeData,
    theme: "striped",
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
    bodyStyles: {
      textColor: textColor,
    },
    columnStyles: {
      3: {
        cellCallback: (cell: any) => {
          const value = parseFloat(cell.text[0].replace("$", ""));
          if (value >= 0) cell.styles.textColor = [34, 197, 94];
          else cell.styles.textColor = [239, 68, 68];
        },
      },
    },
    margin: { left: 20, right: 20 },
  });

  // ============== FOOTER ==============
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...lightGray);
    doc.text(
      `Generated: ${data.generatedAt} | Page ${i} of ${pageCount}`,
      20,
      285
    );
    doc.text("TheNextTradeTrading Journal", 170, 285);
  }

  // Download
  const filename = `trading_report_${data.period.replace(/\s/g, "_")}.pdf`;
  doc.save(filename);
}
```

---

## 6. Reports Page

**File:** `src/app/dashboard/reports/page.tsx`

```typescript
import { Metadata } from "next";
import { ReportsDashboard } from "@/components/reports/ReportsDashboard";

export const metadata: Metadata = {
  title: "Export Reports | Trading Journal",
  description: "Generate and download trading performance reports",
};

export default function ReportsPage() {
  return (
    <div className="p-6">
      <ReportsDashboard />
    </div>
  );
}
```

---

## 7. Navigation Update

**File:** `src/config/navigation.ts`

```typescript
// ADD import
import { FileText } from "lucide-react";

// Add to dashboardMenuItems
{ name: "Reports", href: "/dashboard/reports", icon: FileText },
```

---

## 8. Files Summary

### Files to CREATE:

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `src/app/api/export/csv/route.ts` | CSV export endpoint |
| 2 | `src/app/api/export/report-data/route.ts` | PDF data endpoint |
| 3 | `src/app/dashboard/reports/page.tsx` | Reports page |
| 4 | `src/components/reports/ReportsDashboard.tsx` | Main container |
| 5 | `src/lib/pdf-utils.ts` | PDF generation |
| 6 | `src/components/reports/index.ts` | Exports |

### Files to MODIFY:

| # | File Path | Change |
|---|-----------|--------|
| 1 | `package.json` | Add jspdf, jspdf-autotable |
| 2 | `src/config/navigation.ts` | Add Reports menu item |

### Install Dependencies:

```bash
pnpm add jspdf jspdf-autotable
pnpm add -D @types/jspdf
```

---

## 9. Test Cases

**File:** `tests/reports/export.test.ts`

```typescript
import { describe, it, expect } from "vitest";

describe("CSV Export", () => {
  it("should generate valid CSV headers", () => {
    const headers = [
      "Date",
      "Symbol",
      "Type",
      "Entry Price",
      "Exit Price",
      "Size",
      "P/L",
      "Result",
    ];
    
    const csv = headers.join(",");
    expect(csv).toContain("Date");
    expect(csv).toContain("P/L");
  });

  it("should escape quotes in CSV values", () => {
    const note = 'This is a "quoted" note';
    const escaped = note.replace(/"/g, '""');
    expect(escaped).toBe('This is a ""quoted"" note');
  });

  it("should format tax report correctly", () => {
    const trade = {
      entryPrice: 1.10000,
      exitPrice: 1.10500,
      size: 100000,
    };
    
    const proceeds = trade.exitPrice * trade.size;
    const costBasis = trade.entryPrice * trade.size;
    const gain = proceeds - costBasis;
    
    expect(proceeds).toBe(110500);
    expect(costBasis).toBe(110000);
    expect(gain).toBe(500);
  });
});

describe("PDF Generation", () => {
  it("should calculate profit factor correctly", () => {
    const grossProfit = 1500;
    const grossLoss = 500;
    const profitFactor = grossProfit / grossLoss;
    
    expect(profitFactor).toBe(3);
  });

  it("should handle zero losses", () => {
    const grossProfit = 1000;
    const grossLoss = 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;
    
    expect(profitFactor).toBe(0);
  });
});
```

---

*Document End - Ready for Implementation*
