"use client";

import { CheckCircle2, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    evaluateTradeReview,
    type TradeReviewCheckable,
} from "@/lib/journal/trade-review-status";

interface ReviewStatusCellProps {
    entry: TradeReviewCheckable & { status?: string | null };
    onReviewClick: () => void;
    onInspectClick: () => void;
}

export function ReviewStatusCell({
    entry,
    onReviewClick,
    onInspectClick,
}: ReviewStatusCellProps) {
    if (entry.status === "OPEN") {
        return (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 border border-sky-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                Open
            </span>
        );
    }

    const evaluation = evaluateTradeReview(entry);

    if (evaluation.isReviewed) {
        return (
            <TooltipProvider delayDuration={150}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onInspectClick}
                            className="h-7 px-2.5 rounded-lg inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20"
                        >
                            <CheckCircle2 size={13} className="shrink-0" />
                            <span>Reviewed</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-900 text-white border-none text-xs font-semibold rounded-lg px-2.5 py-1.5">
                        Setup &amp; discipline verified — click to view details
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <TooltipProvider delayDuration={150}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onReviewClick}
                        className="h-7 px-2.5 rounded-lg inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25"
                    >
                        <ClipboardList size={13} className="shrink-0" />
                        <span>Needs Review</span>
                        <span className="font-mono tabular-nums text-[10px] opacity-80">
                            {evaluation.completedSteps}/3
                        </span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white border-none text-xs font-semibold rounded-lg px-2.5 py-1.5">
                    Missing: {evaluation.missingLabels.join(", ")} — click to grade
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
