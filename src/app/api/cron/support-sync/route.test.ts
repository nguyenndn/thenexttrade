import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { GET } from "./route";

vi.mock("@/lib/api-auth", () => ({
    requireCronSecret: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
    prisma: {
        supportSyncTicket: {
            findMany: vi.fn(),
        },
        mt5ImportJob: {
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
        },
    },
}));

const ticket = {
    id: "ticket-123",
    userId: "user-1",
    tradingAccountId: "acc-1",
    accountNumber: "12345678",
};

describe("GET /api/cron/support-sync", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(requireCronSecret).mockReturnValue(true);
    });

    it("creates one SUPPORT_SYNC job for a due ticket", async () => {
        vi.mocked(prisma.supportSyncTicket.findMany).mockResolvedValue([
            ticket,
        ] as never);
        vi.mocked(prisma.mt5ImportJob.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.mt5ImportJob.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.mt5ImportJob.create).mockResolvedValue({} as never);

        const req = new NextRequest("http://localhost/api/cron/support-sync");
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.jobsCreated).toBe(1);
        expect(prisma.mt5ImportJob.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                id: "support_ticket-123",
                userId: "user-1",
                accountId: "acc-1",
                mode: "SUPPORT_SYNC",
                status: "PENDING",
            }),
        });
    });

    it("skips a ticket that already has an active Support Sync job", async () => {
        vi.mocked(prisma.supportSyncTicket.findMany).mockResolvedValue([
            ticket,
        ] as never);
        vi.mocked(prisma.mt5ImportJob.findFirst).mockResolvedValue({
            id: "support_existing",
        } as never);

        const req = new NextRequest("http://localhost/api/cron/support-sync");
        const res = await GET(req);
        const body = await res.json();

        expect(body.jobsCreated).toBe(0);
        expect(body.ticketsSkipped).toBe(1);
        expect(prisma.mt5ImportJob.create).not.toHaveBeenCalled();
    });

    it("skips a ticket whose deterministic job id already exists", async () => {
        vi.mocked(prisma.supportSyncTicket.findMany).mockResolvedValue([
            ticket,
        ] as never);
        vi.mocked(prisma.mt5ImportJob.findFirst).mockResolvedValue(null);
        vi.mocked(prisma.mt5ImportJob.findUnique).mockResolvedValue({
            id: "support_ticket-123",
        } as never);

        const req = new NextRequest("http://localhost/api/cron/support-sync");
        const res = await GET(req);
        const body = await res.json();

        expect(body.jobsCreated).toBe(0);
        expect(body.ticketsSkipped).toBe(1);
        expect(prisma.mt5ImportJob.create).not.toHaveBeenCalled();
    });

    it("rejects an unauthorized cron request", async () => {
        vi.mocked(requireCronSecret).mockReturnValue(
            NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        );

        const req = new NextRequest("http://localhost/api/cron/support-sync");
        const res = await GET(req);

        expect(res.status).toBe(401);
        expect(prisma.supportSyncTicket.findMany).not.toHaveBeenCalled();
    });
});
