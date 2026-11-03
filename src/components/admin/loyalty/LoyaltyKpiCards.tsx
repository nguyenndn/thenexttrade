"use client";

import type { AdminLoyaltyStats } from "@/actions/admin/loyalty";
import { Clock, CheckCircle2, TrendingUp, Users } from "lucide-react";

interface LoyaltyKpiCardsProps {
  stats: AdminLoyaltyStats;
}

export function LoyaltyKpiCards({ stats }: LoyaltyKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Pending Claims */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-5 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Pending Claims
          </span>
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20">
            <Clock size={16} />
          </div>
        </div>
        <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight font-mono tabular-nums">
          {stats.pendingCount}{" "}
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
            (${stats.pendingAmount.toLocaleString()} USDT)
          </span>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 pt-1.5 border-t border-gray-100 dark:border-white/5">
          Awaiting admin verification & transfer
        </p>
      </div>

      {/* 2. Total Disbursed */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-5 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Total Disbursed
          </span>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
            <CheckCircle2 size={16} />
          </div>
        </div>
        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight font-mono tabular-nums">
          ${stats.completedAmount.toLocaleString()}{" "}
          <span className="text-xs font-bold text-gray-400">USDT</span>
        </p>
        <p className="text-xs font-mono tabular-nums text-gray-500 dark:text-gray-400 pt-1.5 border-t border-gray-100 dark:border-white/5">
          {stats.completedCount} milestone rewards fulfilled
        </p>
      </div>

      {/* 3. Total Volume Lots */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-5 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Processed Volume
          </span>
          <div className="p-2.5 rounded-lg bg-gold/10 text-amber-600 dark:text-gold ring-1 ring-gold/20">
            <TrendingUp size={16} />
          </div>
        </div>
        <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight font-mono tabular-nums">
          {stats.totalVolumeLots.toLocaleString()}{" "}
          <span className="text-xs font-bold text-gray-400">Lots</span>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 pt-1.5 border-t border-gray-100 dark:border-white/5">
          Cumulative verified volume on claims
        </p>
      </div>

      {/* 4. Top Tier Traders */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-5 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            High-Volume Traders
          </span>
          <div className="p-2.5 rounded-lg bg-gold/10 text-amber-600 dark:text-gold ring-1 ring-gold/20">
            <Users size={16} />
          </div>
        </div>
        <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight font-mono tabular-nums">
          {stats.topTradersCount}{" "}
          <span className="text-xs font-bold text-amber-600 dark:text-gold">Traders</span>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 pt-1.5 border-t border-gray-100 dark:border-white/5">
          Active at Level 5+ (300+ Lots)
        </p>
      </div>
    </div>
  );
}
