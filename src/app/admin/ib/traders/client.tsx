"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
    Activity,
    Users,
    Crown,
    Search,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    DollarSign,
    Briefcase,
    MoreHorizontal,
    XCircle,
    CheckCircle2,
    ShieldAlert,
    Clock,
    RefreshCw,
    Send,
    Filter,
    TrendingUp,
    BarChart3,
    AlertTriangle,
    Check,
    X,
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
import { toast } from "sonner";
import {
    IbTraderPaginatedResult,
    IbTraderFilters,
    IbTraderRow,
    ExpandedTraderAccount,
} from "@/lib/admin/ib/ib-monitor.types";
import {
    adminGrantProductAccessAction,
    adminRevokeProductAccessAction,
    adminSendSetupReminderAction,
} from "@/actions/admin-ib";
import { revokeProAccess, grantGracePeriod } from "@/actions/vip-request";

interface Props {
    initialData: IbTraderPaginatedResult;
    currentFilters: IbTraderFilters;
}

function FilterMenu({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value?: string;
    options: Array<{ value: string; label: string }>;
    onChange: (value: string) => void;
}) {
    const selected = options.find((option) => option.value === value) || options[0];
    return (
        <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gray-400">{label}:</span>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="text-xs font-bold h-[38px] gap-1.5 px-3 rounded-xl">
                        {selected.label}
                        <ChevronDown size={14} className="opacity-60" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                    {options.map((option) => (
                        <DropdownMenuItem key={option.value} onClick={() => onChange(option.value)}>
                            {option.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

export function TraderMonitorClient({ initialData, currentFilters }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [expandedUserIds, setExpandedUserIds] = useState<Set<string>>(new Set());
    const [searchInputValue, setSearchInputValue] = useState(currentFilters.q || "");

    const updateFilterParams = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, val]) => {
            if (val === null || val === "" || val === "ALL") {
                params.delete(key);
            } else {
                params.set(key, val);
            }
        });
        params.set("page", "1");
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateFilterParams({ q: searchInputValue.trim() });
    };

    const toggleExpand = (userId: string) => {
        setExpandedUserIds((prev) => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    };

    const handleRevokePro = (userId: string) => {
        startTransition(async () => {
            const res = await revokeProAccess(userId);
            if (res.success) {
                toast.success("VIP Access revoked");
                router.refresh();
            } else {
                toast.error(res.error || "Failed to revoke VIP");
            }
        });
    };

    const handleGrantGrace = (userId: string) => {
        startTransition(async () => {
            const res = await grantGracePeriod(userId, 14);
            if (res.success) {
                toast.success("14-day grace period granted");
                router.refresh();
            } else {
                toast.error(res.error || "Failed to grant grace");
            }
        });
    };

    const handleGrantProduct = (userId: string, productSlug: string) => {
        startTransition(async () => {
            const res = await adminGrantProductAccessAction({
                targetUserId: userId,
                productSlug,
            });
            if (res.success) {
                toast.success(`Access granted for ${productSlug}`);
                router.refresh();
            } else {
                toast.error(res.error || "Failed to grant access");
            }
        });
    };

    const handleRevokeProduct = (userId: string, productSlug: string) => {
        startTransition(async () => {
            const res = await adminRevokeProductAccessAction({
                targetUserId: userId,
                productSlug,
            });
            if (res.success) {
                toast.success(`Access revoked for ${productSlug}`);
                router.refresh();
            } else {
                toast.error(res.error || "Failed to revoke access");
            }
        });
    };

    const handleSendReminder = (userId: string, productSlug: string) => {
        startTransition(async () => {
            const res = await adminSendSetupReminderAction({
                targetUserId: userId,
                productSlug,
            });
            if (res.success) {
                toast.success("Setup reminder sent");
            } else {
                toast.error(res.error || "Failed to send reminder");
            }
        });
    };

    const resetFilters = {
        q: null,
        vip: "ALL",
        product: "ALL",
        toolState: "ALL",
        broker: "ALL",
        accountHealth: "ALL",
        accountType: "ALL",
        syncSource: "ALL",
        capitalBand: "ALL",
        minAccounts: null,
        maxAccounts: null,
        lastTrade: "ALL",
        sort: "NEWEST",
    };

    const applyQuickView = (view: string) => {
        switch (view) {
            case "HIGHEST_CAPITAL":
                updateFilterParams({ ...resetFilters, sort: "CAPITAL_DESC" });
                break;
            case "HIGHEST_EQUITY":
                updateFilterParams({ ...resetFilters, sort: "EQUITY_DESC" });
                break;
            case "MOST_ACCOUNTS":
                updateFilterParams({ ...resetFilters, sort: "ACCOUNTS_DESC" });
                break;
            case "LAST_ACTIVITY":
                updateFilterParams({ ...resetFilters, sort: "LAST_ACTIVITY_DESC" });
                break;
            case "VIP_WITHOUT_SYNC":
                updateFilterParams({ ...resetFilters, vip: "ACTIVE", accountHealth: "NEVER_SYNCED" });
                break;
            case "STALE_VIP":
                updateFilterParams({ ...resetFilters, vip: "ACTIVE", accountHealth: "STALE" });
                break;
            case "EXPIRING_SOON":
                updateFilterParams({ ...resetFilters, vip: "EXPIRING" });
                break;
            case "NEVER_TRADED":
                updateFilterParams({ ...resetFilters, lastTrade: "NEVER" });
                break;
            default:
                updateFilterParams({ ...resetFilters, sort: "NEWEST" });
                break;
        }
    };

    const { summary, rows, page, totalPages, total } = initialData;

    return (
        <div className="space-y-6">
            {/* Quick View Presets Bar */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                <span className="text-xs font-black uppercase text-gray-400 flex items-center gap-1 shrink-0 mr-1">
                    <Filter size={12} /> Quick Presets:
                </span>
                {[
                    { key: "ALL", label: "All Traders", icon: null },
                    { key: "HIGHEST_CAPITAL", label: "Highest Capital", icon: <DollarSign size={12} /> },
                    { key: "HIGHEST_EQUITY", label: "Highest Equity", icon: <TrendingUp size={12} /> },
                    { key: "MOST_ACCOUNTS", label: "Most Accounts", icon: <BarChart3 size={12} /> },
                    { key: "LAST_ACTIVITY", label: "Last Activity", icon: <Clock size={12} /> },
                    { key: "VIP_WITHOUT_SYNC", label: "VIP Without Sync", icon: <AlertTriangle size={12} className="text-amber-500" /> },
                    { key: "STALE_VIP", label: "VIP Sync Overdue", icon: <AlertTriangle size={12} className="text-red-400" /> },
                    { key: "EXPIRING_SOON", label: "Temporary VIP Expiring Soon", icon: <Clock size={12} /> },
                ].map((preset) => (
                    <button
                        key={preset.key}
                        onClick={() => applyQuickView(preset.key)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] text-gray-700 dark:text-gray-300 hover:border-primary transition-colors shadow-sm flex items-center gap-1.5"
                    >
                        {preset.icon}
                        {preset.label}
                    </button>
                ))}
            </div>

            {/* Overview KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500">
                            <Users size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                                Total Traders (In Filter)
                            </p>
                            <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                                {summary.totalTradersInFilter}
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
                                Reported Capital (USD)
                            </p>
                            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                                {summary.totalReportedCapitalUSD !== null
                                    ? `$${summary.totalReportedCapitalUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                                    : "Multiple Currencies"}
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
                                {summary.activeVipTraders}
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
                                Connected Accounts
                            </p>
                            <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                                {summary.connectedAccountsCount}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Controls Bar */}
            <div className="bg-white dark:bg-[#1E2028] p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
                <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 items-center">
                    <div className="w-full md:w-96">
                        <PremiumInput
                            placeholder="Search trader name, email or account #..."
                            value={searchInputValue}
                            onChange={(e) => setSearchInputValue(e.target.value)}
                            icon={Search}
                            className="w-full"
                        />
                    </div>
                    <Button type="submit" variant="outline" className="h-[42px] px-5 font-bold text-xs">
                        Search
                    </Button>
                    {currentFilters.q && (
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-[42px] px-4 font-bold text-xs"
                            onClick={() => {
                                setSearchInputValue("");
                                updateFilterParams({ q: null });
                            }}
                        >
                            Clear
                        </Button>
                    )}
                </form>

                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-white/5">
                    {/* VIP Filter */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-400">VIP:</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="text-xs font-bold h-[38px] gap-1.5 px-3 rounded-xl">
                                    {currentFilters.vip === "ACTIVE"
                                        ? "Active VIP"
                                        : currentFilters.vip === "GRACE"
                                        ? "Temporary VIP"
                                        : currentFilters.vip === "EXPIRING"
                                        ? "Expiring Soon (≤7d)"
                                        : currentFilters.vip === "FREE"
                                        ? "Free User"
                                        : currentFilters.vip === "REVOKED"
                                        ? "Revoked"
                                        : "All VIP States"}
                                    <ChevronDown size={14} className="opacity-60" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48">
                                <DropdownMenuItem onClick={() => updateFilterParams({ vip: "ALL" })}>
                                    All VIP States
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilterParams({ vip: "ACTIVE" })}>
                                    Active VIP
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilterParams({ vip: "GRACE" })}>
                                    Temporary VIP
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilterParams({ vip: "EXPIRING" })}>
                                    Expiring Soon (≤7d)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilterParams({ vip: "FREE" })}>
                                    Free User
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilterParams({ vip: "REVOKED" })}>
                                    Revoked
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Product Filter */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-400">Product:</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="text-xs font-bold h-[38px] gap-1.5 px-3 rounded-xl">
                                    {currentFilters.product === "goldscalperninja"
                                        ? "GoldScalperNinja"
                                        : currentFilters.product === "trade-manager"
                                        ? "Trade Manager"
                                        : currentFilters.product === "gsn-phoenix-grid"
                                        ? "GSN Phoenix Grid"
                                        : "All Products"}
                                    <ChevronDown size={14} className="opacity-60" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48">
                                <DropdownMenuItem onClick={() => updateFilterParams({ product: "ALL" })}>
                                    All Products
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilterParams({ product: "goldscalperninja" })}>
                                    GoldScalperNinja
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilterParams({ product: "trade-manager" })}>
                                    Trade Manager
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilterParams({ product: "gsn-phoenix-grid" })}>
                                    GSN Phoenix Grid
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Sync Source Filter */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-400">Sync Source:</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="text-xs font-bold h-[38px] gap-1.5 px-3 rounded-xl">
                                    {currentFilters.syncSource === "EA_SYNC"
                                        ? "Trade Manager EA"
                                        : currentFilters.syncSource === "MANUAL"
                                        ? "Manual Entry"
                                        : currentFilters.syncSource === "UNKNOWN"
                                        ? "Unknown Source"
                                        : "All Sync Sources"}
                                    <ChevronDown size={14} className="opacity-60" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48">
                                <DropdownMenuItem onClick={() => updateFilterParams({ syncSource: "ALL" })}>
                                    All Sync Sources
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilterParams({ syncSource: "EA_SYNC" })}>
                                    Trade Manager EA
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilterParams({ syncSource: "MANUAL" })}>
                                    Manual Entry
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilterParams({ syncSource: "UNKNOWN" })}>
                                    Unknown Source
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Sort Filter */}
                    <div className="flex items-center gap-1.5 ml-auto">
                        <span className="text-xs font-bold text-gray-400">Sort By:</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="text-xs font-bold h-[38px] gap-1.5 px-3 rounded-xl">
                                    {currentFilters.sort === "CAPITAL_DESC"
                                        ? "Highest Capital"
                                        : currentFilters.sort === "EQUITY_DESC"
                                        ? "Highest Equity"
                                        : currentFilters.sort === "ACCOUNTS_DESC"
                                        ? "Most Accounts"
                                        : currentFilters.sort === "LAST_ACTIVITY_DESC"
                                        ? "Last Activity"
                                        : "Newest Joined"}
                                    <ChevronDown size={14} className="opacity-60" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => updateFilterParams({ sort: "NEWEST" })}>
                                    Newest Joined
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilterParams({ sort: "CAPITAL_DESC" })}>
                                    Highest Capital
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilterParams({ sort: "EQUITY_DESC" })}>
                                    Highest Equity
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilterParams({ sort: "ACCOUNTS_DESC" })}>
                                    Most Accounts
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilterParams({ sort: "LAST_ACTIVITY_DESC" })}>
                                    Last Activity
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3 dark:border-white/5">
                    <FilterMenu
                        label="Tool"
                        value={currentFilters.toolState}
                        options={[
                            { value: "ALL", label: "All Tool States" },
                            { value: "NO_ACCESS", label: "No Access" },
                            { value: "GRANTED", label: "Granted" },
                            { value: "DOWNLOADED", label: "Downloaded" },
                            { value: "RECENTLY_USED", label: "Recently Used" },
                            { value: "ACTIVE", label: "Active" },
                            { value: "STALE", label: "No Recent Tool Activity" },
                            { value: "UNKNOWN_LEGACY", label: "Legacy / Unknown" },
                        ]}
                        onChange={(value) => updateFilterParams({ toolState: value })}
                    />
                    <FilterMenu
                        label="Health"
                        value={currentFilters.accountHealth}
                        options={[
                            { value: "ALL", label: "All Health" },
                            { value: "CONNECTED", label: "Connected (<24h)" },
                            { value: "NO_TRADES", label: "No Trades" },
                            { value: "NEVER_SYNCED", label: "Never Synced" },
                            { value: "STALE", label: "Sync Overdue (1-7d)" },
                            { value: "DISCONNECTED", label: "Disconnected (>7d)" },
                        ]}
                        onChange={(value) => updateFilterParams({ accountHealth: value })}
                    />
                    <FilterMenu
                        label="Type"
                        value={currentFilters.accountType}
                        options={[
                            { value: "ALL", label: "All Account Types" },
                            { value: "REAL", label: "Real / Funded" },
                            { value: "DEMO", label: "Demo" },
                            { value: "UNKNOWN", label: "Unknown" },
                        ]}
                        onChange={(value) => updateFilterParams({ accountType: value })}
                    />
                    <FilterMenu
                        label="Capital"
                        value={currentFilters.capitalBand}
                        options={[
                            { value: "ALL", label: "All Capital" },
                            { value: "0_1K", label: "Under $1K" },
                            { value: "1K_10K", label: "$1K-$10K" },
                            { value: "10K_50K", label: "$10K-$50K" },
                            { value: "50K_PLUS", label: "$50K+" },
                        ]}
                        onChange={(value) => updateFilterParams({ capitalBand: value })}
                    />
                    <FilterMenu
                        label="Last Trade"
                        value={currentFilters.lastTrade}
                        options={[
                            { value: "ALL", label: "Any Last Trade" },
                            { value: "TODAY", label: "Today" },
                            { value: "7D", label: "Last 7 Days" },
                            { value: "30D", label: "Last 30 Days" },
                            { value: "NEVER", label: "Never Traded" },
                        ]}
                        onChange={(value) => updateFilterParams({ lastTrade: value })}
                    />
                    <FilterMenu
                        label="Min Accounts"
                        value={currentFilters.minAccounts?.toString() || "ALL"}
                        options={[
                            { value: "ALL", label: "Any Minimum" },
                            { value: "1", label: "1+ Account" },
                            { value: "2", label: "2+ Accounts" },
                            { value: "3", label: "3+ Accounts" },
                            { value: "5", label: "5+ Accounts" },
                        ]}
                        onChange={(value) => updateFilterParams({ minAccounts: value })}
                    />
                    <FilterMenu
                        label="Max Accounts"
                        value={currentFilters.maxAccounts?.toString() || "ALL"}
                        options={[
                            { value: "ALL", label: "Any Maximum" },
                            { value: "1", label: "Up to 1" },
                            { value: "2", label: "Up to 2" },
                            { value: "3", label: "Up to 3" },
                            { value: "5", label: "Up to 5" },
                        ]}
                        onChange={(value) => updateFilterParams({ maxAccounts: value })}
                    />
                </div>
            </div>

            {/* Main Trader Table */}
            <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] text-[11px] font-black uppercase text-gray-500 tracking-wider">
                                <th className="py-3 px-4">Trader Info</th>
                                <th className="py-3 px-4">VIP Plan</th>
                                <th className="py-3 px-4">Canonical Products</th>
                                <th className="py-3 px-4">Accounts & Capital</th>
                                <th className="py-3 px-4">30d Activity</th>
                                <th className="py-3 text-right px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-gray-400">
                                        No traders found matching current filters.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((trader) => {
                                    const isExpanded = expandedUserIds.has(trader.userId);

                                    return (
                                        <React.Fragment key={trader.userId}>
                                            <tr className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                                {/* User Info */}
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => toggleExpand(trader.userId)}
                                                            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
                                                        >
                                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        </button>
                                                        <div>
                                                            <Link
                                                                href={`/admin/users/${trader.userId}`}
                                                                className="font-bold text-gray-900 dark:text-white hover:text-primary transition-colors flex items-center gap-1.5"
                                                            >
                                                                {trader.userName}
                                                                <ExternalLink size={12} className="opacity-50" />
                                                            </Link>
                                                            <p className="text-xs text-gray-500 font-mono">
                                                                {trader.userEmail}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* VIP Status */}
                                                <td className="py-3.5 px-4">
                                                    {trader.vipStatus === "ACTIVE" ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                                                            <Crown size={10} /> Active VIP
                                                        </span>
                                                    ) : trader.vipStatus === "GRACE" ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                                                            <Clock size={10} /> Temporary VIP
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10">
                                                            Free Plan
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Canonical Products Usage */}
                                                <td className="py-3.5 px-4">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {trader.products.map((p) => (
                                                            <span
                                                                key={p.productId}
                                                                className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                                                    p.usageState === "ACTIVE"
                                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                                                                        : p.usageState === "RECENTLY_USED"
                                                                        ? "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20"
                                                                        : p.usageState === "DOWNLOADED"
                                                                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20"
                                                                        : "bg-gray-50 text-gray-400 border-gray-200 dark:bg-white/5 dark:text-gray-500 dark:border-white/10"
                                                                }`}
                                                            >
                                                                {p.productSlug.slice(0, 4)}: {p.usageState}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>

                                                {/* Accounts & Capital */}
                                                <td className="py-3.5 px-4">
                                                    <div>
                                                        <p className="font-mono font-bold text-gray-900 dark:text-white">
                                                            {trader.isMixedCurrency
                                                                ? "Multiple Currencies"
                                                                : `$${(trader.reportedCapitalByCurrency["USD"] || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                                                        </p>
                                                        <p className="text-xs text-gray-500 font-medium">
                                                            {trader.registeredAccountCount} registered ({trader.connectedAccountCount} connected)
                                                        </p>
                                                    </div>
                                                </td>

                                                {/* 30d Activity */}
                                                <td className="py-3.5 px-4">
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white">
                                                            {trader.totalTrades30d} trades
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {trader.totalLotVolume30d.toFixed(2)} lots (30d)
                                                        </p>
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3.5 px-4 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                                <MoreHorizontal size={16} />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuItem onClick={() => handleGrantGrace(trader.userId)}>
                                                                <Clock size={14} className="mr-2" /> Grant Temporary VIP (14d)
                                                            </DropdownMenuItem>
                                                            {trader.vipStatus === "ACTIVE" && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleRevokePro(trader.userId)}
                                                                    className="text-red-600 dark:text-red-400"
                                                                >
                                                                    <XCircle size={14} className="mr-2" /> Revoke VIP Access
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem onClick={() => handleSendReminder(trader.userId, "goldscalperninja")}>
                                                                <Send size={14} className="mr-2" /> Send Setup Reminder
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>

                                            {/* Expanded Account Details */}
                                            {isExpanded && (
                                                <tr className="bg-gray-50/80 dark:bg-white/[0.01]">
                                                    <td colSpan={6} className="p-4 border-t border-b border-gray-100 dark:border-white/5">
                                                        <div className="space-y-3">
                                                            <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
                                                                Linked Trading Accounts ({trader.accounts.length})
                                                            </h4>
                                                            {trader.accounts.length === 0 ? (
                                                                <p className="text-xs text-gray-400">No accounts connected yet.</p>
                                                            ) : (
                                                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                                    {trader.accounts.map((acc) => (
                                                                        <div
                                                                            key={acc.id}
                                                                            className="p-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] space-y-1.5"
                                                                        >
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="font-mono font-bold text-xs text-gray-900 dark:text-white">
                                                                                    {acc.accountNumber}
                                                                                </span>
                                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                                                                                    {acc.syncSourceLabel}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                                                <span>{acc.broker} ({acc.platform})</span>
                                                                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                                                    ${acc.balance.toLocaleString("en-US")} {acc.currency}
                                                                                </span>
                                                                            </div>
                                                                            <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1 border-t border-gray-100 dark:border-white/5">
                                                                                <span>Trades: {acc.totalTrades}</span>
                                                                                <span className="flex items-center gap-1">
                                                                                    Fresh:{" "}
                                                                                    {acc.isFresh ? (
                                                                                        <Check size={12} className="text-emerald-500" />
                                                                                    ) : (
                                                                                        <X size={12} className="text-red-400" />
                                                                                    )}
                                                                                    {acc.isFresh ? "Yes" : "No"}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between text-xs text-gray-500">
                    <div>
                        Showing page <span className="font-bold text-gray-900 dark:text-white">{page}</span> of{" "}
                        <span className="font-bold text-gray-900 dark:text-white">{totalPages}</span> ({total} total traders)
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={page <= 1 || isPending}
                            onClick={() => updateFilterParams({ page: `${page - 1}` })}
                        >
                            Previous
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={page >= totalPages || isPending}
                            onClick={() => updateFilterParams({ page: `${page + 1}` })}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
