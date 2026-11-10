import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
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

const originalWorkerKey = process.env.WORKER_API_KEY;

describe("POST /api/worker/jobs/submit", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.WORKER_API_KEY = "worker-test-key";

        vi.mocked(prisma.mt5ImportJob.findUnique).mockResolvedValue({
            id: "job-123",
            userId: "user-1",
            accountId: "acc-1",
            mode: "30",
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
    });

    afterAll(() => {
        if (originalWorkerKey === undefined) {
            delete process.env.WORKER_API_KEY;
        } else {
            process.env.WORKER_API_KEY = originalWorkerKey;
        }
    });

    it("records CLOUD_WORKER sync on the journal and account", async () => {
        const request = new NextRequest(
            "http://localhost/api/worker/jobs/submit",
            {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-worker-key": "worker-test-key",
                },
                body: JSON.stringify({
                    jobId: "job-123",
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
                syncSource: "CLOUD_WORKER",
            }),
        });
        expect(prisma.tradingAccount.update).toHaveBeenCalledWith({
            where: { id: "acc-1" },
            data: expect.objectContaining({
                syncSource: "CLOUD_WORKER",
            }),
        });
    });

    it("does not overwrite an existing broker with worker-reported company", async () => {
        vi.mocked(prisma.mt5ImportJob.findUnique).mockResolvedValue({
            id: "job-123",
            userId: "user-1",
            accountId: "acc-1",
            mode: "30",
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
                    jobId: "job-123",
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
