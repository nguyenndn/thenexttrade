import { useState } from "react";
import { TrendingUp, TrendingDown, Flame, Layers, GripHorizontal } from "lucide-react";
import Link from "next/link";
import { MetricHelp } from "@/components/metrics/MetricHelp";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export type HeroWidgetType =
  | "TOTAL_BALANCE"
  | "PERIOD_PNL"
  | "WIN_RATE"
  | "TRADE_SCORE"
  | "PROFIT_FACTOR"
  | "TOTAL_TRADES"
  | "AVG_WIN"
  | "AVG_LOSS"
  | "STREAK"
  | "AVG_RR"
  | "EXPECTANCY"
  | "FEES"
  | "MAX_WIN"
  | "MAX_LOSS";

interface DashboardHeroProps {
  data: any; // DashboardPageData from server
  isEditable?: boolean;
  heroWidgets?: HeroWidgetType[];
  onHeroWidgetChange?: (index: number, newType: HeroWidgetType) => void;
  onHeroWidgetsReorder?: (newWidgets: HeroWidgetType[]) => void;
}

const HERO_WIDGETS_CONFIG: Record<HeroWidgetType, { label: string; metricId: string }> = {
  TOTAL_BALANCE: { label: "Total Balance", metricId: "totalBalance" },
  PERIOD_PNL: { label: "Period P&L", metricId: "periodPnL" },
  WIN_RATE: { label: "Win Rate", metricId: "winRate" },
  TRADE_SCORE: { label: "Trade Score", metricId: "tradeScore" },
  PROFIT_FACTOR: { label: "Profit Factor", metricId: "profitFactor" },
  TOTAL_TRADES: { label: "Total Trades", metricId: "totalTrades" },
  AVG_WIN: { label: "Avg Win", metricId: "avgWin" },
  AVG_LOSS: { label: "Avg Loss", metricId: "avgLoss" },
  STREAK: { label: "Active Streak", metricId: "streak" },
  AVG_RR: { label: "Avg R:R", metricId: "avgRR" },
  EXPECTANCY: { label: "Expectancy", metricId: "expectancy" },
  FEES: { label: "Broker Fees", metricId: "fees" },
  MAX_WIN: { label: "Max Win", metricId: "maxWin" },
  MAX_LOSS: { label: "Max Loss", metricId: "maxLoss" },
};

function getScoreColor(score: number) {
  if (score >= 80) return "hsl(160, 84%, 39%)"; // emerald
  if (score >= 60) return "hsl(var(--primary))"; // primary
  if (score >= 40) return "hsl(38, 92%, 50%)"; // amber
  return "hsl(0, 72%, 51%)"; // red
}

export function DashboardHero({ data, isEditable = false, heroWidgets = ["TOTAL_BALANCE", "PERIOD_PNL", "WIN_RATE", "TRADE_SCORE"], onHeroWidgetChange, onHeroWidgetsReorder }: DashboardHeroProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!isEditable) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!isEditable) return;
    e.preventDefault();
    
    if (draggedIndex !== null && draggedIndex !== index) {
      const updated = [...heroWidgets];
      const temp = updated[draggedIndex];
      updated[draggedIndex] = updated[index];
      updated[index] = temp;
      onHeroWidgetsReorder?.(updated);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Extracted values
  const totalBalance = data.dashboardData.totalBalance;
  const periodPnL = data.dashboardData.periodPnL;
  const winRate = data.dashboardData.winRate;
  const tradeScore = data.tradeScore;
  const profitFactor = data.dashboardData.profitFactor;
  const avgWin = data.dashboardData.avgWin;
  const avgLoss = data.dashboardData.avgLoss;
  const streak = data.dashboardData.streak;
  const totalTrades = data.dashboardData.totalTrades !== undefined 
    ? data.dashboardData.totalTrades 
    : (data.dashboardData.winCount + data.dashboardData.lossCount + data.dashboardData.breakEvenCount);

  // New calculated stats
  const commission = data.dashboardData.commission || 0;
  const swap = data.dashboardData.swap || 0;
  const maxWin = data.dashboardData.maxWin || 0;
  const maxLoss = data.dashboardData.maxLoss || 0;
  const fees = commission + swap;
  const expectancy = totalTrades > 0 ? periodPnL / totalTrades : 0;
  const avgRR = avgLoss > 0 ? avgWin / avgLoss : 0;

  const scoreColor = tradeScore !== null ? getScoreColor(tradeScore) : "transparent";

  const renderWidgetContent = (type: HeroWidgetType) => {
    switch (type) {
      case "TOTAL_BALANCE":
        return (
          <>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalBalance)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Live + Funded</p>
          </>
        );
      case "PERIOD_PNL":
        return (
          <>
            <div className="flex items-center justify-center gap-2">
              {periodPnL >= 0
                ? <TrendingUp size={20} className="text-emerald-500" />
                : <TrendingDown size={20} className="text-red-500" />
              }
              <p className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-tight ${
                periodPnL >= 0 ? 'text-emerald-500' : 'text-red-500'
              }`}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', signDisplay: 'always' }).format(periodPnL)}
              </p>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Realized P&L</p>
          </>
        );
      case "WIN_RATE":
        return (
          <>
            <div className="flex items-center justify-center gap-3">
              <div className="relative w-14 h-14">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)"} strokeWidth="4" fill="none" />
                  <circle
                    cx="28" cy="28" r="24"
                    stroke="hsl(38, 92%, 50%)"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(winRate / 100) * 150.8} 150.8`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-gray-700 dark:text-white">
                  {winRate.toFixed(0)}%
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Winning trades</p>
          </>
        );
      case "TRADE_SCORE":
        return (
          <>
            <div className="flex items-center justify-center gap-3">
              <div className="relative w-14 h-14">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)"} strokeWidth="4" fill="none" />
                  {tradeScore !== null && (
                    <circle
                      cx="28" cy="28" r="24"
                      stroke={scoreColor}
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${(tradeScore / 100) * 150.8} 150.8`}
                    />
                  )}
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-gray-700 dark:text-white">
                  {tradeScore !== null ? tradeScore : "--"}
                </span>
              </div>
            </div>
            <Link href="/dashboard/intelligence" className="text-xs text-gray-600 dark:text-gray-300 mt-1 hover:text-amber-500 dark:hover:text-amber-400 transition-colors inline-block font-semibold">
              {tradeScore !== null ? "View Details →" : "Need 30+ trades"}
            </Link>
          </>
        );
      case "PROFIT_FACTOR":
        const pfColor = profitFactor >= 2.0 ? "text-emerald-500" : profitFactor >= 1.0 ? "text-amber-500" : "text-red-500";
        return (
          <>
            <p className={cn("text-xl sm:text-2xl lg:text-3xl font-black tracking-tight", pfColor)}>
              {profitFactor > 0 ? profitFactor.toFixed(2) : "--"}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Gross Profit / Loss</p>
          </>
        );
      case "TOTAL_TRADES":
        return (
          <>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
              {totalTrades}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Trades Executed</p>
          </>
        );
      case "AVG_WIN":
        return (
          <>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-emerald-500">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(avgWin)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Per winning trade</p>
          </>
        );
      case "AVG_LOSS":
        return (
          <>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-red-500">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(-Math.abs(avgLoss))}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Per losing trade</p>
          </>
        );
      case "STREAK":
        return (
          <>
            <div className="flex items-center justify-center gap-2">
              <Flame size={24} className="text-orange-500 fill-orange-500" />
              <p className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-orange-500">
                {streak} Days
              </p>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Daily active streak</p>
          </>
        );
      case "AVG_RR":
        const rrColor = avgRR >= 2.0 ? "text-emerald-500" : avgRR >= 1.0 ? "text-amber-500" : "text-red-500";
        return (
          <>
            <p className={cn("text-xl sm:text-2xl lg:text-3xl font-black tracking-tight", rrColor)}>
              {avgRR > 0 ? `1:${avgRR.toFixed(2)}` : "--"}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Average Risk:Reward</p>
          </>
        );
      case "EXPECTANCY":
        const expColor = expectancy >= 0 ? "text-emerald-500" : "text-red-500";
        return (
          <>
            <p className={cn("text-xl sm:text-2xl lg:text-3xl font-black tracking-tight", expColor)}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', signDisplay: 'always' }).format(expectancy)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Expectancy per trade</p>
          </>
        );
      case "FEES":
        return (
          <>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-red-500">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(-Math.abs(fees))}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Commission + Swap</p>
          </>
        );
      case "MAX_WIN":
        return (
          <>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-emerald-500">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(maxWin)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Single best trade</p>
          </>
        );
      case "MAX_LOSS":
        return (
          <>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-red-500">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(-Math.abs(maxLoss))}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Single worst trade</p>
          </>
        );
    }
  };

  return (
    <div id="onborda-hero" className="relative overflow-hidden rounded-xl bg-gradient-to-r from-white to-gray-50 dark:from-[#0B0E14] dark:to-[#131720] border border-gray-200 dark:border-[#382F1D] px-4 py-3 sm:px-6 sm:py-4 shadow-lg">
      {/* Glow effects */}
      <div className="absolute top-0 left-1/4 w-40 h-40 bg-amber-500/10 dark:bg-amber-500/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-yellow-500/10 dark:bg-yellow-500/15 rounded-full blur-[60px] pointer-events-none" />

      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {heroWidgets.map((type, idx) => {
          const config = HERO_WIDGETS_CONFIG[type];
          return (
            <div 
              key={idx} 
              draggable={isEditable}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={cn(
                "text-center relative group/hero-card rounded-lg transition-all duration-300 outline outline-2 outline-dashed",
                isEditable 
                  ? "outline-amber-500/40 p-2 bg-amber-500/[0.02] -m-2 cursor-grab active:cursor-grabbing" 
                  : "outline-amber-500/0",
                draggedIndex === idx && "opacity-40 scale-[0.98] outline-amber-500 bg-amber-500/5",
                idx > 0 && "border-l-0 lg:border-l border-gray-200 dark:border-gray-800"
              )}
            >
              <div className="mb-1.5 flex items-center justify-center gap-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  {config.label}
                </p>
                <MetricHelp metricId={config.metricId as any} />
                
                {/* Drag Handle & Swap Trigger dropdown visible in edit mode */}
                {isEditable && (
                  <div className="flex items-center gap-1">
                    <div 
                      className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400 hover:bg-slate-500/20 active:scale-95 transition-all shadow-sm cursor-grab active:cursor-grabbing"
                      title="Drag to Reorder"
                    >
                      <GripHorizontal size={13} />
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button 
                          className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 active:scale-95 transition-all shadow-sm"
                          title="Swap Metric"
                        >
                          <Layers size={13} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        align="center" 
                        className="w-48 bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-[#382F1D] rounded-xl shadow-lg p-1"
                      >
                        {Object.entries(HERO_WIDGETS_CONFIG).map(([wKey, wVal]) => (
                          <DropdownMenuItem
                            key={wKey}
                            onClick={() => onHeroWidgetChange?.(idx, wKey as HeroWidgetType)}
                            className={cn(
                              "cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium my-0.5",
                              type === wKey 
                                ? "bg-amber-500/10 text-amber-500 font-bold" 
                                : "text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/5"
                            )}
                          >
                            {wVal.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
              
              <div className="h-16 flex flex-col items-center justify-center">
                {renderWidgetContent(type)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
