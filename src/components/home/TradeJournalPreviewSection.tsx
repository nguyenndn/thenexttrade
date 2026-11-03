"use client";

import { useState, useEffect } from "react";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";
import { useInViewPause } from "@/hooks/useInViewPause";
import { WORKFLOW_STEPS } from "./journal-preview/journal-preview-steps";
import { WorkflowStepList } from "./journal-preview/WorkflowStepList";
import { WorkflowConsolePreview } from "./journal-preview/WorkflowConsolePreview";

interface TradeJournalPreviewSectionProps {
    isLoggedIn: boolean;
}

export function TradeJournalPreviewSection({
    isLoggedIn,
}: TradeJournalPreviewSectionProps) {
    const [activeStep, setActiveStep] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const { containerRef, isInView } = useInViewPause();

    // Auto-advance step every 5 seconds if visible and not hovering
    useEffect(() => {
        if (isPaused || !isInView) return;

        const timer = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % WORKFLOW_STEPS.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [isPaused, isInView]);

    return (
        <div
            ref={containerRef}
            id="how-it-works"
            className="relative overflow-hidden bg-slate-50/50 dark:bg-transparent border-t border-gray-200 dark:border-white/10 scroll-mt-20"
        >
            <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--gold))_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2]" />

            <section className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <HomeSectionHeading
                    align="center"
                    title="From raw MT5 execution to funded consistency"
                    highlight="funded consistency"
                    description="Zero manual journaling. Connect your MT5 account and let the algorithm isolate your costliest trading leaks."
                    className="mb-8 sm:mb-10"
                />

                <div
                    className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center lg:items-stretch"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <WorkflowStepList
                        steps={WORKFLOW_STEPS}
                        activeStep={activeStep}
                        onSelectStep={setActiveStep}
                        isLoggedIn={isLoggedIn}
                    />

                    <WorkflowConsolePreview
                        steps={WORKFLOW_STEPS}
                        activeStep={activeStep}
                        onSelectStep={setActiveStep}
                    />
                </div>
            </section>
        </div>
    );
}
