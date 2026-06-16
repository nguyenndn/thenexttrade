"use client";

import { useState } from "react";

export function PivotPointMock() {
  const [hovered, setHovered] = useState(false);

  const standardLevels = [
    { label: "R2", price: "1.1100", color: "text-red-500", border: "border-red-200/50" },
    { label: "R1", price: "1.1050", color: "text-red-400", border: "border-red-100/30" },
    { label: "PP", price: "1.1000", color: "text-blue-500", border: "border-blue-200/50" },
    { label: "S1", price: "1.0950", color: "text-emerald-400", border: "border-emerald-100/30" },
    { label: "S2", price: "1.0900", color: "text-emerald-500", border: "border-emerald-200/50" }
  ];

  const camarillaLevels = [
    { label: "H4", price: "1.1085", color: "text-red-500", border: "border-red-200/50" },
    { label: "H3", price: "1.1030", color: "text-red-400", border: "border-red-100/30" },
    { label: "PP", price: "1.1000", color: "text-blue-500", border: "border-blue-200/50" },
    { label: "L3", price: "1.0970", color: "text-emerald-400", border: "border-emerald-100/30" },
    { label: "L4", price: "1.0915", color: "text-emerald-500", border: "border-emerald-200/50" }
  ];

  const currentLevels = hovered ? camarillaLevels : standardLevels;

  return (
    <div
      className="h-44 w-full bg-slate-50 dark:bg-slate-50 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden border border-slate-200/80 select-none cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between z-10 font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">
        <span>Pivot Points</span>
        <span className="text-blue-600/80 font-black">
          {hovered ? "CAMARILLA MODEL" : "STANDARD CLASSIC"}
        </span>
      </div>

      {/* Grid lines layout */}
      <div className="flex-1 flex flex-col justify-between py-2.5 z-10 font-mono text-[8px] font-bold relative">
        {currentLevels.map((lvl) => (
          <div key={lvl.label} className="relative flex items-center justify-between w-full">
            <span className={`w-6 ${lvl.color} font-black`}>{lvl.label}</span>
            <div className={`flex-1 mx-2 border-b border-dashed ${lvl.border} h-px`} />
            <span className="w-10 text-right text-slate-500">{lvl.price}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-[8px] font-bold text-slate-400 flex justify-between items-center z-10 border-t border-slate-100 pt-2 font-mono">
        <span>EURUSD 4H Anchor</span>
        <span>Hover to toggle model</span>
      </div>
    </div>
  );
}
