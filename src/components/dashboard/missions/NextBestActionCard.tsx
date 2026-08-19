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
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 p-6 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-4">
                    <CheckCircle2
                        className="text-emerald-600 dark:text-emerald-400"
                        size={24}
                    />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    You're caught up!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    You've completed all available missions. Keep trading and
                    learning to unlock more opportunities.
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
                "rounded-2xl border transition-all duration-300 relative overflow-hidden group shadow-[0_15px_30px_rgba(16,185,129,0.03)]",
                "bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/10 border-emerald-200/50",
                "dark:from-[#1E2028] dark:to-[#151925] dark:border-white/[0.06]"
            )}
        >
            {/* Left vertical glowing accent border */}
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-primary via-teal-400 to-emerald-500 rounded-l-2xl animate-pulse" />

            {/* Large background decorative icon */}
            <div className="absolute -bottom-10 -right-8 text-primary/[0.03] dark:text-primary/[0.01] pointer-events-none group-hover:scale-105 transition-transform duration-500">
                <Target size={220} className="fill-current" />
            </div>

            <div className="relative p-6 md:p-8 pl-7 md:pl-9 flex flex-col lg:flex-row lg:items-center justify-between gap-6 z-10">
                <div className="flex-1 space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 dark:bg-primary/5 text-primary border border-primary/20 dark:border-primary/10 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                        <Target
                            size={12}
                            className="fill-current animate-pulse"
                        />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                            Your Next Best Action
                        </span>
                    </div>

                    <div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                            {mission.def.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm max-w-xl leading-relaxed">
                            {mission.def.whyItMatters ||
                                mission.def.description}
                        </p>
                    </div>

                    {!isClaimable && (
                        <div className="flex items-center gap-3 mt-4">
                            <div className="flex-1 h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden max-w-xs border border-dashboard/20">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-teal-500 transition-all duration-500 rounded-full"
                                    style={{
                                        width: `${Math.min(100, Math.round((mission.progress / mission.target) * 100))}%`,
                                    }}
                                />
                            </div>
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                {mission.progress} / {mission.target}
                            </span>
                        </div>
                    )}
                </div>

                <div className="w-full lg:w-auto shrink-0 flex flex-col sm:flex-row items-stretch sm:items-start gap-4 pt-1">
                    {/* Reward Box */}
                    <div className="flex items-center gap-3 px-4 rounded-2xl bg-amber-500/10 dark:bg-amber-400/5 border border-amber-500/25 dark:border-amber-400/10 shrink-0 h-[46px]">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/20">
                            <Zap
                                size={14}
                                className="fill-current animate-pulse"
                            />
                        </div>
                        <div>
                            <p className="text-sm font-black text-amber-600 dark:text-amber-400 leading-tight">
                                +{mission.def.xpReward} Edge
                            </p>
                            <p className="text-[9px] text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-wider leading-none mt-0.5">
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
                                className="w-full bg-gradient-to-r from-gold to-amber-500 hover:from-amber-400 hover:to-gold text-white border-0 shadow-lg shadow-gold/20 font-black px-6 rounded-2xl transition-all hover:scale-105 h-[46px]"
                            >
                                {isClaiming ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Claiming...
                                    </>
                                ) : (
                                    <>
                                        <Trophy className="mr-2 h-4 w-4" />
                                        Claim
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
                                    className="w-full px-6 rounded-2xl font-bold group-hover:shadow-lg group-hover:shadow-primary/20 transition-all h-[46px]"
                                >
                                    {mission.def.ctaLabel || "Continue"}
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                </Button>
                            </Link>
                        )}

                        {isClaimable && (
                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                Ready to claim!
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
