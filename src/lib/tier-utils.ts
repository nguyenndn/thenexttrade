/**
 * Client-safe tier utilities.
 * These functions only use the JSON config — no Prisma or server dependencies.
 * Use this in client components instead of importing from gamification.ts.
 */
import config from "@/config/gamification.json";

export interface Tier {
  name: string;
  label: string;
  minXp: number;
  icon: string;
  color: string;
}

export const TIERS: Tier[] = config.tiers;

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
