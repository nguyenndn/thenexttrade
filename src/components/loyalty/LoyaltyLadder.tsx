"use client";

import type { UserLoyaltyProgress, LoyaltyTierItem } from "@/lib/loyalty/loyalty.types";
import { Button } from "@/components/ui/Button";
import {
  CheckCircle2,
  Clock,
  Lock,
  Coins,
  Check,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LoyaltyLadderProps {
  progress: UserLoyaltyProgress;
  onOpenClaim: (tier: LoyaltyTierItem) => void;
  claimingLevel?: number | null;
}

export function LoyaltyLadder({ progress, onOpenClaim, claimingLevel }: LoyaltyLadderProps) {
  const { tiers, totalCumulativeLots, currentTier } = progress;

  // Render ladder ascending from Level 1 up to Level 10
  const sortedTiers = [...tiers].sort((a, b) => a.level - b.level);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-5 sm:p-7 shadow-sm relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-white/10">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Roadmap Ladder
          </span>
          <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
            Reach the Top to Unlock Full Potential
          </h2>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-xs text-gray-400">Current Traded Volume</span>
          <p className="font-mono text-base font-black text-gray-900 dark:text-white">
            {totalCumulativeLots.toLocaleString()} Lots
          </p>
        </div>
      </div>

      {/* The Sleek Vertical Timeline Container */}
      <div className="space-y-4">
        {sortedTiers.map((tier, idx) => {
          const isCurrentTier = currentTier?.level === tier.level;

          return (
            <div
              key={tier.level}
              className={`relative flex items-stretch gap-3 sm:gap-5 group transition-all duration-300 ${
                tier.isUnlocked
                  ? "opacity-100"
                  : "opacity-65 hover:opacity-90"
              }`}
            >
              {/* Left Column: Required Volume (Lots) */}
              <div className="w-16 sm:w-20 text-right shrink-0 flex flex-col justify-center">
                <span className="block font-mono text-sm sm:text-base font-black text-gray-900 dark:text-white">
                  {tier.requiredLots.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Lots
                </span>
              </div>

              {/* Center Timeline Node: Sleek Minimal Checkpoint */}
              <div className="relative flex flex-col items-center justify-center shrink-0 self-stretch px-1">
                {/* Top Connector Line */}
                <div
                  className={cn(
                    "w-0.5 flex-1 transition-colors duration-300",
                    idx === 0
                      ? "invisible"
                      : tier.isUnlocked
                      ? "bg-amber-500/40"
                      : "bg-gray-200 dark:bg-white/10"
                  )}
                />

                {/* Milestone Node */}
                <div className="my-1 shrink-0 flex items-center justify-center w-6 h-6">
                  {tier.isClaimed ? (
                    <div className="w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                      <Check size={11} strokeWidth={3} />
                    </div>
                  ) : tier.canClaim ? (
                    <div className="w-5 h-5 rounded-full bg-gold text-white ring-4 ring-amber-500/20 shadow-sm shadow-amber-500/30 flex items-center justify-center">
                      <Check size={11} strokeWidth={3} />
                    </div>
                  ) : isCurrentTier ? (
                    <div className="relative flex items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border-2 border-white dark:border-[#151925]" />
                    </div>
                  ) : tier.isUnlocked ? (
                    <div className="w-3 h-3 rounded-full bg-amber-500/60 border border-amber-500" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-white/20" />
                  )}
                </div>

                {/* Bottom Connector Line */}
                <div
                  className={cn(
                    "w-0.5 flex-1 transition-colors duration-300",
                    idx === sortedTiers.length - 1
                      ? "invisible"
                      : sortedTiers[idx + 1]?.isUnlocked
                      ? "bg-amber-500/40"
                      : "bg-gray-200 dark:bg-white/10"
                  )}
                />
              </div>

              {/* Right Details Panel: Tier Info & Reward Action */}
              <div className="flex-1 min-w-0 p-3 sm:p-4 rounded-lg border border-gray-100 dark:border-white/5 bg-gray-50/40 dark:bg-white/[0.015] hover:border-gray-200 dark:hover:border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                      Level {tier.level}
                    </span>
                    <span className="text-sm font-black text-gray-900 dark:text-white truncate">
                      {tier.name}
                    </span>
                  </div>

                  <p className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 truncate">
                    {tier.cashAmount > 0 ? (
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Coins size={14} className="shrink-0 text-amber-500" />
                        ${tier.cashAmount.toLocaleString()} USDT Cash
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">
                        {tier.rewardTitle}
                      </span>
                    )}
                  </p>

                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                    {tier.perkDescription}
                  </p>
                </div>

                {/* Action / State Button */}
                <div className="shrink-0 pt-1 sm:pt-0">
                  {tier.isClaimed ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20">
                      <CheckCircle2 size={14} />
                      Claimed
                    </span>
                  ) : tier.isPending ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20">
                      <Clock size={14} />
                      Pending Approval
                    </span>
                  ) : tier.canClaim ? (
                    <Button
                      variant="gold"
                      size="smd"
                      disabled={claimingLevel === tier.level}
                      onClick={() => onOpenClaim(tier)}
                    >
                      {claimingLevel === tier.level ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Coins size={14} />
                          Claim Reward
                        </>
                      )}
                    </Button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-gray-400 bg-gray-100 dark:bg-white/5 rounded-lg">
                      <Lock size={12} />
                      Locked
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
