"use client";

import React, { useEffect, useState } from "react";
import {
    INITIAL_BALANCE,
    INITIAL_ENGINE_UNIT,
    INITIAL_ENTRY_CONFIG,
    INITIAL_EQUITY_BASE,
    SNR_TREND_STATES,
    SnrEngineKey,
    SnrEngineUnitState,
    SnrEntryConfigState,
    SnrH1Trend,
} from "./snr-system-data";
import { SnrHeaderBar } from "./SnrHeaderBar";
import { SnrTelemetryBar } from "./SnrTelemetryBar";
import { SnrEngineGrid } from "./SnrEngineGrid";
import { SnrConfigDeck } from "./SnrConfigDeck";
import { SnrActionBar } from "./SnrActionBar";

export function SnrSystemMockPanel() {
    const [minimized, setMinimized] = useState(false);
    const [eaActive, setEaActive] = useState(true);
    const [h1Trend, setH1Trend] = useState<SnrH1Trend>("BEARISH (SELL)");
    const [buyLocked, setBuyLocked] = useState(true);
    const [sellLocked, setSellLocked] = useState(true);
    const [balance, setBalance] = useState(INITIAL_BALANCE);
    const [equityBase, setEquityBase] = useState(INITIAL_EQUITY_BASE);
    const [dailyPnl, setDailyPnl] = useState(0);
    const [config, setConfig] = useState<SnrEntryConfigState>(INITIAL_ENTRY_CONFIG);
    const [engines, setEngines] = useState<Record<SnrEngineKey, SnrEngineUnitState>>({
        msnr: { ...INITIAL_ENGINE_UNIT },
        ote: { ...INITIAL_ENGINE_UNIT },
        dynSnr: { ...INITIAL_ENGINE_UNIT },
    });
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    const parsedLot = Math.max(0.01, Number.parseFloat(config.baseLot) || 0.02);
    const units = [engines.msnr, engines.ote, engines.dynSnr];
    const openBuyCount = units.reduce((s, u) => s + u.openBuy, 0);
    const openSellCount = units.reduce((s, u) => s + u.openSell, 0);
    const pendBuyCount = units.reduce((s, u) => s + u.pendBuy, 0);
    const pendSellCount = units.reduce((s, u) => s + u.pendSell, 0);
    const totalFloat = units.reduce((s, u) => s + u.moduleFloat, 0);
    const openBuyLots = Number((openBuyCount * parsedLot).toFixed(2));
    const openSellLots = Number((openSellCount * parsedLot).toFixed(2));
    const totalLots = Number((openBuyLots + openSellLots).toFixed(2));

    useEffect(() => {
        if (!toastMsg) return;
        const timer = setTimeout(() => setToastMsg(null), 2200);
        return () => clearTimeout(timer);
    }, [toastMsg]);

    const handleToggleEngine = (key: SnrEngineKey) => {
        setEngines((prev) => {
            const nextEnabled = !prev[key].enabled;
            const nextState = {
                ...prev,
                [key]: { ...prev[key], enabled: nextEnabled },
            };
            const anyEnabled = Object.values(nextState).some((u) => u.enabled);
            if (nextEnabled && buyLocked && sellLocked) {
                setBuyLocked(h1Trend === "BEARISH (SELL)");
                setSellLocked(h1Trend === "BULLISH (BUY)");
            } else if (!anyEnabled) {
                setBuyLocked(true);
                setSellLocked(true);
            }
            return nextState;
        });
    };

    const handleCycleTrend = () => {
        const nextTrend =
            SNR_TREND_STATES[
                (SNR_TREND_STATES.indexOf(h1Trend) + 1) % SNR_TREND_STATES.length
            ];
        setH1Trend(nextTrend);
        setToastMsg(`H1 Storyline: ${nextTrend}`);
    };

    const handleRescanChart = () => {
        const orderSum = pendBuyCount + pendSellCount + openBuyCount + openSellCount;
        if (orderSum > 0) {
            setEngines((prev) => ({
                msnr: { ...prev.msnr, pendBuy: 0, pendSell: 0, openBuy: 0, openSell: 0, moduleFloat: 0 },
                ote: { ...prev.ote, pendBuy: 0, pendSell: 0, openBuy: 0, openSell: 0, moduleFloat: 0 },
                dynSnr: { ...prev.dynSnr, pendBuy: 0, pendSell: 0, openBuy: 0, openSell: 0, moduleFloat: 0 },
            }));
            setToastMsg("Chart Rescanned: Reset to Fresh Flat State");
            return;
        }
        const noneEnabled = !engines.msnr.enabled && !engines.ote.enabled && !engines.dynSnr.enabled;
        const nextBuyLocked = noneEnabled ? false : buyLocked && sellLocked ? false : buyLocked;
        const nextSellLocked = noneEnabled ? false : buyLocked && sellLocked ? false : sellLocked;
        setBuyLocked(nextBuyLocked);
        setSellLocked(nextSellLocked);
        setEngines((prev) => {
            const msnrOn = noneEnabled ? true : prev.msnr.enabled;
            const oteOn = noneEnabled ? true : prev.ote.enabled;
            const dynOn = prev.dynSnr.enabled;
            return {
                msnr: msnrOn ? { enabled: true, pendBuy: nextBuyLocked ? 0 : 2, pendSell: nextSellLocked ? 0 : 2, openBuy: nextBuyLocked ? 0 : 1, openSell: 0, moduleFloat: nextBuyLocked ? 0 : 18.4 } : prev.msnr,
                ote: oteOn ? { enabled: true, pendBuy: nextBuyLocked ? 0 : 1, pendSell: nextSellLocked ? 0 : 2, openBuy: 0, openSell: nextSellLocked ? 0 : 1, moduleFloat: nextSellLocked ? 0 : 24.6 } : prev.ote,
                dynSnr: dynOn ? { enabled: true, pendBuy: nextBuyLocked ? 0 : 1, pendSell: nextSellLocked ? 0 : 1, openBuy: 0, openSell: nextSellLocked ? 0 : 1, moduleFloat: nextSellLocked ? 0 : 9.5 } : prev.dynSnr,
            };
        });
        setToastMsg("MT5 Rescan: Fresh Body SNR & OTE Limits Placed");
    };

    const handleDeleteSide = (side: "BUY" | "SELL") => {
        const key = side === "BUY" ? "pendBuy" : "pendSell";
        const count = side === "BUY" ? pendBuyCount : pendSellCount;
        if (side === "BUY") setBuyLocked(true);
        else setSellLocked(true);
        setEngines((prev) => ({
            msnr: { ...prev.msnr, [key]: 0 },
            ote: { ...prev.ote, [key]: 0 },
            dynSnr: { ...prev.dynSnr, [key]: 0 },
        }));
        setToastMsg(`MT5: Deleted ${count} Pending ${side} Limit(s)`);
    };

    const handleCloseAll = () => {
        const openCount = openBuyCount + openSellCount;
        if (openCount > 0) {
            setBalance((prev) => Number((prev + totalFloat).toFixed(2)));
            setEquityBase((prev) => Number((prev + totalFloat).toFixed(2)));
            setDailyPnl((prev) => Number((prev + totalFloat).toFixed(2)));
        }
        setEngines((prev) => ({
            msnr: { ...prev.msnr, openBuy: 0, openSell: 0, moduleFloat: 0 },
            ote: { ...prev.ote, openBuy: 0, openSell: 0, moduleFloat: 0 },
            dynSnr: { ...prev.dynSnr, openBuy: 0, openSell: 0, moduleFloat: 0 },
        }));
        setToastMsg(`MT5: Closed ${openCount} Open Position(s)`);
    };

    return (
        <div
            className={`relative mx-auto w-full max-w-[540px] lg:w-[500px] xl:w-[540px] border border-[#b87300] bg-[#06090f] p-2.5 text-left font-mono tabular-nums text-[10px] text-white shadow-2xl shadow-black/60 lg:mx-0 ${
                minimized ? "self-start" : "h-full flex flex-col justify-between gap-2"
            }`}
        >
            {toastMsg && (
                <div className="pointer-events-none absolute top-2.5 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap border border-[#ffd21f] bg-[#090d16]/95 px-3 py-1 text-[9.5px] font-black text-[#ffd21f] shadow-lg">
                    {toastMsg}
                </div>
            )}
            <SnrHeaderBar minimized={minimized} onToggleMinimize={() => setMinimized((v) => !v)} />
            {!minimized && (
                <>
                    <SnrTelemetryBar
                        balance={balance}
                        equity={equityBase + totalFloat}
                        dailyPnl={dailyPnl}
                        totalFloat={totalFloat}
                        totalLots={totalLots}
                        eaActive={eaActive}
                        h1Trend={h1Trend}
                        openBuyCount={openBuyCount}
                        openSellCount={openSellCount}
                        openBuyLots={openBuyLots}
                        openSellLots={openSellLots}
                        pendBuyCount={pendBuyCount}
                        pendSellCount={pendSellCount}
                        buyLocked={buyLocked}
                        sellLocked={sellLocked}
                        onToggleEaActive={() => { setEaActive((v) => !v); setToastMsg(!eaActive ? "EA ACTIVE : ON" : "EA ACTIVE : OFF"); }}
                        onCycleTrend={handleCycleTrend}
                        onToggleBuyLock={() => setBuyLocked((v) => !v)}
                        onToggleSellLock={() => setSellLocked((v) => !v)}
                    />
                    <SnrEngineGrid engines={engines} onToggleEngine={handleToggleEngine} />
                    <SnrConfigDeck config={config} onChangeField={(f, val) => setConfig((c) => ({ ...c, [f]: val }))} />
                    <SnrActionBar
                        onDeleteBuy={() => handleDeleteSide("BUY")}
                        onDeleteSell={() => handleDeleteSide("SELL")}
                        onCloseAll={handleCloseAll}
                        onRescanChart={handleRescanChart}
                        onApplyConfig={() => setToastMsg("MT5: Entry & SL/TP Config Applied")}
                    />
                </>
            )}
        </div>
    );
}
