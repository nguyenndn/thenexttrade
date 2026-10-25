"use client";

import { useState } from "react";
import Link from "next/link";
import {
    X,
    Search,
    Users,
    Mail,
    Copy,
    Check,
    ExternalLink,
    ShieldCheck,
    Bot,
    Wallet,
    Activity,
    Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import type { ProductFarmStats } from "@/lib/admin/trading-systems/ea-farm-stats.server";

export interface ProductActiveUser {
    id: string;
    userId: string;
    name: string;
    email: string;
    image?: string | null;
    tradingAccountId?: string | null;
    accountNumber?: string | null;
    broker?: string | null;
    server?: string | null;
    platform?: string | null;
    accountType?: string | null;
    balance?: number | null;
    equity?: number | null;
    currency?: string | null;
    status: string;
    accountStatus?: string | null;
    isConfirmedAccount?: boolean;
    isOnline?: boolean;
    grantedAt?: string | null;
    lastUsedAt?: string | null;
    lastHeartbeatAt?: string | null;
}

interface ProductUsersModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: {
        id: string;
        name: string;
        version: string;
        thumbnail?: string | null;
        activeUsers?: ProductActiveUser[];
        farmStats?: ProductFarmStats;
    } | null;
}

function formatMoney(amount: number | null | undefined, currency = "USD"): string {
    if (amount === null || amount === undefined || !Number.isFinite(amount)) {
        return "—";
    }
    const prefix = currency.toUpperCase() === "USD" ? "$" : "";
    const suffix =
        currency.toUpperCase() !== "USD" ? ` ${currency.toUpperCase()}` : "";
    return `${prefix}${amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}${suffix}`;
}

export function ProductUsersModal({
    isOpen,
    onClose,
    product,
}: ProductUsersModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

    if (!isOpen || !product) return null;

    const users = product.activeUsers || [];
    const farmStats = product.farmStats;

    const filteredUsers = users.filter((u) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.accountNumber && u.accountNumber.toLowerCase().includes(q)) ||
            (u.broker && u.broker.toLowerCase().includes(q)) ||
            (u.server && u.server.toLowerCase().includes(q))
        );
    });

    const handleCopyEmail = (email: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(email);
        setCopiedEmail(email);
        toast.success(`Copied ${email} to clipboard!`);
        setTimeout(() => setCopiedEmail(null), 2000);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-white dark:bg-[#121624] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Modal Header ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-gray-50/75 dark:bg-[#181E32]/75">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 overflow-hidden">
                            {product.thumbnail ? (
                                <img
                                    src={product.thumbnail}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Bot size={20} />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                    EA Farm Telemetry & Active Accounts
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    {product.name} v{product.version}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Live MT4/MT5 account capital, heartbeat telemetry, and trader allocations.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={onClose}
                            className="rounded-lg h-9 w-9 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                            aria-label="Close"
                        >
                            <X size={18} />
                        </Button>
                    </div>
                </div>

                {/* ── EA Farm Capital Summary Strip ── */}
                {farmStats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-200 dark:divide-white/10 border-b border-gray-200 dark:border-white/10 bg-gray-50/40 dark:bg-white/[0.02]">
                        <div className="p-4">
                            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                <span>Confirmed EA Farm Capital</span>
                                <Wallet size={14} />
                            </div>
                            <p className="text-lg font-extrabold text-gray-900 dark:text-white mt-1 font-mono">
                                {formatMoney(farmStats.confirmedFarmBalanceUSD)}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                Eq: {formatMoney(farmStats.confirmedFarmEquityUSD)} · {farmStats.confirmedAccountsCount} linked accts
                            </p>
                        </div>

                        <div className="p-4">
                            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                <span>User Pool Capital</span>
                                <Layers size={14} />
                            </div>
                            <p className="text-lg font-extrabold text-gray-900 dark:text-white mt-1 font-mono">
                                {formatMoney(farmStats.userPoolBalanceUSD)}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                Eq: {formatMoney(farmStats.userPoolEquityUSD)} · {farmStats.totalAccountsCount} total accts
                                {farmStats.demoAccountsCount > 0
                                    ? ` (${farmStats.demoAccountsCount} demo)`
                                    : ""}
                            </p>
                        </div>

                        <div className="p-4">
                            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                <span>Online Telemetry (24h)</span>
                                <Activity size={14} />
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="relative flex h-2.5 w-2.5">
                                    {farmStats.onlineAccountsCount > 0 && (
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    )}
                                    <span
                                        className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                                            farmStats.onlineAccountsCount > 0
                                                ? "bg-emerald-500"
                                                : "bg-gray-400"
                                        }`}
                                    />
                                </span>
                                <p className="text-lg font-extrabold text-gray-900 dark:text-white font-mono">
                                    {farmStats.onlineAccountsCount} / {farmStats.totalAccountsCount}
                                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 ml-1">
                                        ({farmStats.liveAccountsCount} live)
                                    </span>
                                </p>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                Fresh capital: {formatMoney(farmStats.confirmedFreshBalanceUSD)}
                            </p>
                        </div>

                        <div className="p-4">
                            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                                <span>Licensed Traders</span>
                                <Users size={14} />
                            </div>
                            <p className="text-lg font-extrabold text-gray-900 dark:text-white mt-1 font-mono">
                                {farmStats.uniqueTradersCount}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                {users.length} account allocations
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Search & Filter Bar ── */}
                <div className="p-4 sm:px-6 bg-white dark:bg-[#121624] border-b border-gray-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-80">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            aria-label="Filter traders by name, email, account number, or broker"
                            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            Showing: <strong className="text-gray-900 dark:text-white">{filteredUsers.length}</strong> {filteredUsers.length === 1 ? "allocation" : "allocations"}
                        </span>
                        <Link href={`/admin/trading-systems/${product.id}`}>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                            >
                                <span>Manage Product</span>
                                <ExternalLink size={12} />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* ── User List Table ── */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center text-center px-4">
                            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 mb-3">
                                <Users size={24} />
                            </div>
                            <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-1">
                                {searchQuery ? "No matching traders found" : "No active users yet"}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
                                {searchQuery
                                    ? `No traders match "${searchQuery}". Try searching with a different name or email.`
                                    : `When traders connect their MT4/MT5 accounts and run ${product.name}, they will appear here.`}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-gray-50 dark:bg-[#181E32] sticky top-0 z-10 border-b border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold text-[10px]">
                                <tr>
                                    <th className="px-6 py-3">Trader</th>
                                    <th className="px-6 py-3">MT4/MT5 Account</th>
                                    <th className="px-6 py-3">Capital (Balance / Equity)</th>
                                    <th className="px-6 py-3">Telemetry Heartbeat</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/10 bg-white dark:bg-[#121624]">
                                {filteredUsers.map((user) => {
                                    const isDemo = user.accountType === "DEMO";
                                    const lastSignal = user.lastHeartbeatAt || user.lastUsedAt;
                                    return (
                                        <tr
                                            key={user.id}
                                            className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                                        >
                                            {/* User Column */}
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 overflow-hidden font-bold text-amber-600 dark:text-amber-400 text-xs shadow-sm">
                                                        {user.image ? (
                                                            <img
                                                                src={user.image}
                                                                alt={user.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            user.name.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <Link
                                                            href={`/admin/users/${user.userId}`}
                                                            className="font-bold text-gray-900 dark:text-white hover:text-amber-500 dark:hover:text-amber-400 transition-colors truncate block"
                                                        >
                                                            {user.name}
                                                        </Link>
                                                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-[11px] mt-0.5">
                                                            <span className="truncate max-w-[180px]">
                                                                {user.email}
                                                            </span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                type="button"
                                                                onClick={(e) =>
                                                                    handleCopyEmail(user.email, e)
                                                                }
                                                                className="h-auto w-auto p-0.5 text-gray-500 dark:text-gray-400 hover:text-amber-500 transition-colors"
                                                                aria-label={`Copy email ${user.email}`}
                                                                title="Copy email"
                                                            >
                                                                {copiedEmail === user.email ? (
                                                                    <Check
                                                                        size={11}
                                                                        className="text-emerald-500"
                                                                    />
                                                                ) : (
                                                                    <Copy size={11} />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Trading Account Column */}
                                            <td className="px-6 py-3.5">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                                                            {user.accountNumber && user.accountNumber !== "—"
                                                                ? `#${user.accountNumber}`
                                                                : "—"}
                                                        </span>
                                                        {user.platform && user.accountNumber !== "—" && (
                                                            <span className="px-1.5 py-0.2 rounded-lg text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
                                                                {user.platform}
                                                            </span>
                                                        )}
                                                        {user.accountType && (
                                                            <span
                                                                className={`px-1.5 py-0.2 rounded-lg text-[10px] font-bold border font-mono ${
                                                                    isDemo
                                                                        ? "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20"
                                                                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                                }`}
                                                            >
                                                                {user.accountType}
                                                            </span>
                                                        )}
                                                        {user.isConfirmedAccount && (
                                                            <span
                                                                className="px-1.5 py-0.2 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                                                title="Account confirmed running this EA via telemetry"
                                                            >
                                                                EA Linked
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                                        {user.broker || "Default Broker"}
                                                        {user.server ? ` · ${user.server}` : ""}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Capital Column */}
                                            <td className="px-6 py-3.5">
                                                {user.balance !== null && user.balance !== undefined ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        <span
                                                            className={`font-mono font-bold text-xs ${
                                                                isDemo
                                                                    ? "text-gray-500 dark:text-gray-400"
                                                                    : "text-gray-900 dark:text-white"
                                                            }`}
                                                        >
                                                            {formatMoney(
                                                                user.balance,
                                                                user.currency || "USD"
                                                            )}
                                                        </span>
                                                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                                                            Eq:{" "}
                                                            {formatMoney(
                                                                user.equity ?? user.balance,
                                                                user.currency || "USD"
                                                            )}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>

                                            {/* Telemetry Status Column (Pulsing dot + formatDistanceToNow) */}
                                            <td className="px-6 py-3.5">
                                                <div className="flex flex-col gap-0.5">
                                                    <div
                                                        className="flex items-center gap-2"
                                                        title={
                                                            lastSignal
                                                                ? `Last signal: ${format(new Date(lastSignal), "dd MMM yyyy HH:mm:ss")}`
                                                                : "No heartbeat recorded yet"
                                                        }
                                                    >
                                                        <span className="relative flex h-2 w-2 shrink-0">
                                                            {user.isOnline && (
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                            )}
                                                            <span
                                                                className={`relative inline-flex rounded-full h-2 w-2 ${
                                                                    user.isOnline
                                                                        ? "bg-emerald-500"
                                                                        : lastSignal
                                                                          ? "bg-amber-500"
                                                                          : "bg-gray-400"
                                                                }`}
                                                            />
                                                        </span>
                                                        <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                                            {lastSignal
                                                                ? formatDistanceToNow(
                                                                      new Date(lastSignal),
                                                                      { addSuffix: true }
                                                                  )
                                                                : "Awaiting connection"}
                                                        </span>
                                                    </div>
                                                    {user.grantedAt && (
                                                        <span className="text-[10px] text-gray-400 pl-4">
                                                            Granted{" "}
                                                            {format(
                                                                new Date(user.grantedAt),
                                                                "dd MMM yyyy"
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions Column */}
                                            <td className="px-6 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <a
                                                        href={`mailto:${user.email}`}
                                                        className="p-1.5 rounded-lg text-gray-500 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                                                        aria-label={`Send email to ${user.email}`}
                                                        title={`Send email to ${user.email}`}
                                                    >
                                                        <Mail size={14} />
                                                    </a>
                                                    <Link
                                                        href={`/admin/users/${user.userId}`}
                                                        className="p-1.5 rounded-lg text-gray-500 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                                                        aria-label={`View trader profile for ${user.name}`}
                                                        title="View Trader Profile"
                                                    >
                                                        <ExternalLink size={14} />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* ── Modal Footer ── */}
                <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#181E32]">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        <span>
                            Live MT5 trade telemetry & capital snapshots synced via TheNextTrade Bridge.
                        </span>
                    </div>

                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="rounded-lg h-9 px-4 text-xs font-semibold"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}
