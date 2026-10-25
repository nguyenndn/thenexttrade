"use client";

import { useState } from "react";
import Link from "next/link";
import { LineChart, WalletCards, Copy, Check, Bot } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/Button";
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
        const textToCopy = server
            ? `${server} · ${accountNumber}`
            : accountNumber;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button
            type="button"
            variant="ghost"
            onClick={handleCopy}
            aria-label={
                server
                    ? `Copy ${server} and account ${accountNumber}`
                    : `Copy account ${accountNumber}`
            }
            title={
                server
                    ? `Click to copy "${server} · ${accountNumber}"`
                    : `Click to copy account #${accountNumber}`
            }
            className="h-auto inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono font-medium text-gray-500 hover:text-primary hover:bg-primary/10 transition-colors border border-gray-200/80 dark:border-white/10 dark:text-gray-400 dark:hover:text-primary"
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
        </Button>
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
    eaVersion?: string | null;
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

export interface UserEaProductAccessItem {
    id: string;
    productId: string;
    tradingAccountId: string | null;
    status: string;
    lastUsedAt?: Date | string | null;
    lastHeartbeatAt?: Date | string | null;
    product: {
        id: string;
        name: string;
        slug: string;
        version: string;
        type: string;
    } | null;
}

export interface UserEaUsageEventItem {
    id: string;
    productId: string;
    tradingAccountId: string | null;
    eventType: string;
    occurredAt: Date | string;
    productVersion?: string | null;
    product: {
        id: string;
        name: string;
        slug: string;
        version: string;
    } | null;
}

interface UserAccountsListProps {
    accounts: TradingAccountItem[];
    userId: string;
    eaProductAccesses?: UserEaProductAccessItem[];
    eaProductUsageEvents?: UserEaUsageEventItem[];
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function UserAccountsList({
    accounts,
    userId,
    eaProductAccesses = [],
    eaProductUsageEvents = [],
}: UserAccountsListProps) {
    const liveAccounts = accounts.filter(
        (a) =>
            a.accountType !== "DEMO" &&
            !a.server?.toLowerCase().includes("demo")
    );
    const totalBalance = liveAccounts.reduce(
        (sum, a) => sum + (a.balance || 0),
        0
    );
    const totalEquity = liveAccounts.reduce(
        (sum, a) => sum + (a.equity ?? a.balance ?? 0),
        0
    );

    const getAccountActiveEas = (accountId: string) => {
        const eaMap = new Map<
            string,
            {
                id: string;
                name: string;
                version: string;
                lastSignal: string | null;
            }
        >();

        for (const ar of eaProductAccesses) {
            if (ar.tradingAccountId === accountId && ar.product) {
                const sig =
                    ar.lastHeartbeatAt || ar.lastUsedAt
                        ? new Date(
                              (ar.lastHeartbeatAt || ar.lastUsedAt) as string
                          ).toISOString()
                        : null;
                eaMap.set(ar.product.id, {
                    id: ar.product.id,
                    name: ar.product.name,
                    version: ar.product.version,
                    lastSignal: sig,
                });
            }
        }

        for (const ev of eaProductUsageEvents) {
            if (ev.tradingAccountId === accountId && ev.product) {
                const existing = eaMap.get(ev.product.id);
                const evTime = new Date(ev.occurredAt).toISOString();
                if (
                    !existing ||
                    !existing.lastSignal ||
                    new Date(evTime) > new Date(existing.lastSignal)
                ) {
                    eaMap.set(ev.product.id, {
                        id: ev.product.id,
                        name: ev.product.name,
                        version: ev.productVersion || ev.product.version,
                        lastSignal: evTime,
                    });
                }
            }
        }

        return Array.from(eaMap.values());
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <WalletCards size={18} className="text-primary" />
                        Trading Accounts & EA Telemetry
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Overview of all live and demo MT4/MT5 accounts, capital allocations, and active EAs.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-1 rounded-lg">
                        {accounts.length} Total ({liveAccounts.length} Real)
                    </span>
                    {liveAccounts.length > 0 && (
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1 rounded-lg font-mono">
                            ${totalBalance.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}{" "}
                            Bal · $
                            {totalEquity.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}{" "}
                            Eq
                        </span>
                    )}
                </div>
            </div>

            {accounts.length > 0 ? (
                <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white shadow-sm dark:divide-white/10 dark:border-white/10 dark:bg-[#151925]">
                    {accounts.map((acc) => {
                        const isDemo =
                            acc.accountType === "DEMO" ||
                            acc.server?.toLowerCase().includes("demo");
                        const lastActiveDate =
                            acc.lastHeartbeat || acc.lastSync;
                        const isOnline =
                            lastActiveDate &&
                            Date.now() - new Date(lastActiveDate).getTime() <=
                                TWENTY_FOUR_HOURS_MS;
                        const accountEas = getAccountActiveEas(acc.id);

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
                                                <span className="shrink-0 text-[10px] font-bold bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                                    Demo
                                                </span>
                                            ) : (
                                                <span className="shrink-0 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                                    Real
                                                </span>
                                            )}
                                            <span className="text-[11px] font-mono text-gray-500">
                                                #{acc.accountNumber || "N/A"}
                                            </span>
                                            <AccountCopyButton
                                                accountNumber={
                                                    acc.accountNumber
                                                }
                                                server={acc.server}
                                            />
                                        </div>

                                        <p className="mt-1 text-xs text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                                                {acc.broker || "Unknown Broker"}
                                            </span>
                                            <span>·</span>
                                            <span>{acc.platform || "MT5"}</span>
                                            {acc.server && (
                                                <>
                                                    <span>·</span>
                                                    <span>{acc.server}</span>
                                                </>
                                            )}
                                            {acc.eaVersion && (
                                                <>
                                                    <span>·</span>
                                                    <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400">
                                                        EA v{acc.eaVersion}
                                                    </span>
                                                </>
                                            )}
                                        </p>

                                        {/* Active EA Badges on this account */}
                                        {accountEas.length > 0 && (
                                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                                {accountEas.map((ea) => (
                                                    <Link
                                                        key={ea.id}
                                                        href={`/admin/trading-systems/${ea.id}`}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                                                    >
                                                        <Bot size={12} />
                                                        <span>{ea.name}</span>
                                                        <span className="font-mono text-[10px] opacity-80">
                                                            v{ea.version}
                                                        </span>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}

                                        {/* Pulsing dot + relative time per UI rules */}
                                        <div
                                            className="mt-2 flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400"
                                            title={
                                                lastActiveDate
                                                    ? `Last heartbeat/sync: ${format(new Date(lastActiveDate), "dd MMM yyyy HH:mm:ss")}`
                                                    : "No heartbeat recorded yet"
                                            }
                                        >
                                            <span className="relative flex h-2 w-2 shrink-0">
                                                {isOnline && (
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                )}
                                                <span
                                                    className={`relative inline-flex rounded-full h-2 w-2 ${
                                                        isOnline
                                                            ? "bg-emerald-500"
                                                            : lastActiveDate
                                                              ? "bg-amber-500"
                                                              : "bg-gray-400"
                                                    }`}
                                                />
                                            </span>
                                            <span>
                                                {lastActiveDate
                                                    ? `Telemetry ${formatDistanceToNow(
                                                          new Date(
                                                              lastActiveDate
                                                          ),
                                                          {
                                                              addSuffix: true,
                                                          }
                                                      )}`
                                                    : "Awaiting EA heartbeat"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0 border-t border-gray-100 pt-3 dark:border-white/5 sm:border-0 sm:pt-0">
                                    <div className="flex items-center gap-2">
                                        <AccountIbAttributionBadge
                                            accountId={acc.id}
                                            initialAttribution={
                                                acc.ibAttribution
                                            }
                                            userId={userId}
                                            accountNumber={acc.accountNumber}
                                        />
                                        <div className="text-right">
                                            <p className="text-base font-black text-gray-800 dark:text-white font-mono">
                                                {new Intl.NumberFormat(
                                                    "en-US",
                                                    {
                                                        style: "currency",
                                                        currency:
                                                            acc.currency ||
                                                            "USD",
                                                        maximumFractionDigits: 2,
                                                    }
                                                ).format(acc.balance || 0)}
                                            </p>
                                            {typeof acc.equity === "number" && (
                                                <p className="text-[11px] text-gray-500 font-mono">
                                                    Eq:{" "}
                                                    {new Intl.NumberFormat(
                                                        "en-US",
                                                        {
                                                            style: "currency",
                                                            currency:
                                                                acc.currency ||
                                                                "USD",
                                                            maximumFractionDigits: 2,
                                                        }
                                                    ).format(acc.equity)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-white/10 dark:bg-[#151925]">
                    <WalletCards
                        size={32}
                        className="mx-auto text-gray-400 mb-3"
                    />
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
