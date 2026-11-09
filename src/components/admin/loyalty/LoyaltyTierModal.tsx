"use client";

import { useEffect, useState } from "react";
import {
  X,
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
  ChevronDown,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { upsertLoyaltyTier } from "@/actions/admin/loyalty";
import type {
  LoyaltyRewardType,
  LoyaltyTierItem,
} from "@/lib/loyalty/loyalty.types";

const ICON_OPTIONS: { name: string; icon: React.ElementType }[] = [
  { name: "Shield", icon: Shield },
  { name: "ShieldCheck", icon: ShieldCheck },
  { name: "Zap", icon: Zap },
  { name: "Award", icon: Award },
  { name: "Gem", icon: Gem },
  { name: "Diamond", icon: Diamond },
  { name: "Flame", icon: Flame },
  { name: "Trophy", icon: Trophy },
  { name: "Crown", icon: Crown },
  { name: "Sparkles", icon: Sparkles },
];

const BADGE_COLORS = [
  { label: "Bronze", value: "#CD7F32" },
  { label: "Silver", value: "#94A3B8" },
  { label: "Sky", value: "#38BDF8" },
  { label: "Gold", value: "#EAB308" },
  { label: "Amber", value: "#F59E0B" },
  { label: "Emerald", value: "#10B981" },
  { label: "Violet", value: "#A855F7" },
  { label: "Pink", value: "#EC4899" },
  { label: "Orange", value: "#F97316" },
  { label: "Ruby", value: "#EF4444" },
];

const REWARD_TYPE_LABELS: Record<LoyaltyRewardType, string> = {
  CASH: "USDT Cash Payout + Perk",
  SYSTEM_PERK: "Platform / EA Perk Only",
  PHYSICAL_GIFT: "Physical Executive Gift",
};

interface LoyaltyTierModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTier: LoyaltyTierItem | null;
  nextSuggestedLevel: number;
  onSaved: (tiers: LoyaltyTierItem[]) => void;
}

export function LoyaltyTierModal({
  isOpen,
  onClose,
  editingTier,
  nextSuggestedLevel,
  onSaved,
}: LoyaltyTierModalProps) {
  const isEdit = Boolean(editingTier);
  const [level, setLevel] = useState<string>("1");
  const [name, setName] = useState<string>("");
  const [requiredLots, setRequiredLots] = useState<string>("10");
  const [rewardType, setRewardType] = useState<LoyaltyRewardType>("CASH");
  const [cashAmount, setCashAmount] = useState<string>("10");
  const [rewardTitle, setRewardTitle] = useState<string>("");
  const [perkDescription, setPerkDescription] = useState<string>("");
  const [icon, setIcon] = useState<string>("Shield");
  const [badgeColor, setBadgeColor] = useState<string>("#EAB308");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingTier) {
      setLevel(String(editingTier.level));
      setName(editingTier.name);
      setRequiredLots(String(editingTier.requiredLots));
      setRewardType(editingTier.rewardType || "CASH");
      setCashAmount(String(editingTier.cashAmount ?? 0));
      setRewardTitle(editingTier.rewardTitle);
      setPerkDescription(editingTier.perkDescription || "");
      setIcon(editingTier.icon || "Shield");
      setBadgeColor(editingTier.badgeColor || "#EAB308");
      setIsActive(editingTier.isActive ?? true);
    } else {
      setLevel(String(nextSuggestedLevel));
      setName("");
      setRequiredLots("100");
      setRewardType("CASH");
      setCashAmount("100");
      setRewardTitle("");
      setPerkDescription("");
      setIcon("Trophy");
      setBadgeColor("#EAB308");
      setIsActive(true);
    }
  }, [isOpen, editingTier, nextSuggestedLevel]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await upsertLoyaltyTier({
        id: editingTier?.id,
        level: Number(level),
        name,
        requiredLots: Number(requiredLots),
        rewardType,
        cashAmount: Number(cashAmount) || 0,
        rewardTitle,
        perkDescription,
        icon,
        badgeColor,
        order: Number(level),
        isActive,
      });

      if (!res.success || !res.tiers) {
        toast.error(res.error || "Failed to save level.");
        return;
      }

      toast.success(
        isEdit
          ? `Updated Level ${level} (${name})`
          : `Created Level ${level} (${name})`
      );
      onSaved(res.tiers);
      onClose();
    } catch (err) {
      toast.error((err as Error).message || "Unexpected error saving level.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-xl border border-dashboard bg-white dark:bg-[#1E2028] shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dashboard bg-gray-50/60 dark:bg-[#151925]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Award size={16} />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 dark:text-white">
                {isEdit
                  ? `Edit Milestone Level ${editingTier?.level}`
                  : "Create Milestone Level"}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Configure cumulative XAUUSD/GOLD lot threshold, USDT payout, and institutional perks.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
            aria-label="Close modal"
          >
            <X size={16} />
          </Button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 overflow-y-auto flex-1"
        >
          {/* Row 1: Level Number + Tier Name with Prefix Color Swatch */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Level Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                step={1}
                required
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] text-sm font-mono tabular-nums text-gray-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Unique milestone rank
              </p>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Level Title &amp; Badge Color <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center rounded-lg border border-gray-300 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] focus-within:border-amber-500">
                <Popover
                  open={colorPopoverOpen}
                  onOpenChange={setColorPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="Select badge color"
                      className="flex items-center gap-1.5 pl-3 pr-2.5 py-2 border-r border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 rounded-l-lg transition-colors"
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: badgeColor }}
                      />
                      <ChevronDown size={12} className="text-gray-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-52 p-2.5 rounded-xl bg-white dark:bg-[#1E2028] border border-dashboard shadow-xl"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                      Badge Accent Color
                    </p>
                    <div className="grid grid-cols-5 gap-2">
                      {BADGE_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          title={c.label}
                          aria-label={c.label}
                          onClick={() => {
                            setBadgeColor(c.value);
                            setColorPopoverOpen(false);
                          }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center border border-black/10 transition-transform hover:scale-110"
                          style={{ backgroundColor: c.value }}
                        >
                          {badgeColor.toUpperCase() === c.value.toUpperCase() && (
                            <Check size={13} className="text-white drop-shadow" />
                          )}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-transparent text-sm text-gray-900 dark:text-white focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Displayed on trader milestone cards and progress tracker
              </p>
            </div>
          </div>

          {/* Row 2: Required XAUUSD/GOLD Lots + Cash Amount + Reward Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Required XAUUSD Lots <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0.01}
                step="any"
                required
                value={requiredLots}
                onChange={(e) => setRequiredLots(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] text-sm font-mono tabular-nums text-gray-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Closed Gold lots per IB Real account
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                USDT Cash Payout ($)
              </label>
              <input
                type="number"
                min={0}
                step="any"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] text-sm font-mono tabular-nums text-gray-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Direct USDT rebate amount
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Reward Category
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between px-3 py-2 h-[38px] text-xs font-semibold rounded-lg border-gray-300 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] text-gray-900 dark:text-white"
                  >
                    <span className="truncate">
                      {REWARD_TYPE_LABELS[rewardType]}
                    </span>
                    <ChevronDown size={14} className="text-gray-400 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-white dark:bg-[#1E2028] border border-dashboard"
                >
                  {(Object.keys(REWARD_TYPE_LABELS) as LoyaltyRewardType[]).map(
                    (typeKey) => (
                      <DropdownMenuItem
                        key={typeKey}
                        onClick={() => setRewardType(typeKey)}
                        className="text-xs font-medium cursor-pointer"
                      >
                        {REWARD_TYPE_LABELS[typeKey]}
                      </DropdownMenuItem>
                    )
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Row 3: Reward Headline */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Reward Headline <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={rewardTitle}
              onChange={(e) => setRewardTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-amber-500"
            />
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Primary reward summary shown on the tier banner and claim receipt
            </p>
          </div>

          {/* Row 4: Perk Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Perk &amp; Milestone Details
            </label>
            <textarea
              rows={2}
              value={perkDescription}
              onChange={(e) => setPerkDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-amber-500"
            />
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Additional privileges unlocked at this level (EA licenses, VPS, Alpha channel, etc.)
            </p>
          </div>

          {/* Row 5: Icon Selector + Active Toggle */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Milestone Icon
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {ICON_OPTIONS.map((opt) => {
                const IconComp = opt.icon;
                const selected = icon === opt.name;
                return (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => setIcon(opt.name)}
                    aria-label={opt.name}
                    title={opt.name}
                    className={`h-9 rounded-lg border flex items-center justify-center transition-all ${
                      selected
                        ? "border-amber-500 bg-amber-500/15 text-amber-500"
                        : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#151925] text-gray-500 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <IconComp size={16} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-[#151925]">
            <div>
              <div className="text-xs font-bold text-gray-900 dark:text-white">
                Level Active Status
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                When enabled, this level appears in the trader roadmap and can be claimed.
              </div>
            </div>
            <Button
              type="button"
              variant={isActive ? "primary" : "outline"}
              size="sm"
              onClick={() => setIsActive(!isActive)}
              className={`h-8 px-3 rounded-lg text-xs font-bold ${
                isActive
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                  : "text-gray-500"
              }`}
            >
              {isActive ? "ON (Active)" : "OFF (Hidden)"}
            </Button>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-dashboard">
            <Button
              type="button"
              variant="outline"
              size="smd"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="smd"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {isEdit ? "Save Level Changes" : "Create Level"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

