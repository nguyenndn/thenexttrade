"use client";

import React, { useEffect, useState } from "react";
import {
    DcaModuleState, INITIAL_DYNAMIC_SNR_STATE, INITIAL_EQUITY,
    INITIAL_MSNR_STATE, INITIAL_OTE_STATE, MsnrModuleState,
    SNR_STORIES, SNR_TIMEFRAMES, SnrStoryState, SnrTimeframe,
} from "./snr-system-data";
import { SnrHeaderBar } from "./SnrHeaderBar";
import { SnrTelemetryBar } from "./SnrTelemetryBar";
import { SnrMsnrColumn } from "./SnrMsnrColumn";
import { SnrDcaModuleColumn } from "./SnrDcaModuleColumn";
import { SnrActionBar } from "./SnrActionBar";

export function SnrSystemMockPanel() {
    const [paused, setPaused] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [timeframe, setTimeframe] = useState<SnrTimeframe>("H1");
    const [story, setStory] = useState<SnrStoryState>("RANGING");
    const [buyReady, setBuyReady] = useState(true);
    const [sellReady, setSellReady] = useState(true);
    const [equity, setEquity] = useState(INITIAL_EQUITY);
    const [dailyPnl, setDailyPnl] = useState(0);
    const [msnr, setMsnr] = useState<MsnrModuleState>(INITIAL_MSNR_STATE);
    const [ote, setOte] = useState<DcaModuleState>(INITIAL_OTE_STATE);
    const [dynSnr, setDynSnr] = useState<DcaModuleState>(INITIAL_DYNAMIC_SNR_STATE);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    const totalFloat = msnr.moduleFloat + ote.moduleFloat + dynSnr.moduleFloat;

    useEffect(() => {
        if (!toastMsg) return;
        const timer = setTimeout(() => setToastMsg(null), 2200);
        return () => clearTimeout(timer);
    }, [toastMsg]);

    const handleCycleTfStory = () => {
        const nextTf = SNR_TIMEFRAMES[(SNR_TIMEFRAMES.indexOf(timeframe) + 1) % SNR_TIMEFRAMES.length];
        const nextStory = SNR_STORIES[(SNR_STORIES.indexOf(story) + 1) % SNR_STORIES.length];
        setTimeframe(nextTf);
        setStory(nextStory);
        setToastMsg(`Scanned ${nextTf} | Storyline: ${nextStory}`);
    };

    const handleRescanOrSimulate = () => {
        const orderSum = [msnr, ote, dynSnr].reduce((sum, m) => sum + m.pendBuy + m.pendSell + m.openBuy + m.openSell, 0);
        if (orderSum > 0) {
            const clear = { pendBuy: 0, pendSell: 0, openBuy: 0, openSell: 0, moduleFloat: 0 };
            setMsnr((s) => ({ ...s, ...clear }));
            setOte((s) => ({ ...s, ...clear }));
            setDynSnr((s) => ({ ...s, ...clear }));
            setToastMsg("Chart Rescanned: Reset to Fresh Flat State");
            return;
        }
        setMsnr((s) => s.enabled ? { ...s, pendBuy: buyReady ? 2 : 0, pendSell: sellReady ? 2 : 0, openBuy: buyReady ? 1 : 0, openSell: 0, moduleFloat: buyReady ? 18.4 : 0 } : s);
        setOte((s) => s.enabled ? { ...s, pendBuy: buyReady ? 1 : 0, pendSell: sellReady ? 1 : 0, openBuy: 0, openSell: sellReady ? 1 : 0, moduleFloat: sellReady ? 24.6 : 0 } : s);
        setDynSnr((s) => s.enabled ? { ...s, pendBuy: buyReady ? 1 : 0, pendSell: sellReady ? 1 : 0, openBuy: buyReady ? 1 : 0, openSell: 0, moduleFloat: buyReady ? 9.5 : 0 } : s);
        setToastMsg(`MT5 Rescan (${timeframe}): Fresh Body SNR & OTE Limits Placed`);
    };

    const handleDeletePendingSide = (side: "BUY" | "SELL") => {
        const key = side === "BUY" ? "pendBuy" : "pendSell";
        const count = msnr[key] + ote[key] + dynSnr[key];
        setMsnr((s) => ({ ...s, [key]: 0 }));
        setOte((s) => ({ ...s, [key]: 0 }));
        setDynSnr((s) => ({ ...s, [key]: 0 }));
        setToastMsg(`MT5: Deleted ${count} Pending ${side} Limit(s)`);
    };

    const handleCloseAllOpen = () => {
        const openCount = msnr.openBuy + msnr.openSell + ote.openBuy + ote.openSell + dynSnr.openBuy + dynSnr.openSell;
        if (openCount > 0) {
            setEquity((prev) => Number((prev + totalFloat).toFixed(2)));
            setDailyPnl((prev) => Number((prev + totalFloat).toFixed(2)));
        }
        const clearOpen = { openBuy: 0, openSell: 0, moduleFloat: 0 };
        setMsnr((s) => ({ ...s, ...clearOpen }));
        setOte((s) => ({ ...s, ...clearOpen }));
        setDynSnr((s) => ({ ...s, ...clearOpen }));
        setToastMsg(`MT5: Closed ${openCount} Open Position(s)`);
    };

    return (
        <div
            className={`relative mx-auto w-full max-w-[632px] lg:w-[596px] xl:w-[632px] rounded-[2px] border-2 border-[#f59e0b] bg-[#080c14] p-2 text-left font-mono tabular-nums text-[10px] text-white shadow-2xl shadow-black/60 lg:mx-0 ${
                minimized ? "self-start space-y-2" : "h-full flex flex-col justify-between gap-2"
            }`}
        >
            {toastMsg && (
                <div className="pointer-events-none absolute top-2.5 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap rounded-[2px] border border-[#fbbf24] bg-[#090d16]/95 px-3 py-1 text-[9.5px] font-black text-[#fbbf24] shadow-lg">
                    {toastMsg}
                </div>
            )}
            <SnrHeaderBar
                paused={paused}
                minimized={minimized}
                timeframe={timeframe}
                story={story}
                buyReady={buyReady}
                sellReady={sellReady}
                onTogglePause={() => { setPaused((v) => !v); setToastMsg(!paused ? "SNR Engine: PAUSED" : "SNR Engine: ACTIVE"); }}
                onToggleMinimize={() => setMinimized((v) => !v)}
                onCycleTfStory={handleCycleTfStory}
                onToggleBuyReady={() => setBuyReady((v) => !v)}
                onToggleSellReady={() => setSellReady((v) => !v)}
            />
            {!minimized && (
                <>
                    <SnrTelemetryBar equity={equity + totalFloat} totalFloat={totalFloat} dailyPnl={dailyPnl} onSimulateTelemetry={handleRescanOrSimulate} />
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <SnrMsnrColumn
                            state={msnr}
                            onToggleEnabled={() => setMsnr((s) => ({ ...s, enabled: !s.enabled }))}
                            onToggleMode={() => setMsnr((s) => ({ ...s, mode: s.mode === "SINGLE (1R -> BE)" ? "SINGLE (FIXED TP)" : "SINGLE (1R -> BE)" }))}
                            onChangeField={(f, val) => setMsnr((s) => ({ ...s, [f]: val }))}
                        />
                        <SnrDcaModuleColumn
                            idPrefix="ote"
                            engineTitle="CHOCH OTE"
                            state={ote}
                            onToggleEnabled={() => setOte((s) => ({ ...s, enabled: !s.enabled }))}
                            onToggleMode={() => setOte((s) => ({ ...s, mode: s.mode === "SINGLE" ? "DCA" : "SINGLE" }))}
                            onToggleLotMode={() => setOte((s) => ({ ...s, lotMode: s.lotMode === "ADD (+)" ? "MULT (x)" : "ADD (+)" }))}
                            onChangeField={(f, val) => setOte((s) => ({ ...s, [f]: val }))}
                        />
                        <SnrDcaModuleColumn
                            idPrefix="dynsnr"
                            engineTitle="DYNAMIC S&R"
                            state={dynSnr}
                            onToggleEnabled={() => setDynSnr((s) => ({ ...s, enabled: !s.enabled }))}
                            onToggleMode={() => setDynSnr((s) => ({ ...s, mode: s.mode === "SINGLE" ? "DCA" : "SINGLE" }))}
                            onToggleLotMode={() => setDynSnr((s) => ({ ...s, lotMode: s.lotMode === "ADD (+)" ? "MULT (x)" : "ADD (+)" }))}
                            onChangeField={(f, val) => setDynSnr((s) => ({ ...s, [f]: val }))}
                        />
                    </div>
                    <SnrActionBar
                        onDeletePendingBuy={() => handleDeletePendingSide("BUY")}
                        onDeletePendingSell={() => handleDeletePendingSide("SELL")}
                        onCloseAllOpen={handleCloseAllOpen}
                        onRescanChart={handleRescanOrSimulate}
                        onApplySettings={() => setToastMsg("MT5: SNR Command Deck Settings Applied")}
                    />
                </>
            )}
        </div>
    );
}
