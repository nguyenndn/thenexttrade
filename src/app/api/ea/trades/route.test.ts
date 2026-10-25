import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveSyncAuth } from "@/lib/sync-auth";
import { recordEaProductTelemetry } from "@/lib/ea/telemetry.server";
import { POST } from "./route";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        tradingAccount: {
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        journalEntry: {
            findMany: vi.fn(),
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

vi.mock("@/lib/ea/telemetry.server", () => ({
    recordEaProductTelemetry: vi.fn(),
}));

vi.mock("@/lib/experiments/progress.server", () => ({
    onUserTradesUpdated: vi.fn(),
}));

const tx = {
    journalEntry: {
        createMany: vi.fn(),
        updateMany: vi.fn(),
    },
    syncHistory: {
        create: vi.fn(),
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
    trade: Record<string, unknown>,
    metadata: Record<string, unknown> = {}
): NextRequest {
    return new NextRequest("http://localhost/api/ea/trades", {
        method: "POST",
        headers: { "X-Sync-Key": "trades-test-key" },
        body: JSON.stringify({
            accountNumber: "1001",
            trades: [trade],
            ...metadata,
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
            user: {
                id: "user-1",
                email: "user@example.com",
                name: "User",
            },
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
    vi.mocked(prisma.tradingAccount.update).mockResolvedValue({} as never);
    tx.journalEntry.createMany.mockResolvedValue({ count: 1 });
    tx.journalEntry.updateMany.mockResolvedValue({ count: 1 });
    tx.syncHistory.create.mockResolvedValue({});
    tx.tradingAccount.update.mockResolvedValue({});
    mockTransaction();
});

describe("POST /api/ea/trades SL/TP persistence", () => {
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
});

describe("POST /api/ea/trades account identity", () => {
    it("rejects an unknown USER_SYNC_KEY account without creating it", async () => {
        vi.mocked(resolveSyncAuth).mockResolvedValue({
            success: true,
            data: {
                user: {
                    id: "user-new",
                    email: "new@example.com",
                    name: "New User",
                },
                account: undefined,
                authMode: "USER_SYNC_KEY",
            },
        } as never);
        vi.mocked(prisma.tradingAccount.findFirst).mockResolvedValue(null);

        const response = await POST(
            makeRequest(baseTrade, {
                trades: [],
                accountTradeMode: 2,
                server: "VantageMarkets-Live",
                broker: "Vantage Markets Ltd",
                platform: "MT5",
            })
        );

        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({
            error: "Account not found for this account number",
        });
        expect(prisma.tradingAccount.create).not.toHaveBeenCalled();
        expect(prisma.$transaction).not.toHaveBeenCalled();
        expect(recordEaProductTelemetry).not.toHaveBeenCalled();
    });

    it.each([
        {
            label: "evaluation",
            server: "Vantage-Evaluation",
            broker: "Vantage",
        },
        {
            label: "trial",
            server: "Vantage-Live",
            broker: "Exness-Trial",
        },
    ])(
        "does not classify an explicit REAL payload with a $label marker as REAL",
        async ({ server, broker }) => {
            const response = await POST(
                makeRequest(baseTrade, {
                    accountTradeMode: 2,
                    server,
                    broker,
                })
            );

            expect(response.status).toBe(200);
            expect(recordEaProductTelemetry).toHaveBeenCalledWith(
                expect.objectContaining({ accountType: "DEMO" })
            );
        }
    );
});

describe("POST /api/ea/trades B1-B12 fixes", () => {
    it("B1: normalizes openTime and closeTime from broker server time to UTC using gmtOffset", async () => {
        const trade = {
            ...baseTrade,
            openTime: 1711843140, // 2024-03-30 23:59:00 broker EEST (+3h)
            closeTime: 1711843260, // 2024-03-31 00:01:00 broker EEST (+3h)
        };
        const response = await POST(
            makeRequest(trade, {
                gmtOffset: 10800, // +3 hours in seconds
                clientTime: "2024-03-30T21:02:00Z",
            })
        );

        expect(response.status).toBe(200);
        expect(tx.journalEntry.createMany).toHaveBeenCalledWith(
            expect.objectContaining({
                data: [
                    expect.objectContaining({
                        entryDate: new Date("2024-03-30T20:59:00.000Z"),
                        exitDate: new Date("2024-03-30T21:01:00.000Z"),
                    }),
                ],
            })
        );
    });

    it("B2: forces pnl = 0 and result = null for OPEN positions even when EA sends non-zero floating profit", async () => {
        const openTrade = {
            ...baseTrade,
            closeTime: 0,
            closePrice: 0,
            profit: 123.45,
        };
        const response = await POST(makeRequest(openTrade));

        expect(response.status).toBe(200);
        expect(tx.journalEntry.createMany).toHaveBeenCalledWith(
            expect.objectContaining({
                data: [
                    expect.objectContaining({
                        status: "OPEN",
                        pnl: 0,
                        result: null,
                    }),
                ],
            })
        );
    });

    it("B3: skips open positions when account.syncOpenTrades is false while importing closed trades", async () => {
        vi.mocked(resolveSyncAuth).mockResolvedValueOnce({
            success: true,
            data: {
                user: { id: "user-1", email: "user@example.com", name: "User" },
                account: {
                    id: "acc-1",
                    userId: "user-1",
                    accountNumber: "1001",
                    platform: "MT5",
                    autoSync: true,
                    syncOpenTrades: false,
                    currency: "USD",
                    server: "Vantage-Live",
                    accountType: "REAL",
                    broker: "Vantage",
                },
                authMode: "LEGACY_ACCOUNT_KEY",
            },
        } as never);

        const openTrade = {
            ...baseTrade,
            ticket: "open-1",
            closeTime: 0,
            closePrice: 0,
            profit: 50,
        };
        const closedTrade = {
            ...baseTrade,
            ticket: "closed-1",
        };

        const req = new NextRequest("http://localhost/api/ea/trades", {
            method: "POST",
            headers: { "X-Sync-Key": "trades-test-key" },
            body: JSON.stringify({
                accountNumber: "1001",
                trades: [openTrade, closedTrade],
                gmtOffset: 0,
            }),
        });

        const response = await POST(req);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toMatchObject({
            received: 2,
            imported: 1,
            updated: 0,
            skipped: 1,
        });
        expect(tx.journalEntry.createMany).toHaveBeenCalledWith(
            expect.objectContaining({
                data: [
                    expect.objectContaining({
                        externalTicket: "closed-1",
                        status: "CLOSED",
                    }),
                ],
            })
        );
    });

    it("B5: rejects trades with NaN/non-finite numeric fields or volume <= 0 into errors without failing valid trades", async () => {
        const valid1 = { ...baseTrade, ticket: "t-1" };
        const badPrice = { ...baseTrade, ticket: "t-2", openPrice: "abc" };
        const valid3 = { ...baseTrade, ticket: "t-3" };

        tx.journalEntry.createMany.mockResolvedValueOnce({ count: 2 });

        const req = new NextRequest("http://localhost/api/ea/trades", {
            method: "POST",
            headers: { "X-Sync-Key": "trades-test-key" },
            body: JSON.stringify({
                accountNumber: "1001",
                trades: [valid1, badPrice, valid3],
                gmtOffset: 0,
            }),
        });

        const response = await POST(req);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.imported).toBe(2);
        expect(body.skipped).toBe(1);
        expect(body.errors).toEqual([
            expect.objectContaining({
                ticket: "t-2",
                reason: "Invalid openPrice: abc",
            }),
        ]);
    });

    it("B6: parses clientTime deterministically in UTC for both MT5 dot strings and ISO strings", async () => {
        const { parseEATime } = await import("@/lib/ea/utils");
        const dotParsed = parseEATime("2026.03.30 14:30:00");
        const isoParsed = parseEATime("2026-03-30T14:30:00Z");

        expect(dotParsed?.toISOString()).toBe("2026-03-30T14:30:00.000Z");
        expect(isoParsed?.toISOString()).toBe("2026-03-30T14:30:00.000Z");
    });

    it("B7: preserves initialVolume on OPEN rows during partial closes and stores total closed volume on full close", async () => {
        // Step 1:Existing OPEN row with lotSize = 1.0
        vi.mocked(prisma.journalEntry.findMany).mockResolvedValueOnce([
            {
                externalTicket: "ticket-partial",
                status: "OPEN",
                pnl: 0,
                commission: -3.5,
                swap: 0,
                stopLoss: 1.05,
                takeProfit: 1.25,
                entryDate: new Date(openedAt * 1000),
                entryPrice: 1.1,
                exitDate: null,
                exitPrice: null,
                lotSize: 1.0,
            },
        ] as never);

        // Partial close snapshot while still OPEN (remainingVolume = 0.6, SL moved to 1.08)
        const partialOpenSnapshot = {
            ...baseTrade,
            ticket: "ticket-partial",
            volume: 0.6,
            remainingVolume: 0.6,
            closeTime: 0,
            closePrice: 0,
            stopLoss: 1.08,
            takeProfit: 1.25,
            profit: 45.0,
            commission: -3.5,
        };

        const res1 = await POST(makeRequest(partialOpenSnapshot, { gmtOffset: 0 }));
        expect(res1.status).toBe(200);
        // Should update stopLoss and keep lotSize = 1.0 (not overwrite down to 0.6)
        expect(tx.journalEntry.updateMany).toHaveBeenCalledWith({
            where: {
                accountId: "acc-1",
                externalTicket: "ticket-partial",
                status: "OPEN",
            },
            data: expect.objectContaining({
                lotSize: 1.0,
                stopLoss: 1.08,
                pnl: 0,
            }),
        });
    });

    it("B8: returns HTTP 413 when trades array exceeds 500 items", async () => {
        const manyTrades = Array.from({ length: 501 }, (_, idx) => ({
            ...baseTrade,
            ticket: `t-${idx}`,
        }));

        const req = new NextRequest("http://localhost/api/ea/trades", {
            method: "POST",
            headers: { "X-Sync-Key": "trades-test-key" },
            body: JSON.stringify({
                accountNumber: "1001",
                trades: manyTrades,
            }),
        });

        const response = await POST(req);
        expect(response.status).toBe(413);
    });

    it("B9: enforces received === imported + updated + skipped and non-negative SyncHistory.tradesImported, deduplicating in-batch tickets", async () => {
        // 5 new trades, 2 closing updates (OPEN -> CLOSED), 3 unchanged duplicates
        const existingRows = [
            {
                externalTicket: "upd-1",
                status: "OPEN",
                pnl: 0,
                commission: 0,
                swap: 0,
                stopLoss: null,
                takeProfit: null,
                entryDate: new Date(openedAt * 1000),
                entryPrice: 1.1,
                exitDate: null,
                exitPrice: null,
                lotSize: 0.1,
            },
            {
                externalTicket: "upd-2",
                status: "OPEN",
                pnl: 0,
                commission: 0,
                swap: 0,
                stopLoss: null,
                takeProfit: null,
                entryDate: new Date(openedAt * 1000),
                entryPrice: 1.1,
                exitDate: null,
                exitPrice: null,
                lotSize: 0.1,
            },
            ...["dup-1", "dup-2", "dup-3"].map((ticket) => ({
                externalTicket: ticket,
                status: "CLOSED",
                pnl: 10,
                commission: -1,
                swap: 0,
                stopLoss: null,
                takeProfit: null,
                entryDate: new Date(openedAt * 1000),
                entryPrice: 1.1,
                exitDate: new Date(closedAt * 1000),
                exitPrice: 1.2,
                lotSize: 0.1,
            })),
        ];

        vi.mocked(prisma.journalEntry.findMany).mockResolvedValueOnce(existingRows as never);
        tx.journalEntry.createMany.mockResolvedValueOnce({ count: 5 });

        const batch = [
            ...["new-1", "new-2", "new-3", "new-4", "new-5"].map((ticket) => ({
                ...baseTrade,
                ticket,
            })),
            ...["upd-1", "upd-2"].map((ticket) => ({
                ...baseTrade,
                ticket,
            })),
            ...["dup-1", "dup-2", "dup-3"].map((ticket) => ({
                ...baseTrade,
                ticket,
            })),
        ];

        const req = new NextRequest("http://localhost/api/ea/trades", {
            method: "POST",
            headers: { "X-Sync-Key": "trades-test-key" },
            body: JSON.stringify({
                accountNumber: "1001",
                trades: batch,
                gmtOffset: 0,
            }),
        });

        const response = await POST(req);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toMatchObject({
            success: true,
            received: 10,
            imported: 5,
            updated: 2,
            skipped: 3,
        });
        expect(body.received).toBe(body.imported + body.updated + body.skipped);
        expect(tx.syncHistory.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                tradesImported: 7, // 5 imported + 2 updated
                tradesSkipped: 3,
            }),
        });
    });

    it("B10: refuses to overwrite a CLOSED row when a delayed OPEN snapshot arrives", async () => {
        vi.mocked(prisma.journalEntry.findMany).mockResolvedValueOnce([
            {
                externalTicket: "ticket-1",
                status: "CLOSED",
                pnl: 85,
                commission: -2,
                swap: -0.5,
                stopLoss: 1.05,
                takeProfit: 1.25,
                entryDate: new Date(openedAt * 1000),
                entryPrice: 1.1,
                exitDate: new Date(closedAt * 1000),
                exitPrice: 1.2,
                lotSize: 0.5,
            },
        ] as never);

        const delayedOpen = {
            ...baseTrade,
            ticket: "ticket-1",
            closeTime: 0,
            closePrice: 0,
            profit: 12,
        };

        const response = await POST(makeRequest(delayedOpen, { gmtOffset: 0 }));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.updated).toBe(0);
        expect(body.skipped).toBe(1);
        expect(tx.journalEntry.updateMany).not.toHaveBeenCalled();
    });

    it("B11: rejects trades flagged with entryDataMissing: true into errors without inserting a fabricated 0-second row", async () => {
        const missingEntryTrade = {
            ...baseTrade,
            ticket: "missing-open-1",
            openPrice: 1.2,
            openTime: closedAt,
            entryDataMissing: true,
        };

        const response = await POST(makeRequest(missingEntryTrade, { gmtOffset: 0 }));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.imported).toBe(0);
        expect(body.skipped).toBe(1);
        expect(body.errors).toEqual([
            expect.objectContaining({
                ticket: "missing-open-1",
                reason: "Missing opening deal data (entryDataMissing) for ticket missing-open-1",
            }),
        ]);
        expect(tx.journalEntry.createMany).not.toHaveBeenCalled();
    });

    it("B12: GET /api/app/version returns 200 with release info and deprecated .mq5 is absent", async () => {
        const fs = await import("fs");
        const path = await import("path");
        const { GET: getVersion } = await import("@/app/api/app/version/route");

        const res = await getVersion(
            new NextRequest("http://localhost/api/app/version")
        );
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.version).toBeDefined();
        expect(data.downloadUrl).toContain("http://localhost");

        const deprecatedPath = path.join(
            process.cwd(),
            "public",
            "downloads",
            "TheNextTrade_TradeSync.mq5"
        );
        expect(fs.existsSync(deprecatedPath)).toBe(false);
    });

    it("B1 (Reports): getWeeklyPeriod, getMonthlyPeriod, and getPreviousPeriod use UTC boundaries without host timezone shift", async () => {
        const {
            getWeeklyPeriod,
            getMonthlyPeriod,
            getPreviousPeriod,
        } = await import("@/lib/services/report-generator.service");

        const ref = new Date("2024-04-01T12:00:00.000Z"); // Monday in UTC -> previous week is 2024-03-25..2024-03-31
        const weekly = getWeeklyPeriod(ref, "Etc/UTC", false);
        expect(weekly.start.toISOString()).toBe("2024-03-25T00:00:00.000Z");
        expect(weekly.end.toISOString()).toBe("2024-03-31T23:59:59.999Z");

        const monthly = getMonthlyPeriod(new Date("2024-04-15T12:00:00.000Z"), "Etc/UTC", false);
        expect(monthly.start.toISOString()).toBe("2024-03-01T00:00:00.000Z");
        expect(monthly.end.toISOString()).toBe("2024-03-31T23:59:59.999Z");

        const prevWeekly = getPreviousPeriod(weekly);
        expect(prevWeekly.start.toISOString()).toBe("2024-03-18T00:00:00.000Z");
        expect(prevWeekly.end.toISOString()).toBe("2024-03-24T23:59:59.999Z");
    });

    it("B8 (ZIP limit): returns 413 when compressed payload decompresses to > 5 MB", async () => {
        const zlib = await import("zlib");
        // 6 MB of repeated spaces compresses to a few kilobytes but expands > 5 MB
        const hugeJson =
            '{"accountNumber":"1001","trades":[' +
            " ".repeat(6 * 1024 * 1024) +
            "]}";
        const compressed = zlib.deflateRawSync(Buffer.from(hugeJson, "utf-8"));

        const req = new NextRequest("http://localhost/api/ea/trades", {
            method: "POST",
            headers: {
                "X-Sync-Key": "trades-test-key",
                "X-Payload-Encoding": "zip",
            },
            body: new Uint8Array(compressed),
        });

        const response = await POST(req);
        expect(response.status).toBe(413);
    });

    it("B9 (Idempotency): deduplicates identical tickets sent in the same payload without 500 error", async () => {
        tx.journalEntry.createMany.mockResolvedValueOnce({ count: 1 });

        const req = new NextRequest("http://localhost/api/ea/trades", {
            method: "POST",
            headers: { "X-Sync-Key": "trades-test-key" },
            body: JSON.stringify({
                accountNumber: "1001",
                gmtOffset: 0,
                trades: [baseTrade, { ...baseTrade }],
            }),
        });

        const response = await POST(req);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toMatchObject({
            received: 2,
            imported: 1,
            updated: 0,
            skipped: 1,
        });
        expect(body.received).toBe(body.imported + body.updated + body.skipped);
    });

    it("B1 & B6: treats '1970.01.01 00:00:00' closeTime as open position even with non-zero gmtOffset and does not shift numeric-string clientTime", async () => {
        const openWithStringZeroClose = {
            ...baseTrade,
            ticket: "open-str-zero",
            closeTime: "1970.01.01 00:00:00",
            closePrice: 0,
            profit: 0,
        };

        const response = await POST(
            makeRequest(openWithStringZeroClose, {
                gmtOffset: 10800,
                clientTime: "1711843200",
            })
        );
        expect(response.status).toBe(200);
        expect(tx.journalEntry.createMany).toHaveBeenCalledWith(
            expect.objectContaining({
                data: [
                    expect.objectContaining({
                        externalTicket: "open-str-zero",
                        status: "OPEN",
                        exitDate: null,
                        pnl: 0,
                    }),
                ],
            })
        );
        expect(tx.syncHistory.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                clientTime: new Date(1711843200 * 1000),
            }),
        });
    });

    it("B5 & B7: rejects an OPEN trade with invalid volume even when initialVolume is valid", async () => {
        const badOpenTrade = {
            ...baseTrade,
            ticket: "bad-open-vol",
            volume: "invalid-vol",
            initialVolume: 1.0,
            closeTime: 0,
            closePrice: 0,
            profit: 0,
        };

        const response = await POST(makeRequest(badOpenTrade, { gmtOffset: 0 }));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.imported).toBe(0);
        expect(body.skipped).toBe(1);
        expect(body.errors).toEqual([
            expect.objectContaining({
                ticket: "bad-open-vol",
                reason: "Invalid volume: invalid-vol",
            }),
        ]);
    });

    it("B9 & B10: in-batch deduplication prefers latest same-status snapshot and never lets trailing OPEN overwrite CLOSED", async () => {
        tx.journalEntry.createMany.mockResolvedValueOnce({ count: 2 });

        const closedEarly = {
            ...baseTrade,
            ticket: "same-closed",
            volume: 0.1,
            profit: 10,
            commission: -0.5,
        };
        const closedLate = {
            ...baseTrade,
            ticket: "same-closed",
            volume: 0.3,
            profit: 35,
            commission: -1.5,
        };
        const closedFirst = {
            ...baseTrade,
            ticket: "closed-then-open",
            volume: 0.2,
            profit: 20,
        };
        const openTrailing = {
            ...baseTrade,
            ticket: "closed-then-open",
            volume: 0.2,
            closeTime: 0,
            closePrice: 0,
            profit: 99,
        };

        const req = new NextRequest("http://localhost/api/ea/trades", {
            method: "POST",
            headers: { "X-Sync-Key": "trades-test-key" },
            body: JSON.stringify({
                accountNumber: "1001",
                gmtOffset: 0,
                trades: [closedEarly, closedLate, closedFirst, openTrailing],
            }),
        });

        const response = await POST(req);
        expect(response.status).toBe(200);
        expect(tx.journalEntry.createMany).toHaveBeenCalledWith(
            expect.objectContaining({
                data: [
                    expect.objectContaining({
                        externalTicket: "same-closed",
                        lotSize: 0.3,
                        pnl: 35,
                        commission: -1.5,
                        status: "CLOSED",
                    }),
                    expect.objectContaining({
                        externalTicket: "closed-then-open",
                        lotSize: 0.2,
                        pnl: 20,
                        status: "CLOSED",
                    }),
                ],
            })
        );
    });

    it("B1 (Reports): getWeeklyPeriod does not shift week boundary when called at Sunday 22:00 UTC with Europe/Athens timezone", async () => {
        const { getWeeklyPeriod } = await import(
            "@/lib/services/report-generator.service"
        );
        // Sunday 2024-03-31 22:00:00Z is Monday 01:00 in Europe/Athens, but still Sunday in UTC
        const sundayNightUtc = new Date("2024-03-31T22:00:00.000Z");
        const currentWeek = getWeeklyPeriod(
            sundayNightUtc,
            "Europe/Athens",
            true
        );
        expect(currentWeek.start.toISOString()).toBe("2024-03-25T00:00:00.000Z");
        expect(currentWeek.end.toISOString()).toBe("2024-03-31T23:59:59.999Z");
    });
});


