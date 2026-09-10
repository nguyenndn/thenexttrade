import Link from "next/link";
import type { NorthStarReport } from "@/lib/admin/reports/types";
import {
    Users,
    Wallet,
    BookOpen,
    FileText,
    Crown,
    Zap,
    TrendingUp,
    TrendingDown,
    Minus,
    ArrowRight,
    Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";

interface NorthStarPanelProps {
    data: NorthStarReport;
}

const funnelSteps = [
    {
        key: "newUsers",
        label: "New Users",
        icon: Users,
        gradient: "bg-gradient-to-br from-blue-500 to-indigo-600",
    },
    {
        key: "connectedAccountUsers",
        label: "Connected",
        icon: Wallet,
        gradient: "bg-gradient-to-br from-cyan-500 to-teal-600",
    },
    {
        key: "firstTradeUsers",
        label: "First Trade",
        icon: BookOpen,
        gradient: "bg-gradient-to-br from-emerald-500 to-green-600",
    },
    {
        key: "weeklyReportUsers",
        label: "Weekly Rep",
        icon: FileText,
        gradient: "bg-gradient-to-br from-amber-500 to-orange-600",
    },
    {
        key: "proRequestUsers",
        label: "Pro Req",
        icon: Crown,
        gradient: "bg-gradient-to-br from-orange-500 to-rose-600",
    },
    {
        key: "proUnlockedUsers",
        label: "Pro Active",
        icon: Zap,
        gradient: "bg-gradient-to-br from-primary via-teal-500 to-emerald-500",
    },
] as const;

export function NorthStarPanel({ data }: NorthStarPanelProps) {
    const isPositive = data.trendPct > 0;
    const isNegative = data.trendPct < 0;
    const TrendIcon = isPositive
        ? TrendingUp
        : isNegative
          ? TrendingDown
          : Minus;
    const activationRate =
        data.newUsers > 0
            ? Math.round((data.proUnlockedUsers / data.newUsers) * 100)
            : 0;

    return (
        <section className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] shadow-sm hover:shadow-md transition-shadow p-5 sm:p-6 space-y-6">
            {/* Top Accent Gradient Line */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-sky-400 to-amber-500" />

            {/* Top Header: North Star Badge, Primary Metric & Action */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        North Star Metric
                    </div>

                    <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
                        <div>
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                Weekly active traders
                            </p>
                            <p className="mt-0.5 text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tabular-nums tracking-tight">
                                {data.activeTraders.toLocaleString()}
                            </p>
                        </div>

                        {/* Trend Percentage Badge */}
                        <span
                            className={cn(
                                "mb-1 inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-black tabular-nums shadow-xs",
                                isPositive &&
                                    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
                                isNegative &&
                                    "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
                                !isPositive &&
                                    !isNegative &&
                                    "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300 border-gray-200 dark:border-white/10"
                            )}
                        >
                            <TrendIcon size={14} />
                            {isPositive ? "+" : ""}
                            {data.trendPct}%
                        </span>

                        {/* Secondary Stats Capsules */}
                        <div className="flex items-center gap-2 mb-0.5">
                            <div className="px-3 py-1.5 rounded-xl bg-gray-50/90 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 shadow-xs">
                                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                                    Previous
                                </p>
                                <p className="text-sm font-black text-gray-900 dark:text-white tabular-nums mt-0.5">
                                    {data.previousActiveTraders.toLocaleString()}
                                </p>
                            </div>

                            <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-xs">
                                <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                    Pro Activation
                                </p>
                                <p className="text-sm font-black text-amber-700 dark:text-amber-300 tabular-nums mt-0.5">
                                    {activationRate}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <Link
                    href="/admin/users"
                    className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                        className:
                            "rounded-xl font-bold shadow-xs shrink-0 self-start lg:self-center gap-1.5",
                    })}
                >
                    View Users
                    <ArrowRight size={14} />
                </Link>
            </div>

            {/* Funnel Section: Weekly Active Traders Funnel */}
            <div className="pt-5 border-t border-gray-200/80 dark:border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                            <Activity size={16} />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-gray-950 dark:text-white">
                                Weekly Active Traders Funnel
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                From signup to Pro activation, measured across the selected report window.
                            </p>
                        </div>
                    </div>

                    <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
                        {data.proUnlockedUsers.toLocaleString()} of{" "}
                        {data.newUsers.toLocaleString()} users reached Pro Active
                    </span>
                </div>

                {/* 6 Elevated Non-Flat Funnel Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
                    {funnelSteps.map((step, i) => {
                        const value = data[step.key];
                        const prevValue =
                            i > 0 ? data[funnelSteps[i - 1].key] : null;
                        const convRate =
                            prevValue && prevValue > 0
                                ? Math.round((value / prevValue) * 100)
                                : null;
                        const Icon = step.icon;

                        return (
                            <div
                                key={step.key}
                                className="relative p-4 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.05] shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group flex flex-col justify-between"
                            >
                                <div>
                                    {/* Icon & Step Number */}
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <div
                                            className={cn(
                                                "w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0",
                                                step.gradient
                                            )}
                                        >
                                            <Icon size={16} />
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-extrabold text-gray-400">
                                                #{i + 1}
                                            </span>
                                            {convRate !== null && (
                                                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                    {convRate}%
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Value & Step Label */}
                                    <div>
                                        <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums tracking-tight truncate">
                                            {value.toLocaleString()}
                                        </p>
                                        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1 truncate">
                                            {step.label}
                                        </p>
                                    </div>
                                </div>

                                {/* Progress depth bar */}
                                <div className="mt-3.5 pt-2 border-t border-gray-200/60 dark:border-white/5">
                                    <div className="h-1.5 w-full rounded-full bg-gray-200/80 dark:bg-white/10 overflow-hidden shadow-inner">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                                            style={{
                                                width: `${Math.max(6, Math.min(100, i === 0 ? 100 : (convRate ?? 0)))}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Subtext & Rate */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                    <span>
                        Pro activation rate is calculated as Pro Active divided by New Users for this period.
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 w-fit">
                        {activationRate}% activation
                    </span>
                </div>
            </div>
        </section>
    );
}

