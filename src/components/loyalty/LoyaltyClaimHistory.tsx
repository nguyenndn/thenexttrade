"use client";

import { useState } from "react";
import type { LoyaltyClaimRecord } from "@/lib/loyalty/loyalty.types";
import { Button } from "@/components/ui/Button";
import {
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  Coins,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";

interface LoyaltyClaimHistoryProps {
  claims?: LoyaltyClaimRecord[];
}

export function LoyaltyClaimHistory({ claims = [] }: LoyaltyClaimHistoryProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Wallet address copied to clipboard");
    setTimeout(() => setCopiedId(null), 1800);
  };

  const getExplorerUrl = (network: string | null | undefined, txHash: string) => {
    const net = (network || "BEP20").toUpperCase();
    if (net.includes("BEP") || net.includes("BSC")) {
      return `https://bscscan.com/tx/${txHash}`;
    }
    if (net.includes("TRC") || net.includes("TRON")) {
      return `https://tronscan.org/#/transaction/${txHash}`;
    }
    if (net.includes("ERC") || net.includes("ETH")) {
      return `https://etherscan.io/tx/${txHash}`;
    }
    return `https://bscscan.com/tx/${txHash}`;
  };

  return (
    <div className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-5 sm:p-7 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Receipt size={14} />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Disbursement Ledger
            </span>
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
            My Claimed Rewards & USDT Receipts
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Cryptographic receipts and blockchain transaction hashes for all approved milestone cash rewards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300">
            {claims.length} {claims.length === 1 ? "Disbursement Record" : "Disbursement Records"}
          </span>
        </div>
      </div>

      {/* Main Content: Table or Zero-State */}
      {claims.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-lg border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/40 dark:bg-white/[0.01] space-y-4">
          <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto shadow-xs">
            <Receipt size={24} />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              No Milestone Rewards Claimed Yet
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Once your cumulative trading lots reach qualifying milestones, click &quot;Claim Reward&quot; in the roadmap ladder. Your USDT payouts, blockchain network records, and TxID confirmations will appear here.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[11px] text-gray-600 dark:text-gray-300">
            <ShieldCheck size={14} className="text-amber-500 shrink-0" />
            <span>Funded 100% from institutional broker rebate allocations.</span>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-white/5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/80 dark:bg-white/[0.02] text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <th className="p-4">Milestone Tier</th>
                <th className="p-4">Date Claimed</th>
                <th className="p-4">Reward Amount</th>
                <th className="p-4">USDT Destination</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Blockchain TxID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
              {claims.map((claim) => {
                const isCopied = copiedId === claim.id;
                const formattedDate = new Date(claim.claimedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <tr
                    key={claim.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Milestone Tier */}
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                          L{claim.level}
                        </span>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white leading-tight">
                            {claim.tierName}
                          </p>
                          <span className="text-[11px] font-mono text-gray-400">
                            {claim.actualLots.toLocaleString()} Lots verified
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Date Claimed */}
                    <td className="p-4">
                      <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                        {formattedDate}
                      </span>
                    </td>

                    {/* Reward Amount */}
                    <td className="p-4">
                      {claim.cashAmount && claim.cashAmount > 0 ? (
                        <span className="font-mono text-sm font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <Coins size={14} className="shrink-0 text-amber-500" />
                          ${claim.cashAmount.toLocaleString()} USDT
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                          {claim.rewardTitle}
                        </span>
                      )}
                    </td>

                    {/* USDT Destination */}
                    <td className="p-4">
                      {claim.usdtAddress ? (
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 uppercase">
                            {claim.network || "BEP20"}
                          </span>
                          <span className="font-mono text-xs text-gray-600 dark:text-gray-300">
                            {claim.usdtAddress.slice(0, 6)}...{claim.usdtAddress.slice(-4)}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                            onClick={() => handleCopy(claim.id, claim.usdtAddress || "")}
                            aria-label="Copy wallet address"
                          >
                            {isCopied ? (
                              <Check size={12} className="text-emerald-500" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">System Perk / License</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      {claim.status === "COMPLETED" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                          <CheckCircle2 size={13} />
                          Completed
                        </span>
                      ) : claim.status === "APPROVED" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20">
                          <CheckCircle2 size={13} />
                          Approved
                        </span>
                      ) : claim.status === "REJECTED" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20">
                          <XCircle size={13} />
                          Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20">
                          <Clock size={13} />
                          Pending Review
                        </span>
                      )}
                    </td>

                    {/* Blockchain TxID */}
                    <td className="p-4 text-right">
                      {claim.transactionRef ? (
                        <a
                          href={getExplorerUrl(claim.network, claim.transactionRef)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                        >
                          <span>
                            {claim.transactionRef.slice(0, 6)}...{claim.transactionRef.slice(-4)}
                          </span>
                          <ExternalLink size={12} />
                        </a>
                      ) : claim.status === "COMPLETED" ? (
                        <span className="text-xs text-gray-400 font-mono">Dispatched</span>
                      ) : (
                        <span className="text-xs text-gray-400">Awaiting Tx</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
