"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Archetype } from "@/config/trading-style-data";

interface ArchetypeCardProps {
    archetype: Archetype;
    showHeader?: boolean;
    showMoves?: boolean;
    className?: string;
}

/**
 * Tactical & Behavioral Profile:
 * Strengths, Tactical Blindspots, Common Behavioral Traps, and Priority Focus Areas.
 */
export function ArchetypeCard({
    archetype,
    showHeader = false,
    showMoves = false,
    className,
}: ArchetypeCardProps) {
    return (
        <div className={className ? `space-y-6 ${className}` : "space-y-6"}>
            {showHeader && (
                <div>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                        {archetype.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                        {archetype.summary}
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <section>
                    <h4 className="mb-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Execution Strengths
                    </h4>
                    <ul className="space-y-2">
                        {archetype.strengths.map((s) => (
                            <li
                                key={s}
                                className="flex items-start gap-2 text-xs leading-relaxed text-gray-700 dark:text-gray-300"
                            >
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                <span>{s}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section>
                    <h4 className="mb-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                        Tactical Blindspots
                    </h4>
                    <ul className="space-y-2">
                        {archetype.weaknesses.map((w) => (
                            <li
                                key={w}
                                className="flex items-start gap-2 text-xs leading-relaxed text-gray-700 dark:text-gray-300"
                            >
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500/80" />
                                <span>{w}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            <section className="pt-2 border-t border-gray-100 dark:border-white/[0.06]">
                <h4 className="mb-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Common Behavioral Traps
                </h4>
                <ul className="space-y-2">
                    {archetype.commonMistakes.map((m) => (
                        <li
                            key={m}
                            className="flex items-start gap-2 text-xs leading-relaxed text-gray-700 dark:text-gray-300"
                        >
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400 dark:bg-gray-500" />
                            <span>{m}</span>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="pt-2 border-t border-gray-100 dark:border-white/[0.06]">
                <h4 className="mb-2.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-gold">
                    Priority Focus Areas
                </h4>
                <div className="flex flex-wrap gap-2">
                    {archetype.focus.map((f) => (
                        <span
                            key={f}
                            className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-2.5 py-1 text-xs font-medium text-amber-900 dark:text-amber-200"
                        >
                            {f}
                        </span>
                    ))}
                </div>
            </section>

            {showMoves && <ArchetypeMoves archetype={archetype} />}
        </div>
    );
}

/**
 * Keystone and follow-up actionable moves tailored to the archetype.
 */
export function ArchetypeMoves({
    archetype,
    className,
}: {
    archetype: Archetype;
    className?: string;
}) {
    return (
        <section className={className ? `space-y-3 ${className}` : "space-y-3"}>
            <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-gold">
                    Keystone First Move
                </span>
                <Link
                    href={archetype.keystone.href}
                    className="group mt-1.5 block rounded-xl border border-dashboard bg-white/90 p-4 shadow-sm backdrop-blur-sm transition-all hover:border-gray-400/50 hover:shadow-md dark:bg-[#151925]/90 dark:hover:border-white/20"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-sm font-bold text-gray-900 transition-colors group-hover:text-amber-700 dark:text-white dark:group-hover:text-gold">
                                {archetype.keystone.label}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                                {archetype.keystone.why}
                            </p>
                        </div>
                        <ArrowRight
                            size={14}
                            className="mt-0.5 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-700 dark:text-gray-500 dark:group-hover:text-gold"
                        />
                    </div>
                </Link>
            </div>

            {archetype.moves.length > 0 && (
                <div className="pt-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Follow-Up Action Steps
                    </span>
                    <ul className="mt-1.5 space-y-2">
                        {archetype.moves.map((m, idx) => (
                            <li key={m.label}>
                                <Link
                                    href={m.href}
                                    className="group flex items-start gap-3 rounded-xl border border-dashboard bg-white/70 p-3.5 backdrop-blur-sm transition-all hover:border-gray-400/50 hover:bg-gray-50/50 dark:bg-white/[0.02] dark:hover:border-white/20 dark:hover:bg-white/[0.04]"
                                >
                                    <span className="mt-0.5 shrink-0 font-mono text-[10px] font-bold text-gray-400 dark:text-gray-500">
                                        0{idx + 1}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-xs font-bold text-gray-900 transition-colors group-hover:text-amber-700 dark:text-white dark:group-hover:text-gold">
                                            {m.label}
                                        </span>
                                        <span className="mt-0.5 block text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                                            {m.why}
                                        </span>
                                    </span>
                                    <ArrowRight
                                        size={13}
                                        className="mt-0.5 shrink-0 text-gray-400 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-amber-700 dark:text-gray-500 dark:group-hover:text-gold"
                                    />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
}
