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

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

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
            title: `${hourLabel} UTC\nTrades: ${totalTrades}\nWin Rate: ${winRate.toFixed(0)}%\nP&L: $${totalPnL.toFixed(2)}`
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
            if (intensity > 0.8) return "bg-primary dark:bg-primary/90 text-white";
            if (intensity > 0.6) return "bg-primary/70 text-white";
            if (intensity > 0.3) return "bg-primary/40 text-gray-900 dark:text-white";
            return "bg-primary/20 text-gray-700 dark:text-gray-300";
        } else if (pnl < 0) {
            if (intensity > 0.8) return "bg-red-500 dark:bg-red-500/90 text-white";
            if (intensity > 0.6) return "bg-red-400 dark:bg-red-500/70 text-white";
            if (intensity > 0.3) return "bg-red-300 dark:bg-red-500/40 text-gray-900 dark:text-white";
            return "bg-red-200 dark:bg-red-500/20 text-gray-700 dark:text-gray-300";
        } else {
            // Breakeven but traded
            return "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300";
        }
    };

    const amHours = fullHours.slice(0, 12);
    const pmHours = fullHours.slice(12, 24);

    const renderHourBlock = (hoursData: typeof fullHours, isTopRow: boolean = false) => (
        <div className="space-y-1.5">
            {/* Hour cells */}
            <div className="grid grid-cols-12 gap-1.5 md:gap-2">
                {hoursData.map((hour) => (
                    <Tooltip key={hour.hour} delayDuration={0}>
                        <TooltipTrigger asChild>
                            <div
                                className={`
                                    w-full h-[80px] rounded-lg flex flex-col items-center justify-center
                                    cursor-pointer transition-all hover:scale-105 relative shadow-sm border border-transparent hover:border-white/20 hover:z-20
                                    ${getColor(hour)}
                                `}
                            >
                                <span className="font-bold text-[13px] opacity-100">{hour.totalTrades > 0 ? hour.totalTrades : ""}</span>
                            </div>
                        </TooltipTrigger>

                        {/* Radix Portal Tooltip */}
                        <TooltipContent 
                            side={isTopRow ? "bottom" : "top"} 
                            sideOffset={8}
                            className="w-36 bg-gray-900 dark:bg-gray-900 border-gray-800 dark:border-white/10 text-white p-3 shadow-xl rounded-lg z-[100]"
                        >
                            <p className="font-bold border-b border-gray-700 pb-2 mb-2">{hour.hourLabel} UTC</p>
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center gap-2">
                                    <span className="text-gray-400">Trades:</span>
                                    <span className="font-medium">{hour.totalTrades}</span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                    <span className="text-gray-400">Win Rate:</span>
                                    <span className="font-medium">{hour.winRate.toFixed(0)}%</span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                    <span className="text-gray-400">P&L:</span>
                                    <span className={`font-medium ${hour.totalPnL > 0 ? "text-primary dark:text-[#00C888]" : hour.totalPnL < 0 ? "text-red-400" : "text-gray-300"}`}>
                                        {hour.totalPnL > 0 ? '+' : ''}{hour.totalPnL.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>
            
            {/* Hour labels */}
            <div className="grid grid-cols-12 gap-1.5 md:gap-2">
                {hoursData.map((hour) => (
                    <div
                        key={hour.hour}
                        className="text-center text-[10px] font-medium text-gray-400"
                    >
                        {hour.hour}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm transition-shadow hover:shadow-md">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                24-Hour Trading Heatmap
            </h3>
            <p className="text-sm text-gray-500 mb-6">
                P&L distribution across the day (UTC timezone)
            </p>

            {/* Heatmap Grid */}
            <TooltipProvider>
                <div className="overflow-x-auto pb-6 custom-scrollbar">
                    <div className="min-w-[500px] space-y-8 pr-4">
                        {renderHourBlock(amHours, true)}
                        {renderHourBlock(pmHours, false)}
                    </div>
                </div>
            </TooltipProvider>

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
                    <div className="w-3 h-3 rounded bg-primary"></div>
                    <span>High Profit</span>
                </div>
            </div>
        </div>
    );
}
