"use client";

import { X, Star, Flame, Clock, FileText, Trophy, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { UserTierBadge } from "./UserTierBadge";
import type { LeaderboardEntry } from "../actions";
import { cn } from "@/lib/utils";

interface UserProfileCardProps {
  entry: LeaderboardEntry | null;
  onClose: () => void;
}

function formatStudyTime(minutes: number): string {
  if (minutes === 0) return "0m";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function UserProfileCard({ entry, onClose }: UserProfileCardProps) {
  if (!entry) return null;

  const stats = [
    { icon: Star, label: "XP", value: entry.value.toLocaleString(), color: "text-yellow-500" },
    { icon: Trophy, label: "Rank", value: `#${entry.rank}`, color: "text-primary" },
    { icon: TrendingUp, label: "Level", value: entry.level.toString(), color: "text-cyan-500" },
    { icon: Clock, label: "Study Time", value: formatStudyTime(entry.studyTimeMinutes), color: "text-blue-500" },
    { icon: FileText, label: "Lessons", value: entry.lessonsCompleted.toString(), color: "text-green-500" },
    { icon: Flame, label: "Percentile", value: `${entry.percentile.toFixed(1)}%`, color: "text-orange-500" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm bg-white dark:bg-[#1E2028] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-gray-200 dark:border-white/10">
        {/* Glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-30"
          style={{ backgroundColor: entry.tier.color }}
        />

        {/* Close */}
        <Button
          variant="ghost"
          className="absolute top-3 right-3 p-1.5 z-20 text-gray-400 hover:text-gray-600 dark:hover:text-white w-auto h-auto"
          onClick={onClose}
          aria-label="Close profile card"
        >
          <X size={18} />
        </Button>

        <div className="relative z-10 p-6">
          {/* Avatar + Info */}
          <div className="flex flex-col items-center text-center mb-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white bg-gray-400 dark:bg-gray-600 mb-3 ring-4 ring-gray-200 dark:ring-white/10"
            >
              {entry.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={entry.avatar}
                  alt={entry.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                entry.name.charAt(0).toUpperCase()
              )}
            </div>

            <h3 className="text-lg font-black text-gray-900 dark:text-white">
              {entry.name}
            </h3>

            <div className="mt-1.5">
              <UserTierBadge
                tierName={entry.tier.name}
                tierColor={entry.tier.color}
                tierIcon={entry.tier.icon}
                tierLabel={entry.tier.label}
                size="md"
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-50 dark:bg-white/5"
              >
                <stat.icon size={16} className={stat.color} />
                <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums">
                  {stat.value}
                </span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
