"use client";

import { Bot, Gauge } from "lucide-react";
import type { PsychologyDiagnosticReport } from "@/lib/analytics/psychology-engine.server";
import { DataConfidenceBadge } from "@/components/insights/DataConfidenceBadge";
import type { DataConfidenceView } from "@/lib/trader-growth/types";
import { EmptyStateCTAs } from "@/components/ui/EmptyStateCTAs";
import { ExecutionDiagnosticCards } from "./ExecutionDiagnosticCards";

interface TradingPsychologyPanelProps {
    data: PsychologyDiagnosticReport;
    confidence?: DataConfidenceView;
}

export function TradingPsychologyPanel({
    data,
    confidence,
}: TradingPsychologyPanelProps) {
    if (data.totalTrades === 0) {
        return (
            <div className="p-8 rounded-xl bg-white dark:bg-[#1E2028] border border-dashboard dark:border-white/[0.08] shadow-sm text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Gauge className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                    <h3 className="text-base font-bold text-gray-700 dark:text-white">
                        No Execution Telemetry Yet
                    </h3>
                    <p className="text-xs text-gray-500">
                        Sync your MT5 account or log closed trades to measure hold duration symmetry, realized payoff expectancy, and setup streaks.
                    </p>
                </div>
                <EmptyStateCTAs
                    primary={{
                        label: "Connect MT5 Account",
                        href: "/dashboard/accounts",
                    }}
                    secondary={{
                        label: "Log First Trade",
                        href: "/dashboard/journal",
                    }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-2 md:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Gauge size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-white">
                                Execution & Payoff Diagnostic
                            </h3>
                            {data.automatedAccount && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/[0.06] text-[10px] font-bold uppercase text-gray-600 dark:text-gray-300">
                                    <Bot className="w-3 h-3" />
                                    EA Telemetry
                                </span>
                            )}
                        </div>
                        <p className="hidden sm:block text-xs text-gray-500">
                            Hold duration symmetry, realized payoff math, and basket-aware setup cadence
                        </p>
                    </div>
                </div>
                {confidence && (
                    <div className="shrink-0 self-start sm:self-auto">
                        <DataConfidenceBadge confidence={confidence} />
                    </div>
                )}
            </div>

            <ExecutionDiagnosticCards data={data} />
        </div>
    );
}
