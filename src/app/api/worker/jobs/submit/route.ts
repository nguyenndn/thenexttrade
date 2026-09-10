import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTradeHash } from "@/lib/importers";
import { classifyTradeResult } from "@/lib/utils/trade-classification";
import { revalidatePath } from "next/cache";
import { POPULAR_MT5_SERVERS } from "@/lib/constants/mt5-servers";
import { detectBroker } from "@/lib/ea/broker-detection";
import { isCentAccount, isCentSymbol, normalizeLotSize } from "@/lib/utils/cent-account";

const WORKER_KEY =
    process.env.WORKER_API_KEY ||
    process.env.MT5_WORKER_KEY ||
    "tnt-worker-secret-key-2026";

interface DealPayload {
    ticket: number | string;
    order?: number | string;
    symbol: string;
    type: "BUY" | "SELL" | string | number;
    lots: number;
    openTime: string | number;
    openPrice: number;
    closeTime?: string | number | null;
    closePrice?: number | null;
    profit: number;
    swap?: number;
    commission?: number;
    comment?: string;
    sl?: number | null;
    tp?: number | null;
}

export async function POST(request: NextRequest) {
    try {
        const authHeader =
            request.headers.get("x-worker-key") ||
            request.headers.get("authorization");
        if (
            !authHeader ||
            (authHeader !== WORKER_KEY &&
                authHeader !== `Bearer ${WORKER_KEY}`)
        ) {
            return NextResponse.json(
                { error: "Unauthorized worker access" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            jobId,
            deals = [],
            balance,
            equity,
            company,
            currency,
            leverage,
        }: {
            jobId: string;
            deals: DealPayload[];
            balance?: number;
            equity?: number;
            company?: string;
            currency?: string;
            leverage?: number;
        } = body;

        if (!jobId) {
            return NextResponse.json(
                { error: "Missing jobId" },
                { status: 400 }
            );
        }

        const job = await prisma.mt5ImportJob.findUnique({
            where: { id: jobId },
            include: { account: true },
        });

        if (!job) {
            return NextResponse.json(
                { error: "Job not found" },
                { status: 404 }
            );
        }

        let imported = 0;
        let updated = 0;

        for (const deal of deals) {
            try {
                const ticket = String(deal.ticket);
                const rawType = String(deal.type).toLowerCase();
                const normalizedType: "BUY" | "SELL" =
                    rawType === "1" || rawType.includes("sell")
                        ? "SELL"
                        : "BUY";

                const parseDate = (val: string | number | null | undefined) => {
                    if (!val) return null;
                    if (typeof val === "number") return new Date(val * 1000);
                    return new Date(val);
                };

                const entryDate = parseDate(deal.openTime) || new Date();
                const exitDate = parseDate(deal.closeTime);
                const isClosed = Boolean(
                    exitDate && exitDate.getFullYear() > 1980
                );

                const pnl =
                    (Number(deal.profit) || 0) +
                    (Number(deal.commission) || 0) +
                    (Number(deal.swap) || 0);

                const status = isClosed ? "CLOSED" : "OPEN";
                const result = isClosed
                    ? classifyTradeResult({ pnl })
                    : null;

                const existing = await prisma.journalEntry.findFirst({
                    where: {
                        userId: job.userId,
                        accountId: job.accountId,
                        externalTicket: ticket,
                    },
                });

                if (existing) {
                    await prisma.journalEntry.update({
                        where: { id: existing.id },
                        data: {
                            exitDate: isClosed ? exitDate : null,
                            exitPrice: deal.closePrice || existing.exitPrice,
                            stopLoss: typeof deal.sl === "number" ? deal.sl : existing.stopLoss,
                            takeProfit: typeof deal.tp === "number" ? deal.tp : existing.takeProfit,
                            pnl,
                            status,
                            result,
                            commission:
                                Number(deal.commission) || existing.commission,
                            swap: Number(deal.swap) || existing.swap,
                            updatedAt: new Date(),
                        },
                    });
                    updated++;
                } else {
                    const hash = generateTradeHash({
                        symbol: deal.symbol,
                        type: normalizedType,
                        entryDate,
                        entryPrice: deal.openPrice,
                    });

                    const isCent =
                        isCentAccount(job.account) ||
                        (currency ? isCentAccount({ currency }) : false);
                    const isTradeCent = isCent || isCentSymbol(deal.symbol);
                    const normalizedLot = normalizeLotSize(Number(deal.lots) || 0.01, isTradeCent);

                    await prisma.journalEntry.create({
                        data: {
                            userId: job.userId,
                            accountId: job.accountId,
                            externalTicket: ticket,
                            symbol: deal.symbol,
                            type: normalizedType,
                            lotSize: normalizedLot,
                            entryDate,
                            entryPrice: Number(deal.openPrice) || 0,
                            exitDate: isClosed ? exitDate : null,
                            exitPrice: deal.closePrice || null,
                            stopLoss: typeof deal.sl === "number" ? deal.sl : null,
                            takeProfit: typeof deal.tp === "number" ? deal.tp : null,
                            pnl,
                            status,
                            result,
                            commission: Number(deal.commission) || 0,
                            swap: Number(deal.swap) || 0,
                            syncSource: "CLOUD_WORKER",
                            externalHash: hash,
                        },
                    });
                    imported++;
                }
            } catch (dealErr: any) {
                console.error(
                    `[Worker Submit] Error processing deal #${deal.ticket}:`,
                    dealErr
                );
            }
        }

        // Update Trading Account stats
        const accountUpdate: Record<string, any> = {
            lastSync: new Date(),
            syncSource: "CLOUD_WORKER",
            appLastHeartbeat: new Date(),
        };

        if (typeof balance === "number" && !isNaN(balance)) {
            accountUpdate.balance = balance;
        }
        if (typeof equity === "number" && !isNaN(equity)) {
            accountUpdate.equity = equity;
        }
        if (typeof currency === "string" && currency.trim().length > 0) {
            accountUpdate.currency = currency.trim().toUpperCase();
        }
        if (typeof leverage === "number" && leverage > 0) {
            accountUpdate.leverage = `1:${leverage}`;
        }
        if (typeof company === "string" && company.trim().length > 0) {
            accountUpdate.broker = company.trim();
        } else if (!job.account.broker && job.account.server) {
            const matched = POPULAR_MT5_SERVERS.find(
                (s) => s.name.toLowerCase() === job.account.server?.trim().toLowerCase()
            );
            if (matched?.broker) {
                accountUpdate.broker = matched.broker;
            } else {
                const detected = detectBroker(job.account.server, "");
                if (detected) accountUpdate.broker = detected;
            }
        }

        await prisma.tradingAccount.update({
            where: { id: job.accountId },
            data: accountUpdate,
        });

        // Mark Job as COMPLETED
        await prisma.mt5ImportJob.update({
            where: { id: job.id },
            data: {
                status: "COMPLETED",
                progressPercent: 100,
                dealsReceived: deals.length,
                completedAt: new Date(),
                message: `Imported ${imported} new deals, updated ${updated} deals.`,
            },
        });

        revalidatePath("/dashboard/accounts");
        revalidatePath("/dashboard");

        return NextResponse.json({
            success: true,
            imported,
            updated,
            totalDeals: deals.length,
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
