"use client";

import type { UserLoyaltyProgress } from "@/lib/loyalty/loyalty.types";
import { CheckCircle2, AlertCircle, Info, ShieldCheck } from "lucide-react";

interface LoyaltyEligibilityCardProps {
  progress: UserLoyaltyProgress;
}

export function LoyaltyEligibilityCard({ progress }: LoyaltyEligibilityCardProps) {
  const { eligibility, totalCumulativeLots, nextTier } = progress;

  const target1Met = totalCumulativeLots >= 10;
  const target2Met = eligibility.activeLiveAccounts > 0 || eligibility.totalClosedTrades > 0;
  const target3Met = eligibility.hasPartnerBrokerAccount || eligibility.activeLiveAccounts > 0;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-5 sm:p-6 shadow-sm space-y-4">
      <div>
        <h3 className="text-base font-black text-gray-900 dark:text-white tracking-tight">
          Qualifying Rules & Payout Criteria
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Complete volume milestones on verified accounts to unlock instant USDT dispatches and institutional perks.
        </p>
      </div>

      {/* Target Criteria 1 */}
      <div className="p-3.5 rounded-lg border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Target 1 · Cumulative Volume
          </span>
          {target1Met ? (
            <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
              <CheckCircle2 size={13} />
              Active Milestone
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-bold text-gray-400">
              <AlertCircle size={13} />
              Initiating
            </span>
          )}
        </div>
        <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
          Verified lifetime trading volume accumulated from live MT5 journal & telemetry sync.
        </p>
        <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
          Current Result: <strong className="text-gray-900 dark:text-white">{totalCumulativeLots.toLocaleString()} Lots</strong>
          {nextTier && ` · Next Target: ${nextTier.requiredLots.toLocaleString()} Lots`}
        </p>
      </div>

      {/* Target Criteria 2 */}
      <div className="p-3.5 rounded-lg border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Target 2 · Live MT5 Sync Connection
          </span>
          {target2Met ? (
            <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
              <CheckCircle2 size={13} />
              Target Achieved!
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-bold text-gray-400">
              <AlertCircle size={13} />
              Awaiting First Live Trade
            </span>
          )}
        </div>
        <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
          Accounts must be verified REAL MetaTrader 5 terminals (Demo accounts are filtered).
        </p>
        <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
          Current Result: <strong className="text-gray-900 dark:text-white">{eligibility.activeLiveAccounts} Active Accounts</strong> · {eligibility.totalClosedTrades} Trades
        </p>
      </div>

      {/* Target Criteria 3 */}
      <div className="p-3.5 rounded-lg border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Target 3 · Partner Broker Affiliation
          </span>
          {target3Met ? (
            <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
              <CheckCircle2 size={13} />
              Verified Partner
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-bold text-gray-400">
              <AlertCircle size={13} />
              Standard Connection
            </span>
          )}
        </div>
        <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
          Trades placed under TheNextTrade partner IB codes receive 100% full rewards & rebate eligibility.
        </p>
        <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
          Supported Partners: Exness, XM, IC Markets, Vantage.
        </p>
      </div>

      {/* Trust & Transparency Note */}
      <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 flex items-start gap-2.5">
        <ShieldCheck size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
          <strong className="text-gray-900 dark:text-white">Institutional Transparency:</strong> Rewards and cash disbursements are funded directly from institutional broker rebate allocations. Zero synthetic volume is counted; every lot reflects verified market execution.
        </div>
      </div>
    </div>
  );
}
