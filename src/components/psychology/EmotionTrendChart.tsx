"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ChartEmptyState } from "@/components/ui/ChartEmptyState";

interface TrendPoint {
    weekStart: string;
    winRate: number;
    avgPnL: number;
    tradeCount: number;
    dominantEmotion: string;
}

interface EmotionTrendChartProps {
    data: TrendPoint[];
}

const EMOTION_EMOJI: Record<string, string> = {
    Confident: "😎", Calm: "😌", Focused: "🎯", Patient: "⏳", Excited: "🤩",
    Neutral: "😐", Tired: "😴", Uncertain: "🤷",
    Anxious: "😰", Fearful: "😨", Greedy: "🤑", Frustrated: "😤",
    Impatient: "⏰", Revenge: "😡", FOMO: "🏃", Overconfident: "🧸",
};

export function EmotionTrendChart({ data }: EmotionTrendChartProps) {
    if (!data || data.length < 2) {
        return (
            <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm border-t-4 border-t-indigo-500 h-auto sm:h-[530px] flex flex-col overflow-hidden">
                <div className="px-5 pt-5 pb-3 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-700 dark:text-white text-sm">Emotion Trend</h3>
                            <p className="text-xs text-gray-500">Weekly emotion × performance</p>
                        </div>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <ChartEmptyState title="Not enough data" description="Need at least 2 weeks of trades with emotions logged." />
                </div>
            </div>
        );
    }

    const chartData = data.map(d => ({
        ...d,
        label: format(parseISO(d.weekStart), "MMM dd"),
        emoji: EMOTION_EMOJI[d.dominantEmotion] || "•",
    }));

    return (
        <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm border-t-4 border-t-indigo-500 h-auto sm:h-[530px] flex flex-col overflow-hidden">
            <div className="px-5 pt-5 pb-3 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-700 dark:text-white text-sm">Emotion Trend</h3>
                            <p className="text-xs text-gray-500">Weekly emotion × win rate</p>
                        </div>
                    </div>
                    <span className="text-xs text-gray-400">{data.length} weeks</span>
                </div>
            </div>

            <div className="flex-1 px-2 pb-4 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-white/5" />
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 11 }}
                            tickMargin={8}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 11 }}
                            tickFormatter={(v) => `${v}%`}
                            domain={[0, 100]}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const d = payload[0].payload;
                                return (
                                    <div className="bg-white dark:bg-[#1E2028] p-3 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl text-sm">
                                        <p className="font-bold text-gray-700 dark:text-white mb-1">Week of {d.label}</p>
                                        <p className="text-gray-600 dark:text-gray-300">Win Rate: <span className="font-bold text-primary">{d.winRate.toFixed(0)}%</span></p>
                                        <p className="text-gray-600 dark:text-gray-300">Avg P&L: <span className={`font-bold ${d.avgPnL >= 0 ? "text-primary" : "text-red-500"}`}>${d.avgPnL.toFixed(2)}</span></p>
                                        <p className="text-gray-600 dark:text-gray-300">Mood: {d.emoji} {d.dominantEmotion}</p>
                                        <p className="text-gray-400 text-xs mt-1">{d.tradeCount} trades</p>
                                    </div>
                                );
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="winRate"
                            stroke="#6366F1"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#trendGradient)"
                            dot={({ cx, cy, payload }: any) => (
                                <text key={payload.weekStart} x={cx} y={cy - 12} textAnchor="middle" fontSize={14}>
                                    {payload.emoji}
                                </text>
                            )}
                            activeDot={{ r: 5, fill: "#6366F1", stroke: "#fff", strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
