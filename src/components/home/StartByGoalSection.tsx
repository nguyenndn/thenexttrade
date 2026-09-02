"use client";

import Link from "next/link";
import {
    BookOpen,
    LineChart,
    Calculator,
    Building,
    ArrowRight,
    Compass,
} from "lucide-react";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";

interface StartByGoalSectionProps {
    isLoggedIn: boolean;
}

export function StartByGoalSection({ isLoggedIn }: StartByGoalSectionProps) {
    const cards = [
        {
            title: "Learn Trading",
            description: "Structured lessons and practical guides.",
            href: "/academy",
            icon: <BookOpen size={20} />,
            color: "text-primary",
            chipBg: "bg-primary/10",
            ctaText: "Start Learning",
            animClass: "group-hover:scale-110 group-hover:-rotate-6",
            bgClass:
                "bg-white dark:bg-white/[0.02] border-dashboard/50 dark:border-white/[0.06] hover:border-primary/40 hover:bg-gradient-to-br hover:from-primary/[0.03] hover:to-transparent hover:shadow-[0_8px_30px_rgba(16,185,129,0.04)]",
            ctaColor: "group-hover:text-primary",
        },
        {
            title: "Track My Trades",
            description: "Sync MT5 trades or log them manually.",
            href: isLoggedIn
                ? "/dashboard/accounts"
                : "/auth/signup?source=home_goal&intent=track",
            icon: <LineChart size={20} />,
            color: "text-gold",
            chipBg: "bg-gold/10",
            ctaText: "Setup Journal",
            animClass: "group-hover:scale-110 group-hover:translate-x-0.5",
            bgClass:
                "bg-gradient-to-br from-gold/[0.04] to-amber-500/[0.01] border-gold/30 hover:border-gold/60 hover:shadow-[0_8px_30px_rgba(245,158,11,0.1)] dark:from-gold/[0.03] dark:to-transparent",
            ctaColor: "group-hover:text-gold",
            isRecommended: true,
        },
        {
            title: "Calculate Risk",
            description: "Risk calculators and position sizing tools.",
            href: "/tools",
            icon: <Calculator size={20} />,
            color: "text-blue-500",
            chipBg: "bg-blue-500/10",
            ctaText: "Open Calculators",
            animClass: "group-hover:scale-110 group-hover:rotate-6",
            bgClass:
                "bg-white dark:bg-white/[0.02] border-dashboard/50 dark:border-white/[0.06] hover:border-blue-500/40 hover:bg-gradient-to-br hover:from-blue-500/[0.03] hover:to-transparent hover:shadow-[0_8px_30px_rgba(59,130,246,0.04)]",
            ctaColor: "group-hover:text-blue-500",
        },
        {
            title: "Compare Brokers",
            description: "Compare brokers and trading platforms.",
            href: "/brokers",
            icon: <Building size={20} />,
            color: "text-emerald-500",
            chipBg: "bg-emerald-500/10",
            ctaText: "Compare Now",
            animClass: "group-hover:scale-110",
            bgClass:
                "bg-white dark:bg-white/[0.02] border-dashboard/50 dark:border-white/[0.06] hover:border-emerald-500/40 hover:bg-gradient-to-br hover:from-emerald-500/[0.03] hover:to-transparent hover:shadow-[0_8px_30px_rgba(16,185,129,0.04)]",
            ctaColor: "group-hover:text-emerald-500",
        },
    ];

    return (
        <div className="relative overflow-hidden bg-white dark:bg-transparent border-t border-dashboard">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

            <section className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <HomeSectionHeading
                    align="center"
                    eyebrow="Choose your path"
                    title="What do you want to improve today?"
                    highlight="improve"
                    description="Now that you know the system, pick the next step that fits your current goal."
                    icon={Compass}
                    className="mb-10"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                    {cards.map((card, idx) => (
                        <Link
                            key={idx}
                            href={card.href}
                            className={`group relative flex min-h-[118px] flex-col justify-between rounded-xl border border-t-[3px] border-t-gold dark:border-t-gold/90 p-4 text-left transition-all duration-300 sm:min-h-[150px] sm:p-5 ${card.bgClass}`}
                        >
                            {/* Recommended badge */}
                            {"isRecommended" in card && card.isRecommended && (
                                <div className="absolute right-3 top-3 rounded-full border border-gold/20 bg-gold/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-gold sm:text-[9px]">
                                    Recommended
                                </div>
                            )}

                            {/* Subtle inner gradient - matches TrustMetrics style */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-transparent to-gray-50/50 dark:to-white/[0.01] pointer-events-none" />

                            <div className="relative z-10 w-full">
                                {/* Icon and Title Inline */}
                                <div className="mb-3 flex items-center gap-3 pr-20 sm:pr-0">
                                    <div
                                        className={`shrink-0 rounded-xl p-2.5 ${card.chipBg}`}
                                    >
                                        <span
                                            className={`${card.color} block transition-transform duration-300 ${card.animClass}`}
                                        >
                                            {card.icon}
                                        </span>
                                    </div>
                                    <h3
                                        className={`text-sm sm:text-base font-black text-gray-800 dark:text-white transition-colors leading-tight ${card.ctaColor}`}
                                    >
                                        {card.title}
                                    </h3>
                                </div>

                                <p className="mb-4 text-xs font-medium leading-relaxed text-gray-500 dark:text-gray-400 sm:mb-5">
                                    {card.description}
                                </p>
                            </div>

                            <div
                                className={`relative z-10 mt-auto flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-gray-500 transition-colors dark:text-gray-400 ${card.ctaColor}`}
                            >
                                {card.ctaText}{" "}
                                <ArrowRight
                                    size={12}
                                    className="group-hover:translate-x-1 transition-transform"
                                />
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
