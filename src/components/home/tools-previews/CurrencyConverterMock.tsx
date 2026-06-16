"use client";

import { useState } from "react";

export function CurrencyConverterMock() {
  const [hovered, setHovered] = useState(false);

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
        <span>Currency Converter</span>
        <span className="text-amber-600/80 font-black">RATE: 1.0850</span>
      </div>

      {/* Inputs mockup */}
      <div className="flex-1 flex flex-col justify-center gap-1.5 z-10 my-1 font-mono">
        {/* Source currency input */}
        <div className="bg-slate-100 border border-slate-200/60 rounded-lg p-2 flex justify-between items-center text-[10px] font-bold text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="text-base leading-none">{hovered ? "🇪🇺" : "🇺🇸"}</span>
            <span>{hovered ? "EUR" : "USD"}</span>
          </div>
          <span>1.00</span>
        </div>

        {/* Swap icon row */}
        <div className="flex justify-center -my-2.5 relative z-20">
          <div className={`w-5 h-5 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-[9px] text-slate-500 transition-transform duration-500 ${hovered ? 'rotate-180' : 'rotate-0'}`}>
            ⇅
          </div>
        </div>

        {/* Target currency output */}
        <div className="bg-slate-100 border border-slate-200/60 rounded-lg p-2 flex justify-between items-center text-[10px] font-bold text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="text-base leading-none">{hovered ? "🇺🇸" : "🇪🇺"}</span>
            <span>{hovered ? "USD" : "EUR"}</span>
          </div>
          <span>{hovered ? "1.0850" : "0.9216"}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-[8px] font-bold text-slate-400 flex justify-between items-center z-10 border-t border-slate-100 pt-2 font-mono">
        <span>Quotes: Real-time</span>
        <span>Hover to swap directions</span>
      </div>
    </div>
  );
}
