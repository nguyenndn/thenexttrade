"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChartContainer } from "@/components/ui/ChartContainer";

interface LotDistributionChartProps {
  data: {
    name: string;
    value: number;
  }[];
  height?: number | string;
  innerRadius?: number;
  outerRadius?: number;
}

const COLORS = [
  'hsl(var(--primary))',
  '#3B82F6',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#EF4444',
];

export function LotDistributionChart({ data, height = 300, innerRadius = 60, outerRadius = 80 }: LotDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`w-full flex items-center justify-center font-medium text-sm text-gray-600 dark:text-gray-300`} style={{ height }}>
        No data available
      </div>
    );
  }

  const chartData = data.filter(d => d.value > 0);
  const totalLots = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <ChartContainer height={height} minHeight={200}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <PieChart key={JSON.stringify(chartData)}>
          <defs>
            {COLORS.map((color, i) => (
              <linearGradient key={`lotGrad${i}`} id={`lotGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={1} />
                <stop offset="100%" stopColor={color} stopOpacity={0.7} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={4}
            dataKey="value"
            animationDuration={800}
            animationBegin={0}
            stroke="none"
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`url(#lotGrad${index % COLORS.length})`}
                className="drop-shadow-sm"
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }: any) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload;
                const percent = totalLots > 0 ? ((d.value / totalLots) * 100).toFixed(1) : '0';
                return (
                  <div className="bg-white dark:bg-[#1E2028] p-2.5 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[chartData.indexOf(d) % COLORS.length] }} />
                    <div>
                      <p className="text-xs font-medium text-gray-500">{d.name}</p>
                      <p className="text-sm font-black text-gray-700 dark:text-white">
                        {Number(d.value).toFixed(2)} Lots <span className="text-gray-400 font-medium">({percent}%)</span>
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          {/* Center label */}
          <text x="50%" y="46%" textAnchor="middle" dominantBaseline="central" className="fill-gray-400 text-[8px] font-medium">
            TOTAL
          </text>
          <text x="50%" y="56%" textAnchor="middle" dominantBaseline="central" className="fill-gray-700 dark:fill-white text-[10px] font-black">
            {totalLots.toFixed(2)}
          </text>
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
