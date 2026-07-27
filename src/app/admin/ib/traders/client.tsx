"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
    Activity,
    Users,
    Crown,
    Search,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Wallet,
    DollarSign,
    Briefcase,
    MoreHorizontal,
    XCircle,
    UserCheck,
    CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { BrokerLogo } from "@/components/ui/BrokerLogo";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { revokeProAccess } from "@/actions/vip-request";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";

export interface TraderAccount {
    id: string;
    broker: string;
    accountNumber: string;
    balance: number;
    equity: number;
    status: string;
    platform: string;
    lastSync: string | null;
    totalTrades: number;
}

export interface TraderUser {
    userId: string;
    userName: string;
    userEmail: string;
    proStatus: string;
    proSource: string | null;
    expiresAt: string | null;
    tradingAccounts: TraderAccount[];
    totalBalance: number;
    totalEquity: number;
    brokers: string[];
    totalTrades30d: number;
    totalLotVolume30d: number;
    lastActiveAt: string | null;
}

interface Props {
    traders: TraderUser[];
}

export function TraderMonitorClient({ traders }: Props) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBroker, setSelectedBroker] = useState<string>("ALL");
    const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
    const [expandedUserIds, setExpandedUserIds] = useState<Set<string>>(
        new Set()
    );

    // Extract list of all unique brokers available
    const availableBrokers = useMemo(() => {
        const set = new Set<string>();
        traders.forEach((t) => t.brokers.forEach((b) => set.add(b)));
        return Array.from(set).sort();
    }, [traders]);

    // Calculate aggregated overview stats
    const stats = useMemo(() => {
        const totalTraders = traders.length;
        const activeProCount = traders.filter(
            (t) => t.proStatus === "ACTIVE" || t.proStatus === "GRACE"
        ).length;
        const totalBalance = traders.reduce(
            (sum, t) => sum + t.totalBalance,
            0
        );
        const totalAccounts = traders.reduce(
            (sum, t) => sum + t.tradingAccounts.length,
            0
        );

        return {
            totalTraders,
            activeProCount,
            totalBalance,
            totalAccounts,
        };
    }, [traders]);

    // Toggle expand/collapse user row
    const toggleExpand = (userId: string) => {
        setExpandedUserIds((prev) => {
            const next = new Set(prev);
            if (next.has(userId)) {
                next.delete(userId);
            } else {
                next.add(userId);
            }
            return next;
        });
    };

    // Revoke VIP action handler
    const handleRevokePro = async (userId: string) => {
        try {
            const res = await revokeProAccess(userId);
            if (res.success) {
                toast.success("VIP Access revoked successfully");
            } else {
                toast.error(res.error || "Failed to revoke VIP access");
            }
        } catch (error: any) {
            toast.error(error?.message || "An error occurred");
        }
    };

    // Filter logic
    const filteredTraders = useMemo(() => {
        return traders.filter((t) => {
            // Search filter
            const query = searchTerm.toLowerCase().trim();
            const matchesSearch =
                !query ||
                t.userName.toLowerCase().includes(query) ||
                t.userEmail.toLowerCase().includes(query) ||
                t.tradingAccounts.some((acc) =>
                    acc.accountNumber.toLowerCase().includes(query)
                );

            // Broker filter
            const matchesBroker =
                selectedBroker === "ALL" ||
                t.brokers.some(
                    (b) => b.toLowerCase() === selectedBroker.toLowerCase()
                );

            // Status filter
            const matchesStatus =
                selectedStatus === "ALL" ||
                (selectedStatus === "PRO" &&
                    (t.proStatus === "ACTIVE" || t.proStatus === "GRACE")) ||
                (selectedStatus === "FREE" && t.proStatus === "FREE");

            return matchesSearch && matchesBroker && matchesStatus;
        });
    }, [traders, searchTerm, selectedBroker, selectedStatus]);

    return (
        <div className="space-y-6">
            {/* Summary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500">
                            <Users size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                                Total Traders
                            </p>
                            <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                                {stats.totalTraders}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500">
                            <DollarSign size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                                Combined Balance
                            </p>
                            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                                ${stats.totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500">
                            <Crown size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                                Active VIP Traders
                            </p>
                            <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                                {stats.activeProCount}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-500">
                            <Briefcase size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                                Linked Accounts
                            </p>
                            <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                                {stats.totalAccounts}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Controls Bar */}
            <div className="bg-white dark:bg-[#1E2028] p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="w-full md:w-80">
                    <PremiumInput
                        placeholder="Search trader, email or account #..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={Search}
                        className="w-full"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Status Filter Tabs */}
                    <div className="flex items-center bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold">
                        <button
                            onClick={() => setSelectedStatus("ALL")}
                            className={`px-3 py-1.5 rounded-lg transition-colors ${
                                selectedStatus === "ALL"
                                    ? "bg-white dark:bg-[#151925] text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                            }`}
                        >
                            All Status
                        </button>
                        <button
                            onClick={() => setSelectedStatus("PRO")}
                            className={`px-3 py-1.5 rounded-lg transition-colors ${
                                selectedStatus === "PRO"
                                    ? "bg-white dark:bg-[#151925] text-amber-600 dark:text-amber-400 shadow-sm"
                                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                            }`}
                        >
                            VIP / Pro Only
                        </button>
                        <button
                            onClick={() => setSelectedStatus("FREE")}
                            className={`px-3 py-1.5 rounded-lg transition-colors ${
                                selectedStatus === "FREE"
                                    ? "bg-white dark:bg-[#151925] text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                            }`}
                        >
                            Free Users
                        </button>
                    </div>

                    {/* Broker Select Dropdown */}
                    <select
                        value={selectedBroker}
                        onChange={(e) => setSelectedBroker(e.target.value)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    >
                        <option value="ALL">All Brokers</option>
                        {availableBrokers.map((b) => (
                            <option key={b} value={b}>
                                {b}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Traders Table / List */}
            <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
                {filteredTraders.length === 0 ? (
                    <div className="text-center py-16 text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-white/10 rounded-xl m-4">
                        <Users size={36} className="mx-auto mb-3 text-gray-400" />
                        <p className="text-base font-bold text-gray-700 dark:text-white">
                            No traders found
                        </p>
                        <p className="text-xs mt-1 text-gray-500">
                            Try adjusting your search criteria or broker filters.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-white/10">
                        {filteredTraders.map((trader) => {
                            const isExpanded = expandedUserIds.has(trader.userId);
                            const isPro =
                                trader.proStatus === "ACTIVE" ||
                                trader.proStatus === "GRACE";

                            return (
                                <div key={trader.userId} className="group/row transition-colors">
                                    {/* Main Row Header */}
                                    <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/80 dark:hover:bg-white/[0.02]">
                                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                            <button
                                                onClick={() => toggleExpand(trader.userId)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors shrink-0"
                                            >
                                                {isExpanded ? (
                                                    <ChevronUp size={18} />
                                                ) : (
                                                    <ChevronDown size={18} />
                                                )}
                                            </button>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-base text-gray-900 dark:text-white truncate">
                                                        {trader.userName}
                                                    </span>
                                                    {isPro ? (
                                                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                                                            <Crown size={12} /> VIP Pro
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400">
                                                            Free Trader
                                                        </span>
                                                    )}
                                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                        {trader.tradingAccounts.length} Account{trader.tradingAccounts.length !== 1 ? "s" : ""}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
                                                    <span className="truncate">{trader.userEmail}</span>
                                                    <span>•</span>
                                                    <div className="flex items-center gap-1.5">
                                                        {trader.brokers.map((b) => (
                                                            <span
                                                                key={b}
                                                                className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300"
                                                            >
                                                                {b}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Financial & Activity Summary */}
                                        <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 dark:border-white/5">
                                            <div className="text-right">
                                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                                    Combined Balance
                                                </p>
                                                <p className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                                                    ${trader.totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            </div>

                                            <div className="text-right hidden sm:block">
                                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                                    Combined Equity
                                                </p>
                                                <p className="font-mono font-bold text-sm text-gray-700 dark:text-gray-300">
                                                    ${trader.totalEquity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            </div>

                                            <div className="text-right hidden lg:block">
                                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                                    30d Volume
                                                </p>
                                                <p className="font-mono font-bold text-sm text-gray-700 dark:text-gray-300">
                                                    {trader.totalLotVolume30d.toFixed(2)} Lots
                                                </p>
                                            </div>

                                            {/* Action Menu */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg">
                                                        <MoreHorizontal size={16} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem>
                                                        <Link href={`/admin/users/${trader.userId}`} className="flex items-center gap-2 w-full cursor-pointer">
                                                            <ExternalLink size={14} /> View User Profile
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    {isPro && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleRevokePro(trader.userId)}
                                                            className="text-red-600 dark:text-red-400 focus:text-red-600 cursor-pointer"
                                                        >
                                                            <XCircle size={14} className="mr-2" /> Revoke VIP Access
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    {/* Expandable Account Breakdown Table */}
                                    {isExpanded && (
                                        <div className="bg-gray-50/70 dark:bg-white/[0.015] border-t border-gray-100 dark:border-white/5 p-4 pl-8 md:pl-12">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                                                <Wallet size={14} className="text-primary" />
                                                Trading Accounts Breakdown ({trader.tradingAccounts.length})
                                            </h4>

                                            {trader.tradingAccounts.length === 0 ? (
                                                <p className="text-xs text-gray-500 italic py-2">
                                                    No connected trading accounts registered yet.
                                                </p>
                                            ) : (
                                                <div className="overflow-x-auto rounded-xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#151925]">
                                                    <table className="w-full text-xs">
                                                        <thead className="bg-gray-100/70 dark:bg-white/5 text-gray-500 font-bold uppercase text-[10px]">
                                                            <tr>
                                                                <th className="p-3 text-left">Account #</th>
                                                                <th className="p-3 text-left">Broker</th>
                                                                <th className="p-3 text-right">Balance ($)</th>
                                                                <th className="p-3 text-right">Equity ($)</th>
                                                                <th className="p-3 text-center">Platform</th>
                                                                <th className="p-3 text-center">Sync Source</th>
                                                                <th className="p-3 text-right">Last Sync</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                                            {trader.tradingAccounts.map((acc) => (
                                                                <tr key={acc.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                                                    <td className="p-3 font-mono font-bold text-gray-900 dark:text-white">
                                                                        #{acc.accountNumber}
                                                                    </td>
                                                                    <td className="p-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <BrokerLogo broker={acc.broker} size={20} />
                                                                            <span className="font-bold text-gray-800 dark:text-gray-200 capitalize">
                                                                                {acc.broker.toLowerCase()}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                                        ${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </td>
                                                                    <td className="p-3 text-right font-mono text-gray-700 dark:text-gray-300">
                                                                        ${acc.equity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </td>
                                                                    <td className="p-3 text-center">
                                                                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300">
                                                                            {acc.platform}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-3 text-center">
                                                                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                                            EA Trade Manager
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-3 text-right text-gray-400">
                                                                        {acc.lastSync ? formatDistanceToNow(new Date(acc.lastSync), { addSuffix: true, locale: enUS }) : "Never"}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
