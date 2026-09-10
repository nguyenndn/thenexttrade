"use client";

import { useState, useMemo } from "react";
import {
    Sparkles,
    Flame,
    Zap,
    Target,
    CheckCircle2,
    Clock,
    XCircle,
    Search,
    Eye,
    X,
    TrendingUp,
    ListTodo,
    Brain,
    Award,
    Activity,
    Compass,
    ArrowRight,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { cn } from "@/lib/utils";

export interface MissionProgressItem {
    id: string;
    missionId: string;
    periodKey: string;
    progress: number;
    target: number;
    claimed: boolean;
    claimedAt: Date | string | null;
    completedAt: Date | string | null;
    createdAt: Date | string;
}

export interface EdgeEventItem {
    id: string;
    eventType: string;
    sourceType: string | null;
    sourceId: string | null;
    xpAwarded: number;
    metadata: unknown;
    createdAt: Date | string;
}

export interface ImprovementExperimentItem {
    id: string;
    title: string;
    actionType: string;
    hypothesis: string;
    instruction: string;
    primaryMetric: string;
    targetTradeCount: number;
    baseline: unknown;
    followUp: unknown;
    result: unknown;
    status: string;
    outcome: string | null;
    acceptedAt: Date | string | null;
    reviewReadyAt: Date | string | null;
    completedAt: Date | string | null;
    createdAt: Date | string;
}

export interface CoachActionPlanItemType {
    id: string;
    stableKey: string;
    label: string;
    detail: string;
    ctaHref: string | null;
    position: number;
    status: string;
    completedAt: Date | string | null;
}

export interface CoachActionPlanItem {
    id: string;
    type: string;
    title: string;
    summary: string;
    keepDoing: string | null;
    fixNext: string | null;
    nextActions: unknown;
    lessonSlugs: string[];
    status: string;
    createdAt: Date | string;
    completedAt: Date | string | null;
    items: CoachActionPlanItemType[];
}

interface UserGrowthCoachTabProps {
    missionProgress: MissionProgressItem[];
    edgeEvents: EdgeEventItem[];
    experiments: ImprovementExperimentItem[];
    coachPlans: CoachActionPlanItem[];
}

export function UserGrowthCoachTab({
    missionProgress,
    edgeEvents,
    experiments,
    coachPlans,
}: UserGrowthCoachTabProps) {
    const [activeSection, setActiveSection] = useState<"experiments" | "coach" | "missions">("experiments");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedExp, setSelectedExp] = useState<ImprovementExperimentItem | null>(null);
    const [selectedCoachPlan, setSelectedCoachPlan] = useState<CoachActionPlanItem | null>(null);

    // KPI Metrics
    const stats = useMemo(() => {
        const totalXp = edgeEvents.reduce((acc, e) => acc + (e.xpAwarded || 0), 0);
        const completedMissions = missionProgress.filter((m) => m.progress >= m.target || m.claimed).length;
        const activeExperiments = experiments.filter((e) => e.status === "IN_PROGRESS" || e.status === "ACTIVE").length;
        const activeCoachPlans = coachPlans.filter((p) => p.status === "ACTIVE").length;

        return {
            totalXp,
            edgeEventCount: edgeEvents.length,
            completedMissions,
            totalMissions: missionProgress.length,
            activeExperiments,
            totalExperiments: experiments.length,
            activeCoachPlans,
            totalCoachPlans: coachPlans.length,
        };
    }, [missionProgress, edgeEvents, experiments, coachPlans]);

    // Filtered lists
    const filteredExperiments = useMemo(() => {
        if (!searchQuery.trim()) return experiments;
        const q = searchQuery.toLowerCase();
        return experiments.filter(
            (e) =>
                e.title.toLowerCase().includes(q) ||
                e.hypothesis.toLowerCase().includes(q) ||
                e.primaryMetric.toLowerCase().includes(q) ||
                e.status.toLowerCase().includes(q)
        );
    }, [experiments, searchQuery]);

    const filteredCoachPlans = useMemo(() => {
        if (!searchQuery.trim()) return coachPlans;
        const q = searchQuery.toLowerCase();
        return coachPlans.filter(
            (p) =>
                p.title.toLowerCase().includes(q) ||
                p.summary.toLowerCase().includes(q) ||
                p.fixNext?.toLowerCase().includes(q)
        );
    }, [coachPlans, searchQuery]);

    const filteredMissions = useMemo(() => {
        if (!searchQuery.trim()) return missionProgress;
        const q = searchQuery.toLowerCase();
        return missionProgress.filter(
            (m) => m.missionId.toLowerCase().includes(q) || m.periodKey.toLowerCase().includes(q)
        );
    }, [missionProgress, searchQuery]);

    return (
        <div className="space-y-6">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#151925]">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <Flame size={14} className="text-amber-500" /> Total Edge XP
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                            {stats.totalXp.toLocaleString()} XP
                        </span>
                        <span className="text-xs text-gray-500">{stats.edgeEventCount} events</span>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#151925]">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <Target size={14} className="text-emerald-500" /> Missions Cleared
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                            {stats.completedMissions}
                        </span>
                        <span className="text-xs text-gray-500">of {stats.totalMissions} tracked</span>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#151925]">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <Sparkles size={14} className="text-purple-500" /> 10-Trade Sprints
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                            {stats.activeExperiments}
                        </span>
                        <span className="text-xs text-gray-500">of {stats.totalExperiments} total</span>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#151925]">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <Brain size={14} className="text-blue-500" /> Coach Action Plans
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                            {stats.totalCoachPlans}
                        </span>
                        <span className="text-xs text-gray-500">{stats.activeCoachPlans} active</span>
                    </div>
                </div>
            </div>

            {/* Sub-Section Navigation & Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex rounded-xl border border-gray-200 bg-[#F1F3F5] p-1 dark:border-white/10 dark:bg-[#1A1D27] w-fit">
                    <button
                        type="button"
                        onClick={() => setActiveSection("experiments")}
                        className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                            activeSection === "experiments"
                                ? "bg-white text-gray-900 shadow-sm dark:bg-[#252936] dark:text-white"
                                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        )}
                    >
                        <Sparkles size={14} /> 10-Trade Experiments ({experiments.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection("coach")}
                        className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                            activeSection === "coach"
                                ? "bg-white text-gray-900 shadow-sm dark:bg-[#252936] dark:text-white"
                                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        )}
                    >
                        <Brain size={14} /> AI Coach Plans ({coachPlans.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection("missions")}
                        className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                            activeSection === "missions"
                                ? "bg-white text-gray-900 shadow-sm dark:bg-[#252936] dark:text-white"
                                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        )}
                    >
                        <Award size={14} /> Missions & Edge XP ({edgeEvents.length})
                    </button>
                </div>

                <div className="w-full sm:w-64">
                    <PremiumInput
                        placeholder="Search growth telemetry..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        prefix={<Search size={14} className="text-gray-400" />}
                    />
                </div>
            </div>

            {/* Section 1: 10-Trade Experiments (GAP-6) */}
            {activeSection === "experiments" && (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151925] overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Sparkles size={16} className="text-purple-500" /> Behavioral Improvement Experiments ({filteredExperiments.length})
                        </h3>
                        <span className="text-xs text-gray-500">10-Trade Sprint Protocol</span>
                    </div>

                    {filteredExperiments.length > 0 ? (
                        <div className="divide-y divide-gray-200 dark:divide-white/10">
                            {filteredExperiments.map((exp) => (
                                <div
                                    key={exp.id}
                                    className="p-4 sm:p-5 transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                                >
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 shrink-0 mt-0.5">
                                            <Sparkles size={18} />
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                                                    {exp.title}
                                                </h4>
                                                <span
                                                    className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider",
                                                        exp.status === "COMPLETED"
                                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                                                            : exp.status === "IN_PROGRESS" || exp.status === "ACTIVE"
                                                            ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                                                            : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400"
                                                    )}
                                                >
                                                    {exp.status}
                                                </span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 uppercase">
                                                    Metric: {exp.primaryMetric}
                                                </span>
                                            </div>

                                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 line-clamp-2 italic">
                                                Hypothesis: "{exp.hypothesis}"
                                            </p>

                                            <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
                                                <span>Created {format(new Date(exp.createdAt), "MMM d, yyyy")}</span>
                                                <span>· Target: {exp.targetTradeCount} trades</span>
                                                {exp.outcome && (
                                                    <span className="font-semibold text-primary">· Outcome: {exp.outcome}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedExp(exp)}
                                        className="rounded-xl shrink-0 self-end sm:self-center gap-1.5 text-xs font-semibold"
                                    >
                                        <Eye size={14} /> View Sprint
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-sm text-gray-500">No improvement experiments recorded for this user.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Section 2: Coach Action Plans (GAP-7) */}
            {activeSection === "coach" && (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151925] overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Brain size={16} className="text-blue-500" /> AI Coach Weekly Action Plans ({filteredCoachPlans.length})
                        </h3>
                        <span className="text-xs text-gray-500">Performance Feedback</span>
                    </div>

                    {filteredCoachPlans.length > 0 ? (
                        <div className="divide-y divide-gray-200 dark:divide-white/10">
                            {filteredCoachPlans.map((plan) => (
                                <div
                                    key={plan.id}
                                    className="p-4 sm:p-5 transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                                >
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 shrink-0 mt-0.5">
                                            <Brain size={18} />
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                                                    {plan.title}
                                                </h4>
                                                <span
                                                    className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider",
                                                        plan.status === "ACTIVE"
                                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                                                            : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400"
                                                    )}
                                                >
                                                    {plan.status}
                                                </span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 uppercase">
                                                    {plan.type}
                                                </span>
                                            </div>

                                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                                                {plan.summary}
                                            </p>

                                            <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
                                                <span>Issued {format(new Date(plan.createdAt), "MMM d, yyyy")}</span>
                                                <span>· {plan.items?.length || 0} Action Items</span>
                                                {plan.items?.filter((i) => i.status === "DONE").length > 0 && (
                                                    <span className="text-emerald-600 font-semibold">
                                                        · {plan.items.filter((i) => i.status === "DONE").length} completed
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedCoachPlan(plan)}
                                        className="rounded-xl shrink-0 self-end sm:self-center gap-1.5 text-xs font-semibold"
                                    >
                                        <Eye size={14} /> View Plan
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-sm text-gray-500">No coaching plans generated for this user.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Section 3: Missions & Edge XP (GAP-5) */}
            {activeSection === "missions" && (
                <div className="space-y-6">
                    {/* Missions Grid */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151925] overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Award size={16} className="text-amber-500" /> User Mission Progress ({filteredMissions.length})
                            </h3>
                            <span className="text-xs text-gray-500">Gamification Telemetry</span>
                        </div>

                        {filteredMissions.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4">
                                {filteredMissions.map((mission) => {
                                    const pct = Math.min(100, Math.round((mission.progress / (mission.target || 1)) * 100));
                                    const isDone = mission.progress >= mission.target;
                                    return (
                                        <div
                                            key={mission.id}
                                            className="rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 dark:border-white/10 dark:bg-[#1A1D27] text-xs flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className="font-bold text-gray-900 dark:text-white truncate">
                                                        {mission.missionId}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0",
                                                            mission.claimed
                                                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                                                                : isDone
                                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                                                : "bg-gray-100 text-gray-600 dark:bg-white/10"
                                                        )}
                                                    >
                                                        {mission.claimed ? "Claimed" : isDone ? "Completed" : "In Progress"}
                                                    </span>
                                                </div>

                                                <div className="mt-2.5">
                                                    <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                                                        <span>Progress</span>
                                                        <span className="font-bold text-gray-800 dark:text-gray-200">
                                                            {mission.progress} / {mission.target} ({pct}%)
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary transition-all rounded-full"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-3 pt-2 border-t border-gray-200 dark:border-white/10 text-[10px] text-gray-400 flex justify-between">
                                                <span>{mission.periodKey}</span>
                                                {mission.claimedAt && (
                                                    <span>Claimed {format(new Date(mission.claimedAt), "MMM d")}</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-sm text-gray-500">No mission progress recorded.</p>
                            </div>
                        )}
                    </div>

                    {/* Edge Event Telemetry Feed */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151925] overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Activity size={16} className="text-emerald-500" /> Recent Edge XP Event Feed ({edgeEvents.length})
                            </h3>
                            <span className="text-xs text-gray-500">Real-time Telemetry</span>
                        </div>

                        {edgeEvents.length > 0 ? (
                            <div className="divide-y divide-gray-200 dark:divide-white/10 max-h-96 overflow-y-auto">
                                {edgeEvents.slice(0, 20).map((evt) => (
                                    <div
                                        key={evt.id}
                                        className="p-3 sm:p-3.5 transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02] flex items-center justify-between gap-3 text-xs"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 shrink-0">
                                                <Zap size={14} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900 dark:text-white">
                                                        {evt.eventType}
                                                    </span>
                                                    {evt.sourceType && (
                                                        <span className="text-[10px] text-gray-500 bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded">
                                                            {evt.sourceType}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="font-bold text-amber-600 dark:text-amber-400">
                                                +{evt.xpAwarded} XP
                                            </span>
                                            <span className="text-[11px] text-gray-400">
                                                {format(new Date(evt.createdAt), "MMM d, HH:mm")}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-sm text-gray-500">No Edge XP events logged for this user.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Experiment Detail Modal */}
            {selectedExp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#151925]">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-white/10">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                                    {selectedExp.title}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    10-Trade Sprint · Status: {selectedExp.status}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedExp(null)}
                                className="rounded-xl p-2"
                                aria-label="Close modal"
                            >
                                <X size={18} />
                            </Button>
                        </div>

                        <div className="mt-4 space-y-4 text-xs">
                            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-white/10 dark:bg-white/[0.02]">
                                <span className="font-bold text-gray-400 uppercase tracking-wider block">Hypothesis</span>
                                <p className="mt-1 text-gray-800 dark:text-gray-200 leading-relaxed italic">
                                    "{selectedExp.hypothesis}"
                                </p>
                            </div>

                            <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4 dark:border-purple-900/30 dark:bg-purple-950/20">
                                <span className="font-bold text-purple-700 dark:text-purple-300 block">Instruction & Constraint</span>
                                <p className="mt-1 text-gray-800 dark:text-gray-200 leading-relaxed">
                                    {selectedExp.instruction}
                                </p>
                            </div>

                            {/* Baseline vs Follow-up Comparison */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Baseline State</span>
                                    <pre className="mt-1 text-[11px] text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans">
                                        {JSON.stringify(selectedExp.baseline, null, 2)}
                                    </pre>
                                </div>
                                <div className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Follow-Up Results</span>
                                    <pre className="mt-1 text-[11px] text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans">
                                        {selectedExp.followUp ? JSON.stringify(selectedExp.followUp, null, 2) : "In tracking (underway)"}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-white/10">
                            <Button variant="outline" onClick={() => setSelectedExp(null)} className="rounded-xl">
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Coach Plan Detail Modal */}
            {selectedCoachPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#151925]">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-white/10">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                                    {selectedCoachPlan.title}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Issued {format(new Date(selectedCoachPlan.createdAt), "PPP")}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedCoachPlan(null)}
                                className="rounded-xl p-2"
                                aria-label="Close modal"
                            >
                                <X size={18} />
                            </Button>
                        </div>

                        <div className="mt-4 space-y-4 text-xs">
                            <div>
                                <span className="font-bold text-gray-400 uppercase tracking-wider block">Performance Summary</span>
                                <p className="mt-1 text-gray-800 dark:text-gray-200 leading-relaxed bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-200 dark:border-white/10">
                                    {selectedCoachPlan.summary}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {selectedCoachPlan.keepDoing && (
                                    <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                                        <span className="block text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Keep Doing</span>
                                        <p className="mt-1 text-gray-800 dark:text-gray-200">{selectedCoachPlan.keepDoing}</p>
                                    </div>
                                )}
                                {selectedCoachPlan.fixNext && (
                                    <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 dark:border-rose-900/30 dark:bg-rose-950/20">
                                        <span className="block text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase">Fix Next</span>
                                        <p className="mt-1 text-gray-800 dark:text-gray-200">{selectedCoachPlan.fixNext}</p>
                                    </div>
                                )}
                            </div>

                            {/* Action Items List */}
                            <div>
                                <span className="font-bold text-gray-400 uppercase tracking-wider block mb-2">Prescribed Action Items</span>
                                <div className="space-y-2">
                                    {selectedCoachPlan.items?.map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] flex items-start gap-2.5"
                                        >
                                            <div className="mt-0.5 shrink-0">
                                                {item.status === "DONE" ? (
                                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                                ) : (
                                                    <Clock size={16} className="text-gray-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-gray-900 dark:text-white">
                                                    {item.label}
                                                </div>
                                                <p className="mt-0.5 text-gray-600 dark:text-gray-400">
                                                    {item.detail}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-white/10">
                            <Button variant="outline" onClick={() => setSelectedCoachPlan(null)} className="rounded-xl">
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
