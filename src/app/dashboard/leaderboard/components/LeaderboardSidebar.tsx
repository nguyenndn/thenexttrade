"use client";

import { useState, useTransition } from "react";
import {
    Globe,
    Lock,
    Info,
    Loader2,
    BarChart2,
    Eye,
    EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    toggleLeaderboardVisibility,
    toggleAccountLeaderboardVisibility,
    type SidebarDataResponse,
    type UserTradingAccountInfo,
} from "../actions";

interface LeaderboardSidebarProps {
    initialData: SidebarDataResponse;
}

export function LeaderboardSidebar({ initialData }: LeaderboardSidebarProps) {
    const [showOnLeaderboard, setShowOnLeaderboard] = useState(
        initialData.showOnLeaderboard
    );
    const [accounts, setAccounts] = useState<UserTradingAccountInfo[]>(
        initialData.accounts
    );
    const [isPending, startTransition] = useTransition();
    const [togglingAccount, setTogglingAccount] = useState<string | null>(null);

    const handleGlobalVisibilityToggle = () => {
        startTransition(async () => {
            try {
                const newValue = await toggleLeaderboardVisibility();
                setShowOnLeaderboard(newValue);
            } catch (err) {
                console.error("Failed to toggle global visibility:", err);
            }
        });
    };

    const handleAccountVisibilityToggle = (
        accountId: string,
        currentVal: boolean
    ) => {
        setTogglingAccount(accountId);
        startTransition(async () => {
            try {
                const newVal = !currentVal;
                const result = await toggleAccountLeaderboardVisibility(
                    accountId,
                    newVal
                );
                setAccounts((prev) =>
                    prev.map((acc) =>
                        acc.id === accountId
                            ? { ...acc, useForLeaderboard: result }
                            : acc
                    )
                );
            } catch (err) {
                console.error("Failed to toggle account visibility:", err);
            } finally {
                setTogglingAccount(null);
            }
        });
    };

    const formatCurrency = (val: number) => {
        const isNegative = val < 0;
        const absVal = Math.abs(val).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return `${isNegative ? "-" : ""}$${absVal}`;
    };

    return (
        <div className="space-y-6">
            {/* Privacy & Settings Card */}
            <div className="bg-white dark:bg-[#151925] rounded-2xl border border-dashboard shadow-sm p-6 space-y-6">
                <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                        My Accounts & Privacy Settings
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Control how your profile and trading accounts appear on
                        the leaderboard.
                    </p>
                </div>

                {/* Global Visibility */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashboard">
                    <div className="space-y-0.5 max-w-[70%]">
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            Leaderboard Profile
                        </span>
                        <p className="text-xs text-gray-500">
                            {showOnLeaderboard
                                ? "Your profile is visible on the leaderboard."
                                : "Your profile is hidden from the leaderboard."}
                        </p>
                    </div>
                    <button
                        onClick={handleGlobalVisibilityToggle}
                        disabled={isPending}
                        className={cn(
                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                            showOnLeaderboard
                                ? "bg-[#00C888]"
                                : "bg-gray-200 dark:bg-white/10"
                        )}
                    >
                        <span
                            className={cn(
                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                showOnLeaderboard
                                    ? "translate-x-5"
                                    : "translate-x-0"
                            )}
                        />
                    </button>
                </div>

                {/* Accounts Visibility & Performance */}
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Trading Accounts ({accounts.length})
                    </h4>

                    {accounts.length === 0 ? (
                        <div className="text-center py-6 text-xs text-gray-500 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-dashboard">
                            No trading accounts connected yet.
                        </div>
                    ) : (
                        accounts.map((account) => (
                            <div
                                key={account.id}
                                className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashboard space-y-4 transition-all duration-300 hover:border-gray-300 dark:hover:border-white/15"
                            >
                                {/* Account Details */}
                                <div className="flex items-start justify-between">
                                    <div className="space-y-0.5">
                                        <span className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                            {account.name}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {account.broker || "Unknown Broker"}{" "}
                                            {account.accountNumber
                                                ? `(${account.accountNumber})`
                                                : ""}
                                        </span>
                                    </div>

                                    {/* Visibility Button Group */}
                                    <div className="flex items-center bg-gray-200/60 dark:bg-white/10 rounded-lg p-0.5 border border-dashboard">
                                        <button
                                            onClick={() =>
                                                handleAccountVisibilityToggle(
                                                    account.id,
                                                    account.useForLeaderboard
                                                )
                                            }
                                            disabled={
                                                togglingAccount === account.id
                                            }
                                            className={cn(
                                                "p-1.5 rounded-md transition-all duration-200 flex items-center justify-center",
                                                account.useForLeaderboard
                                                    ? "bg-white dark:bg-white/10 text-emerald-600 dark:text-emerald-400 shadow-sm"
                                                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                            )}
                                            title="Visible on Leaderboard"
                                        >
                                            {togglingAccount === account.id ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Globe className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleAccountVisibilityToggle(
                                                    account.id,
                                                    account.useForLeaderboard
                                                )
                                            }
                                            disabled={
                                                togglingAccount === account.id
                                            }
                                            className={cn(
                                                "p-1.5 rounded-md transition-all duration-200 flex items-center justify-center",
                                                !account.useForLeaderboard
                                                    ? "bg-white dark:bg-white/10 text-gray-700 dark:text-gray-300 shadow-sm"
                                                    : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                            )}
                                            title="Hidden / Private"
                                        >
                                            {togglingAccount === account.id ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Lock className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Account Settings / Warning if parent hidden */}
                                {!showOnLeaderboard &&
                                    account.useForLeaderboard && (
                                        <div className="flex items-start gap-2 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 p-2 rounded-lg">
                                            <Info className="w-3 h-3 shrink-0 mt-0.5" />
                                            <span>
                                                Your profile is set to hidden.
                                                This account will not be visible
                                                on the leaderboard.
                                            </span>
                                        </div>
                                    )}

                                {/* Performance overview */}
                                <div className="pt-3 border-t border-dashboard space-y-2">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <BarChart2 className="w-3.5 h-3.5 text-gray-400" />
                                        <span>Performance</span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="p-2 bg-white/40 dark:bg-white/5 rounded-lg">
                                            <span className="block text-[10px] text-gray-500 font-medium">
                                                Daily
                                            </span>
                                            <span
                                                className={cn(
                                                    "text-xs font-bold block mt-0.5",
                                                    account.pnl.daily > 0
                                                        ? "text-[#00C888]"
                                                        : account.pnl.daily < 0
                                                          ? "text-red-500"
                                                          : "text-gray-600 dark:text-gray-400"
                                                )}
                                            >
                                                {formatCurrency(
                                                    account.pnl.daily
                                                )}
                                            </span>
                                        </div>
                                        <div className="p-2 bg-white/40 dark:bg-white/5 rounded-lg">
                                            <span className="block text-[10px] text-gray-500 font-medium">
                                                Weekly
                                            </span>
                                            <span
                                                className={cn(
                                                    "text-xs font-bold block mt-0.5",
                                                    account.pnl.weekly > 0
                                                        ? "text-[#00C888]"
                                                        : account.pnl.weekly < 0
                                                          ? "text-red-500"
                                                          : "text-gray-600 dark:text-gray-400"
                                                )}
                                            >
                                                {formatCurrency(
                                                    account.pnl.weekly
                                                )}
                                            </span>
                                        </div>
                                        <div className="p-2 bg-white/40 dark:bg-white/5 rounded-lg">
                                            <span className="block text-[10px] text-gray-500 font-medium">
                                                Monthly
                                            </span>
                                            <span
                                                className={cn(
                                                    "text-xs font-bold block mt-0.5",
                                                    account.pnl.monthly > 0
                                                        ? "text-[#00C888]"
                                                        : account.pnl.monthly <
                                                            0
                                                          ? "text-red-500"
                                                          : "text-gray-600 dark:text-gray-400"
                                                )}
                                            >
                                                {formatCurrency(
                                                    account.pnl.monthly
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Empty state details */}
                                    {!account.hasData && (
                                        <div className="flex items-start gap-2 text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 p-2.5 rounded-lg">
                                            <Info className="w-3.5 h-3.5 shrink-0" />
                                            <span>
                                                No trading data for this period.
                                                Place some trades or sync your
                                                account.
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
