"use client";

import type { LoyaltyTierItem } from "@/lib/loyalty/loyalty.types";
import {
  Award,
  Coins,
  Shield,
  ShieldCheck,
  Zap,
  Gem,
  Diamond,
  Flame,
  Trophy,
  Crown,
  Sparkles,
} from "lucide-react";
import React from "react";

const TIER_ICONS: Record<string, React.ElementType> = {
  Shield,
  ShieldCheck,
  Zap,
  Award,
  Gem,
  Diamond,
  Flame,
  Trophy,
  Crown,
  Sparkles,
};

interface LoyaltyTiersMatrixProps {
  tiers: LoyaltyTierItem[];
}

export function LoyaltyTiersMatrix({ tiers }: LoyaltyTiersMatrixProps) {
  const sortedTiers = [...tiers].sort((a, b) => a.level - b.level);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-gray-900 dark:text-white tracking-tight">
            Institutional Milestone Architecture (10 Tiers)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Configured volume requirements, direct USDT payouts, and automated privilege access.
          </p>
        </div>
        <div className="text-xs font-mono font-bold text-gray-400">
          {tiers.length} Tiers Configured
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {sortedTiers.map((tier) => {
          const IconComponent = TIER_ICONS[tier.icon] || Award;

          return (
            <div
              key={tier.level}
              className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-4 shadow-sm flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-gray-300 dark:hover:border-white/20 transition-all"
            >
              {/* Top Accent Line */}
              <div
                className="absolute top-0 inset-x-0 h-1"
                style={{ backgroundColor: tier.badgeColor || "#F59E0B" }}
              />

              <div>
                <div className="flex items-center justify-between gap-2 mb-2 pt-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center border text-xs shadow-xs"
                      style={{
                        backgroundColor: `${tier.badgeColor || "#F59E0B"}15`,
                        borderColor: `${tier.badgeColor || "#F59E0B"}30`,
                        color: tier.badgeColor || "#F59E0B",
                      }}
                    >
                      <IconComponent size={16} />
                    </div>
                    <span className="font-mono text-xs font-bold text-gray-500 dark:text-gray-400">
                      Level {tier.level}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300">
                    {tier.isActive ? "Active" : "Paused"}
                  </span>
                </div>

                <h4 className="text-sm font-black text-gray-900 dark:text-white truncate">
                  {tier.name}
                </h4>

                <div className="mt-2 p-2.5 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                    Milestone Volume
                  </span>
                  <p className="font-mono text-base font-black text-gray-900 dark:text-white">
                    {tier.requiredLots.toLocaleString()} <span className="text-xs text-gray-400">Lots</span>
                  </p>
                </div>

                <div className="mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                    Reward Benefit
                  </span>
                  {tier.cashAmount > 0 ? (
                    <p className="font-mono text-sm font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Coins size={14} className="shrink-0" />
                      ${tier.cashAmount.toLocaleString()} USDT Cash
                    </p>
                  ) : (
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
                      {tier.rewardTitle}
                    </p>
                  )}
                </div>

                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                  {tier.perkDescription}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-white/5 text-[10px] font-mono text-gray-400 flex items-center justify-between">
                <span>Payout: USDT</span>
                <span>Order #{tier.order}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
