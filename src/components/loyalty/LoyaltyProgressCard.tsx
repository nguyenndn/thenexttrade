"use client";

import type { UserLoyaltyProgress } from "@/lib/loyalty/loyalty.types";
import { Award, Zap, TrendingUp, CheckCircle2 } from "lucide-react";

interface LoyaltyProgressCardProps {
  progress: UserLoyaltyProgress;
}

export function LoyaltyProgressCard({ progress }: LoyaltyProgressCardProps) {
  const {
    totalCumulativeLots,
    currentTier,
    nextTier,
    progressToNext,
    lotsToNext,
    claimedLevels,
    eligibility,
  } = progress;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-5 sm:p-6 shadow-sm relative overflow-hidden">

      {/* Header Badge */}
      <div className="flex items-center justify-between gap-3 mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-xs">
            <Award size={20} />
          </div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              {currentTier ? currentTier.name : "Initiating Trader"}
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold uppercase tracking-wide bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Level {currentTier ? currentTier.level : 0}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Claimed
          </span>
          <p className="font-mono text-base font-black text-gray-900 dark:text-white">
            {claimedLevels.length} <span className="text-xs text-gray-400">/ 10</span>
          </p>
        </div>
      </div>

      {/* Primary Target Callout (Matching Exness Target 1) */}
      <div className="mb-5 p-4 rounded-lg border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-amber-500" />
            Qualifying Lifetime Volume
          </span>
          {nextTier ? (
            <span className="font-mono font-bold text-gray-900 dark:text-white">
              {lotsToNext.toLocaleString()} Lots to Target
            </span>
          ) : (
            <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
              <CheckCircle2 size={13} />
              Maximum Level Reached
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="font-mono text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            {totalCumulativeLots.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            Lots
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gold transition-all duration-700 ease-out"
              style={{ width: `${progressToNext}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-gray-400 font-mono">
            <span>{currentTier ? `${currentTier.requiredLots} Lots` : "0 Lots"}</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">
              {progressToNext}% Complete
            </span>
            <span>{nextTier ? `${nextTier.requiredLots} Lots` : "Max"}</span>
          </div>
        </div>
      </div>

      {/* 2x2 Matrix Card (Design System Invariant) */}
      <div className="grid grid-cols-2 rounded-lg border border-gray-200 dark:border-white/10 divide-x divide-y divide-gray-200 dark:divide-white/10 bg-gray-50/50 dark:bg-white/[0.01] overflow-hidden">
        <div className="p-3">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
            Active MT5 Accounts
          </span>
          <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
            {eligibility.activeLiveAccounts} Live Connected
          </span>
        </div>

        <div className="p-3">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
            Verified Trades
          </span>
          <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
            {eligibility.totalClosedTrades.toLocaleString()} Executed
          </span>
        </div>

        <div className="p-3">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
            Next Milestone
          </span>
          <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">
            {nextTier ? `Level ${nextTier.level} (${nextTier.name})` : "Max Tier"}
          </span>
        </div>

        <div className="p-3">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
            Next Reward Unlock
          </span>
          <span className="font-mono text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1 truncate">
            <Zap size={12} className="text-amber-500 shrink-0" />
            {nextTier ? (nextTier.cashAmount > 0 ? `$${nextTier.cashAmount.toLocaleString()} USDT` : "Pro System") : "Complete"}
          </span>
        </div>
      </div>
    </div>
  );
}
