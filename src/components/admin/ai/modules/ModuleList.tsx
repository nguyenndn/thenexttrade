"use client";

import { motion } from "framer-motion";
import ModuleCard from "./ModuleCard";

interface ModuleListProps {
    modules: any[];
    levelId: string;
}

export default function ModuleList({ modules, levelId }: ModuleListProps) {
    if (modules.length === 0) {
        return (
            <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No modules found in this level.</p>
                <p className="text-sm text-gray-400">Generate modules using AI to structure your course.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((module, index) => (
                <motion.div
                    key={module.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <ModuleCard module={module} levelId={levelId} />
                </motion.div>
            ))}
        </div>
    );
}
