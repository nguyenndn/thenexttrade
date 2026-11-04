import Link from "next/link";
import {
    Bot,
    Calculator,
    Building,
    Target,
} from "lucide-react";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";

interface StartByGoalSectionProps {
    isLoggedIn?: boolean;
}

export function StartByGoalSection(_props: StartByGoalSectionProps) {
    const cards = [
        {
            stepBadge: "STEP 01 · KNOW YOUR BLIND SPOTS",
            title: "Trading Style Audit",
            description: "New or inconsistent? Identify your XAU/USD trading archetype, behavioral blind spots, and custom risk rules in 3 minutes.",
            icon: <Target size={20} />,
            href: "/trading-style",
            color: "text-slate-700 dark:text-slate-300",
            chipBg: "bg-slate-100 dark:bg-[#151925]",
            animClass: "group-hover:scale-110 group-hover:-rotate-6",
            bgClass:
                "bg-white dark:bg-[#0D111C] border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/[0.04]",
        },
        {
            stepBadge: "STEP 02 · BEFORE EVERY TRADE",
            title: "Pre-Trade Risk Math",
            description: "Model exact lot size, pip values & ruin odds with 17 free risk calculators before pressing buy or sell — no login required.",
            icon: <Calculator size={20} />,
            href: "/tools",
            color: "text-slate-700 dark:text-slate-300",
            chipBg: "bg-slate-100 dark:bg-[#151925]",
            animClass: "group-hover:scale-110 group-hover:rotate-6",
            bgClass:
                "bg-white dark:bg-[#0D111C] border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/[0.04]",
        },
        {
            stepBadge: "STEP 03 · MANUAL CO-PILOT & AUTO EAs",
            title: "Automated Discipline",
            description: "Use GSN Trade Manager for 1-click manual lot sizing & journal sync, or run GoldScalperNinja & GSN Shadow Matrix for automated MT5 execution.",
            icon: <Bot size={20} />,
            href: "/trading-systems",
            color: "text-gold",
            chipBg: "bg-gold/10",
            animClass: "group-hover:scale-110 group-hover:translate-x-0.5",
            bgClass:
                "bg-gradient-to-br from-gold/[0.05] to-amber-500/[0.02] border-gold/30 hover:border-gold/60 hover:shadow-[0_8px_30px_rgba(245,158,11,0.12)] dark:from-gold/[0.05] dark:to-[#0D111C]",
        },
        {
            stepBadge: "STEP 04 · $0 VIP SPONSORSHIP",
            title: "Capital Sponsorship",
            description: "Start free at $0. When ready for live trading, fund your own regulated broker account with $200 to unlock all VIP EAs & AI Coach permanently.",
            icon: <Building size={20} />,
            href: "/brokers",
            color: "text-slate-700 dark:text-slate-300",
            chipBg: "bg-slate-100 dark:bg-[#151925]",
            animClass: "group-hover:scale-110",
            bgClass:
                "bg-white dark:bg-[#0D111C] border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/[0.04]",
        },
    ];

    return (
        <div className="relative overflow-hidden bg-white dark:bg-transparent border-t border-gray-200 dark:border-white/10">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

            <section className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <HomeSectionHeading
                    align="center"
                    title="Your Journal spots the leaks. Here is how you eliminate them."
                    highlight="how you eliminate them."
                    description="Most platforms just show you where you lost money. TheNextTrade equips you with a 4-step execution stack to systematically eliminate amateur errors at zero software cost."
                    className="mb-8 sm:mb-10"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                    {cards.map((card, idx) => (
                        <Link
                            key={idx}
                            href={card.href}
                            className={`group relative flex flex-col justify-start items-center sm:items-start rounded-xl border p-5 sm:p-5 text-center sm:text-left transition-all duration-300 block h-full ${card.bgClass}`}
                        >
                            {/* Subtle inner gradient */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-transparent to-gray-50/50 dark:to-white/[0.01] pointer-events-none" />

                            <div className="relative z-10 w-full flex flex-col items-center sm:items-start">
                                <div className="mb-2 text-[10px] font-mono tabular-nums font-extrabold uppercase tracking-wider text-amber-600 dark:text-gold">
                                    {card.stepBadge}
                                </div>
                                {/* Icon and Title: Stacked centered on mobile, inline on sm+ */}
                                <div className="mb-3 flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-start gap-2.5 sm:gap-3 w-full">
                                    <div
                                        className={`shrink-0 rounded-lg p-2.5 ${card.chipBg}`}
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
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
