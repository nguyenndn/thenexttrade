"use client";

import Link from "next/link";
import {
    BookOpen,
    LineChart,
    Calculator,
    Building,
    ArrowRight,
} from "lucide-react";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";

interface StartByGoalSectionProps {
    isLoggedIn: boolean;
}

export function StartByGoalSection({ isLoggedIn }: StartByGoalSectionProps) {
    const cards = [
        {
            title: "Master Market Structure",
            description: "Zero-fluff curriculum: liquidity, session profiles & risk math.",
            href: "/academy",
            icon: <BookOpen size={20} />,
            color: "text-slate-700 dark:text-slate-300",
            chipBg: "bg-slate-100 dark:bg-white/5",
            ctaText: "Start Free Course",
            animClass: "group-hover:scale-110 group-hover:-rotate-6",
            bgClass:
                "bg-white dark:bg-white/[0.02] border-gray-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/[0.04]",
            ctaColor: "group-hover:text-gold",
        },
        {
            title: "Automate My MT5 Journal",
            description: "Live MT5 sync. Zero Excel typing. Spot your leaks instantly.",
            href: isLoggedIn
                ? "/dashboard/accounts"
                : "/auth/signup?source=home_goal&intent=track",
            icon: <LineChart size={20} />,
            color: "text-gold",
            chipBg: "bg-gold/10",
            ctaText: "Launch Journal",
            animClass: "group-hover:scale-110 group-hover:translate-x-0.5",
            bgClass:
                "bg-gradient-to-br from-gold/[0.05] to-amber-500/[0.02] border-gold/30 hover:border-gold/60 hover:shadow-[0_8px_30px_rgba(245,158,11,0.12)] dark:from-gold/[0.03] dark:to-transparent",
            ctaColor: "group-hover:text-gold",
            isRecommended: true,
        },
        {
            title: "Calculate Lot Size & Risk",
            description: "Position sizing, pip valuation & drawdown math before entering.",
            href: "/tools",
            icon: <Calculator size={20} />,
            color: "text-slate-700 dark:text-slate-300",
            chipBg: "bg-slate-100 dark:bg-white/5",
            ctaText: "Open 18 Calculators",
            animClass: "group-hover:scale-110 group-hover:rotate-6",
            bgClass:
                "bg-white dark:bg-white/[0.02] border-gray-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/[0.04]",
            ctaColor: "group-hover:text-gold",
        },
        {
            title: "Get Zero-Fee VIP Access",
            description: "Trade with verified partner brokers to unlock all EAs at $0.",
            href: "/brokers",
            icon: <Building size={20} />,
            color: "text-slate-700 dark:text-slate-300",
            chipBg: "bg-slate-100 dark:bg-white/5",
            ctaText: "Unlock VIP Route",
            animClass: "group-hover:scale-110",
            bgClass:
                "bg-white dark:bg-white/[0.02] border-gray-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/[0.04]",
            ctaColor: "group-hover:text-gold",
        },
    ];

    return (
        <div className="relative overflow-hidden bg-white dark:bg-transparent border-t border-dashboard">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

            <section className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <HomeSectionHeading
                    align="center"
                    title="Choose your starting edge"
                    highlight="starting edge"
                    description="Skip the noise. Pick the exact workspace you need to upgrade your execution today."
                    className="mb-8 sm:mb-10"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                    {cards.map((card, idx) => (
                        <Link
                            key={idx}
                            href={card.href}
                            className={`group relative flex min-h-[118px] flex-col justify-between items-center sm:items-start rounded-xl border p-5 sm:p-5 text-center sm:text-left transition-all duration-300 sm:min-h-[150px] ${card.bgClass}`}
                        >
                            {/* Recommended badge */}
                            {"isRecommended" in card && card.isRecommended && (
                                <div className="absolute right-3 top-3 rounded-full border border-gold/20 bg-gold/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-gold sm:text-[9px]">
                                    Recommended
                                </div>
                            )}

                            {/* Subtle inner gradient - matches TrustMetrics style */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-transparent to-gray-50/50 dark:to-white/[0.01] pointer-events-none" />

                            <div className="relative z-10 w-full flex flex-col items-center sm:items-start">
                                {/* Icon and Title: Stacked centered on mobile, inline on sm+ */}
                                <div className="mb-3 flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-start gap-2.5 sm:gap-3 w-full">
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
                                        className={`text-sm sm:text-base font-black text-gray-800 dark:text-white transition-colors leading-tight text-center sm:text-left ${card.ctaColor}`}
                                    >
                                        {card.title}
                                    </h3>
                                </div>

                                <p className="mb-4 text-xs font-medium leading-relaxed text-gray-500 dark:text-gray-400 sm:mb-5 text-center sm:text-left">
                                    {card.description}
                                </p>
                            </div>

                            <div
                                className={`relative z-10 mt-auto flex items-center justify-center sm:justify-start gap-1.5 text-[10px] font-black uppercase tracking-wider text-gray-500 transition-colors dark:text-gray-400 w-full sm:w-auto ${card.ctaColor}`}
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
