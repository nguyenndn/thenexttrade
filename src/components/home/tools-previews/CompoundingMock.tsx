"use client";

import { useState, useEffect } from "react";

export function CompoundingMock() {
  const [hovered, setHovered] = useState(false);
  const [periods, setPeriods] = useState(12);
  const [balance, setBalance] = useState(3138.43);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (hovered) {
      let currentPeriod = 12;
      interval = setInterval(() => {
        currentPeriod += 1;
        if (currentPeriod >= 24) {
          setPeriods(24);
          setBalance(9849.73); // 1000 * (1.10)^24
          clearInterval(interval);
        } else {
          setPeriods(currentPeriod);
          const bal = 1000 * Math.pow(1.10, currentPeriod);
          setBalance(parseFloat(bal.toFixed(2)));
        }
      }, 30);
    } else {
      setPeriods(12);
      setBalance(3138.43); // 1000 * (1.10)^12
    }
    return () => clearInterval(interval);
  }, [hovered]);

  // Dynamic bar heights for the visual chart
  const barHeights = hovered 
    ? [20, 28, 38, 52, 72, 100] // 24 periods curve
    : [20, 24, 30, 38, 48, 60];  // 12 periods curve

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
        <span>Compound Interest</span>
        <span className="text-amber-600/80 font-black">{periods} PERIODS @ 10%</span>
      </div>

      {/* Bar Chart & Growth Metric */}
      <div className="flex-1 flex items-end justify-between gap-4 z-10 py-1.5 px-1">
        {/* Growth numeric value */}
        <div className="flex flex-col justify-center mb-1">
          <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-wider">Future Balance</span>
          <span className="text-2xl font-black text-amber-700 tracking-tight font-mono transition-transform duration-300">
            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[6.5px] font-bold text-slate-400">Principal: $1,000</span>
        </div>

        {/* Small Bar Graph */}
        <div className="flex items-end gap-1.5 h-16 w-24 pb-0.5 justify-end">
          {barHeights.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end h-full">
              <div 
                className="w-full bg-amber-500/85 hover:bg-amber-600 rounded-t-sm transition-all duration-500 ease-out"
                style={{ height: `${h}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-[8px] font-bold text-slate-400 flex justify-between items-center z-10 border-t border-slate-100 pt-2 font-mono">
        <span>Compounding Mode: Monthly</span>
        <span className={hovered ? "text-amber-600 font-bold" : ""}>
          {hovered ? "Compound Multiplier 9.8x" : "Compound Multiplier 3.1x"}
        </span>
      </div>
    </div>
  );
}
