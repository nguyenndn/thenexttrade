"use client";

import { Grid3x3 } from "lucide-react";
import { ChartEmptyState } from "@/components/ui/ChartEmptyState";

interface HeatmapSlot {
    slot: string;
    trades: number;
    winRate: number;
    dominantEmotion: string;
}

interface HeatmapRow {
    day: string;
    slots: HeatmapSlot[];
}

interface TradingMoodHeatmapProps {
    data: HeatmapRow[];
}

const EMOTION_EMOJI: Record<string, string> = {
    Confident: "😎", Calm: "😌", Focused: "🎯", Patient: "⏳", Excited: "🤩",
    Neutral: "😐", Tired: "😴", Uncertain: "🤷",
    Anxious: "😰", Fearful: "😨", Greedy: "🤑", Frustrated: "😤",
    Impatient: "⏰", Revenge: "😡", FOMO: "🏃", Overconfident: "🧸",
};

const POSITIVE_EMOTIONS = new Set(["Confident", "Calm", "Focused", "Patient", "Excited"]);
const NEGATIVE_EMOTIONS = new Set(["Anxious", "Fearful", "Greedy", "Frustrated", "Impatient", "Revenge", "FOMO", "Overconfident"]);

const SESSION_META: { name: string; time: string; dot: string }[] = [
    { name: "Sydney", time: "21:00 – 03:00", dot: "bg-blue-400" },
    { name: "Tokyo", time: "03:00 – 09:00", dot: "bg-gray-400" },
    { name: "London", time: "09:00 – 15:00", dot: "bg-emerald-500" },
    { name: "New York", time: "15:00 – 21:00", dot: "bg-emerald-400" },
];

function getCellStyle(slot: HeatmapSlot): string {
    if (slot.trades === 0) return "bg-gray-50 dark:bg-white/[0.02] border-gray-100 dark:border-white/5";
    if (POSITIVE_EMOTIONS.has(slot.dominantEmotion)) {
        const intensity = Math.min(slot.trades / 10, 1);
        return intensity > 0.5
            ? "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30"
            : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/15";
    }
    if (NEGATIVE_EMOTIONS.has(slot.dominantEmotion)) {
        const intensity = Math.min(slot.trades / 10, 1);
        return intensity > 0.5
            ? "bg-red-100 dark:bg-red-500/20 border-red-200 dark:border-red-500/30"
            : "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/15";
    }
    return "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10";
}

export function TradingMoodHeatmap({ data }: TradingMoodHeatmapProps) {
    const hasTrades = data.some(row => row.slots.some(s => s.trades > 0));

    return (
        <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm border-t-4 border-t-pink-500 h-auto sm:h-[460px] flex flex-col overflow-hidden">
            <div className="px-3 sm:px-5 pt-4 sm:pt-5 pb-3 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-500/10 rounded-lg text-pink-500">
                            <Grid3x3 size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-700 dark:text-white text-sm">Mood Heatmap</h3>
                            <p className="text-xs text-gray-500">Day × Trading Session</p>
                        </div>
                    </div>
                    {/* Legend */}
                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 ml-0 sm:ml-auto">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-200 dark:bg-emerald-500/30" /> Positive</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-gray-200 dark:bg-white/10" /> Neutral</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-200 dark:bg-red-500/30" /> Negative</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 px-3 sm:px-5 pb-4 sm:pb-5 min-h-0 flex flex-col">
                {!hasTrades ? (
                    <div className="flex-1 flex items-center justify-center">
                        <ChartEmptyState title="No mood data yet" description="Log emotions when entering trades to see patterns." />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col gap-2">
                        {/* Header row */}
                        <div className="grid grid-cols-[36px_1fr_1fr_1fr_1fr] sm:grid-cols-[48px_1fr_1fr_1fr_1fr] gap-1 sm:gap-2">
                            <div />
                            {SESSION_META.map(session => (
                                <div key={session.name} className="text-center">
                                    <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-0.5">
                                        <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${session.dot}`} />
                                        <span className="text-[10px] sm:text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wide">{session.name}</span>
                                    </div>
                                    <p className="text-[9px] sm:text-[10px] font-medium text-gray-500 dark:text-gray-400 hidden sm:block">
                                        {session.time}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Data rows */}
                        {data.map(row => (
                            <div key={row.day} className="grid grid-cols-[36px_1fr_1fr_1fr_1fr] sm:grid-cols-[48px_1fr_1fr_1fr_1fr] gap-1 sm:gap-2 flex-1">
                                <div className="flex items-center">
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{row.day}</span>
                                </div>
                                {row.slots.map(slot => (
                                    <div
                                        key={slot.slot}
                                        className={`rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all hover:shadow-md cursor-default ${getCellStyle(slot)}`}
                                        title={slot.trades > 0 ? `${slot.dominantEmotion} (${slot.trades} trades, ${slot.winRate.toFixed(0)}% WR)` : "No trades"}
                                    >
                                        {slot.trades === 0 ? (
                                            <span className="text-gray-300 dark:text-gray-700 text-xs">—</span>
                                        ) : (
                                            <>
                                                <span className="text-base sm:text-lg leading-none">{EMOTION_EMOJI[slot.dominantEmotion] || "•"}</span>
                                                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">{slot.winRate.toFixed(0)}%</span>
                                                <span className="text-[9px] text-gray-400">{slot.trades}t</span>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
