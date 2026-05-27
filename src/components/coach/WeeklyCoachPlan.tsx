"use client";

import React, { useState } from "react";
import { Award, ShieldAlert, Sparkles, CheckSquare, Square, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface ActionItem {
    label: string;
    detail: string;
    ctaHref?: string;
}

interface WeeklyCoachPlanProps {
    plan: {
        id: string;
        title: string;
        summary: string;
        keepDoing: string | null;
        fixNext: string | null;
        nextActions: ActionItem[];
    };
}

export function WeeklyCoachPlan({ plan }: WeeklyCoachPlanProps) {
    const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

    const toggleItem = (idx: number) => {
        setCheckedItems(prev => ({
            ...prev,
            [idx]: !prev[idx]
        }));
    };

    return (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 dark:border-gold/15 bg-gradient-to-br from-amber-500/[0.04] via-transparent to-transparent dark:from-gold/[0.02] dark:to-transparent backdrop-blur-md p-6 space-y-6 shadow-sm">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Sparkles className="text-amber-500 dark:text-gold" size={18} />
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-gold bg-amber-500/10 dark:bg-gold/10 px-2.5 py-0.5 rounded-md">
                            Weekly Coach Action Plan
                        </span>
                    </div>
                    <h3 className="text-xl font-black text-gray-800 dark:text-white leading-tight">
                        {plan.title}
                    </h3>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {plan.summary}
                    </p>
                </div>
            </div>

            {/* Keep Doing & Fix Next side-by-side blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plan.keepDoing && (
                    <div className="p-4 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.01] border border-emerald-500/15 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs uppercase tracking-wide">
                            <Award size={16} />
                            <span>Keep Doing (Edge Strengths)</span>
                        </div>
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 leading-relaxed">
                            {plan.keepDoing}
                        </p>
                    </div>
                )}
                
                {plan.fixNext && (
                    <div className="p-4 bg-amber-500/[0.03] dark:bg-gold/[0.01] border border-amber-500/15 dark:border-gold/10 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-gold font-extrabold text-xs uppercase tracking-wide">
                            <ShieldAlert size={16} />
                            <span>Fix Next (Edge Leaks)</span>
                        </div>
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 leading-relaxed">
                            {plan.fixNext}
                        </p>
                    </div>
                )}
            </div>

            {/* Next Week Checklist */}
            <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-gray-600 dark:text-gray-400">
                    Next-Week Checklist
                </h4>
                <div className="space-y-2">
                    {plan.nextActions.map((action, idx) => {
                        const isChecked = checkedItems[idx] || false;
                        return (
                            <div 
                                key={idx}
                                onClick={() => toggleItem(idx)}
                                className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all duration-300 ${
                                    isChecked 
                                        ? "bg-gray-50/50 dark:bg-white/[0.01] border-gray-200 dark:border-white/5 opacity-60" 
                                        : "bg-white dark:bg-[#151925] border-gray-200 dark:border-white/10 hover:border-amber-500/30 dark:hover:border-gold/30 hover:shadow-sm"
                                }`}
                            >
                                <div className="shrink-0 mt-0.5 text-amber-500 dark:text-gold">
                                    {isChecked ? <CheckSquare size={18} /> : <Square size={18} />}
                                </div>
                                <div className="space-y-0.5 flex-1 min-w-0">
                                    <p className={`text-sm font-black text-gray-800 dark:text-white leading-tight ${isChecked ? "line-through" : ""}`}>
                                        {action.label}
                                    </p>
                                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                        {action.detail}
                                    </p>
                                </div>
                                {action.ctaHref && !isChecked && (
                                    <div className="shrink-0 self-center pl-2">
                                        <Link href={action.ctaHref} onClick={(e) => e.stopPropagation()}>
                                            <Button 
                                                variant="ghost" 
                                                className="h-8 w-8 p-0 rounded-lg text-gray-500 hover:text-amber-500 dark:hover:text-gold hover:bg-gray-100 dark:hover:bg-white/5"
                                            >
                                                <ExternalLink size={14} />
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
