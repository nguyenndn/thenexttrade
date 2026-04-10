/**
 * PVSR Capital API Client
 *
 * Centralized service to communicate with PVSR Capital Partner API.
 * All requests go through the real PVSR API endpoints.
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
    leverage: number | null;
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

const PVSR_API_URL = process.env.PVSR_API_URL || "";
const PVSR_API_KEY = process.env.PVSR_API_KEY || "";

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get account detail: status + accountInfo + performance
 * Maps to: GET /api/v1/partners/ninja_team/clients/{mt5Account}
 */
export async function getAccountDetail(mt5Account: string): Promise<PVSRAccountDetail | null> {
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

