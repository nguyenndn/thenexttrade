/**
 * PVSR Capital API Client
 *
 * Centralized service to communicate with PVSR Capital Partner API.
 * Currently returns MOCK DATA — swap to real fetch() when PVSR deploys.
 *
 * To switch to real API: set USE_MOCK_PVSR=false in .env
 */

// ============================================================================
// TYPES — Match PVSR API spec v2.4
// ============================================================================

export interface PVSRAccountDetail {
    success: boolean;
    status: "PENDING" | "APPROVED" | "REJECTED" | "DISCONNECTED" | "DELETED";
    accountInfo: PVSRAccountInfo | null;
    performance: PVSRPerformance | null;
}

export interface PVSRAccountInfo {
    accountCode: string;
    maskedAccountNumber: string;
    maskedClientName: string;
    currency: string;
    leverage: number;
    broker: string;
    server: string;
    balance: number;
    equity: number;
    drawdownPercent: number;
    accountStatus: "ONLINE" | "OFFLINE";
    lastUpdated: string;
}

export interface PVSRPerformance {
    coreMetrics: {
        balance: number;
        equity: number;
        totalDeposits: number;
        totalWithdrawals: number;
        highestBalance: number;
        netDeposits: number;
    };
    advancedStats: {
        growthPercent: number;
        maxDrawdownPercent: number;
        maxDrawdownUsd: number;
        totalNetProfit: number;
        grossProfit: number;
        grossLoss: number;
        profitFactor: number;
        winRatePercent: number;
        totalTrades: number;
        winCount: number;
        lossCount: number;
        bestTrade: number;
        worstTrade: number;
        recoveryFactor: number;
        avgHoldTime: string;
    };
    dailyCalendar: Record<string, { profit: number; tradesCount: number }>;
    monthlyCalendar: Record<string, { profit: number; growthPct: number }>;
    growthChartArray: {
        date: string;
        balance: number;
        drawdownPct: number;
        dailyProfit: number;
    }[];
    instrumentDistribution: {
        symbol: string;
        profit: number;
        winRate: number;
        totalTrades: number;
    }[];
}

export interface PVSRDeleteResult {
    success: boolean;
    message: string;
}

export interface PVSRDisconnectResult {
    success: boolean;
    message: string;
    status: string;
}

// ============================================================================
// CONFIG
// ============================================================================

const USE_MOCK = process.env.USE_MOCK_PVSR !== "false"; // default: true (mock)
const PVSR_API_URL = process.env.PVSR_API_URL || "";
const PVSR_API_KEY = process.env.PVSR_API_KEY || "";

// ============================================================================
// MOCK DATA
// ============================================================================

function generateMockPerformance(): PVSRPerformance {
    return {
        coreMetrics: {
            balance: 15325.54,
            equity: 15420.00,
            totalDeposits: 10000.00,
            totalWithdrawals: 0,
            highestBalance: 15890.23,
            netDeposits: 10000.00,
        },
        advancedStats: {
            growthPercent: 53.26,
            maxDrawdownPercent: 7.19,
            maxDrawdownUsd: 1143.01,
            totalNetProfit: 5325.54,
            grossProfit: 8240.00,
            grossLoss: -2914.46,
            profitFactor: 2.83,
            winRatePercent: 68.8,
            totalTrades: 256,
            winCount: 176,
            lossCount: 80,
            bestTrade: 520.50,
            worstTrade: -180.20,
            recoveryFactor: 4.66,
            avgHoldTime: "1h 45m",
        },
        dailyCalendar: {
            "2026-03-25": { profit: 250.00, tradesCount: 4 },
            "2026-03-26": { profit: 180.50, tradesCount: 3 },
            "2026-03-27": { profit: -95.20, tradesCount: 5 },
            "2026-03-28": { profit: 420.00, tradesCount: 6 },
            "2026-03-29": { profit: 310.80, tradesCount: 4 },
            "2026-03-31": { profit: -45.60, tradesCount: 2 },
            "2026-04-01": { profit: 1651.63, tradesCount: 8 },
            "2026-04-02": { profit: 113.45, tradesCount: 3 },
            "2026-04-03": { profit: -78.30, tradesCount: 4 },
            "2026-04-04": { profit: 245.90, tradesCount: 5 },
            "2026-04-07": { profit: 188.20, tradesCount: 3 },
            "2026-04-08": { profit: -125.40, tradesCount: 6 },
            "2026-04-09": { profit: 340.00, tradesCount: 4 },
        },
        monthlyCalendar: {
            "2026-01": { profit: 1520.00, growthPct: 15.2 },
            "2026-02": { profit: 890.50, growthPct: 7.73 },
            "2026-03": { profit: 2100.00, growthPct: 16.95 },
            "2026-04": { profit: 815.04, growthPct: 5.63 },
        },
        growthChartArray: [
            { date: "2026-01-06", balance: 10000.00, drawdownPct: 0, dailyProfit: 0 },
            { date: "2026-01-13", balance: 10350.00, drawdownPct: 0, dailyProfit: 350 },
            { date: "2026-01-20", balance: 10820.00, drawdownPct: 0, dailyProfit: 470 },
            { date: "2026-01-27", balance: 11520.00, drawdownPct: 0, dailyProfit: 700 },
            { date: "2026-02-03", balance: 11280.00, drawdownPct: 2.08, dailyProfit: -240 },
            { date: "2026-02-10", balance: 11850.00, drawdownPct: 0, dailyProfit: 570 },
            { date: "2026-02-17", balance: 12100.00, drawdownPct: 0, dailyProfit: 250 },
            { date: "2026-02-24", balance: 12410.50, drawdownPct: 0, dailyProfit: 310.5 },
            { date: "2026-03-03", balance: 12980.00, drawdownPct: 0, dailyProfit: 569.5 },
            { date: "2026-03-10", balance: 13450.00, drawdownPct: 0, dailyProfit: 470 },
            { date: "2026-03-17", balance: 13100.00, drawdownPct: 2.6, dailyProfit: -350 },
            { date: "2026-03-24", balance: 14200.00, drawdownPct: 0, dailyProfit: 1100 },
            { date: "2026-03-31", balance: 14510.50, drawdownPct: 0, dailyProfit: 310.5 },
            { date: "2026-04-07", balance: 15100.00, drawdownPct: 0, dailyProfit: 589.5 },
            { date: "2026-04-09", balance: 15325.54, drawdownPct: 0, dailyProfit: 225.54 },
        ],
        instrumentDistribution: [
            { symbol: "XAUUSD", profit: 3850.00, winRate: 72, totalTrades: 145 },
            { symbol: "EURUSD", profit: 820.50, winRate: 65, totalTrades: 52 },
            { symbol: "GBPUSD", profit: 410.00, winRate: 60, totalTrades: 28 },
            { symbol: "USDJPY", profit: 245.04, winRate: 70, totalTrades: 31 },
        ],
    };
}

function getMockAccountDetail(mt5Account: string, localStatus?: string): PVSRAccountDetail {
    // If local status is provided and is non-approved, return that
    if (localStatus === "PENDING") {
        return { success: true, status: "PENDING", accountInfo: null, performance: null };
    }
    if (localStatus === "REJECTED") {
        return { success: true, status: "REJECTED", accountInfo: null, performance: null };
    }
    if (localStatus === "DISCONNECTED") {
        return {
            success: true,
            status: "DISCONNECTED",
            accountInfo: {
                accountCode: "ACC001",
                maskedAccountNumber: mt5Account.slice(0, 3) + "***" + mt5Account.slice(-2),
                maskedClientName: "Us** Na**",
                currency: "USD",
                leverage: 500,
                broker: "Exness",
                server: "Exness-MT5Real2",
                balance: 15325.54,
                equity: 15325.54,
                drawdownPercent: 0,
                accountStatus: "OFFLINE",
                lastUpdated: new Date().toISOString(),
            },
            performance: generateMockPerformance(),
        };
    }

    // APPROVED — full data
    return {
        success: true,
        status: "APPROVED",
        accountInfo: {
            accountCode: "ACC001",
            maskedAccountNumber: mt5Account.slice(0, 3) + "***" + mt5Account.slice(-2),
            maskedClientName: "Us** Na**",
            currency: "USD",
            leverage: 500,
            broker: "Exness",
            server: "Exness-MT5Real2",
            balance: 15325.54,
            equity: 15420.00,
            drawdownPercent: 0.62,
            accountStatus: "ONLINE",
            lastUpdated: new Date().toISOString(),
        },
        performance: generateMockPerformance(),
    };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get account detail: status + accountInfo + performance
 * Maps to: GET /api/v1/partners/ninja_team/clients/{mt5Account}
 */
export async function getAccountDetail(mt5Account: string, localStatus?: string): Promise<PVSRAccountDetail | null> {
    if (USE_MOCK) {
        return getMockAccountDetail(mt5Account, localStatus);
    }

    try {
        const response = await fetch(`${PVSR_API_URL}/clients/${mt5Account}`, {
            headers: {
                "x-api-key": PVSR_API_KEY,
            },
            signal: AbortSignal.timeout(10_000),
        });

        if (response.status === 404) return null;
        return await response.json();
    } catch (error) {
        console.error("[PVSR Client] getAccountDetail failed:", error);
        return null;
    }
}

/**
 * Delete a PENDING/REJECTED registration
 * Maps to: DELETE /api/v1/partners/ninja_team/clients/{mt5Account}
 */
export async function deleteRegistration(mt5Account: string): Promise<PVSRDeleteResult> {
    if (USE_MOCK) {
        return { success: true, message: "Registration cancelled successfully." };
    }

    try {
        const response = await fetch(`${PVSR_API_URL}/clients/${mt5Account}`, {
            method: "DELETE",
            headers: { "x-api-key": PVSR_API_KEY },
            signal: AbortSignal.timeout(10_000),
        });

        return await response.json();
    } catch (error) {
        console.error("[PVSR Client] deleteRegistration failed:", error);
        return { success: false, message: "Failed to reach PVSR API" };
    }
}

/**
 * Disconnect an APPROVED account
 * Maps to: POST /api/v1/partners/ninja_team/clients/{mt5Account}/disconnect
 */
export async function disconnectAccount(mt5Account: string, reason?: string): Promise<PVSRDisconnectResult> {
    if (USE_MOCK) {
        return { success: true, message: "Account disconnected successfully (mock)", status: "DISCONNECTED" };
    }

    try {
        const response = await fetch(`${PVSR_API_URL}/clients/${mt5Account}/disconnect`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": PVSR_API_KEY,
            },
            body: JSON.stringify({ reason: reason || "User requested disconnect" }),
            signal: AbortSignal.timeout(10_000),
        });

        return await response.json();
    } catch (error) {
        console.error("[PVSR Client] disconnectAccount failed:", error);
        return { success: false, message: "Failed to reach PVSR API", status: "error" };
    }
}
