"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface CompactStat {
    title: string;
    value: string;
    icon: LucideIcon;
    color: string;
}

const ICON_COLORS: Record<string, string> = {
    amber: "text-amber-500",
    teal: "text-teal-500",
    rose: "text-rose-500",
    indigo: "text-indigo-500",
};

export function CompactStatsRow({ stats }: { stats: CompactStat[] }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden"
        >
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-200 dark:divide-white/10">
                {stats.map((stat, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-4">
                        <stat.icon
                            size={18}
                            className={ICON_COLORS[stat.color] || "text-gray-500"}
                            strokeWidth={2.5}
                            aria-hidden="true"
                        />
                        <div>
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stat.title}</div>
                            <div className="text-lg font-black text-gray-700 dark:text-white tracking-tight">{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
