"use client";

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
            </div>
        </section>
    );
}
