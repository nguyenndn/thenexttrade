"use client";

import {
    ArrowRight,
    CheckCircle2,
    Target,
    TrendingUp,
    TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import type { Archetype } from "@/config/trading-style-data";

interface ArchetypeCardProps {
    archetype: Archetype;
    showMoves?: boolean;
}

/**
 * The matched archetype: name, summary, strengths / weaknesses /
 * common mistakes / focus, plus the keystone + follow-up moves.
 * `showMoves` is disabled on the dashboard card (kept compact).
 */
export function ArchetypeCard({
    archetype,
    showMoves = true,
}: ArchetypeCardProps) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                    {archetype.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    {archetype.summary}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <section>
                    <h4 className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-emerald-600 dark:text-primary">
                        <TrendingUp size={14} /> What&apos;s going well
                    </h4>
                    <ul className="space-y-1.5">
                        {archetype.strengths.map((s) => (
                            <li
                                key={s}
                                className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"
                            >
                                <CheckCircle2
                                    size={15}
                                    className="mt-0.5 shrink-0 text-emerald-500"
                                />
                                <span>{s}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section>
                    <h4 className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#D9531A] dark:text-[#E5673B]">
                        <TriangleAlert size={14} /> What&apos;s holding you back
                    </h4>
                    <ul className="space-y-1.5">
                        {archetype.weaknesses.map((w) => (
                            <li
                                key={w}
                                className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"
                            >
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D9531A]/70" />
                                <span>{w}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            <section>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                    <TriangleAlert size={14} /> Your most common mistakes
                </h4>
                <ul className="space-y-1.5">
                    {archetype.commonMistakes.map((m) => (
                        <li
                            key={m}
                            className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"
                        >
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400/70" />
                            <span>{m}</span>
                        </li>
                    ))}
                </ul>
            </section>

            <section>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-amber-600 dark:text-gold">
                    <Target size={14} /> Where to focus
                </h4>
                <div className="flex flex-wrap gap-2">
                    {archetype.focus.map((f) => (
                        <span
                            key={f}
                            className="rounded-full border border-amber-500/25 bg-amber-500/[0.07] px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300"
                        >
                            {f}
                        </span>
                    ))}
                </div>
            </section>

            {showMoves && (
                <section>
                    <h4 className="mb-3 flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                        Your first move
                    </h4>
                    <Link
                        href={archetype.keystone.href}
                        className="group block rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/[0.09] to-orange-500/[0.06] p-4 transition-all hover:border-amber-500/60 hover:shadow-lg hover:shadow-amber-500/10"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-base font-black text-gray-900 dark:text-white">
                                    {archetype.keystone.label}
                                </p>
                                <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                    {archetype.keystone.why}
                                </p>
                            </div>
                            <ArrowRight
                                size={18}
                                className="mt-1 shrink-0 text-amber-600 transition-transform group-hover:translate-x-0.5 dark:text-gold"
                            />
                        </div>
                    </Link>

                    <ul className="mt-3 space-y-2">
                        {archetype.moves.map((m) => (
                            <li key={m.label}>
                                <Link
                                    href={m.href}
                                    className="group flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 px-3.5 py-3 transition-all hover:border-amber-500/40 hover:bg-amber-500/[0.04] dark:border-white/[0.06] dark:bg-white/[0.03]"
                                >
                                    <ArrowRight
                                        size={14}
                                        className="mt-0.5 shrink-0 text-amber-600 transition-transform group-hover:translate-x-0.5 dark:text-gold"
                                    />
                                    <span>
                                        <span className="block text-sm font-bold text-gray-900 dark:text-white">
                                            {m.label}
                                        </span>
                                        <span className="block text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                                            {m.why}
                                        </span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}
