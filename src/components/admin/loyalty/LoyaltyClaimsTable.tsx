"use client";

import type { LoyaltyClaimRecord, LoyaltyClaimStatus } from "@/lib/loyalty/loyalty.types";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Coins,
  User,
  Copy,
  Check,
  Search,
  Layers,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

interface LoyaltyClaimsTableProps {
  claims: LoyaltyClaimRecord[];
  currentStatus: LoyaltyClaimStatus | "ALL";
  onStatusChange: (status: LoyaltyClaimStatus | "ALL") => void;
  onSelectClaim: (claim: LoyaltyClaimRecord) => void;
}

export function LoyaltyClaimsTable({
  claims,
  currentStatus,
  onStatusChange,
  onSelectClaim,
}: LoyaltyClaimsTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Address copied to clipboard");
    setTimeout(() => setCopiedId(null), 1800);
  };

  const statusCounts = useMemo(() => {
    return {
      ALL: claims.length,
      PENDING: claims.filter((c) => c.status === "PENDING").length,
      COMPLETED: claims.filter((c) => c.status === "COMPLETED").length,
      REJECTED: claims.filter((c) => c.status === "REJECTED").length,
    };
  }, [claims]);

  const STATUS_TABS = [
    { label: "All Claims", value: "ALL" as const, icon: Layers, count: statusCounts.ALL },
    { label: "Pending Review", value: "PENDING" as const, icon: Clock, count: statusCounts.PENDING },
    { label: "Completed & Paid", value: "COMPLETED" as const, icon: CheckCircle2, count: statusCounts.COMPLETED },
    { label: "Rejected", value: "REJECTED" as const, icon: XCircle, count: statusCounts.REJECTED },
  ];

  // Filter claims based on both tab status and search query
  const displayedClaims = useMemo(() => {
    return claims.filter((claim) => {
      // 1. Status filter
      if (currentStatus !== "ALL" && claim.status !== currentStatus) {
        return false;
      }
      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = claim.user?.name?.toLowerCase().includes(q);
        const emailMatch = claim.user?.email?.toLowerCase().includes(q);
        const tierMatch = claim.tierName?.toLowerCase().includes(q);
        const addressMatch = claim.usdtAddress?.toLowerCase().includes(q);
        const txMatch = claim.transactionRef?.toLowerCase().includes(q);
        return Boolean(nameMatch || emailMatch || tierMatch || addressMatch || txMatch);
      }
      return true;
    });
  }, [claims, currentStatus, searchQuery]);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] shadow-sm overflow-hidden">
      {/* Header Controls: Standard Admin Tabs & Search */}
      <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Standard Admin Tabs */}
        <Tabs
          value={currentStatus}
          onValueChange={(val) => onStatusChange(val as LoyaltyClaimStatus | "ALL")}
          tabsId="claims-status-filter"
        >
          <div className="overflow-x-auto scrollbar-hide flex">
            <TabsList className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-1 gap-1 shrink-0">
              {STATUS_TABS.map((tab) => {
                const Icon = tab.icon;
                const isSelected = currentStatus === tab.value;

                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:border-white/10 flex items-center gap-1.5"
                    activeIndicatorClassName="!bg-gold shadow-md shadow-amber-500/20 border-0"
                    activeTextClassName="!text-white font-bold"
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                        isSelected
                          ? "bg-white/20 text-white font-bold"
                          : "bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400"
                      )}
                    >
                      {tab.count}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
        </Tabs>

        {/* Search Input Filter */}
        <div className="w-full md:w-72">
          <div className="relative">
            <PremiumInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs h-9 pr-8"
              aria-label="Filter claims by trader, email, or wallet"
            />
            <Search
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/80 dark:bg-white/[0.02] text-[11px] font-bold uppercase tracking-wider text-gray-400">
              <th className="p-4">Trader</th>
              <th className="p-4">Milestone Tier</th>
              <th className="p-4">Cumulative Volume</th>
              <th className="p-4">Reward Amount</th>
              <th className="p-4">USDT Wallet</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
            {displayedClaims.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-gray-400 text-xs">
                  No loyalty reward claims found matching this criteria.
                </td>
              </tr>
            ) : (
              displayedClaims.map((claim) => (
                <tr
                  key={claim.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  {/* Trader */}
                  <td className="p-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 shrink-0 overflow-hidden">
                        {claim.user?.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={claim.user.image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={14} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white truncate">
                          {claim.user?.name || "Trader"}
                        </p>
                        <p className="text-xs text-gray-400 font-mono truncate">
                          {claim.user?.email || "No email registered"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Milestone Tier */}
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        L{claim.level}
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {claim.tierName}
                      </span>
                    </div>
                  </td>

                  {/* Volume */}
                  <td className="p-4">
                    <span className="font-mono font-bold text-gray-900 dark:text-white">
                      {claim.actualLots.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">
                      / {claim.requiredLots.toLocaleString()} Lots
                    </span>
                  </td>

                  {/* Reward */}
                  <td className="p-4">
                    {claim.cashAmount && claim.cashAmount > 0 ? (
                      <span className="font-mono font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Coins size={14} className="shrink-0" />
                        ${claim.cashAmount.toLocaleString()} USDT
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        {claim.rewardTitle}
                      </span>
                    )}
                  </td>

                  {/* USDT Wallet */}
                  <td className="p-4">
                    {claim.usdtAddress ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gray-600 dark:text-gray-300">
                          {claim.usdtAddress.slice(0, 6)}...{claim.usdtAddress.slice(-4)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(claim.id, claim.usdtAddress!)}
                          className="h-6 w-6 rounded-lg p-0 text-gray-400 hover:text-amber-500 transition-colors"
                          aria-label="Copy destination wallet address"
                        >
                          {copiedId === claim.id ? (
                            <Check size={13} className="text-amber-500" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </Button>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 uppercase">
                          {claim.network || "BEP20"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">None</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="p-4">
                    {claim.status === "COMPLETED" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 size={13} />
                        Completed
                      </span>
                    ) : claim.status === "PENDING" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <Clock size={13} />
                        Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                        <XCircle size={13} />
                        Rejected
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectClaim(claim)}
                      className="rounded-lg h-8 px-3 text-xs font-bold"
                    >
                      {claim.status === "PENDING" ? "Review & Pay" : "Details"}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
