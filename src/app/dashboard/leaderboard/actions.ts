"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getTier, getPercentile, getTierProgress } from "@/lib/gamification";

export type LeaderboardType = "xp" | "streak" | "academy" | "trading";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string | null;
  tier: ReturnType<typeof getTier>;
  value: number;
  label: string;
  rankChange?: number;
}

export interface LeaderboardResponse {
  data: LeaderboardEntry[];
  myRank: {
    rank: number;
    value: number;
    percentile: number;
    tierProgress: ReturnType<typeof getTierProgress>;
  } | null;
  total: number;
  rivals: {
    above: LeaderboardEntry | null;
    below: LeaderboardEntry | null;
  } | null;
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

async function getXpLeaderboard(
  userId: string | null,
  limit: number
): Promise<LeaderboardResponse> {
  const users = await prisma.user.findMany({
    where: { showOnLeaderboard: true, xp: { gt: 0 } },
    orderBy: { xp: "desc" },
    take: limit,
    select: { id: true, name: true, image: true, xp: true },
  });

  const total = await prisma.user.count({
    where: { xp: { gt: 0 } },
  });

  const data: LeaderboardEntry[] = users.map((u, i) => ({
    rank: i + 1,
    userId: u.id,
    name: u.name || "Unknown",
    avatar: u.image,
    tier: getTier(u.xp),
    value: u.xp,
    label: "XP",
  }));

  let myRank = null;
  let rivals = null;

  if (userId) {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true },
    });

    if (currentUser) {
      const rank = await prisma.user.count({
        where: { xp: { gt: currentUser.xp } },
      }) + 1;

      myRank = {
        rank,
        value: currentUser.xp,
        percentile: getPercentile(rank, total),
        tierProgress: getTierProgress(currentUser.xp),
      };

      rivals = await getRivals(userId, "xp", currentUser.xp);
    }
  }

  return { data, myRank, total, rivals };
}

async function getStreakLeaderboard(
  userId: string | null,
  limit: number
): Promise<LeaderboardResponse> {
  const users = await prisma.user.findMany({
    where: { showOnLeaderboard: true, streak: { gt: 0 } },
    orderBy: { streak: "desc" },
    take: limit,
    select: { id: true, name: true, image: true, streak: true, xp: true },
  });

  const total = await prisma.user.count({
    where: { streak: { gt: 0 } },
  });

  const data: LeaderboardEntry[] = users.map((u, i) => ({
    rank: i + 1,
    userId: u.id,
    name: u.name || "Unknown",
    avatar: u.image,
    tier: getTier(u.xp),
    value: u.streak,
    label: "days",
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

  return { data, myRank, total, rivals };
}

async function getAcademyLeaderboard(
  userId: string | null,
  limit: number
): Promise<LeaderboardResponse> {
  // Raw query to count completed lessons per user
  const results = await prisma.$queryRaw<
    Array<{ userId: string; name: string; image: string | null; xp: number; count: bigint }>
  >`
    SELECT u.id AS "userId", u.name, u.image, u.xp,
           COUNT(up.id) AS count
    FROM "User" u
    INNER JOIN "UserProgress" up ON up."userId" = u.id AND up."isCompleted" = true
    WHERE u."showOnLeaderboard" = true
    GROUP BY u.id, u.name, u.image, u.xp
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

  return { data, myRank, total, rivals };
}

async function getTradingLeaderboard(
  userId: string | null,
  limit: number
): Promise<LeaderboardResponse> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const results = await prisma.$queryRaw<
    Array<{
      userId: string;
      name: string;
      image: string | null;
      xp: number;
      winRate: number;
      totalTrades: bigint;
    }>
  >`
    SELECT u.id AS "userId", u.name, u.image, u.xp,
           ROUND(COUNT(CASE WHEN je.result = 'WIN' THEN 1 END) * 100.0 / COUNT(*), 1) AS "winRate",
           COUNT(*) AS "totalTrades"
    FROM "User" u
    INNER JOIN "JournalEntry" je ON je."userId" = u.id
    WHERE u."showOnLeaderboard" = true
      AND je."entryDate" >= ${sevenDaysAgo}
      AND je.status = 'CLOSED'
    GROUP BY u.id, u.name, u.image, u.xp
    HAVING COUNT(*) >= 5
    ORDER BY "winRate" DESC
    LIMIT ${limit}
  `;

  const total = results.length;

  const data: LeaderboardEntry[] = results.map((r, i) => ({
    rank: i + 1,
    userId: r.userId,
    name: r.name || "Unknown",
    avatar: r.image,
    tier: getTier(r.xp),
    value: Number(r.winRate),
    label: "%",
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

  return { data, myRank, total, rivals };
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
