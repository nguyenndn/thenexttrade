"use client";

import React, { useState } from "react";
import { Plus, PowerOff, Unlink, Crown, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { HoldToConfirmButton } from "./HoldToConfirmButton";
import type { CloudAccountSummary } from "@/lib/mt5-bridge/types";

interface MoreAccountsTabProps {
    accounts: CloudAccountSummary[];
    activeAccountId: string | null;
    isConnected: boolean;
    telegramId: string;
    isBusy: boolean;
    onSelectAccount: (accountId: string) => void;
    onOpenConnectModal: () => void;
    onDisconnectAccount: (accountId: string) => Promise<void>;
    onUnlinkAccount: (accountId: string) => Promise<void>;
    onSaveTelegram: (telegramId: string) => Promise<void>;
    onCloseAll: () => Promise<void>;
}

export function MoreAccountsTab({
    accounts,
    activeAccountId,
    isConnected,
    telegramId,
    isBusy,
    onSelectAccount,
    onOpenConnectModal,
    onDisconnectAccount,
    onUnlinkAccount,
    onSaveTelegram,
    onCloseAll,
}: MoreAccountsTabProps) {
    const [tgInput, setTgInput] = useState(telegramId);
    const [tgSaved, setTgSaved] = useState(false);

    const handleSaveTg = async () => {
        await onSaveTelegram(tgInput);
        setTgSaved(true);
        setTimeout(() => setTgSaved(false), 2500);
    };

    return (
        <div className="space-y-4">
            {/* CONNECTED MT5 ACCOUNTS */}
            <div className="rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                            Connected MT5 Cloud Accounts
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Maintained 24/5 in Cloud Bridge RAM without PC or VPS.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={onOpenConnectModal}
                        className="h-9 text-xs"
                    >
                        <Plus size={14} />
                        <span>Connect MT5</span>
                    </Button>
                </div>

                {accounts.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 dark:border-white/10 p-6 text-center space-y-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            No MT5 accounts linked yet. Connect in 10 seconds using your Login, Password, and Broker Server.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {accounts.map((acc) => {
                            const isCurrent = acc.id === activeAccountId;
                            const accLive = isCurrent ? isConnected : acc.status === "ACTIVE";
                            return (
                                <div
                                    key={acc.id}
                                    className={`rounded-xl border p-4 space-y-3 transition-colors ${
                                        isCurrent
                                            ? "border-amber-500/40 bg-amber-500/5"
                                            : "border-gray-200 dark:border-white/10 bg-gray-50/40 dark:bg-[#151925]"
                                    }`}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`h-2.5 w-2.5 rounded-full ${
                                                    accLive
                                                        ? "bg-emerald-400 animate-pulse"
                                                        : "bg-gray-400"
                                                }`}
                                            />
                                            <span className="text-sm font-black text-gray-900 dark:text-white">
                                                {acc.name}
                                            </span>
                                            {acc.isUnderIb ? (
                                                <span className="rounded-lg bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                                                    Under IB • Free 24/5
                                                </span>
                                            ) : (
                                                <span className="rounded-lg bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                                                    Trial Access
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {!isCurrent && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        onSelectAccount(acc.id)
                                                    }
                                                    className="h-8 text-xs"
                                                >
                                                    Switch Active
                                                </Button>
                                            )}
                                            {accLive && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        onDisconnectAccount(acc.id)
                                                    }
                                                    className="h-8 text-xs text-amber-600 dark:text-amber-400"
                                                >
                                                    <PowerOff size={12} />
                                                    <span>Disconnect</span>
                                                </Button>
                                            )}
                                            {acc.hasStoredCredential && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        onUnlinkAccount(acc.id)
                                                    }
                                                    className="h-8 text-xs text-red-400"
                                                >
                                                    <Unlink size={12} />
                                                    <span>Forget Password</span>
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2x2 MATRIX SPECS CARD */}
                                    <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 dark:divide-white/5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028]">
                                        <div className="p-2.5">
                                            <div className="text-[10px] font-bold uppercase text-gray-400">
                                                Account #
                                            </div>
                                            <div className="text-xs font-extrabold text-gray-900 dark:text-white truncate">
                                                {acc.accountNumber}
                                            </div>
                                        </div>
                                        <div className="p-2.5">
                                            <div className="text-[10px] font-bold uppercase text-gray-400">
                                                Broker
                                            </div>
                                            <div className="text-xs font-extrabold text-gray-900 dark:text-white truncate">
                                                {acc.broker}
                                            </div>
                                        </div>
                                        <div className="p-2.5">
                                            <div className="text-[10px] font-bold uppercase text-gray-400">
                                                Server
                                            </div>
                                            <div className="text-xs font-extrabold text-gray-900 dark:text-white truncate">
                                                {acc.server || "Direct Cloud"}
                                            </div>
                                        </div>
                                        <div className="p-2.5">
                                            <div className="text-[10px] font-bold uppercase text-gray-400">
                                                Active Until
                                            </div>
                                            <div className="text-xs font-extrabold text-amber-400 truncate">
                                                {acc.accessExpiresAt
                                                    ? new Date(
                                                          acc.accessExpiresAt
                                                      ).toLocaleDateString()
                                                    : "Unlimited"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* SWITCH TO PARTNER IB CARD */}
            <div className="rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-4 space-y-2">
                <div className="flex items-center gap-2">
                    <Crown size={16} className="text-amber-400" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-gray-900 dark:text-white">
                        Unlock Unlimited 24/5 Cloud Protection (Partner IB)
                    </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    Accounts opened or transferred under TheNextTrade Partner IB receive unlimited 24/5 Cloud Trade Manager execution, sub-15ms London/Singapore broker routing, and automated Price Alerts at zero monthly cost.
                </p>
            </div>

            {/* TELEGRAM NOTIFICATION SETTINGS */}
            <div className="rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Send size={15} className="text-cyan-400" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-gray-900 dark:text-white">
                        Telegram 24/5 Alert Handle
                    </span>
                </div>
                <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400">
                        Receive instant Telegram alerts when 24/5 price or daily loss rules trigger while your phone is off
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={tgInput}
                            onChange={(e) => setTgInput(e.target.value)}
                            className="flex-1 h-10 rounded-lg bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 px-3 text-xs font-bold text-gray-900 dark:text-white"
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handleSaveTg}
                            className="h-10 px-4 text-xs"
                        >
                            {tgSaved ? (
                                <>
                                    <CheckCircle2 size={14} />
                                    <span>Saved</span>
                                </>
                            ) : (
                                <span>Save</span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* EMERGENCY HOLD TO CLOSE ALL */}
            <div className="rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-4">
                <HoldToConfirmButton
                    disabled={isBusy}
                    isLoading={isBusy}
                    onConfirm={onCloseAll}
                />
            </div>
        </div>
    );
}
