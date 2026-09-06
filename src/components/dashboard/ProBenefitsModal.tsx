"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SPRING_SOFT, backdropVariants } from "@/lib/animations";
import {
    X,
    Crown,
    BarChart2,
    Brain,
    Headphones,
    Zap,
    Shield,
    BookOpen,
    TrendingUp,
    CheckCircle2,
    ArrowRight,
    Send,
} from "lucide-react";
import Link from "next/link";

interface Benefit {
    icon: React.ElementType;
    title: string;
    description: string;
    highlight?: boolean;
}

const BENEFITS: { category: string; items: Benefit[] }[] = [
    {
        category: "Analytics & Intelligence",
        items: [
            {
                icon: BarChart2,
                title: "Advanced Analytics Dashboard",
                description:
                    "Detailed execution metrics: win rate by session, symbol, strategy, drawdown curves, and risk-adjusted returns.",
                highlight: true,
            },
            {
                icon: Brain,
                title: "Trade Telemetry & Tilt Radar",
                description:
                    "Automated telemetry surfaced daily: detect sizing leaks, revenge trade impulses, and execution blindspots.",
                highlight: true,
            },
            {
                icon: TrendingUp,
                title: "Performance Benchmarking",
                description:
                    "Compare your execution metrics against top traders in the community to calibrate your risk.",
            },
        ],
    },
    {
        category: "Tools & Features",
        items: [
            {
                icon: Zap,
                title: "EA Toolkit (Advanced Config)",
                description:
                    "Full parameter access for GoldScalperNinja and partner EAs: risk thresholds, session filters, and execution modes.",
            },
            {
                icon: BookOpen,
                title: "Full Academy Access",
                description:
                    "Complete access to Level 2 & Level 3 Masterclasses: advanced risk management, order flow models, and live execution breakdowns.",
            },
            {
                icon: Shield,
                title: "Pro Trading Journal",
                description:
                    "Unlimited journal entries with automated post-trade reviews, emotional tagging, and bias radar scoring.",
            },
        ],
    },
    {
        category: "Support & Community",
        items: [
            {
                icon: Headphones,
                title: "Priority Support",
                description:
                    "Direct technical escalation: < 4h response time for EA configuration, sync health, and account diagnostics.",
            },
            {
                icon: Crown,
                title: "Private Trader Desk",
                description:
                    "Direct channel with active EA operators, live execution reviews, and institutional market commentary.",
            },
        ],
    },
];

interface ProBenefitsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isPro?: boolean;
    vipLink?: string | null;
}

export function ProBenefitsModal({
    isOpen,
    onClose,
    isPro = false,
    vipLink,
}: ProBenefitsModalProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // Body scroll lock: lock while open, release on exit complete, safety net on unmount.
    useEffect(() => {
        if (isOpen) document.body.style.overflow = "hidden";
    }, [isOpen]);

    useEffect(() => {
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    const releaseLock = () => {
        document.body.style.overflow = "unset";
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence onExitComplete={releaseLock}>
            {isOpen && (
                /* Backdrop */
                <motion.div
                    variants={backdropVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ type: "tween", duration: 0.2 }}
                    className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
                    onClick={onClose}
                >
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: 32 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 32 }}
                        transition={SPRING_SOFT}
                        className="relative z-10 w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#1E2028] shadow-2xl border border-dashboard dark:border-white/[0.08] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-white dark:bg-[#1E2028] border-b border-dashboard dark:border-white/[0.08] px-5 pt-5 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20">
                                    <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                                        {isPro
                                            ? "Partner Pro Benefits"
                                            : "Partner Pro Privileges"}
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {isPro
                                            ? "All institutional features included in your active plan"
                                            : "Complimentary with an eligible partner broker account"}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                aria-label="Close modal"
                                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                            {BENEFITS.map((section) => (
                                <div key={section.category}>
                                    <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                        {section.category}
                                    </p>
                                    <div className="space-y-2">
                                        {section.items.map((item) => (
                                            <div
                                                key={item.title}
                                                className={`flex gap-3 rounded-xl p-3 transition-colors ${
                                                    item.highlight
                                                        ? "bg-amber-50/40 dark:bg-amber-500/[0.04] border border-amber-500/25 dark:border-amber-500/20"
                                                        : "bg-gray-50/70 dark:bg-white/[0.02] border border-dashboard dark:border-white/[0.06]"
                                                }`}
                                            >
                                                <div
                                                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                                                        item.highlight
                                                            ? "bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                                            : "bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400"
                                                    }`}
                                                >
                                                    <item.icon className="h-3.5 w-3.5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="text-[13px] font-semibold text-gray-900 dark:text-white leading-tight">
                                                            {item.title}
                                                        </p>
                                                        {item.highlight && (
                                                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-amber-500 dark:text-amber-400" />
                                                        )}
                                                    </div>
                                                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                                        {item.description}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer CTA - Join Pro Telegram for entitled members */}
                        {isPro && vipLink && (
                            <div className="sticky bottom-0 border-t border-dashboard dark:border-white/[0.08] bg-white dark:bg-[#1E2028] px-5 py-4">
                                <a
                                    href={vipLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2AABEE] px-4 py-2.5 text-[13px] font-bold text-white shadow-sm shadow-[#2AABEE]/20 transition-all hover:bg-[#2298d4] hover:shadow-md hover:shadow-[#2AABEE]/25 active:scale-[0.98]"
                                >
                                    <Send className="h-3.5 w-3.5" />
                                    Join Pro Telegram
                                </a>
                                <p className="mt-2 text-center text-[11px] text-gray-400 dark:text-gray-500">
                                    Live trade telemetry, market calls & direct technical assistance
                                </p>
                            </div>
                        )}

                        {/* Footer CTA - only for Free Plan */}
                        {!isPro && (
                            <div className="sticky bottom-0 border-t border-dashboard dark:border-white/[0.08] bg-white dark:bg-[#1E2028] px-5 py-4">
                                <Link
                                    href="/dashboard/accounts?action=add&intent=unlock-pro"
                                    onClick={onClose}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-4 py-2.5 text-[13px] font-bold text-white shadow-sm shadow-amber-500/20 transition-all active:scale-[0.98]"
                                >
                                    Apply for Partner Pro
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                                <p className="mt-2 text-center text-[11px] text-gray-400 dark:text-gray-500">
                                    No payment required - complimentary for verified partner accounts
                                </p>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
