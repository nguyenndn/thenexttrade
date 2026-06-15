"use client";

import { useState } from "react";

export function CorrelationMock() {
  const [activeCell, setActiveCell] = useState<{ r: number; c: number } | null>(null);

  const currencies = ["EUR", "GBP", "USD", "JPY"];
  // Mock correlation values
  const matrix = [
    [1.00, 0.82, -0.65, 0.14], // EUR row
    [0.82, 1.00, -0.58, 0.22], // GBP row
    [-0.65, -0.58, 1.00, -0.71], // USD row
    [0.14, 0.22, -0.71, 1.00], // JPY row
  ];

  return (
    <div className="h-44 w-full bg-slate-50 dark:bg-slate-50 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden border border-slate-200/80 select-none cursor-pointer">
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between z-10 font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">
        <span>Correlation Matrix</span>
        <div className="flex items-center gap-1 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
          <span className="text-[9px] text-cyan-600 font-extrabold uppercase tracking-wider">DATA ANALYSIS</span>
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="flex-1 flex flex-col justify-center my-1 z-10 font-mono">
        {/* Currencies Headers */}
        <div className="grid grid-cols-5 gap-1 text-[8px] font-black text-slate-400 text-center mb-1">
          <div /> {/* Top-left empty cell */}
          {currencies.map((cur) => (
            <div key={cur}>{cur}</div>
          ))}
        </div>

        {/* Rows */}
        <div className="space-y-1">
          {matrix.map((row, rIdx) => (
            <div key={rIdx} className="grid grid-cols-5 gap-1 items-center">
              {/* Row Header */}
              <span className="text-[8px] font-black text-slate-400 text-center">{currencies[rIdx]}</span>
              
              {/* Cells */}
              {row.map((val, cIdx) => {
                const isPositive = val > 0;
                const isOne = val === 1.00;
                const isActive = activeCell && (activeCell.r === rIdx || activeCell.c === cIdx);
                
                // Color scaling based on value (light mode palette)
                let cellBg = "bg-slate-100 border-slate-200 text-slate-500";
                if (!isOne) {
                  if (isPositive) {
                    cellBg = val > 0.5 
                      ? "bg-emerald-100 border-emerald-200 text-emerald-700 font-bold" 
                      : "bg-emerald-50 border-emerald-100/50 text-emerald-600";
                  } else {
                    cellBg = val < -0.6 
                      ? "bg-rose-100 border-rose-200 text-rose-700 font-bold" 
                      : "bg-rose-50 border-rose-100/50 text-rose-600";
                  }
                } else {
                  cellBg = "bg-slate-200/50 border-slate-300/50 text-slate-400 font-medium";
                }

                return (
                  <div
                    key={cIdx}
                    className={`text-[8.5px] p-1 border rounded text-center transition-all duration-200 ${cellBg} ${
                      isActive ? "scale-105 border-cyan-500/50 shadow-sm bg-white" : ""
                    }`}
                    onMouseEnter={() => setActiveCell({ r: rIdx, c: cIdx })}
                    onMouseLeave={() => setActiveCell(null)}
                  >
                    {isOne ? "-" : (val > 0 ? `+${Math.round(val * 100)}` : `${Math.round(val * 100)}`)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-[8px] font-bold text-slate-400 flex justify-between items-center z-10 border-t border-slate-100 pt-2 font-mono">
        <span>180-day correlation coefficient</span>
        <span>Auto-sync active</span>
      </div>
    </div>
  );
}
