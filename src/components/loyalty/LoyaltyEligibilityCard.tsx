"use client";

import type {
  UserLoyaltyProgress,
  LoyaltyAccountProgress,
} from "@/lib/loyalty/loyalty.types";
import { CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";

interface LoyaltyEligibilityCardProps {
  progress: UserLoyaltyProgress;
  selectedAccount?: LoyaltyAccountProgress | null;
}

export function LoyaltyEligibilityCard({
  progress,
  selectedAccount,
}: LoyaltyEligibilityCardProps) {
  const { eligibility, totalCumulativeLots, nextTier } = progress;

  const target1Met = totalCumulativeLots >= 10;
  const target2Met = Boolean(selectedAccount);
  const target3Met = Boolean(selectedAccount && eligibility.hasPartnerBrokerAccount);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-5 sm:p-6 shadow-sm space-y-4">
      <div>
        <h3 className="text-base font-black text-gray-900 dark:text-white tracking-tight">
          Qualifying Rules & Payout Criteria
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Complete XAUUSD / GOLD volume milestones on each verified Partner IB REAL account to unlock USDT dispatches.
        </p>
      </div>

      {/* Target Criteria 1 */}
      <div className="p-3.5 rounded-lg border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Target 1 · XAUUSD / GOLD Volume Only
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
          Only closed <strong className="text-gray-900 dark:text-white">XAUUSD / GOLD</strong> lots count toward milestones. Currency pairs are excluded.
        </p>
        <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
          Account Volume: <strong className="text-gray-900 dark:text-white">{totalCumulativeLots.toLocaleString()} Lots</strong>
          {nextTier && ` · Next Target: ${nextTier.requiredLots.toLocaleString()} Lots`}
        </p>
      </div>

      {/* Target Criteria 2 */}
      <div className="p-3.5 rounded-lg border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Target 2 · Per-Account REAL MT5 Sync
          </span>
          {target2Met ? (
            <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
              <CheckCircle2 size={13} />
              REAL Verified
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-bold text-gray-400">
              <AlertCircle size={13} />
              Awaiting REAL IB Account
            </span>
          )}
        </div>
        <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
          Calculated independently per live REAL MT5 account. Demo accounts and manual entries are excluded.
        </p>
        <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
          Selected Account:{" "}
          <strong className="text-gray-900 dark:text-white">
            {selectedAccount
              ? `#${selectedAccount.accountNumber} (${selectedAccount.broker})`
              : "None"}
          </strong>{" "}
          · {eligibility.totalClosedTrades} Gold Trades
        </p>
      </div>

      {/* Target Criteria 3 */}
      <div className="p-3.5 rounded-lg border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Target 3 · Partner IB Attribution
          </span>
          {target3Met ? (
            <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
              <CheckCircle2 size={13} />
              Verified IB Partner
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-bold text-gray-400">
              <AlertCircle size={13} />
              IB Verification Required
            </span>
          )}
        </div>
        <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
          Only trading accounts verified under TheNextTrade Partner IB qualify for Loyalty cash rebates.
        </p>
        <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
          Verified IB Real Accounts: <strong className="text-gray-900 dark:text-white">{eligibility.activeLiveAccounts}</strong>
        </p>
      </div>

      {/* Trust & Transparency Note */}
      <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 flex items-start gap-2.5">
        <ShieldCheck size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
          <strong className="text-gray-900 dark:text-white">Institutional Transparency:</strong> Rewards and cash disbursements are funded directly from institutional broker rebate allocations on XAUUSD / GOLD volume.
        </div>
      </div>
    </div>
  );
}
