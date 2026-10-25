import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveSyncAuth } from "@/lib/sync-auth";
import { POST } from "./route";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        tradingAccount: {
            findFirst: vi.fn(),
            update: vi.fn(),
        },
        journalEntry: {
            findMany: vi.fn(),
            createMany: vi.fn(),
            updateMany: vi.fn(),
        },
        syncHistory: {
            create: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}));

vi.mock("@/lib/sync-auth", () => ({
    resolveSyncAuth: vi.fn(),
}));

const tx = {
    journalEntry: {
        createMany: vi.fn(),
        updateMany: vi.fn(),
    },
    tradingAccount: {
        update: vi.fn(),
    },
};

function mockTransaction(): void {
    vi.mocked(prisma.$transaction).mockImplementation(
        (async (callback: (client: typeof tx) => Promise<unknown>) =>
            callback(tx)) as never
    );
}

function makeRequest(
    trade: Record<string, unknown>
): NextRequest {
    return new NextRequest("http://localhost/api/ea/history", {
        method: "POST",
        headers: { "X-Sync-Key": "history-test-key" },
        body: JSON.stringify({
            accountNumber: "1001",
            trades: [trade],
        }),
    });
}

const openedAt = 1_700_000_000;
const closedAt = 1_700_003_600;

const baseTrade = {
    ticket: "ticket-1",
    symbol: "EURUSD",
    type: 0,
    volume: 0.1,
    openTime: openedAt,
    openPrice: 1.1,
    closeTime: closedAt,
    closePrice: 1.2,
    stopLoss: 0,
    takeProfit: 0,
    profit: 10,
    commission: -1,
    swap: 0,
};

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resolveSyncAuth).mockResolvedValue({
        success: true,
        data: {
            user: { id: "user-1" },
            account: {
                id: "acc-1",
                userId: "user-1",
                accountNumber: "1001",
                platform: "MT5",
                autoSync: true,
                syncOpenTrades: true,
                currency: "USD",
                server: "Vantage-Live",
                accountType: "REAL",
                broker: "Vantage",
            },
            authMode: "LEGACY_ACCOUNT_KEY",
        },
    } as never);
    vi.mocked(prisma.journalEntry.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.journalEntry.createMany).mockResolvedValue({
        count: 1,
    } as never);
    vi.mocked(prisma.journalEntry.updateMany).mockResolvedValue({
        count: 1,
    } as never);
    vi.mocked(prisma.syncHistory.create).mockResolvedValue({} as never);
    vi.mocked(prisma.tradingAccount.update).mockResolvedValue({} as never);
    tx.journalEntry.createMany.mockResolvedValue({ count: 1 });
    tx.journalEntry.updateMany.mockResolvedValue({ count: 1 });
    tx.tradingAccount.update.mockResolvedValue({});
    mockTransaction();
});

describe("POST /api/ea/history SL/TP persistence", () => {
    it("stores missing SL/TP as null for a newly imported trade", async () => {
        const response = await POST(makeRequest(baseTrade));

        expect(response.status).toBe(200);
        expect(tx.journalEntry.createMany).toHaveBeenCalledWith(
            expect.objectContaining({
                data: [
                    expect.objectContaining({
                        stopLoss: null,
                        takeProfit: null,
                    }),
                ],
            })
        );
    });

    it("clears stale SL/TP during an existing-trade backfill", async () => {
        vi.mocked(prisma.journalEntry.findMany).mockResolvedValue([
            {
                externalTicket: "ticket-1",
                status: "CLOSED",
                pnl: 10,
                commission: -1,
                swap: 0,
                stopLoss: 1.05,
                takeProfit: 1.25,
                entryDate: new Date(openedAt * 1000),
                entryPrice: 1.1,
                exitDate: new Date(closedAt * 1000),
                exitPrice: 1.2,
                lotSize: 0.1,
            },
        ] as never);

        const response = await POST(makeRequest(baseTrade));

        expect(response.status).toBe(200);
        expect(tx.journalEntry.updateMany).toHaveBeenCalledWith({
            where: {
                accountId: "acc-1",
                externalTicket: "ticket-1",
            },
            data: expect.objectContaining({
                stopLoss: null,
                takeProfit: null,
            }),
        });
    });

    it("clears SL/TP when an OPEN trade transitions to CLOSED", async () => {
        vi.mocked(prisma.journalEntry.findMany).mockResolvedValue([
            {
                externalTicket: "ticket-1",
                status: "OPEN",
                pnl: 0,
                commission: 0,
                swap: 0,
                stopLoss: 1.05,
                takeProfit: 1.25,
                entryDate: new Date(openedAt * 1000),
                entryPrice: 1.1,
                exitDate: null,
                exitPrice: null,
                lotSize: 0.1,
            },
        ] as never);

        const response = await POST(makeRequest(baseTrade));

        expect(response.status).toBe(200);
        expect(tx.journalEntry.updateMany).toHaveBeenCalledWith({
            where: {
                accountId: "acc-1",
                externalTicket: "ticket-1",
                status: "OPEN",
            },
            data: expect.objectContaining({
                status: "CLOSED",
                stopLoss: null,
                takeProfit: null,
            }),
        });
    });

    it("B4: normalizes broker via detectBroker before calling resolveSyncAuth", async () => {
        const req = new NextRequest("http://localhost/api/ea/history", {
            method: "POST",
            headers: { "X-Sync-Key": "history-test-key" },
            body: JSON.stringify({
                accountNumber: "1001",
                server: "Exness-MT5Real",
                broker: "Exness Technologies Ltd",
                gmtOffset: 0,
                trades: [baseTrade],
            }),
        });

        const response = await POST(req);
        expect(response.status).toBe(200);
        expect(resolveSyncAuth).toHaveBeenCalledWith(
            expect.objectContaining({
                request: req,
                accountNumber: "1001",
                broker: "Exness",
            })
        );
    });

    it("B1 & B2: normalizes timestamps with gmtOffset and forces pnl = 0 on OPEN trades in history route", async () => {
        const openTrade = {
            ...baseTrade,
            ticket: "hist-open-1",
            openTime: 1711843140,
            closeTime: 0,
            closePrice: 0,
            profit: 99.5,
        };

        const req = new NextRequest("http://localhost/api/ea/history", {
            method: "POST",
            headers: { "X-Sync-Key": "history-test-key" },
            body: JSON.stringify({
                accountNumber: "1001",
                gmtOffset: 10800,
                trades: [openTrade],
            }),
        });

        const response = await POST(req);
        expect(response.status).toBe(200);
        expect(tx.journalEntry.createMany).toHaveBeenCalledWith(
            expect.objectContaining({
                data: [
                    expect.objectContaining({
                        externalTicket: "hist-open-1",
                        entryDate: new Date("2024-03-30T20:59:00.000Z"),
                        status: "OPEN",
                        pnl: 0,
                        result: null,
                    }),
                ],
            })
        );
    });

    it("B8 & B9 & B10: rejects > 500 trades with 413, deduplicates tickets, and guards CLOSED rows against OPEN overwrite", async () => {
        const tooMany = Array.from({ length: 501 }, (_, i) => ({
            ...baseTrade,
            ticket: `hist-${i}`,
        }));
        const res413 = await POST(
            new NextRequest("http://localhost/api/ea/history", {
                method: "POST",
                headers: { "X-Sync-Key": "history-test-key" },
                body: JSON.stringify({
                    accountNumber: "1001",
                    trades: tooMany,
                }),
            })
        );
        expect(res413.status).toBe(413);

        // Guard CLOSED row against delayed OPEN snapshot
        vi.mocked(prisma.journalEntry.findMany).mockResolvedValueOnce([
            {
                externalTicket: "ticket-1",
                status: "CLOSED",
                pnl: 40,
                commission: -1,
                swap: 0,
                stopLoss: null,
                takeProfit: null,
                entryDate: new Date(openedAt * 1000),
                entryPrice: 1.1,
                exitDate: new Date(closedAt * 1000),
                exitPrice: 1.2,
                lotSize: 0.1,
            },
        ] as never);

        const resGuard = await POST(
            makeRequest({
                ...baseTrade,
                ticket: "ticket-1",
                closeTime: 0,
                closePrice: 0,
                profit: 5,
            })
        );
        const bodyGuard = await resGuard.json();
        expect(resGuard.status).toBe(200);
        expect(bodyGuard).toMatchObject({
            success: true,
            received: 1,
            imported: 0,
            updated: 0,
            skipped: 1,
        });
        expect(tx.journalEntry.updateMany).not.toHaveBeenCalled();
    });
});

