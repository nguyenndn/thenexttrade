"use client";

import React from "react";
import { STRATEGY_FILTERS } from "./shadow-matrix-data";

interface ShadowSettingsViewProps {
    selectedStrategy: string;
    onSelectStrategy: (s: string) => void;
    baseLot: number;
    onChangeBaseLot: (delta: number) => void;
    gridStep: number;
    onChangeGridStep: (delta: number) => void;
    atrSpacing: boolean;
    onToggleAtrSpacing: () => void;
    basketTp: number;
    onChangeBasketTp: (delta: number) => void;
    onBack: () => void;
}

function StepperRow({
    title,
    hint,
    decLabel,
    incLabel,
    displayVal,
    onDec,
    onInc,
}: {
    title: string;
    hint: string;
    decLabel: string;
    incLabel: string;
    displayVal: string;
    onDec: () => void;
    onInc: () => void;
}) {
    return (
        <div className="border border-[#1e2d42] bg-[#080d14] p-2 space-y-1.5">
            <div className="flex items-center justify-between text-[9.5px] font-black">
                <span className="text-white uppercase">{title}</span>
                <span className="text-[#7aa2c4] font-bold">{hint}</span>
            </div>
            <div className="grid grid-cols-[72px_1fr_72px] gap-1.5 text-[10.5px] font-black">
                <div onClick={onDec} className="cursor-pointer select-none border border-[#b83240] bg-[#2a1218] hover:bg-[#3b1820] py-1.5 text-center text-[#ff6b81]">
                    {decLabel}
                </div>
                <div className="border border-[#b87300] bg-[#05080d] py-1.5 text-center text-white tabular-nums">
                    {displayVal}
                </div>
                <div onClick={onInc} className="cursor-pointer select-none border border-[#1f8a4c] bg-[#102a1e] hover:bg-[#163b2a] py-1.5 text-center text-[#4cd964]">
                    {incLabel}
                </div>
            </div>
        </div>
    );
}

export function ShadowSettingsView({
    selectedStrategy,
    onSelectStrategy,
    baseLot,
    onChangeBaseLot,
    gridStep,
    onChangeGridStep,
    atrSpacing,
    onToggleAtrSpacing,
    basketTp,
    onChangeBasketTp,
    onBack,
}: ShadowSettingsViewProps) {
    return (
        <div className="flex-1 flex flex-col justify-between space-y-2 animate-in fade-in duration-200">
            <div className="border border-[#b87300] bg-[#0b0f17] py-2 text-center text-[11.5px] font-black tracking-wide text-[#ffd21f] uppercase">
                ❖ &nbsp; STRATEGY &amp; RISK SETTINGS &nbsp; ❖
            </div>

            <div className="border border-[#1e2d42] bg-[#0a101a] py-1 text-center text-[9.5px] font-bold text-[#7aa2c4]">
                Direct on-chart edit - Persists across timeframes
            </div>

            <div className="border border-[#1e2d42] bg-[#080d14] p-2 space-y-1.5">
                <div className="flex items-center justify-between text-[9.5px] font-black">
                    <span className="text-white uppercase">STRATEGY FILTER (SELECT DIRECTLY)</span>
                    <span className="text-[#e68a00]">Active on Next Seed</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                    {STRATEGY_FILTERS.map((strat) => {
                        const isSelected = selectedStrategy === strat;
                        return (
                            <div
                                key={strat}
                                onClick={() => onSelectStrategy(strat)}
                                className={`cursor-pointer select-none border py-1.5 px-1 text-center text-[9px] font-black transition-colors truncate ${
                                    isSelected ? "border-[#00d4ff] bg-[#0c3b49] text-white" : "border-[#233042] bg-[#101722] text-[#a0aec0] hover:bg-[#172130]"
                                }`}
                            >
                                {isSelected ? `[✔] ${strat}` : strat}
                            </div>
                        );
                    })}
                </div>
            </div>

            <StepperRow
                title="BASE LOT SIZE (TIER 1 SEED LOT)"
                hint="Range: 0.01 - 100.0"
                decLabel="- 0.01"
                incLabel="+ 0.01"
                displayVal={baseLot.toFixed(2)}
                onDec={() => onChangeBaseLot(-0.01)}
                onInc={() => onChangeBaseLot(0.01)}
            />

            <StepperRow
                title="GRID STEP DISTANCE (POINTS)"
                hint="Range: 10 - 5000 pts"
                decLabel="- 10"
                incLabel="+ 10"
                displayVal={String(gridStep)}
                onDec={() => onChangeGridStep(-10)}
                onInc={() => onChangeGridStep(10)}
            />

            <div className="border border-[#1e2d42] bg-[#080d14] p-2 space-y-1.5">
                <div className="flex items-center justify-between text-[9.5px] font-black">
                    <span className="text-white uppercase">DYNAMIC ATR GRID SPACING</span>
                    <span className="text-[#7aa2c4] font-bold">Adaptive volatility buffer</span>
                </div>
                <div
                    onClick={onToggleAtrSpacing}
                    className={`cursor-pointer select-none border py-1.5 text-center text-[10px] font-black uppercase transition-colors ${
                        atrSpacing ? "border-[#1f8a4c] bg-[#102a1e] text-[#4cd964]" : "border-[#2b3545] bg-[#181e29] hover:bg-[#202837] text-[#a0aec0]"
                    }`}
                >
                    {atrSpacing ? "ATR SPACING : [ ON / ENABLED (ATR) ]" : "ATR SPACING : [ OFF / FIXED ]"}
                </div>
            </div>

            <StepperRow
                title="BASKET TAKE PROFIT ($ CASH)"
                hint="Combined basket profit target"
                decLabel="- 5.0"
                incLabel="+ 5.0"
                displayVal={basketTp.toFixed(1)}
                onDec={() => onChangeBasketTp(-5)}
                onInc={() => onChangeBasketTp(5)}
            />

            <div className="py-1 text-center text-[9.5px] font-bold text-[#7aa2c4]">
                Tip: Select strategy button or type values in edit boxes
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
