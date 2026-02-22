"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface LotDistributionChartProps {
  data: {
    name: string;
    value: number; // Volume in Standard Lots
  }[];
  height?: number | string;
  innerRadius?: number;
  outerRadius?: number;
}

// Match colors with ProfitDistributionChart
const COLORS = ['hsl(var(--primary))', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444'];

export function LotDistributionChart({ data, height = 300, innerRadius = 60, outerRadius = 80 }: LotDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`w-full flex items-center justify-center font-medium text-sm text-gray-400 dark:text-gray-500`} style={{ height }}>
        No data available
      </div>
    );
  }

  // Filter valid data
  const chartData = data.filter(d => d.value > 0);

  return (
    <div className="w-full [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none focus:outline-none" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart key={JSON.stringify(chartData)}>
          <Pie
            data={chartData}
            cx="35%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={5}
            dataKey="value"
            animationDuration={1000}
            animationBegin={0}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }: any) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white dark:bg-[#1E2028] p-3 border border-gray-100 dark:border-white/10 rounded-xl shadow-xl flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload.fill }}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{data.name}</p>
                      <p className="text-base font-bold text-gray-900 dark:text-white">
                        {Number(data.value).toFixed(2)} Lots
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingRight: "10px" }}
            formatter={(value) => <span className="text-gray-500 dark:text-gray-400 text-xs font-medium ml-1">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
