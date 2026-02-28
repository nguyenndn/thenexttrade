"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Trade {
  id: string;
  symbol: string;
  date: Date | null;
  pnl: number | null;
  lotSize: number;
}

interface TopTradesListProps {
  bestTrades: Trade[];
  worstTrades: Trade[];
}

export function TopTradesList({ bestTrades, worstTrades }: TopTradesListProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return format(new Date(date), "MMM dd");
  };

  const formatCurrency = (value: number | null) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      signDisplay: 'never' // We handle color separately
    }).format(value || 0);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-cyan-500 overflow-hidden">
      {/* Container Header */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500">
            <TrendingUp size={18} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Top Trades</h3>
            <p className="text-xs text-gray-400">Best & Worst Performance</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar">

        {/* Best Trades Section */}
        <div className="flex-1">
          <h4 className="px-5 pt-4 pb-2 text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wider">
              <TrendingUp size={16} /> Best Trades
          </h4>
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 dark:bg-white/[0.02]">
              <div className="col-span-3">Symbol</div>
              <div className="col-span-2 text-center text-gray-400/70">Lot</div>
              <div className="col-span-4 text-center">Date</div>
              <div className="col-span-3 text-right">P&L</div>
            </div>
            {/* Table Body */}
            <div>
              {bestTrades.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 font-medium">No winning trades yet</div>
              ) : (
                bestTrades.map((trade) => (
                  <div key={trade.id} className="grid grid-cols-12 gap-2 items-center px-5 py-3 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors cursor-default border-t border-gray-50 dark:border-white/10 first:border-0">
                    <div className="col-span-3 flex items-center">
                      <span className="font-bold text-sm text-gray-800 dark:text-gray-200">
                        {trade.symbol}
                      </span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-xs text-gray-400/80 font-medium bg-gray-100/50 dark:bg-white/5 px-2 py-0.5 rounded-md">
                        {Number(trade.lotSize).toFixed(2)}
                      </span>
                    </div>
                    <div className="col-span-4 text-center text-xs text-gray-400 font-medium">
                      {formatDate(trade.date)}
                    </div>
                    <div className="col-span-3 text-right font-bold text-sm text-primary">
                      +{formatCurrency(trade.pnl)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Worst Trades Section */}
        <div className="flex-1 mt-auto">
          <h4 className="px-5 pt-4 pb-2 text-sm font-bold text-red-500 flex items-center gap-2 uppercase tracking-wider">
              <TrendingDown size={16} /> Worst Trades
          </h4>
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 dark:bg-white/[0.02]">
              <div className="col-span-3">Symbol</div>
              <div className="col-span-2 text-center text-gray-400/70">Lot</div>
              <div className="col-span-4 text-center">Date</div>
              <div className="col-span-3 text-right">P&L</div>
            </div>
            {/* Table Body */}
            <div>
              {worstTrades.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 font-medium">No losing trades yet</div>
              ) : (
                worstTrades.map((trade) => (
                  <div key={trade.id} className="grid grid-cols-12 gap-2 items-center px-5 py-3 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors cursor-default border-t border-gray-50 dark:border-white/10 first:border-0">
                    <div className="col-span-3 flex items-center">
                      <span className="font-bold text-sm text-gray-800 dark:text-gray-200">
                        {trade.symbol}
                      </span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-xs text-gray-400/80 font-medium bg-gray-100/50 dark:bg-white/5 px-2 py-0.5 rounded-md">
                        {Number(trade.lotSize).toFixed(2)}
                      </span>
                    </div>
                    <div className="col-span-4 text-center text-xs text-gray-400 font-medium">
                      {formatDate(trade.date)}
                    </div>
                    <div className="col-span-3 text-right font-bold text-sm text-red-500">
                      {formatCurrency(trade.pnl)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
