import { prisma } from "@/lib/prisma";
import type {
  LoyaltyTierItem,
  UserLoyaltyProgress,
  LoyaltyClaimRecord,
} from "./loyalty.types";

export const DEFAULT_LOYALTY_TIERS: LoyaltyTierItem[] = [
  {
    level: 1,
    name: "Rookie Scalper",
    requiredLots: 10,
    rewardType: "CASH",
    rewardTitle: "$10 USDT Cash Reward + Bronze Badge",
    cashAmount: 10,
    perkDescription:
      "Full access to automated Journal analytics + $10 USDT direct payout.",
    icon: "Shield",
    badgeColor: "#CD7F32",
    order: 1,
    isActive: true,
  },
  {
    level: 2,
    name: "Active Trader",
    requiredLots: 50,
    rewardType: "CASH",
    rewardTitle: "$50 USDT Cash Reward + EA License",
    cashAmount: 50,
    perkDescription:
      "Automated 1x MT5 Trade Manager EA license + $50 USDT direct payout.",
    icon: "ShieldCheck",
    badgeColor: "#94A3B8",
    order: 2,
    isActive: true,
  },
  {
    level: 3,
    name: "Flow Operator",
    requiredLots: 100,
    rewardType: "CASH",
    rewardTitle: "$100 USDT Cash Reward + AI Coach Boost",
    cashAmount: 100,
    perkDescription:
      "3-Month Priority AI Diagnostics quota + $100 USDT direct payout.",
    icon: "Zap",
    badgeColor: "#38BDF8",
    order: 3,
    isActive: true,
  },
  {
    level: 4,
    name: "Volume Builder",
    requiredLots: 150,
    rewardType: "CASH",
    rewardTitle: "$180 USDT Cash Reward + Systems Suite",
    cashAmount: 180,
    perkDescription:
      "Full access to TheNextTrade EA Trading Systems catalog + $180 USDT direct payout.",
    icon: "Award",
    badgeColor: "#EAB308",
    order: 4,
    isActive: true,
  },
  {
    level: 5,
    name: "Alpha Executioner",
    requiredLots: 300,
    rewardType: "CASH",
    rewardTitle: "$400 USDT Cash Reward + Private Alpha Channel",
    cashAmount: 400,
    perkDescription:
      "Invitation to Private Telegram Alpha desk + $400 USDT direct payout.",
    icon: "Gem",
    badgeColor: "#A855F7",
    order: 5,
    isActive: true,
  },
  {
    level: 6,
    name: "Consistency Master",
    requiredLots: 600,
    rewardType: "CASH",
    rewardTitle: "$900 USDT Cash Reward + Unlimited EA Accounts",
    cashAmount: 900,
    perkDescription:
      "Uncapped live MT5 licenses on partner brokers + $900 USDT direct payout.",
    icon: "Diamond",
    badgeColor: "#EC4899",
    order: 6,
    isActive: true,
  },
  {
    level: 7,
    name: "High-Frequency Pro",
    requiredLots: 1200,
    rewardType: "CASH",
    rewardTitle: "$1,800 USDT Cash Reward + Sponsored VPS VIP",
    cashAmount: 1800,
    perkDescription:
      "Ultra-low latency London/NY sponsored MT5 VPS + $1,800 USDT direct payout.",
    icon: "Flame",
    badgeColor: "#F97316",
    order: 7,
    isActive: true,
  },
  {
    level: 8,
    name: "Market Maker",
    requiredLots: 2500,
    rewardType: "CASH",
    rewardTitle: "$4,000 USDT Cash Reward + Prop Capital Fast-track",
    cashAmount: 4000,
    perkDescription:
      "Priority evaluation support with partner prop desks + $4,000 USDT direct payout.",
    icon: "Trophy",
    badgeColor: "#EAB308",
    order: 8,
    isActive: true,
  },
  {
    level: 9,
    name: "Apex Whale",
    requiredLots: 5000,
    rewardType: "CASH",
    rewardTitle: "$8,000 USDT Cash Reward + 1-on-1 Capital Desk",
    cashAmount: 8000,
    perkDescription:
      "Dedicated institutional risk consultation desk + $8,000 USDT direct payout.",
    icon: "Crown",
    badgeColor: "#EF4444",
    order: 9,
    isActive: true,
  },
  {
    level: 10,
    name: "The Sovereign",
    requiredLots: 10000,
    rewardType: "CASH",
    rewardTitle: "$18,000 USDT Cash Reward + Elite Partner Share",
    cashAmount: 18000,
    perkDescription:
      "Highest honor in TheNextTrade ecosystem + $18,000 USDT direct payout.",
    icon: "Sparkles",
    badgeColor: "#F59E0B",
    order: 10,
    isActive: true,
  },
];

/**
 * Fetch all active loyalty tiers sorted by level ascending
 */
export async function getLoyaltyTiers(): Promise<LoyaltyTierItem[]> {
  try {
    const dbTiers = await prisma.loyaltyTier.findMany({
      where: { isActive: true },
      orderBy: { level: "asc" },
    });

    if (dbTiers && dbTiers.length > 0) {
      return dbTiers.map((t) => ({
        id: t.id,
        level: t.level,
        name: t.name,
        requiredLots: t.requiredLots,
        rewardType: t.rewardType,
        rewardTitle: t.rewardTitle,
        cashAmount: t.cashAmount || 0,
        perkDescription: t.perkDescription || "",
        icon: t.icon,
        badgeColor: t.badgeColor,
        order: t.order,
        isActive: t.isActive,
      }));
    }
  } catch (error) {
    console.warn("[Loyalty] DB fetch fallback to defaults:", (error as Error).message);
  }

  return DEFAULT_LOYALTY_TIERS;
}

/**
 * Aggregate total cumulative traded lots for a user across live accounts
 */
export async function calculateUserCumulativeLots(userId: string): Promise<{
  totalLots: number;
  totalClosedTrades: number;
  activeLiveAccounts: number;
  hasPartnerBrokerAccount: boolean;
  lastTradeAt: string | null;
}> {
  try {
    // 1. Get user accounts
    const accounts = await prisma.tradingAccount.findMany({
      where: { userId },
      select: {
        id: true,
        broker: true,
        accountType: true,
        status: true,
      },
    });

    const activeLiveAccounts = accounts.filter(
      (a) => a.accountType !== "DEMO" && a.status === "ACTIVE"
    ).length;

    const hasPartnerBrokerAccount = accounts.some(
      (a) => a.broker && ["exness", "xm", "ic markets", "vantage"].some((b) => a.broker?.toLowerCase().includes(b))
    );

    // 2. Query closed lots from JournalEntry
    const journalAgg = await prisma.journalEntry.aggregate({
      where: {
        userId,
        status: "CLOSED",
      },
      _sum: {
        lotSize: true,
      },
      _count: {
        id: true,
      },
      _max: {
        exitDate: true,
      },
    });

    // 3. Query IB activity snapshot if available
    const ibAgg = await prisma.ibActivitySnapshot.aggregate({
      where: { userId },
      _sum: {
        closedLotVolume: true,
        tradeCount: true,
      },
      _max: {
        lastTradeAt: true,
      },
    });

    const journalLots = journalAgg._sum.lotSize || 0;
    const ibLots = ibAgg._sum.closedLotVolume || 0;

    // Use whichever telemetry source has captured higher verified volume
    const totalLots = Math.max(journalLots, ibLots);
    const totalClosedTrades = Math.max(journalAgg._count.id, ibAgg._sum.tradeCount || 0);

    const latestDate =
      journalAgg._max.exitDate || ibAgg._max.lastTradeAt || null;

    return {
      totalLots: Number(totalLots.toFixed(2)),
      totalClosedTrades,
      activeLiveAccounts,
      hasPartnerBrokerAccount,
      lastTradeAt: latestDate ? latestDate.toISOString() : null,
    };
  } catch (error) {
    console.error("[Loyalty] Error aggregating lots:", error);
    return {
      totalLots: 0,
      totalClosedTrades: 0,
      activeLiveAccounts: 0,
      hasPartnerBrokerAccount: false,
      lastTradeAt: null,
    };
  }
}

/**
 * Get comprehensive loyalty progress for user
 */
export async function getUserLoyaltyProgress(userId: string): Promise<UserLoyaltyProgress> {
  const [tiers, lotData, existingClaims, userRecord] = await Promise.all([
    getLoyaltyTiers(),
    calculateUserCumulativeLots(userId),
    prisma.loyaltyClaim.findMany({
      where: { userId },
      orderBy: { claimedAt: "desc" },
    }).catch(() => []),
    prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true },
    }).catch(() => null),
  ]);

  const userSettings = (userRecord?.settings as Record<string, any>) || {};
  const payoutWallet = (userSettings?.payoutWallet as { network: any; address: string } | undefined) || null;

  const userClaims: LoyaltyClaimRecord[] = existingClaims.map((c) => ({
    id: c.id,
    userId: c.userId,
    tierId: c.tierId,
    level: c.level,
    tierName: c.tierName,
    requiredLots: c.requiredLots,
    actualLots: c.actualLots,
    rewardType: c.rewardType,
    rewardTitle: c.rewardTitle,
    cashAmount: c.cashAmount,
    payoutMethod: c.payoutMethod,
    network: c.network,
    usdtAddress: c.usdtAddress,
    status: c.status,
    adminNotes: c.adminNotes,
    transactionRef: c.transactionRef,
    claimedAt: c.claimedAt instanceof Date ? c.claimedAt.toISOString() : String(c.claimedAt),
    processedAt: c.processedAt ? (c.processedAt instanceof Date ? c.processedAt.toISOString() : String(c.processedAt)) : null,
    processedBy: c.processedBy,
  }));

  const claimedLevels = existingClaims
    .filter((c) => c.status === "COMPLETED" || c.status === "APPROVED")
    .map((c) => c.level);

  const pendingLevels = existingClaims
    .filter((c) => c.status === "PENDING")
    .map((c) => c.level);

  const { totalLots } = lotData;

  // Find current achieved tier
  let currentTier: LoyaltyTierItem | null = null;
  let nextTier: LoyaltyTierItem | null = null;

  for (let i = 0; i < tiers.length; i++) {
    if (totalLots >= tiers[i].requiredLots) {
      currentTier = tiers[i];
    } else {
      nextTier = tiers[i];
      break;
    }
  }

  // Calculate progress % to next tier
  let progressToNext = 100;
  let lotsToNext = 0;

  if (nextTier) {
    const prevRequired = currentTier ? currentTier.requiredLots : 0;
    const range = nextTier.requiredLots - prevRequired;
    const currentProgressInBracket = Math.max(0, totalLots - prevRequired);
    progressToNext = Math.min(100, Math.round((currentProgressInBracket / range) * 100));
    lotsToNext = Number(Math.max(0, nextTier.requiredLots - totalLots).toFixed(2));
  }

  // Map each tier with status
  const enrichedTiers = tiers.map((tier) => {
    const isUnlocked = totalLots >= tier.requiredLots;
    const isClaimed = claimedLevels.includes(tier.level);
    const isPending = pendingLevels.includes(tier.level);
    const canClaim = isUnlocked && !isClaimed && !isPending;

    return {
      ...tier,
      isUnlocked,
      isClaimed,
      isPending,
      canClaim,
    };
  });

  return {
    totalCumulativeLots: totalLots,
    currentTier,
    nextTier,
    progressToNext,
    lotsToNext,
    claimedLevels,
    pendingLevels,
    tiers: enrichedTiers,
    eligibility: {
      hasPartnerBrokerAccount: lotData.hasPartnerBrokerAccount,
      activeLiveAccounts: lotData.activeLiveAccounts,
      totalClosedTrades: lotData.totalClosedTrades,
      lastTradeAt: lotData.lastTradeAt,
    },
    userClaims,
    payoutWallet,
  };
}
