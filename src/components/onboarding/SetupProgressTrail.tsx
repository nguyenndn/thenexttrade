"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { trackEvent } from "@/lib/track";
import type { FirstSessionStep } from "@/lib/onboarding/first-session.server";

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

const STEPS: { key: FirstSessionStep; label: string; shortLabel: string }[] = [
    { key: "CONNECT_ACCOUNT", label: "Account", shortLabel: "Account" },
    { key: "CHOOSE_SYNC_METHOD", label: "Sync Method", shortLabel: "Sync" },
    { key: "BRING_FIRST_DATA", label: "First Data", shortLabel: "Data" },
    { key: "REVIEW_DASHBOARD", label: "Dashboard Live", shortLabel: "Live" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SetupProgressTrailProps {
    currentStep: FirstSessionStep;
    compact?: boolean;
    source?: "wizard" | "launcher";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SetupProgressTrail({
    currentStep,
    compact = false,
    source = "wizard",
}: SetupProgressTrailProps) {
    const hasTrackedRef = useRef(false);

    useEffect(() => {
        if (!hasTrackedRef.current) {
            hasTrackedRef.current = true;
            trackEvent("first_session_progress_trail_viewed", {
                step: currentStep,
                source,
            });
        }
    }, [currentStep, source]);

    const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

    if (compact) {
        return (
            <div className="flex items-center gap-1.5">
                {STEPS.map((step, idx) => {
                    const isCompleted = idx < currentIndex;
                    const isActive = idx === currentIndex;
                    return (
                        <div
                            key={step.key}
                            className="flex items-center gap-1.5"
                        >
                            {idx > 0 && (
                                <div
                                    className={`w-2.5 h-px ${
                                        isCompleted
                                            ? "bg-emerald-500"
                                            : "bg-gray-200 dark:bg-white/10"
                                    }`}
                                />
                            )}
                            <div
                                className={`flex items-center gap-1 ${
                                    isActive
                                        ? "text-primary"
                                        : isCompleted
                                          ? "text-emerald-500"
                                          : "text-gray-400 dark:text-gray-600"
                                }`}
                            >
                                {isCompleted ? (
                                    <CheckCircle2
                                        size={10}
                                        className="shrink-0"
                                    />
                                ) : (
                                    <Circle
                                        size={10}
                                        className={`shrink-0 ${isActive ? "fill-primary/20" : ""}`}
                                    />
                                )}
                                <span
                                    className={`text-[9px] font-bold uppercase tracking-wider whitespace-nowrap ${
                                        isActive ? "text-primary" : ""
                                    }`}
                                >
                                    {step.shortLabel}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // Full version — used in FirstSessionWizard
    return (
        <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">
                You are here
            </p>
            <div className="flex items-center gap-1">
                {STEPS.map((step, idx) => {
                    const isActive = idx === currentIndex;
                    const isCompleted = idx < currentIndex;
                    return (
                        <div
                            key={step.key}
                            className="flex items-center gap-1 flex-1"
                        >
                            <div className="flex flex-col items-center gap-1 flex-1">
                                <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black transition-all duration-300 ${
                                        isCompleted
                                            ? "bg-emerald-500 text-white"
                                            : isActive
                                              ? "bg-primary text-white shadow-lg shadow-primary/30"
                                              : "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600"
                                    }`}
                                >
                                    {isCompleted ? (
                                        <CheckCircle2 size={14} />
                                    ) : (
                                        idx + 1
                                    )}
                                </div>
                                <span
                                    className={`text-[8px] font-bold uppercase tracking-wider whitespace-nowrap ${
                                        isActive
                                            ? "text-primary"
                                            : isCompleted
                                              ? "text-emerald-500"
                                              : "text-gray-400 dark:text-gray-600"
                                    }`}
                                >
                                    {step.label}
                                </span>
                            </div>
                            {idx < STEPS.length - 1 && (
                                <div
                                    className={`flex-1 h-0.5 rounded-full mb-5 min-w-3 ${
                                        idx < currentIndex
                                            ? "bg-emerald-500"
                                            : "bg-gray-200 dark:bg-white/5"
                                    }`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
