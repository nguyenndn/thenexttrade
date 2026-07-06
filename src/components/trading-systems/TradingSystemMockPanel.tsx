"use client";

import React, { useState } from "react";
import { Clock, ArrowUpDown, SlidersHorizontal, TrendingUp, Bot, RotateCw, Scale } from "lucide-react";

interface MockPanelProps {
  slug: string;
}

export function TradingSystemMockPanel({ slug }: MockPanelProps) {
  // Trade Manager mockup active tab state
  const [activeMockTab, setActiveMockTab] = useState<"TRADE" | "S&D ZONE" | "TREND" | "SEMI AUTO" | "SYNC">("TRADE");

  // State for timeframe selection in S&D Zone tab
  const [selectedSdTf, setSelectedSdTf] = useState("M5");

  // State for GSN Phoenix Grid active strategy
  const [activeStrategy, setActiveStrategy] = useState("ATR SOFT");

  // States for GSN Phoenix Grid panel toggles
  const [eaOn, setEaOn] = useState(true);
  const [buyOn, setBuyOn] = useState(true);
  const [sellOn, setSellOn] = useState(true);
  const [hedgeOn, setHedgeOn] = useState(true);
  const [lastRoundOn, setLastRoundOn] = useState(false);

  if (slug === "goldscalperninja") {
    return (
      <div className="mx-auto w-full lg:w-[385px] border-2 border-[#f7b500] bg-[#070d17] p-2.5 text-left font-mono text-[10px] text-slate-300 shadow-2xl shadow-gold/10">
        <div className="mb-2 text-center">
          <div className="text-[22px] font-black leading-none tracking-tight text-[#ffd21f]">
            GoldScalperNinja v3.0
          </div>
          <div className="mx-auto mt-1 h-px w-36 border-t border-dashed border-[#f7b500]/80" />
        </div>

        <div className="mb-1.5 border border-[#f7b500] bg-[#0c1321] px-2 py-1.5">
          <div className="mb-1 text-center text-[10px] uppercase tracking-[0.18em] text-slate-400">
            Account Info
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Balance:</span>
              <span className="font-black text-white">$0.00</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Equity:</span>
              <span className="font-black text-white">$0.00</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Today P/L:</span>
              <span className="font-black text-emerald-400">+$0.00</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Drawdown:</span>
              <span className="font-black text-emerald-400">0.00%</span>
            </div>
          </div>
        </div>

        <div className="mb-1.5 border-2 border-[#f7b500] bg-[#0c1321] px-2 py-2 text-center">
          <div className="mb-1 text-[10px] uppercase tracking-[0.22em] text-slate-400">Floating P/L</div>
          <div className="text-[28px] font-black leading-none text-emerald-400">$0.00</div>
        </div>

        <div className="mb-1.5 grid grid-cols-2 gap-2">
          <div className="border border-emerald-400 bg-emerald-950/60">
            <div className="border-b border-emerald-400/80 py-1 text-center text-[11px] font-black text-emerald-300">
              BUY
            </div>
            <div className="space-y-0.5 py-1.5 text-center">
              <div className="font-black text-white">Orders: 0</div>
              <div className="text-slate-400">Lots: 0.00</div>
              <div className="font-black text-emerald-400">$0.00</div>
            </div>
          </div>
          <div className="border border-rose-500 bg-rose-950/60">
            <div className="border-b border-rose-500/80 py-1 text-center text-[11px] font-black text-rose-300">
              SELL
            </div>
            <div className="space-y-0.5 py-1.5 text-center">
              <div className="font-black text-white">Orders: 0</div>
              <div className="text-slate-400">Lots: 0.00</div>
              <div className="font-black text-rose-400">$0.00</div>
            </div>
          </div>
        </div>

        <div className="mb-2 border border-[#f7b500] bg-[#0c1321] px-2 py-1.5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <div>
              <span className="text-slate-500">News: </span>
              <span className="font-black text-slate-500">OFF</span>
            </div>
            <div>
              <span className="text-slate-500">Daily: </span>
              <span className="font-black text-emerald-400">OK</span>
            </div>
            <div>
              <span className="text-slate-500">Cycle: </span>
              <span className="font-black text-emerald-400">RUNNING</span>
            </div>
            <div>
              <span className="text-slate-500">Trend: </span>
              <span className="font-black text-slate-500">---</span>
            </div>
          </div>
        </div>

        <div className="mb-1.5 text-center text-[10px] uppercase tracking-[0.22em] text-slate-400">
          Trade Direction
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "ONLY BUY", state: "disabled" },
            { label: "ONLY SELL", state: "disabled" },
            { label: "BUY & SELL", state: "disabled" },
            { label: "AUTO TREND", state: "active" },
            { label: "CLOSE BUY", state: "buy" },
            { label: "CLOSE SELL", state: "sell" },
            { label: "CLOSE ALL", state: "danger" },
            { label: "CYCLE: ON", state: "cycle" },
          ].map((button) => {
            const styles = {
              disabled: "border-slate-600 bg-slate-800/80 text-slate-500",
              active: "border-cyan-400 bg-cyan-950/70 text-cyan-300",
              buy: "border-emerald-400 bg-emerald-950/60 text-emerald-300",
              sell: "border-rose-500 bg-rose-950/60 text-rose-300",
              danger: "border-red-500 bg-red-950/70 text-red-300",
              cycle: "border-emerald-400 bg-slate-900 text-emerald-300",
            }[button.state as "disabled" | "active" | "buy" | "sell" | "danger" | "cycle"];

            return (
              <div
                key={button.label}
                className={`min-h-7 border px-2 py-1.5 text-center text-[10px] font-black uppercase tracking-wide ${styles}`}
              >
                {button.label}
              </div>
            );
          })}
        </div>

        <div className="mt-2 text-center text-[10px] font-bold text-[#ffd21f]">
          Copyright @2026 GoldScalperNinja
        </div>
      </div>
    );
  }

  if (slug === "trade-manager") {
    const tabs = [
      { label: "TRADE", icon: ArrowUpDown },
      { label: "S&D ZONE", icon: SlidersHorizontal },
      { label: "TREND", icon: TrendingUp },
      { label: "SEMI AUTO", icon: Bot },
      { label: "SYNC", icon: RotateCw },
    ] as const;

    const headerInfo = {
      TRADE: { pips: 0, time: "00:40" },
      "S&D ZONE": { pips: 200, time: "00:35" },
      TREND: { pips: 44, time: "00:24" },
      "SEMI AUTO": { pips: 12, time: "01:10" },
      SYNC: { pips: 0, time: "02:15" },
    }[activeMockTab];

    return (
      <div
        style={{ zoom: 1.1 }}
        className="mx-auto w-full lg:w-[550px] border-2 border-[#f7b500] bg-[#0f1522] p-1.5 text-left font-mono text-[10px] text-slate-200 shadow-2xl shadow-slate-955/20 lg:mx-0"
      >
        {/* Terminal Header */}
        <div className="mb-2 flex items-center justify-between gap-2 bg-[#0b111d] px-2.5 py-1.5 border-b border-slate-800">
          <span className="whitespace-nowrap text-[13.5px] font-black uppercase tracking-wide text-[#ffd21f] sm:text-[14.5px]">
            GSN - TRADE MANAGER
          </span>
          <div className="flex shrink-0 items-center gap-3 text-[10.5px] font-black text-[#ffd21f] sm:text-[11.5px]">
            <span>PEAK PIPS: {headerInfo.pips}</span>
            <div className="flex items-center gap-1">
              <Clock size={11} className="text-[#ffd21f] shrink-0" />
              <span>{headerInfo.time}</span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-5 gap-0.5">
          {tabs.map((tab) => {
            const isActive = activeMockTab === tab.label;
            const Icon = tab.icon;
            return (
              <div
                key={tab.label}
                onClick={() => setActiveMockTab(tab.label)}
                className={`border px-1 py-2 flex items-center justify-center gap-1.5 text-center text-[9.5px] sm:text-[11.5px] font-black uppercase tracking-wide cursor-pointer select-none transition-all ${isActive
                  ? "border-[#f7b500] bg-slate-900 text-[#ffd21f]"
                  : "border-slate-600 bg-[#151b26] hover:bg-[#1a212e] text-white"
                  }`}
              >
                <Icon size={12} className={isActive ? "text-[#ffd21f]" : "text-white"} />
                <span>{tab.label}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-3 h-[380px] flex flex-col justify-between overflow-hidden">
          {activeMockTab === "TRADE" && (
            <div className="animate-in fade-in duration-200 w-full flex-1 flex flex-col justify-between">
              <div className="grid gap-2 md:grid-cols-[1.08fr_1fr_1.14fr]">
                <div className="flex flex-col justify-between gap-1 h-full">
                  {[
                    { label: "SL:", value: "0.00", bar: "bg-rose-500", text: "text-rose-500" },
                    { label: "ENTRY:", value: "4064.32", bar: "bg-blue-500", text: "text-blue-400" },
                    { label: "TP1:", value: "0.00", qty: "2", bar: "bg-emerald-500", text: "text-emerald-400" },
                    { label: "TP2:", value: "0.00", qty: "2", bar: "bg-emerald-500", text: "text-emerald-400" },
                    { label: "TP3:", value: "0.00", qty: "2", bar: "bg-emerald-500", text: "text-emerald-400" },
                  ].map((row) => (
                    <div key={row.label} className="relative grid grid-cols-[55px_1fr_25px] min-h-7 items-center border border-slate-800 bg-[#0d1420] px-2 pl-3">
                      <span className={`absolute left-0 top-0 h-full w-1 ${row.bar}`} />
                      <span className={`font-black ${row.text} text-left`}>{row.label}</span>
                      <span className="font-black text-white text-center">{row.value}</span>
                      <span className="font-black text-white text-right">{row.qty || ""}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 bg-[#0b111d] p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="whitespace-nowrap font-black text-[#ffd21f]">Lot Size:</span>
                    <span className="border border-slate-800 bg-slate-900 px-1 text-[#ffd21f] select-none hover:bg-slate-850 cursor-pointer">-</span>
                    <span className="font-black text-white">0.01</span>
                    <span className="border border-slate-800 bg-slate-900 px-1 text-[#ffd21f] select-none hover:bg-slate-850 cursor-pointer">+</span>
                  </div>
                  {[
                    ["Zone (pips):", "70", "text-white"],
                    ["SL Loss:", "0.00%   -$0.00", "text-red-400"],
                    ["Max Risk:", "20.0%", "text-white"],
                    ["BE Offset:", "0", "text-white"],
                  ].map(([label, value, color]) => (
                    <div key={label} className="flex min-h-6 items-center justify-between gap-2">
                      <span className="font-black text-[#ffd21f]">{label}</span>
                      <span className={`font-black ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>

                 <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: "GET BUY", className: "bg-blue-600 hover:bg-blue-700" },
                    { label: "GET SELL", className: "bg-rose-900 hover:bg-rose-950" },
                    { label: "BUY NOW ↑", className: "col-span-2 bg-blue-500 hover:bg-blue-600" },
                    { label: "SELL NOW ↓", className: "col-span-2 bg-rose-500 hover:bg-rose-600" },
                    { label: "SET PENDING", className: "bg-green-700 hover:bg-green-800" },
                    { label: "CLOSE PENDING", className: "bg-green-700 hover:bg-green-800" },
                    { label: "SYNC LEVELS", className: "bg-orange-500 hover:bg-orange-600" },
                    { label: "CLEAR INPUTS", className: "bg-orange-500 hover:bg-orange-600" },
                  ].map((button) => (
                    <div
                      key={button.label}
                      className={`${button.className} flex min-h-7 items-center justify-center px-2 py-1 text-center text-[9px] font-black uppercase text-white sm:text-[10px] whitespace-nowrap transition-colors cursor-pointer select-none rounded-sm`}
                    >
                      {button.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 border-t border-slate-800 pt-3">
                <div className="mb-2 grid grid-cols-3 text-center text-[10px] font-black text-emerald-400">
                  <span>TP1: $0.00</span>
                  <span>TP2: $0.00</span>
                  <span>TP3: $0.00</span>
                </div>
                <div className="relative mx-5 h-5">
                  <div className="absolute left-0 right-0 top-2 h-0.5 bg-emerald-500" />
                  <div className="absolute left-0 top-1.5 h-2 w-0.5 bg-rose-500" />
                  <div className="absolute left-[24%] top-0.5 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-emerald-300 bg-slate-750 shadow-[0_0_0_2px_rgba(16,185,129,0.35)]" />
                  <div className="absolute left-1/2 top-1.5 h-2 w-0.5 bg-white" />
                  <div className="absolute left-[75%] top-1.5 h-2 w-0.5 bg-white" />
                  <div className="absolute right-0 top-1.5 h-2 w-0.5 bg-white" />
                </div>
                <div className="grid grid-cols-4 px-4 text-[9px] font-black uppercase">
                  <span className="text-rose-500">SL</span>
                  <span className="text-emerald-400">Entry</span>
                  <span className="text-white">TP1</span>
                  <span className="text-right text-white">TP3</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-white font-black text-[9px] uppercase whitespace-nowrap shrink-0">
                  <span>Take Profit %</span>
                  <span className="text-slate-700 font-normal">|</span>
                  <span className="text-white">50</span>
                </div>
                <div className="grid grid-cols-4 gap-1 w-full pl-2">
                  <div className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer py-1.5 text-center text-[9.5px] font-black text-white select-none transition-colors rounded-sm">TP BUY</div>
                  <div className="bg-red-600 hover:bg-red-700 cursor-pointer py-1.5 text-center text-[9.5px] font-black text-white select-none transition-colors rounded-sm">TP SELL</div>
                  <div className="bg-amber-500 hover:bg-amber-600 cursor-pointer py-1.5 text-center text-[9.5px] font-black text-white select-none transition-colors rounded-sm">SL -&gt; BE</div>
                  <div className="bg-rose-500 hover:bg-rose-600 cursor-pointer py-1.5 text-center text-[9.5px] font-black text-white select-none transition-colors rounded-sm">CLOSE ALL</div>
                </div>
              </div>

              <div className="mt-1 grid grid-cols-4 gap-px bg-[#172333] text-center text-[9.5px]">
                <div className="py-2 font-black text-emerald-400">BUY: +$0.00</div>
                <div className="py-2 font-black text-emerald-400">SELL: +$0.00</div>
                <div className="py-2 font-black text-white">0.00 LOTS</div>
                <div className="py-2 font-black text-white">0 POS</div>
              </div>
            </div>
          )}

          {activeMockTab === "S&D ZONE" && (
            <div className="animate-in fade-in duration-200 w-full flex-1 flex flex-col justify-between">
              {/* S&D Header Toolbar */}
              <div className="mb-2.5 grid grid-cols-[82px_1fr_152px] items-center border-b border-slate-800 pb-2 w-full text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="flex items-center gap-1 text-[11px] font-black text-rose-500 uppercase">
                    <span>5</span>
                    <span className="text-white">SUP</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-black text-emerald-500 uppercase">
                    <span>5</span>
                    <span className="text-white">DEM</span>
                  </div>
                </div>

                {/* Timeframe Toggles */}
                <div className="flex gap-1 select-none items-center justify-center">
                  {["M1", "M5", "M15", "M30", "H1", "H4", "D1"].map((tf) => (
                    <div
                      key={tf}
                      onClick={() => setSelectedSdTf(tf)}
                      className={`cursor-pointer border px-2 py-0.5 text-[10px] font-black transition-colors rounded-none ${selectedSdTf === tf
                        ? "border-blue-500 text-white bg-blue-600"
                        : "border-slate-800 text-slate-400 bg-slate-900/40 hover:text-white"
                        }`}
                    >
                      {tf}
                    </div>
                  ))}
                </div>

                {/* Zones Toggle Status */}
                <div className="flex items-center justify-center gap-2 select-none">
                  <div className="border border-emerald-500 px-2 py-0.5 text-[9.5px] font-black text-white bg-emerald-950/40 rounded-none uppercase">
                    OB ON
                  </div>
                  <div className="border border-slate-700 px-2 py-0.5 text-[9.5px] font-black text-slate-400 bg-slate-900/60 rounded-none uppercase">
                    RBS/SBR OFF
                  </div>
                </div>
              </div>

              {/* S&D Zones Table */}
              <div className="space-y-1">
                {[
                  { type: "S-OB", range: "4162.52 - 4166.24", status: "MITIGATED", statusColor: "border-slate-800 text-slate-500 bg-slate-900/30", typeColor: "bg-red-950/20 text-rose-500 border-red-950" },
                  { type: "S-OB", range: "4167.13 - 4171.76", status: "MITIGATED", statusColor: "border-slate-800 text-slate-500 bg-slate-900/30", typeColor: "bg-red-950/20 text-rose-500 border-red-950" },
                  { type: "S-OB", range: "4198.42 - 4202.82", status: "FRESH", statusColor: "border-amber-600 text-amber-500 bg-amber-950/10", typeColor: "bg-red-950/20 text-rose-500 border-red-950" },
                ].map((row, idx) => (
                  <div key={idx} className="grid grid-cols-[82px_1fr_152px] items-center gap-2 border border-slate-800 bg-[#0d1420]/30 p-1 px-2.5">
                    <div className="flex justify-center">
                      <div className={`w-[68px] border text-center text-[10.5px] font-black py-0.5 rounded-sm ${row.typeColor}`}>{row.type}</div>
                    </div>
                    <div className="text-center font-black text-white text-[11.5px] tracking-wide">{row.range}</div>
                    <div className="flex justify-center">
                      <div className={`w-[88px] border text-center text-[9.5px] font-black py-0.5 rounded-sm uppercase ${row.statusColor}`}>{row.status}</div>
                    </div>
                  </div>
                ))}

                {/* Current Price Separator */}
                <div className="relative my-2.5 flex items-center justify-center">
                  <div className="absolute left-0 right-0 h-px bg-cyan-600/30" />
                  <span className="relative z-10 bg-[#101722] px-3 text-[11px] font-black text-cyan-400 uppercase tracking-widest">
                    PRICE NOW: 4153.84
                  </span>
                </div>

                {[
                  { type: "B-OB", range: "4133.09 - 4138.24", status: "MITIGATED", statusColor: "border-slate-800 text-slate-500 bg-slate-900/30", typeColor: "bg-emerald-950/20 text-emerald-400 border-emerald-950" },
                  { type: "B-OB", range: "4121.15 - 4126.48", status: "MITIGATED", statusColor: "border-slate-800 text-slate-500 bg-slate-900/30", typeColor: "bg-emerald-950/20 text-emerald-400 border-emerald-950" },
                  { type: "B-OB", range: "4111.05 - 4113.60", status: "MITIGATED", statusColor: "border-slate-800 text-slate-500 bg-slate-900/30", typeColor: "bg-emerald-950/20 text-emerald-400 border-emerald-950" },
                ].map((row, idx) => (
                  <div key={idx} className="grid grid-cols-[82px_1fr_152px] items-center gap-2 border border-slate-800 bg-[#0d1420]/30 p-1 px-2.5">
                    <div className="flex justify-center">
                      <div className={`w-[68px] border text-center text-[10.5px] font-black py-0.5 rounded-sm ${row.typeColor}`}>{row.type}</div>
                    </div>
                    <div className="text-center font-black text-white text-[11.5px] tracking-wide">{row.range}</div>
                    <div className="flex justify-center">
                      <div className={`w-[88px] border text-center text-[9.5px] font-black py-0.5 rounded-sm uppercase ${row.statusColor}`}>{row.status}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom Indicators Manager */}
              <div className="mt-3.5 border-t border-slate-800 pt-3">
                <div className="mb-2 text-center text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  CUSTOM INDICATORS MANAGER
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((num) => (
                    <div key={num} className="flex items-center gap-1.5 border border-slate-800 bg-[#0b111d] p-1 px-1.5 justify-between">
                      <span className="font-black text-slate-400 text-[10.5px] uppercase whitespace-nowrap font-mono">IND {num}:</span>
                      <span className="w-16 h-5 bg-slate-950 border border-slate-800 rounded-sm" />
                      <span className="px-1.5 h-5 flex items-center justify-center cursor-pointer border border-slate-700 bg-slate-800 hover:bg-slate-700 text-[10px] font-black text-slate-300 rounded-sm select-none">OFF</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeMockTab === "TREND" && (
            <div className="space-y-2 animate-in fade-in duration-200 w-full flex-1 flex flex-col justify-between">
              {/* Header Parameters */}
              <div className="grid grid-cols-3 gap-2 border-b border-slate-800 pb-2 items-center">
                <div className="space-y-0.5 text-center">
                  <span className="font-black text-white text-[10px] block">CURRENT BIAS</span>
                  <span className="font-black text-white text-[11.5px] uppercase">NEUTRAL</span>
                </div>
                <div className="space-y-0.5 border-l border-slate-800 text-center">
                  <span className="font-black text-white text-[10px] block">DAILY TREND</span>
                  <span className="font-black text-rose-500 text-[11.5px] uppercase">▼ SELL</span>
                  <div className="font-bold text-white text-[10px] whitespace-nowrap">
                    0 UP · 3 DOWN · 3 RANGE
                  </div>
                </div>
                <div className="space-y-0.5 border-l border-slate-800 flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full border-2 border-rose-500 flex flex-col items-center justify-center bg-rose-950/10">
                    <span className="text-[12px] font-black text-rose-500 leading-none">NEU</span>
                    <span className="text-[10px] font-bold text-white uppercase mt-0.5 leading-none">62%</span>
                  </div>
                </div>
              </div>

              {/* Timeframe Timeline Bar */}
              <div className="!mt-0">
                <div className="flex justify-between text-[10px] font-black text-slate-400 px-0.5 mb-1">
                  <span>M1</span>
                  <span>D1</span>
                </div>
                <div className="grid grid-cols-7 gap-1 h-1.5 w-full">
                  <div className="h-full bg-blue-500 rounded-sm" /> {/* M1 */}
                  <div className="h-full bg-blue-500 rounded-sm" /> {/* M5 */}
                  <div className="h-full bg-rose-500 rounded-sm" /> {/* M15 */}
                  <div className="h-full bg-blue-500 rounded-sm" /> {/* M30 */}
                  <div className="h-full bg-blue-500 rounded-sm" /> {/* H1 */}
                  <div className="h-full bg-rose-500 rounded-sm" /> {/* H4 */}
                  <div className="h-full bg-rose-500 rounded-sm" /> {/* D1 */}
                </div>
              </div>

              {/* Action Power Buttons */}
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-black select-none">
                <div className="border border-slate-750 py-1 text-slate-300 bg-slate-900/60 uppercase rounded-sm">
                  CHART: WAIT
                </div>
                <div className="border border-emerald-500 py-1 text-emerald-450 bg-[#072212]/30 uppercase rounded-sm">
                  BUY PWR: 0%
                </div>
                <div className="border border-rose-500 py-1 text-rose-500 bg-[#260a0c]/30 uppercase rounded-sm">
                  SELL PWR: 100%
                </div>
              </div>

              {/* Confluence Matrix Table */}
              <div className="border border-slate-800 rounded-sm overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-8 bg-[#0b111d] text-center font-black text-white text-[9.5px] border-b border-slate-800 py-1">
                  <span>TF</span>
                  <span>M1</span>
                  <span>M5</span>
                  <span>M15</span>
                  <span>M30</span>
                  <span>H1</span>
                  <span>H4</span>
                  <span>D1</span>
                </div>

                {/* Table Rows */}
                {[
                  { label: "Sonic R", cells: ["SELL", "SELL", "SELL", "BUY", "BUY", "SELL", "SELL"] },
                  { label: "Structure", cells: ["WAIT", "SELL", "SELL", "SELL", "SELL", "BUY", "SELL"] },
                  { label: "SuperTrend", cells: ["SELL", "SELL", "SELL", "SELL", "SELL", "SELL", "SELL"] },
                  { label: "MACD", cells: ["SELL", "SELL", "SELL", "SELL", "SELL", "WAIT", "WAIT"] },
                  { label: "ADX", cells: ["WAIT", "SELL", "WAIT", "WAIT", "WAIT", "SELL", "BUY"] },
                  { label: "VOL-MOM", cells: ["WAIT", "WAIT", "SELL", "SELL", "WAIT", "WAIT", "WAIT"] },
                ].map((row, idx) => (
                  <div key={idx} className="grid grid-cols-8 text-center items-center py-1 font-bold text-[10px] border-b border-slate-800 last:border-b-0 bg-[#0d1420]/30">
                    <span className="text-center font-black text-white text-[9.5px]">{row.label}</span>
                    {row.cells.map((cell, cIdx) => {
                      const cellStyles = {
                        BUY: "bg-[#072212] text-[#00c07f] border border-[#00c07f]/30",
                        SELL: "bg-[#260a0c] text-[#ff4a5a] border border-[#ff4a5a]/30",
                        WAIT: "bg-[#232b3d99] text-white border-slate-850",
                      }[cell] || "text-slate-400";
                      return (
                        <div key={cIdx} className="px-0.5">
                          <span className={`block py-0.5 text-[9.5px] font-black rounded-sm ${cellStyles}`}>
                            {cell}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeMockTab === "SEMI AUTO" && (
            <div className="grid grid-cols-2 gap-3 divide-x divide-slate-850 animate-in fade-in duration-200">
              {/* DCA / Martingale Settings (Left Column) */}
              <div className="space-y-1.5">
                <div className="text-center font-black text-white text-[11.5px] uppercase tracking-wider mb-2.5">
                  DCA / MARTINGALE SETTINGS
                </div>

                {[
                  { label: "Starting Lot", val: "0.01", color: "text-emerald-455" },
                  { label: "Multiplier", val: "1.50", color: "text-emerald-455" },
                  { label: "Max Trades", val: "10", color: "text-emerald-455" },
                  { label: "DCA Step (Pips)", val: "30", color: "text-emerald-455" },
                  { label: "Target TP (Pips)", val: "30", color: "text-emerald-455" },
                  { label: "Target SL (Pips)", val: "100", color: "text-emerald-455" },
                ].map((setting) => (
                  <div key={setting.label} className="bg-[#0d1420]/30 px-2 py-1.5 flex items-center justify-between rounded-sm">
                    <span className="font-bold text-white text-[11px]">{setting.label}</span>
                    <div className="border border-slate-700 bg-slate-950/50 w-24 py-1 text-center font-black text-[11.5px] rounded-sm">
                      <span className={setting.color}>{setting.val}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* DCA Monitor & Control (Right Column) */}
              <div className="pl-3 space-y-2">
                <div className="text-center font-black text-white text-[11.5px] uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">
                  DCA MONITOR & CONTROL
                </div>

                {[
                  { label: "System Status:", val: "DCA SYSTEM: OFF", isButton: true, btnStyle: "bg-slate-750 border-slate-650 text-slate-400" },
                  { label: "Mobile DCA:", val: "MOBILE DCA: OFF", isButton: true, btnStyle: "bg-slate-750 border-slate-650 text-slate-400" },
                  { label: "Grid Status:", val: "NO ACTIVE GRID", color: "text-slate-500" },
                  { label: "Active Orders:", val: "0 (0.00 Lots)", color: "text-white" },
                  { label: "SL Loss ($):", val: "$0.00", color: "text-slate-500" },
                  { label: "TP Profit ($):", val: "$0.00", color: "text-slate-500" },
                  { label: "Current PnL:", val: "$0.00", color: "text-slate-500" },
                ].map((row) => (
                  <div key={row.label} className="grid grid-cols-[100px_1fr] items-center gap-2 min-h-6">
                    <span className="font-black text-white text-[11px]">{row.label}</span>
                    {row.isButton ? (
                      <div className={`border text-center text-[10px] font-black py-1 rounded-sm uppercase cursor-pointer hover:brightness-110 select-none ${row.btnStyle}`}>
                        {row.val}
                      </div>
                    ) : (
                      <span className={`font-black text-right pr-1 text-[11.5px] ${row.color}`}>{row.val}</span>
                    )}
                  </div>
                ))}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-1 pt-1">
                  <div className="bg-blue-600 hover:bg-blue-700 text-center py-1.5 text-[11px] font-black text-white uppercase cursor-pointer select-none rounded-sm">
                    DCA BUY ↑
                  </div>
                  <div className="bg-rose-600 hover:bg-rose-700 text-center py-1.5 text-[11px] font-black text-white uppercase cursor-pointer select-none rounded-sm">
                    DCA SELL ↓
                  </div>
                  <div className="col-span-2 bg-orange-600 hover:bg-orange-750 text-center py-2 text-[11px] font-black text-white uppercase cursor-pointer select-none rounded-sm">
                    CLOSE ALL DCA
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeMockTab === "SYNC" && (
            <div className="grid grid-cols-2 gap-3 divide-x divide-slate-850 animate-in fade-in duration-200">
              {/* Sync Settings (Left Column) */}
              <div className="space-y-3">
                <div className="text-center font-black text-white text-[11.5px] uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">
                  SYNC SETTINGS
                </div>

                {/* API Key Box */}
                <div className="space-y-1">
                  <div className="font-black text-white text-[11px] uppercase">API Key</div>
                  <div className="border border-slate-700 bg-slate-900 h-8 w-full rounded-sm flex items-center px-2">
                    <span className="text-slate-500 font-bold text-[11.5px] tracking-widest">************************</span>
                  </div>
                </div>

                {/* Connect status */}
                <div className="flex items-center justify-between gap-1.5 border border-slate-800 p-1.5 px-2.5 bg-[#0b111d]">
                  <span className="font-black text-slate-400 text-[10.5px] uppercase">Status</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-rose-500 text-[11px]">DISCONNECTED</span>
                    <div className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] px-2 py-1 rounded-sm uppercase cursor-pointer select-none">
                      CONNECT
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-slate-800 pt-2 text-[11px] font-bold">
                  <div className="flex justify-between">
                    <span className="text-slate-400 uppercase">Total Synced</span>
                    <span className="font-black text-white text-[11.5px]">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 uppercase">Last Sync</span>
                    <span className="font-black text-white text-[11.5px]">Not synced yet</span>
                  </div>
                </div>
              </div>

              {/* Sync Options (Right Column) */}
              <div className="pl-3 space-y-2">
                <div className="text-center font-black text-white text-[11.5px] uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">
                  SYNC OPTIONS
                </div>

                {/* Buttons Range */}
                <div className="space-y-1">
                  {[
                    { label: "Today", isRed: false },
                    { label: "Last 3 Days", isRed: false },
                    { label: "Last Week", isRed: false },
                    { label: "Last Month", isRed: false },
                    { label: "Last 3 Months", isRed: false },
                    { label: "Last 6 Months", isRed: false },
                    { label: "Entire History", isRed: true },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`border text-center text-[10.5px] font-black py-1 cursor-pointer select-none rounded-sm transition-colors ${item.isRed
                        ? "border-red-900 bg-red-950/20 text-rose-400 hover:bg-red-900/30"
                        : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>

                {/* Custom Date Selector */}
                <div className="space-y-1 pt-1.5 border-t border-slate-800">
                  <div className="text-center font-black text-slate-400 text-[10.5px] uppercase">Custom Range</div>
                  <div className="flex items-center gap-1 text-[11px] font-black">
                    <div className="border border-slate-700 bg-slate-900 text-center py-1 rounded-sm flex-1 text-white">2026.06.24</div>
                    <span className="text-slate-500 uppercase font-bold text-[9.5px]">To</span>
                    <div className="border border-slate-700 bg-slate-900 text-center py-1 rounded-sm flex-1 text-white">2026.07.01</div>
                  </div>
                </div>

                <div className="bg-emerald-600 hover:bg-emerald-700 text-center py-2 text-[11px] font-black text-white uppercase cursor-pointer select-none rounded-sm transition-colors">
                  Sync Selected Range
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (slug === "gsn-phoenix-grid") {
    return (
      <div
        style={{ zoom: 1.2 }}
        className="mx-auto w-full lg:w-[385px] border-2 border-[#f7b500] bg-[#10141b] p-1 text-left font-mono text-[9px] text-white shadow-2xl shadow-gold/10 lg:mx-0"
      >
        <div className="border-b-2 border-[#f7b500] bg-[#10141b] py-1 text-center text-[17px] font-black leading-none text-[#ffe100]">
          GSN PHOENIX GRID
        </div>

        <div className="flex items-center justify-center gap-1.5 border-b-2 border-[#f7b500] bg-white py-1.5 text-center text-[11px] font-black uppercase text-[#111827]">
          <Scale size={12} className="shrink-0 stroke-[2.6]" />
          <span>SIGNAL BIAS: NEUTRAL</span>
        </div>

        <div className="bg-[#1a2029] px-2.5 py-1.5">
          <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-[10px]">
            <div className="col-span-3 grid grid-cols-2 gap-4">
              <div>
                <span className="text-white">BALANCE: </span>
                <span className="font-black text-white">$4,909.35</span>
              </div>
              <div>
                <span className="text-emerald-400">EQUITY: </span>
                <span className="font-black text-emerald-400">$4,956.51</span>
              </div>
            </div>
            <div className="text-emerald-400">
              BUY: <span className="font-black">$0.00 (0)</span>
            </div>
            <div className="text-center">
              DD: <span className="font-black">0.0%</span>
            </div>
            <div className="text-right text-emerald-400">
              SELL: <span className="font-black">$0.00 (0)</span>
            </div>
            <div className="text-emerald-400">
              NET: <span className="font-black">$0.00</span>
            </div>
            <div className="text-center">
              Max DD: <span className="font-black">0.0%</span>
            </div>
            <div className="text-right text-emerald-400">
              Today: <span className="font-black">$0.00</span>
            </div>
          </div>
        </div>

        <div className="border-y-2 border-[#f7b500] bg-[#111827] py-0.5 text-center text-[10px] font-black uppercase text-[#ffe100]">
          Trend Filter
        </div>

        <div className="grid grid-cols-3 gap-1 bg-[#10141b] p-0.5">
          {[
            "NO FILTER",
            "ATR SOFT",
            "ADX SOFT",
            "EMA (SONIC)",
            "ATR HARD",
            "ADX HARD",
          ].map((label) => {
            const isActive = activeStrategy === label;
            return (
              <div
                key={label}
                onClick={() => setActiveStrategy(label)}
                className={`min-h-7 px-1.5 py-1 flex items-center justify-center text-center text-[10.5px] font-black uppercase cursor-pointer select-none transition-colors rounded-sm ${isActive
                  ? "bg-[#ffde17] text-[#111827] font-extrabold"
                  : "bg-[#151b24] text-white hover:bg-[#1a202b]"
                  }`}
              >
                {label}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-px border-y-2 border-[#f7b500] bg-[#f7b500]">
          <div className="bg-[#10141b]">
            <div className="border-b-2 border-[#f7b500] bg-[#111827] py-0.5 text-center text-[10px] font-black uppercase text-[#ffe100]">
              Trading
            </div>
            <div className="space-y-1.5 p-1.5">
              {[
                ["Lot:", "0.06"],
                ["Mult:", "1.20"],
                ["Dist:", "600"],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[1fr_45px] items-center gap-1.5">
                  <span className="text-[10px] font-black text-white">{label}</span>
                  <span className="rounded-sm border border-slate-600 bg-[#202833] px-1.5 py-0.5 text-right font-black text-[10px] text-white">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#10141b]">
            <div className="border-b-2 border-[#f7b500] bg-[#111827] py-0.5 text-center text-[10px] font-black uppercase text-[#ffe100]">
              Hedge - Ready
            </div>
            <div className="space-y-1.5 p-1.5">
              {[
                ["Hedge Lot:", "0.10"],
                ["Hedge Mult:", "1.30"],
                ["Hedge Dist:", "600"],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[1fr_45px] items-center gap-1.5">
                  <span className="text-[10px] font-black text-white">{label}</span>
                  <span className="rounded-sm border border-slate-600 bg-[#202833] px-1.5 py-0.5 text-right font-black text-[10px] text-white">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-b-2 border-[#f7b500] bg-[#111827] py-0.5 text-center text-[10px] font-black uppercase text-[#ffe100]">
          Profit Bank - Wait
        </div>

        <div className="grid grid-cols-3 gap-x-3 gap-y-1 bg-[#10141b] px-2 py-1.5 text-[10px]">
          <div>
            Bank: <span className="font-black">$0.00</span>
          </div>
          <div>
            Available: <span className="font-black">$0.00</span>
          </div>
          <div className="text-[#ffe100]">
            Harvest: <span className="font-black">WAIT</span>
          </div>
          <div>
            L3: <span className="font-black">BO / SO</span>
          </div>
          <div>
            Group: <span className="font-black">3</span>
          </div>
          <div className="text-[#ffe100]">
            Trim: <span className="font-black">WAIT</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 bg-[#10141b] p-1">
          <div className="flex min-h-7 items-center justify-center bg-orange-500 hover:bg-orange-650 px-1.5 text-center text-[10px] font-black uppercase text-black cursor-pointer select-none transition-colors rounded-sm">
            Apply Settings
          </div>
          <div
            onClick={() => setEaOn(!eaOn)}
            className={`flex min-h-7 items-center justify-center px-1.5 text-center text-[10px] font-black uppercase transition-colors cursor-pointer select-none rounded-sm ${eaOn ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-slate-800 text-slate-500 border border-slate-700"
              }`}
          >
            EA: {eaOn ? "ON" : "OFF"}
          </div>
          <div className="col-span-2 grid grid-cols-3 gap-1">
            <div
              onClick={() => setBuyOn(!buyOn)}
              className={`flex min-h-7 items-center justify-center px-1.5 text-center text-[10px] font-black uppercase transition-colors cursor-pointer select-none rounded-sm ${buyOn ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-slate-800 text-slate-500 border border-slate-700"
                }`}
            >
              BUY: {buyOn ? "ON" : "OFF"}
            </div>
            <div
              onClick={() => setSellOn(!sellOn)}
              className={`flex min-h-7 items-center justify-center px-1.5 text-center text-[10px] font-black uppercase transition-colors cursor-pointer select-none rounded-sm ${sellOn ? "bg-red-500 text-white hover:bg-red-650" : "bg-slate-800 text-slate-500 border border-slate-700"
                }`}
            >
              SELL: {sellOn ? "ON" : "OFF"}
            </div>
            <div
              onClick={() => setHedgeOn(!hedgeOn)}
              className={`flex min-h-7 items-center justify-center px-1.5 text-center text-[10px] font-black uppercase transition-colors cursor-pointer select-none rounded-sm ${hedgeOn ? "bg-cyan-600 text-white hover:bg-cyan-700" : "bg-slate-800 text-slate-500 border border-slate-700"
                }`}
            >
              HEDGE: {hedgeOn ? "ON" : "OFF"}
            </div>
          </div>
          <div className="flex min-h-7 items-center justify-center bg-red-500 hover:bg-red-650 px-1.5 text-center text-[10px] font-black uppercase text-white cursor-pointer select-none transition-colors rounded-sm">
            Close All
          </div>
          <div
            onClick={() => setLastRoundOn(!lastRoundOn)}
            className={`flex min-h-7 items-center justify-center px-1.5 text-center text-[10px] font-black uppercase transition-colors cursor-pointer select-none rounded-sm ${lastRoundOn ? "bg-[#ffde17] text-[#111827]" : "bg-slate-600 text-white hover:bg-slate-700"
              }`}
          >
            Last Round: {lastRoundOn ? "ON" : "OFF"}
          </div>
        </div>

        <div className="border-t-2 border-[#f7b500] bg-[#10141b] py-1 text-center text-[10px] font-bold text-[#ffe100]">
          Copyright @2026 GoldScalperNinja
        </div>
      </div>
    );
  }

  return null;
}
