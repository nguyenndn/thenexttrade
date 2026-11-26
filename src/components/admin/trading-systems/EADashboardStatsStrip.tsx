"use client";

import type { ReactNode } from "react";
import { Bot, CheckCircle2, Clock, DollarSign, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EADashboardSummaryStats {
    activeProductsCount: number;
    totalProductsCount: number;
    totalDownloadsCount: number;
    confirmedFarmCapitalUSD: number;
    onlineTerminalsCount: number;
    approvedLicensesCount: number;
    pendingLicensesCount: number;
    activeBrokersCount: number;
}

interface EADashboardStatsStripProps {
    stats: EADashboardSummaryStats;
    activeTab: string;
    onSelectProducts: () => void;
    onSelectLicenses: (status: "ALL" | "APPROVED" | "PENDING") => void;
}

interface StripCardItem {
    key: string;
    label: string;
    icon: LucideIcon;
    iconBoxClass: string;
    cardClass: string;
    valueNode: ReactNode;
    subNode: ReactNode;
    onClick: () => void;
}

export function EADashboardStatsStrip({
    stats,
    activeTab,
    onSelectProducts,
    onSelectLicenses,
}: EADashboardStatsStripProps) {
    const hasPending = stats.pendingLicensesCount > 0;
    const formattedFarm = stats.confirmedFarmCapitalUSD.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

    const cards: StripCardItem[] = [
        {
            key: "systems",
            label: "Active Systems",
            icon: Bot,
            iconBoxClass:
                "bg-gold/10 border-gold/20 text-amber-600 dark:text-gold",
            cardClass:
                activeTab === "products"
                    ? "border-amber-500/35 hover:border-amber-500/50"
                    : "border-gray-200 dark:border-white/10 hover:border-amber-500/40",
            valueNode: (
                <p className="text-2xl font-black text-gray-900 dark:text-white mt-2 tabular-nums">
                    {stats.activeProductsCount}
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 ml-1">
                        / {stats.totalProductsCount}
                    </span>
                </p>
            ),
            subNode: (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 tabular-nums">
                    {stats.totalDownloadsCount} total{" "}
                    {stats.totalDownloadsCount === 1 ? "download" : "downloads"}
                </p>
            ),
            onClick: onSelectProducts,
        },
        {
            key: "capital",
            label: "Confirmed Farm Capital",
            icon: DollarSign,
            iconBoxClass:
                "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
            cardClass:
                "border-gray-200 dark:border-white/10 hover:border-emerald-500/40",
            valueNode: (
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 tabular-nums">
                    ${formattedFarm}
                </p>
            ),
            subNode: (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5 tabular-nums">
                    {stats.onlineTerminalsCount > 0 ? (
                        <>
                            <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span>
                                {stats.onlineTerminalsCount} MT5{" "}
                                {stats.onlineTerminalsCount === 1
                                    ? "terminal"
                                    : "terminals"}{" "}
                                online
                            </span>
                        </>
                    ) : (
                        <span>Verified live IB accounts</span>
                    )}
                </p>
            ),
            onClick: onSelectProducts,
        },
        {
            key: "approved",
            label: "Approved Licenses",
            icon: CheckCircle2,
            iconBoxClass:
                "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
            cardClass:
                "border-gray-200 dark:border-white/10 hover:border-emerald-500/40",
            valueNode: (
                <p className="text-2xl font-black text-gray-900 dark:text-white mt-2 tabular-nums">
                    {stats.approvedLicensesCount}
                </p>
            ),
            subNode: (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 tabular-nums">
                    {stats.activeBrokersCount} partner{" "}
                    {stats.activeBrokersCount === 1 ? "broker" : "brokers"}
                </p>
            ),
            onClick: () => onSelectLicenses("APPROVED"),
        },
        {
            key: "pending",
            label: "Pending Review",
            icon: Clock,
            iconBoxClass:
                "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-gold",
            cardClass: hasPending
                ? "border-amber-500/40 bg-amber-500/[0.04] dark:bg-amber-500/[0.06] hover:border-amber-500"
                : "border-gray-200 dark:border-white/10 hover:border-amber-500/30",
            valueNode: (
                <p
                    className={cn(
                        "text-2xl font-black mt-2 tabular-nums",
                        hasPending
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-gray-900 dark:text-white"
                    )}
                >
                    {stats.pendingLicensesCount}
                </p>
            ),
            subNode: (
                <p
                    className={cn(
                        "text-xs mt-1 font-medium",
                        hasPending
                            ? "text-amber-600 dark:text-amber-400 font-bold"
                            : "text-gray-500 dark:text-gray-400"
                    )}
                >
                    {hasPending ? "Click to review requests →" : "Queue is clear"}
                </p>
            ),
            onClick: () => onSelectLicenses(hasPending ? "PENDING" : "ALL"),
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {cards.map((card) => {
                const Icon = card.icon;
                return (
                    <div
                        key={card.key}
                        role="button"
                        tabIndex={0}
                        onClick={card.onClick}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                card.onClick();
                            }
                        }}
                        className={cn(
                            "rounded-xl border bg-white dark:bg-[#1E2028] p-4 text-left transition-all cursor-pointer shadow-sm",
                            card.cardClass
                        )}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                {card.label}
                            </span>
                            <div
                                className={cn(
                                    "w-8 h-8 rounded-lg border flex items-center justify-center shrink-0",
                                    card.iconBoxClass
                                )}
                            >
                                <Icon size={16} />
                            </div>
                        </div>
                        {card.valueNode}
                        {card.subNode}
                    </div>
                );
            })}
        </div>
    );
}
