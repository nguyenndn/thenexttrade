"use client";

import type { LeaderboardEntry, LeaderboardType } from "../actions";
import { cn } from "@/lib/utils";

interface TopMedalStripProps {
    entries: LeaderboardEntry[];
    currentUserId?: string | null;
    onUserClick?: (entry: LeaderboardEntry) => void;
    type: LeaderboardType;
    sortBy?: "percentage" | "currency";
}

function formatStudyTime(minutes: number): string {
    if (minutes === 0) return "0m";
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// Config per rank position: [#1 Gold, #2 Silver, #3 Bronze]
const RANK_CONFIGS = [
    {
        // Rank #1 (Gold)
        badgeBg: "bg-[#F59E0B]",
        badgeText: "text-white",
        cardBg: "bg-amber-50/40 dark:bg-amber-500/5",
        borderColor: "border-amber-400/80 dark:border-amber-500/45",
        hoverBorderColor:
            "hover:border-amber-500 dark:hover:border-amber-500/60",
        metricColor: "text-amber-700 dark:text-amber-300",
        avatarRing: "ring-[#F59E0B] dark:ring-amber-500/60",
    },
    {
        // Rank #2 (Silver)
        badgeBg: "bg-slate-500",
        badgeText: "text-white",
        cardBg: "bg-slate-50/50 dark:bg-slate-500/5",
        borderColor: "border-slate-300 dark:border-slate-600/50",
        hoverBorderColor:
            "hover:border-slate-400 dark:hover:border-slate-600/70",
        metricColor: "text-slate-700 dark:text-slate-200",
        avatarRing: "ring-slate-400 dark:ring-slate-500/60",
    },
    {
        // Rank #3 (Bronze)
        badgeBg: "bg-orange-500",
        badgeText: "text-white",
        cardBg: "bg-orange-50/40 dark:bg-orange-500/5",
        borderColor: "border-orange-300 dark:border-orange-500/45",
        hoverBorderColor:
            "hover:border-orange-400 dark:hover:border-orange-500/60",
        metricColor: "text-orange-700 dark:text-orange-300",
        avatarRing: "ring-orange-400 dark:ring-orange-500/60",
    },
];

// Premium Scalloped Medal Badge Component
const MedalBadge = ({ rank }: { rank: number }) => {
    const configs = [
        {
            gradientId: "gold-medal-grad",
            fromColor: "#FBBF24", // yellow-400
            toColor: "#D97706", // amber-600
            strokeColor: "#FEF3C7", // yellow-100
            glowClass: "drop-shadow-[0_4px_10px_rgba(245,158,11,0.4)]",
        },
        {
            gradientId: "silver-medal-grad",
            fromColor: "#CBD5E1", // slate-300
            toColor: "#475569", // slate-600
            strokeColor: "#F8FAFC", // slate-50
            glowClass: "drop-shadow-[0_4px_10px_rgba(148,163,184,0.35)]",
        },
        {
            gradientId: "bronze-medal-grad",
            fromColor: "#FB923C", // orange-400
            toColor: "#9A3412", // orange-800
            strokeColor: "#FFEDD5", // orange-100
            glowClass: "drop-shadow-[0_4px_10px_rgba(249,115,22,0.35)]",
        },
    ];

    const config = configs[rank - 1] || configs[0];

    return (
        <div
            className={cn(
                "relative w-10 h-10 shrink-0 flex items-center justify-center bg-transparent",
                config.glowClass
            )}
        >
            <svg viewBox="0 0 40 40" className="w-10 h-10 select-none">
                <defs>
                    <linearGradient
                        id={config.gradientId}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                    >
                        <stop offset="0%" stopColor={config.fromColor} />
                        <stop offset="100%" stopColor={config.toColor} />
                    </linearGradient>
                </defs>
                <g fill={`url(#${config.gradientId})`}>
                    {/* 16 outer circular scallops to form a perfect seal */}
                    {Array.from({ length: 16 }).map((_, i) => {
                        const angle = (i * 2 * Math.PI) / 16;
                        const x = 20 + 12.5 * Math.cos(angle);
                        const y = 20 + 12.5 * Math.sin(angle);
                        return <circle key={i} cx={x} cy={y} r={3.2} />;
                    })}
                    <circle cx={20} cy={20} r={12.5} />
                </g>
                {/* Inner ring */}
                <circle
                    cx={20}
                    cy={20}
                    r={9.5}
                    fill="none"
                    stroke={config.strokeColor}
                    strokeWidth="1.2"
                    strokeOpacity="0.45"
                />
                {/* Number centered */}
                <text
                    x="20"
                    y="20"
                    dy=".35em"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    className="font-extrabold text-sm font-sans select-none pointer-events-none"
                >
                    {rank}
                </text>
            </svg>
        </div>
    );
};

// Get main value display
function getMainValue(
    entry: LeaderboardEntry,
    type: LeaderboardType,
    sortBy?: "percentage" | "currency"
) {
    switch (type) {
        case "xp":
            return `${entry.value.toLocaleString()} Edge`;
        case "streak":
            return `${entry.value} days`;
        case "academy":
            return `${entry.value} lessons`;
        case "trading": {
            if (sortBy === "percentage") {
                const winRateVal =
                    entry.winRate !== undefined ? entry.winRate : entry.value;
                return `${winRateVal.toFixed(1)}% Win Rate`;
            }
            const pnl =
                entry.pnl >= 0
                    ? `+$${entry.pnl.toFixed(2)}`
                    : `-$${Math.abs(entry.pnl).toFixed(2)}`;
            return `${pnl} Profit`;
        }
        default:
            return `${entry.value.toLocaleString()} ${entry.label}`;
    }
}

// Generate the 2x2 stats block
function get2x2Stats(entry: LeaderboardEntry, type: LeaderboardType) {
    switch (type) {
        case "xp":
            return [
                {
                    label: "Total Edge",
                    value: `${entry.value.toLocaleString()} Edge`,
                },
                {
                    label: "Study Time",
                    value: formatStudyTime(entry.studyTimeMinutes),
                },
                {
                    label: "Lessons Completed",
                    value: `${entry.lessonsCompleted}`,
                },
                { label: "Level", value: `Level ${entry.level}` },
            ];
        case "streak":
            return [
                { label: "Daily Streak", value: `${entry.value} days` },
                {
                    label: "Total Edge",
                    value: `${entry.tier.minXp.toLocaleString()}+`,
                },
                { label: "Lessons", value: `${entry.lessonsCompleted}` },
                {
                    label: "Study Time",
                    value: formatStudyTime(entry.studyTimeMinutes),
                },
            ];
        case "academy":
            return [
                { label: "Lessons", value: `${entry.value} completed` },
                {
                    label: "Study Time",
                    value: formatStudyTime(entry.studyTimeMinutes),
                },
                {
                    label: "Total Edge",
                    value: `${entry.tier.minXp.toLocaleString()}+`,
                },
                { label: "Level", value: `Level ${entry.level}` },
            ];
        case "trading": {
            const winRateVal =
                entry.winRate !== undefined ? entry.winRate : entry.value;
            return [
                { label: "Win Rate", value: `${winRateVal}%` },
                { label: "Total Trades", value: `${entry.totalTrades}` },
                {
                    label: "Total PnL",
                    value:
                        entry.pnl >= 0
                            ? `+$${entry.pnl.toFixed(0)}`
                            : `-$${Math.abs(entry.pnl).toFixed(0)}`,
                },
                { label: "Level", value: `Level ${entry.level}` },
            ];
        }
        default:
            return [
                {
                    label: "Total Edge",
                    value: `${entry.value.toLocaleString()}`,
                },
                {
                    label: "Study Time",
                    value: formatStudyTime(entry.studyTimeMinutes),
                },
                { label: "Completed", value: `${entry.lessonsCompleted}` },
                { label: "Level", value: `Level ${entry.level}` },
            ];
    }
}

// Get empty slot description
function getEmptySlotLabel(type: LeaderboardType): string {
    switch (type) {
        case "xp":
            return "Start earning Edge to claim this place.";
        case "streak":
            return "Keep your daily streak to claim this place.";
        case "academy":
            return "Complete lessons to claim this place.";
        case "trading":
            return "Improve your win rate to claim this place.";
        default:
            return "Start earning Edge to claim this place.";
    }
}

export function TopMedalStrip({
    entries,
    currentUserId,
    onUserClick,
    type,
    sortBy = "currency",
}: TopMedalStripProps) {
    // Pad entries to 3 with placeholders
    const padded: (LeaderboardEntry | null)[] = [
        entries[0] ?? null,
        entries[1] ?? null,
        entries[2] ?? null,
    ];

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {padded.map((entry, index) => {
                const rank = index + 1;
                const config = RANK_CONFIGS[index];

                if (!entry) {
                    return (
                        <div
                            key={`empty-${rank}`}
                            className="flex flex-col rounded-2xl border border-dashed border-dashboard bg-gray-50/20 dark:bg-white/[0.01] p-4 text-left select-none text-gray-400 dark:text-gray-500"
                        >
                            {/* Header placeholder */}
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 rounded-full border-2 border-dashed border-dashboard bg-transparent flex items-center justify-center text-sm font-bold text-gray-300 dark:text-gray-700 shrink-0">
                                        ?
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-400 dark:text-gray-500">
                                            Open spot
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-600">
                                            No occupant yet
                                        </p>
                                    </div>
                                </div>
                                {/* Greyed out medal shape */}
                                <div className="w-10 h-10 rounded-full border-2 border-dashed border-dashboard flex items-center justify-center text-xs font-black text-gray-300 dark:text-gray-700 shrink-0">
                                    #{rank}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="w-full border-b border-dashed border-dashboard my-3" />

                            {/* Description body */}
                            <p className="text-xs text-gray-400 dark:text-gray-600 italic leading-relaxed py-2">
                                {getEmptySlotLabel(type)}
                            </p>
                        </div>
                    );
                }

                const isCurrentUser = entry.userId === currentUserId;
                const stats2x2 = get2x2Stats(entry, type);

                return (
                    <button
                        key={entry.userId}
                        onClick={() => onUserClick?.(entry)}
                        className={cn(
                            "group flex flex-col rounded-2xl border p-4 text-left transition shadow-sm bg-white dark:bg-[#0B0E14]",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                            config.borderColor,
                            config.hoverBorderColor,
                            "hover:shadow-md transition-shadow",
                            isCurrentUser &&
                                "ring-2 ring-primary/30 ring-offset-2 dark:ring-offset-[#151925]"
                        )}
                    >
                        {/* Top Row: Avatar + Name/Subtext + Medal */}
                        <div className="flex items-center justify-between gap-3 w-full">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="relative shrink-0">
                                    <div
                                        className={cn(
                                            "w-14 h-14 rounded-full flex items-center justify-center font-bold text-white bg-gray-400 dark:bg-gray-600 overflow-hidden ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#0B0E14] transition-transform group-hover:scale-105",
                                            config.avatarRing
                                        )}
                                    >
                                        {entry.avatar ? (
                                            <img
                                                src={entry.avatar}
                                                alt={entry.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            entry.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p
                                            className={cn(
                                                "font-bold text-sm truncate",
                                                isCurrentUser
                                                    ? "text-primary font-black"
                                                    : "text-gray-800 dark:text-gray-200"
                                            )}
                                        >
                                            {entry.name}
                                        </p>
                                        {isCurrentUser && (
                                            <span className="text-[9px] font-extrabold uppercase tracking-wide bg-primary/10 text-primary px-1 py-0.2 rounded-lg shrink-0">
                                                You
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5 truncate">
                                        {getMainValue(entry, type, sortBy)}
                                    </p>
                                </div>
                            </div>

                            {/* Scalloped Medal Badge */}
                            <MedalBadge rank={rank} />
                        </div>

                        {/* Divider */}
                        <div className="w-full border-b border-dashboard my-3" />

                        {/* Bottom Section: 2x2 Stats Grid with Aligned Colons */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 w-full text-xs">
                            {stats2x2.map((stat, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between min-w-0"
                                >
                                    <span className="text-gray-400 dark:text-gray-500 font-medium truncate pr-1">
                                        {stat.label}
                                    </span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="text-gray-300 dark:text-gray-700">
                                            :
                                        </span>
                                        <span className="font-bold text-gray-700 dark:text-gray-300">
                                            {stat.value}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
