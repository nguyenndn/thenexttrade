"use client";

import { motion } from "framer-motion";
import type { TimelineItem } from "./timeline-data";
import { TimelineNodeDot } from "./TimelineNodeDot";

export interface TimelineNodeProps {
    item: TimelineItem;
    idx: number;
    unlocked: boolean;
}

export function TimelineNode({ item, idx, unlocked }: TimelineNodeProps) {
    const isLeft = idx % 2 === 0;

    return (
        <div className="relative">
            {/* Center animated dot & glow */}
            <TimelineNodeDot item={item} unlocked={unlocked} />

            {/* Content card */}
            <motion.div
                className={`ml-20 md:ml-0 md:w-[calc(50%-40px)] ${isLeft ? "md:mr-auto md:pr-0" : "md:ml-auto md:pl-0"}`}
                initial={{ opacity: 0, x: isLeft ? -60 : 60, y: 20 }}
                animate={
                    unlocked
                        ? { opacity: 1, x: 0, y: 0 }
                        : { opacity: 0, x: isLeft ? -60 : 60, y: 20 }
                }
                transition={{
                    duration: 0.8,
                    ease: [0.25, 0.1, 0.25, 1],
                    delay: 0.4,
                }}
            >
                <div
                    className={`bg-white dark:bg-[#1E2028] border ${item.borderColor} rounded-xl p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-200 group`}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <span
                            className={`text-xs tabular-nums font-black uppercase tracking-widest ${item.accentColor}`}
                        >
                            Phase {item.phase}
                        </span>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            {item.period}
                        </span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
                        {item.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {item.story}
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
