import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySupportSyncTicket } from "@/lib/services/support-sync-jobs.server";
import { POST } from "./route";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        mt5ImportJob: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        tradingAccount: {
            update: vi.fn(),
        },
        journalEntry: {
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
    },
}));

vi.mock("@/lib/importers", () => ({
    generateTradeHash: vi.fn().mockReturnValue("mock-hash"),
}));

vi.mock("@/lib/utils/trade-classification", () => ({
    classifyTradeResult: vi.fn().mockReturnValue("WIN"),
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

vi.mock("@/lib/services/support-sync-jobs.server", () => ({
    getSupportTicketIdFromJobId: (jobId: string) =>
        jobId.startsWith("support_") ? jobId.slice("support_".length) : null,
    SUPPORT_SYNC_MODE: "SUPPORT_SYNC",
    verifySupportSyncTicket: vi.fn(),
}));

const originalWorkerKey = process.env.WORKER_API_KEY;

describe("POST /api/worker/jobs/submit", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.WORKER_API_KEY = "worker-test-key";

        vi.mocked(prisma.mt5ImportJob.findUnique).mockResolvedValue({
            id: "support_ticket-123",
            userId: "user-1",
            accountId: "acc-1",
            mode: "SUPPORT_SYNC",
            account: {
                id: "acc-1",
                broker: "Vantage",
                server: "Vantage-Live",
                currency: "USD",
            },
        } as never);
        vi.mocked(prisma.journalEntry.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.journalEntry.create).mockResolvedValue({} as never);
        vi.mocked(prisma.tradingAccount.update).mockResolvedValue({} as never);
        vi.mocked(prisma.mt5ImportJob.update).mockResolvedValue({} as never);
        vi.mocked(verifySupportSyncTicket).mockResolvedValue(true);
    });

    afterAll(() => {
        if (originalWorkerKey === undefined) {
            delete process.env.WORKER_API_KEY;
        } else {
            process.env.WORKER_API_KEY = originalWorkerKey;
        }
    });

    it("records Support Sync on the journal, account, and ticket", async () => {
        const request = new NextRequest(
            "http://localhost/api/worker/jobs/submit",
            {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-worker-key": "worker-test-key",
                },
                body: JSON.stringify({
                    jobId: "support_ticket-123",
                    balance: 500,
                    deals: [
                        {
                            ticket: "deal-1",
                            symbol: "EURUSD",
                            type: "BUY",
                            lots: 0.5,
                            openTime: "2026-09-01T08:00:00Z",
                            openPrice: 1.1,
                            closeTime: "2026-09-01T09:00:00Z",
                            closePrice: 1.11,
                            profit: 50,
                            commission: -1,
                            swap: -0.5,
                        },
                    ],
                }),
            }
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.imported).toBe(1);
        expect(prisma.journalEntry.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                accountId: "acc-1",
                syncSource: "SUPPORT_SYNC",
            }),
        });
        expect(prisma.tradingAccount.update).toHaveBeenCalledWith({
            where: { id: "acc-1" },
            data: expect.objectContaining({
                syncSource: "SUPPORT_SYNC",
            }),
        });
        expect(verifySupportSyncTicket).toHaveBeenCalledWith({
            ticketId: "ticket-123",
            imported: 1,
            updated: 0,
            totalDeals: 1,
        });
    });

    it("does not overwrite an existing broker with worker-reported company", async () => {
        vi.mocked(prisma.mt5ImportJob.findUnique).mockResolvedValue({
            id: "support_ticket-123",
            userId: "user-1",
            accountId: "acc-1",
            mode: "SUPPORT_SYNC",
            account: {
                id: "acc-1",
                broker: "Vantage",
                server: "Vantage-Live",
                currency: "USD",
            },
        } as never);

        const request = new NextRequest(
            "http://localhost/api/worker/jobs/submit",
            {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-worker-key": "worker-test-key",
                },
                body: JSON.stringify({
                    jobId: "support_ticket-123",
                    company: "Exness Technologies Ltd",
                    deals: [],
                }),
            }
        );

        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(prisma.tradingAccount.update).toHaveBeenCalledWith({
            where: { id: "acc-1" },
            data: expect.not.objectContaining({ broker: expect.anything() }),
        });
    });
});
