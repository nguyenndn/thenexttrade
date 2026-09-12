"use client";

import Link from "next/link";
import {
    BookOpen,
    Bot,
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
            title: "Pre-Trade Risk Math",
            description: "Model lot size, pip values & ruin odds with 18 institutional calculators before pressing buy or sell.",
            icon: <Calculator size={20} />,
            color: "text-slate-700 dark:text-slate-300",
            chipBg: "bg-slate-100 dark:bg-white/5",
            animClass: "group-hover:scale-110 group-hover:rotate-6",
            bgClass:
                "bg-white dark:bg-white/[0.02] border-gray-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/[0.04]",
        },
        {
            title: "Automated Discipline",
            description: "Deploy GoldScalperNinja, Trade Manager & Phoenix Grid to enforce hard-coded risk rules via MT5.",
            icon: <Bot size={20} />,
            color: "text-gold",
            chipBg: "bg-gold/10",
            animClass: "group-hover:scale-110 group-hover:translate-x-0.5",
            bgClass:
                "bg-gradient-to-br from-gold/[0.05] to-amber-500/[0.02] border-gold/30 hover:border-gold/60 hover:shadow-[0_8px_30px_rgba(245,158,11,0.12)] dark:from-gold/[0.03] dark:to-transparent",
        },
        {
            title: "Market Structure",
            description: "Master 12-level curriculum on liquidity mechanics, session profiles, and institutional order flow.",
            icon: <BookOpen size={20} />,
            color: "text-slate-700 dark:text-slate-300",
            chipBg: "bg-slate-100 dark:bg-white/5",
            animClass: "group-hover:scale-110 group-hover:-rotate-6",
            bgClass:
                "bg-white dark:bg-white/[0.02] border-gray-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/[0.04]",
        },
        {
            title: "Capital Sponsorship",
            description: "Preserve 100% of your deposit with verified partner brokers to unlock our full Pro stack at $0.",
            icon: <Building size={20} />,
            color: "text-slate-700 dark:text-slate-300",
            chipBg: "bg-slate-100 dark:bg-white/5",
            animClass: "group-hover:scale-110",
            bgClass:
                "bg-white dark:bg-white/[0.02] border-gray-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/[0.04]",
        },
    ];

    return (
        <div className="relative overflow-hidden bg-white dark:bg-transparent border-t border-dashboard">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

            <section className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <HomeSectionHeading
                    align="center"
                    eyebrow="THE 4-STEP EDGE PROTOCOL"
                    title="Your Journal spots the leaks. Here is how you eliminate them."
                    highlight="how you eliminate them."
                    description="Most platforms just show you where you lost money. TheNextTrade equips you with a 4-step execution stack to systematically eliminate amateur errors at zero software cost."
                    className="mb-8 sm:mb-10"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                    {cards.map((card, idx) => (
                        <div
                            key={idx}
                            className={`group relative flex flex-col justify-start items-center sm:items-start rounded-xl border p-5 sm:p-5 text-center sm:text-left transition-all duration-300 ${card.bgClass}`}
                        >
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
                                        className="text-sm sm:text-base font-black text-gray-800 dark:text-white transition-colors leading-tight text-center sm:text-left"
                                    >
                                        {card.title}
                                    </h3>
                                </div>

                                <p className="text-xs font-medium leading-relaxed text-gray-500 dark:text-gray-400 text-center sm:text-left">
                                    {card.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {!isLoggedIn && (
                    <div className="mt-6 sm:mt-8 p-4 sm:p-5 rounded-xl border border-gold/20 bg-gold/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                        <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-200">
                            <span className="font-bold text-amber-500 dark:text-gold">100% Free Ecosystem:</span> Every resource above is instantly unlocked when you register your free TheNextTrade account.
                        </div>
                        <Link href="/auth/signup" className="shrink-0">
                            <span className="text-xs font-bold text-amber-600 dark:text-gold hover:underline flex items-center gap-1">
                                Create Free Account <ArrowRight size={13} />
                            </span>
                        </Link>
                    </div>
                )}
            </section>
        </div>
    );
}
