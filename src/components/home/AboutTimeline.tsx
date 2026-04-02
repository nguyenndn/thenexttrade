"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { Flame, Search, BookOpen, Rocket, type LucideIcon } from "lucide-react";

interface TimelineItem {
    phase: string;
    icon: LucideIcon;
    color: string;
    bg: string;
    borderColor: string;
    accentColor: string;
    glowColor: string;
    title: string;
    period: string;
    story: string;
}

const TIMELINE: TimelineItem[] = [
    {
        phase: "01",
        icon: Flame,
        color: "text-red-500",
        bg: "bg-red-100 dark:bg-red-500/10",
        borderColor: "border-red-200 dark:border-red-500/20",
        accentColor: "from-red-500 to-orange-500",
        glowColor: "rgba(239, 68, 68, 0.6)",
        title: "The Pink Glasses",
        period: "The Beginning",
        story: "A friend introduced me to forex, and everything looked rosy. Every trade seemed to win. I felt invincible — like I had discovered a secret money machine. The charts moved, my balance grew, and I thought this was it."
    },
    {
        phase: "02",
        icon: Search,
        color: "text-amber-500",
        bg: "bg-amber-100 dark:bg-amber-500/10",
        borderColor: "border-amber-200 dark:border-amber-500/20",
        accentColor: "from-amber-500 to-red-500",
        glowColor: "rgba(245, 158, 11, 0.6)",
        title: "The Wake-Up Call",
        period: "Rock Bottom",
        story: "Then came the moment of truth. I went all in. Oversized lots. No stop loss. No plan. The market didn't care about my confidence — it took everything. I stared at a blown account and realized: I had been gambling, not trading. I had zero real knowledge."
    },
    {
        phase: "03",
        icon: BookOpen,
        color: "text-blue-500",
        bg: "bg-blue-100 dark:bg-blue-500/10",
        borderColor: "border-blue-200 dark:border-blue-500/20",
        accentColor: "from-blue-500 to-cyan-500",
        glowColor: "rgba(59, 130, 246, 0.6)",
        title: "The Hard Way",
        period: "Self-Education",
        story: "Desperate and broke, I chased the holy grail — magic indicators, secret strategies, paid signals. None of it worked. So I did the only thing left: I taught myself. But the knowledge was scattered across hundreds of sites, YouTube channels, and forums. There was no single structured path. It took years of pain, trial, and error — but slowly, the losses stopped, and I started seeing consistent profits."
    },
    {
        phase: "04",
        icon: Rocket,
        color: "text-primary",
        bg: "bg-emerald-100 dark:bg-primary/10",
        borderColor: "border-emerald-200 dark:border-primary/20",
        accentColor: "from-primary to-teal-400",
        glowColor: "rgba(0, 200, 120, 0.6)",
        title: "TheNextTrade",
        period: "The Solution",
        story: "After years of hard-won experience, I had one burning thought: no new trader should have to go through what I went through. The scattered knowledge, the scams, the loneliness of figuring it out alone — I wanted to change that. So I built TheNextTrade: a free, structured platform where everything a retail trader needs — tools, courses, knowledge, and community — lives in one place."
    },
];

function TimelineNode({ item, idx, unlocked }: { item: TimelineItem; idx: number; unlocked: boolean }) {
    const isLeft = idx % 2 === 0;
    const Icon = item.icon;

    return (
        <div className="relative">
            {/* Node dot — centered on line */}
            <div className="absolute left-6 md:left-1/2 -translate-x-1/2 z-20">
                <motion.div
                    className="relative"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={unlocked ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0.3 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    {/* Outer glow ring — unlock pulse */}
                    {unlocked && (
                        <>
                            <motion.div
                                className="absolute inset-0 rounded-full"
                                style={{ boxShadow: `0 0 20px 8px ${item.glowColor}` }}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.8, 2.5] }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                            />
                            <motion.div
                                className="absolute inset-0 rounded-full"
                                style={{ boxShadow: `0 0 30px 12px ${item.glowColor}` }}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: [0, 0.5, 0], scale: [0.5, 2, 3] }}
                                transition={{ duration: 1.5, ease: "easeOut", delay: 0.1 }}
                            />
                            {/* Persistent subtle glow */}
                            <motion.div
                                className="absolute -inset-2 rounded-full"
                                style={{ boxShadow: `0 0 15px 4px ${item.glowColor}` }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 0.4, 0.3] }}
                                transition={{ duration: 0.8, delay: 0.5 }}
                            />
                        </>
                    )}
                    {/* Main node circle */}
                    <motion.div
                        className={`w-12 h-12 rounded-full ${item.bg} ${item.color} flex items-center justify-center border-4 border-white dark:border-[#0F1117] shadow-lg relative z-10`}
                        animate={unlocked ? {
                            boxShadow: [
                                `0 0 0px 0px ${item.glowColor}`,
                                `0 0 20px 6px ${item.glowColor}`,
                                `0 0 10px 3px ${item.glowColor}`,
                            ]
                        } : {}}
                        transition={{ duration: 1, ease: "easeOut" }}
                    >
                        <motion.div
                            animate={unlocked ? { rotate: [0, -15, 15, 0], scale: [1, 1.3, 1] } : {}}
                            transition={{ duration: 0.6, delay: 0.3 }}
                        >
                            <Icon size={20} strokeWidth={2.5} />
                        </motion.div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Content card */}
            <motion.div
                className={`ml-20 md:ml-0 md:w-[calc(50%-40px)] ${isLeft ? 'md:mr-auto md:pr-0' : 'md:ml-auto md:pl-0'}`}
                initial={{ opacity: 0, x: isLeft ? -60 : 60, y: 20 }}
                animate={unlocked ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: isLeft ? -60 : 60, y: 20 }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.4 }}
            >
                <div className={`bg-white dark:bg-[#1E2028] border ${item.borderColor} rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300 group`}>
                    <div className="flex items-center gap-3 mb-4">
                        <span className={`text-xs font-black uppercase tracking-widest bg-gradient-to-r ${item.accentColor} bg-clip-text text-transparent`}>
                            Phase {item.phase}
                        </span>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            {item.period}
                        </span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-gray-700 dark:text-white mb-3 tracking-tight">
                        {item.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-500 leading-relaxed">
                        {item.story}
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

export function AboutTimeline() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [unlockedNodes, setUnlockedNodes] = useState<Set<number>>(new Set());
    const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Track scroll progress for the flowing line
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start 80%", "end 60%"]
    });

    // Slow, smooth spring for the line
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 30,
        damping: 20,
        restDelta: 0.001,
    });

    // Observe each node's actual DOM position and unlock when line reaches it
    useEffect(() => {
        const unsubscribe = scrollYProgress.on("change", (latest) => {
            const container = containerRef.current;
            if (!container) return;
            const containerHeight = container.offsetHeight;
            if (containerHeight === 0) return;

            nodeRefs.current.forEach((nodeEl, idx) => {
                if (!nodeEl || unlockedNodes.has(idx)) return;
                // Node's top position relative to container, as a 0-1 ratio
                const nodeTop = nodeEl.offsetTop;
                const nodeThreshold = nodeTop / containerHeight;
                if (latest >= nodeThreshold) {
                    setUnlockedNodes(prev => new Set(prev).add(idx));
                }
            });
        });
        return unsubscribe;
    }, [scrollYProgress, unlockedNodes]);

    return (
        <section className="px-4 mb-24 max-w-5xl mx-auto">
            <motion.div
                className="text-center mb-16 space-y-4"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
            >
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-700 dark:text-white">My Journey</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">Four phases that shaped everything</p>
            </motion.div>

            <div ref={containerRef} className="relative">
                {/* Background line (faded) */}
                <div className="absolute left-6 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-white/10 hidden md:block" />
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-white/10 md:hidden" />

                {/* Animated flowing line (desktop) */}
                <motion.div
                    className="absolute left-6 md:left-1/2 md:-translate-x-px top-0 w-0.5 origin-top hidden md:block"
                    style={{
                        scaleY: smoothProgress,
                        height: "100%",
                        background: "linear-gradient(to bottom, #ef4444, #f59e0b, #3b82f6, #00c878)",
                    }}
                />
                {/* Animated flowing line (mobile) */}
                <motion.div
                    className="absolute left-6 top-0 w-0.5 origin-top md:hidden"
                    style={{
                        scaleY: smoothProgress,
                        height: "100%",
                        background: "linear-gradient(to bottom, #ef4444, #f59e0b, #3b82f6, #00c878)",
                    }}
                />

                {/* Glowing tip at the end of the line */}
                <motion.div
                    className="absolute left-6 md:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white z-[5] pointer-events-none"
                    style={{
                        top: useTransform(smoothProgress, [0, 1], ["0%", "100%"]),
                        boxShadow: "0 0 12px 4px rgba(0, 200, 120, 0.8), 0 0 30px 10px rgba(0, 200, 120, 0.4)",
                    }}
                />

                <div className="space-y-12 md:space-y-16">
                    {TIMELINE.map((item, idx) => (
                        <div key={idx} ref={el => { nodeRefs.current[idx] = el; }}>
                            <TimelineNode
                                item={item}
                                idx={idx}
                                unlocked={unlockedNodes.has(idx)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
