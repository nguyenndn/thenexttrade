
import { prisma } from "@/lib/prisma";
import config from "@/config/gamification.json";

// ============================================================================
// TIER SYSTEM — Config from src/config/gamification.json
// ============================================================================

export interface Tier {
  name: string;
  label: string;
  minXp: number;
  icon: string;
  color: string;
}

export const TIERS: Tier[] = config.tiers;

export type TierName = string;

export function getTier(xp: number): Tier {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (xp >= TIERS[i].minXp) return TIERS[i];
  }
  return TIERS[0];
}

export function getNextTier(xp: number): Tier | null {
  const currentTier = getTier(xp);
  const currentIndex = TIERS.findIndex((t) => t.name === currentTier.name);
  if (currentIndex >= TIERS.length - 1) return null;
  return TIERS[currentIndex + 1];
}

export function getTierProgress(xp: number) {
  const current = getTier(xp);
  const next = getNextTier(xp);

  if (!next) {
    return { current, next: null, progress: 100, xpToNext: 0 };
  }

  const tierRange = next.minXp - current.minXp;
  const xpInTier = xp - current.minXp;
  const progress = Math.min(Math.round((xpInTier / tierRange) * 100), 100);
  const xpToNext = next.minXp - xp;

  return { current, next, progress, xpToNext };
}

export function getPercentile(rank: number, total: number): number {
  if (total === 0) return 0;
  return Math.round(((total - rank) / total) * 100);
}

// ============================================================================
// XP AWARD CONSTANTS — Config from src/config/gamification.json
// ============================================================================

export const XP_AWARDS = config.xpAwards;

// ============================================================================
// BADGES
// ============================================================================


export const BADGES = {
    EARLY_ADOPTER: {
        code: "EARLY_ADOPTER",
        name: "Early Adopter",
        description: "Joined within the first 100 members.",
        icon: "Star", // Lucide icon name
        xpReward: 100
    },
    STUDIOUS: {
        code: "STUDIOUS",
        name: "Studious",
        description: "Completed 5 lessons.",
        icon: "BookOpen",
        xpReward: 50
    },
    TRADER: {
        code: "TRADER",
        name: "First Trade",
        description: "Logged your first trade.",
        icon: "TrendingUp",
        xpReward: 20
    },
    // Streak Badges
    WEEK_WARRIOR: {
        code: "WEEK_WARRIOR",
        name: "Week Warrior",
        description: "Reached a 7-day login streak.",
        icon: "Flame",
        xpReward: 50
    },
    MONTHLY_MASTER: {
        code: "MONTHLY_MASTER",
        name: "Monthly Master",
        description: "Reached a 30-day login streak.",
        icon: "Calendar",
        xpReward: 300
    },
    QUARTERLY_KING: {
        code: "QUARTERLY_KING",
        name: "Quarterly King",
        description: "Reached a 90-day login streak.",
        icon: "Crown",
        xpReward: 1000
    },
    CENTURY_CLUB: {
        code: "CENTURY_CLUB",
        name: "Century Club",
        description: "Reached a 100-day login streak.",
        icon: "Award",
        xpReward: 1500
    },
    LEGENDARY: {
        code: "LEGENDARY",
        name: "Legendary",
        description: "Reached a 365-day login streak.",
        icon: "Trophy",
        xpReward: 5000
    }
} as const;

export const LEVELS = [
    { level: 1, xp: 0 },
    { level: 2, xp: 100 },
    { level: 3, xp: 300 },
    { level: 4, xp: 600 },
    { level: 5, xp: 1000 },
    { level: 6, xp: 1500 },
    { level: 7, xp: 2100 },
    { level: 8, xp: 2800 },
    { level: 9, xp: 3600 },
    { level: 10, xp: 4500 },
];

export async function addXP(userId: string, amount: number) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { xp: true, level: true }
    });

    if (!user) return;

    let newXP = user.xp + amount;
    let newLevel = user.level;

    // Check for level up
    // Simple logic: Find max level where required XP <= newXP
    const levelObj = [...LEVELS].reverse().find(l => l.xp <= newXP);
    if (levelObj && levelObj.level > user.level) {
        newLevel = levelObj.level;
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            xp: newXP,
            level: newLevel
        }
    });

    return { newXP, newLevel, leveledUp: newLevel > user.level };
}

export async function checkAndGrantBadge(userId: string, badgeCode: keyof typeof BADGES) {
    const badgeDef = BADGES[badgeCode];
    if (!badgeDef) return;

    // 1. Ensure Badge exists in DB (Idempotent)
    const dbBadge = await prisma.badge.upsert({
        where: { code: badgeCode },
        update: {},
        create: {
            code: badgeCode,
            name: badgeDef.name,
            description: badgeDef.description,
            icon: badgeDef.icon,
            xpReward: badgeDef.xpReward
        }
    });

    // 2. Check if user already has it
    const existing = await prisma.userBadge.findUnique({
        where: {
            userId_badgeId: {
                userId,
                badgeId: dbBadge.id
            }
        }
    });

    if (existing) return { granted: false };

    // 3. Grant Badge
    await prisma.userBadge.create({
        data: {
            userId,
            badgeId: dbBadge.id
        }
    });

    // 4. Grant XP
    await addXP(userId, badgeDef.xpReward);

    return { granted: true, badge: dbBadge };
}
