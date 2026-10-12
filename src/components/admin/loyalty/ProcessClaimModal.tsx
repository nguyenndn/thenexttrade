"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { toast } from "sonner";
import { processAdminClaim } from "@/actions/admin/loyalty";
import type { LoyaltyClaimRecord } from "@/lib/loyalty/loyalty.types";
import {
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Coins,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface ProcessClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  claim: LoyaltyClaimRecord | null;
  onSuccess: () => void;
}

export function ProcessClaimModal({
  isOpen,
  onClose,
  claim,
  onSuccess,
}: ProcessClaimModalProps) {
  const [transactionRef, setTransactionRef] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!claim) return null;

  const handleCopyAddress = () => {
    if (!claim.usdtAddress) return;
    navigator.clipboard.writeText(claim.usdtAddress);
    setCopied(true);
    toast.success("USDT Address copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAction = async (action: "COMPLETE" | "APPROVE" | "REJECT") => {
    if (action === "REJECT" && !adminNotes.trim()) {
      toast.error("Please provide a rejection note explaining the reason.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await processAdminClaim({
        claimId: claim.id,
        action,
        transactionRef: transactionRef.trim() || undefined,
        adminNotes: adminNotes.trim() || undefined,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to process claim");
        return;
      }

      toast.success(res.message || "Claim updated successfully");
      onSuccess();
      onClose();
    } catch {
      toast.error("Network error processing claim");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Coins size={20} />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-gray-900 dark:text-white">
                Review & Process Loyalty Claim
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
                Claim ID: {claim.id.slice(0, 12)}... · Trader: {claim.user?.name || claim.user?.email || "Unknown"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 2x2 Matrix Card for Claim Details */}
        <div className="grid grid-cols-2 rounded-lg border border-gray-200 dark:border-white/10 divide-x divide-y divide-gray-200 dark:divide-white/10 bg-gray-50/50 dark:bg-white/[0.02] overflow-hidden my-3">
          <div className="p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
              Milestone Tier
            </span>
            <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
              Level {claim.level} ({claim.tierName})
            </span>
          </div>

          <div className="p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
              Volume Lots
            </span>
            <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
              {claim.actualLots.toLocaleString()} / {claim.requiredLots.toLocaleString()} Lots
            </span>
          </div>

          <div className="p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
              Reward Allocation
            </span>
            <span className="font-mono text-sm font-black text-amber-600 dark:text-amber-400">
              {claim.cashAmount ? `$${claim.cashAmount.toLocaleString()} USDT` : claim.rewardTitle}
            </span>
          </div>

          <div className="p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
              Network Protocol
            </span>
            <span className="font-mono text-sm font-bold text-sky-600 dark:text-sky-400">
              {claim.network || "USDT BEP-20"}
            </span>
          </div>
        </div>

        {/* USDT Receiving Address with 1-click Copy */}
        <div className="p-3.5 rounded-lg border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.015] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Trader USDT Destination Address
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopyAddress}
              className="h-6 px-2 text-xs font-bold text-amber-600 hover:text-amber-500 flex items-center gap-1"
              aria-label="Copy USDT destination address"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy Address"}
            </Button>
          </div>
          <p className="font-mono text-xs text-gray-900 dark:text-white break-all select-all font-bold">
            {claim.usdtAddress || "No wallet specified"}
          </p>
        </div>

        {/* Form Inputs */}
        <div className="space-y-3.5 pt-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
              Transaction Hash / Ref (TxID)
            </label>
            <PremiumInput
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="font-mono text-xs"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Provide blockchain TxID or internal transfer reference for the trader.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
              Admin Notes / Rejection Reason
            </label>
            <PremiumInput
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-gray-100 dark:border-white/10 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleAction("REJECT")}
            disabled={isSubmitting}
            className="rounded-lg h-9 px-3.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-900/30"
          >
            <XCircle size={14} className="mr-1.5" />
            Reject Claim
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg h-9 px-4 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => handleAction("COMPLETE")}
              disabled={isSubmitting}
              className="rounded-lg h-9 px-4 text-xs font-bold bg-gold hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 border-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-1.5" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} className="mr-1.5" />
                  Mark Paid & Completed
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
