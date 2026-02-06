"use client";

import { Lightbulb, Info } from "lucide-react";

interface SessionRecommendationsProps {
    recommendations: string[];
}

export function SessionRecommendations({ recommendations }: SessionRecommendationsProps) {
    if (recommendations.length === 0) return null;

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-500/10 dark:to-blue-500/10 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Lightbulb size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                        AI Insights
                    </h3>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                        Based on your historical performance
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                {recommendations.map((rec, index) => (
                    <div key={index} className="flex gap-3 items-start bg-white dark:bg-[#1E2028] p-3 rounded-xl border border-indigo-100 dark:border-indigo-500/10 shadow-sm">
                        <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {rec}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
