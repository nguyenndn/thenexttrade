"use client";

import { ProGate } from "./ProGate";
import {
 AlertTriangle,
 TrendingDown,
 BarChart3,
 Clock,
 Shield,
 Frown,
 Calendar,
 ClipboardCheck,
 ClipboardX,
 ShieldOff,
 Loader2,
} from "lucide-react";
import type { Insight } from "@/lib/smart-analytics";

const iconMap: Record<string, any> = {
 AlertTriangle, TrendingDown, BarChart3, Clock, Shield,
 Frown, Calendar, ClipboardCheck, ClipboardX, ShieldOff,
};

function InsightCard({ insight, type }: { insight: Insight; type: "issue" | "strength" }) {
 const Icon = iconMap[insight.icon] || AlertTriangle;
 const isIssue = type === "issue";

 const severityColors = {
 critical: "border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5",
 warning: "border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5",
 strength: "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5",
 };

 const severityBadge = {
 critical: "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400",
 warning: "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400",
 strength: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
 };

 return (
 <div className={`rounded-xl border p-4 ${severityColors[insight.severity]}`}>
 <div className="flex items-start gap-3">
 <div className={`shrink-0 rounded-lg p-2 ${isIssue ? "bg-red-100 dark:bg-red-500/10 text-red-500 dark:text-red-400" : "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400"}`}>
 <Icon className="h-5 w-5" />
 </div>
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2">
 <h4 className="font-bold text-sm text-gray-800 dark:text-white">{insight.title}</h4>
 <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${severityBadge[insight.severity]}`}>
 {insight.severity}
 </span>
 </div>
 <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{insight.description}</p>
 <p className="mt-2 text-xs font-mono text-gray-400 dark:text-gray-500">{insight.metric}</p>
 </div>
 </div>
 </div>
 );
}

interface EdgeLeakDetectorContentProps {
 issues: Insight[];
 strengths: Insight[];
 loading?: boolean;
}

function EdgeLeakDetectorContent({ issues, strengths, loading }: EdgeLeakDetectorContentProps) {
 if (loading) {
 return (
 <div className="flex items-center justify-center py-12">
 <Loader2 className="h-6 w-6 animate-spin text-gray-400 dark:text-gray-500" />
 </div>
 );
 }

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex items-center gap-3">
 <div className="rounded-lg bg-red-50 dark:bg-red-500/10 p-2">
 <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
 </div>
 <div>
 <h3 className="text-base font-bold text-gray-800 dark:text-white">Edge Leak Detector</h3>
 <p className="text-sm text-gray-500 dark:text-gray-400">
 Patterns costing you money — detected from your trade data
 </p>
 </div>
 </div>

 {/* Issues */}
 {issues.length > 0 ? (
 <div className="space-y-3">
 <h4 className="text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-wider">
 🔴 Edge Leaks ({issues.length})
 </h4>
 {issues.map((i) => (
 <InsightCard key={i.id} insight={i} type="issue" />
 ))}
 </div>
 ) : (
 <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 p-6 text-center">
 <Shield className="mx-auto h-8 w-8 text-emerald-500 dark:text-emerald-400" />
 <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">No edge leaks detected. Keep it up!</p>
 </div>
 )}

 {/* Strengths */}
 {strengths.length > 0 && (
 <div className="space-y-3">
 <h4 className="text-xs font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">
 🟢 Strengths ({strengths.length})
 </h4>
 {strengths.map((s) => (
 <InsightCard key={s.id} insight={s} type="strength" />
 ))}
 </div>
 )}
 </div>
 );
}

interface EdgeLeakDetectorProps extends EdgeLeakDetectorContentProps {
 accountId?: string;
}

/**
 * Edge Leak Detector — Pro-gated wrapper.
 * Receives insights from parent (Intelligence page).
 */
export function EdgeLeakDetector({
 issues,
 strengths,
 loading,
 accountId,
}: EdgeLeakDetectorProps) {
 return (
 <ProGate feature="edge-leak" accountId={accountId}>
 <EdgeLeakDetectorContent
 issues={issues}
 strengths={strengths}
 loading={loading}
 />
 </ProGate>
 );
}
