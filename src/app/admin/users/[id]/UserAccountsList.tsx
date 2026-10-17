"use client";

import { useState } from "react";
import { LineChart, WalletCards, RefreshCw, Copy, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AccountIbAttributionBadge } from "@/components/admin/users/AccountIbAttributionBadge";

function AccountCopyButton({
    accountNumber,
    server,
}: {
    accountNumber: string | null;
    server: string | null;
}) {
    const [copied, setCopied] = useState(false);

    if (!accountNumber) return null;

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        const textToCopy = server ? `${server} · ${accountNumber}` : accountNumber;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            title={server ? `Click to copy "${server} · ${accountNumber}"` : `Click to copy account #${accountNumber}`}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono font-medium text-gray-500 hover:text-primary hover:bg-primary/10 transition-colors border border-gray-200/80 dark:border-white/10 dark:text-gray-400 dark:hover:text-primary"
        >
            {copied ? (
                <>
                    <Check size={11} className="text-emerald-500 shrink-0" />
                    <span className="text-emerald-500 font-bold">Copied</span>
                </>
            ) : (
                <>
                    <Copy size={11} className="text-gray-400 shrink-0" />
                    <span>Copy</span>
                </>
            )}
        </button>
    );
}

export interface TradingAccountItem {
    id: string;
    name: string | null;
    broker: string | null;
    balance: number;
    equity?: number | null;
    currency?: string | null;
    status: string;
    platform: string;
    accountNumber: string | null;
    accountType: string | null;
    server: string | null;
    lastHeartbeat?: Date | string | null;
    lastSync?: Date | string | null;
    totalTrades?: number | null;
    syncSource?: string | null;
    ibAttribution?: string | null;
    ibAttributionSource?: string | null;
    ibAttributionAt?: Date | string | null;
    ibAttributionBy?: string | null;
    createdAt: Date | string;
}

interface UserAccountsListProps {
    accounts: TradingAccountItem[];
    userId: string;
}

export function UserAccountsList({ accounts, userId }: UserAccountsListProps) {
    const liveAccounts = accounts.filter(
        (a) => a.accountType !== "DEMO" && !a.server?.toLowerCase().includes("demo")
    );
    const totalBalance = liveAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <WalletCards size={18} className="text-primary" />
                        Trading Accounts
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Overview of all live and demo MT4/MT5 accounts connected by this user.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-1 rounded-lg">
                        {accounts.length} Total ({liveAccounts.length} Live)
                    </span>
                    {liveAccounts.length > 0 && (
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1 rounded-lg">
                            ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Live
                        </span>
                    )}
                </div>
            </div>

            {accounts.length > 0 ? (
                <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white shadow-sm dark:divide-white/10 dark:border-white/10 dark:bg-[#151925]">
                    {accounts.map((acc) => {
                        const isDemo =
                            acc.accountType === "DEMO" ||
                            acc.server?.toLowerCase().includes("demo");
                        const lastActiveDate = acc.lastSync || acc.lastHeartbeat;

                        return (
                            <div
                                key={acc.id}
                                className="flex flex-col gap-4 p-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between sm:p-5"
                            >
                                <div className="flex min-w-0 items-start gap-3.5">
                                    <div className="p-2.5 bg-gray-100 dark:bg-white/5 rounded-lg text-gray-600 dark:text-gray-300 shrink-0 mt-0.5">
                                        <LineChart size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-bold text-gray-800 dark:text-white truncate">
                                                {acc.name || "Unnamed Account"}
                                            </p>
                                            {isDemo ? (
                                                <span className="shrink-0 text-[10px] font-bold bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                    Demo
                                                </span>
                                            ) : (
                                                <span className="shrink-0 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                    Real
                                                </span>
                                            )}
                                            <span className="text-[11px] font-mono text-gray-500">
                                                #{acc.accountNumber || "N/A"}
                                            </span>
                                            <AccountCopyButton
                                                accountNumber={acc.accountNumber}
                                                server={acc.server}
                                            />
                                        </div>

                                        <p className="mt-1 text-xs text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                                                {acc.broker || "Unknown Broker"}
                                            </span>
                                            <span>·</span>
                                            <span>{acc.platform || "MT4"}</span>
                                            {acc.server && (
                                                <>
                                                    <span>·</span>
                                                    <span>{acc.server}</span>
                                                </>
                                            )}
                                        </p>

                                        {lastActiveDate && (
                                            <p className="mt-1 text-[11px] text-gray-600 flex items-center gap-1.5">
                                                <RefreshCw size={11} className="text-gray-600" />
                                                <span>
                                                    Last synced{" "}
                                                    {formatDistanceToNow(new Date(lastActiveDate), {
                                                        addSuffix: true,
                                                    })}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0 border-t border-gray-100 pt-3 dark:border-white/5 sm:border-0 sm:pt-0">
                                    <div className="flex items-center gap-2">
                                        <AccountIbAttributionBadge
                                            accountId={acc.id}
                                            initialAttribution={acc.ibAttribution}
                                            userId={userId}
                                            accountNumber={acc.accountNumber}
                                        />
                                        <div className="text-right">
                                            <p className="text-base font-black text-gray-800 dark:text-white">
                                                {new Intl.NumberFormat("en-US", {
                                                    style: "currency",
                                                    currency: acc.currency || "USD",
                                                    maximumFractionDigits: 2,
                                                }).format(acc.balance || 0)}
                                            </p>
                                            {typeof acc.equity === "number" && acc.equity !== acc.balance && (
                                                <p className="text-[11px] text-gray-500">
                                                    Equity: ${acc.equity.toFixed(2)}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${
                                                acc.status === "CONNECTED"
                                                    ? "text-emerald-500"
                                                    : "text-gray-600"
                                            }`}
                                        >
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${
                                                    acc.status === "CONNECTED"
                                                        ? "bg-emerald-500 animate-pulse"
                                                        : "bg-gray-400"
                                                }`}
                                            />
                                            {acc.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-white/10 dark:bg-[#151925]">
                    <WalletCards size={32} className="mx-auto text-gray-400 mb-3" />
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        No trading accounts linked yet.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        When the user connects MT4/MT5 accounts via the trading terminal or EA, they will show up here.
                    </p>
                </div>
            )}
        </div>
    );
}
