"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { UserTierBadge } from "./UserTierBadge";
import { Crown, ArrowUp, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { TIERS } from "@/lib/tier-utils";
import type { LeaderboardResponse } from "../actions";

interface RankUpModalProps {
  myRank: LeaderboardResponse["myRank"];
}

const STORAGE_KEY = "leaderboard_previous_rank";
const TIER_STORAGE_KEY = "leaderboard_previous_tier";

interface StoredRankData {
  rank: number;
  tier: string;
  timestamp: number;
}

export function RankUpModal({ myRank }: RankUpModalProps) {
  const [showModal, setShowModal] = useState(false);
  const [rankChange, setRankChange] = useState<{ from: number; to: number } | null>(null);
  const [tierChange, setTierChange] = useState<{ from: string; to: string } | null>(null);
  const hasChecked = useRef(false);

  const fireConfetti = useCallback(async () => {
    const confetti = (await import("canvas-confetti")).default;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
    const duration = 2000;
    const end = Date.now() + duration;

    const interval = window.setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }

      confetti({
        ...defaults,
        particleCount: 30,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
        colors: ["#00C888", "#06B6D4", "#FFD700", "#FF6B35"],
      });
    }, 250);
  }, []);

  useEffect(() => {
    if (!myRank || hasChecked.current) return;
    hasChecked.current = true;

    const stored = localStorage.getItem(STORAGE_KEY);
    let previousData: StoredRankData | null = null;

    if (stored) {
      try {
        previousData = JSON.parse(stored);
      } catch {
        // Corrupted data, reset
      }
    }

    const currentRank = myRank.rank;
    const currentTier = myRank.tierProgress.current.name;

    // Save current data for next visit
    const newData: StoredRankData = {
      rank: currentRank,
      tier: currentTier,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));

    if (!previousData) return; // First visit — no comparison

    // Check rank improvement
    if (currentRank < previousData.rank) {
      setRankChange({ from: previousData.rank, to: currentRank });
    }

    // Check tier upgrade
    const tierOrder = TIERS.map(t => t.name);
    if (currentTier !== previousData.tier) {
      const prevIndex = tierOrder.indexOf(previousData.tier);
      const currIndex = tierOrder.indexOf(currentTier);
      if (currIndex > prevIndex) {
        setTierChange({ from: previousData.tier, to: currentTier });
      }
    }

    // Show modal if any improvement detected
    if (
      currentRank < previousData.rank ||
      (currentTier !== previousData.tier &&
        tierOrder.indexOf(currentTier) > tierOrder.indexOf(previousData.tier))
    ) {
      setShowModal(true);
      // Delay confetti slightly for visual effect
      setTimeout(fireConfetti, 300);
    }
  }, [myRank, fireConfetti]);

  if (!showModal || !myRank) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setShowModal(false)}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm bg-white dark:bg-[#1E2028] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-gray-200 dark:border-white/10">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />

        {/* Close */}
        <Button
          variant="ghost"
          className="absolute top-3 right-3 p-1.5 z-20 text-gray-400 hover:text-gray-600 dark:hover:text-white w-auto h-auto"
          onClick={() => setShowModal(false)}
          aria-label="Close celebration"
        >
          <X size={18} />
        </Button>

        <div className="relative z-10 p-8 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 text-primary mb-4 ring-4 ring-primary/5">
            {tierChange ? <Crown size={32} /> : <ArrowUp size={32} />}
          </div>

          {/* Title */}
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
            {tierChange ? "Tier Up!" : "Rank Up!"}
          </h2>

          {/* Rank change */}
          {rankChange && (
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-2xl font-black text-gray-400 line-through">
                #{rankChange.from}
              </span>
              <ArrowUp size={20} className="text-primary" />
              <span className="text-3xl font-black text-primary">
                #{rankChange.to}
              </span>
            </div>
          )}

          {/* Tier change */}
          {tierChange && (
            <div className="flex items-center justify-center gap-3 mb-4 py-3 px-4 rounded-xl bg-gray-50 dark:bg-white/5">
              <UserTierBadge
                tierName={tierChange.from}
                tierColor="#999"
                tierIcon="Shield"
                tierLabel={tierChange.from.charAt(0).toUpperCase() + tierChange.from.slice(1)}
                size="md"
              />
              <ArrowUp size={16} className="text-primary" />
              <UserTierBadge
                tierName={myRank.tierProgress.current.name}
                tierColor={myRank.tierProgress.current.color}
                tierIcon={myRank.tierProgress.current.icon}
                tierLabel={myRank.tierProgress.current.label}
                size="lg"
              />
            </div>
          )}

          {/* Current XP */}
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
            You now have{" "}
            <span className="font-bold text-gray-900 dark:text-white">
              {myRank.value.toLocaleString()} XP
            </span>
          </p>

          {/* CTA */}
          <Button
            variant="primary"
            onClick={() => setShowModal(false)}
            className="w-full"
          >
            Keep Going
          </Button>
        </div>
      </div>
    </div>
  );
}
