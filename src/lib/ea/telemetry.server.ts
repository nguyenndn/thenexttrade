import { prisma } from "@/lib/prisma";
import { captureCapitalSnapshot } from "@/lib/admin/ib/capital.server";
import {
    isDemoTradingAccount,
    isLiveTradingAccount,
} from "@/lib/trading-account-classification";

export interface EaTelemetryInput {
    userId: string;
    tradingAccountId: string;
    accountNumber: string;
    eventType: "HEARTBEAT" | "SYNC";
    productSlug?: string | null;
    eaName?: string | null;
    eaVersion?: string | null;
    balance?: number;
    equity?: number;
    currency?: string | null;
    broker?: string | null;
    server?: string | null;
    platform?: string | null;
    accountType?: string | null;
    syncSource?: string | null;
}

const HEARTBEAT_EVENT_DEDUP_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Normalizes productSlug / eaName / eaVersion into a canonical product slug
 * if recognizable ("goldscalperninja" | "trade-manager" | "gsn-phoenix-grid").
 */
export function resolveCanonicalProductSlug(input: {
    productSlug?: string | null;
    eaName?: string | null;
    eaVersion?: string | null;
}): string | null {
    const rawSlug = (input.productSlug || "").trim().toLowerCase();
    if (rawSlug) {
        if (
            rawSlug === "trade-manager" ||
            rawSlug === "trademanager" ||
            rawSlug.includes("trade-manager") ||
            rawSlug.includes("trademanager")
        ) {
            return "trade-manager";
        }
        if (
            rawSlug === "goldscalperninja" ||
            rawSlug.includes("goldscalper") ||
            rawSlug.includes("arum") ||
            rawSlug.includes("oneshot") ||
            rawSlug.includes("waverider") ||
            rawSlug === "gsn"
        ) {
            return "goldscalperninja";
        }
        if (
            rawSlug === "gsn-phoenix-grid" ||
            rawSlug.includes("phoenix") ||
            rawSlug.includes("sentinel") ||
            rawSlug.includes("apex-gold") ||
            rawSlug.includes("shadow-matrix") ||
            rawSlug.includes("shadown-matrix") ||
            rawSlug.includes("dual-grid")
        ) {
            return "gsn-phoenix-grid";
        }
        return rawSlug;
    }

    const combined = `${input.eaName || ""} ${input.eaVersion || ""}`
        .trim()
        .toLowerCase();
    if (!combined) return null;

    if (
        combined.includes("trade manager") ||
        combined.includes("trademanager") ||
        combined.includes("trade-manager")
    ) {
        return "trade-manager";
    }
    if (
        combined.includes("goldscalper") ||
        combined.includes("gold scalper") ||
        combined.includes("arum") ||
        combined.includes("oneshot") ||
        combined.includes("waverider") ||
        combined.includes("ninja")
    ) {
        return "goldscalperninja";
    }
    if (
        combined.includes("shadow matrix") ||
        combined.includes("shadown matrix") ||
        combined.includes("dual grid") ||
        combined.includes("phoenix") ||
        combined.includes("sentinel") ||
        combined.includes("apex gold")
    ) {
        return "gsn-phoenix-grid";
    }

    return null;
}

/**
 * Records EA capital snapshot, product access (account-linked), and usage event.
 * Non-blocking: errors are caught and logged so EA heartbeat/sync responses never fail.
 */
export async function recordEaProductTelemetry(
    input: EaTelemetryInput
): Promise<void> {
    const now = new Date();
    let storedIdentity: {
        broker: string | null;
        server: string | null;
        accountType: string | null;
        status: string | null;
    } | null = null;

    try {
        if (typeof prisma?.tradingAccount?.findUnique === "function") {
            storedIdentity = await prisma.tradingAccount.findUnique({
                where: { id: input.tradingAccountId },
                select: {
                    broker: true,
                    server: true,
                    accountType: true,
                    status: true,
                },
            });
        }
    } catch (err) {
        console.error("Failed to load trading account for telemetry:", err);
    }

    const trustedIdentity = storedIdentity ?? {
        broker: input.broker ?? null,
        server: input.server ?? null,
        accountType: input.accountType ?? null,
        status: null,
    };
    const payloadIsNonLive = isDemoTradingAccount({
        broker: input.broker ?? null,
        server: input.server ?? null,
        accountType: input.accountType ?? null,
    });

    // 1. Capture capital snapshot if balance is provided and valid.
    // Demo/contest/evaluation/trial and inactive accounts must never pollute
    // capital snapshots, even though their telemetry is still recorded.
    if (
        input.balance !== undefined &&
        Number.isFinite(input.balance) &&
        (!storedIdentity || isLiveTradingAccount(storedIdentity)) &&
        !payloadIsNonLive &&
        typeof prisma?.tradingAccountCapitalSnapshot?.create === "function"
    ) {
        await captureCapitalSnapshot({
            tradingAccountId: input.tradingAccountId,
            balance: input.balance,
            equity:
                input.equity !== undefined && Number.isFinite(input.equity)
                    ? input.equity
                    : null,
            currency: input.currency || "USD",
            source:
                input.eventType === "HEARTBEAT" ? "EA_HEARTBEAT" : "EA_SYNC",
        });
    }

    // 2. Resolve EAProduct
    try {
        if (typeof prisma?.eAProduct?.findFirst !== "function") {
            return;
        }

        const canonicalSlug = resolveCanonicalProductSlug({
            productSlug: input.productSlug,
            eaName: input.eaName,
            eaVersion: input.eaVersion,
        });

        let product: { id: string; slug: string; name: string } | null = null;

        if (canonicalSlug) {
            product = await prisma.eAProduct.findFirst({
                where: {
                    OR: [
                        { slug: { equals: canonicalSlug, mode: "insensitive" } },
                        { id: canonicalSlug },
                        ...(input.eaName
                            ? [
                                  {
                                      name: {
                                          contains: input.eaName.trim(),
                                          mode: "insensitive" as const,
                                      },
                                  },
                              ]
                            : []),
                    ],
                },
                select: { id: true, slug: true, name: true },
            });
        } else if (input.eaName) {
            product = await prisma.eAProduct.findFirst({
                where: {
                    name: {
                        contains: input.eaName.trim(),
                        mode: "insensitive",
                    },
                },
                select: { id: true, slug: true, name: true },
            });
        }

        // Fallback for legacy EAs that don't send productSlug/eaName yet:
        // If user already has an EAProductAccess linked to this tradingAccountId (or only 1 access record), update it.
        if (!product && typeof prisma?.eAProductAccess?.findMany === "function") {
            const existingAccesses =
                (await prisma.eAProductAccess.findMany({
                    where: {
                        userId: input.userId,
                        status: "GRANTED",
                    },
                    select: {
                        id: true,
                        productId: true,
                        tradingAccountId: true,
                    },
                    orderBy: { updatedAt: "desc" },
                    take: 5,
                })) || [];

            if (Array.isArray(existingAccesses) && existingAccesses.length > 0) {
                const matchedAccountAccess = existingAccesses.find(
                    (a) => a.tradingAccountId === input.tradingAccountId
                );
                const fallbackAccess =
                    matchedAccountAccess ||
                    (existingAccesses.length === 1 ? existingAccesses[0] : null);

                if (fallbackAccess) {
                    product = await prisma.eAProduct.findFirst({
                        where: { id: fallbackAccess.productId },
                        select: { id: true, slug: true, name: true },
                    });
                }
            }
        }

        if (!product) {
            return;
        }

        const accountScopeKey = `${input.userId}:${product.id}:ACCOUNT:${input.tradingAccountId}`;
        const userScopeKey = `${input.userId}:${product.id}:USER`;

        // 3. Telemetry may update existing access, but must never create or
        // reactivate EAProductAccess. Grants belong to trusted approval flows.
        if (
            typeof prisma?.eAProductAccess?.findFirst === "function" &&
            typeof prisma?.eAProductAccess?.update === "function"
        ) {
            const existingAccess = await prisma.eAProductAccess.findFirst({
                where: {
                    scopeKey: accountScopeKey,
                    userId: input.userId,
                    status: "GRANTED",
                },
                select: { id: true },
            });

            if (existingAccess) {
                await prisma.eAProductAccess.update({
                    where: { id: existingAccess.id },
                    data: {
                        lastUsedAt: now,
                        ...(input.eventType === "HEARTBEAT"
                            ? { lastHeartbeatAt: now }
                            : {}),
                    },
                });
            }
        }

        // Also update user-scoped EAProductAccess if one exists (from download/grant)
        if (typeof prisma?.eAProductAccess?.updateMany === "function") {
            await prisma.eAProductAccess.updateMany({
                where: {
                    scopeKey: userScopeKey,
                    userId: input.userId,
                    productId: product.id,
                    status: "GRANTED",
                },
                data: {
                    lastUsedAt: now,
                    ...(input.eventType === "HEARTBEAT"
                        ? { lastHeartbeatAt: now }
                        : {}),
                },
            });
        }

        // 4. Record EAProductUsageEvent (deduplicated for frequent heartbeats)
        if (typeof prisma?.eAProductUsageEvent?.create === "function") {
            let shouldInsertEvent = true;

            if (
                input.eventType === "HEARTBEAT" &&
                typeof prisma?.eAProductUsageEvent?.findFirst === "function"
            ) {
                const recentThreshold = new Date(
                    now.getTime() - HEARTBEAT_EVENT_DEDUP_MS
                );
                const recentEvent = await prisma.eAProductUsageEvent.findFirst({
                    where: {
                        userId: input.userId,
                        productId: product.id,
                        tradingAccountId: input.tradingAccountId,
                        eventType: "HEARTBEAT",
                        occurredAt: { gte: recentThreshold },
                    },
                    select: { id: true },
                });
                if (recentEvent) {
                    shouldInsertEvent = false;
                }
            }

            if (shouldInsertEvent) {
                await prisma.eAProductUsageEvent.create({
                    data: {
                        userId: input.userId,
                        productId: product.id,
                        tradingAccountId: input.tradingAccountId,
                        eventType: input.eventType,
                        occurredAt: now,
                        productVersion: input.eaVersion
                            ? String(input.eaVersion).slice(0, 30)
                            : null,
                        syncSource:
                            input.syncSource ||
                            (input.eventType === "HEARTBEAT"
                                ? "EA_HEARTBEAT"
                                : "EA_SYNC"),
                        metadata: {
                            accountNumber: input.accountNumber,
                            productSlug: product.slug,
                            eaName: input.eaName || product.name,
                            balance: input.balance ?? null,
                            equity: input.equity ?? null,
                            currency: input.currency ?? null,
                            broker: trustedIdentity.broker,
                            server: trustedIdentity.server,
                            platform: input.platform ?? null,
                            accountType: trustedIdentity.accountType,
                        },
                    },
                });
            }
        }
    } catch (err) {
        console.error("Failed to record EA product telemetry:", err);
    }
}
