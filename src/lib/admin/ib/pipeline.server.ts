import { prisma } from "@/lib/prisma";
import { LifecycleStage, IbPipelineItem } from "./ib-monitor.types";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

export function accountFreshness(
    account: {
        lastHeartbeat?: Date | string | null;
        lastSync?: Date | string | null;
    } | null | undefined,
    now: Date
): "CONNECTED" | "STALE" | "DISCONNECTED" {
    if (!account) return "DISCONNECTED";
    const signal = [account.lastHeartbeat, account.lastSync]
        .filter((value): value is Date | string => Boolean(value))
        .map((value) => new Date(value).getTime())
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => b - a)[0];
    if (!signal) return "DISCONNECTED";
    const age = now.getTime() - signal;
    if (age <= DAY_MS) return "CONNECTED";
    if (age <= WEEK_MS) return "STALE";
    return "DISCONNECTED";
}

export function resolveLifecycleStage(params: {
    hasUser: boolean;
    hasProfile: boolean;
    hasTradingAccount: boolean;
    totalTrades: number;
    hasFirstSync?: boolean;
    hasVipRequest: boolean;
    vipStatus: string;
    hasProductAccess: boolean;
    hasProductUsage: boolean;
    isStale: boolean;
}): LifecycleStage {
    const {
        hasUser,
        hasProfile,
        hasTradingAccount,
        totalTrades,
        hasFirstSync = false,
        hasVipRequest,
        vipStatus,
        hasProductAccess,
        hasProductUsage,
        isStale,
    } = params;

    if (isStale && vipStatus === "ACTIVE") return "AT_RISK";
    if (hasProductUsage) return "TOOL_ACTIVE";
    if (hasProductAccess) return "TOOL_UNLOCKED";
    if (hasVipRequest && vipStatus === "APPROVED") return "VIP_APPROVED";
    if (hasVipRequest && vipStatus === "PENDING") return "VIP_REQUESTED";
    if (totalTrades > 0) return "FIRST_TRADE";
    if (hasFirstSync) return "FIRST_SYNC";
    if (hasTradingAccount && totalTrades === 0) return "ACCOUNT_CONNECTED";
    if (hasProfile) return "VERIFIED";
    if (hasUser) return "SIGNED_UP";
    return "LEAD";
}

export interface PipelineQueryFilters {
    status?: string;
    stage?: string;
    product?: string;
    broker?: string;
    accountHealth?: string;
    capitalBand?: string;
    minAgeHours?: number;
    maxAgeHours?: number;
    search?: string;
    page?: number;
    pageSize?: number;
}

export async function getPipelineQueue(
    filters: PipelineQueryFilters = {}
): Promise<{ items: IbPipelineItem[]; total: number }> {
    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.min(100, Math.max(10, filters.pageSize || 25));
    const skip = (page - 1) * pageSize;

    const whereClause: any = {};

    if (filters.status && filters.status !== "ALL") {
        whereClause.status = filters.status;
    }

    if (filters.broker && filters.broker !== "ALL") {
        whereClause.broker = {
            equals: filters.broker,
            mode: "insensitive",
        };
    }

    if (filters.search && filters.search.trim()) {
        const q = filters.search.trim();
        whereClause.OR = [
            { email: { contains: q, mode: "insensitive" } },
            { fullName: { contains: q, mode: "insensitive" } },
            { telegramId: { contains: q, mode: "insensitive" } },
            { accountNumber: { contains: q, mode: "insensitive" } },
            { broker: { contains: q, mode: "insensitive" } },
        ];
    }

    const [requests, total] = await Promise.all([
        prisma.vipRequest.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profile: { select: { country: true } },
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
                        totalTrades: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: pageSize,
        }),
        prisma.vipRequest.count({ where: whereClause }),
    ]);

    const now = Date.now();

    const items: IbPipelineItem[] = requests.map((req) => {
        const createdAtTime = new Date(req.createdAt).getTime();
        const requestAgeHours = Math.round((now - createdAtTime) / (1000 * 60 * 60));

        const linkedAcc = req.tradingAccount;
        const liveBalance = linkedAcc ? linkedAcc.balance : null;
        const liveEquity = linkedAcc ? linkedAcc.equity : null;
        const liveCurrency = linkedAcc ? linkedAcc.currency : null;

        const isStale = linkedAcc?.lastHeartbeat
            ? now - new Date(linkedAcc.lastHeartbeat).getTime() > 24 * 60 * 60 * 1000
            : true;

        const stage = resolveLifecycleStage({
            hasUser: !!req.user,
            hasProfile: !!req.user?.profile,
            hasTradingAccount: !!linkedAcc,
            totalTrades: linkedAcc?.totalTrades || 0,
            hasVipRequest: true,
            vipStatus: req.status,
            hasProductAccess: req.status === "APPROVED",
            hasProductUsage: false,
            isStale,
        });

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
            liveBalance,
            liveEquity,
            liveCurrency,
            requestedProductSlug: "goldscalperninja",
            vipStatus: req.status as any,
            lifecycleStage: stage,
            accountHealth: linkedAcc ? linkedAcc.status : "NOT_LINKED",
            lastHeartbeatAt: linkedAcc?.lastHeartbeat?.toISOString() || null,
            requestAgeHours,
            createdAt: req.createdAt.toISOString(),
            graceExpiresAt: null,
            adminNote: req.adminNote || null,
            screenshotUrl: req.screenshotUrl || null,
        };
    });

    return { items, total };
}
