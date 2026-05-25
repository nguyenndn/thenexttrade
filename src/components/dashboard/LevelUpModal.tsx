"use client";

import { useEffect, useState, useCallback } from "react";
import { Sparkles, Trophy, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface LevelUpEventData {
  xp: number;
  message?: string;
  badge?: string | null;
  leveledUp?: boolean;
}

export function LevelUpModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<LevelUpEventData | null>(null);

  const fireContinuousConfetti = useCallback(async () => {
    const confetti = (await import("canvas-confetti")).default;
    const duration = 2500;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 25, spread: 360, ticks: 50, zIndex: 10000 };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 40 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.2, 0.4), y: randomInRange(0.2, 0.4) },
        colors: ["#FFD700", "#FFA500", "#FF8C00", "#00C888"],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.6, 0.8), y: randomInRange(0.2, 0.4) },
        colors: ["#FFD700", "#FFA500", "#FF8C00", "#06B6D4"],
      });
    }, 200);
  }, []);

  useEffect(() => {
    const handleLevelUp = (e: Event) => {
      const customEvent = e as CustomEvent<LevelUpEventData>;
      if (customEvent.detail) {
        setData(customEvent.detail);
        setIsOpen(true);
        // Fire confetti celebration
        setTimeout(fireContinuousConfetti, 100);
      }
    };

    window.addEventListener("tnt_level_up", handleLevelUp);
    return () => {
      window.removeEventListener("tnt_level_up", handleLevelUp);
    };
  }, [fireContinuousConfetti]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#07090E]/90 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md bg-[#0D111A] border border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-500/10 overflow-hidden animate-in fade-in zoom-in-95 duration-500 p-8 text-center">
        {/* Glowing Auroras */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Close Button */}
        <Button
          variant="ghost"
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg w-auto h-auto hover:bg-white/5"
          onClick={() => setIsOpen(false)}
        >
          <X size={16} />
        </Button>

        {/* Level Up Badge Crown */}
        <div className="relative inline-flex items-center justify-center p-5 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-500/30 text-amber-400 mb-6 animate-bounce">
          <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-xl animate-pulse" />
          <Trophy size={40} className="relative z-10" />
        </div>

        {/* Title */}
        <h2 className="text-3xl font-black bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent uppercase tracking-wider mb-2 animate-pulse">
          LEVEL UP!
        </h2>
        <p className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-6">
          {data?.message || "New Level Unlocked"}
        </p>

        {/* Level Display */}
        <div className="py-5 px-6 rounded-2xl bg-white/[0.02] border border-white/5 mb-8 relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">
            Edge Level
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-5xl font-black text-white tracking-tight">
              PRO TRADER
            </span>
          </div>
          <div className="flex justify-center items-center gap-1.5 mt-3 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 w-fit mx-auto">
            <Zap size={12} className="fill-amber-400" />
            <span>+{data?.xp} Edge Points Awarded</span>
          </div>
        </div>

        {/* Badge reward alert if any */}
        {data?.badge && (
          <div className="mb-6 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2">
            <Sparkles size={14} className="animate-spin duration-3000" />
            <span>New Badge Unlocked: &quot;{data.badge}&quot;</span>
          </div>
        )}

        {/* Keep Going CTA */}
        <Button
          onClick={() => setIsOpen(false)}
          className="w-full h-12 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white font-black rounded-xl text-base shadow-lg shadow-amber-500/20 border-0 active:scale-95 transition-all"
        >
          KEEP CONQUERING
        </Button>
      </div>
    </div>
  );
}
