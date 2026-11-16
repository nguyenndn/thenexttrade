"use client";

import Link from "next/link";
import { Eye, TrendingDown, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { buttonVariants } from "@/components/ui/button-variants";
import { BehaviorGroupBadge } from "./BehaviorBadges";
import type { UserBehaviorSegmentItem } from "@/lib/admin/behavior/types";

interface ValueRadarTableProps {
    items: UserBehaviorSegmentItem[];
}

export function ValueRadarTable({ items }: ValueRadarTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                <thead className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 select-none">
                    <tr>
                        <th className="py-3.5 pl-4 pr-3">Trader</th>
                        <th className="px-4 py-3.5">Group</th>
                        <th className="px-4 py-3.5">Real Account</th>
                        <th className="px-4 py-3.5">Tempo (30d)</th>
                        <th className="px-4 py-3.5">Trend</th>
                        <th className="px-4 py-3.5">Product Adoption</th>
                        <th className="px-4 py-3.5">Stayed After Loss</th>
                        <th className="px-4 py-3.5">Last Activity</th>
                        <th className="py-3.5 pl-3 pr-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {items.map((item) => {
                        const c = item.classification;
                        const m = c.metrics;

                        return (
                            <tr
                                key={item.userId}
                                className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors"
                            >
                                <td className="py-3.5 pl-4 pr-3 align-middle">
                                    <div className="flex items-center gap-2.5">
                                        <Link
                                            href={`/admin/users/${item.userId}`}
                                            className="shrink-0 group"
                                        >
                                            <Avatar className="h-8 w-8 rounded-full border border-gray-200 dark:border-white/10 group-hover:ring-2 group-hover:ring-gold/40 transition-all">
                                                <AvatarImage
                                                    src={
                                                        item.user.image ||
                                                        undefined
                                                    }
                                                    alt={
                                                        item.user.name ||
                                                        "Trader"
                                                    }
                                                />
                                                <AvatarFallback className="rounded-full bg-gold/10 text-amber-700 dark:text-gold text-xs font-black">
                                                    {(
                                                        item.user.name ||
                                                        item.user.email ||
                                                        "T"
                                                    )[0].toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Link>
                                        <div className="min-w-0">
                                            <Link
                                                href={`/admin/users/${item.userId}`}
                                                className="font-bold text-gray-900 dark:text-white hover:text-amber-600 dark:hover:text-gold hover:underline truncate max-w-[160px] block transition-colors"
                                            >
                                                {item.user.name ||
                                                    "Unnamed Trader"}
                                            </Link>
                                            <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                                                {item.user.email}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3.5 align-middle">
                                    <BehaviorGroupBadge group={c.group} />
                                </td>
                                <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                                    {m.hasLiveAccount ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                            Live Real
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10">
                                            Demo / None
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3.5 align-middle font-mono tabular-nums font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                    {m.activeDays30} days / 30d
                                    <span className="block text-[11px] font-normal text-gray-500 dark:text-gray-400">
                                        {m.closedTrades30} closed trades
                                    </span>
                                </td>
                                <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                                    {m.trend === "UP" ? (
                                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                                            <TrendingUp className="h-3.5 w-3.5" />
                                            Accelerating
                                        </span>
                                    ) : m.trend === "DOWN" ? (
                                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                                            <TrendingDown className="h-3.5 w-3.5" />
                                            Slowing
                                        </span>
     ) : (
                                        <span className="text-gray-500 dark:text-gray-400 font-medium">
                                            → Steady
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                                    <span className="font-mono tabular-nums font-bold text-gray-900 dark:text-white">
                                        {m.productAdoptionCount} / 8
                                    </span>
                                    <span className="text-[11px] text-gray-400 ml-1">
                                        modules
                                    </span>
                                </td>
                                <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                                    {m.stayedAfterLoss === true ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                            Stayed
                                        </span>
                                    ) : m.stayedAfterLoss === false ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                                            No Trade Since
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-xs">
                                            No Loss Logged
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3.5 align-middle font-mono tabular-nums text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    {item.lastActivityAt
                                        ? formatDistanceToNow(
                                              new Date(item.lastActivityAt),
                                              { addSuffix: true }
                                          )
                                        : "No telemetry"}
                                </td>
                                <td className="py-3.5 pl-3 pr-4 text-right align-middle whitespace-nowrap">
                                    <Link
                                        href={`/admin/users/${item.userId}`}
                                        className={buttonVariants({
                                            variant: "outline",
                                            size: "sm",
                                            className:
                                                "border-gray-200 dark:border-white/10 text-xs font-bold gap-1 px-2.5",
                                        })}
                                    >
                                        <Eye size={13} />
                                        <span>Detail</span>
                                    </Link>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
