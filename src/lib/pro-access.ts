// Pro Access Utility — used by server actions and API routes
// Account-scoped: each trading account can have its own Pro status

import { prisma } from "@/lib/prisma";
import type { ProStatus, ProSource } from "@prisma/client";

// ============================================================================
// TYPES
// ============================================================================

export interface AccountProStatus {
  tradingAccountId: string;
  accountName: string;
  broker: string | null;
  status: ProStatus;
  isPro: boolean;
  source: ProSource | null;
  expiresAt: Date | null;
}

export interface ProAccessResult {
  isPro: boolean;
  status: ProStatus;
  source: ProSource | null;
  expiresAt: Date | null;
}

export interface UserProAccessResult extends ProAccessResult {
  activeAccountCount: number;
  accounts: AccountProStatus[];
}

// ============================================================================
// ACCOUNT-LEVEL PRO ACCESS — use for account-specific features
// ============================================================================

/**
 * Check Pro access for a specific trading account.
 * Use this for account-scoped features (Intelligence, Rule Violations, etc.)
 */
export async function getAccountProAccess(
  userId: string,
  tradingAccountId: string
): Promise<ProAccessResult> {
  // Verify account belongs to user
  const account = await prisma.tradingAccount.findFirst({
    where: { id: tradingAccountId, userId },
    select: { id: true },
  });

  if (!account) {
    return { isPro: false, status: "NONE", source: null, expiresAt: null };
  }

  const entitlement = await prisma.proEntitlement.findUnique({
    where: { tradingAccountId },
    select: {
      id: true,
      status: true,
      source: true,
      expiresAt: true,
    },
  });

  if (!entitlement) {
    return { isPro: false, status: "NONE", source: null, expiresAt: null };
  }

  // Auto-expire grace period
  if (
    entitlement.status === "GRACE" &&
    entitlement.expiresAt &&
    new Date() > entitlement.expiresAt
  ) {
    await prisma.proEntitlement.update({
      where: { tradingAccountId },
      data: { status: "EXPIRED" },
    });
    return {
      isPro: false,
      status: "EXPIRED",
      source: entitlement.source,
      expiresAt: entitlement.expiresAt,
    };
  }

  const isPro =
    entitlement.status === "ACTIVE" || entitlement.status === "GRACE";

  return {
    isPro,
    status: entitlement.status,
    source: entitlement.source,
    expiresAt: entitlement.expiresAt,
  };
}

// ============================================================================
// USER-LEVEL PRO ACCESS — aggregate across all accounts
// ============================================================================

/**
 * Check if a user has Pro access (aggregate across all accounts).
 * Returns isPro=true if at least one account is ACTIVE or valid GRACE.
 * Use for: status widget, navigation visibility, VIP resources.
 */
export async function getUserProAccess(
  userId: string
): Promise<UserProAccessResult> {
  const [entitlements, allTradingAccounts] = await Promise.all([
    prisma.proEntitlement.findMany({
      where: { userId },
      include: {
        tradingAccount: {
          select: { id: true, name: true, broker: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tradingAccount.findMany({
      where: { userId },
      select: { id: true, name: true, broker: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Auto-expire any grace entitlements
  const now = new Date();
  const expiredGraceIds = entitlements
    .filter((e) => e.status === "GRACE" && e.expiresAt && now > e.expiresAt)
    .map((e) => e.id);

  if (expiredGraceIds.length > 0) {
    await prisma.proEntitlement.updateMany({
      where: { id: { in: expiredGraceIds } },
      data: { status: "EXPIRED" },
    });
    for (const ent of entitlements) {
      if (expiredGraceIds.includes(ent.id)) {
        ent.status = "EXPIRED";
      }
    }
  }

  // Build account statuses from entitlements
  const entitlementMap = new Map<string, AccountProStatus>();

  for (const e of entitlements) {
    if (e.tradingAccountId) {
      entitlementMap.set(e.tradingAccountId, {
        tradingAccountId: e.tradingAccountId,
        accountName: e.tradingAccount?.name || "Unknown",
        broker: e.tradingAccount?.broker || e.broker || null,
        status: e.status,
        isPro: e.status === "ACTIVE" || e.status === "GRACE",
        source: e.source,
        expiresAt: e.expiresAt,
      });
    }
  }

  // Include ALL trading accounts — those without entitlements get NONE status
  const accounts: AccountProStatus[] = allTradingAccounts.map((ta) => {
    const existing = entitlementMap.get(ta.id);
    if (existing) return existing;
    return {
      tradingAccountId: ta.id,
      accountName: ta.name,
      broker: ta.broker,
      status: "NONE" as const,
      isPro: false,
      source: null,
      expiresAt: null,
    };
  });

  // Also handle legacy unlinked entitlements (tradingAccountId = null)
  const unlinked = entitlements.filter((e) => !e.tradingAccountId);
  for (const e of unlinked) {
    accounts.push({
      tradingAccountId: "",
      accountName: e.broker ? `${e.broker} (unlinked)` : "Unlinked",
      broker: e.broker || null,
      status: e.status,
      isPro: e.status === "ACTIVE" || e.status === "GRACE",
      source: e.source,
      expiresAt: e.expiresAt,
    });
  }

  const activeAccounts = accounts.filter((a) => a.isPro);
  const hasAnyPro = activeAccounts.length > 0;

  // Determine aggregate status
  let aggregateStatus: ProStatus;
  const proStatuses = accounts.filter((a) => a.status !== "NONE");

  if (proStatuses.length === 0) {
    aggregateStatus = "NONE";
  } else if (proStatuses.length === 1) {
    aggregateStatus = proStatuses[0].status;
  } else if (hasAnyPro) {
    aggregateStatus = "ACTIVE";
  } else if (proStatuses.some((a) => a.status === "GRACE")) {
    aggregateStatus = "GRACE";
  } else if (proStatuses.some((a) => a.status === "EXPIRED")) {
    aggregateStatus = "EXPIRED";
  } else if (proStatuses.some((a) => a.status === "REVOKED")) {
    aggregateStatus = "REVOKED";
  } else {
    aggregateStatus = "NONE";
  }

  // Pick source from best entitlement
  const bestEntitlement =
    entitlements.find((e) => e.status === "ACTIVE") ||
    entitlements.find((e) => e.status === "GRACE") ||
    entitlements[0];

  return {
    isPro: hasAnyPro,
    status: aggregateStatus,
    source: bestEntitlement?.source ?? null,
    expiresAt: bestEntitlement?.expiresAt ?? null,
    activeAccountCount: activeAccounts.length,
    accounts,
  };
}

// ============================================================================
// UTILITY
// ============================================================================

/**
 * Mask account number for display: "12345678" → "****5678"
 */
export function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber || accountNumber.length < 4) return "****";
  return "****" + accountNumber.slice(-4);
}

/**
 * Try to find a TradingAccount for a VIP request.
 * Matches by userId + accountNumber (primary key for a broker account).
 * Broker is also checked case-insensitively, with a fallback to accountNumber-only
 * to handle display name vs canonical enum mismatches (e.g. "Vantage" vs "VANTAGE").
 */
export async function findOrMatchTradingAccount(
  userId: string,
  broker: string,
  accountNumber: string
): Promise<string | null> {
  // Primary: exact accountNumber + broker (case-insensitive)
  const exact = await prisma.tradingAccount.findFirst({
    where: {
      userId,
      broker: { equals: broker, mode: "insensitive" },
      accountNumber,
    },
    select: { id: true },
  });
  if (exact) return exact.id;

  // Fallback: accountNumber-only — broker strings may differ (display name vs enum)
  // Safe because account numbers are unique identifiers per broker account
  const byAccount = await prisma.tradingAccount.findFirst({
    where: { userId, accountNumber },
    select: { id: true },
  });

  return byAccount?.id || null;
}
