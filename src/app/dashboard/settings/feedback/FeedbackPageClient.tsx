"use client";

import { Bug, Lightbulb, Clock, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface FeedbackItem {
    id: string;
    type: string;
    message: string;
    status: string;
    createdAt: string | Date;
}

interface FeedbackPageClientProps {
    feedbacks: FeedbackItem[];
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    OPEN: { label: "Open", color: "text-blue-500 bg-blue-500/10", icon: Clock },
    IN_PROGRESS: { label: "In Progress", color: "text-amber-500 bg-amber-500/10", icon: Loader2 },
    RESOLVED: { label: "Resolved", color: "text-primary bg-primary/10", icon: CheckCircle2 },
    CLOSED: { label: "Closed", color: "text-gray-600 bg-gray-500/10", icon: AlertCircle },
};

export default function FeedbackPageClient({ feedbacks }: FeedbackPageClientProps) {
    if (feedbacks.length === 0) {
        return (
            <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                <div className="text-center py-20 text-gray-500">
                    <Bug size={48} className="mx-auto mb-4 opacity-50" />
                    <h3 className="text-base font-bold text-gray-700 dark:text-white">No feedback yet</h3>
                    <p className="text-sm mt-1">Use the floating chat button to submit bug reports or feature requests.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {feedbacks.map((fb) => {
                const isBug = fb.type === "BUG";
                const status = statusConfig[fb.status] || statusConfig.OPEN;
                const StatusIcon = status.icon;

                return (
                    <div
                        key={fb.id}
                        className={cn(
                            "bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 p-5 shadow-sm",
                            "border-l-4",
                            isBug ? "border-l-red-500" : "border-l-amber-500"
                        )}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-2.5 mb-2">
                                <div className={cn(
                                    "p-1.5 rounded-lg",
                                    isBug ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                                )}>
                                    {isBug ? <Bug size={16} /> : <Lightbulb size={16} />}
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                                    {isBug ? "Bug Report" : "Feature Request"}
                                </span>
                            </div>
                            <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold", status.color)}>
                                <StatusIcon size={12} />
                                {status.label}
                            </div>
                        </div>

                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mt-1">
                            {fb.message}
                        </p>

                        <p className="text-[11px] text-gray-500 mt-3">
                            {formatDistanceToNow(new Date(fb.createdAt))} ago
                        </p>
                    </div>
                );
            })}
        </div>
    );
}
