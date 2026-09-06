"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { BookOpen, TrendingUp, Trophy, Shield, Crown } from "lucide-react";

const steps = [
    {
        icon: BookOpen,
        title: "1. The Initiate",
        desc: "Beginner & Foundations",
        level: "Lvl 1-2",
        color: "text-slate-600 dark:text-slate-400",
        bg: "bg-slate-100 dark:bg-slate-800/60",
        border: "border-slate-200 dark:border-slate-800/80",
        hoverBorder: "hover:border-slate-400/50 dark:hover:border-slate-600/50",
        gradient: "from-slate-400 to-slate-500",
        badge: "bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
        glow: "rgba(148,163,184,0.15)",
    },
    {
        icon: TrendingUp,
        title: "2. The Analyst",
        desc: "Technical & Price Action",
        level: "Lvl 3-5",
        color: "text-sky-600 dark:text-sky-400",
        bg: "bg-sky-500/10 dark:bg-sky-500/15",
        border: "border-sky-200/90 dark:border-sky-900/40",
        hoverBorder: "hover:border-sky-400/60 dark:hover:border-sky-500/60",
        gradient: "from-sky-400 to-blue-500",
        badge: "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
        glow: "rgba(2,132,199,0.18)",
    },
    {
        icon: Trophy,
        title: "3. The Strategist",
        desc: "Patterns & Strategy Lab",
        level: "Lvl 6 & 8",
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
        border: "border-emerald-200/90 dark:border-emerald-900/40",
        hoverBorder: "hover:border-emerald-400/60 dark:hover:border-emerald-500/60",
        gradient: "from-emerald-400 to-teal-500",
        badge: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
        glow: "rgba(5,150,105,0.18)",
    },
    {
        icon: Shield,
        title: "4. The Operator",
        desc: "Mindset & Fundamentals",
        level: "Lvl 7, 9-10",
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-500/10 dark:bg-purple-500/15",
        border: "border-purple-200/90 dark:border-purple-900/40",
        hoverBorder: "hover:border-purple-400/60 dark:hover:border-purple-500/60",
        gradient: "from-purple-400 to-indigo-500",
        badge: "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
        glow: "rgba(147,51,234,0.18)",
    },
    {
        icon: Crown,
        title: "5. The Master",
        desc: "Global View & Live Trading",
        level: "Lvl 11-12",
        color: "text-amber-500 dark:text-gold",
        bg: "bg-gold/15 dark:bg-gold/20",
        border: "border-amber-300/90 dark:border-gold/50",
        hoverBorder: "hover:border-amber-500 dark:hover:border-gold",
        gradient: "from-amber-400 via-yellow-400 to-amber-600",
        badge: "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-600 font-bold",
        glow: "rgba(245,158,11,0.28)",
        shadow: "shadow-[0_4px_20px_rgba(245,158,11,0.22)]",
    },
];

const CARD_DELAY = 0.5;
const LINE_DURATION = 3.5;

export function LearningPathTimeline() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-15%" });

    return (
        <div
            ref={ref}
            className="grid grid-cols-1 md:flex md:flex-wrap md:justify-center lg:grid lg:grid-cols-5 gap-6 mb-16 relative"
        >
            {/* Desktop Animated Line - vertically centered through cards */}
            <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 left-[10%] right-[10%] h-[3px] z-0">
                {/* Background track */}
                <div className="absolute inset-0 bg-gray-200 dark:bg-white/10 rounded-full" />

                {/* Animated fill - "water flow" progression spectrum */}
                <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background:
                            "linear-gradient(90deg, #94a3b8 0%, #0284c7 25%, #059669 50%, #9333ea 75%, #f59e0b 100%)",
                        boxShadow:
                            "0 0 12px rgba(245,158,11,0.3), 0 0 6px rgba(147,51,234,0.2)",
                        transformOrigin: "left center",
                    }}
                    initial={{ scaleX: 0 }}
                    animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                    transition={{
                        duration: LINE_DURATION,
                        ease: "easeInOut",
                        delay: 0.3,
                    }}
                />

                {/* Shimmer effect on the line */}
                {isInView && (
                    <motion.div
                        className="absolute top-0 bottom-0 w-24 rounded-full"
                        style={{
                            background:
                                "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
                        }}
                        initial={{ left: "-10%" }}
                        animate={{ left: "110%" }}
                        transition={{
                            duration: 2,
                            delay: 0.6,
                            ease: "easeInOut",
                        }}
                    />
                )}
            </div>

            {/* Mobile Animated Vertical Line */}
            <div className="md:hidden absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[3px] z-0">
                <div className="absolute inset-0 bg-gray-200 dark:bg-white/10 rounded-full" />
                <motion.div
                    className="absolute inset-x-0 top-0 bottom-0 rounded-full"
                    style={{
                        background:
                            "linear-gradient(180deg, #94a3b8 0%, #0284c7 25%, #059669 50%, #9333ea 75%, #f59e0b 100%)",
                        boxShadow: "0 0 10px rgba(245,158,11,0.3)",
                        transformOrigin: "top center",
                    }}
                    initial={{ scaleY: 0 }}
                    animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
                    transition={{
                        duration: LINE_DURATION,
                        ease: "easeInOut",
                        delay: 0.3,
                    }}
                />
            </div>

            {/* Step Cards */}
            {steps.map((step, idx) => {
                const cardDelay = 0.5 + idx * CARD_DELAY;

                return (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                        transition={{
                            duration: 0.7,
                            delay: cardDelay,
                            ease: "easeOut",
                        }}
                        className={`relative z-10 group overflow-hidden bg-white dark:bg-[#1E2028] p-4 pt-5 rounded-xl border ${step.border} ${step.hoverBorder} transition-all duration-300 w-full max-w-sm md:w-[30%] lg:w-auto mx-auto md:mx-0 shadow-sm hover:shadow-lg ${step.shadow || ""}`}
                        style={{
                            boxShadow: `0 2px 12px ${step.glow}`,
                        }}
                    >
                        {/* Gradient top accent bar */}
                        <div
                            className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${step.gradient} opacity-80 group-hover:opacity-100 transition-opacity`}
                        />

                        {/* Icon */}
                        <motion.div
                            className={`w-12 h-12 rounded-xl ${step.bg} ${step.color} flex items-center justify-center mb-3 mx-auto`}
                            initial={{ rotate: -15, scale: 0.5 }}
                            animate={isInView ? { rotate: 0, scale: 1 } : {}}
                            transition={{
                                duration: 0.5,
                                delay: cardDelay + 0.15,
                                type: "spring",
                                stiffness: 200,
                            }}
                        >
                            <step.icon size={24} strokeWidth={2.5} />
                        </motion.div>

                        {/* Text & Level Badge */}
                        <div className="text-center">
                            <div
                                className={`inline-block text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border mb-2 ${step.badge}`}
                            >
                                {step.level}
                            </div>
                            <h3 className="text-base font-bold text-gray-800 dark:text-white mb-1">
                                {step.title}
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                                {step.desc}
                            </p>
                        </div>

                        {/* Glow on hover */}
                        <div
                            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 pointer-events-none"
                            style={{ boxShadow: `0 0 30px ${step.glow}` }}
                        />
                    </motion.div>
                );
            })}
        </div>
    );
}
