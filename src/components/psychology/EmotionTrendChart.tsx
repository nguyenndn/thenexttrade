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
import {
    TrendingUp,
    ShieldCheck,
    Smile,
    Crosshair,
    Clock,
    Zap,
    Minus,
    Moon,
    HelpCircle,
    AlertCircle,
    ShieldAlert,
    Flame,
    Frown,
    Timer,
    Swords,
    Sparkles,
    Activity,
    type LucideIcon,
} from "lucide-react";
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

const EMOTION_ICON_MAP: Record<string, LucideIcon> = {
    Confident: ShieldCheck,
    Calm: Smile,
    Focused: Crosshair,
    Patient: Clock,
    Excited: Zap,
    Neutral: Minus,
    Tired: Moon,
    Uncertain: HelpCircle,
    Anxious: AlertCircle,
    Fearful: ShieldAlert,
    Greedy: Flame,
    Frustrated: Frown,
    Impatient: Timer,
    Revenge: Swords,
    FOMO: TrendingUp,
    Overconfident: Sparkles,
};

const POSITIVE_EMOTIONS = new Set([
    "Confident",
    "Calm",
    "Focused",
    "Patient",
    "Excited",
]);

const NEGATIVE_EMOTIONS = new Set([
    "Anxious",
    "Fearful",
    "Greedy",
    "Frustrated",
    "Impatient",
    "Revenge",
    "FOMO",
    "Overconfident",
]);

function getEmotionColor(emotion: string): string {
    if (POSITIVE_EMOTIONS.has(emotion)) return "#10B981";
    if (NEGATIVE_EMOTIONS.has(emotion)) return "#EF4444";
    return "#6366F1";
}

export function EmotionTrendChart({ data }: EmotionTrendChartProps) {
    if (!data || data.length < 2) {
        return (
            <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard shadow-sm h-auto sm:h-[530px] flex flex-col overflow-hidden">
                <div className="px-5 pt-5 pb-3 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-700 dark:text-white text-sm">
                                Emotion Trend
                            </h3>
                            <p className="text-xs text-gray-500">
                                Weekly emotion × performance
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <ChartEmptyState
                        title="Not enough data"
                        description="Need at least 2 weeks of trades with emotions logged."
                    />
                </div>
            </div>
        );
    }

    const chartData = data.map((d) => ({
        ...d,
        label: format(parseISO(d.weekStart), "MMM dd"),
    }));

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard shadow-sm h-auto sm:h-[530px] flex flex-col overflow-hidden">
            <div className="px-5 pt-5 pb-3 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-700 dark:text-white text-sm">
                                Emotion Trend
                            </h3>
                            <p className="text-xs text-gray-500">
                                Weekly emotion × win rate
                            </p>
                        </div>
                    </div>
                    <span className="text-xs text-gray-400">
                        {data.length} weeks
                    </span>
                </div>
            </div>

            <div className="flex-1 px-2 pb-4 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient
                                id="trendGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="#6366F1"
                                    stopOpacity={0.3}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="#6366F1"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#E5E7EB"
                            className="dark:stroke-white/5"
                        />
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#9CA3AF", fontSize: 11 }}
                            tickMargin={8}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#9CA3AF", fontSize: 11 }}
                            tickFormatter={(v) => `${v}%`}
                            domain={[0, 100]}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const d = payload[0].payload as TrendPoint & {
                                    label: string;
                                };
                                const MoodIcon =
                                    EMOTION_ICON_MAP[d.dominantEmotion] ||
                                    Activity;
                                return (
                                    <div className="bg-white dark:bg-[#1E2028] p-3 border border-dashboard rounded-lg shadow-xl text-xs">
                                        <p className="font-bold text-gray-800 dark:text-white mb-1 text-sm">
                                            Week of {d.label}
                                        </p>
                                        <p className="text-gray-600 dark:text-gray-300">
                                            Win Rate:{" "}
                                            <span className="font-bold font-mono tabular-nums text-primary">
                                                {d.winRate.toFixed(0)}%
                                            </span>
                                        </p>
                                        <p className="text-gray-600 dark:text-gray-300">
                                            Avg P&L:{" "}
                                            <span
                                                className={`font-bold font-mono tabular-nums ${d.avgPnL >= 0 ? "text-primary" : "text-red-500"}`}
                                            >
                                                ${d.avgPnL.toFixed(2)}
                                            </span>
                                        </p>
                                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 mt-1">
                                            <span>Mood:</span>
                                            <MoodIcon
                                                size={13}
                                                style={{
                                                    color: getEmotionColor(
                                                        d.dominantEmotion
                                                    ),
                                                }}
                                            />
                                            <span className="font-semibold text-gray-800 dark:text-gray-100">
                                                {d.dominantEmotion || "Neutral"}
                                            </span>
                                        </div>
                                        <p className="text-gray-400 text-xs mt-1 font-mono tabular-nums">
                                            {d.tradeCount} trades
                                        </p>
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
                            dot={(dotProps: {
                                cx?: number;
                                cy?: number;
                                payload?: TrendPoint;
                            }) => {
                                const { cx = 0, cy = 0, payload } = dotProps;
                                const color = getEmotionColor(
                                    payload?.dominantEmotion || ""
                                );
                                return (
                                    <circle
                                        key={payload?.weekStart || `${cx}-${cy}`}
                                        cx={cx}
                                        cy={cy}
                                        r={4.5}
                                        fill={color}
                                        stroke="#ffffff"
                                        strokeWidth={2}
                                    />
                                );
                            }}
                            activeDot={{
                                r: 6,
                                fill: "#6366F1",
                                stroke: "#fff",
                                strokeWidth: 2,
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
