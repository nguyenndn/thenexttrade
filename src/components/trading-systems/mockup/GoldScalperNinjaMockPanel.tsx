"use client";

import React, { useState } from "react";
import {
    type TradeDirection,
    type BasketPosition,
    type AccountTelemetry,
    INITIAL_ACCOUNT,
    INITIAL_BUY,
    INITIAL_SELL,
} from "../goldscalperninja-panel/types";
import { PanelHeader } from "../goldscalperninja-panel/PanelHeader";
import { PanelAccountInfo } from "../goldscalperninja-panel/PanelAccountInfo";
import { PanelFloatingPL } from "../goldscalperninja-panel/PanelFloatingPL";
import { PanelPositionGrid } from "../goldscalperninja-panel/PanelPositionGrid";
import { PanelStatusBox } from "../goldscalperninja-panel/PanelStatusBox";
import { PanelDirectionControls } from "../goldscalperninja-panel/PanelDirectionControls";
import { PanelFooter } from "../goldscalperninja-panel/PanelFooter";

export function GoldScalperNinjaMockPanel() {
    const [direction, setDirection] = useState<TradeDirection>("BUY & SELL");
    const [cycleRunning, setCycleRunning] = useState(true);
    const [account, setAccount] = useState<AccountTelemetry>(INITIAL_ACCOUNT);
    const [buy, setBuy] = useState<BasketPosition>(INITIAL_BUY);
    const [sell, setSell] = useState<BasketPosition>(INITIAL_SELL);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const floatingPL = buy.profit + sell.profit;

    const showFeedback = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage((curr) => (curr === msg ? null : curr)), 2200);
    };

    const handleSelectDirection = (newDir: TradeDirection) => {
        setDirection(newDir);
        showFeedback(`Direction Mode: ${newDir}`);
    };

    const handleToggleCycle = () => {
        setCycleRunning((prev) => {
            const next = !prev;
            showFeedback(next ? "Cycle Master: RESUMED" : "Cycle Master: STOPPED");
            return next;
        });
    };

    const handleCloseBuy = () => {
        if (buy.orders > 0) {
            setAccount((prev) => ({
                ...prev,
                balance: prev.balance + buy.profit,
                equity: prev.equity,
                todayPL: prev.todayPL + buy.profit,
            }));
            setBuy({ orders: 0, lots: 0.0, profit: 0.0 });
            showFeedback("BUY Basket Closed");
        } else {
            showFeedback("MT5: 0 BUY orders closed");
        }
    };

    const handleCloseSell = () => {
        if (sell.orders > 0) {
            setAccount((prev) => ({
                ...prev,
                balance: prev.balance + sell.profit,
                equity: prev.equity,
                todayPL: prev.todayPL + sell.profit,
            }));
            setSell({ orders: 0, lots: 0.0, profit: 0.0 });
            showFeedback("SELL Basket Closed");
        } else {
            showFeedback("MT5: 0 SELL orders closed");
        }
    };

    const handleCloseAll = () => {
        const totalProfit = buy.profit + sell.profit;
        setAccount((prev) => ({
            ...prev,
            balance: prev.balance + totalProfit,
            equity: prev.balance + totalProfit,
            todayPL: prev.todayPL + totalProfit,
        }));
        setBuy({ orders: 0, lots: 0.0, profit: 0.0 });
        setSell({ orders: 0, lots: 0.0, profit: 0.0 });
        showFeedback("MT5: Emergency Close All Executed");
    };

    const handleLoadSampleBasket = () => {
        if (buy.orders === 0 && sell.orders === 0) {
            setBuy({ orders: 2, lots: 0.04, profit: 45.2 });
            setSell({ orders: 1, lots: 0.02, profit: -12.5 });
            setAccount((prev) => ({ ...prev, equity: prev.balance + 32.7 }));
            showFeedback("Sample Basket Injected (+$32.70)");
        } else {
            setBuy(INITIAL_BUY);
            setSell(INITIAL_SELL);
            setAccount(INITIAL_ACCOUNT);
            showFeedback("Reset to Screenshot State (+$0.00)");
        }
    };

    return (
        <div className="relative mx-auto w-full max-w-[384px] select-none border-2 border-[#ffd21f] bg-[#070d17] p-2.5 text-left font-mono tabular-nums text-[10px] text-slate-300 shadow-2xl shadow-black/80">
            {toastMessage && (
                <div className="absolute top-1 right-2 left-2 z-20 border border-[#ffd21f] bg-black/90 py-1 text-center text-[10px] font-bold text-[#ffd21f] shadow-lg animate-in fade-in duration-150">
                    {toastMessage}
                </div>
            )}

            <PanelHeader />
            <PanelAccountInfo account={account} />
            <div
                role="button"
                tabIndex={0}
                onClick={handleLoadSampleBasket}
                onKeyDown={(e) => e.key === "Enter" && handleLoadSampleBasket()}
                title="Click to toggle sample basket simulation"
                className="cursor-pointer"
            >
                <PanelFloatingPL floatingPL={floatingPL} />
            </div>
            <PanelPositionGrid buy={buy} sell={sell} />
            <PanelStatusBox
                cycleRunning={cycleRunning}
                newsStatus="OK"
                dailyStatus="OK"
                licenseStatus="ACTIVE | lifetime"
                accountId="1610076507"
                direction={direction}
            />
            <PanelDirectionControls
                currentDirection={direction}
                cycleRunning={cycleRunning}
                onSelectDirection={handleSelectDirection}
                onToggleCycle={handleToggleCycle}
                onCloseBuy={handleCloseBuy}
                onCloseSell={handleCloseSell}
                onCloseAll={handleCloseAll}
            />
            <PanelFooter />
        </div>
    );
}
