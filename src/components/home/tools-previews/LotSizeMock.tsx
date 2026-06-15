"use client";

import { useState, useEffect } from "react";

export function LotSizeMock() {
  const [hovered, setHovered] = useState(false);
  const [displayValue, setDisplayValue] = useState(0.00);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (hovered) {
      let current = 0.00;
      interval = setInterval(() => {
        current += 0.03;
        if (current >= 0.33) {
          setDisplayValue(0.33);
          clearInterval(interval);
        } else {
          setDisplayValue(parseFloat(current.toFixed(2)));
        }
      }, 30);
    } else {
      setDisplayValue(0.33); // baseline display when not hovered
    }

    return () => clearInterval(interval);
  }, [hovered]);

  return (
    <div 
      className="h-44 w-full bg-[#fdfbf7] dark:bg-[#fdfbf7] rounded-xl p-4 flex flex-col justify-between relative overflow-hidden border border-slate-200/60 select-none cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between z-10 font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">
        <span>Optimal Lot Size</span>
        <span className="text-amber-600/80">RISK MODEL: 1%</span>
      </div>

      {/* Main output display */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 py-1">
        <span className="text-3xl font-black text-amber-700 tracking-tight font-mono">
          {displayValue.toFixed(2)}
        </span>
        <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mt-0.5">
          Standard Lots · Optimized
        </span>
      </div>

      {/* Lower grid metrics */}
      <div className="grid grid-cols-4 gap-1.5 z-10 border-t border-slate-100 pt-3">
        {/* Risk */}
        <div className="bg-[#faf6f0] border border-amber-200/40 rounded-lg p-1.5 text-center flex flex-col justify-between transition-colors">
          <span className="text-[7px] font-black text-slate-400 uppercase tracking-wider">Risk $</span>
          <span className="text-[10px] font-bold text-slate-700 font-mono mt-0.5">$200</span>
        </div>
        {/* Max DD */}
        <div className="bg-[#faf6f0] border border-amber-200/40 rounded-lg p-1.5 text-center flex flex-col justify-between">
          <span className="text-[7px] font-black text-slate-400 uppercase tracking-wider">Max DD</span>
          <span className="text-[10px] font-bold text-slate-700 font-mono mt-0.5">6%</span>
        </div>
        {/* Avg P/L */}
        <div className="bg-[#faf6f0] border border-amber-200/40 rounded-lg p-1.5 text-center flex flex-col justify-between">
          <span className="text-[7px] font-black text-slate-400 uppercase tracking-wider">Avg P/L</span>
          <span className="text-[10px] font-bold text-emerald-600 font-mono mt-0.5">+$400</span>
        </div>
        {/* Growth */}
        <div className="bg-[#faf6f0] border border-amber-200/40 rounded-lg p-1.5 text-center flex flex-col justify-between">
          <span className="text-[7px] font-black text-slate-400 uppercase tracking-wider">Growth</span>
          <span className="text-[10px] font-bold text-emerald-600 font-mono mt-0.5">+4%</span>
        </div>
      </div>
    </div>
  );
}
