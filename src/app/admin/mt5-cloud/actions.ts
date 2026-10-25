"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import {
    disconnectBridgeAccountById,
    ensureAccountConnectedOnBridge,
    getBridgeAdminSnapshot,
} from "@/lib/mt5-bridge/client.server";
import type {
    BridgeActivityItem,
    BridgeArmedRule,
    BridgeHealth,
} from "@/lib/mt5-bridge/types";

export interface AdminMt5CloudRow {
    accountId: string | null;
    login: number;
    accountNumber: string;
    server: string;
    broker: string;
    isDemo: boolean;
    connected: boolean;
    status: string;
    latencyMs: number;
    datacenter: string;
    balance: number;
    equity: number;
    floatingPnl: number;
    floatingPnlPercent: number;
    marginLevel: number;
    freeMargin: number;
    openPositionsCount: number;
    totalLots: number;
    armedRulesCount: number;
    armedRules: BridgeArmedRule[];
    recentActivity: BridgeActivityItem[];
    userId: string | null;
    userName: string;
    userEmail: string;
    isUnderIb: boolean;
    accessExpiresAt: string | null;
    lastQuoteUtc: string | null;
    errorMessage: string | null;
}

export interface AdminMt5CloudOverview {
    health: BridgeHealth;
    rows: AdminMt5CloudRow[];
}

async function requireAdmin() {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");
    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });
    if (profile?.role !== "ADMIN") {
        throw new Error("Admin access required");
    }
    return user;
}

export async function getAdminMt5CloudMonitorData(): Promise<AdminMt5CloudOverview> {
    await requireAdmin();

    const [{ health, connections }, dbAccounts] = await Promise.all([
        getBridgeAdminSnapshot(),
        prisma.tradingAccount.findMany({
            where: {
                OR: [
                    { syncSource: "MT5_CLOUD" },
                    { credential: { isNot: null } },
                ],
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                proEntitlement: { select: { status: true, expiresAt: true } },
                commands: {
                    where: { source: "MOBILE_CLOUD" },
                    orderBy: { createdAt: "desc" },
                    take: 15,
                },
            },
            orderBy: { updatedAt: "desc" },
        }),
    ]);

    const rowByLogin = new Map<number, AdminMt5CloudRow>();

    // 1. Seed from live C# Bridge connections in RAM
    for (const conn of connections) {
        rowByLogin.set(conn.login, {
            accountId: conn.accountId || null,
            login: conn.login,
            accountNumber: String(conn.login),
            server: conn.server,
            broker: conn.companyName || conn.server,
            isDemo: conn.isDemo,
            connected: conn.connected,
            status: conn.status,
            latencyMs: conn.latencyMs,
            datacenter: conn.datacenter,
            balance: conn.balance,
            equity: conn.equity,
            floatingPnl: conn.floatingPnl,
            floatingPnlPercent: conn.floatingPnlPercent,
            marginLevel: conn.marginLevel,
            freeMargin: conn.freeMargin,
            openPositionsCount: conn.openPositionsCount,
            totalLots: conn.totalLots,
            armedRulesCount: conn.armedRulesCount,
            armedRules: conn.armedRules || [],
            recentActivity: conn.recentActivity || [],
            userId: conn.userId || null,
            userName: conn.userName || conn.accountName || `Trader #${conn.login}`,
            userEmail: conn.userEmail || "",
            isUnderIb: conn.isUnderIb,
            accessExpiresAt: conn.accessExpiresAt || null,
            lastQuoteUtc: conn.lastQuoteUtc || null,
            errorMessage: conn.errorMessage || null,
        });
    }

    // 2. Enrich with DB TradingAccount records
    for (const acc of dbAccounts) {
        const loginNum = Number(acc.accountNumber?.trim() || 0);
        if (!Number.isFinite(loginNum) || loginNum <= 0) continue;

        const isUnderIb =
            acc.ibAttribution === "VERIFIED" ||
            acc.ibAttribution === "CONFIRMED" ||
            acc.proEntitlement?.status === "ACTIVE";
        const defaultExpiry = new Date(
            acc.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000
        ).toISOString();
        const expiresAt =
            acc.proEntitlement?.expiresAt?.toISOString() || defaultExpiry;

        const dbActivities: BridgeActivityItem[] = acc.commands.map((cmd) => {
            const resObj = (cmd.result as Record<string, unknown>) || {};
            return {
                id: cmd.id,
                action: cmd.type,
                title: cmd.type,
                detail:
                    typeof resObj.message === "string"
                        ? resObj.message
                        : cmd.status,
                source: "MOBILE",
                status: cmd.status === "COMPLETED" ? "DONE" : "ERROR",
                timestamp: cmd.createdAt.toISOString(),
            };
        });

        const existing = rowByLogin.get(loginNum);
        if (existing) {
            existing.accountId = acc.id;
            existing.broker = acc.broker || existing.broker;
            existing.userId = acc.user.id;
            existing.userName = acc.user.name || existing.userName;
            existing.userEmail = acc.user.email || existing.userEmail;
            existing.isUnderIb = isUnderIb;
            existing.accessExpiresAt = expiresAt;
            if (existing.recentActivity.length === 0) {
                existing.recentActivity = dbActivities;
            }
        } else {
            rowByLogin.set(loginNum, {
                accountId: acc.id,
                login: loginNum,
                accountNumber: acc.accountNumber || String(loginNum),
                server: acc.server || "Unknown Server",
                broker: acc.broker || "MT5 Broker",
                isDemo:
                    acc.accountType === "DEMO" ||
                    (acc.server || "").toLowerCase().includes("demo"),
                connected: false,
                status: "DISCONNECTED",
                latencyMs: 0,
                datacenter: "London",
                balance: acc.balance || 0,
                equity: acc.equity ?? acc.balance ?? 0,
                floatingPnl: (acc.equity ?? acc.balance ?? 0) - (acc.balance || 0),
                floatingPnlPercent: 0,
                marginLevel: 0,
                freeMargin: acc.equity ?? acc.balance ?? 0,
                openPositionsCount: 0,
                totalLots: 0,
                armedRulesCount: 0,
                armedRules: [],
                recentActivity: dbActivities,
                userId: acc.user.id,
                userName: acc.user.name || `Trader #${loginNum}`,
                userEmail: acc.user.email || "",
                isUnderIb,
                accessExpiresAt: expiresAt,
                lastQuoteUtc: acc.lastHeartbeat?.toISOString() || null,
                errorMessage: null,
            });
        }
    }

    const rows = Array.from(rowByLogin.values());
    return {
        health: {
            ...health,
            totalAccounts: Math.max(health.totalAccounts, rows.length),
        },
        rows,
    };
}

export async function adminReconnectMt5Account(accountId: string) {
    await requireAdmin();
    const res = await ensureAccountConnectedOnBridge(accountId);
    revalidatePath("/admin/mt5-cloud");
    return res;
}

export async function adminDisconnectMt5Account(
    accountId: string | null,
    login?: number
) {
    await requireAdmin();
    if (accountId) {
        await disconnectBridgeAccountById(accountId, false);
    } else if (login) {
        const baseUrl = (
            process.env.MT5_BRIDGE_URL || "http://127.0.0.1:5055"
        ).replace(/\/$/, "");
        await fetch(`${baseUrl}/disconnect`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ login }),
        }).catch(() => {});
    }
    revalidatePath("/admin/mt5-cloud");
    return { success: true };
}

export async function adminToggleUnderIbAndExtend(
    accountId: string,
    extendDays = 30
) {
    const admin = await requireAdmin();
    const acc = await prisma.tradingAccount.findUnique({
        where: { id: accountId },
        include: { proEntitlement: true },
    });
    if (!acc) {
        return { success: false, error: "Trading account not found." };
    }

    const currentlyIb =
        acc.ibAttribution === "VERIFIED" || acc.ibAttribution === "CONFIRMED";
    const nextIb = currentlyIb ? "UNKNOWN" : "VERIFIED";

    await prisma.tradingAccount.update({
        where: { id: acc.id },
        data: {
            ibAttribution: nextIb,
            ibAttributionSource: "MANUAL_ADMIN",
            ibAttributionAt: new Date(),
            ibAttributionBy: admin.id,
        },
    });

    const baseDate =
        acc.proEntitlement?.expiresAt &&
        acc.proEntitlement.expiresAt.getTime() > Date.now()
            ? acc.proEntitlement.expiresAt
            : new Date();
    const nextExpiry = new Date(
        baseDate.getTime() + extendDays * 24 * 60 * 60 * 1000
    );

    await prisma.proEntitlement.upsert({
        where: { tradingAccountId: acc.id },
        create: {
            userId: acc.userId,
            tradingAccountId: acc.id,
            accountNumber: acc.accountNumber,
            broker: acc.broker,
            status: "ACTIVE",
            source: "IB_VERIFIED",
            startsAt: new Date(),
            expiresAt: nextExpiry,
            reviewedBy: admin.id,
            lastReviewedAt: new Date(),
        },
        update: {
            status: "ACTIVE",
            expiresAt: nextExpiry,
            reviewedBy: admin.id,
            lastReviewedAt: new Date(),
        },
    });

    revalidatePath("/admin/mt5-cloud");
    return {
        success: true,
        isUnderIb: nextIb === "VERIFIED",
        expiresAt: nextExpiry.toISOString(),
    };
}
