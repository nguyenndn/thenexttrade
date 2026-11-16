"use client";

import Link from "next/link";
import { CheckCircle2, Eye, UserCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/button-variants";
import { BehaviorGroupBadge, BehaviorStatusDot } from "./BehaviorBadges";
import type { UserBehaviorSegmentItem } from "@/lib/admin/behavior/types";

interface NeedsAttentionTableProps {
    items: UserBehaviorSegmentItem[];
    isPending: boolean;
    onMarkContacted: (signalId?: string | null) => void;
}

export function NeedsAttentionTable({
    items,
    isPending,
    onMarkContacted,
}: NeedsAttentionTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                <thead className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 select-none">
                    <tr>
                        <th className="py-3.5 pl-4 pr-3">Status</th>
                        <th className="px-4 py-3.5">Trader</th>
                        <th className="px-4 py-3.5">Behavior Group</th>
                        <th className="px-4 py-3.5">Telemetry Diagnosis</th>
                        <th className="px-4 py-3.5">Tempo (30d)</th>
                        <th className="px-4 py-3.5">Last Activity</th>
                        <th className="py-3.5 pl-3 pr-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {items.map((item) => {
                        const c = item.classification;
                        const m = c.metrics;
                        const isContacted = Boolean(item.contactedAt);

                        return (
                            <tr
                                key={item.userId}
                                className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors"
                            >
                                <td className="py-3.5 pl-4 pr-3 align-middle">
                                    <BehaviorStatusDot color={c.dotColor} />
                                </td>
                                <td className="px-4 py-3.5 align-middle">
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
                                <td className="max-w-xs px-4 py-3.5 align-middle space-y-0.5">
                                    <p className="font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
                                        {c.reasons[0] ||
                                            c.narrativeParagraphs[0] ||
                                            "Normal execution pattern"}
                                    </p>
                                    {c.actionSuggestion && (
                                        <p className="text-[11px] text-amber-700 dark:text-amber-400/90 line-clamp-1">
                                            {c.actionSuggestion}
                                        </p>
                                    )}
                                </td>
                                <td className="px-4 py-3.5 align-middle font-mono tabular-nums font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                    {m.activeDays30} active days
                                    <span className="block text-[11px] font-normal text-gray-500 dark:text-gray-400">
                                        {m.closedTrades30} closed trades
                                    </span>
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
                                    <div className="flex items-center justify-end gap-1.5">
                                        {item.activeSignalId && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    onMarkContacted(
                                                        item.activeSignalId
                                                    )
                                                }
                                                disabled={
                                                    isPending || isContacted
                                                }
                                                className={
                                                    isContacted
                                                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold gap-1 px-2.5"
                                                        : "border-gray-200 dark:border-white/10 text-xs font-bold gap-1 px-2.5"
                                                }
                                            >
                                                {isContacted ? (
                                                    <CheckCircle2 size={13} />
                                                ) : (
                                                    <UserCheck size={13} />
                                                )}
                                                <span>Contacted</span>
                                            </Button>
                                        )}
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
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
