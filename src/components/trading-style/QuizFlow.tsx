"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { QUESTIONS } from "@/config/trading-style-data";
import {
    computeArchetype,
    computeDimensionScores,
    type DimensionScores,
} from "@/lib/trading-style/scoring";
import type { ArchetypeId } from "@/config/trading-style-data";
import { QuizResult } from "@/components/trading-style/QuizResult";

const DRAFT_KEY = "trading-style-draft";

interface QuizFlowProps {
    isLoggedIn: boolean;
    onSaveSuccess?: (data: {
        archetype: string;
        archetypeTitle: string;
        dimensions: Record<string, number>;
        answers: Record<string, string>;
        completedAt: string;
    }) => void;
}

export function QuizFlow({ isLoggedIn, onSaveSuccess }: QuizFlowProps) {
    const [started, setStarted] = useState(false);
    const [index, setIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [finished, setFinished] = useState(false);
    const [result, setResult] = useState<{
        archetypeId: ArchetypeId;
        dimensions: DimensionScores;
    } | null>(null);

    // We intentionally start on the welcome screen on every fresh visit.
    // Draft answers are kept in state only when actively continuing the quiz.

    const persist = useCallback(
        (next: { started: boolean; index: number; answers: Record<string, string> }) => {
            try {
                localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
            } catch {
                /* storage unavailable */
            }
        },
        [],
    );

    const handleStart = () => {
        setStarted(true);
        persist({ started: true, index: 0, answers });
    };

    const handleSelect = (optionId: string) => {
        const nextAnswers = { ...answers, [QUESTIONS[index].id]: optionId };
        setAnswers(nextAnswers);
        persist({ started: true, index, answers: nextAnswers });

        if (index < QUESTIONS.length - 1) {
            setIndex(index + 1);
            persist({ started: true, index: index + 1, answers: nextAnswers });
        }
    };

    const handleBack = () => {
        if (index > 0) {
            setIndex(index - 1);
            persist({ started: true, index: index - 1, answers });
        }
    };

    const handleFinish = () => {
        const nextAnswers = { ...answers, [QUESTIONS[index].id]: currentSelected };
        setAnswers(nextAnswers);
        const archetypeId = computeArchetype(nextAnswers);
        const dimensions = computeDimensionScores(nextAnswers);
        setResult({ archetypeId, dimensions });
        setFinished(true);
        try {
            localStorage.removeItem(DRAFT_KEY);
        } catch {
            /* ignore */
        }
    };

    const handleRetake = () => {
        setStarted(false);
        setIndex(0);
        setAnswers({});
        setFinished(false);
        setResult(null);
        try {
            localStorage.removeItem(DRAFT_KEY);
        } catch {
            /* ignore */
        }
    };

    // ───────────────────────── Start screen (Hình 1 layout with Gold theme) ─────────────────────────
    if (!started) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mx-auto max-w-3xl text-center py-6 sm:py-10"
            >
                {/* Meta tagline with Gold color */}
                <p className="text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-amber-600 dark:text-gold mb-5">
                    TRADER PROFILING · 14 QUESTIONS · ~3 MIN
                </p>

                {/* Headline with Gold gradient accent on Fix Your Leaks (2 clean lines) */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-black tracking-tight text-gray-950 dark:text-white leading-[1.08]">
                    Know Your Style.
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 dark:from-amber-400 dark:via-yellow-300 dark:to-amber-500 mt-1">
                        Fix Your Leaks.
                    </span>
                </h1>

                {/* Original description */}
                <p className="mx-auto mt-6 max-w-xl text-sm sm:text-base md:text-lg leading-relaxed text-gray-600 dark:text-gray-300 font-normal">
                    Most traders don&apos;t lose because they don&apos;t know
                    the market — they lose because they don&apos;t know
                    themselves. Answer honestly, and get a personalised path
                    built from your answers.
                </p>

                {/* 3 Stats Row in Hình 1 clean columns */}
                <div className="mt-9 flex items-center justify-center gap-10 sm:gap-16 text-center">
                    <div>
                        <div className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white">
                            14
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-gray-500 mt-0.5">
                            questions
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white">
                            ~3
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-gray-500 mt-0.5">
                            minutes
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white">
                            8
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-gray-500 mt-0.5">
                            archetypes
                        </div>
                    </div>
                </div>

                {/* Primary CTA Button with standard button size */}
                <div className="mt-8">
                    <Button
                        size="md"
                        onClick={handleStart}
                        className="rounded-xl bg-gold hover:bg-amber-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-gold/20 transition-all border-none"
                    >
                        Start the assessment →
                    </Button>
                </div>
            </motion.div>
        );
    }

    // ───────────────────────── Result screen ─────────────────────────
    if (finished && result) {
        return (
            <QuizResult
                answers={answers}
                archetypeId={result.archetypeId}
                dimensions={result.dimensions}
                isLoggedIn={isLoggedIn}
                onRetake={handleRetake}
                onSaveSuccess={onSaveSuccess}
            />
        );
    }

    const question = QUESTIONS[index];
    const progress = Math.round((index / QUESTIONS.length) * 100);
    const currentSelected = answers[question.id] ?? null;

    // ───────────────────────── Question screen ─────────────────────────
    return (
        <div className="mx-auto max-w-2xl">
            <div className="mb-4">
                <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
                    <span>
                        Question {index + 1} of {QUESTIONS.length}
                    </span>
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 font-black uppercase tracking-wider text-amber-700 dark:text-gold">
                        {question.theme}
                    </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/[0.06]">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={question.id}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md sm:p-6 dark:border-white/[0.08] dark:bg-[#131622]/85"
                >
                    <h3 className="text-lg font-black leading-snug text-gray-900 dark:text-white">
                        {question.text}
                    </h3>

                    <div className="mt-5 space-y-2.5">
                        {question.options.map((option) => {
                            const isSelected = currentSelected === option.id;
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => handleSelect(option.id)}
                                    className={cn(
                                        "group flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                                        isSelected
                                            ? "border-amber-500/60 bg-amber-500/[0.08] shadow-sm"
                                            : "border-slate-200/80 bg-white hover:border-amber-500/40 hover:bg-amber-500/[0.03] dark:border-white/[0.08] dark:bg-white/[0.03]",
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "text-sm font-medium text-gray-700 dark:text-gray-300",
                                            isSelected &&
                                                "font-bold text-gray-900 dark:text-white",
                                        )}
                                    >
                                        {option.text}
                                    </span>
                                    <span
                                        className={cn(
                                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                                            isSelected
                                                ? "border-amber-500 bg-amber-500 text-white"
                                                : "border-slate-300 group-hover:border-amber-400 dark:border-white/20",
                                        )}
                                    >
                                        {isSelected && (
                                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                        )}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            </AnimatePresence>

            <div className="mt-4 flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={index === 0}
                    className="rounded-xl"
                >
                    <ArrowLeft size={15} /> Back
                </Button>

                {index === QUESTIONS.length - 1 ? (
                    <Button
                        onClick={handleFinish}
                        disabled={!currentSelected}
                        className="rounded-xl bg-gold hover:bg-amber-600 font-black text-white shadow-md shadow-gold/20"
                    >
                        See my results <ArrowRight size={15} />
                    </Button>
                ) : (
                    <Button
                        variant="ghost"
                        onClick={() => currentSelected && handleSelect(currentSelected)}
                        disabled={!currentSelected}
                        className="rounded-xl"
                    >
                        Next <ArrowRight size={15} />
                    </Button>
                )}
            </div>
        </div>
    );
}
