"use client";

import { useEffect, useState } from "react";
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

    // Clean up any legacy localStorage draft on mount
    useEffect(() => {
        try {
            localStorage.removeItem("trading-style-draft");
        } catch {
            /* ignore */
        }
    }, []);

    const handleStart = () => {
        setStarted(true);
        setIndex(0);
    };

    const handleSelect = (optionId: string) => {
        const nextAnswers = { ...answers, [QUESTIONS[index].id]: optionId };
        setAnswers(nextAnswers);

        if (index < QUESTIONS.length - 1) {
            setIndex(index + 1);
        }
    };

    const handleBack = () => {
        if (index > 0) {
            setIndex(index - 1);
        }
    };

    const handleFinish = () => {
        const nextAnswers = { ...answers, [QUESTIONS[index].id]: currentSelected };
        setAnswers(nextAnswers);
        const archetypeId = computeArchetype(nextAnswers);
        const dimensions = computeDimensionScores(nextAnswers);
        setResult({ archetypeId, dimensions });
        setFinished(true);
    };

    const handleRetake = () => {
        setStarted(false);
        setIndex(0);
        setAnswers({});
        setFinished(false);
        setResult(null);
    };

    // ───────────────────────── Start screen (Gold theme layout) ─────────────────────────
    if (!started) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mx-auto max-w-3xl text-center pt-0 pb-8 sm:pb-12"
            >
                {/* Headline with Gold gradient accent on Fix Your Leaks (2 clean lines) */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-black tracking-tight text-gray-950 dark:text-white leading-[1.08]">
                    Know Your Style.
                    <span className="block text-gold mt-1">
                        Fix Your Leaks.
                    </span>
                </h1>

                <p className="mx-auto mt-6 max-w-xl text-sm sm:text-base md:text-lg leading-relaxed text-gray-600 dark:text-gray-300 font-normal">
                    Most traders lose money to their own habits, not to the market. Answer honestly to see yours.
                </p>

                {/* 3 Stats Row in clean columns */}
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

                {/* Primary Hero CTA Button (Tier 1 Hero Sizing: 48px height, Lucide Arrow, shine effect) */}
                <div className="mt-8 sm:mt-10 flex justify-center">
                    <Button
                        variant="gold"
                        onClick={handleStart}
                        className="group h-11 sm:h-12 px-6 sm:px-8 rounded-lg text-sm sm:text-base font-extrabold shadow-[0_8px_20px_rgba(245,158,11,0.25)] hover:shadow-[0_12px_28px_rgba(245,158,11,0.35)] transition-all duration-300 inline-flex items-center justify-center gap-2.5 animate-btn-shine"
                    >
                        <span>Start the Assessment</span>
                        <ArrowRight
                            size={16}
                            className="group-hover:translate-x-1 transition-transform duration-300 shrink-0"
                        />
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
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/[0.06]">
                    <div
                        className="h-full rounded-full bg-gold transition-all duration-500"
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
                    className="rounded-lg border border-gray-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm sm:p-6 dark:border-white/10 dark:bg-[#151925]/85"
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
                                        "group flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-all",
                                        isSelected
                                            ? "border-amber-500/60 bg-amber-500/[0.08] shadow-sm"
                                            : "border-gray-200 bg-white/60 hover:border-amber-500/40 hover:bg-amber-500/[0.03] dark:border-white/10 dark:bg-white/[0.02] backdrop-blur-sm",
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
                                                : "border-gray-300 group-hover:border-amber-400 dark:border-white/20",
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
                    className="rounded-lg"
                >
                    <ArrowLeft size={15} /> Back
                </Button>

                {index === QUESTIONS.length - 1 ? (
                    <Button
                        onClick={handleFinish}
                        disabled={!currentSelected}
                        className="rounded-lg bg-gold hover:bg-amber-600 font-black text-white shadow-md shadow-gold/20"
                    >
                        See my results <ArrowRight size={15} />
                    </Button>
                ) : (
                    <Button
                        variant="ghost"
                        onClick={() => currentSelected && handleSelect(currentSelected)}
                        disabled={!currentSelected}
                        className="rounded-lg"
                    >
                        Next <ArrowRight size={15} />
                    </Button>
                )}
            </div>
        </div>
    );
}
