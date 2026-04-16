"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { format, parseISO, isWithinInterval } from "date-fns";

interface DailyWinRateChartProps {
  data: {
    date: string;
    winRate: number;
    trades: number;
    wins: number;
  }[];
  height?: number | string;
  selectedDates?: { from?: string; to?: string };
}

export function DailyWinRateChart({ data, height = 300, selectedDates }: DailyWinRateChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`w-full flex items-center justify-center font-medium text-sm text-gray-600 dark:text-gray-300`} style={{ height }}>
        No data available
      </div>
    );
  }

  // Determine if a date falls within the selected range
  const isSelected = (dateStr: string) => {
    if (!selectedDates?.from || !selectedDates?.to) return true; // No filter = all selected
    try {
      const date = parseISO(dateStr);
      const from = parseISO(selectedDates.from);
      const to = parseISO(selectedDates.to);
      return isWithinInterval(date, { start: from, end: to });
    } catch {
      return true;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const winRate = Number(payload[0].value);
      const entry = payload[0].payload;
      const hasData = entry.trades > 0;
      const selected = isSelected(label);
      return (
        <div className="bg-white dark:bg-[#1E2028] p-3 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl backdrop-blur-sm">
          <p className="text-xs font-bold text-gray-700 dark:text-gray-100 mb-1.5">
            {format(new Date(label), "MMM dd, yyyy")}
            {selected && <span className="ml-1.5 text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Selected</span>}
          </p>
          {hasData ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${winRate >= 50 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <p className={`text-sm font-black ${winRate >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {winRate.toFixed(1)}% Win Rate
                </p>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {entry.wins} wins / {entry.trades} trades
              </p>
            </>
          ) : (
            <p className="text-xs text-gray-400 italic">No trades</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Determine tick interval based on data length
  const tickInterval = data.length > 60 ? 6 : data.length > 30 ? 3 : data.length > 14 ? 1 : 0;

  return (
    <div className="w-full [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none focus:outline-none" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="winGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="winGradientDim" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
            </linearGradient>
            <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="lossGradientDim" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.15} />
            </linearGradient>
            <linearGradient id="zeroGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D1D5DB" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#D1D5DB" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.15)" />
          <ReferenceLine y={50} stroke="hsl(var(--primary))" strokeDasharray="6 4" strokeOpacity={0.3} label={{ value: "50%", position: "right", fontSize: 9, fill: "hsl(var(--primary))", fontWeight: 600 }} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => format(new Date(value), "MMM dd")}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            interval={tickInterval}
            minTickGap={20}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(156,163,175,0.06)' }} />
          <Bar dataKey="winRate" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {data.map((entry, index) => {
              const selected = isSelected(entry.date);
              const hasAnySelected = selectedDates?.from && selectedDates?.to;
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.trades === 0
                      ? 'url(#zeroGradient)'
                      : entry.winRate >= 50
                        ? (hasAnySelected && !selected ? 'url(#winGradientDim)' : 'url(#winGradient)')
                        : (hasAnySelected && !selected ? 'url(#lossGradientDim)' : 'url(#lossGradient)')
                  }
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
