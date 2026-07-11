"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface CompactStat {
 title: string;
 value: string;
 icon: LucideIcon;
 color: string;
}

const BG_COLORS: Record<string, string> = {
 amber: "bg-amber-100 dark:bg-amber-500/15",
 teal: "bg-teal-100 dark:bg-teal-500/15",
 rose: "bg-rose-100 dark:bg-rose-500/15",
 indigo: "bg-indigo-100 dark:bg-indigo-500/15",
};

const ICON_COLORS: Record<string, string> = {
 amber: "text-amber-600 dark:text-amber-400",
 teal: "text-teal-600 dark:text-teal-400",
 rose: "text-rose-600 dark:text-rose-400",
 indigo: "text-indigo-600 dark:text-indigo-400",
};

export function CompactStatsRow({ stats }: { stats: CompactStat[] }) {
 return (
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 {stats.map((stat, i) => (
 <motion.div
 key={i}
 initial={{ opacity: 0, y: 16 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
 whileHover={{ y: -2, transition: { duration: 0.2 } }}
 className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-4 shadow-sm hover:shadow-md transition-shadow cursor-default"
 >
 <div className="flex items-center gap-3">
 <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${BG_COLORS[stat.color] || "bg-gray-100 dark:bg-gray-800"} ${ICON_COLORS[stat.color] || "text-gray-500"}`}>
 <stat.icon size={16} aria-hidden="true" />
 </div>
 <div>
 <div className="text-xl font-black text-gray-800 dark:text-white tabular-nums leading-none">
 {stat.value}
 </div>
 <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-1 uppercase tracking-wider">
 {stat.title}
 </div>
 </div>
 </div>
 </motion.div>
 ))}
 </div>
 );
}
