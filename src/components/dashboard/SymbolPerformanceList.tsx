"use client";

import { BarChart3 } from "lucide-react";

interface SymbolStat {
  symbol: string;
  trades: number;
  pnl: number;
}

interface SymbolPerformanceListProps {
  data: SymbolStat[];
}

export function SymbolPerformanceList({ data }: SymbolPerformanceListProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      signDisplay: 'never' // Handle color manually
    }).format(Math.abs(value));
  };

  return (
    <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-cyan-500 overflow-hidden h-[360px] flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500">
            <BarChart3 size={18} />
          </div>
          <div>
            <h3 className="font-bold text-gray-700 dark:text-white text-sm">Performance by Symbol</h3>
            <p className="text-xs text-gray-500">P&L and Volume per pair</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-50 dark:divide-white/5 flex-1 flex flex-col overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-white/[0.02]">
          <div className="col-span-5">Symbol</div>
          <div className="col-span-3 text-right">Trades</div>
          <div className="col-span-4 text-right">P&L</div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-gray-50 dark:divide-white/5">
          {data.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-600 dark:text-gray-300 font-medium">
              <BarChart3 size={28} className="mb-2 opacity-50" />
              <p className="text-sm">No data available</p>
            </div>
          ) : (
            data.map((item) => (
              <div
                key={item.symbol}
                className="grid grid-cols-12 gap-2 items-center px-5 py-3 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className="col-span-5 font-bold text-sm text-gray-800 dark:text-gray-200">
                  {item.symbol}
                </div>
                <div className="col-span-3 text-right text-xs text-gray-600 font-medium">
                  {item.trades}
                </div>
                <div className={`col-span-4 text-right font-bold text-sm ${item.pnl >= 0 ? "text-primary" : "text-red-500"}`}>
                  {item.pnl >= 0 ? "+" : "-"}{formatCurrency(item.pnl)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
