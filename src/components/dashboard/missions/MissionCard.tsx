"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Gift, Check, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { claimMission } from "@/actions/edge-missions";
import { refreshClaimableCount } from "@/hooks/useClaimableCount";
import { trackEvent } from "@/lib/track";
import { celebrateXP } from "@/lib/celebrate";
import { toast } from "sonner";
import type { MissionProgressItem } from "@/lib/services/edge-missions.service";

interface MissionCardProps {
    mission: MissionProgressItem;
    onClaimed?: () => void;
}

const CATEGORY_BADGES: Record<string, { label: string; className: string }> = {
    DAILY: {
        label: "Daily",
        className:
            "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    },
    ONBOARDING: {
        label: "Onboarding",
        className:
            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    WEEKLY: {
        label: "Weekly",
        className:
            "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    MASTERY: {
        label: "Mastery",
        className:
            "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    },
};

export function MissionCard({ mission, onClaimed }: MissionCardProps) {
    const [isPending, startTransition] = useTransition();
    const [localClaimed, setLocalClaimed] = useState(false);

    // Derive claimed status: true if server says claimed OR if we just claimed locally (optimistic)
    const claimed = mission.claimed || localClaimed;
    const progressPct = Math.min(
        (mission.progress / mission.target) * 100,
        100
    );
    const isComplete = mission.completed;
    const canClaim = isComplete && !claimed;

    const handleClaim = () => {
        startTransition(async () => {
            const result = await claimMission(mission.missionId);
            if (result.success) {
                setLocalClaimed(true);
                trackEvent("mission_claimed", {
                    mission_id: mission.missionId,
                    category: mission.def.category,
                    edge: result.xpAwarded || mission.def.xpReward,
                });
                await celebrateXP({
                    xp: result.xpAwarded || mission.def.xpReward,
                    message: `Mission Complete: ${mission.def.title}`,
                });
                refreshClaimableCount();
                onClaimed?.();
            } else if (result.error) {
                toast.error(result.error);
            }
        });
    };

    const categoryBadge =
        CATEGORY_BADGES[mission.def.category] || CATEGORY_BADGES.ONBOARDING;

    return (
        <div
            className={cn(
                "relative rounded-xl border p-5 transition-all duration-300 flex flex-col justify-between",
                "bg-white dark:bg-[#1E2028] border-dashboard dark:border-white/[0.08] shadow-sm hover:shadow-md",
                claimed && "opacity-60 bg-gray-50/50 dark:bg-[#151925]/60",
                canClaim && "border-amber-500/40 ring-1 ring-amber-500/20 shadow-amber-500/5"
            )}
        >
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
                <div
                    className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
                        claimed
                            ? "bg-gray-100 dark:bg-white/5 border-dashboard dark:border-white/10 text-emerald-500"
                            : canClaim
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                              : "bg-gray-50 dark:bg-white/5 border-dashboard dark:border-white/10 text-gray-400"
                    )}
                >
                    {claimed ? (
                        <Check size={16} className="text-emerald-500" />
                    ) : canClaim ? (
                        <Gift size={16} className="text-amber-500" />
                    ) : (
                        <Lock size={16} className="text-gray-400" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {mission.def.title}
                        </h3>
                        <span
                            className={cn(
                                "text-[10px] font-semibold px-2 py-0.5 rounded-md border uppercase tracking-wider shrink-0",
                                categoryBadge.className
                            )}
                        >
                            {categoryBadge.label}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {mission.def.description}
                    </p>
                    {mission.def.whyItMatters && (
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 italic line-clamp-2 leading-relaxed">
                            {mission.def.whyItMatters}
                        </p>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4 mt-auto pt-2">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 tabular-nums">
                        {mission.progress} / {mission.target}
                    </span>
                    <span className="text-[11px] font-bold text-amber-500 tabular-nums">
                        +{mission.def.xpReward} Edge
                    </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden border border-dashboard dark:border-white/5">
                    <div
                        className={cn(
                            "h-full rounded-full transition-all duration-500",
                            claimed
                                ? "bg-gray-300 dark:bg-gray-600"
                                : isComplete
                                  ? "bg-amber-500"
                                  : "bg-primary"
                        )}
                        style={{ width: `${progressPct}%` }}
                    />
                </div>
            </div>

            {/* CTA */}
            {canClaim && (
                <Button
                    onClick={handleClaim}
                    disabled={isPending}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl shadow-sm h-9"
                >
                    {isPending ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <Gift size={14} />
                    )}
                    Claim Reward
                </Button>
            )}

            {!isComplete && (
                <Link
                    href={mission.def.ctaHref || "#"}
                    className="block w-full"
                    onClick={() => {
                        if (mission.def.ctaHref?.includes("/reports")) {
                            trackEvent("mission_report_cta_clicked", {
                                surface: "missions",
                                action: "open_weekly_review",
                                missionId: mission.missionId,
                            });
                        }
                    }}
                >
                    <Button
                        variant="primary"
                        className="w-full text-xs font-semibold rounded-xl h-9"
                    >
                        {mission.def.ctaLabel || "Continue"}
                    </Button>
                </Link>
            )}

            {claimed && (
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 py-1.5">
                    <Check size={14} />
                    Claimed
                </div>
            )}
        </div>
    );
}
