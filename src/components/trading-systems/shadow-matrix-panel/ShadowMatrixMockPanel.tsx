"use client";

import React, { useState } from "react";
import { ShadowMainView } from "./ShadowMainView";
import { ShadowSettingsView } from "./ShadowSettingsView";
import { ShadowCalendarView } from "./ShadowCalendarView";

type ShadowViewMode = "MAIN" | "SETTINGS" | "CALENDAR";

export function ShadowMatrixMockPanel() {
    const [view, setView] = useState<ShadowViewMode>("MAIN");
    const [eaActive, setEaActive] = useState(true);
    const [atrSpacing, setAtrSpacing] = useState(false);
    const [lastRound, setLastRound] = useState(false);
    const [selectedStrategy, setSelectedStrategy] = useState("MACD Trend");
    const [baseLot, setBaseLot] = useState(0.02);
    const [gridStep, setGridStep] = useState(150);
    const [basketTp, setBasketTp] = useState(50.0);

    const handleBaseLot = (delta: number) => {
        setBaseLot((prev) =>
            Math.max(0.01, Math.min(100, Number((prev + delta).toFixed(2))))
        );
    };

    const handleGridStep = (delta: number) => {
        setGridStep((prev) => Math.max(10, Math.min(5000, prev + delta)));
    };

    const handleBasketTp = (delta: number) => {
        setBasketTp((prev) =>
            Math.max(5.0, Math.min(1000, Number((prev + delta).toFixed(1))))
        );
    };

    return (
        <div className="mx-auto w-full max-w-[465px] lg:w-[465px] h-[580px] min-h-[580px] flex flex-col border border-[#b87300] bg-[#06090f] p-2.5 text-left font-mono tabular-nums text-[10px] text-white shadow-2xl shadow-black/60 lg:mx-0">
            {view === "MAIN" && (
                <ShadowMainView
                    eaActive={eaActive}
                    onToggleEaActive={() => setEaActive((v) => !v)}
                    atrSpacing={atrSpacing}
                    onToggleAtrSpacing={() => setAtrSpacing((v) => !v)}
                    lastRound={lastRound}
                    onToggleLastRound={() => setLastRound((v) => !v)}
                    selectedStrategy={selectedStrategy}
                    basketTp={basketTp}
                    onOpenSettings={() => setView("SETTINGS")}
                    onOpenCalendar={() => setView("CALENDAR")}
                />
            )}

            {view === "SETTINGS" && (
                <ShadowSettingsView
                    selectedStrategy={selectedStrategy}
                    onSelectStrategy={setSelectedStrategy}
                    baseLot={baseLot}
                    onChangeBaseLot={handleBaseLot}
                    gridStep={gridStep}
                    onChangeGridStep={handleGridStep}
                    atrSpacing={atrSpacing}
                    onToggleAtrSpacing={() => setAtrSpacing((v) => !v)}
                    basketTp={basketTp}
                    onChangeBasketTp={handleBasketTp}
                    onBack={() => setView("MAIN")}
                />
            )}

            {view === "CALENDAR" && (
                <ShadowCalendarView onBack={() => setView("MAIN")} />
            )}
        </div>
    );
}

