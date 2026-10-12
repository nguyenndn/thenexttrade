"use client";

import type { AdminLoyaltyStats } from "@/actions/admin/loyalty";
import type { LoyaltyClaimRecord } from "@/lib/loyalty/loyalty.types";
import { DollarSign, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from "lucide-react";

interface LoyaltyAnalyticsPanelProps {
  stats: AdminLoyaltyStats;
  claims: LoyaltyClaimRecord[];
}

export function LoyaltyAnalyticsPanel({ stats, claims }: LoyaltyAnalyticsPanelProps) {
  const totalClaimsCount = claims.length;
  const pendingClaims = claims.filter((c) => c.status === "PENDING");
  const completedClaims = claims.filter((c) => c.status === "COMPLETED");
  const rejectedClaims = claims.filter((c) => c.status === "REJECTED");

  const totalDisbursed = stats.completedAmount;
  const totalPendingLiability = stats.pendingAmount;

  return (
    <div className="space-y-6">
      {/* 2x2 Matrix & Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Disbursed vs Liability Card */}
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Financial Capital Flow
              </span>
              <h4 className="text-base font-black text-gray-900 dark:text-white tracking-tight mt-0.5">
                USDT Disbursement vs Pending Liabilities
              </h4>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
              <DollarSign size={18} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Fulfilled Payouts
              </span>
              <span className="font-mono text-xl font-black text-emerald-600 dark:text-emerald-400">
                ${totalDisbursed.toLocaleString()} USDT
              </span>
              <p className="text-[11px] text-gray-400 mt-1">
                {completedClaims.length} payouts dispatched
              </p>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Pending Queue
              </span>
              <span className="font-mono text-xl font-black text-amber-600 dark:text-amber-400">
                ${totalPendingLiability.toLocaleString()} USDT
              </span>
              <p className="text-[11px] text-gray-400 mt-1">
                {pendingClaims.length} requests awaiting
              </p>
            </div>
          </div>
        </div>

        {/* Operational Efficiency Card */}
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Operational Telemetry
              </span>
              <h4 className="text-base font-black text-gray-900 dark:text-white tracking-tight mt-0.5">
                Claims Fulfillment Health
              </h4>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
              <ShieldCheck size={18} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 mb-1">
                <CheckCircle2 size={14} />
                <span className="text-[10px] font-bold uppercase">Approved</span>
              </div>
              <p className="font-mono text-lg font-black text-gray-900 dark:text-white">
                {completedClaims.length}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 mb-1">
                <Clock size={14} />
                <span className="text-[10px] font-bold uppercase">In Review</span>
              </div>
              <p className="font-mono text-lg font-black text-gray-900 dark:text-white">
                {pendingClaims.length}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 text-center">
              <div className="flex items-center justify-center gap-1 text-red-500 mb-1">
                <AlertTriangle size={14} />
                <span className="text-[10px] font-bold uppercase">Rejected</span>
              </div>
              <p className="font-mono text-lg font-black text-gray-900 dark:text-white">
                {rejectedClaims.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Program Integrity Card */}
      <div className="p-4 rounded-lg bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 flex items-start gap-3">
        <ShieldCheck size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          <strong className="text-gray-900 dark:text-white">IB Rebate Recycling Logic:</strong> All loyalty reward claims are cross-checked against actual MT5 trade history and broker commission reports. Duplicate claims on the same milestone level are hardware-filtered via database unique constraints.
        </div>
      </div>
    </div>
  );
}
