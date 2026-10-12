"use client";

import Link from "next/link";
import { FlaskConical, Cable, X } from "lucide-react";
import { useSampleMode } from "@/components/providers/SampleModeProvider";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export function SampleModeBanner() {
    const { isSampleMode, disableSampleMode } = useSampleMode();

    if (!isSampleMode) return null;

    return (
        <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3 sm:p-4 mb-4 transition-all duration-300">
            <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Left Info Section */}
                <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/30">
                        <FlaskConical size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                                Playground Mode
                            </span>
                            <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                25 Sample Trades
                            </span>
                        </div>
                        <p className="mt-0.5 text-xs sm:text-sm text-gray-700 dark:text-gray-200 font-medium">
                            Exploring full platform telemetry and AI Coach diagnostics. Real data is unchanged.
                        </p>
                    </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                    <Link
                        href="/dashboard/accounts?action=add"
                        className={cn(
                            buttonVariants({ variant: "primary", size: "sm" }),
                            "h-8 gap-1.5 px-3 text-xs font-bold shadow-sm shadow-amber-500/20"
                        )}
                    >
                        <Cable size={14} />
                        <span>Connect Real MT5</span>
                    </Link>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={disableSampleMode}
                        aria-label="Exit sample mode"
                        className="h-8 gap-1.5 rounded-lg border-amber-500/30 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-amber-500/10 hover:border-amber-500/50"
                    >
                        <X size={14} />
                        <span>Exit Demo</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
