import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import { resolveSyncAuth } from "@/lib/sync-auth";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        tradingAccount: {
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        proEntitlement: {
            upsert: vi.fn(),
            update: vi.fn(),
        },
    },
}));

vi.mock("@/lib/sync-auth", () => ({
    resolveSyncAuth: vi.fn(),
}));

describe("POST /api/ea/heartbeat security", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("does NOT grant proEntitlement or set fundingVerifiedAt when client sends real account with >= $300", async () => {
        vi.mocked(resolveSyncAuth).mockResolvedValue({
            success: true,
            data: {
                user: { id: "user-123" } as any,
                account: {
                    id: "acct-123",
                    accountNumber: "1001",
                    autoSync: true,
                } as any,
                authMode: "LEGACY_ACCOUNT_KEY",
            },
        });

        // Account is currently unverified
        vi.mocked(prisma.tradingAccount.findUnique).mockResolvedValue({
            id: "acct-123",
            timezone: "UTC",
            fundingVerifiedAt: null,
            fundingGraceUntil: null,
            broker: "Vantage Markets",
        } as any);

        vi.mocked(prisma.tradingAccount.update).mockResolvedValue({} as any);

        const req = new NextRequest("http://localhost/api/ea/heartbeat", {
            method: "POST",
            body: JSON.stringify({
                eaVersion: "1.0",
                accountNumber: "1001",
                balance: 5000,
                equity: 5000,
                accountTradeMode: "REAL",
                broker: "Vantage",
                server: "Vantage-Live",
                currency: "USD",
            }),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);

        // Security assertion 1: proEntitlement.upsert must NEVER be called from heartbeat
        expect(prisma.proEntitlement.upsert).not.toHaveBeenCalled();

        // Security assertion 2: tradingAccount.update must NOT set fundingVerifiedAt or fundingAmount
        expect(prisma.tradingAccount.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: "acct-123" },
                data: expect.not.objectContaining({
                    fundingVerifiedAt: expect.anything(),
                    fundingAmount: expect.anything(),
                }),
            })
        );

        // Only telemetry fundingLastVerifiedAt should be recorded
        expect(prisma.tradingAccount.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    fundingLastVerifiedAt: expect.any(Date),
                }),
            })
        );
    });
});
