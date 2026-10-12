"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserLoyaltyProgress, LoyaltyTierItem, UsdtNetwork } from "@/lib/loyalty/loyalty.types";
import { LoyaltyCommandHero } from "./LoyaltyCommandHero";
import { LoyaltyEligibilityCard } from "./LoyaltyEligibilityCard";
import { LoyaltyLadder } from "./LoyaltyLadder";
import { LoyaltyClaimHistory } from "./LoyaltyClaimHistory";
import { WalletRequiredModal, ClaimSuccessModal } from "./ClaimRewardModal";
import { submitClaimReward } from "@/actions/loyalty";
import { toast } from "sonner";
import { Trophy, HelpCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

interface LoyaltyDashboardClientProps {
  initialProgress: UserLoyaltyProgress;
}

export function LoyaltyDashboardClient({ initialProgress }: LoyaltyDashboardClientProps) {
  const router = useRouter();
  const [progress] = useState<UserLoyaltyProgress>(initialProgress);
  const [walletRequiredTier, setWalletRequiredTier] = useState<LoyaltyTierItem | null>(null);
  const [successModalData, setSuccessModalData] = useState<{
    tier: LoyaltyTierItem;
    network: string;
    address: string;
  } | null>(null);
  const [claimingLevel, setClaimingLevel] = useState<number | null>(null);

  // Fallback to previous successful claim wallet if user hasn't configured payoutWallet in Settings yet
  const lastWalletClaim = progress.userClaims?.find(
    (c) => c.usdtAddress && c.status !== "REJECTED"
  );
  const defaultWallet = lastWalletClaim?.usdtAddress
    ? {
        network: (lastWalletClaim.network as UsdtNetwork) || "BEP20",
        usdtAddress: lastWalletClaim.usdtAddress,
      }
    : undefined;

  const activeWallet = progress.payoutWallet?.address
    ? progress.payoutWallet
    : defaultWallet?.usdtAddress
    ? { network: defaultWallet.network, address: defaultWallet.usdtAddress }
    : null;

  const handleOpenClaim = async (tier: LoyaltyTierItem) => {
    // 1. If user has no wallet configured -> Prompt them with Wallet Required popup + redirect to Settings
    if (!activeWallet || !activeWallet.address) {
      setWalletRequiredTier(tier);
      return;
    }

    // 2. User has wallet configured -> 1-Click submit and show 24h review popup
    setClaimingLevel(tier.level);
    try {
      const res = await submitClaimReward({
        level: tier.level,
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

      // Show Success Modal
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
        description="Accumulate lifetime trading lots on verified live accounts to access 10 milestone tiers, direct USDT payouts, and institutional perks."
      >
        <div className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
          <HelpCircle size={14} className="text-gray-400" />
          <span>Updated continuously via live MT5 sync</span>
        </div>
      </PageHeader>

      {/* Full-Width Milestone Command Hero Banner */}
      <LoyaltyCommandHero progress={progress} />

      {/* Main 8:4 Balanced Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Column: Vertical Milestone Roadmap Ladder (8 cols) */}
        <div className="lg:col-span-8">
          <LoyaltyLadder
            progress={progress}
            onOpenClaim={handleOpenClaim}
            claimingLevel={claimingLevel}
          />
        </div>

        {/* Side Column: Target Criteria & Institutional Rules (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <LoyaltyEligibilityCard progress={progress} />
        </div>
      </div>

      {/* Full-Width Audit Ledger: Claim Receipts & Blockchain TxIDs */}
      <LoyaltyClaimHistory claims={progress.userClaims} />

      {/* Modal 1: Wallet Required (Redirects to Settings) */}
      <WalletRequiredModal
        isOpen={Boolean(walletRequiredTier)}
        onClose={() => setWalletRequiredTier(null)}
        tier={walletRequiredTier}
      />

      {/* Modal 2: Claim Request Submitted (Pending review within 24 business hours) */}
      <ClaimSuccessModal
        isOpen={Boolean(successModalData)}
        onClose={() => setSuccessModalData(null)}
        data={successModalData}
      />
    </div>
  );
}
