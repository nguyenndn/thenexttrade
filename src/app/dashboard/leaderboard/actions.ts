"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { getTier, getPercentile, getTierProgress } from "@/lib/gamification";

export type LeaderboardType = "xp" | "streak" | "academy" | "trading" | "mystats";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string | null;
  tier: ReturnType<typeof getTier>;
  value: number;
  label: string;
  level: number;
  lessonsCompleted: number;
  studyTimeMinutes: number;
  percentile: number;
  totalTrades: number;
  pnl: number;
}

export interface UserBadgeInfo {
  code: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string | null;
}

export interface LeaderboardResponse {
  data: LeaderboardEntry[];
  myRank: {
    rank: number;
    value: number;
    percentile: number;
    tierProgress: ReturnType<typeof getTierProgress>;
    streak?: number;
    level?: number;
    lessonsCompleted?: number;
    studyTimeMinutes?: number;
    totalTrades?: number;
    badges?: UserBadgeInfo[];
    memberSince?: string;
  } | null;
  total: number;
  rivals: {
    above: LeaderboardEntry | null;
    below: LeaderboardEntry | null;
  } | null;
  hasLeaderboardAccount: boolean;
}

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getLeaderboard(
  type: LeaderboardType = "xp",
  limit: number = 50
): Promise<LeaderboardResponse> {
  const userId = await getCurrentUserId();

  switch (type) {
    case "xp":
      return getXpLeaderboard(userId, limit);
    case "streak":
      return getStreakLeaderboard(userId, limit);
    case "academy":
      return getAcademyLeaderboard(userId, limit);
    case "trading":
      return getTradingLeaderboard(userId, limit);
    default:
      return getXpLeaderboard(userId, limit);
  }
}

// Batch fetch lessons + study time for enriched leaderboard entries
async function getEnrichedStats(userIds: string[]): Promise<Record<string, { lessonsCompleted: number; studyTimeMinutes: number }>> {
  if (userIds.length === 0) return {};

  const stats = await prisma.$queryRaw<
    Array<{ userId: string; lessonsCompleted: bigint; studyTimeMinutes: bigint | null }>
  >`
    SELECT up."userId",
           COUNT(up.id) AS "lessonsCompleted",
           COALESCE(SUM(l.duration), 0) AS "studyTimeMinutes"
    FROM "UserProgress" up
    INNER JOIN "Lesson" l ON l.id = up."lessonId"
    WHERE up."isCompleted" = true AND up."userId"::text IN (${Prisma.join(userIds)})
    GROUP BY up."userId"
  `;

  const result: Record<string, { lessonsCompleted: number; studyTimeMinutes: number }> = {};
  for (const s of stats) {
    result[s.userId] = {
      lessonsCompleted: Number(s.lessonsCompleted),
      studyTimeMinutes: Number(s.studyTimeMinutes ?? 0),
    };
  }
  return result;
}

async function getXpLeaderboard(
  userId: string | null,
  limit: number
): Promise<LeaderboardResponse> {
  const users = await prisma.user.findMany({
    where: { showOnLeaderboard: true, xp: { gt: 0 } },
    orderBy: { xp: "desc" },
    take: limit,
    select: { id: true, name: true, image: true, xp: true, level: true },
  });

  const total = await prisma.user.count({
    where: { xp: { gt: 0 } },
  });

  const userIds = users.map((u) => u.id);
  const enriched = await getEnrichedStats(userIds);

  const data: LeaderboardEntry[] = users.map((u, i) => ({
    rank: i + 1,
    userId: u.id,
    name: u.name || "Unknown",
    avatar: u.image,
    tier: getTier(u.xp),
    value: u.xp,
    label: "XP",
    level: u.level,
    lessonsCompleted: enriched[u.id]?.lessonsCompleted ?? 0,
    studyTimeMinutes: enriched[u.id]?.studyTimeMinutes ?? 0,
    percentile: getPercentile(i + 1, total),
    totalTrades: 0,
    pnl: 0,
  }));

  let myRank: LeaderboardResponse["myRank"] = null;
  let rivals = null;

  if (userId) {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        xp: true,
        streak: true,
        level: true,
        createdAt: true,
        badges: {
          include: { badge: true },
          orderBy: { earnedAt: "desc" },
        },
      },
    });

    if (currentUser) {
      const rank = await prisma.user.count({
        where: { xp: { gt: currentUser.xp } },
      }) + 1;

      // Fetch lessons + study time
      const myEnriched = await getEnrichedStats([userId]);
      const myStats = myEnriched[userId];

      // Fetch trade count
      const tradeCount = await prisma.journalEntry.count({
        where: { userId, status: "CLOSED" },
      });

      // Map badges: show all BADGES from gamification, mark earned ones
      const { BADGES } = await import("@/lib/gamification");
      const earnedMap = new Map(
        currentUser.badges.map((ub) => [ub.badge.code, ub.earnedAt.toISOString()])
      );
      const allBadges: UserBadgeInfo[] = Object.values(BADGES).map((b) => ({
        code: b.code,
        name: b.name,
        description: b.description,
        icon: b.icon,
        earnedAt: earnedMap.get(b.code) ?? null,
      }));

      myRank = {
        rank,
        value: currentUser.xp,
        percentile: getPercentile(rank, total),
        tierProgress: getTierProgress(currentUser.xp),
        streak: currentUser.streak,
        level: currentUser.level,
        lessonsCompleted: myStats?.lessonsCompleted ?? 0,
        studyTimeMinutes: myStats?.studyTimeMinutes ?? 0,
        totalTrades: tradeCount,
        badges: allBadges,
        memberSince: currentUser.createdAt.toISOString(),
      };

      rivals = await getRivals(userId, "xp", currentUser.xp);
    }
  }

  return { data, myRank, total, rivals, hasLeaderboardAccount: true };
}

async function getStreakLeaderboard(
  userId: string | null,
  limit: number
): Promise<LeaderboardResponse> {
  const users = await prisma.user.findMany({
    where: { showOnLeaderboard: true, streak: { gt: 0 } },
    orderBy: { streak: "desc" },
    take: limit,
    select: { id: true, name: true, image: true, streak: true, xp: true, level: true },
  });

  const total = await prisma.user.count({
    where: { streak: { gt: 0 } },
  });

  const userIds = users.map((u) => u.id);
  const enriched = await getEnrichedStats(userIds);

  const data: LeaderboardEntry[] = users.map((u, i) => ({
    rank: i + 1,
    userId: u.id,
    name: u.name || "Unknown",
    avatar: u.image,
    tier: getTier(u.xp),
    value: u.streak,
    label: "days",
    level: u.level,
    lessonsCompleted: enriched[u.id]?.lessonsCompleted ?? 0,
    studyTimeMinutes: enriched[u.id]?.studyTimeMinutes ?? 0,
    percentile: getPercentile(i + 1, total),
    totalTrades: 0,
    pnl: 0,
  }));

  let myRank = null;
  let rivals = null;

  if (userId) {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { streak: true, xp: true },
    });

    if (currentUser) {
      const rank = await prisma.user.count({
        where: { streak: { gt: currentUser.streak } },
      }) + 1;

      myRank = {
        rank,
        value: currentUser.streak,
        percentile: getPercentile(rank, total),
        tierProgress: getTierProgress(currentUser.xp),
      };

      rivals = await getRivals(userId, "streak", currentUser.streak);
    }
  }

  return { data, myRank, total, rivals, hasLeaderboardAccount: true };
}

async function getAcademyLeaderboard(
  userId: string | null,
  limit: number
): Promise<LeaderboardResponse> {
  // Raw query to count completed lessons per user
  const results = await prisma.$queryRaw<
    Array<{ userId: string; name: string; image: string | null; xp: number; level: number; count: bigint; studyMinutes: bigint | null }>
  >`
    SELECT u.id AS "userId", u.name, u.image, u.xp, u.level,
           COUNT(up.id) AS count,
           COALESCE(SUM(l.duration), 0) AS "studyMinutes"
    FROM "User" u
    INNER JOIN "UserProgress" up ON up."userId" = u.id AND up."isCompleted" = true
    INNER JOIN "Lesson" l ON l.id = up."lessonId"
    WHERE u."showOnLeaderboard" = true
    GROUP BY u.id, u.name, u.image, u.xp, u.level
    ORDER BY count DESC
    LIMIT ${limit}
  `;

  const total = results.length;

  const data: LeaderboardEntry[] = results.map((r, i) => ({
    rank: i + 1,
    userId: r.userId,
    name: r.name || "Unknown",
    avatar: r.image,
    tier: getTier(r.xp),
    value: Number(r.count),
    label: "lessons",
    level: r.level,
    lessonsCompleted: Number(r.count),
    studyTimeMinutes: Number(r.studyMinutes ?? 0),
    percentile: getPercentile(i + 1, total),
    totalTrades: 0,
    pnl: 0,
  }));

  let myRank = null;
  let rivals = null;

  if (userId) {
    const myCount = await prisma.userProgress.count({
      where: { userId, isCompleted: true },
    });

    const usersAbove = results.filter((r) => Number(r.count) > myCount).length;
    const rank = usersAbove + 1;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true },
    });

    myRank = {
      rank,
      value: myCount,
      percentile: getPercentile(rank, total || 1),
      tierProgress: getTierProgress(currentUser?.xp ?? 0),
    };
  }

  return { data, myRank, total, rivals, hasLeaderboardAccount: true };
}

async function getTradingLeaderboard(
  userId: string | null,
  limit: number
): Promise<LeaderboardResponse> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  // Check if current user has a leaderboard account
  let hasLeaderboardAccount = true;
  if (userId) {
    const lbAccount = await prisma.tradingAccount.findFirst({
      where: { userId, useForLeaderboard: true },
      select: { id: true },
    });
    hasLeaderboardAccount = !!lbAccount;
  }

  const results = await prisma.$queryRaw<
    Array<{
      userId: string;
      name: string;
      image: string | null;
      xp: number;
      level: number;
      winRate: number;
      totalTrades: bigint;
      totalPnl: number | null;
    }>
  >`
     SELECT u.id AS "userId", u.name, u.image, u.xp, u.level,
           ROUND(COUNT(CASE WHEN je.result = 'WIN' THEN 1 END) * 100.0 / COUNT(*), 1) AS "winRate",
           COUNT(*) AS "totalTrades",
           COALESCE(SUM(je.pnl), 0) AS "totalPnl"
    FROM "User" u
    INNER JOIN "trading_accounts" ta ON ta."userId" = u.id AND ta.use_for_leaderboard = true
    INNER JOIN "JournalEntry" je ON je."accountId" = ta.id
    WHERE u."showOnLeaderboard" = true
      AND je."entryDate" >= ${sevenDaysAgo}
      AND je.status = 'CLOSED'
    GROUP BY u.id, u.name, u.image, u.xp, u.level
    HAVING COUNT(*) >= 5 AND COALESCE(SUM(je.pnl), 0) > 0
    ORDER BY "totalPnl" DESC
    LIMIT ${limit}
  `;

  const total = results.length;

  const enrichedUserIds = results.map((r) => r.userId);
  const enriched = await getEnrichedStats(enrichedUserIds);

  const data: LeaderboardEntry[] = results.map((r, i) => ({
    rank: i + 1,
    userId: r.userId,
    name: r.name || "Unknown",
    avatar: r.image,
    tier: getTier(r.xp),
    value: Number(r.winRate),
    label: "%",
    level: r.level,
    lessonsCompleted: enriched[r.userId]?.lessonsCompleted ?? 0,
    studyTimeMinutes: enriched[r.userId]?.studyTimeMinutes ?? 0,
    percentile: getPercentile(i + 1, total),
    totalTrades: Number(r.totalTrades),
    pnl: Number(r.totalPnl ?? 0),
  }));

  let myRank = null;
  let rivals = null;

  if (userId) {
    const myStats = results.find((r) => r.userId === userId);
    if (myStats) {
      const rank = results.findIndex((r) => r.userId === userId) + 1;
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { xp: true },
      });

      myRank = {
        rank,
        value: Number(myStats.winRate),
        percentile: getPercentile(rank, total),
        tierProgress: getTierProgress(currentUser?.xp ?? 0),
      };
    }
  }

  return { data, myRank, total, rivals, hasLeaderboardAccount };
}

// Get users directly above and below the current user
async function getRivals(
  userId: string,
  field: "xp" | "streak",
  currentValue: number
): Promise<{ above: LeaderboardEntry | null; below: LeaderboardEntry | null }> {
  const aboveUser = await prisma.user.findFirst({
    where: {
      [field]: { gt: currentValue },
      showOnLeaderboard: true,
      id: { not: userId },
    },
    orderBy: { [field]: "asc" },
    select: { id: true, name: true, image: true, xp: true, [field]: true },
  });

  const belowUser = await prisma.user.findFirst({
    where: {
      [field]: { lt: currentValue },
      showOnLeaderboard: true,
      id: { not: userId },
    },
    orderBy: { [field]: "desc" },
    select: { id: true, name: true, image: true, xp: true, [field]: true },
  });

  const mapToEntry = (
    u: { id: string; name: string | null; image: string | null; xp: number; [key: string]: unknown } | null,
    rank: number
  ): LeaderboardEntry | null => {
    if (!u) return null;
    return {
      rank,
      userId: u.id,
      name: u.name || "Unknown",
      avatar: u.image,
      tier: getTier(u.xp),
      value: (u[field] as number) ?? 0,
      label: field === "xp" ? "XP" : "days",
      level: 0,
      lessonsCompleted: 0,
      studyTimeMinutes: 0,
      percentile: 0,
      totalTrades: 0,
      pnl: 0,
    };
  };

  const myRank = await prisma.user.count({
    where: { [field]: { gt: currentValue } },
  }) + 1;

  return {
    above: mapToEntry(aboveUser as Parameters<typeof mapToEntry>[0], myRank - 1),
    below: mapToEntry(belowUser as Parameters<typeof mapToEntry>[0], myRank + 1),
  };
}

// Toggle leaderboard visibility
export async function toggleLeaderboardVisibility(): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { showOnLeaderboard: true },
  });

  const newValue = !(user?.showOnLeaderboard ?? true);

  await prisma.user.update({
    where: { id: userId },
    data: { showOnLeaderboard: newValue },
  });

  return newValue;
}
