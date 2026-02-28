"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useTheme } from "@/components/providers/ThemeProvider";

interface WinLossDistributionProps {
  wins: number;
  losses: number;
  breakEvens: number;
  winRate: number;
}

export function WinLossDistribution({ wins, losses, breakEvens, winRate }: WinLossDistributionProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const data = [
    { name: "Wins", value: wins, color: "#10B981" },     // bg-emerald-500
    { name: "Losses", value: losses, color: "#EF4444" }, // bg-red-500
    // { name: "Break Even", value: breakEvens, color: "#9CA3AF" }, // bg-gray-400
  ];

  // Only add BE if there are any
  if (breakEvens > 0) {
    data.push({ name: "Break Even", value: breakEvens, color: "#9CA3AF" });
  }

  // Calculate coordinates for the text in the middle of the donut
  // A half pie chart goes from 180 (left) to 0 (right).
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-emerald-500 p-5">
      <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-6">Win/Loss Distribution</h3>
      
      <div className="flex-1 relative min-h-[180px] [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none focus:outline-none">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius="75%"
              outerRadius="100%"
              dataKey="value"
              stroke="none"
              cornerRadius={10}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text (Win Rate %) */}
        <div className="absolute bottom-4 left-0 w-full text-center pointer-events-none">
          <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {winRate.toFixed(1)}%
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1">
            WIN RATE
          </p>
        </div>
      </div>

      {/* Legend below the chart */}
      <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {wins} Wins
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {losses} Losses
          </span>
        </div>
        {breakEvens > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {breakEvens} BE
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
