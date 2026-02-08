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
    <div className="bg-white dark:bg-[#0B0E14] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm border-t-4 border-t-cyan-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500">
          <BarChart3 size={20} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Performance by Symbol</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">P&L and Volume per pair</p>
        </div>
      </div>

      <div className="w-full">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">
          <div className="col-span-5">Symbol</div>
          <div className="col-span-3 text-right">Trades</div>
          <div className="col-span-4 text-right">P&L</div>
        </div>

        {/* List */}
        <div className="space-y-1 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
          {data.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4 italic">No trades found.</p>
          ) : (
            data.map((item, index) => (
              <div
                key={item.symbol}
                className="grid grid-cols-12 gap-4 items-center py-3 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-sm border-b border-gray-50 dark:border-white/5 last:border-0"
              >
                <div className="col-span-5 font-bold text-gray-700 dark:text-gray-200">
                  {item.symbol}
                </div>
                <div className="col-span-3 text-right text-gray-500 font-medium">
                  {item.trades}
                </div>
                <div className={`col-span-4 text-right font-bold ${item.pnl >= 0 ? "text-[#00C888]" : "text-red-500"}`}>
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
