import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getInvestorPasswordForAccount } from "@/lib/credentials/investor-password.server";
import { failSupportSyncTicket } from "@/lib/services/support-sync-jobs.server";
import { GET } from "./route";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        mt5ImportJob: {
            findFirst: vi.fn(),
            update: vi.fn(),
        },
    },
}));

vi.mock("@/lib/credentials/investor-password.server", () => ({
    getInvestorPasswordForAccount: vi.fn(),
}));

vi.mock("@/lib/services/support-sync-jobs.server", () => ({
    failSupportSyncTicket: vi.fn(),
    getSupportTicketIdFromJobId: (jobId: string) =>
        jobId.startsWith("support_") ? jobId.slice("support_".length) : null,
    SUPPORT_SYNC_MODE: "SUPPORT_SYNC",
}));

const originalWorkerKey = process.env.WORKER_API_KEY;

describe("GET /api/worker/jobs/pull", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.WORKER_API_KEY = "worker-test-key";
        vi.mocked(failSupportSyncTicket).mockResolvedValue(true);
        vi.mocked(prisma.mt5ImportJob.update).mockResolvedValue({} as never);
        vi.mocked(prisma.mt5ImportJob.findFirst).mockResolvedValue({
            id: "support_ticket-123",
            userId: "user-1",
            accountId: "acc-1",
            mode: "SUPPORT_SYNC",
            rangeFrom: new Date("2026-09-01T00:00:00Z"),
            rangeTo: new Date("2026-10-01T00:00:00Z"),
            account: {
                id: "acc-1",
                accountNumber: "12345678",
                server: "Vantage-Live",
                broker: "Vantage",
                credential: null,
            },
        } as never);
    });

    afterAll(() => {
        if (originalWorkerKey === undefined) {
            delete process.env.WORKER_API_KEY;
        } else {
            process.env.WORKER_API_KEY = originalWorkerKey;
        }
    });

    it.each([
        {
            reason: "NO_CREDENTIALS",
            errorCode: "NO_CREDENTIALS",
            message: "No investor password configured for this account.",
        },
        {
            reason: "DECRYPTION_FAILED",
            errorCode: "CREDENTIAL_DECRYPTION_FAILED",
            message:
                "Investor credential could not be decrypted. Please re-enter it for this account.",
        },
    ])(
        "fails both the job and Support ticket when credentials return $reason",
        async ({ reason, errorCode, message }) => {
            vi.mocked(getInvestorPasswordForAccount).mockResolvedValue({
                ok: false,
                reason: reason as "NO_CREDENTIALS" | "DECRYPTION_FAILED",
            });

            const request = new NextRequest(
                "http://localhost/api/worker/jobs/pull",
                { headers: { "x-worker-key": "worker-test-key" } }
            );
            const response = await GET(request);
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(body.job).toBeNull();
            expect(prisma.mt5ImportJob.update).toHaveBeenCalledWith({
                where: { id: "support_ticket-123" },
                data: expect.objectContaining({
                    status: "FAILED",
                    errorCode,
                    errorMessage: message,
                }),
            });
            expect(failSupportSyncTicket).toHaveBeenCalledWith({
                ticketId: "ticket-123",
                errorCode,
                errorMessage: message,
            });
        }
    );
});
