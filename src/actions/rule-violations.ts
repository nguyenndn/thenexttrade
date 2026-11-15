"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { getPairConfig } from "@/lib/calculators";
import {
    convertToUsdEquivalent,
    normalizeLotSize,
} from "@/lib/utils/cent-account";

const FX_CODES = new Set([
    "USD",
    "EUR",
    "GBP",
    "JPY",
    "CHF",
    "CAD",
    "AUD",
    "NZD",
    "SGD",
    "HKD",
    "CNH",
    "CNY",
    "MXN",
    "ZAR",
    "TRY",
    "NOK",
    "SEK",
    "DKK",
    "PLN",
    "XAU",
    "XAG",
]);

const APPROX_USD_PER_UNIT: Record<string, number> = {
    USD: 1,
    EUR: 1.08,
    GBP: 1.28,
    CHF: 1.13,
    AUD: 0.65,
    NZD: 0.6,
    CAD: 1 / 1.36,
    JPY: 1 / 155,
    SGD: 1 / 1.34,
    HKD: 1 / 7.8,
    CNH: 1 / 7.2,
    CNY: 1 / 7.2,
    MXN: 1 / 17.5,
    ZAR: 1 / 18.5,
    TRY: 1 / 34,
    NOK: 1 / 10.8,
    SEK: 1 / 10.5,
    DKK: 1 / 6.9,
    PLN: 1 / 4.0,
};

function convertCurrencyAmountToUsd(amount: number, currencyCode: string): number {
    const rate = APPROX_USD_PER_UNIT[currencyCode.toUpperCase()];
    return rate ? amount * rate : amount;
}

function estimateTradeRiskUsd(
    symbol: string,
    entryPrice: number,
    stopLoss: number,
    lotSize: number,
    syncSource: string | null | undefined,
    account: {
        currency?: string | null;
        server?: string | null;
        accountType?: string | null;
    }
): number {
    const slDistance = Math.abs(entryPrice - stopLoss);
    if (slDistance <= 0 || entryPrice <= 0 || lotSize <= 0) return 0;

    const { contractSize } = getPairConfig(symbol);
    // Synced trades already store lotSize in standard lots; only MANUAL entries may carry raw Cent lots.
    const effectiveLots =
        !syncSource || syncSource === "MANUAL"
            ? normalizeLotSize(lotSize, {
                  currency: account.currency,
                  server: account.server,
                  accountType: account.accountType,
                  symbol,
              })
            : lotSize;
    const quoteRisk = slDistance * effectiveLots * contractSize;

    const clean = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (clean.length >= 6) {
        const base = clean.slice(0, 3);
        const quote = clean.slice(3, 6);
        if (FX_CODES.has(base) && FX_CODES.has(quote)) {
            if (quote === "USD") {
                return quoteRisk;
            }
            if (base === "USD") {
                return quoteRisk / entryPrice;
            }
            return convertCurrencyAmountToUsd(quoteRisk, quote);
        }
    }

    if (clean.includes("JPY") && !clean.startsWith("JPY")) {
        return entryPrice > 10 ? quoteRisk / entryPrice : quoteRisk / 155;
    }

    return quoteRisk;
}

// ============================================================================
// RULE VIOLATION TRACKER — Server Actions
// ============================================================================

export interface RuleViolation {
    type:
        | "max_daily_loss"
        | "max_daily_trades"
        | "max_risk_percent"
        | "cooldown_after_losses";
    label: string;
    count: number;
    threshold: number | null;
    dates: string[];
}

export interface RuleViolationResult {
    violations: RuleViolation[];
    totalViolations: number;
    daysAnalyzed: number;
    complianceRate: number;
}

/**
 * Compute rule violations for a user's trading account.
 * Checks against TradingAccount trading rules.
 */
export async function getRuleViolations(
    accountId?: string,
    days: number = 30
): Promise<RuleViolationResult | { error: string }> {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    // Get trading account with rules FIRST so the Pro gate is account-scoped.
    const account = accountId
        ? await prisma.tradingAccount.findFirst({
              where: { id: accountId, userId: user.id },
          })
        : await prisma.tradingAccount.findFirst({
              where: { userId: user.id, isDefault: true },
          });

    if (!account) return { error: "No trading account found" };

    // Account-scoped Pro gate — rule violations are an account-specific feature.
    // Grant access if THIS account is Pro/GRACE (unexpired) OR the user holds a
    // legacy user-level entitlement (tradingAccountId null). This prevents a Pro
    // account-A user from running violations on a fresh un-entitled account B.
    const now = new Date();
    const proEntitlement = await prisma.proEntitlement.findFirst({
        where: {
            userId: user.id,
            status: { in: ["ACTIVE", "GRACE"] },
            OR: [{ tradingAccountId: account.id }, { tradingAccountId: null }],
            AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }],
        },
    });
    if (!proEntitlement) return { error: "Pro required" };

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const {
        maxDailyLoss,
        maxDailyTrades,
        maxRiskPercent,
        cooldownAfterLosses,
    } = account;

    // Fetch closed trades in period
    const trades = await prisma.journalEntry.findMany({
        where: {
            userId: user.id,
            accountId: account.id,
            status: "CLOSED",
            exitDate: { gte: startDate },
        },
        orderBy: { exitDate: "asc" },
        select: {
            id: true,
            symbol: true,
            pnl: true,
            commission: true,
            swap: true,
            lotSize: true,
            exitDate: true,
            entryDate: true,
            result: true,
            stopLoss: true,
            entryPrice: true,
            syncSource: true,
        },
    });

    const violations: RuleViolation[] = [];

    // Group trades by day
    const tradesByDay = new Map<string, typeof trades>();
    for (const trade of trades) {
        const day = trade.exitDate
            ? trade.exitDate.toISOString().split("T")[0]
            : trade.entryDate.toISOString().split("T")[0];
        if (!tradesByDay.has(day)) tradesByDay.set(day, []);
        tradesByDay.get(day)!.push(trade);
    }

    // Check max daily loss
    if (maxDailyLoss && maxDailyLoss > 0) {
        const violationDates: string[] = [];
        for (const [day, dayTrades] of tradesByDay) {
            const dailyLoss = dayTrades
                .map((t) => (t.pnl || 0) + (t.commission || 0) + (t.swap || 0))
                .filter((pnl) => pnl < 0)
                .reduce((sum, pnl) => sum + Math.abs(pnl), 0);
            if (dailyLoss > maxDailyLoss) violationDates.push(day);
        }
        if (violationDates.length > 0) {
            violations.push({
                type: "max_daily_loss",
                label: "Daily Loss Limit Exceeded",
                count: violationDates.length,
                threshold: maxDailyLoss,
                dates: violationDates,
            });
        }
    }

    // Check max daily trades
    if (maxDailyTrades && maxDailyTrades > 0) {
        const violationDates: string[] = [];
        for (const [day, dayTrades] of tradesByDay) {
            if (dayTrades.length > maxDailyTrades) violationDates.push(day);
        }
        if (violationDates.length > 0) {
            violations.push({
                type: "max_daily_trades",
                label: "Daily Trade Limit Exceeded",
                count: violationDates.length,
                threshold: maxDailyTrades,
                dates: violationDates,
            });
        }
    }

    // Check risk percent (estimate from SL distance with quote-currency conversion)
    if (maxRiskPercent && maxRiskPercent > 0 && account.balance > 0) {
        const accountBalanceUsd = convertToUsdEquivalent(
            account.balance,
            account.currency,
            account.server
        );

        const violationDates: string[] = [];
        if (accountBalanceUsd > 0) {
            for (const trade of trades) {
                if (trade.stopLoss && trade.entryPrice) {
                    const riskUsd = estimateTradeRiskUsd(
                        trade.symbol,
                        trade.entryPrice,
                        trade.stopLoss,
                        trade.lotSize,
                        trade.syncSource,
                        account
                    );
                    const riskPercent = (riskUsd / accountBalanceUsd) * 100;
                    if (riskPercent > maxRiskPercent) {
                        const day = trade.exitDate
                            ? trade.exitDate.toISOString().split("T")[0]
                            : trade.entryDate.toISOString().split("T")[0];
                        if (!violationDates.includes(day))
                            violationDates.push(day);
                    }
                }
            }
        }
        if (violationDates.length > 0) {
            violations.push({
                type: "max_risk_percent",
                label: "Risk % Limit Exceeded",
                count: violationDates.length,
                threshold: maxRiskPercent,
                dates: violationDates,
            });
        }
    }

    // Check cooldown after consecutive losses
    if (cooldownAfterLosses && cooldownAfterLosses > 0) {
        const cooldownMs = 60 * 60 * 1000;
        let consecutiveLosses = 0;
        const violationDates: string[] = [];

        for (let i = 0; i < trades.length; i++) {
            if (trades[i].result === "LOSS") {
                consecutiveLosses++;
                if (consecutiveLosses >= cooldownAfterLosses) {
                    const currentExit = trades[i].exitDate;
                    if (currentExit) {
                        // Scan forward for the first trade opened AT or AFTER currentExit.
                        // Concurrent/overlapping trades opened BEFORE currentExit (gap < 0)
                        // are not post-loss revenge entries and must not trigger cooldown breaches.
                        for (let j = i + 1; j < trades.length; j++) {
                            const nextEntry = trades[j].entryDate;
                            if (!nextEntry) continue;
                            const gap =
                                nextEntry.getTime() - currentExit.getTime();
                            if (gap < 0) continue;
                            if (gap >= 0 && gap < cooldownMs) {
                                const day = nextEntry
                                    .toISOString()
                                    .split("T")[0];
                                if (!violationDates.includes(day)) {
                                    violationDates.push(day);
                                }
                            }
                            break;
                        }
                    }
                }
            } else {
                consecutiveLosses = 0;
            }
        }

        if (violationDates.length > 0) {
            violations.push({
                type: "cooldown_after_losses",
                label: "Cooldown Rule Violated",
                count: violationDates.length,
                threshold: cooldownAfterLosses,
                dates: violationDates,
            });
        }
    }

    const totalViolations = violations.reduce((s, v) => s + v.count, 0);
    const tradingDays = tradesByDay.size;
    const violationDaysSet = new Set(violations.flatMap((v) => v.dates));
    const complianceRate =
        tradingDays > 0
            ? ((tradingDays - violationDaysSet.size) / tradingDays) * 100
            : 100;

    return {
        violations,
        totalViolations,
        daysAnalyzed: tradingDays,
        complianceRate,
    };
}
