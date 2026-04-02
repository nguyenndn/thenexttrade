"use client";

import { cn } from "@/lib/utils";
import { UserTierBadge } from "./UserTierBadge";
import type { LeaderboardResponse, UserBadgeInfo } from "../actions";
import {
  Star,
  Flame,
  BookOpen,
  TrendingUp,
  Trophy,
  Calendar,
  Crown,
  Award,
  Lock,
  Target,
} from "lucide-react";

// Map badge icon strings to Lucide components
const BADGE_ICONS: Record<string, React.ElementType> = {
  Star,
  BookOpen,
  TrendingUp,
  Flame,
  Calendar,
  Crown,
  Award,
  Trophy,
};

// Badge colors for earned state (per code)
const BADGE_COLORS: Record<string, { bg: string; ring: string; text: string }> = {
  EARLY_ADOPTER: { bg: "bg-yellow-50 dark:bg-yellow-500/15", ring: "ring-yellow-300 dark:ring-yellow-500/40", text: "text-yellow-600 dark:text-yellow-400" },
  STUDIOUS: { bg: "bg-emerald-50 dark:bg-emerald-500/15", ring: "ring-emerald-300 dark:ring-emerald-500/40", text: "text-emerald-600 dark:text-emerald-400" },
  TRADER: { bg: "bg-sky-50 dark:bg-sky-500/15", ring: "ring-sky-300 dark:ring-sky-500/40", text: "text-sky-600 dark:text-sky-400" },
  WEEK_WARRIOR: { bg: "bg-orange-50 dark:bg-orange-500/15", ring: "ring-orange-300 dark:ring-orange-500/40", text: "text-orange-600 dark:text-orange-400" },
  MONTHLY_MASTER: { bg: "bg-rose-50 dark:bg-rose-500/15", ring: "ring-rose-300 dark:ring-rose-500/40", text: "text-rose-600 dark:text-rose-400" },
  QUARTERLY_KING: { bg: "bg-amber-50 dark:bg-amber-500/15", ring: "ring-amber-300 dark:ring-amber-500/40", text: "text-amber-600 dark:text-amber-400" },
  CENTURY_CLUB: { bg: "bg-teal-50 dark:bg-teal-500/15", ring: "ring-teal-300 dark:ring-teal-500/40", text: "text-teal-600 dark:text-teal-400" },
  LEGENDARY: { bg: "bg-yellow-50 dark:bg-yellow-500/15", ring: "ring-yellow-400 dark:ring-yellow-500/50", text: "text-yellow-600 dark:text-yellow-400" },
};

interface MyStatsViewProps {
  myRank: LeaderboardResponse["myRank"];
  userName?: string;
  userAvatar?: string | null;
}

export function MyStatsView({ myRank, userName, userAvatar }: MyStatsViewProps) {
  if (!myRank) {
    return (
      <div className="bg-white dark:bg-[#1E2028] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm p-12 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-cyan-500/10 text-cyan-500 mb-5 ring-4 ring-cyan-500/5">
          <Target size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-700 dark:text-white mb-3">
          Your stats will appear here
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed max-w-md mx-auto">
          Start earning XP by completing lessons, maintaining your streak, and trading to see your position on the leaderboard.
        </p>
      </div>
    );
  }

  const { rank, value, percentile, tierProgress, streak = 0, level = 1, lessonsCompleted = 0, totalTrades = 0, badges = [] } = myRank;
  const earnedCount = badges.filter((b) => b.earnedAt).length;

  return (
    <div>
      <div className="bg-white dark:bg-[#151925] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* PROFILE HERO */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="px-6 py-8 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-2xl text-white bg-gray-400 dark:bg-gray-600 overflow-hidden ring-4 ring-white dark:ring-[#1E2028] shadow-lg">
                {userAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userAvatar} alt={userName || "You"} className="w-full h-full object-cover" />
                ) : (
                  (userName || "Y").charAt(0).toUpperCase()
                )}
              </div>
              {/* Level badge */}
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg bg-primary text-white text-xs font-black flex items-center justify-center shadow-md border-2 border-white dark:border-[#151925]">
                {level}
              </div>
            </div>

            {/* Name + Tier */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-black text-gray-700 dark:text-white truncate mb-1">
                {userName || "You"}
              </h2>
              <div className="flex items-center gap-3 flex-wrap">
                <UserTierBadge
                  tierName={tierProgress.current.name}
                  tierColor={tierProgress.current.color}
                  tierIcon={tierProgress.current.icon}
                  tierLabel={tierProgress.current.label}
                  size="sm"
                />
                <span className="text-sm text-gray-500">
                  {earnedCount}/{badges.length} badges
                </span>
              </div>
            </div>

            {/* Rank */}
            <div className="text-right shrink-0">
              <div className="text-5xl font-black text-primary tabular-nums leading-none">
                #{rank}
              </div>
              <span className="text-sm font-bold text-gray-500 mt-1 block">
                Top {percentile.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TIER PROGRESS */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Tier Progress</span>
            {tierProgress.next && (
              <span className="text-xs text-gray-500 tabular-nums">
                {tierProgress.xpToNext.toLocaleString()} XP to {tierProgress.next.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <UserTierBadge
              tierName={tierProgress.current.name}
              tierColor={tierProgress.current.color}
              tierIcon={tierProgress.current.icon}
              tierLabel={tierProgress.current.label}
              size="sm"
            />
            <div className="flex-1 h-2.5 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400 transition-all duration-700 ease-out"
                style={{ width: `${tierProgress.progress}%` }}
              />
            </div>
            {tierProgress.next && (
              <UserTierBadge
                tierName={tierProgress.next.name}
                tierColor={tierProgress.next.color}
                tierIcon={tierProgress.next.icon}
                tierLabel={tierProgress.next.label}
                size="sm"
              />
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* QUICK STATS GRID */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-gray-100 dark:border-white/5">
          <QuickStat icon={Star} label="Total XP" value={value.toLocaleString()} color="text-yellow-500" />
          <QuickStat icon={Flame} label="Streak" value={`${streak}d`} color="text-orange-500" border />
          <QuickStat icon={BookOpen} label="Lessons" value={String(lessonsCompleted)} color="text-emerald-500" border />
          <QuickStat icon={TrendingUp} label="Trades" value={String(totalTrades)} color="text-sky-500" border />
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* BADGES & ACHIEVEMENTS */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {badges.length > 0 && (
          <div className="px-6 py-5 border-t border-gray-100 dark:border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                🏅 Badges & Achievements
              </h3>
              <span className="text-xs font-bold text-primary tabular-nums">
                {earnedCount}/{badges.length}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {badges.map((badge) => (
                <BadgeItem key={badge.code} badge={badge} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function QuickStat({ icon: Icon, label, value, color, border }: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  border?: boolean;
}) {
  return (
    <div className={cn("px-4 py-4 text-center", border && "border-l border-gray-100 dark:border-white/5")}>
      <Icon size={18} className={cn("mx-auto mb-1.5", color)} />
      <div className="text-lg font-black text-gray-700 dark:text-white tabular-nums">{value}</div>
      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function BadgeItem({ badge }: { badge: UserBadgeInfo }) {
  const isEarned = !!badge.earnedAt;
  const Icon = BADGE_ICONS[badge.icon] || Award;
  const colors = BADGE_COLORS[badge.code] || { bg: "bg-gray-100 dark:bg-white/5", ring: "ring-gray-200 dark:ring-white/10", text: "text-gray-600" };

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all",
        isEarned
          ? cn(colors.bg, "ring-1", colors.ring)
          : "opacity-40 grayscale"
      )}
      title={badge.description}
    >
      <div className="relative">
        <Icon size={24} className={cn(isEarned ? colors.text : "text-gray-300 dark:text-gray-600")} />
        {!isEarned && (
          <Lock size={10} className="absolute -bottom-0.5 -right-1 text-gray-600 dark:text-gray-300" />
        )}
      </div>
      <span className={cn(
        "text-[10px] font-bold text-center leading-tight",
        isEarned ? "text-gray-700 dark:text-gray-200" : "text-gray-500 dark:text-gray-600"
      )}>
        {badge.name}
      </span>
    </div>
  );
}
