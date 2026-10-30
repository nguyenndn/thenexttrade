"use client";

import React, { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import {
    CloudSync,
    Server,
    DollarSign,
    ShieldCheck,
    RefreshCw,
    PowerOff,
    Crown,
    History,
    Play,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import {
    getAdminMt5CloudMonitorData,
    adminReconnectMt5Account,
    adminDisconnectMt5Account,
    adminToggleUnderIbAndExtend,
    type AdminMt5CloudOverview,
    type AdminMt5CloudRow,
} from "./actions";
import { Mt5CloudActivityModal } from "./Mt5CloudActivityModal";

interface Mt5CloudAdminClientProps {
    initialData: AdminMt5CloudOverview;
}

export function Mt5CloudAdminClient({ initialData }: Mt5CloudAdminClientProps) {
    const [data, setData] = useState<AdminMt5CloudOverview>(initialData);
    const [search, setSearch] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [busyKey, setBusyKey] = useState<string | null>(null);
    const [selectedLogRow, setSelectedLogRow] =
        useState<AdminMt5CloudRow | null>(null);

    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const latest = await getAdminMt5CloudMonitorData();
            setData(latest);
        } catch {
            // Keep current snapshot on transient error
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            void refresh();
        }, 4000);
        return () => clearInterval(timer);
    }, [refresh]);

    const handleReconnect = async (row: AdminMt5CloudRow) => {
        if (!row.accountId) {
            toast.error("Account has no stored database credential to reconnect.");
            return;
        }
        setBusyKey(`reconn_${row.login}`);
        try {
            const res = await adminReconnectMt5Account(row.accountId);
            if (res.ok) {
                toast.success(`Reconnected MT5 #${row.accountNumber}`);
                await refresh();
            } else {
                toast.error(res.error || "Reconnect failed");
            }
        } finally {
            setBusyKey(null);
        }
    };

    const handleDisconnect = async (row: AdminMt5CloudRow) => {
        setBusyKey(`disc_${row.login}`);
        try {
            await adminDisconnectMt5Account(row.accountId, row.login);
            toast.success(`Disconnected MT5 #${row.accountNumber}`);
            await refresh();
        } finally {
            setBusyKey(null);
        }
    };

    const handleToggleIb = async (row: AdminMt5CloudRow) => {
        if (!row.accountId) return;
        setBusyKey(`ib_${row.login}`);
        try {
            const res = await adminToggleUnderIbAndExtend(row.accountId, 30);
            if (res.success) {
                toast.success(
                    res.isUnderIb
                        ? `Marked #${row.accountNumber} as Under IB (+30 days)`
                        : `Removed Under IB status for #${row.accountNumber}`
                );
                await refresh();
            }
        } finally {
            setBusyKey(null);
        }
    };

    const { health, rows } = data;
    const isBridgeOnline = health.status === "ONLINE";

    const filteredRows = rows.filter((r) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
            r.accountNumber.toLowerCase().includes(q) ||
            r.server.toLowerCase().includes(q) ||
            r.userName.toLowerCase().includes(q) ||
            r.userEmail.toLowerCase().includes(q)
        );
    });

    const formatUptime = (sec: number) => {
        if (sec <= 0) return "0m";
        const hrs = Math.floor(sec / 3600);
        const mins = Math.floor((sec % 3600) / 60);
        return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m ${sec % 60}s`;
    };

    return (
        <div className="space-y-6">
            {/* PAGE HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                        MT5 Cloud Direct Bridge Monitor
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        Multi-account C# .NET Direct Socket telemetry, 24/5 armed rules, and IB access controls.
                    </p>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    isLoading={isRefreshing}
                    onClick={() => void refresh()}
                    className="h-9 text-xs"
                >
                    <RefreshCw size={14} />
                    <span>Refresh Telemetry</span>
                </Button>
            </div>

            {/* 4 KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-5 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Bridge Status
                        </span>
                        <Server size={16} className="text-emerald-400" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span
                            className={`h-2.5 w-2.5 rounded-full ${
                                isBridgeOnline
                                    ? "bg-emerald-400 animate-pulse"
                                    : "bg-red-500"
                            }`}
                        />
                        <span className="text-xl font-black text-gray-900 dark:text-white">
                            {isBridgeOnline ? "Online" : "Offline"}
                        </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                        RAM: {health.memoryMb.toFixed(1)} MB • Uptime:{" "}
                        {formatUptime(health.uptimeSeconds)}
                    </div>
                </div>

                <div className="rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-5 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Connected Accounts
                        </span>
                        <CloudSync size={16} className="text-cyan-400" />
                    </div>
                    <div className="text-xl font-black text-gray-900 dark:text-white">
                        {health.connectedAccounts} Active{" "}
                        <span className="text-sm font-semibold text-gray-400">
                            / {health.totalAccounts} Total
                        </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                        {rows.filter((r) => r.status === "IDLE_SLEEP").length > 0
                            ? `${rows.filter((r) => r.status === "IDLE_SLEEP").length} Smart Sleep (0 MB) • Build ${health.mt5Build}`
                            : `MT5 Protocol Build ${health.mt5Build}`}
                    </div>
                </div>

                <div className="rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-5 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Total Live Equity (AUM)
                        </span>
                        <DollarSign size={16} className="text-amber-400" />
                    </div>
                    <div className="text-xl font-black text-gray-900 dark:text-white">
                        $
                        {health.totalLiveEquity.toLocaleString("en-US", {
                            maximumFractionDigits: 0,
                        })}
                    </div>
                    <div
                        className={`text-xs font-extrabold ${
                            health.totalFloatingPnl >= 0
                                ? "text-emerald-400"
                                : "text-red-400"
                        }`}
                    >
                        {health.totalFloatingPnl >= 0 ? "+" : "-"}$
                        {Math.abs(health.totalFloatingPnl).toLocaleString(
                            "en-US",
                            { maximumFractionDigits: 2 }
                        )}{" "}
                        floating P&amp;L
                    </div>
                </div>

                <div className="rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-5 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Armed 24/5 Rules
                        </span>
                        <ShieldCheck size={16} className="text-emerald-400" />
                    </div>
                    <div className="text-xl font-black text-gray-900 dark:text-white">
                        {health.armedRulesCount} Active Guards
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                        Watched in real-time on every tick
                    </div>
                </div>
            </div>

            {/* FILTER BAR & LIVE CONNECTED USERS TABLE */}
            <div className="rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">
                            Live Connected MT5 Accounts ({filteredRows.length})
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Filter by trader name, email, MT5 login number, or broker server.
                        </p>
                    </div>
                    <div className="w-full sm:w-72">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            aria-label="Filter MT5 accounts"
                            className="w-full h-9 rounded-lg bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 px-3 text-xs font-semibold text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/70 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                                <th className="py-3 px-4">Trader</th>
                                <th className="py-3 px-4">MT5 Account &amp; Server</th>
                                <th className="py-3 px-4">Telemetry &amp; Ping</th>
                                <th className="py-3 px-4">Live Capital &amp; Exposure</th>
                                <th className="py-3 px-4">24/5 Armed Rules</th>
                                <th className="py-3 px-4">Access &amp; Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs">
                            {filteredRows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="py-10 text-center text-gray-500 dark:text-gray-400"
                                    >
                                        No MT5 Cloud accounts connected yet. Connect an account in Dashboard → Trade Manager.
                                    </td>
                                </tr>
                            ) : (
                                filteredRows.map((row) => {
                                    const posPnl = row.floatingPnl >= 0;
                                    return (
                                        <tr
                                            key={row.login}
                                            className="hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors"
                                        >
                                            <td className="py-3.5 px-4">
                                                <div className="font-extrabold text-gray-900 dark:text-white">
                                                    {row.userName}
                                                </div>
                                                <div className="text-[11px] text-gray-400">
                                                    {row.userEmail || "Direct Bridge Session"}
                                                </div>
                                                <div className="mt-1">
                                                    {row.isUnderIb ? (
                                                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                                                            <Crown size={10} />
                                                            Under IB
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-lg bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                                                            Standard Trial
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono font-black text-gray-900 dark:text-white">
                                                        {row.accountNumber}
                                                    </span>
                                                    <span
                                                        className={`rounded-lg px-1.5 py-0.5 text-[10px] font-bold ${
                                                            row.isDemo
                                                                ? "bg-cyan-500/15 text-cyan-400"
                                                                : "bg-emerald-500/15 text-emerald-400"
                                                        }`}
                                                    >
                                                        {row.isDemo ? "DEMO" : "REAL"}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold mt-0.5">
                                                    {row.server}
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`h-2.5 w-2.5 rounded-full ${
                                                            row.status === "IDLE_SLEEP"
                                                                ? "bg-cyan-400"
                                                                : row.status === "WAKING"
                                                                  ? "bg-amber-400 animate-pulse"
                                                                  : row.connected
                                                                    ? "bg-emerald-400 animate-pulse"
                                                                    : "bg-gray-500"
                                                        }`}
                                                    />
                                                    <span className="font-bold text-gray-900 dark:text-white">
                                                        {row.status === "IDLE_SLEEP"
                                                            ? `${row.datacenter} • Idle Sleep (0 MB)`
                                                            : row.status === "WAKING"
                                                              ? `${row.datacenter} • Waking...`
                                                              : row.connected
                                                                ? `${row.datacenter} • ${row.latencyMs} ms`
                                                                : row.status}
                                                    </span>
                                                </div>
                                                {row.lastQuoteUtc && (
                                                    <div className="text-[11px] text-gray-400 mt-0.5">
                                                        {formatDistanceToNow(
                                                            new Date(row.lastQuoteUtc),
                                                            { addSuffix: true }
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="font-black text-gray-900 dark:text-white">
                                                    $
                                                    {row.equity.toLocaleString("en-US", {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}{" "}
                                                    <span
                                                        className={
                                                            posPnl
                                                                ? "text-emerald-400"
                                                                : "text-red-400"
                                                        }
                                                    >
                                                        ({posPnl ? "+" : "-"}$
                                                        {Math.abs(
                                                            row.floatingPnl
                                                        ).toFixed(2)}
                                                        )
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-gray-400 font-semibold mt-0.5">
                                                    {row.openPositionsCount} open •{" "}
                                                    {row.totalLots.toFixed(2)} lots • Bal $
                                                    {row.balance.toLocaleString("en-US", {
                                                        maximumFractionDigits: 0,
                                                    })}
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                {row.armedRules.filter(
                                                    (r) => r.status === "ARMED"
                                                ).length === 0 ? (
                                                    <span className="text-gray-400">
                                                        None armed
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1">
                                                        {row.armedRules
                                                            .filter(
                                                                (r) =>
                                                                    r.status === "ARMED"
                                                            )
                                                            .slice(0, 3)
                                                            .map((r) => (
                                                                <span
                                                                    key={r.id}
                                                                    className="rounded-lg bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400"
                                                                >
                                                                    {r.label}
                                                                </span>
                                                            ))}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="text-[11px] text-gray-400 mb-2">
                                                    Until:{" "}
                                                    <span className="font-bold text-gray-900 dark:text-white">
                                                        {row.accessExpiresAt
                                                            ? new Date(
                                                                  row.accessExpiresAt
                                                              ).toLocaleDateString()
                                                            : "Unlimited"}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        isLoading={
                                                            busyKey ===
                                                            `reconn_${row.login}`
                                                        }
                                                        onClick={() =>
                                                            handleReconnect(row)
                                                        }
                                                        className="h-8 px-2.5 text-[11px]"
                                                    >
                                                        <Play size={11} />
                                                        <span>Reconnect</span>
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        isLoading={
                                                            busyKey ===
                                                            `disc_${row.login}`
                                                        }
                                                        onClick={() =>
                                                            handleDisconnect(row)
                                                        }
                                                        className="h-8 px-2.5 text-[11px] text-red-400"
                                                    >
                                                        <PowerOff size={11} />
                                                        <span>Disconnect</span>
                                                    </Button>
                                                    {row.accountId && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            isLoading={
                                                                busyKey ===
                                                                `ib_${row.login}`
                                                            }
                                                            onClick={() =>
                                                                handleToggleIb(row)
                                                            }
                                                            className="h-8 px-2.5 text-[11px] text-amber-400"
                                                        >
                                                            <Crown size={11} />
                                                            <span>
                                                                {row.isUnderIb
                                                                    ? "Extend +30d"
                                                                    : "Verify IB"}
                                                            </span>
                                                        </Button>
                                                    )}
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setSelectedLogRow(row)
                                                        }
                                                        className="h-8 px-2.5 text-[11px]"
                                                    >
                                                        <History size={11} />
                                                        <span>Logs</span>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Mt5CloudActivityModal
                row={selectedLogRow}
                onClose={() => setSelectedLogRow(null)}
            />
        </div>
    );
}
