"use client";

import type { UserLoyaltyProgress } from "@/lib/loyalty/loyalty.types";
import { Award, Zap, TrendingUp, CheckCircle2, ShieldCheck, Activity } from "lucide-react";

interface LoyaltyCommandHeroProps {
  progress: UserLoyaltyProgress;
}

export function LoyaltyCommandHero({ progress }: LoyaltyCommandHeroProps) {
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
    <div className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-5 sm:p-7 shadow-sm relative overflow-hidden">

      {/* Top Bar: Level Badge, Live Telemetry Beacon, and Milestones Claimed */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-white/10 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-xs">
            <Award size={20} />
          </div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {currentTier ? currentTier.name : "Initiating Trader"}
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wide bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Level {currentTier ? currentTier.level : 0}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-lg border border-gray-100 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Claimed Milestones
            </span>
            <p className="font-mono text-sm sm:text-base font-black text-gray-900 dark:text-white leading-tight">
              {claimedLevels.length}{" "}
              <span className="text-xs text-gray-400 font-normal">/ 10 Tiers</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main 3-Column Command Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-5 relative z-10">
        {/* Column 1: Giant Cumulative Lot Counter (4 cols) */}
        <div className="lg:col-span-4 space-y-1.5">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-amber-500" />
            Qualifying Lifetime Volume
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              {totalCumulativeLots.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Lots
            </span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Continuous aggregation across verified live MT5 trading journals.
          </p>
        </div>

        {/* Column 2: Continuous Horizontal Milestone Progress (5 cols) */}
        <div className="lg:col-span-5 p-4 rounded-lg border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-gray-700 dark:text-gray-300">
              {nextTier ? (
                <>Next Target: <strong className="text-gray-900 dark:text-white">Level {nextTier.level} ({nextTier.name})</strong></>
              ) : (
                <span className="text-amber-500 flex items-center gap-1 font-bold">
                  <CheckCircle2 size={13} />
                  Apex Milestone Unlocked
                </span>
              )}
            </span>
            {nextTier ? (
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {lotsToNext.toLocaleString()} Lots to Target
              </span>
            ) : (
              <span className="text-xs font-mono text-gray-400">Max Reached</span>
            )}
          </div>

          {/* Progress Track */}
          <div className="space-y-1.5">
            <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gold transition-all duration-700 ease-out"
                style={{ width: `${progressToNext}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] font-mono text-gray-400">
              <span>{currentTier ? `${currentTier.requiredLots.toLocaleString()} Lots` : "0 Lots"}</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {progressToNext}% Completed
              </span>
              <span>{nextTier ? `${nextTier.requiredLots.toLocaleString()} Lots` : "Max Tier"}</span>
            </div>
          </div>

          {/* Reward Unlock Callout Tag */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100 dark:border-white/5">
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Zap size={12} className="text-amber-500" />
              Target Reward:
            </span>
            <span className="font-mono text-xs font-bold text-gray-900 dark:text-white truncate">
              {nextTier ? (
                nextTier.cashAmount > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-black">
                    ${nextTier.cashAmount.toLocaleString()} USDT Cash Payout
                  </span>
                ) : (
                  nextTier.rewardTitle
                )
              ) : (
                "All Milestones Completed"
              )}
            </span>
          </div>
        </div>

        {/* Column 3: 2x2 Telemetry Matrix (3 cols) */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-2 rounded-lg border border-gray-200 dark:border-white/10 divide-x divide-y divide-gray-200 dark:divide-white/10 bg-gray-50/50 dark:bg-white/[0.015] overflow-hidden">
            <div className="p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                Active MT5
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                <Activity size={12} className="text-amber-500 shrink-0" />
                {eligibility.activeLiveAccounts} Connected
              </span>
            </div>

            <div className="p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                Trades Logged
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                {eligibility.totalClosedTrades.toLocaleString()} Executed
              </span>
            </div>

            <div className="p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                Partner Broker
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <ShieldCheck size={12} className="shrink-0" />
                {eligibility.hasPartnerBrokerAccount ? "Verified Partner" : "Standard Sync"}
              </span>
            </div>

            <div className="p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                Next Milestone
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate block">
                {nextTier ? `L${nextTier.level} · ${nextTier.requiredLots}L` : "Completed"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
