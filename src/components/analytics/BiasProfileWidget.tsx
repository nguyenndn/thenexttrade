"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
    Brain,
    Crown,
    AlertCircle,
    BookOpen,
    Activity,
    ChevronRight,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { analyzeCognitiveBiases } from "@/actions/cognitive-bias";
import Link from "next/link";
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

interface BiasData {
    lossAversion: number;
    fomo: number;
    overconfidence: number;
    emotionalContagion: number;
}

interface RecommendedLesson {
    id: string;
    title: string;
    slug: string;
    path: string;
}

type DominantBiasKey =
    | "LOSS_AVERSION"
    | "FOMO"
    | "OVERCONFIDENCE"
    | "EMOTIONAL_CONTAGION";

interface BiasTooltipPayloadItem {
    name?: string | number;
    value?: string | number | ReadonlyArray<string | number>;
    payload?: { name?: string; value?: number };
}

function renderFormattedText(text: string): React.ReactNode {
    if (!text) return null;
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
            return (
                <strong
                    key={idx}
                    className="font-bold text-gray-800 dark:text-white"
                >
                    {part.slice(2, -2)}
                </strong>
            );
        }
        return <React.Fragment key={idx}>{part.replace(/\*\*/g, "")}</React.Fragment>;
    });
}

export function BiasProfileWidget({ accountId }: { accountId?: string }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isProCTA, setIsProCTA] = useState(false);
    const [hasEnoughData, setHasEnoughData] = useState(true);
    const [profile, setProfile] = useState<{
        biases: BiasData;
        dominantBias: DominantBiasKey;
        assessment: string;
        actionPlan: string;
        recommendedLesson: RecommendedLesson;
    } | null>(null);

    const loadBiasProfile = useCallback(async () => {
        setLoading(true);
        setError(null);
        setIsProCTA(false);
        setHasEnoughData(true);

        try {
            const res = await analyzeCognitiveBiases(accountId);

            if (res.error) {
                if (res.isProUpgradeCTA) {
                    setIsProCTA(true);
                } else if (res.hasEnoughData === false) {
                    setHasEnoughData(false);
                } else {
                    setError(res.error);
                }
                return;
            }

            if (res.success && res.biases && res.recommendedLesson) {
                setProfile({
                    biases: res.biases,
                    dominantBias: res.dominantBias as DominantBiasKey,
                    assessment: res.assessment || "",
                    actionPlan: res.actionPlan || "",
                    recommendedLesson: res.recommendedLesson,
                });
            }
        } catch {
            setError(
                "Failed to load Cognitive Bias Profile. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, [accountId]);

    useEffect(() => {
        loadBiasProfile();
    }, [loadBiasProfile]);

    const getBiasDisplayName = (bias: string) => {
        switch (bias) {
            case "LOSS_AVERSION":
                return "Loss Aversion";
            case "FOMO":
                return "FOMO (Fear Of Missing Out)";
            case "OVERCONFIDENCE":
                return "Overconfidence";
            case "EMOTIONAL_CONTAGION":
                return "Emotional Contagion";
            default:
                return bias;
        }
    };

    const renderTooltip = ({
        active,
        payload,
    }: {
        active?: boolean;
        payload?: readonly BiasTooltipPayloadItem[];
    }) => {
        if (active && payload && payload.length > 0) {
            const item = payload[0];
            const label = String(item.payload?.name || item.name || "Bias");
            const rawVal = Array.isArray(item.value)
                ? item.value[0]
                : item.value;
            const value = rawVal ?? item.payload?.value ?? 0;
            return (
                <div className="bg-white dark:bg-[#1E2028] border border-dashboard dark:border-amber-500/20 px-3 py-1.5 rounded-lg shadow-xl">
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 font-mono tabular-nums">
                        {label}:{" "}
                        <span className="text-amber-600 dark:text-amber-400 font-extrabold">
                            {value}%
                        </span>
                    </p>
                </div>
            );
        }
        return null;
    };

    // ─── LOADING STATE ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="relative overflow-hidden rounded-xl border border-dashboard bg-white dark:bg-[#1E2028] p-6 min-h-[460px] lg:h-full flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                <div className="text-center space-y-1">
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                        Scanning journal logs &amp; telemetry...
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Analyzing emotional tags and metrics to map execution
                        biases...
                    </p>
                </div>
            </div>
        );
    }

    // ─── PRO CONVERSION CTA STATE ──────────────────────────────────────────────
    if (isProCTA) {
        return (
            <div className="relative overflow-hidden rounded-xl bg-white dark:bg-[#1E2028] p-6 min-h-[460px] lg:h-full flex flex-col justify-between group transition-all duration-300">
                <div className="absolute inset-0 rounded-xl p-px pointer-events-none">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400/40 via-orange-500/10 to-amber-400/40 dark:from-amber-400/30 dark:via-orange-500/10 dark:to-amber-400/30" />
                </div>

                <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-[40px] pointer-events-none" />

                <div className="space-y-4 relative">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 shrink-0">
                            <Brain className="h-6 w-6 text-amber-500 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-gray-800 dark:text-white flex items-center gap-1.5">
                                Cognitive Bias Profiler
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full border border-amber-500/25 bg-amber-500/10 text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                    Pro
                                </span>
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Execution Bias Radar
                            </p>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-dashboard space-y-3">
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                            <strong>Partner Pro Behavioral Telemetry:</strong>{" "}
                            System engine analyzes your execution history
                            against pre/post trade emotional logs to isolate
                            behavioral blind spots causing equity drawdowns
                            (Loss Aversion, FOMO, Overconfidence).
                        </p>
                        <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                4D Behavioral Bias Radar Chart
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Execution discipline &amp; drawdown alerts
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Targeted Academy lessons to fix identified leaks
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="space-y-2 relative pt-4">
                    <Link
                        href="/dashboard/accounts?action=add&intent=unlock-pro"
                        className="w-full"
                    >
                        <Button
                            variant="primary"
                            className="w-full py-3 text-xs font-bold flex items-center justify-center gap-1.5 rounded-lg"
                        >
                            <Crown className="w-4 h-4" />
                            Connect Partner Broker to Activate Pro Tier
                        </Button>
                    </Link>
                    <p className="text-[10px] text-gray-400 text-center">
                        Or link your broker account via our partner IB referral
                        link.
                    </p>
                </div>
            </div>
        );
    }

    // ─── NOT ENOUGH DATA STATE ──────────────────────────────────────────────────
    if (!hasEnoughData) {
        return (
            <div className="relative overflow-hidden rounded-xl border border-dashed border-dashboard bg-white dark:bg-[#1E2028] p-6 min-h-[460px] lg:h-full flex flex-col justify-between group transition-all duration-300">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0">
                            <Brain className="h-6 w-6 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-gray-800 dark:text-white flex items-center gap-1.5">
                                Cognitive Bias Profiler
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Cognitive Bias Map
                            </p>
                        </div>
                    </div>

                    <div className="p-5 rounded-xl bg-amber-500/[0.03] border border-amber-500/10 text-center space-y-3 my-4">
                        <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
                            <Activity className="h-6 w-6 text-amber-500" />
                        </div>
                        <h4 className="text-xs font-bold text-gray-700 dark:text-gray-200">
                            Insufficient Data for Analysis
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
                            Requires at least{" "}
                            <strong className="font-bold text-gray-700 dark:text-gray-200">
                                5 closed trades
                            </strong>{" "}
                            with emotional tags in your journal to accurately
                            map your execution bias radar.
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Link href="/dashboard/journal">
                        <Button
                            variant="outline"
                            className="w-full border-amber-500/20 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs py-2.5 rounded-lg"
                        >
                            Go to Trading Journal to Add Entries
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    // ─── ERROR STATE ────────────────────────────────────────────────────────────
    if (error || !profile) {
        return (
            <div className="relative overflow-hidden rounded-xl border border-red-500/20 bg-white dark:bg-[#1E2028] p-6 min-h-[460px] lg:h-full flex flex-col items-center justify-center space-y-4 text-center">
                <AlertCircle className="h-10 w-10 text-red-500" />
                <div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white">
                        Unable to Display Bias Map
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {error || "Unknown error occurred"}
                    </p>
                </div>
                <Button
                    onClick={loadBiasProfile}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                >
                    Try Again
                </Button>
            </div>
        );
    }

    // ─── MAIN SUCCESS STATE ─────────────────────────────────────────────────────
    const biasData = [
        { name: "Loss Aversion", value: profile.biases.lossAversion },
        { name: "FOMO", value: profile.biases.fomo },
        { name: "Overconfidence", value: profile.biases.overconfidence },
        {
            name: "Contagion",
            value: profile.biases.emotionalContagion,
        },
    ];

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard shadow-sm flex flex-col justify-between min-h-[420px] sm:min-h-[460px] lg:h-full group transition-all duration-300">
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                            <Brain className="h-5 w-5 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 dark:text-white">
                                Cognitive Bias Profiler
                            </h3>
                            <p className="text-xs text-gray-500">
                                Execution Bias Radar
                            </p>
                        </div>
                    </div>
                    <div className="sm:text-right">
                        <p className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400">
                            {getBiasDisplayName(profile.dominantBias)}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Dominant Bias
                        </p>
                    </div>
                </div>

                {/* Radar Chart */}
                <div className="flex-1 min-h-[180px] w-full my-2 flex items-center justify-center">
                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                        minWidth={0}
                        minHeight={160}
                    >
                        <RadarChart
                            cx="50%"
                            cy="50%"
                            outerRadius="65%"
                            data={biasData}
                        >
                            <PolarGrid
                                stroke="rgba(156, 163, 175, 0.15)"
                                strokeDasharray="3 3"
                            />
                            <PolarAngleAxis
                                dataKey="name"
                                tick={{
                                    fill: "#9CA3AF",
                                    fontSize: 10,
                                    fontWeight: 600,
                                }}
                                tickLine={false}
                            />
                            <PolarRadiusAxis
                                angle={90}
                                domain={[0, 100]}
                                tick={false}
                                axisLine={false}
                            />
                            <Radar
                                name="Biases"
                                dataKey="value"
                                stroke="#D97706"
                                fill="#F59E0B"
                                fillOpacity={0.15}
                                strokeWidth={2.5}
                                isAnimationActive={true}
                                animationDuration={400}
                                animationEasing="ease-out"
                                dot={{ r: 4, fill: "#D97706", strokeWidth: 0 }}
                                activeDot={{
                                    r: 6,
                                    fill: "#D97706",
                                    strokeWidth: 2,
                                    stroke: "#fff",
                                }}
                            />
                            <Tooltip content={renderTooltip} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* Dimension Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-1">
                    <div className="text-center px-1 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-dashboard/50">
                        <p className="text-base font-black font-mono tabular-nums text-amber-600 dark:text-amber-400">
                            {profile.biases.lossAversion}%
                        </p>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider leading-tight mt-0.5">
                            Loss Aversion
                        </p>
                    </div>
                    <div className="text-center px-1 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-dashboard/50">
                        <p className="text-base font-black font-mono tabular-nums text-amber-600 dark:text-amber-400">
                            {profile.biases.fomo}%
                        </p>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider leading-tight mt-0.5">
                            FOMO
                        </p>
                    </div>
                    <div className="text-center px-1 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-dashboard/50">
                        <p className="text-base font-black font-mono tabular-nums text-amber-600 dark:text-amber-400">
                            {profile.biases.overconfidence}%
                        </p>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider leading-tight mt-0.5">
                            Overconfidence
                        </p>
                    </div>
                    <div className="text-center px-1 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-dashboard/50">
                        <p className="text-base font-black font-mono tabular-nums text-amber-600 dark:text-amber-400">
                            {profile.biases.emotionalContagion}%
                        </p>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider leading-tight mt-0.5">
                            Emotional Contagion
                        </p>
                    </div>
                </div>

                {/* Coaching Area */}
                <div className="space-y-2.5 mt-3">
                    <div className="p-3 rounded-lg bg-amber-500/[0.03] dark:bg-amber-500/[0.04] border border-amber-500/10">
                        <p className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                            Discipline Assessment:
                        </p>
                        <p className="text-xs text-gray-700 dark:text-gray-300 italic leading-relaxed mt-0.5">
                            &ldquo;{renderFormattedText(profile.assessment)}&rdquo;
                        </p>
                    </div>

                    <div className="p-3 rounded-lg bg-emerald-500/[0.03] dark:bg-emerald-500/[0.04] border border-emerald-500/10">
                        <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                            Mindset Action Plan:
                        </p>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-semibold mt-0.5">
                            {renderFormattedText(profile.actionPlan)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Recommended Lesson CTA Loop */}
            <div className="p-4 border-t border-dashboard bg-gray-50/50 dark:bg-white/[0.01]">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="p-1 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                            <BookOpen className="h-3.5 w-3.5" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                Mindset Correction Lesson
                            </p>
                            <p className="text-xs font-black text-gray-700 dark:text-gray-200 truncate leading-snug">
                                {profile.recommendedLesson.title}
                            </p>
                        </div>
                    </div>

                    <Link
                        href={profile.recommendedLesson.path}
                        className="shrink-0 w-full sm:w-auto"
                    >
                        <Button className="w-full sm:w-auto justify-center bg-gold hover:bg-amber-600 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-0.5 shadow-md shadow-amber-500/20 border-none">
                            Correct Mental Bias
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </Link>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 mt-2 justify-center text-[10px] text-gray-500 dark:text-gray-400">
                    <Brain className="h-3 w-3 text-amber-500" />
                    <span>
                        Complete the recommended lesson to earn{" "}
                        <strong className="font-bold text-amber-600 dark:text-amber-400">
                            +100 Edge
                        </strong>{" "}
                        &amp; a Special Badge!
                    </span>
                </div>
            </div>
        </div>
    );
}
