"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
    Zap,
    CandlestickChart,
    Layers,
    History,
    MoreHorizontal,
    Plus,
    PowerOff,
    RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ConnectMt5Modal } from "./ConnectMt5Modal";
import { TradeControlTab } from "./TradeControlTab";
import { LiveChartTab } from "./LiveChartTab";
import { PositionsTab } from "./PositionsTab";
import { ActivityTab } from "./ActivityTab";
import { MoreAccountsTab } from "./MoreAccountsTab";
import type {
    BridgeAccountState,
    CloudAccountSummary,
} from "@/lib/mt5-bridge/types";

type TabId = "trade" | "chart" | "positions" | "activity" | "more";

export function TradeManagerClient() {
    const searchParams = useSearchParams();
    const urlAccountId = searchParams?.get("accountId") || null;

    const [activeTab, setActiveTab] = useState<TabId>("trade");
    const [accounts, setAccounts] = useState<CloudAccountSummary[]>([]);
    const [activeAccountId, setActiveAccountId] = useState<string | null>(urlAccountId);
    const [state, setState] = useState<BridgeAccountState | null>(null);
    const [bridgeError, setBridgeError] = useState<string | null>(null);
    const [telegramId, setTelegramId] = useState("");
    const [timeframe, setTimeframe] = useState(15);
    const [isBusy, setIsBusy] = useState(false);
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isConnectOpen, setIsConnectOpen] = useState(false);

    const fetchState = useCallback(
        async (overrideAccId?: string | null, lite = false) => {
            try {
                const targetId = overrideAccId ?? activeAccountId ?? urlAccountId;
                const qs = new URLSearchParams();
                if (targetId && targetId !== "all") {
                    qs.set("accountId", targetId);
                    if (lite) qs.set("lite", "1");
                }
                qs.set("timeframe", String(timeframe));

                const res = await fetch(`/api/remote/state?${qs.toString()}`, {
                    cache: "no-store",
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    if (Array.isArray(data.accounts)) {
                        setAccounts(data.accounts);
                    } else if (data.state && targetId) {
                        setAccounts((prev) =>
                            prev.map((acc) =>
                                acc.id === targetId
                                    ? {
                                          ...acc,
                                          balance: data.state.balance,
                                          equity: data.state.equity,
                                          status: data.state.connected
                                              ? "ACTIVE"
                                              : acc.status,
                                      }
                                    : acc
                            )
                        );
                    }
                    if (data.activeAccountId && !activeAccountId) {
                        setActiveAccountId(data.activeAccountId);
                    }
                    setState(data.state || null);
                    setBridgeError(data.bridgeError || null);
                    if (typeof data.telegramId === "string") {
                        setTelegramId(data.telegramId);
                    }
                }
            } catch {
                // Keep previous state during transient network jitter
            } finally {
                setIsLoadingInitial(false);
            }
        },
        [activeAccountId, urlAccountId, timeframe]
    );

    // Sync with global header AccountSelector changes
    useEffect(() => {
        if (urlAccountId && urlAccountId !== "all" && urlAccountId !== activeAccountId) {
            setActiveAccountId(urlAccountId);
            void fetchState(urlAccountId, false);
        }
    }, [urlAccountId, activeAccountId, fetchState]);

    useEffect(() => {
        const handleGlobalAccountChange = (e: Event) => {
            const custom = e as CustomEvent<string>;
            if (custom.detail && custom.detail !== "all") {
                setActiveAccountId(custom.detail);
                void fetchState(custom.detail, false);
            }
        };
        window.addEventListener("tnt_account_changed", handleGlobalAccountChange);
        return () =>
            window.removeEventListener("tnt_account_changed", handleGlobalAccountChange);
    }, [fetchState]);

    // Initial full state fetch when account or timeframe changes
    useEffect(() => {
        if (isConnectOpen) return;
        void fetchState(undefined, false);
    }, [fetchState, isConnectOpen]);

    // Non-overlapping background polling (only while connected & tab is visible)
    const isConnected = Boolean(state?.connected);
    useEffect(() => {
        if (isConnectOpen || !isConnected) return;

        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | null = null;

        const scheduleNext = () => {
            if (cancelled) return;
            timer = setTimeout(async () => {
                if (cancelled) return;
                if (
                    typeof document === "undefined" ||
                    document.visibilityState === "visible"
                ) {
                    await fetchState(undefined, true);
                }
                scheduleNext();
            }, 3000);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible" && !cancelled) {
                void fetchState(undefined, true);
            }
        };

        scheduleNext();
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            cancelled = true;
            if (timer) clearTimeout(timer);
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
        };
    }, [fetchState, isConnectOpen, isConnected]);

    const activeAccount =
        accounts.find((a) => a.id === activeAccountId) ||
        accounts.find((a) => a.isMain) ||
        accounts[0] ||
        null;

    const handleConnectButtonClick = async () => {
        // If we have an active/main account with a saved password and it's currently disconnected, connect immediately in 1 click!
        if (activeAccount && activeAccount.hasStoredCredential && !state) {
            setIsBusy(true);
            try {
                const res = await fetch("/api/remote/connect", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ accountId: activeAccount.id }),
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    toast.success(`Connected MT5 #${activeAccount.accountNumber}`);
                    if (data.state) setState(data.state);
                    else await fetchState(activeAccount.id);
                    return;
                }
                if (!data.needsPassword) {
                    toast.error(data.error || "Failed to connect MT5 account");
                }
            } catch {
                // Fall through to open modal
            } finally {
                setIsBusy(false);
            }
        }
        setIsConnectOpen(true);
    };

    const handleExecute = async (
        action: string,
        ticket?: number,
        symbol?: string,
        value?: number
    ) => {
        if (!activeAccountId) return;
        setIsBusy(true);
        try {
            const res = await fetch("/api/remote/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    accountId: activeAccountId,
                    action,
                    ticket,
                    symbol,
                    value,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                toast.error(data.error || data.message || "Execution failed");
                return;
            }
            toast.success(data.message);
            if (data.state) {
                setState(data.state);
            } else {
                await fetchState();
            }
        } catch (err: unknown) {
            toast.error(
                err instanceof Error ? err.message : "Failed to execute command"
            );
        } finally {
            setIsBusy(false);
        }
    };

    const handleManageRule = async (payload: {
        operation: "ADD" | "REMOVE" | "CLEAR" | "SET_DAILY";
        ruleId?: string;
        type?:
            | "PRICE_BE"
            | "PRICE_CLOSE"
            | "DAILY_LOSS_LIMIT"
            | "DAILY_PROFIT_TARGET";
        symbol?: string;
        targetPrice?: number;
        percentValue?: number;
    }) => {
        if (!activeAccountId) return;
        setIsBusy(true);
        try {
            const res = await fetch("/api/remote/rules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    accountId: activeAccountId,
                    ...payload,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                toast.error(data.error || "Failed to update 24/5 rule");
                return;
            }
            toast.success("24/5 Cloud Rule updated");
            if (data.state) {
                setState(data.state);
            }
        } finally {
            setIsBusy(false);
        }
    };

    const handleDisconnect = async (accountId?: string | null) => {
        const targetId = accountId ?? activeAccount?.id ?? activeAccountId;
        if (!targetId) return;
        setIsBusy(true);
        try {
            const res = await fetch(
                `/api/remote/connect?accountId=${encodeURIComponent(targetId)}&removeCredential=false`,
                { method: "DELETE" }
            );
            if (res.ok) {
                toast.success("Disconnected MT5 account from Cloud Bridge");
                setState(null);
                await fetchState(targetId);
            } else {
                toast.error("Failed to disconnect MT5 account");
            }
        } finally {
            setIsBusy(false);
        }
    };

    const handleUnlink = async (accountId: string) => {
        setIsBusy(true);
        try {
            const res = await fetch(
                `/api/remote/connect?accountId=${encodeURIComponent(accountId)}&removeCredential=true`,
                { method: "DELETE" }
            );
            if (res.ok) {
                toast.success("MT5 credential removed and account unlinked");
                setState(null);
                await fetchState(accountId);
            }
        } finally {
            setIsBusy(false);
        }
    };

    const handleSaveTelegram = async (tg: string) => {
        const res = await fetch("/api/remote/telegram", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ telegramId: tg }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
            setTelegramId(data.telegramId);
            toast.success("Telegram alert handle saved");
        }
    };

    const maskedLogin = activeAccount?.accountNumber
        ? `•••• ${activeAccount.accountNumber.slice(-4)}`
        : state?.login
          ? `•••• ${String(state.login).slice(-4)}`
          : "No Account";

    return (
        <div className="mx-auto max-w-2xl pb-6 space-y-4">
            {/* TOP MOBILE HEADER BAR */}
            <div className="rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-3.5 flex flex-wrap items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-2.5">
                    {state?.connected ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-black text-emerald-400">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            {state.isDemo ? "DEMO" : "LIVE"}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-white/5 px-2.5 py-1 text-xs font-black text-gray-500 dark:text-gray-400">
                            <span className="h-2 w-2 rounded-full bg-gray-400" />
                            OFFLINE
                        </span>
                    )}
                    <div>
                        <div className="text-sm font-black text-gray-900 dark:text-white">
                            {maskedLogin}
                        </div>
                        <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                            {state?.server ||
                                activeAccount?.server ||
                                "Direct Cloud MT5 Bridge"}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void fetchState()}
                        aria-label="Refresh telemetry"
                        className="h-9 px-2.5 text-xs"
                    >
                        <RefreshCw size={14} />
                    </Button>
                    {state?.connected ? (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                isLoading={isBusy}
                                onClick={() => void handleDisconnect()}
                                className="h-9 px-3 text-xs text-red-500 border-red-200 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                            >
                                <PowerOff size={14} />
                                <span>Disconnect</span>
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsConnectOpen(true)}
                                aria-label="Switch or add MT5 account"
                                className="h-9 px-2.5 text-xs"
                            >
                                <Plus size={14} />
                            </Button>
                        </>
                    ) : (
                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            isLoading={isBusy}
                            onClick={() => void handleConnectButtonClick()}
                            className="h-9 px-3 text-xs"
                        >
                            <Plus size={14} />
                            <span>Connect MT5</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* EMPTY / DISCONNECTED STATE */}
            {!isLoadingInitial && !state && (
                <div className="rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-6 text-center space-y-4">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                        <Zap size={24} />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-base font-black text-gray-900 dark:text-white">
                            Direct Cloud MT5 Trade Manager (No PC / No VPS)
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                            {bridgeError ||
                                "Connect your MT5 account directly with Login, Password, and Broker Server to unlock 1-tap Breakeven, Secure Profit, Derisk, and 24/5 Price Alerts."}
                        </p>
                    </div>
                    <div className="flex justify-center">
                        <Button
                            type="button"
                            variant="primary"
                            isLoading={isBusy}
                            onClick={() => void handleConnectButtonClick()}
                        >
                            <Plus size={16} />
                            <span>
                                {activeAccount?.accountNumber
                                    ? `Connect MT5 (#${activeAccount.accountNumber})`
                                    : "Connect MT5 Account"}
                            </span>
                        </Button>
                    </div>
                </div>
            )}

            {/* ACTIVE TAB CONTENT */}
            {state && activeTab === "trade" && (
                <TradeControlTab
                    state={state}
                    isBusy={isBusy}
                    onExecute={handleExecute}
                    onManageRule={handleManageRule}
                />
            )}

            {state && activeTab === "chart" && (
                <LiveChartTab
                    state={state}
                    timeframe={timeframe}
                    onChangeTimeframe={setTimeframe}
                    isBusy={isBusy}
                    onExecute={handleExecute}
                />
            )}

            {state && activeTab === "positions" && (
                <PositionsTab
                    state={state}
                    isBusy={isBusy}
                    onExecute={handleExecute}
                />
            )}

            {state && activeTab === "activity" && (
                <ActivityTab activities={state.recentActivity} />
            )}

            {activeTab === "more" && (
                <MoreAccountsTab
                    accounts={accounts}
                    activeAccountId={activeAccountId}
                    isConnected={Boolean(state?.connected)}
                    telegramId={telegramId}
                    isBusy={isBusy}
                    onSelectAccount={(id) => {
                        setActiveAccountId(id);
                        void fetchState(id);
                    }}
                    onOpenConnectModal={() => setIsConnectOpen(true)}
                    onDisconnectAccount={handleDisconnect}
                    onUnlinkAccount={handleUnlink}
                    onSaveTelegram={handleSaveTelegram}
                    onCloseAll={() => handleExecute("CLOSE_ALL")}
                />
            )}

            {/* 5-TAB BOTTOM BAR (MATCHES CARD WIDTH & CONTENT CENTER) */}
            <div className="sticky bottom-2 z-40 w-full rounded-xl bg-white/95 dark:bg-[#1E2028]/95 backdrop-blur-md border border-gray-200 dark:border-white/10 p-1.5 shadow-xl grid grid-cols-5 gap-1.5">
                <Button
                    type="button"
                    variant={activeTab === "trade" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("trade")}
                    className="w-full flex-col gap-1 py-2 px-1 h-auto text-[11px]"
                >
                    <Zap size={16} />
                    <span>Trade</span>
                </Button>
                <Button
                    type="button"
                    variant={activeTab === "chart" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("chart")}
                    className="w-full flex-col gap-1 py-2 px-1 h-auto text-[11px]"
                >
                    <CandlestickChart size={16} />
                    <span>Chart</span>
                </Button>
                <Button
                    type="button"
                    variant={activeTab === "positions" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("positions")}
                    className="w-full flex-col gap-1 py-2 px-1 h-auto text-[11px]"
                >
                    <Layers size={16} />
                    <span>Positions ({state?.openCount ?? 0})</span>
                </Button>
                <Button
                    type="button"
                    variant={activeTab === "activity" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("activity")}
                    className="w-full flex-col gap-1 py-2 px-1 h-auto text-[11px]"
                >
                    <History size={16} />
                    <span>Activity</span>
                </Button>
                <Button
                    type="button"
                    variant={activeTab === "more" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("more")}
                    className="w-full flex-col gap-1 py-2 px-1 h-auto text-[11px]"
                >
                    <MoreHorizontal size={16} />
                    <span>More</span>
                </Button>
            </div>

            <ConnectMt5Modal
                isOpen={isConnectOpen}
                targetAccount={activeAccount}
                onClose={() => setIsConnectOpen(false)}
                onConnected={(newId) => {
                    setActiveAccountId(newId);
                    void fetchState(newId);
                }}
            />
        </div>
    );
}
