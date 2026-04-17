"use client";

import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import type { IntelligenceData } from "@/lib/smart-analytics";

interface BehavioralRadarChartProps {
    data: IntelligenceData;
}

interface RadarDimension {
    dimension: string;
    value: number;
    fullMark: 100;
    description: string;
}

function computeRadarData(data: IntelligenceData): RadarDimension[] {
    const { quickStats, tradeScore } = data;

    return [
        {
            dimension: "Win Rate",
            value: Math.round(Math.min(100, Math.max(0, quickStats.winRate))),
            fullMark: 100,
            description: `${Math.round(quickStats.winRate)}% of trades are winners`,
        },
        {
            dimension: "Risk:Reward",
            value: Math.round(Math.min(100, Math.max(0, quickStats.avgRR * 33))),
            fullMark: 100,
            description: `Average R:R ratio is ${quickStats.avgRR.toFixed(1)}`,
        },
        {
            dimension: "Risk Mgmt",
            value: Math.round(Math.min(100, Math.max(0, quickStats.slUsageRate))),
            fullMark: 100,
            description: `${Math.round(quickStats.slUsageRate)}% of trades use Stop Loss`,
        },
        {
            dimension: "Discipline",
            value: Math.round(
                Math.min(100, Math.max(0,
                    quickStats.planComplianceRate >= 0 ? quickStats.planComplianceRate : 50
                ))
            ),
            fullMark: 100,
            description: quickStats.planComplianceRate >= 0
                ? `${Math.round(quickStats.planComplianceRate)}% plan compliance`
                : "No plan data recorded",
        },
        {
            dimension: "Psychology",
            value: Math.round(Math.min(100, Math.max(0, 100 - quickStats.revengeCount * 12))),
            fullMark: 100,
            description: quickStats.revengeCount > 0
                ? `${quickStats.revengeCount} revenge trades detected`
                : "No revenge trading detected",
        },
        {
            dimension: "Overall",
            value: Math.round(Math.min(100, Math.max(0, tradeScore.score))),
            fullMark: 100,
            description: `Trade Score: ${tradeScore.score} (${tradeScore.label})`,
        },
    ];
}

function getScoreColor(score: number): string {
    if (score >= 75) return "#10B981";
    if (score >= 60) return "#3B82F6";
    if (score >= 40) return "#F59E0B";
    return "#EF4444";
}

function getGradeLabel(avg: number): { label: string; color: string } {
    if (avg >= 80) return { label: "Elite", color: "text-emerald-500" };
    if (avg >= 65) return { label: "Advanced", color: "text-blue-500" };
    if (avg >= 50) return { label: "Intermediate", color: "text-amber-500" };
    if (avg >= 35) return { label: "Developing", color: "text-orange-500" };
    return { label: "Beginner", color: "text-red-500" };
}

// Custom Tooltip
function CustomTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload as RadarDimension;
    if (!d) return null;

    return (
        <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 shadow-xl">
            <p className="text-sm font-bold text-gray-700 dark:text-white mb-0.5">
                {d.dimension}: <span style={{ color: getScoreColor(d.value) }}>{d.value}</span>/100
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{d.description}</p>
        </div>
    );
}

export function BehavioralRadarChart({ data }: BehavioralRadarChartProps) {
    const radarData = computeRadarData(data);
    const avgScore = Math.round(radarData.reduce((sum, d) => sum + d.value, 0) / radarData.length);
    const grade = getGradeLabel(avgScore);
    const color = getScoreColor(avgScore);

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-violet-500/10">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500">
                            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                            <line x1="12" y1="22" x2="12" y2="15.5" />
                            <polyline points="22 8.5 12 15.5 2 8.5" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-700 dark:text-white">Trading Profile</h3>
                        <p className="text-xs text-gray-500">Behavioral analysis across 6 dimensions</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={`text-lg font-black ${grade.color}`}>{grade.label}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg: {avgScore}/100</p>
                </div>
            </div>

            {/* Radar Chart */}
            <div className="h-[280px] sm:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <RadarChart data={radarData} outerRadius="72%">
                        <PolarGrid
                            stroke="rgba(156,163,175,0.15)"
                            strokeDasharray="3 3"
                        />
                        <PolarAngleAxis
                            dataKey="dimension"
                            tick={{ fill: "#9CA3AF", fontSize: 11, fontWeight: 600 }}
                            tickLine={false}
                        />
                        <PolarRadiusAxis
                            angle={90}
                            domain={[0, 100]}
                            tick={{ fill: "#9CA3AF", fontSize: 9 }}
                            tickCount={5}
                            axisLine={false}
                        />
                        <Radar
                            name="Score"
                            dataKey="value"
                            stroke={color}
                            fill={color}
                            fillOpacity={0.15}
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: color, strokeWidth: 0 }}
                            activeDot={{ r: 6, fill: color, strokeWidth: 2, stroke: "#fff" }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* Dimension Breakdown */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-1">
                {radarData.map((d) => (
                    <div key={d.dimension} className="text-center px-1 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.03]">
                        <p className="text-lg font-black" style={{ color: getScoreColor(d.value) }}>{d.value}</p>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider leading-tight mt-0.5">{d.dimension}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
