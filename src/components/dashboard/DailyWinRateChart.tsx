"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format } from "date-fns";

interface DailyWinRateChartProps {
  data: {
    date: string;
    winRate: number;
    trades: number;
    wins: number;
  }[];
  height?: number | string;
}

export function DailyWinRateChart({ data, height = 300 }: DailyWinRateChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`w-full flex items-center justify-center font-medium text-sm text-gray-600 dark:text-gray-300`} style={{ height }}>
        No data available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#1E2028] p-3 border border-gray-200 dark:border-white/10 rounded-xl shadow-lg">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
            {format(new Date(label), "MMM dd, yyyy")}
          </p>
          <p className="text-sm font-semibold text-primary">
            Win Rate: {payload[0].value}%
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {payload[0].payload.wins} wins / {payload[0].payload.trades} trades
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none focus:outline-none" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.3} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => format(new Date(value), "MMM dd")}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
            minTickGap={30}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--hover-bg)', opacity: 0.1 }} />
          <Bar dataKey="winRate" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                // Color logic: 
                // High win rate (>50%) = Green
                // Low win rate (<50% but >0) = Amber/Orange? 
                // 0% with trades = Red?
                // Let's keep it simple green for now, or maybe gradient?
                // User said "Daily Win Rate", usually expected to be Green.
                fill={entry.trades === 0 ? 'transparent' : entry.winRate >= 50 ? 'hsl(var(--primary))' : '#F59E0B'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
