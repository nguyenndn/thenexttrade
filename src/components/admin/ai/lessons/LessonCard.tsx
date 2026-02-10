"use client";

import { PremiumCard } from "@/components/ui/PremiumCard";
import { Clock, FileText, MoreVertical, PlayCircle } from "lucide-react";
import Link from "next/link";

interface LessonCardProps {
    lesson: {
        id: string;
        title: string;
        description: string | null;
        duration: number; // in minutes
        createdAt: Date;
    };
}

export default function LessonCard({ lesson }: LessonCardProps) {
    return (
        <PremiumCard className="flex flex-col h-full group hover:border-primary/50 transition-all cursor-pointer">
            <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                    <div className="inline-flex items-center px-3 py-1 bg-blue-500/10 text-blue-500 text-xs font-bold rounded-full uppercase tracking-wider">
                        Lesson
                    </div>
                    <button className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors">
                        <MoreVertical size={16} />
                    </button>
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {lesson.title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4 h-10">
                    {lesson.description || "No description provided."}
                </p>

                <div className="flex items-center text-gray-400 text-xs space-x-4">
                    <div className="flex items-center">
                        <Clock size={14} className="mr-1.5" />
                        <span>{lesson.duration} mins</span>
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] flex justify-between items-center">
                <Link
                    href={`/admin/ai-studio/lessons/${lesson.id}`}
                    className="text-sm font-semibold text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors flex items-center w-full justify-between"
                >
                    Edit Content
                    <FileText size={16} className="text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </PremiumCard>
    );
}
