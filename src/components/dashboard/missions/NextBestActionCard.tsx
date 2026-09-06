"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowRight,
    Trophy,
    Target,
    Loader2,
    CheckCircle2,
    BookOpen,
    Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { MissionProgressItem } from "@/lib/services/edge-missions.service";
import { claimMission } from "@/actions/edge-missions";
import { refreshClaimableCount } from "@/hooks/useClaimableCount";
import { trackEvent } from "@/lib/track";
import { celebrateXP } from "@/lib/celebrate";
import { toast } from "sonner";

interface NextBestActionCardProps {
    mission: MissionProgressItem | null;
    onClaimed?: () => void;
}

export function NextBestActionCard({
    mission,
    onClaimed,
}: NextBestActionCardProps) {
    const [isClaiming, setIsClaiming] = useState(false);

    const handleClaim = async () => {
        if (!mission) return;
        setIsClaiming(true);
        try {
            const result = await claimMission(mission.missionId);
            if (result.success) {
                trackEvent("mission_claimed", {
                    mission_id: mission.missionId,
                    category: mission.def.category,
                    edge: result.xpAwarded || mission.def.xpReward,
                    surface: "next_best_action",
                });
                await celebrateXP({
                    xp: result.xpAwarded || 0,
                    message: `Mission Complete: ${mission.def.title}`,
                });
                refreshClaimableCount();
                if (onClaimed) onClaimed();
            } else {
                toast.error(result.error || "Claim Failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsClaiming(false);
        }
    };

    if (!mission) {
        return (
            <div className="rounded-2xl border border-dashboard dark:border-white/[0.08] bg-white dark:bg-[#1E2028] p-6 md:p-8 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
                    <CheckCircle2
                        className="text-emerald-600 dark:text-emerald-400"
                        size={24}
                    />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    All Milestones Completed
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    All current execution milestones are logged and verified. Maintain your trading routine and log trades to generate new review actions.
                </p>
                <div className="flex gap-3">
                    <Link href="/dashboard/journal">
                        <Button variant="outline" className="gap-2">
                            <Target size={16} />
                            Log a Trade
                        </Button>
                    </Link>
                    <Link href="/dashboard/academy">
                        <Button variant="primary" className="gap-2">
                            <BookOpen size={16} />
                            Go to Academy
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const isClaimable = mission.completed && !mission.claimed;

    return (
        <div
            className={cn(
                "rounded-2xl border transition-all duration-300 relative overflow-hidden group shadow-sm hover:shadow-md",
                "bg-white dark:bg-[#1E2028] border-dashboard dark:border-white/[0.08]"
            )}
        >
            {/* Left vertical accent border */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-2xl" />

            <div className="relative p-6 md:p-8 pl-7 md:pl-9 flex flex-col lg:flex-row lg:items-center justify-between gap-6 z-10">
                <div className="flex-1 space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 dark:bg-primary/15 text-primary border border-primary/20 text-[11px] font-semibold uppercase tracking-wider">
                        <Target size={13} className="shrink-0" />
                        <span>Next Best Action</span>
                    </div>

                    <div>
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
                            {mission.def.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm max-w-xl leading-relaxed">
                            {mission.def.whyItMatters ||
                                mission.def.description}
                        </p>
                    </div>

                    {!isClaimable && (
                        <div className="flex items-center gap-3 mt-4">
                            <div className="flex-1 h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden max-w-xs border border-dashboard">
                                <div
                                    className="h-full bg-primary transition-all duration-500 rounded-full"
                                    style={{
                                        width: `${Math.min(100, Math.round((mission.progress / mission.target) * 100))}%`,
                                    }}
                                />
                            </div>
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 tabular-nums">
                                {mission.progress} / {mission.target}
                            </span>
                        </div>
                    )}
                </div>

                <div className="w-full lg:w-auto shrink-0 flex flex-col sm:flex-row items-stretch sm:items-start gap-4 pt-1">
                    {/* Reward Box */}
                    <div className="flex items-center gap-3 px-4 rounded-xl bg-amber-500/10 dark:bg-amber-400/5 border border-amber-500/20 dark:border-amber-400/10 shrink-0 h-[44px]">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-amber-500 text-white shadow-sm">
                            <Zap size={14} className="shrink-0" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-amber-600 dark:text-amber-400 leading-tight tabular-nums">
                                +{mission.def.xpReward} Edge
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider leading-none mt-0.5">
                                Reward
                            </p>
                        </div>
                    </div>

                    {/* Button & Claim Status */}
                    <div className="flex flex-col items-stretch sm:items-center gap-1.5 min-w-[140px]">
                        {isClaimable ? (
                            <Button
                                onClick={handleClaim}
                                disabled={isClaiming}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 rounded-xl transition-all shadow-sm h-[44px]"
                            >
                                {isClaiming ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Claiming...
                                    </>
                                ) : (
                                    <>
                                        <Trophy className="mr-2 h-4 w-4" />
                                        Claim Reward
                                    </>
                                )}
                            </Button>
                        ) : (
                            <Link
                                href={mission.def.ctaHref || "#"}
                                className="w-full"
                                onClick={() => {
                                    if (
                                        mission.def.ctaHref?.includes(
                                            "/reports"
                                        )
                                    ) {
                                        trackEvent(
                                            "mission_report_cta_clicked",
                                            {
                                                surface: "missions",
                                                action: "open_weekly_review",
                                                missionId: mission.missionId,
                                            }
                                        );
                                    }
                                }}
                            >
                                <Button
                                    variant="primary"
                                    className="w-full px-6 rounded-xl font-semibold transition-all h-[44px]"
                                >
                                    {mission.def.ctaLabel || "Continue"}
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                </Button>
                            </Link>
                        )}

                        {isClaimable && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">
                                Ready to claim
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
