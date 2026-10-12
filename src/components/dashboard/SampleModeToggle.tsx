"use client";

import { FlaskConical, X } from "lucide-react";
import { useSampleMode } from "@/components/providers/SampleModeProvider";
import { Button } from "@/components/ui/Button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function SampleModeToggle() {
    const { isSampleMode, toggleSampleMode } = useSampleMode();

    return (
        <TooltipProvider delayDuration={150}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={toggleSampleMode}
                        aria-label={
                            isSampleMode
                                ? "Exit sample data mode"
                                : "Explore sample data playground"
                        }
                        className={cn(
                            "h-9 px-2.5 sm:px-3 rounded-lg transition-all duration-200 border text-xs font-semibold gap-1.5",
                            isSampleMode
                                ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 shadow-sm shadow-amber-500/10"
                                : "border-dashboard text-gray-600 dark:text-gray-300 hover:border-amber-500/40 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/5"
                        )}
                    >
                        {isSampleMode ? (
                            <>
                                <span className="relative flex h-2 w-2 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                                </span>
                                <FlaskConical size={14} className="shrink-0 text-amber-500" />
                                <span className="hidden sm:inline font-bold">Sample Mode</span>
                                <span className="hidden md:inline text-[11px] px-1.5 py-0.5 rounded-lg bg-amber-500/20 font-bold uppercase tracking-wider">
                                    ON
                                </span>
                                <X
                                    size={13}
                                    className="ml-0.5 text-amber-600/70 dark:text-amber-400/70 hover:text-amber-600 dark:hover:text-amber-300 transition-colors"
                                />
                            </>
                        ) : (
                            <>
                                <FlaskConical
                                    size={14}
                                    className="shrink-0 text-gray-500 dark:text-gray-400 group-hover:text-amber-500"
                                />
                                <span className="hidden sm:inline">Sample Data</span>
                            </>
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent
                    side="bottom"
                    align="end"
                    className="max-w-[240px] bg-gray-950 px-3 py-2 text-xs leading-relaxed text-white shadow-xl dark:bg-white dark:text-gray-950"
                >
                    {isSampleMode
                        ? "Currently viewing 25 sample trades. Click to exit and return to live account data."
                        : "Preview TheNextTrade with 25 curated trades, AI insights, and telemetry without connecting MT5."}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
