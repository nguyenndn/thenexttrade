"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Wifi, WifiOff, Search, Crown, Medal } from "lucide-react";

interface Account {
    id: string;
    name: string;
    broker: string;
    accountId: string;
    type: "MASTER" | "CLIENT";
    status: "ONLINE" | "OFFLINE";
    balance: number;
    profit: number;
    hwm: number;
    growth: number;
}

const mockAccounts: Account[] = [
    { id: "1", name: "Alpha Engine", broker: "Exness", accountId: "••••3715", type: "MASTER", status: "ONLINE", balance: 125400, profit: 67200, hwm: 128900, growth: 115.4 },
    { id: "2", name: "2%/day", broker: "ICMarkets", accountId: "••••8842", type: "MASTER", status: "ONLINE", balance: 89200, profit: 42100, hwm: 91500, growth: 89.2 },
    { id: "3", name: "Minato1991", broker: "Exness", accountId: "••••4521", type: "CLIENT", status: "ONLINE", balance: 15800, profit: 5800, hwm: 16200, growth: 58.0 },
    { id: "4", name: "Phoenix Fund", broker: "Pepperstone", accountId: "••••7109", type: "MASTER", status: "ONLINE", balance: 234500, profit: 112300, hwm: 240000, growth: 92.1 },
    { id: "5", name: "TraderVN_88", broker: "Exness", accountId: "••••2233", type: "CLIENT", status: "ONLINE", balance: 8400, profit: 3400, hwm: 8900, growth: 68.0 },
    { id: "6", name: "Quantum Edge", broker: "FPMarkets", accountId: "••••5567", type: "MASTER", status: "OFFLINE", balance: 178000, profit: 88500, hwm: 185000, growth: 98.9 },
    { id: "7", name: "SaigonTrader", broker: "RoboForex", accountId: "••••1199", type: "CLIENT", status: "ONLINE", balance: 22300, profit: 12300, hwm: 23100, growth: 123.0 },
    { id: "8", name: "Delta Strategy", broker: "Tickmill", accountId: "••••6644", type: "MASTER", status: "ONLINE", balance: 56700, profit: 26700, hwm: 58100, growth: 89.0 },
];

export function CopyTradingLeaderboard() {
    const [filter, setFilter] = useState<"ALL" | "MASTER" | "CLIENT">("ALL");
    const [search, setSearch] = useState("");

    const filtered = mockAccounts
        .filter((a) => filter === "ALL" || a.type === filter)
        .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => b.growth - a.growth);

    const getRankIcon = (index: number) => {
        if (index === 0) return <Crown size={16} className="text-amber-400" />;
        if (index === 1) return <Medal size={16} className="text-gray-400" />;
        if (index === 2) return <Medal size={16} className="text-amber-600" />;
        return <span className="text-xs font-bold text-gray-400 w-4 text-center">{index + 1}</span>;
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex gap-2">
                    {(["ALL", "MASTER", "CLIENT"] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all uppercase tracking-wider ${
                                filter === type
                                    ? "bg-primary/10 text-primary"
                                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                            }`}
                        >
                            {type === "ALL" ? `All (${mockAccounts.length})` : `${type} (${mockAccounts.filter(a => a.type === type).length})`}
                        </button>
                    ))}
                </div>
                <div className="relative w-full sm:w-auto">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search accounts..."
                        className="pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/5 text-gray-700 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 w-full sm:w-56"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1A1D27] rounded-2xl border border-gray-200 dark:border-white/[0.06] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-white/5">
                                <th className="text-left px-4 py-3 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">#</th>
                                <th className="text-left px-4 py-3 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Account</th>
                                <th className="text-left px-4 py-3 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Type</th>
                                <th className="text-left px-4 py-3 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="text-right px-4 py-3 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Balance</th>
                                <th className="text-right px-4 py-3 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Profit</th>
                                <th className="text-right px-4 py-3 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">HWM</th>
                                <th className="text-right px-4 py-3 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Growth</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((account, i) => (
                                <tr
                                    key={account.id}
                                    className="border-b border-gray-50 dark:border-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                                >
                                    <td className="px-4 py-3.5 w-10">{getRankIcon(i)}</td>
                                    <td className="px-4 py-3.5">
                                        <div>
                                            <span className="font-bold text-sm text-gray-700 dark:text-white">{account.name}</span>
                                            <p className="text-[11px] text-gray-400">{account.broker} · {account.accountId}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                            account.type === "MASTER"
                                                ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                        }`}>
                                            {account.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center gap-1.5">
                                            {account.status === "ONLINE" ? (
                                                <><Wifi size={12} className="text-primary" /><span className="text-xs font-bold text-primary">ONLINE</span></>
                                            ) : (
                                                <><WifiOff size={12} className="text-gray-400" /><span className="text-xs font-bold text-gray-400">OFFLINE</span></>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-right">
                                        <span className="font-bold text-sm text-gray-700 dark:text-white">${account.balance.toLocaleString()}</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right">
                                        <span className={`font-bold text-sm ${account.profit >= 0 ? "text-primary" : "text-red-500"}`}>
                                            ${account.profit.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">${account.hwm.toLocaleString()}</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {account.growth >= 0 ? (
                                                <TrendingUp size={14} className="text-primary" />
                                            ) : (
                                                <TrendingDown size={14} className="text-red-500" />
                                            )}
                                            <span className={`font-bold text-sm ${account.growth >= 0 ? "text-primary" : "text-red-500"}`}>
                                                {account.growth.toFixed(1)}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
