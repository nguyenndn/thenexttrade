"use client";

import {
    MoreVertical,
    Settings,
    Trash2,
    ExternalLink,
    Trophy,
    FileText,
} from "lucide-react";
import Link from "next/link";
import { RemoteSyncButton } from "./RemoteSyncButton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

interface AccountCardProps {
    account: any;
    onUpdate: () => void;
    onDelete: (id: string) => void;
    onSettings: (account: any) => void;
}

// Returns account type label, or null if not yet synced
const getAccountType = (type: string | null | undefined, server?: string | null): string | null => {
    if (!type) return null; // Not synced yet — no badge
    const t = type.toUpperCase();
    if (t === "PERSONAL") {
        // Double-check against server name for demo detection
        if (server?.toLowerCase().includes('demo')) return "DEMO";
        return "REAL";
    }
    if (t === "DEMO" || t === "CONTEST") return "DEMO";
    return t;
};

export function AccountCard({
    account,
    onUpdate,
    onDelete,
    onSettings
}: AccountCardProps) {
    // Only trust accountType if account has actually synced at least once
    const hasSynced = !!account.lastSync;
    const accountType = hasSynced ? getAccountType(account.accountType, account.server) : null;
    const isReal = accountType === "REAL";
    const accentColor = account.color || "hsl(var(--primary))";

    return (
        <div className="group relative flex flex-col rounded-2xl transition-all duration-500 hover:shadow-lg bg-white dark:bg-[#151925] border border-gray-200/80 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/15">


            {/* Left accent border */}
            <div
                className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full opacity-60 group-hover:opacity-100 transition-opacity z-10"
                style={{ backgroundColor: accentColor }}
            />

            {/* Ambient glow */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                <div
                    className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-[60px] opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-700"
                    style={{ backgroundColor: accentColor }}
                />
            </div>

            {/* === Card Content === */}
            <div className="relative z-10 flex flex-col flex-1 px-5 pt-4 pb-3">

                {/* Top Row: Badges + Menu */}
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    {accountType && (
                        <span className={`text-[9px] font-black px-2 py-[3px] rounded-md uppercase tracking-[0.1em] border whitespace-nowrap ${isReal
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                            : "bg-blue-50 text-blue-600 border-blue-200/80 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                            }`}>
                            {accountType}
                        </span>
                    )}
                    {account.accountNumber && (
                        <span className="text-[9px] font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 px-2 py-[3px] rounded-md">
                            #{account.accountNumber}
                        </span>
                    )}
                    {account.useForLeaderboard && (
                        <span className="w-5 h-5 rounded-md inline-flex items-center justify-center bg-yellow-50 border border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/20" title="Leaderboard Account">
                            <Trophy size={10} className="text-yellow-500" />
                        </span>
                    )}

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Options Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Account options"
                                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 focus:outline-none shrink-0"
                            >
                                <MoreVertical size={14} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-50 p-1.5 rounded-xl border-gray-200 dark:border-white/10 shadow-xl bg-white dark:bg-[#1E2028] z-[100]">
                            <DropdownMenuItem onClick={() => onSettings(account)} className="flex items-center gap-3 px-3 py-2 font-semibold text-sm cursor-pointer rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 focus:bg-gray-50 dark:focus:bg-white/5 transition-colors">
                                <Settings size={15} className="text-gray-500" />
                                <span>Account Settings</span>
                            </DropdownMenuItem>
                            <div className="h-px bg-gray-100 dark:bg-white/5 my-1" />
                            {isReal && (
                                <DropdownMenuItem
                                    onClick={async () => {
                                        try {
                                            const res = await fetch(`/api/trading-accounts/${account.id}/leaderboard`, { method: 'POST' });
                                            const data = await res.json();
                                            if (!res.ok) throw new Error(data.error);
                                            toast.success(data.useForLeaderboard ? 'Account set for leaderboard!' : 'Account removed from leaderboard');
                                            onUpdate();
                                        } catch (e: any) {
                                            toast.error(e.message || 'Failed to update');
                                        }
                                    }}
                                    className="flex items-center gap-3 px-3 py-2 font-semibold text-sm cursor-pointer rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 focus:bg-gray-50 dark:focus:bg-white/5 transition-colors"
                                >
                                    <Trophy size={15} className={account.useForLeaderboard ? "text-yellow-500" : "text-gray-500"} />
                                    <span>{account.useForLeaderboard ? 'Remove from Leaderboard' : 'Use for Leaderboard'}</span>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={() => onDelete(account.id)}
                                className="flex items-center gap-3 px-3 py-2 font-semibold text-sm cursor-pointer rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 focus:bg-red-50 dark:focus:bg-red-500/10 focus:text-red-600 transition-colors"
                            >
                                <Trash2 size={15} />
                                <span>Delete Account</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Account Name + Server (inline) */}
                <div className="flex items-baseline gap-2 min-w-0">
                    <h3 className="text-base font-bold text-gray-800 dark:text-white truncate leading-tight shrink-0" title={account.name}>
                        {account.name}
                    </h3>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium truncate" title={account.server || "Server Unknown"}>
                        {account.server || "Server Unknown"}
                    </p>
                </div>

                {/* Balance / Equity */}
                <div className="mt-4 grid grid-cols-2 gap-3 min-w-0">
                    <div className="min-w-0">
                        <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 tracking-widest uppercase mb-0.5">Balance</p>
                        <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 truncate" title={`$${(account.balance || 0).toLocaleString()}`}>
                            ${(account.balance || 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="min-w-0 pl-3 border-l border-gray-200/80 dark:border-white/[0.08]">
                        <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 tracking-widest uppercase mb-0.5">Equity</p>
                        <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 truncate" title={`$${(account.equity || account.balance || 0).toLocaleString()}`}>
                            ${(account.equity || account.balance || 0).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer Status Bar */}
            <div className="relative z-10 flex items-center gap-2 flex-wrap px-3 py-2.5 mx-2 mb-2 rounded-xl bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.06]">
                {/* Connection Status */}
                {account.isConnected ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Online</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200/80 dark:border-red-500/20 text-red-500 dark:text-red-400 shadow-sm">
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Offline</span>
                    </div>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5">
                    <Link
                        href={`/dashboard?accountId=${account.id}`}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200/80 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-bold text-[10px] transition-all group/link shadow-sm"
                        title="View Dashboard"
                    >
                        <ExternalLink size={11} className="text-gray-400 group-hover/link:text-primary transition-colors" />
                        <span>Dashboard</span>
                    </Link>

                    <RemoteSyncButton
                        tradingAccountId={account.id}
                        accountName={account.name}
                        isConnected={account.isConnected}
                        variant="premium"
                    />
                </div>
            </div>
        </div>
    );
}
