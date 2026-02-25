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
        <div className="group relative bg-white dark:bg-[#151925] rounded-xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow flex flex-col min-h-[220px]">
            {/* Ambient Glow Layer - Bọc riêng để xài overflow-hidden mượt mà, không cắt mất Modal */}
            <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full blur-[70px] transition-all duration-700 ${account.isConnected ? "bg-primary/10 group-hover:bg-primary/20" : "bg-red-500/10 group-hover:bg-red-500/20"}`}></div>
            </div>

            <div className="p-6 relative z-10 flex flex-col flex-1 h-full">
                {/* Broker Badge & Options */}
                <div className="flex justify-between items-start mb-auto w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-50/50 dark:bg-black/20 flex items-center justify-center font-black text-gray-500 border border-gray-100 dark:border-white/5 shadow-inner shrink-0 relative overflow-hidden">
                            {getPlatformIcon(account.platform) ? (
                                <NextImage
                                    src={getPlatformIcon(account.platform)!}
                                    alt={account.platform || "Platform Icon"}
                                    width={28}
                                    height={28}
                                    className="object-contain"
                                />
                            ) : (
                                <span>{account.platform?.substring(0, 3) || "MT4"}</span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-900 dark:text-white truncate max-w-[140px]" title={account.name}>
                                    {account.name}
                                </h3>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border whitespace-nowrap hidden sm:inline-block pr-1.5 ${isReal
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                    : "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                                    }`}>
                                    {accountType}
                                </span>
                                {account.accountNumber && (
                                    <span className="text-[10px] font-mono font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap bg-gray-50 border border-gray-100 dark:bg-white/5 dark:border-white/5 px-1.5 py-0.5 rounded-md">
                                        #{account.accountNumber}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 font-medium mt-0.5 truncate max-w-[180px]" title={account.server || "Server Unknown"}>
                                {account.server || "Server Unknown"}
                            </p>
                        </div>
                    </div>
                    
                    {/* Options Menu */}
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none">
                                    <MoreVertical size={16} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl border-gray-100 dark:border-white/5 shadow-xl bg-white dark:bg-[#1E2028] z-[100]">
                                <DropdownMenuItem onClick={() => onSettings(account)} className="flex items-center gap-3 px-3 py-2.5 font-semibold text-sm cursor-pointer rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 focus:bg-gray-50 dark:focus:bg-white/5 transition-colors">
                                    <Settings size={16} className="text-gray-400" />
                                    <span>Account Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onRegenerateKey(account.id)} className="flex items-center gap-3 px-3 py-2.5 font-semibold text-sm cursor-pointer rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 focus:bg-gray-50 dark:focus:bg-white/5 transition-colors">
                                    <Key size={16} className="text-gray-400" />
                                    <span>Regenerate API Key</span>
                                </DropdownMenuItem>
                                <div className="h-px bg-gray-100 dark:bg-white/5 my-1" />
                                <DropdownMenuItem
                                    onClick={() => onDelete(account.id)}
                                    className="flex items-center gap-3 px-3 py-2.5 font-semibold text-sm cursor-pointer rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 focus:bg-red-50 dark:focus:bg-red-500/10 focus:text-red-600 transition-colors"
                                >
                                    <Trash2 size={16} />
                                    <span>Delete Account</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Stats / Balance (Middle) */}
                <div className="py-5 w-full grid grid-cols-2 gap-3 min-w-0">
                    <div className="min-w-0 pr-2">
                        <p className="text-[9px] md:text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1 flex items-center gap-1.5 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0"></span>
                            Balance
                        </p>
                        <p className="text-xl sm:text-2xl md:text-xl lg:text-2xl xl:text-3xl font-black text-emerald-600 dark:text-emerald-400 truncate w-full" title={`$${(account.balance || 0).toLocaleString()}`}>
                            ${(account.balance || 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="min-w-0 pl-2 border-l border-gray-100 dark:border-white/5">
                        <p className="text-[9px] md:text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1 flex items-center gap-1.5 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0"></span>
                            Equity
                        </p>
                        <p className="text-xl sm:text-2xl md:text-xl lg:text-2xl xl:text-3xl font-black text-emerald-600 dark:text-emerald-400 truncate w-full" title={`$${(account.equity || account.balance || 0).toLocaleString()}`}>
                            ${(account.equity || account.balance || 0).toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Actions / Status (Bottom) */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5 mt-auto flex-wrap gap-y-3">
                    <div className="flex items-center gap-2 shrink-0">
                        {account.isConnected ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Active Sync</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Offline</span>
                            </div>
                        )}
                        
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-1 hidden sm:inline-block truncate max-w-[80px] lg:max-w-[120px]">
                            {account.lastSync ? formatDistanceToNow(new Date(account.lastSync), { addSuffix: true }) : "Never sync"}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 z-10 w-full sm:w-auto mt-2 sm:mt-0">
                        <Link
                            href={`/dashboard?accountId=${account.id}`}
                            className="flex items-center justify-center sm:justify-start gap-2 px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 hover:shadow-sm border border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-200 font-bold text-xs transition-all group/link flex-1 sm:flex-none"
                            title="View Dashboard"
                        >
                            <ExternalLink size={14} className="text-gray-400 group-hover/link:text-primary transition-colors" />
                            <span>Dashboard</span>
                        </Link>

                        <div className="flex-1 sm:flex-none">
                            <RemoteSyncButton
                                tradingAccountId={account.id}
                                accountName={account.name}
                                isConnected={account.isConnected}
                                variant="premium"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
