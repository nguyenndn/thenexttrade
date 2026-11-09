"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type {
  UserLoyaltyProgress,
  LoyaltyTierItem,
  UsdtNetwork,
} from "@/lib/loyalty/loyalty.types";
import { LoyaltyCommandHero } from "./LoyaltyCommandHero";
import { LoyaltyEligibilityCard } from "./LoyaltyEligibilityCard";
import { LoyaltyLadder } from "./LoyaltyLadder";
import { LoyaltyClaimHistory } from "./LoyaltyClaimHistory";
import { WalletRequiredModal, ClaimSuccessModal } from "./ClaimRewardModal";
import { submitClaimReward } from "@/actions/loyalty";
import { toast } from "sonner";
import {
  ShieldCheck,
  Coins,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface LoyaltyDashboardClientProps {
  initialProgress: UserLoyaltyProgress;
}

export function LoyaltyDashboardClient({
  initialProgress,
}: LoyaltyDashboardClientProps) {
  const router = useRouter();
  const eligibleAccounts = useMemo(
    () => initialProgress.eligibleAccounts || [],
    [initialProgress.eligibleAccounts]
  );

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    initialProgress.selectedAccountId || eligibleAccounts[0]?.accountId || null
  );
  const [walletRequiredTier, setWalletRequiredTier] =
    useState<LoyaltyTierItem | null>(null);
  const [successModalData, setSuccessModalData] = useState<{
    tier: LoyaltyTierItem;
    network: string;
    address: string;
  } | null>(null);
  const [claimingLevel, setClaimingLevel] = useState<number | null>(null);

  const selectedAccount = useMemo(() => {
    if (eligibleAccounts.length === 0) return null;
    return (
      eligibleAccounts.find((a) => a.accountId === selectedAccountId) ||
      eligibleAccounts[0]
    );
  }, [eligibleAccounts, selectedAccountId]);

  // Build active UserLoyaltyProgress view scoped to the selected REAL IB account
  const activeProgress: UserLoyaltyProgress = useMemo(() => {
    if (!selectedAccount) {
      return initialProgress;
    }
    const accountClaims = (initialProgress.userClaims || []).filter(
      (c) => !c.accountId || c.accountId === selectedAccount.accountId
    );
    return {
      ...initialProgress,
      selectedAccountId: selectedAccount.accountId,
      totalCumulativeLots: selectedAccount.totalCumulativeLots,
      currentTier: selectedAccount.currentTier,
      nextTier: selectedAccount.nextTier,
      progressToNext: selectedAccount.progressToNext,
      lotsToNext: selectedAccount.lotsToNext,
      claimedLevels: selectedAccount.claimedLevels,
      pendingLevels: selectedAccount.pendingLevels,
      tiers: selectedAccount.tiers,
      eligibility: {
        hasPartnerBrokerAccount: true,
        activeLiveAccounts: eligibleAccounts.length,
        totalClosedTrades: selectedAccount.totalClosedTrades,
        lastTradeAt: selectedAccount.lastTradeAt,
      },
      userClaims: accountClaims,
    };
  }, [initialProgress, selectedAccount, eligibleAccounts.length]);

  const lastWalletClaim = initialProgress.userClaims?.find(
    (c) => c.usdtAddress && c.status !== "REJECTED"
  );
  const defaultWallet = lastWalletClaim?.usdtAddress
    ? {
        network: (lastWalletClaim.network as UsdtNetwork) || "BEP20",
        usdtAddress: lastWalletClaim.usdtAddress,
      }
    : undefined;

  const activeWallet = initialProgress.payoutWallet?.address
    ? initialProgress.payoutWallet
    : defaultWallet?.usdtAddress
    ? { network: defaultWallet.network, address: defaultWallet.usdtAddress }
    : null;

  const handleOpenClaim = async (tier: LoyaltyTierItem) => {
    if (!selectedAccount) {
      toast.error(
        "Only verified Partner IB REAL accounts can claim Loyalty rewards."
      );
      return;
    }

    if (!activeWallet || !activeWallet.address) {
      setWalletRequiredTier(tier);
      return;
    }

    setClaimingLevel(tier.level);
    try {
      const res = await submitClaimReward({
        level: tier.level,
        accountId: selectedAccount.accountId,
        network: activeWallet.network,
        usdtAddress: activeWallet.address,
      });

      if (!res.success) {
        if (res.error?.includes("No payout wallet")) {
          setWalletRequiredTier(tier);
        } else {
          toast.error(res.error || "Failed to submit claim request");
        }
        return;
      }

      setSuccessModalData({
        tier,
        network: activeWallet.network,
        address: activeWallet.address,
      });
      router.refresh();
    } catch {
      toast.error("Network error submitting claim. Please try again.");
    } finally {
      setClaimingLevel(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Banner Header */}
      <PageHeader
        title="Loyalty Program & Volume Rewards"
        description="Accumulate XAUUSD / GOLD trading lots per verified Partner IB REAL account to unlock 10 milestone tiers and direct USDT payouts."
      >
        <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
          <Coins size={14} className="text-amber-500 shrink-0" />
          <span>XAUUSD / GOLD Only · Per IB Real Account</span>
        </div>
      </PageHeader>

      {/* IB Real Account Selector Bar (Phương án A) */}
      {eligibleAccounts.length > 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-amber-500 shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">
                Verified Partner IB Real Accounts ({eligibleAccounts.length})
              </span>
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              Volume & milestones are calculated independently for each IB REAL account (XAUUSD / GOLD only).
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {eligibleAccounts.map((acc) => {
              const isSelected = selectedAccount?.accountId === acc.accountId;
              return (
                <Button
                  key={acc.accountId}
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedAccountId(acc.accountId)}
                  className={cn(
                    "h-auto w-full justify-between p-3.5 rounded-lg text-left transition-all",
                    isSelected
                      ? "border-amber-500 bg-amber-500/10 dark:bg-amber-500/15 ring-1 ring-amber-500/30"
                      : "border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] hover:border-amber-500/40"
                  )}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-gray-900 dark:text-white truncate">
                        {acc.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        REAL · IB
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      #{acc.accountNumber} · {acc.broker}
                    </p>
                  </div>

                  <div className="text-right shrink-0 pl-3">
                    <p className="font-mono tabular-nums text-sm font-black text-amber-600 dark:text-amber-400">
                      {acc.totalCumulativeLots.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      <span className="text-[10px] uppercase">Lots</span>
                    </p>
                    <p className="text-[10px] font-mono text-gray-400 flex items-center justify-end gap-1">
                      {isSelected && (
                        <CheckCircle2 size={11} className="text-amber-500" />
                      )}
                      Level {acc.currentTier ? acc.currentTier.level : 0}
                    </p>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-500/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={18}
              className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
            />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                No Verified Partner IB Real Account Found
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Demo accounts and unverified Free accounts are excluded. To start accumulating qualifying{" "}
                <strong className="text-gray-900 dark:text-white">
                  XAUUSD / GOLD
                </strong>{" "}
                lots, connect a REAL MT5 account registered under our Partner IB.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="gold"
            size="smd"
            onClick={() => router.push("/dashboard/accounts")}
            className="shrink-0 rounded-lg"
          >
            Manage MT5 Accounts
            <ArrowRight size={14} />
          </Button>
        </div>
      )}

      {/* Full-Width Milestone Command Hero Banner */}
      <LoyaltyCommandHero
        progress={activeProgress}
        selectedAccount={selectedAccount}
      />

      {/* Main 8:4 Balanced Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <LoyaltyLadder
            progress={activeProgress}
            onOpenClaim={handleOpenClaim}
            claimingLevel={claimingLevel}
          />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <LoyaltyEligibilityCard
            progress={activeProgress}
            selectedAccount={selectedAccount}
          />
        </div>
      </div>

      {/* Full-Width Audit Ledger: Claim Receipts & Blockchain TxIDs */}
      <LoyaltyClaimHistory claims={activeProgress.userClaims} />

      {/* Modal 1: Wallet Required (Redirects to Settings) */}
      <WalletRequiredModal
        isOpen={Boolean(walletRequiredTier)}
        onClose={() => setWalletRequiredTier(null)}
        tier={walletRequiredTier}
      />

      {/* Modal 2: Claim Request Submitted */}
      <ClaimSuccessModal
        isOpen={Boolean(successModalData)}
        onClose={() => setSuccessModalData(null)}
        data={successModalData}
      />
    </div>
  );
}
