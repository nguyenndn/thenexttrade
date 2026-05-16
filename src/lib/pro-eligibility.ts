// Pro Eligibility Service — centralized source of truth for Partner Pro eligibility
// Used by Account Hub, AccountCard, and admin tools.

import { prisma } from "@/lib/prisma";

// ============================================================================
// TYPES
// ============================================================================

export type ProEligibilityStatus =
  | "PRO_ACTIVE"
  | "PENDING_REVIEW"
  | "REJECTED"
  | "ELIGIBLE"
  | "UNSUPPORTED_BROKER"
  | "MISSING_ACCOUNT_INFO";

export type ProEligibilityResult = {
  status: ProEligibilityStatus;
  label: string;
  description: string;
  brokerSupported: boolean;
  canRequest: boolean;
  rejectReason?: string | null;
  vipRequestId?: string | null;
  proEntitlementId?: string | null;
};

// ============================================================================
// STATUS LABELS
// ============================================================================

const STATUS_CONFIG: Record<
  ProEligibilityStatus,
  { label: string; description: string }
> = {
  PRO_ACTIVE: {
    label: "Pro Active",
    description: "This account has active Partner Pro access.",
  },
  PENDING_REVIEW: {
    label: "Under Review",
    description:
      "Your Pro request is being reviewed. This usually takes a few hours.",
  },
  REJECTED: {
    label: "Not Approved",
    description:
      "Your Pro request was not approved. Check the reason below and contact support if needed.",
  },
  ELIGIBLE: {
    label: "Eligible to Request",
    description:
      "This account is with a supported broker. You can request Partner Pro.",
  },
  UNSUPPORTED_BROKER: {
    label: "Broker Not Supported",
    description:
      "This broker is not currently supported for Partner Pro (Supported: Vantage, Exness, VTMarkets, Ultima Markets). Free account tracking and sync remain available.",
  },
  MISSING_ACCOUNT_INFO: {
    label: "Missing Account Info",
    description:
      "Add your broker name and account number to check eligibility.",
  },
};

// ============================================================================
// BROKER NORMALIZATION
// ============================================================================



function normalizeBrokerKey(value: string | null | undefined): string {
  if (!value) return "";
  const cleaned = value.toUpperCase().replace(/[\s\-_]/g, "");
  if (["VANTAGE", "VANTAGEMARKETS", "VANTAGEFX"].includes(cleaned)) return "VANTAGE";
  if (["EXNESS", "EXNESSGLOBAL"].includes(cleaned)) return "EXNESS";
  if (["VTMARKETS", "VT", "VTGLOBAL"].includes(cleaned)) return "VTMARKETS";
  if (["ICMARKETS", "IC", "ICMARKETSEU", "ICMARKETSGLOBAL"].includes(cleaned)) return "ICMARKETS";
  if (["XM", "XMGLOBAL", "XMTRADING"].includes(cleaned)) return "XM";
  if (["ULTIMAMARKETS", "ULTIMA"].includes(cleaned)) return "ULTIMAMARKETS";
  return cleaned;
}

// ============================================================================
// ELIGIBILITY CHECK — single account
// ============================================================================

export async function getAccountProEligibility(
  accountId: string,
  userId: string
): Promise<ProEligibilityResult> {
  const account = await prisma.tradingAccount.findFirst({
    where: { id: accountId, userId },
    select: {
      id: true,
      broker: true,
      accountNumber: true,
      proEntitlement: {
        select: { id: true, status: true },
      },
      vipRequests: {
        select: { id: true, status: true, rejectReason: true },
        orderBy: { createdAt: "desc" as const },
        take: 1,
      },
    },
  });

  if (!account) {
    return buildResult("MISSING_ACCOUNT_INFO", false);
  }

  // 1. Active ProEntitlement
  if (
    account.proEntitlement &&
    (account.proEntitlement.status === "ACTIVE" ||
      account.proEntitlement.status === "GRACE")
  ) {
    return buildResult("PRO_ACTIVE", true, {
      proEntitlementId: account.proEntitlement.id,
    });
  }

  // 2. Pending VipRequest
  const latestVip = account.vipRequests?.[0];
  if (latestVip?.status === "PENDING") {
    return buildResult("PENDING_REVIEW", false, {
      vipRequestId: latestVip.id,
    });
  }

  // 3. Rejected VipRequest
  if (latestVip?.status === "REJECTED") {
    return buildResult("REJECTED", false, {
      vipRequestId: latestVip.id,
      rejectReason: latestVip.rejectReason || null,
    });
  }

  // 4. Missing broker or account number
  if (!account.broker || !account.accountNumber) {
    return buildResult("MISSING_ACCOUNT_INFO", false);
  }

  // 5. Check broker eligibility via EABroker table
  const accountBrokerKey = normalizeBrokerKey(account.broker);

  const activeBrokers = await prisma.eABroker.findMany({
    where: { isActive: true },
    select: { name: true, slug: true, isVipEligible: true },
  });

  const matchedBroker = activeBrokers.find((broker) => {
    const keys = [
      normalizeBrokerKey(broker.name),
      normalizeBrokerKey(broker.slug),
    ];
    return keys.includes(accountBrokerKey);
  });

  if (matchedBroker?.isVipEligible) {
    return buildResult("ELIGIBLE", true);
  }

  // 6. Unsupported broker
  return buildResult("UNSUPPORTED_BROKER", false);
}

// ============================================================================
// BATCH ELIGIBILITY — all accounts for a user
// ============================================================================

export async function getAccountsProEligibility(
  userId: string
): Promise<Record<string, ProEligibilityResult>> {
  const accounts = await prisma.tradingAccount.findMany({
    where: { userId },
    select: { id: true },
  });

  const results: Record<string, ProEligibilityResult> = {};

  // Process in parallel for performance
  await Promise.all(
    accounts.map(async (acc) => {
      results[acc.id] = await getAccountProEligibility(acc.id, userId);
    })
  );

  return results;
}

// ============================================================================
// HELPER
// ============================================================================

function buildResult(
  status: ProEligibilityStatus,
  brokerSupported: boolean,
  extra?: {
    rejectReason?: string | null;
    vipRequestId?: string | null;
    proEntitlementId?: string | null;
  }
): ProEligibilityResult {
  const config = STATUS_CONFIG[status];
  return {
    status,
    label: config.label,
    description: config.description,
    brokerSupported,
    canRequest: status === "ELIGIBLE" || status === "REJECTED",
    rejectReason: extra?.rejectReason ?? null,
    vipRequestId: extra?.vipRequestId ?? null,
    proEntitlementId: extra?.proEntitlementId ?? null,
  };
}
