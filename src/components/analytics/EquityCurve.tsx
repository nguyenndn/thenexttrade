"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { TrendingUp } from "lucide-react";
import {
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
} from 'recharts';

interface EquityCurveProps {
    data: Array<{ date: string; balance: number; pnl: number }>;
}

export function EquityCurve({ data }: EquityCurveProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    if (!data || data.length === 0) {
        return (
            <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm h-[400px] flex items-center justify-center text-gray-400">
                No performance data available
            </div>
        );
    }

    // Calculate cumulative PnL for "Growth"
    let cumulativePnL = 0;
    const chartData = data.map(item => {
        cumulativePnL += item.pnl;
        return {
            name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            growth: cumulativePnL,
            originalDate: item.date
        };
    });

    const totalNetProfit = cumulativePnL;

    // Calculate min/max for Y axis
    const growths = chartData.map(d => d.growth);
    const minGrowth = Math.min(...growths, 0);
    const maxGrowth = Math.max(...growths, 0);
    const padding = (maxGrowth - minGrowth) * 0.1 || 1000;
    
    return (
        <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow duration-200 group/card">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#00C888]/10 rounded-lg text-[#00C888]">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base">Period Growth</h3>
                        <p className="text-xs text-gray-400 font-medium">Cumulative Net Profit</p>
                    </div>
                </div>
                
                <div className="text-right">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Net Profit</p>
                    <p className={`text-lg font-black ${totalNetProfit >= 0 ? 'text-[#00C888]' : 'text-red-500'}`}>
                        {totalNetProfit >= 0 ? '+' : ''}${Math.abs(totalNetProfit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            <div className="h-[320px] w-full [&_svg]:outline-none [&_.recharts-wrapper]:outline-none">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00C888" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#00C888" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid 
                            strokeDasharray="3 3" 
                            vertical={false} 
                            stroke={isDark ? "rgba(255,255,255,0.05)" : "#F3F4F6"} 
                        />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 500 }} 
                            dy={15}
                            minTickGap={40}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 500 }}
                            tickFormatter={(value) => `$${value}`}
                            domain={[minGrowth - padding, maxGrowth + padding]}
                            width={60}
                        />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    const val = payload[0].value as number;
                                    return (
                                        <div className="bg-white dark:bg-[#1E2028] p-3 border border-gray-100 dark:border-white/10 rounded-xl shadow-xl">
                                            <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">{label}</p>
                                            <p className={`text-sm font-black ${val >= 0 ? 'text-[#00C888]' : 'text-red-500'}`}>
                                                {val >= 0 ? '+' : '-'}${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="growth" 
                            stroke="#00C888" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#colorGrowth)" 
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
