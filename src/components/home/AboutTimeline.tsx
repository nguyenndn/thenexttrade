"use client";

import { useRef, useEffect, useState } from "react";
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
} from "framer-motion";
import { TIMELINE } from "./about-timeline/timeline-data";
import { TimelineNode } from "./about-timeline/TimelineNode";

export function AboutTimeline() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [unlockedNodes, setUnlockedNodes] = useState<Set<number>>(new Set());
    const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Track scroll progress for the flowing line
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start 80%", "end 60%"],
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
                    setUnlockedNodes((prev) => new Set(prev).add(idx));
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
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                    Why We Built TheNextTrade
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                    Four phases from blown accounts to disciplined execution
                </p>
            </motion.div>

            <div ref={containerRef} className="relative">
                {/* Background line (faded) */}
                <div className="absolute left-6 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-white/10 hidden md:block" />
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-white/10 md:hidden" />

                {/* Animated flowing line (desktop — Semantic Rose -> Gold -> Emerald) */}
                <motion.div
                    className="absolute left-6 md:left-1/2 md:-translate-x-px top-0 w-0.5 origin-top hidden md:block"
                    style={{
                        scaleY: smoothProgress,
                        height: "100%",
                        background:
                            "linear-gradient(to bottom, #ef4444, #f59e0b, #eab308, #00c878)",
                    }}
                />
                {/* Animated flowing line (mobile) */}
                <motion.div
                    className="absolute left-6 top-0 w-0.5 origin-top md:hidden"
                    style={{
                        scaleY: smoothProgress,
                        height: "100%",
                        background:
                            "linear-gradient(to bottom, #ef4444, #f59e0b, #eab308, #00c878)",
                    }}
                />

                {/* Glowing tip at the end of the line */}
                <motion.div
                    className="absolute left-6 md:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white z-[5] pointer-events-none"
                    style={{
                        top: useTransform(
                            smoothProgress,
                            [0, 1],
                            ["0%", "100%"]
                        ),
                        boxShadow:
                            "0 0 12px 4px rgba(0, 200, 120, 0.8), 0 0 30px 10px rgba(0, 200, 120, 0.4)",
                    }}
                />

                <div className="space-y-12 md:space-y-16">
                    {TIMELINE.map((item, idx) => (
                        <div
                            key={idx}
                            ref={(el) => {
                                nodeRefs.current[idx] = el;
                            }}
                        >
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
