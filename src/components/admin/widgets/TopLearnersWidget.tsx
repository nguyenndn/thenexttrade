"use client";

import { Trophy } from "lucide-react";
import { motion } from "framer-motion";

interface TopUser {
    id: string;
    name: string | null;
    image: string | null;
    email: string | null;
    progressCount: number;
}

const RANK_STYLES = [
    { bg: "bg-amber-400", ring: "ring-amber-400/30", text: "text-amber-950" },
    { bg: "bg-gray-300", ring: "ring-gray-300/30", text: "text-gray-700" },
    { bg: "bg-orange-400", ring: "ring-orange-400/30", text: "text-orange-950" },
];

const itemVariants = {
    hidden: { opacity: 0, x: -16 },
    visible: (i: number) => ({
        opacity: 1,
        x: 0,
        transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
    }),
};

export function TopLearnersWidget({ users }: { users: TopUser[] }) {
    const maxProgress = Math.max(...users.map(u => u.progressCount), 1);

    return (
        <div className="bg-white dark:bg-[#0B0E14] border border-gray-200 dark:border-white/10 rounded-xl p-6 h-full flex flex-col shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" aria-hidden="true" />
                Top Learners
            </h3>

            <div className="space-y-3 flex-1">
                {users.map((user, index) => {
                    const rank = RANK_STYLES[index];
                    const progressWidth = (user.progressCount / maxProgress) * 100;

                    return (
                        <motion.div
                            key={user.id}
                            custom={index}
                            initial="hidden"
                            animate="visible"
                            variants={itemVariants}
                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                            <div className="flex-shrink-0 relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                                    {user.name?.charAt(0) || "U"}
                                </div>
                                {rank && (
                                    <div className={`absolute -top-1 -right-1 ${rank.bg} ${rank.text} w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] font-black ring-2 ${rank.ring}`}>
                                        {index + 1}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                                    {user.name || "Anonymous"}
                                </div>
                                {/* Progress bar */}
                                <div className="mt-1.5 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressWidth}%` }}
                                        transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full"
                                    />
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                                    {user.progressCount}
                                </div>
                                <div className="text-[10px] text-gray-400 uppercase font-medium">
                                    Lessons
                                </div>
                            </div>
                        </motion.div>
                    );
                })}

                {users.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                        <Trophy className="w-10 h-10 mb-3 opacity-30" />
                        <p className="font-medium">No active learners yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
