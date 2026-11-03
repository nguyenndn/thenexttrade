"use client";

import React from "react";
import type { TradeDirection } from "./types";

interface PanelDirectionControlsProps {
    currentDirection: TradeDirection;
    cycleRunning: boolean;
    onSelectDirection: (dir: TradeDirection) => void;
    onToggleCycle: () => void;
    onCloseBuy: () => void;
    onCloseSell: () => void;
    onCloseAll: () => void;
}

export function PanelDirectionControls({
    currentDirection,
    cycleRunning,
    onSelectDirection,
    onToggleCycle,
    onCloseBuy,
    onCloseSell,
    onCloseAll,
}: PanelDirectionControlsProps) {
    const directionButtons: TradeDirection[] = [
        "ONLY BUY",
        "ONLY SELL",
        "BUY & SELL",
        "AUTO TREND",
    ];

    return (
        <div>
            <div className="mb-1.5 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                TRADE  DIRECTION
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                {/* 4 Direction Modes */}
                {directionButtons.map((dir) => {
                    const isActive = currentDirection === dir;
                    return (
                        <div
                            key={dir}
                            role="button"
                            tabIndex={0}
                            onClick={() => onSelectDirection(dir)}
                            onKeyDown={(e) =>
                                (e.key === "Enter" || e.key === " ") &&
                                onSelectDirection(dir)
                            }
                            aria-pressed={isActive}
                            className={`min-h-7 px-2 py-1.5 flex items-center justify-center text-center font-black uppercase tracking-wide cursor-pointer select-none transition-colors ${
                                isActive
                                    ? "border-2 border-[#ffd21f] bg-[#1a1400]/80 text-[#ffd21f] shadow-[0_0_8px_rgba(255,210,31,0.25)]"
                                    : "border border-slate-700 bg-slate-900/60 text-slate-500 hover:border-slate-500 hover:text-slate-300"
                            }`}
                        >
                            {dir}
                        </div>
                    );
                })}

                {/* Close BUY Button */}
                <div
                    role="button"
                    tabIndex={0}
                    onClick={onCloseBuy}
                    onKeyDown={(e) =>
                        (e.key === "Enter" || e.key === " ") && onCloseBuy()
                    }
                    className="min-h-7 border border-emerald-500 bg-emerald-950/40 px-2 py-1.5 flex items-center justify-center text-center font-black uppercase tracking-wide text-emerald-400 cursor-pointer select-none hover:bg-emerald-900/60 active:scale-[0.98] transition-all"
                >
                    CLOSE BUY
                </div>

                {/* Close SELL Button */}
                <div
                    role="button"
                    tabIndex={0}
                    onClick={onCloseSell}
                    onKeyDown={(e) =>
                        (e.key === "Enter" || e.key === " ") && onCloseSell()
                    }
                    className="min-h-7 border border-rose-600 bg-rose-950/40 px-2 py-1.5 flex items-center justify-center text-center font-black uppercase tracking-wide text-rose-400 cursor-pointer select-none hover:bg-rose-900/60 active:scale-[0.98] transition-all"
                >
                    CLOSE SELL
                </div>

                {/* Close ALL Button */}
                <div
                    role="button"
                    tabIndex={0}
                    onClick={onCloseAll}
                    onKeyDown={(e) =>
                        (e.key === "Enter" || e.key === " ") && onCloseAll()
                    }
                    className="min-h-7 border border-red-600 bg-red-950/50 px-2 py-1.5 flex items-center justify-center text-center font-black uppercase tracking-wide text-red-400 cursor-pointer select-none hover:bg-red-900/70 active:scale-[0.98] transition-all"
                >
                    CLOSE ALL
                </div>

                {/* Cycle ON / OFF Toggle Button */}
                <div
                    role="button"
                    tabIndex={0}
                    onClick={onToggleCycle}
                    onKeyDown={(e) =>
                        (e.key === "Enter" || e.key === " ") && onToggleCycle()
                    }
                    aria-label={`Toggle cycle: currently ${cycleRunning ? "ON" : "OFF"}`}
                    className={`min-h-7 px-2 py-1.5 flex items-center justify-center text-center font-black uppercase tracking-wide cursor-pointer select-none active:scale-[0.98] transition-all ${
                        cycleRunning
                            ? "border border-emerald-500 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50"
                            : "border border-amber-500 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50"
                    }`}
                >
                    {cycleRunning ? "CYCLE: ON" : "CYCLE: OFF"}
                </div>
            </div>
        </div>
    );
}
