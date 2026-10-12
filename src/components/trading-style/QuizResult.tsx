"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Markdown from "react-markdown";
import {
    ArrowRight,
    Award,
    BookMarked,
    CheckCircle2,
    LogIn,
    RotateCcw,
    Save,
    Sparkles,
    UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    buildReportMarkdown,
    getArchetype,
    type DimensionScores,
} from "@/lib/trading-style/scoring";
import { ARCHETYPES, type ArchetypeId } from "@/config/trading-style-data";
import { saveTradingStyleResult } from "@/actions/trading-style";
import { DimensionBars } from "@/components/trading-style/DimensionBars";
import { ArchetypeCard } from "@/components/trading-style/ArchetypeCard";
import { PrescriptionCard } from "@/components/trading-style/PrescriptionCard";

interface QuizResultProps {
    answers: Record<string, string>;
    archetypeId: ArchetypeId;
    dimensions: DimensionScores;
    isLoggedIn: boolean;
    onRetake: () => void;
    onSaveSuccess?: (data: {
        archetype: string;
        archetypeTitle: string;
        dimensions: Record<string, number>;
        answers: Record<string, string>;
        completedAt: string;
    }) => void;
}

export function QuizResult({
    answers,
    archetypeId,
    dimensions,
    isLoggedIn,
    onRetake,
    onSaveSuccess,
}: QuizResultProps) {
    const router = useRouter();
    const archetype = ARCHETYPES[archetypeId];
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const report = buildReportMarkdown(getArchetype(archetypeId), dimensions);

    // Automatically store pending trading style for guests to preserve their diagnosis
    useEffect(() => {
        if (!isLoggedIn) {
            try {
                localStorage.setItem(
                    "tnt_pending_trading_style",
                    JSON.stringify({
                        answers,
                        archetypeId,
                        dimensions,
                        completedAt: new Date().toISOString(),
                    })
                );
            } catch {
                /* ignore quota or private browsing errors */
            }
        }
    }, [isLoggedIn, answers, archetypeId, dimensions]);

    const handleSave = async () => {
        if (saving || saved) return;
        setSaving(true);
        const res = await saveTradingStyleResult({ answers });
        setSaving(false);
        if ("error" in res) {
            toast.error(res.error);
            return;
        }
        setSaved(true);
        toast.success("Trading style saved to your profile");
        onSaveSuccess?.({
            archetype: archetypeId,
            archetypeTitle: archetype.name,
            dimensions,
            answers,
            completedAt: new Date().toISOString(),
        });
    };

    const handleSignupWithPrescription = () => {
        try {
            localStorage.setItem(
                "tnt_pending_trading_style",
                JSON.stringify({
                    answers,
                    archetypeId,
                    dimensions,
                    completedAt: new Date().toISOString(),
                })
            );
            localStorage.setItem("tnt_signup_intent", "trading_style");
        } catch {
            /* ignore */
        }
        router.push("/auth/signup?intent=trading_style");
    };

    return (
        <div className="space-y-6">
            {/* Top Archetype Announcement */}
            <div className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-gold text-white shadow-lg shadow-gold/25">
                    <Award size={28} strokeWidth={2.2} />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                    Your trading style is
                </h2>
                <p className="mt-1 text-3xl font-black text-gold">
                    {archetype.name}
                </p>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    {archetype.summary}
                </p>
            </div>

            {/* 6 Core Dimensions Spider / Bar Breakdown */}
            <div className="rounded-lg border border-gray-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-[#151925]/80">
                <h3 className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                    Your profile across 6 core dimensions
                </h3>
                <DimensionBars scores={dimensions} />
            </div>

            {/* Prescribed Tailored Solutions (Diagnostic Selling Box) */}
            <PrescriptionCard archetype={archetype} />

            {/* Archetype Detailed Analysis Card (Strengths, Weaknesses, Mistakes, Focus) */}
            <div className="rounded-lg border border-gray-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-[#151925]/80">
                <ArchetypeCard archetype={archetype} />
            </div>

            {/* Full Report Markdown */}
            <div className="rounded-lg border border-gray-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-[#151925]/80">
                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                    <BookMarked size={14} /> Your full report
                </h3>
                <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:dark:text-white prose-li:my-0.5 prose-p:text-gray-600 prose-p:dark:text-gray-300">
                    <Markdown>{report}</Markdown>
                </div>
            </div>

            {/* Conversion CTA Box (Prescription Model Activation) */}
            <div className="rounded-lg border border-amber-500/30 bg-gradient-to-b from-amber-500/[0.06] via-amber-500/[0.02] to-transparent p-6 text-center shadow-sm dark:border-amber-500/25">
                {isLoggedIn ? (
                    saved ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                                <CheckCircle2 size={18} />
                                <span>Saved to your profile and active in Settings</span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 max-w-md">
                                Your trading archetype is now synced. You can access your prescribed tools, MT5 setup, and academy modules directly from your dashboard.
                            </p>
                            <Link
                                href="/dashboard/settings/trading-style"
                                className="inline-flex items-center gap-1.5 text-sm font-black text-amber-600 hover:underline dark:text-gold"
                            >
                                View in Settings <ArrowRight size={15} />
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-800 dark:text-gold">
                                <Sparkles size={13} />
                                1-Click Profile Save
                            </div>
                            <h4 className="text-lg font-black text-gray-950 dark:text-white">
                                Save Your Diagnosis to Your Profile
                            </h4>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 max-w-md">
                                Save your archetype to calibrate trade management parameters and benchmark execution habits anytime.
                            </p>
                            <Button
                                onClick={handleSave}
                                isLoading={saving}
                                className="h-11 px-6 rounded-lg bg-gold hover:bg-amber-600 font-black text-white shadow-md shadow-gold/20"
                            >
                                <Save size={15} /> Save to my profile
                            </Button>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-800 dark:text-gold">
                            <Sparkles size={13} />
                            Tailored Solution Access
                        </div>
                        <h4 className="text-xl font-black text-gray-950 dark:text-white">
                            Apply Your Prescribed Solutions & Save Style
                        </h4>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 max-w-lg">
                            Create a free account to instantly bind this diagnosis to your profile, unlock your prescribed MT5 tools & lessons, and track your execution discipline.
                        </p>
                        <div className="mt-2 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
                            <Button
                                onClick={handleSignupWithPrescription}
                                className="h-12 px-7 rounded-lg bg-gold hover:bg-amber-600 font-black text-white shadow-lg shadow-gold/25 transition-all text-sm sm:text-base animate-btn-shine"
                            >
                                <UserPlus size={16} /> Claim My Prescription & Save Style
                            </Button>
                        </div>
                        <div className="mt-2">
                            <Link
                                href="/auth/login?intent=trading_style"
                                className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-gold transition-colors"
                            >
                                <LogIn size={13} /> Already have an account? Log in to sync
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Retake Action */}
            <div className="text-center">
                <button
                    onClick={onRetake}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                >
                    <RotateCcw size={13} /> Retake the test
                </button>
            </div>
        </div>
    );
}
