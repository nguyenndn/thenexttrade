"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ChartContainer } from "@/components/ui/ChartContainer";

interface WinLossComparisonChartProps {
  avgWin: number;
  avgLoss: number;
}

export function WinLossComparisonChart({ avgWin, avgLoss }: WinLossComparisonChartProps) {
  const hasData = avgWin > 0 || avgLoss > 0;
  
  if (!hasData) {
    return (
      <div className="w-full h-full min-h-[180px] flex flex-col border-t-4 border-t-red-500 overflow-hidden items-center justify-center font-medium text-sm text-gray-500 dark:text-gray-400">
        No trade data available
      </div>
    );
  }

  const chartData = [
    { name: "Average Win", value: avgWin, color: "hsl(var(--primary))" },
    { name: "Average Loss", value: avgLoss, color: "#EF4444" }
  ];

  return (
    <div className="flex flex-col h-full justify-between border-t-4 border-t-red-500 overflow-hidden p-4 pb-2">
      <ChartContainer height="100%" minHeight={100} className="w-full h-full flex-1">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <BarChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-white/5" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              cursor={{ fill: 'rgba(156,163,175,0.06)' }}
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  const entry = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-[#1E2028] p-3 border border-dashboard rounded-xl shadow-xl">
                      <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">{entry.name}</p>
                      <p className="text-sm font-black text-gray-900 dark:text-white">
                        ${Number(entry.value).toFixed(2)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={45}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Extra insights inside widget */}
      <div className="flex items-center justify-around text-xs mt-2 border-t border-gray-100 dark:border-white/5 pt-3">
        <div className="text-center">
          <p className="text-gray-400">Ratio (W/L)</p>
          <p className="font-extrabold text-gray-800 dark:text-gray-200">
            {avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : avgWin > 0 ? "Infinity" : "0.00"}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-400">Avg Win</p>
          <p className="font-extrabold text-emerald-500">${avgWin.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400">Avg Loss</p>
          <p className="font-extrabold text-red-500">${avgLoss.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
