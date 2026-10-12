"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { TrendingUp, Brain, Sparkles } from "lucide-react";

/**
 * DATA_BUILDING Milestone Celebrations
 *
 * Shows a one-time toast when the user crosses key trade count thresholds
 * (5, 10, 15 trades) during the DATA_BUILDING → INSIGHT_READY journey.
 *
 * Uses localStorage to ensure each milestone fires only once per user.
 * Renders nothing — pure side-effect hook wrapped in a component.
 */

interface MilestoneToasterProps {
    /** Current closed-trade count from growthViewModel.maturity */
    tradeCount: number;
    /** Current maturity stage — only fire during DATA_BUILDING */
    maturityStage: string;
}

interface MilestoneDef {
    threshold: number;
    key: string;
    title: string;
    description: string;
    icon: "trending" | "brain" | "sparkles";
}

const MILESTONES: MilestoneDef[] = [
    {
        threshold: 5,
        key: "milestone_5_trades",
        title: "First 5 Trades Logged",
        description:
            "Your first week is taking shape. Session patterns are emerging.",
        icon: "trending",
    },
    {
        threshold: 10,
        key: "milestone_10_trades",
        title: "10 Trades — Halfway to Insight",
        description:
            "10 more trades until your first AI deep analysis unlocks.",
        icon: "brain",
    },
    {
        threshold: 15,
        key: "milestone_15_trades",
        title: "15 Trades — Almost There",
        description:
            "5 more trades and your AI Coach generates your first performance insight.",
        icon: "sparkles",
    },
];

export function MilestoneToaster({
    tradeCount,
    maturityStage,
}: MilestoneToasterProps) {
    useEffect(() => {
        // Only celebrate during data-building or just-crossed-insight stages
        if (
            maturityStage !== "DATA_BUILDING" &&
            maturityStage !== "INSIGHT_READY"
        ) {
            return;
        }

        // Short delay so the dashboard has time to render first
        const timer = setTimeout(() => {
            for (const m of MILESTONES) {
                if (tradeCount >= m.threshold) {
                    const storageKey = `tnt_${m.key}`;
                    if (localStorage.getItem(storageKey)) continue;

                    localStorage.setItem(storageKey, "1");

                    toast.success(m.title, {
                        description: m.description,
                        duration: 6000,
                        icon:
                            m.icon === "trending" ? (
                                <TrendingUp size={18} />
                            ) : m.icon === "brain" ? (
                                <Brain size={18} />
                            ) : (
                                <Sparkles size={18} />
                            ),
                    });

                    // Only show the highest milestone reached, not all at once
                    break;
                }
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [tradeCount, maturityStage]);

    return null;
}
