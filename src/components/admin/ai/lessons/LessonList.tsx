"use client";

import { motion } from "framer-motion";
import LessonRow from "./LessonRow";

interface LessonListProps {
    lessons: any[];
}

export default function LessonList({ lessons }: LessonListProps) {
    if (lessons.length === 0) {
        return (
            <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No lessons found in this module.</p>
                <p className="text-sm text-gray-400">Generate lessons using AI to fill this module.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-3">
            {lessons.map((lesson, index) => (
                <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                >
                    <LessonRow lesson={lesson} index={index + 1} />
                </motion.div>
            ))}
        </div>
    );
}
