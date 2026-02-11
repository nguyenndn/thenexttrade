"use client";

interface HourlyHeatmapProps {
    data: Array<{
        hour: number;
        hourLabel: string;
        totalTrades: number;
        winRate: number;
        totalPnL: number;
    }>;
}

export function HourlyHeatmap({ data }: HourlyHeatmapProps) {
    // Create full 24-hour array
    const fullHours = Array.from({ length: 24 }, (_, i) => {
        const hourData = data.find(d => d.hour === i);
        const hourLabel = `${i.toString().padStart(2, '0')}:00`;
        const totalTrades = hourData?.totalTrades || 0;
        const winRate = hourData?.winRate || 0;
        const totalPnL = hourData?.totalPnL || 0;

        return {
            hour: i,
            hourLabel,
            totalTrades,
            winRate,
            totalPnL,
            title: `${hourLabel} UTC\nTrades: ${totalTrades}\nWin Rate: ${winRate.toFixed(0)}%\nP&L: $${totalPnL.toFixed(0)}`
        };
    });

    // Find max values for color intensity
    const maxPnL = Math.max(...fullHours.map(h => Math.abs(h.totalPnL)), 1);

    const getColor = (hour: typeof fullHours[0]) => {
        if (hour.totalTrades === 0) return "bg-gray-100 dark:bg-gray-800";

        const pnl = hour.totalPnL;
        const intensity = Math.min(Math.abs(pnl) / maxPnL, 1);

        // Normalize intensity for visual distinction steps
        if (pnl > 0) {
            if (intensity > 0.8) return "bg-green-500";
            if (intensity > 0.6) return "bg-green-400";
            if (intensity > 0.3) return "bg-green-300 dark:bg-green-500/60";
            return "bg-green-200 dark:bg-green-500/30";
        } else if (pnl < 0) {
            if (intensity > 0.8) return "bg-red-500";
            if (intensity > 0.6) return "bg-red-400";
            if (intensity > 0.3) return "bg-red-300 dark:bg-red-500/60";
            return "bg-red-200 dark:bg-red-500/30";
        } else {
            // Breakeven but traded
            return "bg-gray-300 dark:bg-gray-600";
        }
    };

    return (
        <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                24-Hour Trading Heatmap
            </h3>
            <p className="text-sm text-gray-500 mb-6">
                P&L distribution across the day (UTC timezone)
            </p>

            {/* Heatmap Grid */}
            <div className="space-y-2">
                {/* Hour cells */}
                <div className="grid grid-cols-6 sm:grid-cols-12 md:grid-cols-12 lg:grid-cols-24 gap-1">
                    {fullHours.map((hour) => (
                        <div
                            key={hour.hour}
                            className={`
                aspect-square rounded-lg flex items-center justify-center
                text-[10px] font-bold cursor-pointer transition-all hover:scale-110 relative group
                ${getColor(hour)}
                ${hour.totalTrades === 0 ? 'text-gray-400' : 'text-white'}
              `}
                        >
                            <span className="opacity-90">{hour.totalTrades > 0 ? hour.totalTrades : ""}</span>

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-gray-900 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                <p className="font-bold border-b border-gray-700 pb-1 mb-1">{hour.hourLabel} UTC</p>
                                <div className="space-y-0.5">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Trades:</span>
                                        <span>{hour.totalTrades}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Win Rate:</span>
                                        <span>{hour.winRate.toFixed(0)}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">P&L:</span>
                                        <span className={hour.totalPnL > 0 ? "text-green-400" : hour.totalPnL < 0 ? "text-red-400" : "text-gray-300"}>
                                            {hour.totalPnL > 0 ? '+' : ''}{hour.totalPnL}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Hour labels (simplified for small screens logic addressed via grid above) */}
                <div className="grid grid-cols-6 sm:grid-cols-12 md:grid-cols-12 lg:grid-cols-24 gap-1">
                    {fullHours.map((hour) => (
                        <div
                            key={hour.hour}
                            className="text-center text-[8px] text-gray-400"
                        >
                            {hour.hour}
                        </div>
                    ))}
                </div>
            </div>

            {/* Color Legend */}
            <div className="flex items-center justify-end gap-4 mt-6 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-400"></div>
                    <span>High Loss</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-800"></div>
                    <span>No Activity</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-400"></div>
                    <span>High Profit</span>
                </div>
            </div>
        </div>
    );
}
