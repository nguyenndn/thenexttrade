"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { TrendingUp } from "lucide-react";
import { ChartEmptyState } from "@/components/ui/ChartEmptyState";
import {
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    ReferenceLine
} from 'recharts';

interface EquityCurveProps {
    data: Array<{ date: string; balance: number; pnl: number }>;
}
import { processEquityCurveData } from "./utils/chartHelpers";

export function EquityCurve({ data }: EquityCurveProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const { isEmpty, chartData, firstBalance, totalNetProfit, splitOffset } = processEquityCurveData(data);

    if (isEmpty) {
        return <ChartEmptyState height="h-[400px]" />;
    }
    
    return (
        <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow duration-200 group/card">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-700 dark:text-white text-base">Equity Curve</h3>
                        <p className="text-xs text-gray-500 font-medium">Cumulative Net Profit</p>
                    </div>
                </div>
                
                <div className="text-right">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Net Profit</p>
                    <p className={`text-lg font-black ${totalNetProfit >= 0 ? 'text-primary' : 'text-red-500'}`}>
                        {totalNetProfit >= 0 ? '+' : ''}${Math.abs(totalNetProfit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            <div className="h-[340px] w-full overflow-x-auto overflow-y-hidden [&_svg]:outline-none [&_.recharts-wrapper]:outline-none scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 pb-2">
                <div className="min-w-[600px] h-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                            <defs>
                                <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#00C888" stopOpacity={0.2} />
                                    <stop offset={`${splitOffset}%`} stopColor="#00C888" stopOpacity={0.2} />
                                    <stop offset={`${splitOffset}%`} stopColor="#EF4444" stopOpacity={0.2} />
                                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0.2} />
                                </linearGradient>
                                <linearGradient id="splitStroke" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#00C888" stopOpacity={1} />
                                    <stop offset={`${splitOffset}%`} stopColor="#00C888" stopOpacity={1} />
                                    <stop offset={`${splitOffset}%`} stopColor="#EF4444" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#EF4444" stopOpacity={1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid 
                                strokeDasharray="3 3" 
                                vertical={false} 
                                stroke={isDark ? "rgba(255,255,255,0.05)" : "#F3F4F6"} 
                            />
                            <ReferenceLine 
                                y={firstBalance} 
                                stroke={isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"} 
                                strokeDasharray="3 3" 
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
                                tickFormatter={(value) => `${value >= 0 ? '' : '-'}$${Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                                domain={['auto', 'auto']}
                                width={80}
                            />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        const val = payload[0].value as number;
                                        const pnlVal = payload[0].payload.pnl as number;
                                        return (
                                            <div className="bg-white dark:bg-[#1E2028] p-3 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl">
                                                <p className="text-[11px] font-bold text-gray-500 uppercase mb-1">{label}</p>
                                                <p className="text-sm font-black text-gray-700 dark:text-white mb-1">
                                                    Balance: ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                                <p className={`text-xs font-bold ${pnlVal >= 0 ? 'text-primary' : 'text-red-500'}`}>
                                                    PnL: {pnlVal >= 0 ? '+' : '-'}${Math.abs(pnlVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="balance" 
                                stroke="url(#splitStroke)" 
                                strokeWidth={3} 
                                fillOpacity={1} 
                                fill="url(#splitColor)" 
                                animationDuration={1500}
                                baseValue={firstBalance}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
