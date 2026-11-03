"use client";

import React from "react";

interface ShadowCalendarViewProps {
    onBack: () => void;
}

const CALENDAR_WEEKS = [
    {
        week: "WEEK 1",
        total: "+$612.40",
        days: ["-", "142.50", "98.20", "164.00", "-42.30", "250.00", "-"],
    },
    {
        week: "WEEK 2",
        total: "+$748.90",
        days: ["-", "185.10", "112.40", "210.00", "96.40", "145.00", "-"],
    },
    {
        week: "WEEK 3",
        total: "+$534.10",
        days: ["-", "120.00", "-65.40", "175.50", "154.00", "150.00", "-"],
    },
    {
        week: "WEEK 4",
        total: "+$689.20",
        days: ["-", "160.20", "148.00", "192.00", "89.00", "100.00", "-"],
    },
    {
        week: "WEEK 5",
        total: "+$344.80",
        days: ["-", "137.02", "200.00", "7.78", "-", "-", "-"],
    },
] as const;

export function ShadowCalendarView({ onBack }: ShadowCalendarViewProps) {
    return (
        <div className="flex-1 flex flex-col justify-between space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border border-[#b87300] bg-[#0b0f17] px-3 py-2">
                <span className="text-[11px] font-black tracking-wide text-[#ffd21f] uppercase">
                    ❖ &nbsp; MONTHLY PROFIT CALENDAR &nbsp; ❖
                </span>
                <div className="flex items-center gap-1 text-[9px] font-black">
                    <span className="cursor-pointer select-none border border-[#233042] bg-[#101722] px-1.5 py-0.5 text-white">
                        &lt;
                    </span>
                    <span className="border border-[#9e6508] bg-[#141a24] px-2 py-0.5 text-[#f5a623]">
                        THIS MONTH
                    </span>
                    <span className="cursor-pointer select-none border border-[#233042] bg-[#101722] px-1.5 py-0.5 text-white">
                        &gt;
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <div className="border border-[#9e6508] bg-[#090d14] py-2.5 px-2 text-center">
                    <div className="text-[9.5px] font-black text-white uppercase">TOTAL P/L</div>
                    <div className="mt-1 text-[13.5px] font-black text-[#00e676] tabular-nums">+$2,929.40</div>
                </div>
                <div className="border border-[#9e6508] bg-[#090d14] py-2.5 px-2 text-center">
                    <div className="text-[9.5px] font-black text-white uppercase">TOTAL TRADES</div>
                    <div className="mt-1 text-[13.5px] font-black text-[#00c8ff] tabular-nums">804</div>
                </div>
                <div className="border border-[#9e6508] bg-[#090d14] py-2.5 px-2 text-center">
                    <div className="text-[9.5px] font-black text-white uppercase">TOTAL LOTS</div>
                    <div className="mt-1 text-[13.5px] font-black text-white tabular-nums">24.80 lots</div>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-between border border-[#1e2d42] bg-[#080d14] p-2.5 space-y-1.5">
                <div className="grid grid-cols-8 gap-1 text-center text-[9px] font-black text-[#7aa2c4] pb-1.5 border-b border-slate-800">
                    {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT", "WEEK"].map((d) => (
                        <span key={d}>{d}</span>
                    ))}
                </div>
                <div className="flex-1 grid grid-rows-5 gap-1.5 py-0.5">
                    {CALENDAR_WEEKS.map((row) => (
                        <div key={row.week} className="grid grid-cols-8 gap-1 text-center text-[9px] font-bold">
                            {row.days.map((val, idx) => {
                                const isNeg = val.startsWith("-");
                                const isEmpty = val === "-";
                                const isToday = val === "7.78";
                                return (
                                    <div
                                        key={idx}
                                        className={`h-full px-0.5 tabular-nums border flex items-center justify-center ${
                                            isEmpty
                                                ? "border-slate-800/60 bg-[#0b1018] text-slate-600"
                                                : isNeg
                                                  ? "border-[#6b202b] bg-[#48161e] text-[#ff9aa2]"
                                                  : isToday
                                                    ? "border-[#d28c14] bg-[#144c2c] text-white font-black"
                                                    : "border-[#1d5e3a] bg-[#144c2c] text-white"
                                        }`}
                                    >
                                        {val}
                                    </div>
                                );
                            })}
                            <div className="h-full flex items-center justify-center border border-[#1e2d42] bg-[#0d1624] text-[8.5px] font-black text-[#00e676] tabular-nums">
                                {row.total}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 text-[9px] font-bold text-[#7aa2c4]">
                    <span>Win Days: <strong className="text-[#00e676]">19 / 21 (90.5%)</strong></span>
                    <span>Best Day: <strong className="text-[#00e676]">+$250.00</strong></span>
                    <span>Avg/Day: <strong className="text-white">+$139.49</strong></span>
                </div>
            </div>

            <div
                onClick={onBack}
                className="cursor-pointer select-none border border-[#00d4ff] bg-[#0a2332] hover:bg-[#0e3146] py-2 text-center text-[10.5px] font-black uppercase text-[#00d4ff] transition-colors"
            >
                &lt;&lt; BACK TO MAIN DASHBOARD
            </div>
        </div>
    );
}
