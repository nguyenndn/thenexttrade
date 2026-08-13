import { prisma } from "@/lib/prisma";
import { resolveProductSummariesForUsers } from "./product-usage.server";
import { IbPipelineItem } from "./ib-monitor.types";
import { accountFreshness, resolveLifecycleStage, PipelineQueryFilters } from "./pipeline.server";

function matchesCapitalBand(value: number | null, band?: string) {
    if (!band || band === "ALL") return true;
    const amount = value ?? 0;
    if (band === "0_1K") return amount >= 0 && amount < 1000;
    if (band === "1K_10K") return amount >= 1000 && amount < 10000;
    if (band === "10K_50K") return amount >= 10000 && amount < 50000;
    if (band === "50K_PLUS") return amount >= 50000;
    return true;
}

function productEvidence(summary: any) {
    const hasAccess = summary.accessState === "GRANTED";
    const hasUsage = ["ACTIVE", "RECENTLY_USED"].includes(summary.usageState);
    const hasEvidence = hasAccess || ["DOWNLOADED", "RECENTLY_USED", "ACTIVE"].includes(summary.usageState);
    return { hasAccess, hasUsage, hasEvidence };
}

function matchesSearch(item: IbPipelineItem, query: string | undefined) {
    if (!query?.trim()) return true;
    const value = query.trim().toLowerCase();
    return [
        item.userName,
        item.userEmail,
        item.telegramId,
        item.rawAccountNumber,
        item.broker,
    ].some((field) => field?.toLowerCase().includes(value));
}

export async function getPipelineQueueV2(
    filters: PipelineQueryFilters = {}
): Promise<{ items: IbPipelineItem[]; total: number }> {
    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.min(100, Math.max(10, filters.pageSize || 25));

    const where: any = {};
    if (filters.status && filters.status !== "ALL") where.status = filters.status;
    if (filters.broker && filters.broker !== "ALL") {
        where.broker = { equals: filters.broker, mode: "insensitive" };
    }

    const requests = await prisma.vipRequest.findMany({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profile: { select: { country: true } },
                    proEntitlements: {
                        select: { status: true, expiresAt: true },
                    },
                },
            },
            tradingAccount: {
                select: {
                    id: true,
                    balance: true,
                    equity: true,
                    currency: true,
                    status: true,
                    lastHeartbeat: true,
                    lastSync: true,
                    syncSource: true,
                    totalTrades: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const productMap = await resolveProductSummariesForUsers(
        requests.map((request) => ({
            userId: request.userId,
            hasActiveProEntitlement: request.user?.proEntitlements?.some(
                (entitlement) =>
                    entitlement.status === "ACTIVE" &&
                    (!entitlement.expiresAt || entitlement.expiresAt > now)
            ) || false,
        }))
    );

    const derived = requests.map((req): IbPipelineItem => {
        const linkedAccount = req.tradingAccount;
        const accountHealth = accountFreshness(linkedAccount, now);
        const products = productMap.get(req.userId) || [];
        const evidence = products.map(productEvidence);
        const hasProductAccess = evidence.some((item) => item.hasAccess);
        const hasProductUsage = evidence.some((item) => item.hasUsage);
        const hasFirstSync = !!linkedAccount?.lastSync;
        const lifecycleStage = resolveLifecycleStage({
            hasUser: !!req.user,
            hasProfile: !!req.user?.profile,
            hasTradingAccount: !!linkedAccount,
            totalTrades: linkedAccount?.totalTrades || 0,
            hasFirstSync,
            hasVipRequest: true,
            vipStatus: req.status,
            hasProductAccess,
            hasProductUsage,
            isStale: accountHealth === "STALE" || accountHealth === "DISCONNECTED",
        });
        const requestedProductSlug = products.find((product) =>
            productEvidence(product).hasEvidence
        )?.productSlug || null;

        return {
            requestId: req.id,
            userId: req.userId,
            userName: req.user?.name || req.fullName || "Trader",
            userEmail: req.user?.email || req.email,
            country: req.user?.profile?.country || req.country || null,
            telegramId: req.telegramId,
            broker: req.broker,
            accountNumber: req.accountNumber || "N/A",
            rawAccountNumber: req.accountNumber,
            submittedBalance: req.balance,
            linkedAccountId: req.tradingAccountId,
            liveBalance: linkedAccount?.balance ?? null,
            liveEquity: linkedAccount?.equity ?? null,
            liveCurrency: linkedAccount?.currency ?? null,
            requestedProductSlug,
            vipStatus: req.status as IbPipelineItem["vipStatus"],
            lifecycleStage,
            accountHealth,
            lastHeartbeatAt: [
                linkedAccount?.lastHeartbeat,
                linkedAccount?.lastSync,
            ]
                .filter(Boolean)
                .map((value) => new Date(value as Date).getTime())
                .sort((a, b) => b - a)[0]
                ? new Date(
                      Math.max(
                          ...[
                              linkedAccount?.lastHeartbeat,
                              linkedAccount?.lastSync,
                          ]
                              .filter(Boolean)
                              .map((value) => new Date(value as Date).getTime())
                      )
                  ).toISOString()
                : null,
            requestAgeHours: Math.max(
                0,
                Math.round((now.getTime() - req.createdAt.getTime()) / (60 * 60 * 1000))
            ),
            createdAt: req.createdAt.toISOString(),
            graceExpiresAt: null,
            adminNote: req.adminNote || null,
            screenshotUrl: req.screenshotUrl || null,
        };
    });

    const filtered = derived.filter((item) => {
        if (!matchesSearch(item, filters.search)) return false;
        if (filters.stage && filters.stage !== "ALL" && item.lifecycleStage !== filters.stage) return false;
        if (filters.product && filters.product !== "ALL") {
            const productEvidenceMatches = (productMap.get(item.userId) || []).some(
                (product) => product.productSlug === filters.product && productEvidence(product).hasEvidence
            );
            if (!productEvidenceMatches) return false;
        }
        if (filters.accountHealth && filters.accountHealth !== "ALL" && item.accountHealth !== filters.accountHealth) {
            return false;
        }
        if (!matchesCapitalBand(item.liveBalance, filters.capitalBand)) return false;
        if (filters.minAgeHours !== undefined && item.requestAgeHours < filters.minAgeHours) return false;
        if (filters.maxAgeHours !== undefined && item.requestAgeHours > filters.maxAgeHours) return false;
        return true;
    });

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    return { items: filtered.slice(start, start + pageSize), total };
}
