"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Gift, Check, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { claimMission } from "@/actions/edge-missions";
import { trackEvent } from "@/lib/track";
import { celebrateXP } from "@/lib/celebrate";
import { toast } from "sonner";
import type { MissionProgressItem } from "@/lib/services/edge-missions.service";

interface MissionCardProps {
  mission: MissionProgressItem;
  onClaimed?: () => void;
}

const CATEGORY_COLORS = {
  DAILY: "from-sky-500/10 to-cyan-500/10 border-sky-500/20",
  ONBOARDING: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20",
  WEEKLY: "from-amber-500/10 to-orange-500/10 border-amber-500/20",
  MASTERY: "from-purple-500/10 to-indigo-500/10 border-purple-500/20",
};

const CATEGORY_LABELS = {
  DAILY: "Daily",
  ONBOARDING: "Onboarding",
  WEEKLY: "Weekly",
  MASTERY: "Mastery",
};

export function MissionCard({ mission, onClaimed }: MissionCardProps) {
  const [isPending, startTransition] = useTransition();
  const [localClaimed, setLocalClaimed] = useState(false);

  // Derive claimed status: true if server says claimed OR if we just claimed locally (optimistic)
  const claimed = mission.claimed || localClaimed;
  const progressPct = Math.min((mission.progress / mission.target) * 100, 100);
  const isComplete = mission.completed;
  const canClaim = isComplete && !claimed;

  const handleClaim = () => {
    startTransition(async () => {
      const result = await claimMission(mission.missionId);
      if (result.success) {
        setLocalClaimed(true);
        trackEvent("mission_claimed", {
          mission_id: mission.missionId,
          category: mission.def.category,
          edge: result.xpAwarded || mission.def.xpReward,
        });
        await celebrateXP({
          xp: result.xpAwarded || mission.def.xpReward,
          message: `Mission Complete: ${mission.def.title}`,
        });
        onClaimed?.();
      } else if (result.error) {
        toast.error(result.error);
      }
    });
  };

  const categoryColor = CATEGORY_COLORS[mission.def.category] || CATEGORY_COLORS.ONBOARDING;

  return (
    <div
      className={`relative rounded-2xl border bg-gradient-to-br p-4 transition-all duration-300 ${
        claimed
          ? "border-gray-200/50 dark:border-white/5 opacity-60"
          : categoryColor
      } ${canClaim ? "ring-2 ring-gold/30 shadow-lg shadow-gold/10" : ""}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            claimed
              ? "bg-gray-100 dark:bg-white/5"
              : canClaim
                ? "bg-gold/10"
                : "bg-white/60 dark:bg-white/5"
          }`}
        >
          {claimed ? (
            <Check size={18} className="text-emerald-500" />
          ) : canClaim ? (
            <Gift size={18} className="text-gold" />
          ) : (
            <Lock size={18} className="text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white truncate">
              {mission.def.title}
            </h3>
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 shrink-0">
              {CATEGORY_LABELS[mission.def.category]}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
            {mission.def.description}
          </p>
          {mission.def.whyItMatters && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 italic line-clamp-2">
              {mission.def.whyItMatters}
            </p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tabular-nums">
            {mission.progress}/{mission.target}
          </span>
          <span className="text-[10px] font-black text-gold tabular-nums">
            +{mission.def.xpReward} Edge
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              claimed
                ? "bg-gray-300 dark:bg-gray-600"
                : isComplete
                  ? "bg-gradient-to-r from-amber-400 to-orange-500"
                  : "bg-primary"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* CTA */}
      {canClaim && (
        <Button
          variant="primary"
          onClick={handleClaim}
          disabled={isPending}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20 font-bold text-xs"
        >
          {isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Gift size={14} />
          )}
          Claim Reward
        </Button>
      )}

      {!isComplete && (
        <Link
          href={mission.def.ctaHref || "#"}
          className="block w-full"
          onClick={() => {
            if (mission.def.ctaHref?.includes("/reports")) {
              trackEvent("mission_report_cta_clicked", { surface: "missions", action: "open_weekly_review", missionId: mission.missionId });
            }
          }}
        >
          <Button variant="primary" className="w-full text-xs font-bold">
            {mission.def.ctaLabel || "Continue"}
          </Button>
        </Link>
      )}

      {claimed && (
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-500">
          <Check size={12} />
          Claimed
        </div>
      )}
    </div>
  );
}
