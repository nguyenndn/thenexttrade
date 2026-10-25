import { prisma } from "@/lib/prisma";
import { encryptPassword, decryptPassword } from "@/lib/crypto";
import { detectBroker } from "@/lib/ea/broker-detection";
import type {
    BridgeAccountState,
    BridgeAdminConnection,
    BridgeExecuteResult,
    BridgeHealth,
    CloudAccountSummary,
} from "./types";

const BRIDGE_BASE_URL = (
    process.env.MT5_BRIDGE_URL || "http://127.0.0.1:5055"
).replace(/\/$/, "");

// Throttle DB heartbeat writes (at most once per 45s per account unless balance changes)
const lastHeartbeatWriteMap = new Map<
    string,
    { updatedAt: number; balance: number }
>();
const HEARTBEAT_WRITE_INTERVAL_MS = 45_000;

// Short-lived in-memory cache (15s) for active account login mapping to avoid redundant SELECTs on every poll
const accountLoginCacheMap = new Map<
    string,
    { login: number; status: string | null; cachedAt: number }
>();
const ACCOUNT_LOGIN_CACHE_TTL_MS = 15_000;

async function bridgeFetch<T>(
    path: string,
    init?: RequestInit,
    timeoutMs = 15000
): Promise<{ ok: boolean; status: number; data: T }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(`${BRIDGE_BASE_URL}${path}`, {
            ...init,
            headers: {
                "Content-Type": "application/json",
                ...(init?.headers || {}),
            },
            cache: "no-store",
            signal: controller.signal,
        });
        const data = (await res.json()) as T;
        return { ok: res.ok, status: res.status, data };
    } finally {
        clearTimeout(timer);
    }
}

export async function connectBridgeAccountForUser(params: {
    userId: string;
    userName?: string | null;
    userEmail?: string | null;
    login: string | number;
    password: string;
    server: string;
}): Promise<{
    success: boolean;
    error?: string;
    account?: CloudAccountSummary;
    state?: BridgeAccountState;
}> {
    const cleanLogin = String(params.login).trim();
    const numericLogin = Number(cleanLogin);
    if (!Number.isFinite(numericLogin) || numericLogin <= 0) {
        return { success: false, error: "Invalid MT5 Login account number." };
    }

    const cleanServer = params.server.trim();
    const cleanPassword = params.password.trim();
    if (!cleanServer || !cleanPassword) {
        return {
            success: false,
            error: "MT5 Login, Password, and Broker Server are required.",
        };
    }

    // Check if user already has this TradingAccount
    let existingAcc = await prisma.tradingAccount.findFirst({
        where: {
            userId: params.userId,
            accountNumber: cleanLogin,
        },
        include: {
            proEntitlement: true,
        },
    });

    const isUnderIb =
        existingAcc?.ibAttribution === "VERIFIED" ||
        existingAcc?.ibAttribution === "CONFIRMED" ||
        existingAcc?.proEntitlement?.status === "ACTIVE";

    const defaultExpiry = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();
    const accessExpiresAt =
        existingAcc?.proEntitlement?.expiresAt?.toISOString() || defaultExpiry;

    // 1. Connect on C# MT5 Direct Bridge
    let connectRes: {
        ok: boolean;
        status: number;
        data: { success?: boolean; state?: BridgeAccountState; error?: string };
    };

    try {
        connectRes = await bridgeFetch<{
            success?: boolean;
            state?: BridgeAccountState;
            error?: string;
        }>(
            "/connect",
            {
                method: "POST",
                body: JSON.stringify({
                    login: numericLogin,
                    password: cleanPassword,
                    server: cleanServer,
                    accountId: existingAcc?.id || null,
                    userId: params.userId,
                    userName: params.userName || null,
                    userEmail: params.userEmail || null,
                    isUnderIb,
                    accessExpiresAt,
                }),
            },
            30000
        );
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Bridge unreachable";
        return {
            success: false,
            error: `MT5 Cloud Bridge service is offline (${BRIDGE_BASE_URL}). Please start mt5-bridge first. (${msg})`,
        };
    }

    if (!connectRes.ok || !connectRes.data?.state) {
        return {
            success: false,
            error:
                connectRes.data?.error ||
                "Failed to connect to MT5 broker server.",
        };
    }

    const state = connectRes.data.state;
    const brokerName =
        detectBroker(cleanServer, state.companyName || "") ||
        state.companyName ||
        cleanServer.split("-")[0] ||
        "MT5 Broker";

    // 2. Encrypt MT5 password with AES-256-GCM
    const encryptedPassword = encryptPassword(cleanPassword);

    // 3. Upsert TradingAccount + TradingAccountCredential
    if (!existingAcc) {
        existingAcc = await prisma.tradingAccount.create({
            data: {
                userId: params.userId,
                name: `${brokerName} ••${cleanLogin.slice(-4)}`,
                broker: brokerName,
                server: cleanServer,
                accountNumber: cleanLogin,
                platform: "MetaTrader 5",
                accountType: state.isDemo ? "DEMO" : "PERSONAL",
                balance: state.balance,
                equity: state.equity,
                currency: state.currency || "USD",
                leverage: `1:${state.leverage || 500}`,
                status: "ACTIVE",
                syncSource: "MT5_CLOUD",
                lastHeartbeat: new Date(),
                lastSync: new Date(),
            },
            include: {
                proEntitlement: true,
            },
        });
    } else {
        existingAcc = await prisma.tradingAccount.update({
            where: { id: existingAcc.id },
            data: {
                broker: brokerName,
                server: cleanServer,
                platform: "MetaTrader 5",
                balance: state.balance,
                equity: state.equity,
                currency: state.currency || "USD",
                status: "ACTIVE",
                syncSource: "MT5_CLOUD",
                lastHeartbeat: new Date(),
                lastSync: new Date(),
            },
            include: {
                proEntitlement: true,
            },
        });
    }

    await prisma.tradingAccountCredential.upsert({
        where: { accountId: existingAcc.id },
        create: {
            accountId: existingAcc.id,
            encryptedPassword,
            keyVersion: "v1",
        },
        update: {
            encryptedPassword,
            keyVersion: "v1",
            updatedAt: new Date(),
        },
    });

    await prisma.eaCommand
        .create({
            data: {
                tradingAccountId: existingAcc.id,
                userId: params.userId,
                type: "CLOUD_CONNECT",
                params: { server: cleanServer, login: cleanLogin },
                status: "COMPLETED",
                startedAt: new Date(),
                completedAt: new Date(),
                source: "MOBILE_CLOUD",
                result: {
                    message: `Connected to ${cleanServer} (${state.latencyMs}ms)`,
                },
            },
        })
        .catch(() => {});

    accountLoginCacheMap.set(existingAcc.id, {
        login: numericLogin,
        status: "ACTIVE",
        cachedAt: Date.now(),
    });

    return {
        success: true,
        state,
        account: {
            id: existingAcc.id,
            name: existingAcc.name,
            accountNumber: cleanLogin,
            broker: existingAcc.broker || brokerName,
            server: cleanServer,
            balance: state.balance,
            equity: state.equity,
            currency: state.currency || "USD",
            status: "ACTIVE",
            isUnderIb,
            accessExpiresAt,
            lastHeartbeat: new Date().toISOString(),
            hasStoredCredential: true,
        },
    };
}

export async function ensureAccountConnectedOnBridge(
    accountId: string,
    queryOpts?: { symbol?: string; timeframe?: number }
): Promise<{
    ok: boolean;
    login?: number;
    state?: BridgeAccountState;
    error?: string;
}> {
    const query = new URLSearchParams();
    if (queryOpts?.symbol) query.set("symbol", queryOpts.symbol);
    if (queryOpts?.timeframe) query.set("timeframe", String(queryOpts.timeframe));
    const qs = query.toString() ? `?${query.toString()}` : "";

    // Fast path: if account login is cached in-memory and active on bridge, skip DB query completely
    const cached = accountLoginCacheMap.get(accountId);
    if (cached && Date.now() - cached.cachedAt < ACCOUNT_LOGIN_CACHE_TTL_MS) {
        if (cached.status === "DISCONNECTED") {
            return {
                ok: false,
                login: cached.login,
                error: "Account is currently disconnected. Click 'Connect MT5' to reconnect.",
            };
        }
        try {
            const fastRes = await bridgeFetch<{
                success?: boolean;
                state?: BridgeAccountState;
                error?: string;
            }>(`/state/${cached.login}${qs}`, undefined, 5000);
            if (fastRes.ok && fastRes.data?.state) {
                return {
                    ok: true,
                    login: cached.login,
                    state: fastRes.data.state,
                };
            }
        } catch {
            return {
                ok: false,
                error: "MT5 Cloud Bridge is currently offline.",
            };
        }
    }

    const acc = await prisma.tradingAccount.findUnique({
        where: { id: accountId },
        include: {
            credential: true,
            user: { select: { name: true, email: true } },
            proEntitlement: true,
        },
    });

    if (!acc || !acc.accountNumber) {
        return { ok: false, error: "Trading account not found." };
    }

    const numericLogin = Number(acc.accountNumber.trim());
    if (!Number.isFinite(numericLogin) || numericLogin <= 0) {
        return { ok: false, error: "Invalid MT5 login number on account." };
    }

    accountLoginCacheMap.set(accountId, {
        login: numericLogin,
        status: acc.status,
        cachedAt: Date.now(),
    });

    // If manually disconnected, do not query or auto-reconnect bridge
    if (acc.status === "DISCONNECTED") {
        return {
            ok: false,
            login: numericLogin,
            error: "Account is currently disconnected. Click 'Connect MT5' to reconnect.",
        };
    }

    // Check if already active on bridge
    try {
        const stateRes = await bridgeFetch<{
            success?: boolean;
            state?: BridgeAccountState;
            error?: string;
            code?: string;
        }>(`/state/${numericLogin}${qs}`, undefined, 5000);
        if (stateRes.ok && stateRes.data?.state) {
            return { ok: true, login: numericLogin, state: stateRes.data.state };
        }
        if (
            stateRes.data?.error &&
            stateRes.data.error.toLowerCase().includes("terminal was closed")
        ) {
            accountLoginCacheMap.set(accountId, {
                login: numericLogin,
                status: "DISCONNECTED",
                cachedAt: Date.now(),
            });
            await prisma.tradingAccount
                .update({
                    where: { id: acc.id },
                    data: { status: "DISCONNECTED" },
                })
                .catch(() => {});
            return {
                ok: false,
                login: numericLogin,
                error: stateRes.data.error,
            };
        }
    } catch {
        return {
            ok: false,
            error: "MT5 Cloud Bridge is currently offline.",
        };
    }

    if (!acc.credential?.encryptedPassword || !acc.server) {
        return {
            ok: false,
            login: numericLogin,
            error: "Account is not connected. Please enter your MT5 password to connect.",
        };
    }

    let plainPassword = "";
    try {
        plainPassword =
            acc.credential.keyVersion === "v1"
                ? decryptPassword(acc.credential.encryptedPassword)
                : acc.credential.encryptedPassword;
    } catch {
        return {
            ok: false,
            login: numericLogin,
            error: "Stored MT5 credential could not be decrypted. Please reconnect.",
        };
    }

    const isUnderIb =
        acc.ibAttribution === "VERIFIED" ||
        acc.ibAttribution === "CONFIRMED" ||
        acc.proEntitlement?.status === "ACTIVE";

    try {
        const reconn = await bridgeFetch<{
            success?: boolean;
            state?: BridgeAccountState;
            error?: string;
        }>(
            "/connect",
            {
                method: "POST",
                body: JSON.stringify({
                    login: numericLogin,
                    password: plainPassword,
                    server: acc.server,
                    accountId: acc.id,
                    userId: acc.userId,
                    userName: acc.user?.name || null,
                    userEmail: acc.user?.email || null,
                    isUnderIb,
                    accessExpiresAt:
                        acc.proEntitlement?.expiresAt?.toISOString() || null,
                }),
            },
            25000
        );

        if (reconn.ok && reconn.data?.state) {
            accountLoginCacheMap.set(accountId, {
                login: numericLogin,
                status: "ACTIVE",
                cachedAt: Date.now(),
            });
            return {
                ok: true,
                login: numericLogin,
                state: reconn.data.state,
            };
        }

        return {
            ok: false,
            login: numericLogin,
            error: reconn.data?.error || "Failed to reconnect account.",
        };
    } catch {
        return {
            ok: false,
            login: numericLogin,
            error: "MT5 Cloud Bridge is offline.",
        };
    }
}

export async function getBridgeStateForAccount(params: {
    accountId: string;
    symbol?: string;
    timeframe?: number;
}): Promise<{
    ok: boolean;
    state?: BridgeAccountState;
    error?: string;
}> {
    const ensured = await ensureAccountConnectedOnBridge(params.accountId, {
        symbol: params.symbol,
        timeframe: params.timeframe,
    });
    if (!ensured.ok || !ensured.login || !ensured.state) {
        return { ok: false, error: ensured.error };
    }

    const st = ensured.state;
    const now = Date.now();
    const lastWrite = lastHeartbeatWriteMap.get(params.accountId);
    const shouldWriteDb =
        !lastWrite ||
        now - lastWrite.updatedAt >= HEARTBEAT_WRITE_INTERVAL_MS ||
        Math.abs(lastWrite.balance - st.balance) >= 0.01;

    if (shouldWriteDb) {
        lastHeartbeatWriteMap.set(params.accountId, {
            updatedAt: now,
            balance: st.balance,
        });
        prisma.tradingAccount
            .update({
                where: { id: params.accountId },
                data: {
                    balance: st.balance,
                    equity: st.equity,
                    ...(st.connected ? { status: "ACTIVE" } : {}),
                    lastHeartbeat: new Date(),
                },
            })
            .catch(() => {});
    }

    return { ok: true, state: st };
}

export async function executeBridgeActionForAccount(params: {
    userId: string;
    accountId: string;
    action: string;
    ticket?: number;
    symbol?: string;
    value?: number;
}): Promise<BridgeExecuteResult> {
    const ensured = await ensureAccountConnectedOnBridge(params.accountId);
    if (!ensured.ok || !ensured.login) {
        throw new Error(ensured.error || "Account is not connected to MT5 Bridge.");
    }

    const res = await bridgeFetch<BridgeExecuteResult & { error?: string }>(
        "/execute",
        {
            method: "POST",
            body: JSON.stringify({
                login: ensured.login,
                action: params.action,
                ticket: params.ticket ?? null,
                symbol: params.symbol ?? null,
                value: params.value ?? null,
            }),
        },
        15000
    );

    if (!res.ok) {
        throw new Error(res.data?.error || "Failed to execute MT5 action.");
    }

    // Persist action in EaCommand history
    await prisma.eaCommand
        .create({
            data: {
                tradingAccountId: params.accountId,
                userId: params.userId,
                type: params.action,
                params: {
                    ticket: params.ticket ?? null,
                    symbol: params.symbol ?? null,
                    value: params.value ?? null,
                },
                status: res.data.success ? "COMPLETED" : "FAILED",
                startedAt: new Date(),
                completedAt: new Date(),
                source: "MOBILE_CLOUD",
                result: {
                    message: res.data.message,
                    movedOrClosed: res.data.movedOrClosed,
                    skipped: res.data.skipped,
                },
            },
        })
        .catch(() => {});

    return res.data;
}

export async function manageBridgeRulesForAccount(params: {
    userId: string;
    accountId: string;
    operation: "ADD" | "REMOVE" | "CLEAR" | "SET_DAILY";
    ruleId?: string;
    type?: string;
    symbol?: string;
    targetPrice?: number;
    percentValue?: number;
    direction?: string;
}): Promise<{ ok: boolean; state?: BridgeAccountState; error?: string }> {
    const ensured = await ensureAccountConnectedOnBridge(params.accountId);
    if (!ensured.ok || !ensured.login) {
        return { ok: false, error: ensured.error || "Account not connected." };
    }

    try {
        const res = await bridgeFetch<{
            success?: boolean;
            state?: BridgeAccountState;
            error?: string;
        }>(
            "/rules",
            {
                method: "POST",
                body: JSON.stringify({
                    login: ensured.login,
                    operation: params.operation,
                    ruleId: params.ruleId ?? null,
                    type: params.type ?? null,
                    symbol: params.symbol ?? null,
                    targetPrice: params.targetPrice ?? null,
                    percentValue: params.percentValue ?? null,
                    direction: params.direction ?? null,
                }),
            },
            10000
        );

        if (!res.ok || !res.data?.state) {
            return {
                ok: false,
                error: res.data?.error || "Failed to update 24/5 rule.",
            };
        }

        return { ok: true, state: res.data.state };
    } catch {
        return { ok: false, error: "MT5 Cloud Bridge is offline." };
    }
}

export async function disconnectBridgeAccountById(
    accountId: string,
    removeCredential = false
): Promise<{ success: boolean }> {
    const acc = await prisma.tradingAccount.findUnique({
        where: { id: accountId },
        select: { id: true, accountNumber: true },
    });

    if (acc?.accountNumber) {
        const num = Number(acc.accountNumber.trim());
        if (Number.isFinite(num) && num > 0) {
            accountLoginCacheMap.set(acc.id, {
                login: num,
                status: "DISCONNECTED",
                cachedAt: Date.now(),
            });
            await bridgeFetch("/disconnect", {
                method: "POST",
                body: JSON.stringify({ login: num }),
            }).catch(() => {});
        }
    }

    if (acc) {
        await prisma.tradingAccount.update({
            where: { id: acc.id },
            data: { status: "DISCONNECTED" },
        });
        if (removeCredential) {
            await prisma.tradingAccountCredential
                .delete({ where: { accountId: acc.id } })
                .catch(() => {});
        }
    }

    return { success: true };
}

export async function getBridgeAdminSnapshot(): Promise<{
    health: BridgeHealth;
    connections: BridgeAdminConnection[];
}> {
    try {
        const res = await bridgeFetch<{
            success?: boolean;
            health: BridgeHealth;
            connections: BridgeAdminConnection[];
        }>("/admin/connections", undefined, 5000);

        if (res.ok && res.data?.health) {
            return {
                health: res.data.health,
                connections: res.data.connections || [],
            };
        }
    } catch {
        // Bridge is offline
    }

    return {
        health: {
            status: "OFFLINE",
            uptimeSeconds: 0,
            memoryMb: 0,
            connectedAccounts: 0,
            totalAccounts: 0,
            armedRulesCount: 0,
            totalLiveEquity: 0,
            totalFloatingPnl: 0,
            version: "2.0.0-mtapi5",
            mt5Build: 5600,
            timestampUtc: new Date().toISOString(),
        },
        connections: [],
    };
}
