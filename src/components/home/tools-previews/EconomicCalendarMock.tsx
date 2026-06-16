"use client";

import { useState, useEffect } from "react";

export function EconomicCalendarMock() {
  const [hovered, setHovered] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [released, setReleased] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (hovered) {
      setReleased(false);
      setCountdown(5);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setReleased(true);
            return 0;
          }
          return prev - 1;
        });
      }, 800);
    } else {
      setReleased(false);
      setCountdown(5);
    }
    return () => clearInterval(timer);
  }, [hovered]);

  return (
    <div
      className="h-44 w-full bg-[#faf6f0] dark:bg-[#faf6f0] rounded-xl p-4 flex flex-col justify-between relative overflow-hidden border border-slate-200/60 select-none cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between z-10 font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">
        <span>Economic Calendar</span>
        <div className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-red-500 animate-ping" />
          <span className="text-red-600/80 font-black">HIGH IMPACT TODAY</span>
        </div>
      </div>

      {/* News Entries */}
      <div className="flex-1 flex flex-col justify-center gap-2.5 z-10 my-1 font-mono">
        {/* News Item 1 */}
        <div className="flex items-center justify-between text-[9px] font-bold border-b border-slate-100 pb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="bg-red-500 text-white text-[7px] font-black px-1 rounded">USD</span>
            <span className="text-slate-700">Fed Interest Rate Decision</span>
          </div>
          <div>
            {released ? (
              <span className="text-emerald-600 font-extrabold bg-emerald-50 px-1 rounded border border-emerald-200">
                5.25% (Actual)
              </span>
            ) : hovered ? (
              <span className="text-amber-600 font-extrabold animate-pulse">
                Releasing in {countdown}s...
              </span>
            ) : (
              <span className="text-slate-400 font-medium">Releasing Soon</span>
            )}
          </div>
        </div>

        {/* News Item 2 */}
        <div className="flex items-center justify-between text-[9px] font-bold">
          <div className="flex items-center gap-1.5">
            <span className="bg-amber-500 text-white text-[7px] font-black px-1 rounded">EUR</span>
            <span className="text-slate-700">German Flash Services PMI</span>
          </div>
          <div>
            <span className="text-slate-500 font-extrabold">50.8 (Forecast)</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-[8px] font-bold text-slate-400 flex justify-between items-center z-10 border-t border-slate-100 pt-2 font-mono">
        <span>Data Feed: Live</span>
        <span>Auto-countdown active</span>
      </div>
    </div>
  );
}
