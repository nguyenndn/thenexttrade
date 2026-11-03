import type { LucideIcon } from "lucide-react";
import { CalendarCheck, GraduationCap } from "lucide-react";

/**
 * Retention Hook — a homepage section that answers the question:
 * "Why should a new user COME BACK next week?"
 *
 * Single source of truth for copy + CTA of retention sections.
 * Changing text here updates the section without touching components —
 * enables A/B testing by config swap only.
 */
export interface RetentionHook {
    /** Stable identifier — used for analytics + A/B bucketing */
    id: string;
    /** Section heading (may contain `highlight` substring for gold accent) */
    title: string;
    /** Substring of `title` to render in gold — must be an exact substring */
    highlight: string;
    /** Supporting paragraph under the heading */
    description: string;
    /** Lucide icon for the eyebrow badge */
    icon: LucideIcon;
    /** Default CTA destination (used for logged-out users) */
    href: string;
    /** Default CTA label (used for logged-out users) */
    ctaText: string;
    /** Sort priority — lower renders first (reserved for future ordering) */
    priority: number;
}

export const RETENTION_HOOKS: RetentionHook[] = [
    {
        id: "weekly-coach",
        title: "Your week, audited. One fix at a time.",
        highlight: "One fix at a time.",
        description:
            "Every week, your journal is audited for the single costliest execution leak — then you get one prescribed rule to practice across your next 10 trades.",
        icon: CalendarCheck,
        href: "/auth/signup?source=home_weekly_coach",
        ctaText: "Start Free Journal",
        priority: 1,
    },
    {
        id: "academy",
        title: "From first trade to funded consistency — 3 levels, one path.",
        highlight: "3 levels, one path.",
        description:
            "A structured curriculum that meets you where you are: Foundations, Execution, Funded. Each level unlocks the next — no guessing what to study.",
        icon: GraduationCap,
        href: "/auth/signup?source=home_academy",
        ctaText: "Start Learning Free",
        priority: 2,
    },
];

/**
 * Look up a retention hook by id.
 * Returns `undefined` if not found — callers must guard.
 */
export function getRetentionHook(id: string): RetentionHook | undefined {
    return RETENTION_HOOKS.find((hook) => hook.id === id);
}
