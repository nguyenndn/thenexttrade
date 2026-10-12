"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
    Gift,
    Check,
    Loader2,
    FileText,
    GraduationCap,
    CalendarCheck,
    BarChart3,
    TrendingUp,
    ClipboardCheck,
    Brain,
    Target,
    BookOpen,
    Zap,
    ArrowRight,
} from "lucide-react";
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

const ICON_MAP: Record<string, React.ElementType> = {
    "file-text": FileText,
    "graduation-cap": GraduationCap,
    "calendar-check": CalendarCheck,
    "bar-chart-3": BarChart3,
    "trending-up": TrendingUp,
    "clipboard-check": ClipboardCheck,
    brain: Brain,
    target: Target,
    "book-open": BookOpen,
    zap: Zap,
};

const CATEGORY_BADGES: Record<string, { label: string; className: string }> = {
    DAILY: {
        label: "Daily",
        className: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    },
    ONBOARDING: {
        label: "Onboarding",
        className: "bg-amber-500/10 text-gold dark:text-amber-400 border-amber-500/20",
    },
    WEEKLY: {
        label: "Weekly",
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    MASTERY: {
        label: "Mastery",
        className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    },
};

export function MissionCard({ mission, onClaimed }: MissionCardProps) {
    const [isPending, startTransition] = useTransition();
    const [localClaimed, setLocalClaimed] = useState(false);

    const claimed = mission.claimed || localClaimed;
    const progressPct = Math.min((mission.progress / mission.target) * 100, 100);
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
    const IconComponent = ICON_MAP[mission.def.icon] || Target;

    return (
        <div
            className={cn(
                "relative rounded-lg border p-5 transition-all duration-300 flex flex-col justify-between",
                "bg-white dark:bg-[#1E2028] border-dashboard dark:border-white/[0.08] shadow-sm hover:shadow-md",
                claimed && "opacity-60 bg-gray-50/50 dark:bg-[#151925]/60",
                canClaim && "border-amber-500/50 ring-2 ring-amber-500/20 shadow-lg shadow-amber-500/10"
            )}
        >
            {/* Top Accent for Ready to Claim */}
            {canClaim && (
                <div className="absolute top-0 left-6 right-6 h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-b-full shadow-xs" />
            )}

            <div>
                {/* Header: Icon + Category + Title */}
                <div className="flex items-start gap-3.5 mb-3">
                    <div
                        className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105",
                            claimed
                                ? "bg-amber-500/10 dark:bg-amber-500/10 border-amber-500/20 dark:border-amber-500/20 text-gold dark:text-amber-400"
                                : canClaim
                                  ? "bg-amber-500/15 border-amber-500/30 text-amber-500 shadow-sm shadow-amber-500/20"
                                  : "bg-gray-50 dark:bg-white/5 border-dashboard dark:border-white/10 text-gray-700 dark:text-gray-300"
                        )}
                    >
                        {claimed ? (
                            <Check size={18} strokeWidth={2.5} />
                        ) : canClaim ? (
                            <Gift size={18} className="animate-bounce" />
                        ) : (
                            <IconComponent size={18} />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <span
                                className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider shrink-0",
                                    categoryBadge.className
                                )}
                            >
                                {categoryBadge.label}
                            </span>
                            <span className="text-[11px] font-extrabold text-amber-500 tabular-nums shrink-0">
                                +{mission.def.xpReward} Edge
                            </span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {mission.def.title}
                        </h3>
                    </div>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-2">
                    {mission.def.description}
                </p>

                {/* Why It Matters / Trader Discipline Context */}
                {mission.def.whyItMatters && (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 line-clamp-2 leading-relaxed bg-gray-50/70 dark:bg-white/[0.02] border-l-2 border-amber-500/40 pl-2 py-1 rounded-r-md mb-3">
                        {mission.def.whyItMatters}
                    </p>
                )}
            </div>

            {/* Bottom Progress & Action Area */}
            <div className="mt-auto pt-2 space-y-3">
                {/* Progress Bar */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-gray-500 dark:text-gray-400 tabular-nums">
                            Progress: {mission.progress} / {mission.target}
                        </span>
                        <span className="font-bold tabular-nums text-gray-700 dark:text-gray-300">
                            {Math.round(progressPct)}%
                        </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden border border-dashboard dark:border-white/5">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-500",
                                claimed
                                    ? "bg-gray-300 dark:bg-gray-600"
                                    : isComplete
                                      ? "bg-amber-500 shadow-sm shadow-amber-500/40"
                                      : "bg-gold shadow-sm shadow-amber-500/30"
                            )}
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                </div>

                {/* Button Action */}
                {canClaim && (
                    <Button
                        onClick={handleClaim}
                        disabled={isPending}
                        className="w-full bg-gold hover:bg-amber-600 text-white font-bold text-xs rounded-lg shadow-md shadow-gold/20 h-9 transition-all cursor-pointer"
                    >
                        {isPending ? (
                            <Loader2 size={14} className="animate-spin mr-1.5" />
                        ) : (
                            <Gift size={14} className="mr-1.5" />
                        )}
                        Claim +{mission.def.xpReward} Edge
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
                            variant="outline"
                            className="w-full text-xs font-semibold rounded-lg h-9 hover:border-gold hover:text-gold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <span>{mission.def.ctaLabel || "Continue"}</span>
                            <ArrowRight size={13} />
                        </Button>
                    </Link>
                )}

                {claimed && (
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-gold dark:text-amber-400 py-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <Check size={14} strokeWidth={2.5} />
                        Reward Claimed
                    </div>
                )}
            </div>
        </div>
    );
}
