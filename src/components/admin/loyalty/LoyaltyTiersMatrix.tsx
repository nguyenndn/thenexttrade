"use client";

import { useState } from "react";
import type { LoyaltyTierItem } from "@/lib/loyalty/loyalty.types";
import {
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
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  Power,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import {
  deleteLoyaltyTier,
  toggleLoyaltyTierActive,
} from "@/actions/admin/loyalty";
import { LoyaltyTierModal } from "./LoyaltyTierModal";

const ICON_MAP: Record<string, React.ElementType> = {
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
  onTiersChange: (tiers: LoyaltyTierItem[]) => void;
}

export function LoyaltyTiersMatrix({
  tiers,
  onTiersChange,
}: LoyaltyTiersMatrixProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<LoyaltyTierItem | null>(null);
  const [processingLevel, setProcessingLevel] = useState<number | null>(null);

  const nextSuggestedLevel =
    tiers.length > 0 ? Math.max(...tiers.map((t) => t.level)) + 1 : 1;

  const maxPayout =
    tiers.length > 0 ? Math.max(...tiers.map((t) => t.cashAmount || 0)) : 0;

  const handleCreate = () => {
    setEditingTier(null);
    setModalOpen(true);
  };

  const handleEdit = (tier: LoyaltyTierItem) => {
    setEditingTier(tier);
    setModalOpen(true);
  };

  const handleToggleActive = async (tier: LoyaltyTierItem) => {
    setProcessingLevel(tier.level);
    try {
      const res = await toggleLoyaltyTierActive(
        tier.level,
        !tier.isActive,
        tier.id
      );
      if (!res.success || !res.tiers) {
        toast.error(res.error || "Failed to update level status");
        return;
      }
      onTiersChange(res.tiers);
      toast.success(
        `Level ${tier.level} (${tier.name}) is now ${
          !tier.isActive ? "ON (Active)" : "OFF (Hidden)"
        }`
      );
    } catch {
      toast.error("Failed to update level status");
    } finally {
      setProcessingLevel(null);
    }
  };

  const handleDelete = async (tier: LoyaltyTierItem) => {
    if (
      !window.confirm(
        `Are you sure you want to delete Level ${tier.level} (${tier.name})?`
      )
    ) {
      return;
    }
    setProcessingLevel(tier.level);
    try {
      const res = await deleteLoyaltyTier(tier.level, tier.id);
      if (!res.success || !res.tiers) {
        toast.error(res.error || "Failed to delete level");
        return;
      }
      onTiersChange(res.tiers);
      toast.success(`Deleted Level ${tier.level} (${tier.name})`);
    } catch {
      toast.error("Failed to delete level");
    } finally {
      setProcessingLevel(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1E2028] p-4 shadow-xs">
        <div>
          <h3 className="text-sm font-black text-gray-900 dark:text-white">
            Loyalty Milestone Tiers ({tiers.length} Levels)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Create, edit, or toggle milestone levels. Only closed XAUUSD/GOLD lots on IB-verified Real accounts count toward milestones.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20">
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
            <span>
              <span className="font-mono tabular-nums">
                {tiers.filter((t) => t.isActive).length}
              </span>{" "}
              Active &bull; Max{" "}
              <span className="font-mono tabular-nums">
                ${maxPayout.toLocaleString()}
              </span>{" "}
              USDT
            </span>
          </div>
          <Button
            type="button"
            variant="primary"
            size="smd"
            onClick={handleCreate}
            className="shrink-0"
          >
            <Plus size={16} strokeWidth={2.5} />
            Create Level
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {tiers.map((tier) => {
          const IconComponent = ICON_MAP[tier.icon] || Shield;
          const isBusy = processingLevel === tier.level;

          return (
            <div
              key={tier.id || tier.level}
              className={`rounded-xl border p-4 flex flex-col justify-between transition-all shadow-xs ${
                tier.isActive
                  ? "border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1E2028] hover:border-amber-500/30"
                  : "border-gray-200/60 dark:border-white/[0.04] bg-gray-50/70 dark:bg-[#151925]/70 opacity-70"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center border border-white/10 shrink-0"
                    style={{
                      backgroundColor: `${tier.badgeColor}18`,
                      color: tier.badgeColor,
                    }}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => handleToggleActive(tier)}
                      aria-label={`Toggle Level ${tier.level} status`}
                      className={`h-7 px-2 rounded-lg text-[10px] font-bold gap-1 ${
                        tier.isActive
                          ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                          : "text-gray-400 border-gray-300 dark:border-white/10"
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      {tier.isActive ? "ON" : "OFF"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={isBusy}
                      onClick={() => handleEdit(tier)}
                      aria-label={`Edit Level ${tier.level}`}
                      className="h-7 w-7 min-w-7 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={isBusy}
                      onClick={() => handleDelete(tier)}
                      aria-label={`Delete Level ${tier.level}`}
                      className="h-7 w-7 min-w-7 rounded-lg text-gray-400 hover:text-rose-500 hover:border-rose-500/30"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400">
                    Level{" "}
                    <span className="font-mono tabular-nums">{tier.level}</span>
                  </span>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    {tier.rewardType === "CASH"
                      ? "USDT + Perk"
                      : tier.rewardType === "PHYSICAL_GIFT"
                      ? "Physical Gift"
                      : "System Perk"}
                  </span>
                </div>

                <h4 className="text-sm font-black text-gray-900 dark:text-white mb-1">
                  {tier.name}
                </h4>
                <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1 line-clamp-2">
                  {tier.rewardTitle}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 mb-4">
                  {tier.perkDescription}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Required Gold Volume</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white tabular-nums">
                    {tier.requiredLots.toLocaleString()} Lots
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">USDT Cash Rebate</span>
                  <span className="font-mono font-black text-amber-500 tabular-nums">
                    ${(tier.cashAmount || 0).toLocaleString()} USDT
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <LoyaltyTierModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingTier={editingTier}
        nextSuggestedLevel={nextSuggestedLevel}
        onSaved={(updatedTiers) => onTiersChange(updatedTiers)}
      />
    </div>
  );
}
