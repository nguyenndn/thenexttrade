"use client";

import { PremiumCard } from "@/components/ui/PremiumCard";
import { BookOpen, FileText, HelpCircle, BarChart2, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SectionHeader } from "@/components/ui/SectionHeader";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function AIStudioPage() {
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
                <div className="flex flex-col gap-2">
                    <h1 className="sr-only">AI Content Studio</h1>
                <p className="text-base text-primary font-bold">
                        Supercharge your course creation with AI. Generate structures, lessons, and quizzes in seconds.
                    </p>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {/* Manage Levels */}
                <motion.div variants={item} className="h-full">
                    <Link href="/admin/ai-studio/levels" className="block h-full group">
                        <PremiumCard className="h-full p-6 relative overflow-hidden transition-shadow hover:shadow-md hover:shadow-primary/10 group-hover:border-primary/30">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <BookOpen size={64} className="text-primary" />
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                                <BookOpen size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Manage Levels</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Create and organize course structures. Generate modules outlines with AI.
                            </p>
                            <div className="flex items-center text-primary font-semibold text-sm">
                                Go to Levels <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </PremiumCard>
                    </Link>
                </motion.div>

                {/* Create Lesson */}
                <motion.div variants={item} className="h-full">
                    <Link href="/admin/ai-studio/lessons" className="block h-full group">
                        <PremiumCard className="h-full p-6 relative overflow-hidden transition-shadow hover:shadow-md hover:shadow-blue-500/10 group-hover:border-blue-500/30">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <FileText size={64} className="text-blue-500" />
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                <FileText size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Create Lesson</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Generate comprehensive lesson content with markdown and examples.
                            </p>
                            <div className="flex items-center text-blue-500 font-semibold text-sm">
                                Go to Lessons <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </PremiumCard>
                    </Link>
                </motion.div>

                {/* Create Quiz */}
                <motion.div variants={item} className="h-full">
                    <Link href="/admin/ai-studio/quizzes" className="block h-full group">
                        <PremiumCard className="h-full p-6 relative overflow-hidden transition-shadow hover:shadow-md hover:shadow-purple-500/10 group-hover:border-purple-500/30">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <HelpCircle size={64} className="text-purple-500" />
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-4 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                <HelpCircle size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Create Quiz</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Generate multiple-choice questions based on topics or lessons.
                            </p>
                            <div className="flex items-center text-purple-500 font-semibold text-sm">
                                Go to Quizzes <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </PremiumCard>
                    </Link>
                </motion.div>

                {/* Usage Stats (Placeholder) */}
                <motion.div variants={item} className="h-full">
                    <div className="block h-full group opacity-70">
                        <PremiumCard className="h-full p-6 relative overflow-hidden border-dashed">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <BarChart2 size={64} className="text-gray-400" />
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 mb-4">
                                <BarChart2 size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Usage Stats</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Track token usage and AI generation history. (Coming Soon)
                            </p>
                            <div className="flex items-center text-gray-400 font-semibold text-sm">
                                View Stats <ArrowRight size={16} className="ml-1" />
                            </div>
                        </PremiumCard>
                    </div>
                </motion.div>
            </motion.div>

            {/* Recent Activity Section (Mockup) */}
            <div className="mt-12">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <Zap className="mr-2 text-yellow-500" size={20} />
                    Recent Activity
                </h2>
                <PremiumCard className="overflow-hidden">
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <p>No recent activity generated.</p>
                        <p className="text-sm mt-1">Start by creating a new level or lesson.</p>
                    </div>
                </PremiumCard>
            </div>
        </div>
    );
}
