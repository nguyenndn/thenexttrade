"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface AnimatedStatCardProps {
    title: string;
    value: number;
    suffix?: string;
    decimals?: number;
    sparklineData?: number[];
    trendPercent: number | null;
    icon: LucideIcon;
    color: "blue" | "emerald" | "cyan" | "green" | "amber";
    index?: number;
}

const COLOR_MAP: Record<
    string,
    { hex: string; bg: string; text: string; ring: string; borderTop: string }
> = {
    blue: {
        hex: "#3b82f6",
        bg: "bg-blue-50/50 dark:bg-blue-500/10",
        text: "text-blue-600 dark:text-blue-400",
        ring: "ring-1 ring-blue-500/20",
        borderTop: "border-t-blue-500",
    },
    emerald: {
        hex: "#10b981",
        bg: "bg-emerald-50/50 dark:bg-emerald-500/10",
        text: "text-emerald-600 dark:text-emerald-400",
        ring: "ring-1 ring-emerald-500/20",
        borderTop: "border-t-emerald-500",
    },
    cyan: {
        hex: "#06b6d4",
        bg: "bg-cyan-50/50 dark:bg-cyan-500/10",
        text: "text-cyan-600 dark:text-cyan-400",
        ring: "ring-1 ring-cyan-500/20",
        borderTop: "border-t-cyan-500",
    },
    green: {
        hex: "#22c55e",
        bg: "bg-green-50/50 dark:bg-green-500/10",
        text: "text-green-600 dark:text-green-400",
        ring: "ring-1 ring-green-500/20",
        borderTop: "border-t-green-500",
    },
    amber: {
        hex: "#f59e0b",
        bg: "bg-amber-50/50 dark:bg-amber-500/10",
        text: "text-amber-600 dark:text-amber-400",
        ring: "ring-1 ring-amber-500/20",
        borderTop: "border-t-amber-500",
    },
};

function useAnimatedCounter(target: number, duration = 1000, decimals = 0) {
    const [display, setDisplay] = useState(() =>
        decimals > 0 ? target.toFixed(decimals) : Math.round(target).toLocaleString()
    );
    const prevTargetRef = useRef(target);

    useEffect(() => {
        const startVal = prevTargetRef.current;
        prevTargetRef.current = target;

        if (startVal === target) {
            setDisplay(decimals > 0 ? target.toFixed(decimals) : Math.round(target).toLocaleString());
            return;
        }

        let startTime: number | null = null;
        let animFrame: number;

        const animate = (timestamp: number) => {
            if (startTime === null) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = startVal + (target - startVal) * eased;

            setDisplay(
                decimals > 0
                    ? current.toFixed(decimals)
                    : Math.round(current).toLocaleString()
            );

            if (progress < 1) {
                animFrame = requestAnimationFrame(animate);
            }
        };

        animFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animFrame);
    }, [target, duration, decimals]);

    return display;
}

export function AnimatedStatCard({
    title,
    value,
    suffix,
    decimals = 0,
    sparklineData,
    trendPercent,
    icon: Icon,
    color,
    index = 0,
}: AnimatedStatCardProps) {
    const cs = COLOR_MAP[color] || COLOR_MAP.blue;
    const displayValue = useAnimatedCounter(value, 1500, decimals);

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: [0.25, 0.46, 0.45, 0.94],
            }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-4 shadow-sm hover:shadow-md transition-shadow cursor-default"
        >
            <div className="flex items-center gap-3">
                <div
                    className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${cs.bg} ${cs.text}`}
                >
                    <Icon size={16} aria-hidden="true" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <p className="text-xl font-black text-gray-800 dark:text-white tabular-nums leading-none">
                            {displayValue}
                            {suffix && (
                                <span className="text-sm font-medium text-gray-500 ml-0.5">
                                    {suffix}
                                </span>
                            )}
                        </p>
                        {trendPercent !== null &&
                            trendPercent !== undefined && (
                                <span
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg ${
                                        trendPercent > 0
                                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                            : trendPercent < 0
                                              ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                                              : "bg-gray-50 text-gray-600 dark:bg-gray-500/10"
                                    }`}
                                >
                                    {trendPercent > 0 ? "+" : ""}
                                    {trendPercent}%
                                </span>
                            )}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-1 uppercase tracking-wider">
                        {title}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
