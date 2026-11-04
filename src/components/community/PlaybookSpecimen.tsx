"use client";

import {
    TrendingUp,
    Shield,
    Cpu,
} from "lucide-react";
import type { PlaybookChapter } from "./playbook-data";

interface PlaybookSpecimenProps {
    chapterIndex: number;
    chapter: PlaybookChapter;
}

export function PlaybookSpecimen({
    chapterIndex,
}: PlaybookSpecimenProps) {
    if (chapterIndex === 0) {
        return (
            <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] p-4 space-y-3">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-400">
                    <span>Morning Brief Specimen</span>
                    <span className="tabular-nums text-amber-600 dark:text-gold">
                        XAUUSD · H4 / M15
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-white dark:bg-[#1E2028] p-2.5 border border-gray-200 dark:border-white/10">
                        <span className="block text-[9px] text-gray-400 uppercase font-semibold">
                            Session Bias
                        </span>
                        <span className="mt-0.5 block text-xs font-black text-emerald-600 dark:text-emerald-400">
                            Bullish
                        </span>
                    </div>
                    <div className="rounded-lg bg-white dark:bg-[#1E2028] p-2.5 border border-gray-200 dark:border-white/10">
                        <span className="block text-[9px] text-gray-400 uppercase font-semibold">
                            Demand Zone
                        </span>
                        <span className="mt-0.5 block text-xs tabular-nums font-black text-gray-900 dark:text-white">
                            2,718 – 2,722
                        </span>
                    </div>
                    <div className="rounded-lg bg-white dark:bg-[#1E2028] p-2.5 border border-gray-200 dark:border-white/10">
                        <span className="block text-[9px] text-gray-400 uppercase font-semibold">
                            Target Pool
                        </span>
                        <span className="mt-0.5 block text-xs tabular-nums font-black text-amber-600 dark:text-gold">
                            2,745.00
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200/70 dark:border-white/10 text-[11px] text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5 font-semibold">
                        <TrendingUp size={13} className="text-emerald-500" />
                        Wait for M15 sweep &amp; reclaim
                    </span>
                    <span className="tabular-nums font-bold text-gray-700 dark:text-gray-300">
                        1:00 PM GMT+7
                    </span>
                </div>
            </div>
        );
    }

    if (chapterIndex === 1) {
        return (
            <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                        XAUUSD{" "}
                        <span className="text-emerald-600 dark:text-emerald-400">
                            BUY LIMIT
                        </span>
                    </span>
                    <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] tabular-nums font-black text-emerald-700 dark:text-emerald-400">
                        R:R 1 : 3.2
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-white dark:bg-[#1E2028] p-2.5 border border-gray-200 dark:border-white/10">
                        <span className="block text-[9px] text-gray-400 uppercase font-semibold">
                            Entry Zone
                        </span>
                        <span className="mt-0.5 block text-xs tabular-nums font-black text-gray-900 dark:text-white">
                            2,721.50
                        </span>
                    </div>
                    <div className="rounded-lg bg-white dark:bg-[#1E2028] p-2.5 border border-gray-200 dark:border-white/10">
                        <span className="block text-[9px] text-gray-400 uppercase font-semibold">
                            Hard SL
                        </span>
                        <span className="mt-0.5 block text-xs tabular-nums font-black text-red-500">
                            2,715.00
                        </span>
                    </div>
                    <div className="rounded-lg bg-white dark:bg-[#1E2028] p-2.5 border border-gray-200 dark:border-white/10">
                        <span className="block text-[9px] text-gray-400 uppercase font-semibold">
                            Split TP
                        </span>
                        <span className="mt-0.5 block text-xs tabular-nums font-black text-emerald-600 dark:text-emerald-400">
                            2,742.00
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200/70 dark:border-white/10 text-[11px] text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5 font-semibold">
                        <Shield size={13} className="text-amber-500 dark:text-gold" />
                        Max 1.0% risk · Move SL to BE at TP1
                    </span>
                    <span className="tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                        Free Channel
                    </span>
                </div>
            </div>
        );
    }

    if (chapterIndex === 2) {
        return (
            <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] p-4 space-y-2.5">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">
                    <span>Journal Telemetry Specimen</span>
                    <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                        EA Auto-Synced
                    </span>
                </div>

                {[
                    {
                        num: "01",
                        title: "MT5 Demo & Live EA Sync",
                        meta: "Zero Password",
                    },
                    {
                        num: "02",
                        title: "Behavioral Leak Radar",
                        meta: "Tilt / Revenge",
                    },
                    {
                        num: "03",
                        title: "10-Trade Action Sprint",
                        meta: "Weekly Coach",
                    },
                ].map((m) => (
                    <div
                        key={m.num}
                        className="flex items-center justify-between rounded-lg bg-white dark:bg-[#1E2028] px-3 py-2 border border-gray-200 dark:border-white/10 text-xs"
                    >
                        <div className="flex items-center gap-2 font-bold text-gray-800 dark:text-white">
                            <span className="rounded-lg bg-amber-500/15 px-1.5 py-0.5 text-[10px] tabular-nums font-black text-amber-700 dark:text-gold">
                                {m.num}
                            </span>
                            <span>{m.title}</span>
                        </div>
                        <span className="text-[10px] tabular-nums font-semibold text-gray-400">
                            {m.meta}
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] p-4 space-y-2.5">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">
                <span>MT5 Execution Suite</span>
                <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                    Verified MT5
                </span>
            </div>

            {[
                {
                    name: "GoldScalperNinja EA",
                    ver: "v3.1",
                    role: "2-Phase Pruning",
                },
                {
                    name: "GSN Shadow Matrix",
                    ver: "v1.0",
                    role: "Asymmetric Grid",
                },
                {
                    name: "GSN Trade Manager",
                    ver: "v2.0",
                    role: "1-Click Risk Deck",
                },
            ].map((sys) => (
                <div
                    key={sys.name}
                    className="flex items-center justify-between rounded-lg bg-white dark:bg-[#1E2028] px-3 py-2 border border-gray-200 dark:border-white/10 text-xs"
                >
                    <div className="flex items-center gap-2 font-bold text-gray-800 dark:text-white">
                        <Cpu size={13} className="text-amber-500 dark:text-gold shrink-0" />
                        <span>{sys.name}</span>
                        <span className="rounded-lg bg-gold/10 border border-gold/20 px-1.5 py-0.5 text-[10px] tabular-nums font-black text-amber-700 dark:text-gold">
                            {sys.ver}
                        </span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {sys.role}
                    </span>
                </div>
            ))}
        </div>
    );
}
