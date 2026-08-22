"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import Markdown from "react-markdown";
import {
    ArrowRight,
    BookMarked,
    RotateCcw,
    Save,
    Sparkles,
    UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
    buildReportMarkdown,
    getArchetype,
    type DimensionScores,
} from "@/lib/trading-style/scoring";
import { ARCHETYPES, type ArchetypeId } from "@/config/trading-style-data";
import { saveTradingStyleResult } from "@/actions/trading-style";
import { DimensionBars } from "@/components/trading-style/DimensionBars";
import { ArchetypeCard } from "@/components/trading-style/ArchetypeCard";

interface QuizResultProps {
    answers: Record<string, string>;
    archetypeId: ArchetypeId;
    dimensions: DimensionScores;
    isLoggedIn: boolean;
    onRetake: () => void;
}

export function QuizResult({
    answers,
    archetypeId,
    dimensions,
    isLoggedIn,
    onRetake,
}: QuizResultProps) {
    const archetype = ARCHETYPES[archetypeId];
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const report = buildReportMarkdown(getArchetype(archetypeId), dimensions);

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
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25">
                    <Sparkles size={26} />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                    Your trading style is
                </h2>
                <p className="mt-1 text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 dark:from-amber-400 dark:via-orange-400 dark:to-amber-300">
                    {archetype.name}
                </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 dark:border-white/[0.08] dark:bg-white/[0.04]">
                <h3 className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                    Your profile across 6 core dimensions
                </h3>
                <DimensionBars scores={dimensions} />
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 dark:border-white/[0.08] dark:bg-white/[0.04]">
                <ArchetypeCard archetype={archetype} />
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 dark:border-white/[0.08] dark:bg-white/[0.04]">
                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                    <BookMarked size={14} /> Your full report
                </h3>
                <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:dark:text-white prose-li:my-0.5 prose-p:text-gray-600 prose-p:dark:text-gray-300">
                    <Markdown>{report}</Markdown>
                </div>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.07] to-orange-500/[0.05] p-5 text-center dark:border-amber-500/20">
                {isLoggedIn ? (
                    saved ? (
                        <div className="flex flex-col items-center gap-2">
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                Saved to your profile ✓
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
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Keep your result and revisit your next moves
                                anytime.
                            </p>
                            <Button
                                onClick={handleSave}
                                isLoading={saving}
                                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-black text-white shadow-md shadow-amber-500/20"
                            >
                                <Save size={15} /> Save to my profile
                            </Button>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Create a free account to save your result and build
                            your personalised trading path.
                        </p>
                        <Link
                            href="/auth/signup"
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-black text-white shadow-md shadow-amber-500/20 transition hover:from-amber-600 hover:to-orange-600",
                            )}
                        >
                            <UserPlus size={15} /> Create free account
                        </Link>
                    </div>
                )}
            </div>

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
