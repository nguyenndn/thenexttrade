"use client";

import { DisciplineCockpit } from "./discipline-os/DisciplineCockpit";

/**
 * Transparency + discipline section, rendered directly under the hero.
 *
 * There is deliberately no `metrics` prop. It used to accept platform-wide
 * counts (total journal entries, total accounts, weekly reports) that were
 * never displayed — and that would have read as user counts if anyone had
 * wired them up. One account in this database holds 30,000+ entries, so any
 * such figure would have been a lie told to visitors. Product facts (guides,
 * lessons, calculators) are stated as constants where they appear instead.
 *
 * The queries feeding that prop were removed from `src/app/page.tsx` in the
 * same change. Do not reintroduce a total-count contract here.
 */
export function HomeTrustMetrics() {
    return (
        <section className="relative w-full overflow-hidden bg-white dark:bg-transparent pt-2 sm:pt-4 pb-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* All-in-One Discipline OS Cockpit (Top Status Bar + Manifesto Header + 3 Foundational Pillars) */}
                <DisciplineCockpit />
            </div>
        </section>
    );
}
