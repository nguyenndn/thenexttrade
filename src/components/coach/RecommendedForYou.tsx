"use client";

import React from "react";
import { PlayCircle, BookOpen, GraduationCap, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface Recommendation {
    id: string;
    type: "ACADEMY_LESSON" | "ARTICLE";
    slug: string;
    title: string;
    url: string;
    reason: string;
    signalType: string;
    estimatedMinutes?: number;
}

interface RecommendedForYouProps {
    recommendations: Recommendation[];
}

export function RecommendedForYou({ recommendations }: RecommendedForYouProps) {
    if (!recommendations || recommendations.length === 0) return null;

    return (
        <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-gray-100 dark:border-white/5 flex items-center gap-2">
                <GraduationCap className="text-amber-500 dark:text-gold shrink-0" size={20} />
                <h3 className="text-base font-bold text-gray-800 dark:text-white">
                    Recommended For Your Edge
                </h3>
            </div>
            
            <div className="divide-y divide-gray-100 dark:divide-white/5">
                {recommendations.map((rec) => {
                    const isLesson = rec.type === "ACADEMY_LESSON";

                    return (
                        <div 
                            key={rec.id} 
                            className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-white/[0.01] group"
                        >
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-widest ${
                                        isLesson 
                                            ? "bg-[#2F80ED]/10 text-[#2F80ED] border border-[#2F80ED]/15" 
                                            : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/15"
                                    }`}>
                                        {isLesson ? (
                                            <>
                                                <PlayCircle size={10} /> Lesson
                                            </>
                                        ) : (
                                            <>
                                                <BookOpen size={10} /> Article
                                            </>
                                        )}
                                    </span>
                                    {rec.estimatedMinutes && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                                            <Clock size={10} /> {rec.estimatedMinutes} min
                                        </span>
                                    )}
                                </div>
                                <h4 className="text-base font-black text-gray-800 dark:text-white leading-tight group-hover:text-amber-500 dark:group-hover:text-gold transition-colors">
                                    {rec.title}
                                </h4>
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 italic">
                                    Coach Insight: "{rec.reason}"
                                </p>
                            </div>

                            <div className="shrink-0 self-start md:self-center">
                                <Link href={rec.url}>
                                    <Button 
                                        variant="outline" 
                                        className="h-10 px-4 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 active:scale-95 transition-all duration-300 hover:text-amber-500 dark:hover:text-gold"
                                    >
                                        <span>{isLesson ? "Start Study" : "Read Post"}</span>
                                        <ChevronRight size={14} />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
