"use client";

import React, { useState, useMemo } from "react";
import { 
  Bot, 
  SlidersHorizontal, 
  Wrench, 
  DollarSign, 
  Percent, 
  ShieldAlert, 
  TrendingUp, 
  Activity, 
  Sparkles, 
  Info,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface TradingSystemsSimulatorProps {
  initialSlug?: string;
}

// Backtest monthly percentage points for each system (representing a realistic volatility flow)
const BACKTEST_PROFILES = {
  goldscalperninja: [0, 4.2, 8.5, 6.1, 12.4, 15.8, 18.2, 14.5, 22.1, 26.4, 29.8, 35.5],
  "trade-manager": [0, 3.1, 7.2, 5.5, 9.8, 12.4, 14.8, 11.2, 16.5, 19.8, 22.4, 27.2],
  "partner-ea-toolkit": [0, 2.5, 5.8, 4.1, 8.2, 10.5, 12.1, 9.5, 14.2, 17.5, 19.8, 24.1]
};

const SYSTEMS = [
  { slug: "goldscalperninja", name: "GoldScalperNinja EA", icon: Bot, minCapital: 200, baseStopLoss: 150 },
  { slug: "trade-manager", name: "Trade Manager Panel", icon: SlidersHorizontal, minCapital: 100, baseStopLoss: 100 },
  { slug: "partner-ea-toolkit", name: "Partner EA Toolkit", icon: Wrench, minCapital: 300, baseStopLoss: 80 }
] as const;

export function TradingSystemsSimulator({ initialSlug }: TradingSystemsSimulatorProps) {
  // Get default index based on initialSlug
  const defaultSystemIndex = useMemo(() => {
    if (!initialSlug) return 0;
    const foundIdx = SYSTEMS.findIndex(s => s.slug === initialSlug);
    return foundIdx !== -1 ? foundIdx : 0;
  }, [initialSlug]);

  const [selectedSystemIdx, setSelectedSystemIdx] = useState<number>(defaultSystemIndex);
  const [balance, setBalance] = useState<number>(1000);
  const [riskLevel, setRiskLevel] = useState<"conservative" | "balanced" | "aggressive">("balanced");
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; month: number; balance: number } | null>(null);

  const selectedSystem = SYSTEMS[selectedSystemIdx];

  // Risk multiplier
  const riskMultiplier = useMemo(() => {
    switch (riskLevel) {
      case "conservative": return 0.5;
      case "balanced": return 1.0;
      case "aggressive": return 1.8;
    }
  }, [riskLevel]);

  // Derived calculations
  const winRate = 72; // constant premium rate
  
  // Calculate recommended Lot Size based on risk percentage & stop loss
  // Account risk amount = balance * (riskPercent / 100)
  // For Gold (1 pip = 10 points = $0.10 per 0.01 lot)
  // Lot size = Risk Amount / (Stop Loss * Pip Value)
  const lotSize = useMemo(() => {
    const riskPercent = riskLevel === "conservative" ? 0.5 : riskLevel === "balanced" ? 1.0 : 2.0;
    const riskAmount = balance * (riskPercent / 100);
    const stopLossPips = selectedSystem.baseStopLoss;
    
    // Approximate lot calculations
    let calculatedLots = riskAmount / (stopLossPips * 1.5);
    
    // Clamp to broker minimums and round to 2 decimal places
    calculatedLots = Math.max(0.01, Math.round(calculatedLots * 100) / 100);
    return calculatedLots;
  }, [balance, riskLevel, selectedSystem]);

  // Projected Monthly Yield in percentage and USD
  const monthlyYieldPercent = useMemo(() => {
    const baseYield = selectedSystem.slug === "goldscalperninja" ? 11.2 : selectedSystem.slug === "trade-manager" ? 8.5 : 7.6;
    return Math.round(baseYield * riskMultiplier * 10) / 10;
  }, [selectedSystem, riskMultiplier]);

  const projectedMonthlyUSD = useMemo(() => {
    return Math.round(balance * (monthlyYieldPercent / 100));
  }, [balance, monthlyYieldPercent]);

  // Drawdown limit
  const maxDrawdownPercent = useMemo(() => {
    const baseDD = selectedSystem.slug === "goldscalperninja" ? 7.5 : selectedSystem.slug === "trade-manager" ? 5.2 : 6.0;
    return Math.round(baseDD * riskMultiplier * 10) / 10;
  }, [selectedSystem, riskMultiplier]);

  const maxDrawdownUSD = useMemo(() => {
    return Math.round(balance * (maxDrawdownPercent / 100));
  }, [balance, maxDrawdownPercent]);

  // Check capital viability
  const isCapitalLow = balance < selectedSystem.minCapital;

  // Generate simulated 12-month backtest data
  const monthlyData = useMemo(() => {
    const profile = BACKTEST_PROFILES[selectedSystem.slug as keyof typeof BACKTEST_PROFILES] || BACKTEST_PROFILES.goldscalperninja;
    return profile.map((pct, monthIdx) => {
      const scaledPct = (pct * riskMultiplier) / 100;
      const monthBalance = Math.round(balance * (1 + scaledPct));
      return {
        month: monthIdx,
        balance: monthBalance,
        percent: Math.round(scaledPct * 1000) / 10
      };
    });
  }, [balance, selectedSystem, riskMultiplier]);

  // SVG dimensions for layout scaling
  const chartWidth = 520;
  const chartHeight = 180;
  const paddingLeft = 50;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 25;

  const usableWidth = chartWidth - paddingLeft - paddingRight;
  const usableHeight = chartHeight - paddingTop - paddingBottom;

  const minVal = useMemo(() => Math.min(...monthlyData.map(d => d.balance)), [monthlyData]);
  const maxVal = useMemo(() => Math.max(...monthlyData.map(d => d.balance)), [monthlyData]);

  // SVG coordinate projection
  const svgCoordinates = useMemo(() => {
    return monthlyData.map((d, index) => {
      const x = paddingLeft + (index / 11) * usableWidth;
      const diff = maxVal - minVal;
      const y = diff === 0 
        ? paddingTop + usableHeight / 2 
        : chartHeight - paddingBottom - ((d.balance - minVal) / diff) * usableHeight;
      return { x, y, month: index, balance: d.balance };
    });
  }, [monthlyData, minVal, maxVal, usableWidth, usableHeight]);

  const linePathD = useMemo(() => {
    return "M " + svgCoordinates.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" L ");
  }, [svgCoordinates]);

  const areaPathD = useMemo(() => {
    const startX = svgCoordinates[0].x.toFixed(1);
    const startY = (chartHeight - paddingBottom).toFixed(1);
    const endX = svgCoordinates[svgCoordinates.length - 1].x.toFixed(1);
    
    return `${linePathD} L ${endX},${startY} L ${startX},${startY} Z`;
  }, [svgCoordinates, linePathD]);

  const SystemIcon = selectedSystem.icon;

  return (
    <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#111318]/50 p-6 md:p-8 shadow-lg relative overflow-hidden group">
      {/* Decorative pulse background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(245,158,11,0.03)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none rounded-3xl" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-dashed border-gray-200 dark:border-white/5 pb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center border border-gold/20 shadow-inner">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
                Performance Lab
              </span>
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h3 className="text-lg font-black text-gray-800 dark:text-white mt-1">
              EA Backtest & Risk Simulator
            </h3>
          </div>
        </div>
        
        {/* Preset Selectors */}
        {!initialSlug && (
          <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200/50 dark:border-white/5 self-start sm:self-auto">
            {SYSTEMS.map((sys, idx) => {
              const Icon = sys.icon;
              return (
                <button
                  key={sys.slug}
                  onClick={() => setSelectedSystemIdx(idx)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedSystemIdx === idx
                      ? "bg-white dark:bg-[#1E2028] text-gold border border-gold/25 shadow-sm"
                      : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
                  }`}
                >
                  <Icon size={13} />
                  <span className="hidden sm:inline">{sys.name.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-8 relative z-10">
        
        {/* Left Inputs Column */}
        <div className="space-y-6">
          
          {/* Account Balance Config */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase tracking-wider text-gray-400">
                Account Capital (USD)
              </label>
              <div className="flex items-center text-sm font-black text-gold bg-gold/5 border border-gold/20 rounded-lg px-2.5 py-0.5">
                <DollarSign size={14} className="-mr-0.5" />
                {balance.toLocaleString()}
              </div>
            </div>
            
            {/* Range Slider */}
            <div className="space-y-3">
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={balance}
                onChange={(e) => setBalance(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold focus:outline-none"
              />
              <div className="flex justify-between gap-1.5">
                {[500, 1000, 2500, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setBalance(amt)}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-black border transition-all ${
                      balance === amt
                        ? "bg-gold/10 border-gold/30 text-gold shadow-sm"
                        : "bg-gray-50 dark:bg-[#151925]/30 border-gray-200 dark:border-white/5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
                    }`}
                  >
                    ${amt >= 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Risk Profile Selection */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2.5">
              Risk Profile & Execution Mode
            </label>
            
            <div className="grid grid-cols-3 gap-2">
              {(["conservative", "balanced", "aggressive"] as const).map((level) => {
                const isSelected = riskLevel === level;
                return (
                  <button
                    key={level}
                    onClick={() => setRiskLevel(level)}
                    className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? "bg-gold/[0.04] border-gold/45 shadow-[0_4px_12px_rgba(245,158,11,0.05)]"
                        : "bg-white/40 dark:bg-white/[0.02] border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/15"
                    }`}
                  >
                    <span className={`text-[10px] font-black uppercase tracking-wider ${
                      isSelected 
                        ? "text-gold" 
                        : "text-gray-400"
                    }`}>
                      {level}
                    </span>
                    <span className="text-[15px] font-black text-gray-800 dark:text-white mt-1 leading-none">
                      {level === "conservative" ? "0.5%" : level === "balanced" ? "1.0%" : "2.0%"}
                    </span>
                    <span className="text-[8px] font-bold text-gray-400 mt-1 leading-none uppercase">
                      Risk/Trade
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Validation Alert for low balance */}
          {isCapitalLow ? (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 animate-in fade-in slide-in-from-top-2">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed font-semibold">
                <span className="font-bold uppercase tracking-wider block">Capital Below Recommendation</span>
                We recommend a minimum starting balance of ${selectedSystem.minCapital} for {selectedSystem.name} to comfortably sustain initial drawdowns.
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-500/90">
              <Sparkles size={16} className="shrink-0 mt-0.5 text-emerald-400" />
              <div className="text-[11px] leading-relaxed font-semibold">
                <span className="font-bold uppercase tracking-wider block">System Verified</span>
                Your allocated capital of ${balance.toLocaleString()} satisfies the requirements for safe micro-lot placement (0.01 Lots).
              </div>
            </div>
          )}

          {/* Metrics Blocks */}
          <div className="grid grid-cols-2 gap-3.5 border-t border-dashed border-gray-200 dark:border-white/5 pt-5">
            <div className="p-3 bg-gray-50/50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 rounded-2xl">
              <span className="text-[9px] font-black uppercase text-gray-400 dark:text-gray-500 block mb-0.5">
                Calculated Lot Size
              </span>
              <span className="text-base font-black font-mono text-gray-800 dark:text-white">
                {lotSize} <span className="text-[10px] text-gray-400">Lots</span>
              </span>
            </div>

            <div className="p-3 bg-gray-50/50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 rounded-2xl">
              <span className="text-[9px] font-black uppercase text-gray-400 dark:text-gray-500 block mb-0.5">
                Simulated Drawdown Limit
              </span>
              <span className="text-base font-black font-mono text-red-500">
                -${maxDrawdownUSD} <span className="text-[10px] text-red-400/70">({maxDrawdownPercent}%)</span>
              </span>
            </div>
          </div>

        </div>

        {/* Right Output Graph & Backtest Analysis Column */}
        <div className="flex flex-col justify-between space-y-6">
          
          {/* Equity Chart Wrapper */}
          <div className="bg-gray-50/80 dark:bg-[#151925]/30 rounded-2xl border border-gray-200/50 dark:border-white/5 p-4 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Activity size={14} className="text-gold" />
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                  Simulated Equity Curve (12 Months)
                </span>
              </div>
              <span className="text-[9px] font-bold text-gray-400 bg-gray-200/50 dark:bg-white/5 px-2 py-0.5 rounded">
                Backtest Win Rate: {winRate}%
              </span>
            </div>

            {/* SVG Interactive Line Chart */}
            <div className="relative h-[180px] w-full bg-white/40 dark:bg-[#0B0E14]/30 rounded-xl border border-gray-200/50 dark:border-white/5 overflow-hidden">
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                className="w-full h-full"
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <defs>
                  {/* Glowing line gradient */}
                  <linearGradient id="chart-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="60%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                  
                  {/* Filled area gradient */}
                  <linearGradient id="area-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                  </linearGradient>

                  {/* Horizontal grid lines helper */}
                  <pattern id="grid" width="44" height="28" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="44" y2="0" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                  </pattern>
                </defs>

                {/* Technical gridlines */}
                <rect x={paddingLeft} y={paddingTop} width={usableWidth} height={usableHeight} fill="url(#grid)" />
                <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={chartHeight - paddingBottom} stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
                <line x1={paddingLeft} y1={chartHeight - paddingBottom} x2={chartWidth - paddingRight} y2={chartHeight - paddingBottom} stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />

                {/* Y-Axis scale tags */}
                <text x={paddingLeft - 8} y={paddingTop + 4} textAnchor="end" fill="rgba(156,163,175,0.5)" className="text-[8px] font-mono font-bold">
                  ${maxVal.toLocaleString()}
                </text>
                <text x={paddingLeft - 8} y={chartHeight - paddingBottom + 3} textAnchor="end" fill="rgba(156,163,175,0.5)" className="text-[8px] font-mono font-bold">
                  ${minVal.toLocaleString()}
                </text>

                {/* Equity Line & Area */}
                <path d={areaPathD} fill="url(#area-grad)" />
                <path d={linePathD} fill="none" stroke="url(#chart-glow)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Pulsing endpoint marker */}
                <circle 
                  cx={svgCoordinates[11].x} 
                  cy={svgCoordinates[11].y} 
                  r="5" 
                  className="fill-gold stroke-white dark:stroke-[#111318] stroke-2"
                />
                <circle 
                  cx={svgCoordinates[11].x} 
                  cy={svgCoordinates[11].y} 
                  r="10" 
                  className="fill-gold/20 animate-ping"
                />

                {/* Interactive Hover trigger columns */}
                {svgCoordinates.map((coord, idx) => (
                  <rect
                    key={idx}
                    x={coord.x - usableWidth / 22}
                    y={paddingTop}
                    width={usableWidth / 11}
                    height={usableHeight}
                    fill="transparent"
                    className="cursor-crosshair"
                    onMouseEnter={(e) => {
                      setHoveredPoint({
                        x: coord.x,
                        y: coord.y,
                        month: idx,
                        balance: coord.balance
                      });
                    }}
                  />
                ))}

                {/* Hover line and dot */}
                {hoveredPoint && (
                  <>
                    <line 
                      x1={hoveredPoint.x} 
                      y1={paddingTop} 
                      x2={hoveredPoint.x} 
                      y2={chartHeight - paddingBottom} 
                      stroke="rgba(245,158,11,0.2)" 
                      strokeWidth="1" 
                      strokeDasharray="3 3"
                    />
                    <circle 
                      cx={hoveredPoint.x} 
                      cy={hoveredPoint.y} 
                      r="4" 
                      className="fill-gold stroke-white dark:stroke-[#111318] stroke-1.5"
                    />
                  </>
                )}
              </svg>

              {/* Hover Tooltip Overlay */}
              {hoveredPoint && (
                <div 
                  className="absolute bg-[#1E2028]/95 dark:bg-[#1E2028] border border-gold/30 rounded-xl p-2 shadow-xl z-20 text-[10px] pointer-events-none animate-in fade-in zoom-in-95 duration-100"
                  style={{
                    left: `${Math.min(chartWidth - 110, Math.max(55, hoveredPoint.x - 50))}px`,
                    top: `${Math.max(10, hoveredPoint.y - 50)}px`
                  }}
                >
                  <div className="font-black text-gray-400 uppercase tracking-wider text-[8px]">
                    {hoveredPoint.month === 0 ? "Initial Deposit" : `Month ${hoveredPoint.month}`}
                  </div>
                  <div className="font-black text-white mt-0.5">
                    ${hoveredPoint.balance.toLocaleString()}
                  </div>
                  {hoveredPoint.month > 0 && (
                    <div className="text-emerald-400 font-bold mt-0.5">
                      +{Math.round(((hoveredPoint.balance - balance) / balance) * 100)}% net growth
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-2.5 px-1.5">
              <span>Start</span>
              <span>Month 3</span>
              <span>Month 6</span>
              <span>Month 9</span>
              <span>Month 12</span>
            </div>
          </div>

          {/* Projection Performance Summary Card */}
          <div className="p-4 bg-gold/[0.02] border border-gold/20 rounded-2xl flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-gold" />
                <span className="text-[10px] font-black uppercase tracking-wider text-gold">
                  12-Month Growth Forecast
                </span>
              </div>
              
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-gray-800 dark:text-white leading-none">
                  ${monthlyData[11].balance.toLocaleString()}
                </span>
                <span className="text-xs font-black text-emerald-500">
                  +{monthlyData[11].percent}% Yield
                </span>
              </div>

              <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-500 font-semibold leading-relaxed">
                Starting with ${balance.toLocaleString()} using {riskLevel} parameters, the projected balance after 12 months is ${monthlyData[11].balance.toLocaleString()} with a simulated average monthly target profit of ${projectedMonthlyUSD} ({monthlyYieldPercent}%).
              </p>
            </div>

            <div className="border-t border-dashed border-gold/15 pt-3.5 mt-3 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                Ready to deploy on MT5?
              </span>
              <a href="/trading-systems" className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-gold hover:text-amber-500 transition-colors">
                Link account to unlock
                <ChevronRight size={12} />
              </a>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
