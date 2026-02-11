"use client";

import {
    MoreVertical,
    Settings,
    Key,
    Trash2,
    ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import NextImage from "next/image"; // Added correct top-level import
import { RemoteSyncButton } from "./RemoteSyncButton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AccountCardProps {
    account: any;
    onUpdate: () => void;
    onRegenerateKey: (id: string) => void;
    onDelete: (id: string) => void;
    onSettings: (account: any) => void;
}

export function AccountCard({
    account,
    onRegenerateKey,
    onDelete,
    onSettings
}: AccountCardProps) {

    // Logic: Map "PERSONAL" to "REAL", everything else defaults to input or "DEMO"
    const getAccountType = (type: string) => {
        const t = (type || "DEMO").toUpperCase();
        if (t === "PERSONAL") return "REAL";
        return t;
    };

    const accountType = getAccountType(account.accountType);
    const isReal = accountType === "REAL";

    const getPlatformIcon = (platform: string) => {
        const p = platform?.toUpperCase() || "";
        if (p.includes("MT4")) return "/icons/mt4.png";
        if (p.includes("MT5")) return "/icons/mt5.png";
        return null;
    };

    return (
        <div className="group bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/5 hover:border-primary dark:hover:border-primary transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-primary/5 flex flex-col justify-between h-full">

            <div className="p-6">
                {/* Header Row */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4 items-start w-full">
                        {/* Platform Icon Box */}
                        <div className="w-14 h-14 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center shrink-0 border border-gray-100 dark:border-white/5 overflow-hidden relative">
                            {getPlatformIcon(account.platform) ? (
                                <NextImage
                                    src={getPlatformIcon(account.platform)!}
                                    alt={account.platform || "Platform Icon"}
                                    width={36}
                                    height={36}
                                    className="object-contain"
                                />
                            ) : (
                                <span className="font-bold text-gray-400 text-sm">{account.platform?.substring(0, 3) || "MT4"}</span>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1.5 align-middle">
                                <h3 className="font-bold text-gray-900 dark:text-white text-xl truncate" title={account.name}>
                                    {account.name}
                                </h3>
                                {/* Type Badge */}
                                <span className={`text-[11px] font-bold px-2.5 py-1 rounded md:mt-0.5 uppercase tracking-wide border whitespace-nowrap ${isReal
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                    : "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                                    }`}>
                                    {accountType}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-medium bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
                                    #{account.accountNumber}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                                <span className="font-bold text-gray-700 dark:text-gray-300 uppercase">
                                    {account.platform || "MT4"}
                                </span>
                                <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                                <span className="truncate max-w-[140px]" title={account.server}>
                                    {account.server || "Server Unknown"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Connection Status Pulse */}
                    <div className="pt-2 pl-2">
                        <div className="relative flex items-center justify-center w-3 h-3" title={account.isConnected ? "Connected" : "Disconnected"}>
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${account.isConnected ? "bg-primary" : "bg-red-500"}`}></span>
                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${account.isConnected ? "bg-primary" : "bg-red-500"}`}></span>
                        </div>
                    </div>
                </div>

                {/* Balance & Equity Row - Unified Style */}
                <div className="flex items-center gap-8 mb-4">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Balance</p>
                        <p className="text-2xl font-bold text-primary tracking-tight">
                            ${(account.balance || 0).toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Equity</p>
                        <p className="text-2xl font-bold text-primary tracking-tight">
                            ${(account.equity || account.balance || 0).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/5 rounded-b-2xl flex items-center justify-between mt-auto gap-4">
                <Link
                    href={`/dashboard?accountId=${account.id}`}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors group/link shrink-0"
                >
                    <span className="whitespace-nowrap">View Dashboard</span>
                    <ExternalLink size={16} className="opacity-50 group-hover/link:opacity-100 transition-opacity" />
                </Link>

                <div className="flex items-center gap-2 min-w-0 justify-end">
                    <span className="text-xs text-gray-400 mr-2 hidden lg:inline-block truncate">
                        {account.lastSync ? formatDistanceToNow(new Date(account.lastSync), { addSuffix: true }) : "Never"}
                    </span>

                    <div className="shrink-0 flex items-center gap-2">
                        <RemoteSyncButton
                            tradingAccountId={account.id}
                            accountName={account.name}
                            isConnected={account.isConnected}
                        />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/20">
                                    <MoreVertical size={18} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={() => onSettings(account)} className="py-2.5 cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onRegenerateKey(account.id)} className="py-2.5 cursor-pointer">
                                    <Key className="mr-2 h-4 w-4" />
                                    <span>Regenerate Key</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onDelete(account.id)}
                                    className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-500/10 py-2.5 cursor-pointer"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete Account</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </div>
    );
}
