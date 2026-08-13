import { prisma } from "@/lib/prisma";
import { CANONICAL_PRODUCTS } from "./ib-monitor.constants";
import {
    ProductUsageSummary,
    ProductAccessState,
    ProductUsageState,
} from "./ib-monitor.types";
import { ToolAccessStatus, ToolAccessSource } from "@prisma/client";

type ProductRecords = {
    accesses: Array<any>;
    downloads: Array<any>;
    usageEvents: Array<any>;
};

export function buildProductSummaries(
    params: ProductRecords & { hasActiveProEntitlement: boolean }
): ProductUsageSummary[] {
    const { accesses, downloads, usageEvents, hasActiveProEntitlement } = params;
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return CANONICAL_PRODUCTS.map((prod) => {
        const sameProduct = (record: any) =>
            record.productId === prod.id ||
            record.productId === prod.slug ||
            record.product?.slug === prod.slug;
        const prodAccess = accesses.find(sameProduct);
        const prodDownloads = downloads.filter(sameProduct);
        const prodEvents = usageEvents.filter(sameProduct);
        const downloadEvents = prodEvents.filter((event) => event.eventType === "DOWNLOAD");
        const activityEvents = prodEvents.filter((event) =>
            ["HEARTBEAT", "SYNC", "SETUP_CONFIRMED"].includes(event.eventType)
        );

        let accessState: ProductAccessState = "NO_ACCESS";
        if (prodAccess) {
            if (prodAccess.status === ToolAccessStatus.GRANTED) {
                accessState =
                    !prodAccess.expiresAt || prodAccess.expiresAt > now
                        ? "GRANTED"
                        : "EXPIRED";
            } else if (prodAccess.status === ToolAccessStatus.EXPIRED) {
                accessState = "EXPIRED";
            } else if (prodAccess.status === ToolAccessStatus.REVOKED) {
                accessState = "REVOKED";
            }
        } else if (hasActiveProEntitlement) {
            accessState = "LEGACY_PRO_FALLBACK";
        }

        const lastDownloadedAt =
            prodAccess?.lastDownloadedAt?.toISOString() ||
            (prodDownloads[0]?.createdAt?.toISOString() ??
                downloadEvents[0]?.occurredAt?.toISOString() ??
                null);
        const lastActivityEvent = activityEvents[0];
        const lastUsedAt =
            prodAccess?.lastUsedAt?.toISOString() ||
            lastActivityEvent?.occurredAt?.toISOString() ||
            null;
        const lastHeartbeatAt =
            prodAccess?.lastHeartbeatAt?.toISOString() ||
            activityEvents.find((event) => event.eventType === "HEARTBEAT")?.occurredAt?.toISOString() ||
            null;

        let usageState: ProductUsageState = "NOT_USED";
        const newestActivityDate = lastUsedAt ? new Date(lastUsedAt) : null;
        if (newestActivityDate) {
            if (newestActivityDate >= twentyFourHoursAgo) {
                usageState = "ACTIVE";
            } else if (newestActivityDate >= sevenDaysAgo) {
                usageState = "RECENTLY_USED";
            } else {
                usageState = "DOWNLOADED";
            }
        } else if (lastDownloadedAt) {
            usageState = "DOWNLOADED";
        } else if (accessState === "LEGACY_PRO_FALLBACK") {
            usageState = "UNKNOWN_LEGACY";
        }

        return {
            productId: prod.id,
            productSlug: prod.slug,
            productName: prod.name,
            accessState,
            usageState,
            lastDownloadedAt,
            lastUsedAt,
            lastHeartbeatAt,
        };
    });
}

export async function resolveProductSummariesForUsers(
    users: Array<{ userId: string; hasActiveProEntitlement: boolean }>
): Promise<Map<string, ProductUsageSummary[]>> {
    const userIds = [...new Set(users.map((user) => user.userId))];
    if (userIds.length === 0) return new Map();

    const [accesses, downloads, usageEvents] = await Promise.all([
        prisma.eAProductAccess.findMany({
            where: { userId: { in: userIds } },
            include: { product: { select: { slug: true } } },
            orderBy: { updatedAt: "desc" },
        }),
        prisma.eADownload.findMany({
            where: { userId: { in: userIds } },
            include: { product: { select: { slug: true } } },
            orderBy: { createdAt: "desc" },
        }),
        prisma.eAProductUsageEvent.findMany({
            where: { userId: { in: userIds } },
            include: { product: { select: { slug: true } } },
            orderBy: { occurredAt: "desc" },
        }),
    ]);

    const accessesByUser = new Map<string, any[]>();
    const downloadsByUser = new Map<string, any[]>();
    const eventsByUser = new Map<string, any[]>();
    for (const record of accesses) {
        const list = accessesByUser.get(record.userId) || [];
        list.push(record);
        accessesByUser.set(record.userId, list);
    }
    for (const record of downloads) {
        const list = downloadsByUser.get(record.userId) || [];
        list.push(record);
        downloadsByUser.set(record.userId, list);
    }
    for (const record of usageEvents) {
        const list = eventsByUser.get(record.userId) || [];
        list.push(record);
        eventsByUser.set(record.userId, list);
    }

    return new Map(
        users.map((user) => [
            user.userId,
            buildProductSummaries({
                accesses: accessesByUser.get(user.userId) || [],
                downloads: downloadsByUser.get(user.userId) || [],
                usageEvents: eventsByUser.get(user.userId) || [],
                hasActiveProEntitlement: user.hasActiveProEntitlement,
            }),
        ])
    );
}

export async function resolveUserProductSummaries(params: {
    userId: string;
    hasActiveProEntitlement: boolean;
}): Promise<ProductUsageSummary[]> {
    const result = await resolveProductSummariesForUsers([
        {
            userId: params.userId,
            hasActiveProEntitlement: params.hasActiveProEntitlement,
        },
    ]);
    return result.get(params.userId) || [];
}

export async function grantUserProductAccess(params: {
    adminUserId: string;
    targetUserId: string;
    productSlug: string;
    tradingAccountId?: string | null;
    source: ToolAccessSource;
    expiresAt?: Date | null;
}): Promise<void> {
    const { adminUserId, targetUserId, productSlug, tradingAccountId, source, expiresAt } =
        params;

    // Resolve the real EAProduct row by slug — productId must be a real FK, never the slug
    // string. Skip gracefully when the product isn't seeded yet so the caller (e.g. the
    // approveVipRequest tx) is never aborted by an FK violation.
    const product = await prisma.eAProduct.findUnique({ where: { slug: productSlug } });
    if (!product) {
        console.warn(
            `[grantUserProductAccess] Skipping grant for unknown EAProduct slug "${productSlug}" (target user ${targetUserId})`
        );
        return;
    }
    const productId = product.id;

    const scopeKey = tradingAccountId
        ? `${targetUserId}:${productId}:ACCOUNT:${tradingAccountId}`
        : `${targetUserId}:${productId}:USER`;

    await prisma.eAProductAccess.upsert({
        where: { scopeKey },
        create: {
            userId: targetUserId,
            productId,
            tradingAccountId: tradingAccountId || null,
            scopeKey,
            status: ToolAccessStatus.GRANTED,
            source,
            expiresAt: expiresAt || null,
        },
        update: {
            status: ToolAccessStatus.GRANTED,
            source,
            expiresAt: expiresAt || null,
        },
    });

    await prisma.auditLog.create({
        data: {
            adminId: adminUserId,
            action: "GRANT_PRODUCT_ACCESS",
            targetType: "USER",
            targetId: targetUserId,
            details: { productSlug, tradingAccountId, source, scopeKey },
        },
    });
}

export async function revokeUserProductAccess(params: {
    adminUserId: string;
    targetUserId: string;
    productSlug: string;
    tradingAccountId?: string | null;
}): Promise<void> {
    const { adminUserId, targetUserId, productSlug, tradingAccountId } = params;

    const product = await prisma.eAProduct.findUnique({ where: { slug: productSlug } });
    if (!product) {
        console.warn(
            `[revokeUserProductAccess] Skipping revoke for unknown EAProduct slug "${productSlug}" (target user ${targetUserId})`
        );
        return;
    }
    const productId = product.id;

    const scopeKey = tradingAccountId
        ? `${targetUserId}:${productId}:ACCOUNT:${tradingAccountId}`
        : `${targetUserId}:${productId}:USER`;

    await prisma.eAProductAccess.updateMany({
        where: { scopeKey },
        data: {
            status: ToolAccessStatus.REVOKED,
        },
    });

    await prisma.auditLog.create({
        data: {
            adminId: adminUserId,
            action: "REVOKE_PRODUCT_ACCESS",
            targetType: "USER",
            targetId: targetUserId,
            details: { productSlug, tradingAccountId, scopeKey },
        },
    });
}
