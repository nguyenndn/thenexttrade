"use client";

import { Sparkles } from "lucide-react";
import { DisciplineCockpit } from "./discipline-os/DisciplineCockpit";

interface TrustMetricsProps {
    metrics?: {
        tradingGuides?: number;
        academyLessons?: number;
        connectedAccounts?: number;
        syncedTrades?: number;
        coachReports?: number;
    };
}

export function HomeTrustMetrics({ metrics: _metrics }: TrustMetricsProps) {
    return (
        <section className="relative w-full overflow-hidden bg-white dark:bg-transparent pt-2 sm:pt-4 pb-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* All-in-One Discipline OS Cockpit (Top Status Bar + Manifesto Header + 3 Foundational Pillars) */}
                <DisciplineCockpit />

                {/* 3. Mission Philosophy Note */}
                <div className="mt-8 text-center">
                    <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                        <Sparkles size={14} className="text-amber-500 shrink-0" />
                        <span>&ldquo;Discipline is not willpower. It is an operating system.&rdquo;</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
