"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import type { LoyaltyTierItem, UsdtNetwork } from "@/lib/loyalty/loyalty.types";
import {
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  Coins,
} from "lucide-react";

interface WalletRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: LoyaltyTierItem | null;
}

export function WalletRequiredModal({
  isOpen,
  onClose,
  tier,
}: WalletRequiredModalProps) {
  const router = useRouter();

  if (!tier) return null;

  const handleGoToSettings = () => {
    onClose();
    router.push("/dashboard/settings#payout-wallet");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 shadow-2xl">
        <DialogHeader className="space-y-3 text-center sm:text-left">
          <div className="mx-auto sm:mx-0 w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
            <Wallet size={24} />
          </div>

          <div>
            <DialogTitle className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Payout Wallet Required
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              To claim your milestone reward, please configure your destination USDT wallet in Account Settings first.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* 2x2 Matrix Spec Card */}
        <div className="mt-4 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] divide-y divide-gray-200 dark:divide-white/10 overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-white/10">
            <div className="p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Milestone Tier
              </span>
              <span className="font-semibold text-xs text-gray-900 dark:text-white truncate block mt-0.5">
                Level {tier.level} ({tier.name})
              </span>
            </div>
            <div className="p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Reward Value
              </span>
              <span className="font-bold text-xs text-amber-600 dark:text-amber-400 block mt-0.5">
                ${tier.cashAmount} USDT Cash
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-white/10">
            <div className="p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Wallet Status
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                <AlertCircle size={12} />
                Not Configured
              </span>
            </div>
            <div className="p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Payout Method
              </span>
              <span className="font-semibold text-xs text-gray-700 dark:text-gray-300 block mt-0.5">
                Direct USDT Dispatch
              </span>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-4 rounded-lg bg-amber-500/5 border border-amber-500/15 p-3 flex items-start gap-2.5">
          <ShieldCheck size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
            Configure your USDT wallet once. All future milestone cash claims will automatically dispatch to your saved address in 1 click.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="smd"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="gold"
            size="smd"
            onClick={handleGoToSettings}
          >
            Go to Settings to Add Wallet
            <ArrowRight size={14} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ClaimSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    tier: LoyaltyTierItem;
    network: string;
    address: string;
  } | null;
}

export function ClaimSuccessModal({
  isOpen,
  onClose,
  data,
}: ClaimSuccessModalProps) {
  if (!data) return null;

  const { tier, network, address } = data;
  const maskedAddress =
    address.length > 12
      ? `${address.slice(0, 6)}...${address.slice(-6)}`
      : address;

  const networkLabel: Record<string, string> = {
    BEP20: "BNB Smart Chain (BEP-20)",
    TRC20: "TRON (TRC-20)",
    ERC20: "Ethereum (ERC-20)",
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 shadow-2xl">
        <DialogHeader className="space-y-3 text-center sm:text-left">
          <div className="mx-auto sm:mx-0 w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
            <CheckCircle2 size={26} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <DialogTitle className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Claim Request Submitted!
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Your milestone claim request has been sent to Admin. Payout will be verified and dispatched within 24 business hours.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* 2x2 Matrix Spec Card */}
        <div className="mt-4 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] divide-y divide-gray-200 dark:divide-white/10 overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-white/10">
            <div className="p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Milestone Achieved
              </span>
              <span className="font-semibold text-xs text-gray-900 dark:text-white truncate block mt-0.5">
                Level {tier.level} ({tier.name})
              </span>
            </div>
            <div className="p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Cash Reward
              </span>
              <span className="font-bold text-xs text-amber-600 dark:text-amber-400 block mt-0.5">
                ${tier.cashAmount} USDT
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-white/10">
            <div className="p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Destination Wallet
              </span>
              <span className="font-mono text-xs text-gray-800 dark:text-gray-200 block mt-0.5 truncate" title={address}>
                {maskedAddress}
              </span>
              <span className="text-[10px] text-gray-400">
                {networkLabel[network] || network}
              </span>
            </div>
            <div className="p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Processing SLA
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                <Clock size={12} />
                Max 24 Business Hours
              </span>
            </div>
          </div>
        </div>

        {/* Security / Admin SLA Notice */}
        <div className="mt-4 rounded-lg bg-amber-500/5 border border-amber-500/15 p-3 flex items-start gap-2.5">
          <ShieldCheck size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
            Admin will verify your trade volume telemetry and transfer USDT directly to your saved wallet. You will receive an in-app notification once dispatched.
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            variant="gold"
            size="smd"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            <CheckCircle2 size={14} />
            Got It
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Unified export for backwards compatibility
export function ClaimRewardModal({
  isOpen,
  onClose,
  tier,
  defaultWallet,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  tier: LoyaltyTierItem | null;
  defaultWallet?: {
    network: UsdtNetwork;
    usdtAddress: string;
  };
  onSuccess: () => void;
}) {
  if (!tier) return null;

  if (!defaultWallet?.usdtAddress) {
    return (
      <WalletRequiredModal
        isOpen={isOpen}
        onClose={onClose}
        tier={tier}
      />
    );
  }

  return (
    <ClaimSuccessModal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        onSuccess();
      }}
      data={{
        tier,
        network: defaultWallet.network,
        address: defaultWallet.usdtAddress,
      }}
    />
  );
}
