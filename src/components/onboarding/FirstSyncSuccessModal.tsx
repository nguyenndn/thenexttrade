"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowRight,
    FileText,
    Sun,
    X,
    CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/track";
import { SPRING_SOFT, backdropVariants, panelVariants } from "@/lib/animations";

interface FirstSyncSuccessModalProps {
    open: boolean;
    onClose: () => void;
    hasReports: boolean;
    firstInsight?: {
        shouldShow: boolean;
        facts: string[];
        primaryCta: string;
        secondaryCta: string;
    };
}

export function FirstSyncSuccessModal({
    open,
    onClose,
    hasReports,
    firstInsight,
}: FirstSyncSuccessModalProps) {
    const hasTracked = useRef(false);

    useEffect(() => {
        if (open && !hasTracked.current) {
            trackEvent("first_insight_viewed");
            hasTracked.current = true;
        }
    }, [open]);

    // Body scroll lock: lock while open, release on exit complete, safety net on unmount.
    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
    }, [open]);

    useEffect(() => {
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    const releaseLock = () => {
        document.body.style.overflow = "unset";
    };

    const handlePrimary = () => {
        trackEvent("first_insight_cta_clicked", {
            action: "primary",
            target: firstInsight?.primaryCta || "/dashboard/analytics",
        });
        onClose();
        window.location.href =
            firstInsight?.primaryCta || "/dashboard/analytics";
    };

    const handleSecondary = () => {
        trackEvent("first_insight_cta_clicked", {
            action: "secondary",
            target: firstInsight?.secondaryCta || "/dashboard/reports",
        });
        onClose();
        window.location.href =
            firstInsight?.secondaryCta || "/dashboard/reports";
    };

    const handleDismiss = () => {
        trackEvent("first_insight_cta_clicked", { action: "dismiss" });
        onClose();
    };

    const facts = firstInsight?.facts || [
        "You successfully synced your first trade data.",
        "Performance charts are now active.",
        "Your initial trade metrics are ready to explore.",
    ];

    return (
        <AnimatePresence onExitComplete={releaseLock}>
            {open && (
            <motion.div
                variants={backdropVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: "tween", duration: 0.2 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            >
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={handleDismiss}
                />
                <motion.div
                    variants={panelVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={SPRING_SOFT}
                    className="relative z-10 bg-white dark:bg-[#1E2028] rounded-2xl w-full max-w-md overflow-hidden border border-dashboard shadow-2xl"
                >
                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 z-20 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-white/10 transition-colors"
                    aria-label="Close modal"
                >
                    <X size={18} />
                </button>

                {/* Celebratory header */}
                <div className="relative px-6 pt-8 pb-4 text-center overflow-hidden">
                    {/* Background glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/10 to-transparent dark:from-primary/10 dark:via-primary/5 pointer-events-none" />
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-40 h-40 bg-primary/20 rounded-full blur-[60px] pointer-events-none" />

                    <div className="relative z-10">
                        {/* Success icon */}
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center shadow-lg shadow-primary/30 mb-4">
                            <CheckCircle2 size={28} className="text-white" />
                        </div>

                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                            Your First Insight is Ready
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
                            Your first trade data is synced. Here is what we
                            found:
                        </p>
                    </div>
                </div>

                {/* Dynamic Facts List */}
                <div className="px-6 py-4 space-y-3">
                    {facts.map((fact, idx) => (
                        <div
                            key={idx}
                            className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashboard dark:border-slate-800"
                        >
                            <CheckCircle2
                                size={18}
                                className="text-primary shrink-0 mt-0.5"
                            />
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 leading-relaxed">
                                {fact}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 pt-2 space-y-2">
                    <Button
                        variant="primary"
                        onClick={handlePrimary}
                        className="w-full h-12 font-bold shadow-lg shadow-primary/20 gap-2 text-sm"
                    >
                        View My First Insight
                        <ArrowRight size={16} />
                    </Button>

                    <Button
                        variant="outline"
                        onClick={handleSecondary}
                        className="w-full h-10 gap-2 text-sm"
                    >
                        <FileText size={14} />
                        Generate First Review
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={handleDismiss}
                        className="w-full h-10 gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <Sun size={14} />
                        Continue to Dashboard
                    </Button>
                </div>
                </motion.div>
            </motion.div>
            )}
        </AnimatePresence>
    );
}
