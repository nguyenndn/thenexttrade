"use client";

import { motion } from "framer-motion";
import LevelCard from "./LevelCard";

interface LevelListProps {
    levels: any[];
}

export default function LevelList({ levels }: LevelListProps) {
    if (levels.length === 0) {
        return (
            <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No levels found.</p>
                <p className="text-sm text-gray-400">Creates a new level to get started with your course.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {levels.map((level, index) => (
                <motion.div
                    key={level.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <LevelCard level={level} />
                </motion.div>
            ))}
        </div>
    );
}
