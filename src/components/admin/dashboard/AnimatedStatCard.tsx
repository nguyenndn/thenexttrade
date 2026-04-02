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

const COLOR_MAP: Record<string, { hex: string; bg: string; text: string; ring: string; borderTop: string }> = {
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

function useAnimatedCounter(target: number, duration = 1500, decimals = 0) {
    const [display, setDisplay] = useState("0");
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (hasAnimated.current) return;
        hasAnimated.current = true;

        let startTime: number;
        let animFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = eased * target;

            setDisplay(
                decimals > 0
                    ? current.toFixed(decimals)
                    : Math.round(current).toLocaleString()
            );

            if (progress < 1) animFrame = requestAnimationFrame(animate);
        };

        animFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animFrame);
    }, [target, duration, decimals]);

    return display;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
    if (!data || data.length < 2) return null;

    const width = 96;
    const height = 32;
    const pad = 2;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((v, i) => ({
        x: pad + (i / (data.length - 1)) * (width - pad * 2),
        y: pad + (1 - (v - min) / range) * (height - pad * 2),
    }));

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    const gId = `spark-${color.replace("#", "")}`;

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" aria-hidden="true">
            <defs>
                <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#${gId})`} />
            <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
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
            transition={{ duration: 0.5, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`bg-white dark:bg-[#0B0E14] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-lg transition-shadow border-t-4 ${cs.borderTop} cursor-default`}
        >
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{title}</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <h3 className="text-3xl font-black text-gray-700 dark:text-white tracking-tight tabular-nums">
                            {displayValue}
                        </h3>
                        {suffix && <span className="text-sm font-medium text-gray-500">{suffix}</span>}
                    </div>
                </div>
                <div className={`p-3.5 rounded-xl ${cs.bg} ${cs.text} ${cs.ring} transition-colors`}>
                    <Icon size={24} strokeWidth={2.5} aria-hidden="true" />
                </div>
            </div>

            <div className="mt-4 flex items-end justify-between">
                {sparklineData && sparklineData.length > 1 ? (
                    <Sparkline data={sparklineData} color={cs.hex} />
                ) : (
                    <div className="w-24" />
                )}
                {trendPercent !== null && trendPercent !== undefined && (
                    <span
                        className={`text-sm font-bold px-2.5 py-1 rounded-lg ${
                            trendPercent > 0
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                : trendPercent < 0
                                ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                                : "bg-gray-50 text-gray-600 dark:bg-gray-500/10"
                        }`}
                    >
                        {trendPercent > 0 ? "+" : ""}{trendPercent}%
                    </span>
                )}
            </div>
        </motion.div>
    );
}
