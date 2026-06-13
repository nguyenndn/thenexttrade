"use client";

import React from "react";
import { Sparkles, ArrowRight, TrendingUp, AlertTriangle, PlayCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface NextBestActionProps {
 action: {
 id: string;
 title: string;
 description: string;
 ctaLabel: string;
 ctaHref: string;
 priority: number;
 sourceSignalType?: string;
 };
}

export function NextBestActionPanel({ action }: NextBestActionProps) {
 const isWeakness = [
 "LOSS_STREAK",
 "SL_CLUSTER",
 "REVENGE_SIZE_UP",
 "LOW_PLAN_COMPLIANCE",
 "BE_HEAVY",
 "WEAK_SYMBOL",
 "WEAK_SESSION",
 "RECURRING_MISTAKE"
 ].includes(action.id);

 // Dynamic Icon Selection
 const getIcon = () => {
 if (action.id === "maintenance") return <TrendingUp className="text-emerald-500" size={24} />;
 if (isWeakness) return <AlertTriangle className="text-amber-500 dark:text-gold" size={24} />;
 if (action.id.includes("LESSON")) return <PlayCircle className="text-[#2F80ED]" size={24} />;
 return <Sparkles className="text-amber-500 dark:text-gold" size={24} />;
 };

 return (
 <div className="relative overflow-hidden rounded-2xl border border-amber-500/25 dark:border-gold/15 bg-gradient-to-r from-amber-500/[0.06] via-yellow-500/[0.04] to-transparent dark:from-gold/[0.03] dark:to-transparent backdrop-blur-md shadow-lg shadow-gold/[0.01] p-5 sm:p-6 transition-all duration-500 hover:border-amber-500/40 dark:hover:border-gold/30 hover:shadow-xl hover:shadow-gold/5 group">
 {/* Ambient decorative glow spot */}
 <div className="absolute -right-20 -top-20 w-48 h-48 bg-yellow-500/10 dark:bg-gold/5 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
 
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 relative z-10">
 <div className="flex items-start gap-4">
 <div className="p-3 bg-white dark:bg-[#0B0E14] border border-amber-500/20 dark:border-gold/20 rounded-xl shadow-md shrink-0 scale-100 group-hover:scale-110 transition-transform duration-500 group-hover:rotate-3">
 {getIcon()}
 </div>
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-gold bg-amber-500/10 dark:bg-gold/10 px-2 py-0.5 rounded-md">
 Next Action Plan
 </span>
 {isWeakness && (
 <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md animate-pulse">
 Coach Warning
 </span>
 )}
 </div>
 <h3 className="text-lg font-black text-gray-800 dark:text-white leading-tight">
 {action.title}
 </h3>
 <p className="text-sm font-medium text-gray-600 dark:text-gray-300 max-w-2xl">
 {action.description}
 </p>
 </div>
 </div>

 <div className="shrink-0 flex items-center sm:self-center self-start">
 <Link href={action.ctaHref}>
 <Button 
 className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-extrabold px-6 h-12 rounded-xl shadow-md shadow-amber-500/25 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2 border-0 group/btn"
 >
 <span>{action.ctaLabel}</span>
 <ArrowRight size={16} className="transition-transform group-hover/btn:translate-x-1" />
 </Button>
 </Link>
 </div>
 </div>
 </div>
 );
}
