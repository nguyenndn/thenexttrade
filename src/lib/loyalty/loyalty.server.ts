import { prisma } from "@/lib/prisma";
import { normalizeLotSize } from "@/lib/utils/cent-account";
import type {
  LoyaltyTierItem,
  EnrichedLoyaltyTierItem,
  LoyaltyAccountProgress,
  UserLoyaltyProgress,
  LoyaltyClaimRecord,
  UsdtNetwork,
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
 * Check whether the Loyalty & Rewards program feature flag is enabled (defaults to true)
 */
export async function isLoyaltyEnabled(): Promise<boolean> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "feature_loyalty" },
    });
    if (!setting) return true;
    const val = setting.value as { enabled?: boolean } | null;
    return val?.enabled ?? true;
  } catch {
    return true;
  }
}

/**
 * Seed default 10 loyalty tiers into prisma.loyaltyTier if the table is empty
 */
export async function ensureDefaultLoyaltyTiersSeeded(): Promise<void> {
  try {
    const count = await prisma.loyaltyTier.count();
    if (count > 0) return;

    await prisma.$transaction(
      DEFAULT_LOYALTY_TIERS.map((tier) =>
        prisma.loyaltyTier.upsert({
          where: { level: tier.level },
          create: {
            level: tier.level,
            name: tier.name,
            requiredLots: tier.requiredLots,
            rewardType: tier.rewardType,
            rewardTitle: tier.rewardTitle,
            cashAmount: tier.cashAmount,
            perkDescription: tier.perkDescription,
            icon: tier.icon,
            badgeColor: tier.badgeColor,
            order: tier.order,
            isActive: tier.isActive,
          },
          update: {},
        })
      )
    );
  } catch (error) {
    console.warn("[Loyalty] Failed to seed default tiers:", (error as Error).message);
  }
}

/**
 * Fetch all active loyalty tiers sorted by level ascending
 */
export async function getLoyaltyTiers(): Promise<LoyaltyTierItem[]> {
  try {
    await ensureDefaultLoyaltyTiersSeeded();
    const dbTiers = await prisma.loyaltyTier.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { level: "asc" }],
    });

    const totalCount = await prisma.loyaltyTier.count();
    if (totalCount > 0) {
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

const NON_LIVE_KEYWORDS = ["demo", "contest", "evaluation", "trial"] as const;

/**
 * Checks whether a trade symbol is Gold (XAUUSD / GOLD) and not a currency pair.
 */
export function isGoldSymbol(symbol?: string | null): boolean {
  if (!symbol) return false;
  const clean = symbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return clean.includes("XAUUSD") || clean.startsWith("GOLD");
}

/**
 * Checks whether a trading account is a live REAL account (excludes Demo/Contest/Evaluation/Trial).
 */
export function isRealTradingAccount(account: {
  accountType?: string | null;
  server?: string | null;
  broker?: string | null;
}): boolean {
  const fields = [account.accountType, account.server, account.broker];
  for (const field of fields) {
    if (!field) continue;
    const lower = field.toLowerCase();
    if (NON_LIVE_KEYWORDS.some((kw) => lower.includes(kw))) {
      return false;
    }
  }
  return true;
}

/**
 * Checks whether a REAL trading account is verified under Partner IB.
 */
export function isIbVerifiedTradingAccount(
  account: {
    id: string;
    accountNumber?: string | null;
    ibAttribution?: string | null;
    proEntitlement?: {
      status?: string | null;
      source?: string | null;
      expiresAt?: Date | null;
    } | null;
  },
  approvedLicenseNumbers: Set<string>,
  approvedVipAccountIds: Set<string>,
  approvedVipAccountNumbers: Set<string>,
  now: Date = new Date()
): boolean {
  const attr = String(account.ibAttribution || "").toUpperCase();
  if (attr === "CONFIRMED" || attr === "VERIFIED") {
    return true;
  }

  const acctNum = account.accountNumber?.trim();
  if (acctNum && approvedLicenseNumbers.has(acctNum)) {
    return true;
  }

  if (approvedVipAccountIds.has(account.id)) {
    return true;
  }

  if (acctNum && approvedVipAccountNumbers.has(acctNum)) {
    return true;
  }

  const ent = account.proEntitlement;
  if (
    ent &&
    ent.source === "IB_VERIFIED" &&
    (ent.status === "ACTIVE" || ent.status === "GRACE") &&
    (!ent.expiresAt || ent.expiresAt >= now)
  ) {
    return true;
  }

  return false;
}

/**
 * Computes tier progress for a single account's XAUUSD/GOLD cumulative lots.
 */
export function computeTierProgressForLots(
  totalLots: number,
  tiers: LoyaltyTierItem[],
  claimedLevels: number[] = [],
  pendingLevels: number[] = []
): {
  currentTier: LoyaltyTierItem | null;
  nextTier: LoyaltyTierItem | null;
  progressToNext: number;
  lotsToNext: number;
  enrichedTiers: EnrichedLoyaltyTierItem[];
} {
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

  let progressToNext = 100;
  let lotsToNext = 0;

  if (nextTier) {
    const prevRequired = currentTier ? currentTier.requiredLots : 0;
    const range = nextTier.requiredLots - prevRequired;
    const currentProgressInBracket = Math.max(0, totalLots - prevRequired);
    progressToNext = Math.min(
      100,
      Math.round((currentProgressInBracket / range) * 100)
    );
    lotsToNext = Number(Math.max(0, nextTier.requiredLots - totalLots).toFixed(2));
  }

  const enrichedTiers: EnrichedLoyaltyTierItem[] = tiers.map((tier) => {
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
    currentTier,
    nextTier,
    progressToNext,
    lotsToNext,
    enrichedTiers,
  };
}

/**
 * Resolve all REAL + IB-verified accounts for a user along with per-account XAUUSD/GOLD lots.
 */
export async function getEligibleIbAccountsWithGoldLots(userId: string): Promise<
  Array<{
    id: string;
    name: string;
    accountNumber: string;
    broker: string;
    server: string | null;
    totalLots: number;
    totalClosedTrades: number;
    lastTradeAt: string | null;
  }>
> {
  try {
    const [accounts, approvedLicenses, approvedVips] = await Promise.all([
      prisma.tradingAccount.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          broker: true,
          server: true,
          currency: true,
          accountNumber: true,
          accountType: true,
          status: true,
          ibAttribution: true,
          proEntitlement: {
            select: {
              status: true,
              source: true,
              expiresAt: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.eALicense.findMany({
        where: {
          userId,
          OR: [{ status: "APPROVED" }, { isVerified: true }],
        },
        select: { accountNumber: true },
      }),
      prisma.vipRequest.findMany({
        where: {
          userId,
          status: "APPROVED",
        },
        select: { tradingAccountId: true, accountNumber: true },
      }),
    ]);

    const approvedLicenseNumbers = new Set(
      approvedLicenses.map((l) => l.accountNumber.trim()).filter(Boolean)
    );
    const approvedVipAccountIds = new Set(
      approvedVips.map((v) => v.tradingAccountId).filter((id): id is string => Boolean(id))
    );
    const approvedVipAccountNumbers = new Set(
      approvedVips.map((v) => v.accountNumber.trim()).filter(Boolean)
    );

    const now = new Date();
    const eligibleAccounts = accounts.filter(
      (acc) =>
        isRealTradingAccount(acc) &&
        isIbVerifiedTradingAccount(
          acc,
          approvedLicenseNumbers,
          approvedVipAccountIds,
          approvedVipAccountNumbers,
          now
        )
    );

    if (eligibleAccounts.length === 0) {
      return [];
    }

    const eligibleIds = eligibleAccounts.map((a) => a.id);

    // Fetch closed synced trades for these eligible REAL IB accounts where symbol is XAUUSD / GOLD
    const goldTrades = await prisma.journalEntry.findMany({
      where: {
        userId,
        accountId: { in: eligibleIds },
        status: "CLOSED",
        syncSource: { not: "MANUAL" },
        OR: [
          { symbol: { contains: "XAUUSD", mode: "insensitive" } },
          { symbol: { contains: "XAU/USD", mode: "insensitive" } },
          { symbol: { startsWith: "GOLD", mode: "insensitive" } },
        ],
      },
      select: {
        accountId: true,
        symbol: true,
        lotSize: true,
        exitDate: true,
        entryDate: true,
      },
    });

    const accountMetaMap = new Map(
      eligibleAccounts.map((a) => [
        a.id,
        {
          currency: a.currency,
          server: a.server,
          accountType: a.accountType,
        },
      ])
    );

    const statsByAccount = new Map<
      string,
      { lots: number; count: number; latestDate: Date | null }
    >();

    for (const trade of goldTrades) {
      if (!trade.accountId || !isGoldSymbol(trade.symbol)) continue;
      const acctMeta = accountMetaMap.get(trade.accountId);
      const normalizedLots = normalizeLotSize(Number(trade.lotSize) || 0, {
        symbol: trade.symbol,
        currency: acctMeta?.currency,
        server: acctMeta?.server,
        accountType: acctMeta?.accountType,
      });
      const cur = statsByAccount.get(trade.accountId) || {
        lots: 0,
        count: 0,
        latestDate: null,
      };
      cur.lots += normalizedLots;
      cur.count += 1;
      const tradeDate = trade.exitDate || trade.entryDate;
      if (tradeDate && (!cur.latestDate || tradeDate > cur.latestDate)) {
        cur.latestDate = tradeDate;
      }
      statsByAccount.set(trade.accountId, cur);
    }

    return eligibleAccounts.map((acc) => {
      const stat = statsByAccount.get(acc.id);
      return {
        id: acc.id,
        name: acc.name || acc.broker || "MT5 Account",
        accountNumber: acc.accountNumber || "—",
        broker: acc.broker || "Partner Broker",
        server: acc.server || null,
        totalLots: Number((stat?.lots || 0).toFixed(2)),
        totalClosedTrades: stat?.count || 0,
        lastTradeAt: stat?.latestDate ? stat.latestDate.toISOString() : null,
      };
    });
  } catch (error) {
    console.error("[Loyalty] Error resolving eligible IB accounts:", error);
    return [];
  }
}

/**
 * Calculate XAUUSD/GOLD cumulative traded lots for a specific REAL + IB-verified account
 * (or the primary eligible IB account if accountId is omitted).
 */
export async function calculateUserCumulativeLots(
  userId: string,
  accountId?: string
): Promise<{
  accountId: string | null;
  accountNumber: string | null;
  broker: string | null;
  accountName: string | null;
  totalLots: number;
  totalClosedTrades: number;
  activeLiveAccounts: number;
  hasPartnerBrokerAccount: boolean;
  lastTradeAt: string | null;
}> {
  const eligibleAccounts = await getEligibleIbAccountsWithGoldLots(userId);
  if (eligibleAccounts.length === 0) {
    return {
      accountId: null,
      accountNumber: null,
      broker: null,
      accountName: null,
      totalLots: 0,
      totalClosedTrades: 0,
      activeLiveAccounts: 0,
      hasPartnerBrokerAccount: false,
      lastTradeAt: null,
    };
  }

  const targetAccount = accountId
    ? eligibleAccounts.find((a) => a.id === accountId) || null
    : [...eligibleAccounts].sort((a, b) => b.totalLots - a.totalLots)[0];

  if (!targetAccount) {
    return {
      accountId: null,
      accountNumber: null,
      broker: null,
      accountName: null,
      totalLots: 0,
      totalClosedTrades: 0,
      activeLiveAccounts: eligibleAccounts.length,
      hasPartnerBrokerAccount: true,
      lastTradeAt: null,
    };
  }

  return {
    accountId: targetAccount.id,
    accountNumber: targetAccount.accountNumber,
    broker: targetAccount.broker,
    accountName: targetAccount.name,
    totalLots: targetAccount.totalLots,
    totalClosedTrades: targetAccount.totalClosedTrades,
    activeLiveAccounts: eligibleAccounts.length,
    hasPartnerBrokerAccount: true,
    lastTradeAt: targetAccount.lastTradeAt,
  };
}

/**
 * Get comprehensive per-account loyalty progress for user (Phương án A: Real + IB accounts, XAUUSD/GOLD only)
 */
export async function getUserLoyaltyProgress(
  userId: string,
  requestedAccountId?: string
): Promise<UserLoyaltyProgress> {
  const [tiers, eligibleRaw, existingClaims, userRecord] = await Promise.all([
    getLoyaltyTiers(),
    getEligibleIbAccountsWithGoldLots(userId),
    prisma.loyaltyClaim
      .findMany({
        where: { userId },
        orderBy: { claimedAt: "desc" },
      })
      .catch(() => []),
    prisma.user
      .findUnique({
        where: { id: userId },
        select: { settings: true },
      })
      .catch(() => null),
  ]);

  const userSettings = (userRecord?.settings as Record<string, unknown>) || {};
  const payoutWallet =
    (userSettings?.payoutWallet as
      | { network: UsdtNetwork; address: string }
      | undefined) || null;

  const primaryAccountId =
    eligibleRaw.length > 0
      ? [...eligibleRaw].sort((a, b) => b.totalLots - a.totalLots)[0].id
      : null;

  const userClaims: LoyaltyClaimRecord[] = existingClaims.map((c) => {
    const details = (c.payoutDetails as Record<string, unknown> | null) || {};
    const claimAccountId =
      typeof details.accountId === "string"
        ? details.accountId
        : primaryAccountId;
    const claimAccountNumber =
      typeof details.accountNumber === "string" ? details.accountNumber : null;
    const claimBroker =
      typeof details.broker === "string" ? details.broker : null;
    const claimAccountName =
      typeof details.accountName === "string" ? details.accountName : null;

    return {
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
      accountId: claimAccountId,
      accountNumber: claimAccountNumber,
      broker: claimBroker,
      accountName: claimAccountName,
      status: c.status,
      adminNotes: c.adminNotes,
      transactionRef: c.transactionRef,
      claimedAt:
        c.claimedAt instanceof Date
          ? c.claimedAt.toISOString()
          : String(c.claimedAt),
      processedAt: c.processedAt
        ? c.processedAt instanceof Date
          ? c.processedAt.toISOString()
          : String(c.processedAt)
        : null,
      processedBy: c.processedBy,
    };
  });

  // Build per-account progress for every eligible REAL + IB-verified account
  const eligibleAccounts: LoyaltyAccountProgress[] = eligibleRaw.map((acc) => {
    const accountClaims = userClaims.filter((c) => c.accountId === acc.id);
    const accClaimedLevels = accountClaims
      .filter((c) => c.status === "COMPLETED" || c.status === "APPROVED")
      .map((c) => c.level);
    const accPendingLevels = accountClaims
      .filter((c) => c.status === "PENDING")
      .map((c) => c.level);

    const {
      currentTier,
      nextTier,
      progressToNext,
      lotsToNext,
      enrichedTiers,
    } = computeTierProgressForLots(
      acc.totalLots,
      tiers,
      accClaimedLevels,
      accPendingLevels
    );

    return {
      accountId: acc.id,
      name: acc.name,
      accountNumber: acc.accountNumber,
      broker: acc.broker,
      server: acc.server,
      totalCumulativeLots: acc.totalLots,
      totalClosedTrades: acc.totalClosedTrades,
      lastTradeAt: acc.lastTradeAt,
      currentTier,
      nextTier,
      progressToNext,
      lotsToNext,
      claimedLevels: accClaimedLevels,
      pendingLevels: accPendingLevels,
      tiers: enrichedTiers,
    };
  });

  const selectedAccount =
    (requestedAccountId &&
      eligibleAccounts.find((a) => a.accountId === requestedAccountId)) ||
    (primaryAccountId &&
      eligibleAccounts.find((a) => a.accountId === primaryAccountId)) ||
    eligibleAccounts[0] ||
    null;

  if (!selectedAccount) {
    const emptyProgress = computeTierProgressForLots(0, tiers, [], []);
    return {
      selectedAccountId: null,
      eligibleAccounts: [],
      totalCumulativeLots: 0,
      currentTier: null,
      nextTier: emptyProgress.nextTier,
      progressToNext: 0,
      lotsToNext: emptyProgress.lotsToNext,
      claimedLevels: [],
      pendingLevels: [],
      tiers: emptyProgress.enrichedTiers,
      eligibility: {
        hasPartnerBrokerAccount: false,
        activeLiveAccounts: 0,
        totalClosedTrades: 0,
        lastTradeAt: null,
      },
      userClaims,
      payoutWallet,
    };
  }

  return {
    selectedAccountId: selectedAccount.accountId,
    eligibleAccounts,
    totalCumulativeLots: selectedAccount.totalCumulativeLots,
    currentTier: selectedAccount.currentTier,
    nextTier: selectedAccount.nextTier,
    progressToNext: selectedAccount.progressToNext,
    lotsToNext: selectedAccount.lotsToNext,
    claimedLevels: selectedAccount.claimedLevels,
    pendingLevels: selectedAccount.pendingLevels,
    tiers: selectedAccount.tiers,
    eligibility: {
      hasPartnerBrokerAccount: true,
      activeLiveAccounts: eligibleAccounts.length,
      totalClosedTrades: selectedAccount.totalClosedTrades,
      lastTradeAt: selectedAccount.lastTradeAt,
    },
    userClaims,
    payoutWallet,
  };
}
