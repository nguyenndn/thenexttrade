"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Trade {
  id: string;
  symbol: string;
  exitDate: Date | null;
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
    <div className="flex flex-col gap-6">

      {/* Best Trades */}
      <div>
        <h4 className="text-sm font-bold text-[#00C888] mb-3 flex items-center gap-2">
          <TrendingUp size={16} /> Best Trades
        </h4>
        <div className="space-y-3">
          {bestTrades.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No winning trades yet.</p>
          ) : (
            bestTrades.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between text-sm group cursor-default">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-700 dark:text-gray-300 group-hover:text-[#00C888] transition-colors">
                    {trade.symbol}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {Number(trade.lotSize).toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(trade.exitDate)}
                  </span>
                </div>
                <span className="font-bold text-[#00C888]">
                  +{formatCurrency(trade.pnl)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Separator if needed, or just gap */}

      {/* Worst Trades */}
      <div>
        <h4 className="text-sm font-bold text-red-500 mb-3 flex items-center gap-2">
          <TrendingDown size={16} /> Worst Trades
        </h4>
        <div className="space-y-3">
          {worstTrades.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No losing trades yet.</p>
          ) : (
            worstTrades.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between text-sm group cursor-default">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-700 dark:text-gray-300 group-hover:text-red-500 transition-colors">
                    {trade.symbol}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {Number(trade.lotSize).toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(trade.exitDate)}
                  </span>
                </div>
                <span className="font-bold text-red-500">
                  {formatCurrency(trade.pnl)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
