import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { resolveDefaultAccountId } from "@/actions/main-account";
import { GET } from "./route";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        journalEntry: {
            findMany: vi.fn(),
        },
    },
}));

vi.mock("@/lib/auth-cache", () => ({
    getAuthUser: vi.fn(),
}));

vi.mock("@/actions/main-account", () => ({
    resolveDefaultAccountId: vi.fn(),
}));

describe("Session Analytics API Route - Backend Logic & Edge Case Stress Testing", () => {
    const mockUser = {
        id: "user-session-challenger",
        email: "session-challenger@example.com",
    };

    const mockTrades = [
        {
            id: "trade-1",
            pnl: 100,
            commission: -2,
            swap: -1,
            status: "CLOSED",
            exitPrice: 1.105,
            entryDate: new Date("2026-10-15T14:30:00Z"),
            tradingSession: "LONDON_NY_OVERLAP",
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (getAuthUser as any).mockResolvedValue(mockUser);
        (prisma.journalEntry.findMany as any).mockResolvedValue(mockTrades);
        (resolveDefaultAccountId as any).mockResolvedValue("acc-default-primary");
    });

    describe("Authentication & Authorization", () => {
        it("returns 401 Unauthorized when session is unauthenticated", async () => {
            (getAuthUser as any).mockResolvedValue(null);

            const req = new NextRequest("http://localhost:3000/api/analytics/sessions");
            const res = await GET(req);
            const json = await res.json();

            expect(res.status).toBe(401);
            expect(json.error).toBe("Unauthorized");
            expect(prisma.journalEntry.findMany).not.toHaveBeenCalled();
        });

        it("always scopes database query to the authenticated userId", async () => {
            const req = new NextRequest(
                "http://localhost:3000/api/analytics/sessions?accountId=target-victim-account"
            );
            await GET(req);

            expect(prisma.journalEntry.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        userId: mockUser.id,
                        accountId: "target-victim-account",
                        status: "CLOSED",
                    }),
                })
            );
        });
    });

    describe("accountId Parameter Filter Testing", () => {
        it('omits accountId in whereClause when accountId="all" to aggregate across all accounts', async () => {
            const req = new NextRequest("http://localhost:3000/api/analytics/sessions?accountId=all");
            const res = await GET(req);
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(json.sessionStats).toBeDefined();

            const callArgs = (prisma.journalEntry.findMany as any).mock.calls[0][0];
            expect(callArgs.where.userId).toBe(mockUser.id);
            expect(callArgs.where.status).toBe("CLOSED");
            expect(callArgs.where.accountId).toBeUndefined();
            // Should NOT call resolveDefaultAccountId when explicit "all" is requested
            expect(resolveDefaultAccountId).not.toHaveBeenCalled();
        });

        it("falls back to default account resolution when accountId is omitted (undefined)", async () => {
            (resolveDefaultAccountId as any).mockResolvedValue("acc-resolved-default");

            const req = new NextRequest("http://localhost:3000/api/analytics/sessions");
            const res = await GET(req);
            expect(res.status).toBe(200);

            expect(resolveDefaultAccountId).toHaveBeenCalledWith(mockUser.id, undefined);
            const callArgs = (prisma.journalEntry.findMany as any).mock.calls[0][0];
            expect(callArgs.where.accountId).toBe("acc-resolved-default");
        });

        it("falls back to default account resolution when accountId is empty string", async () => {
            (resolveDefaultAccountId as any).mockResolvedValue("acc-resolved-from-empty");

            const req = new NextRequest("http://localhost:3000/api/analytics/sessions?accountId=");
            const res = await GET(req);
            expect(res.status).toBe(200);

            expect(resolveDefaultAccountId).toHaveBeenCalledWith(mockUser.id, undefined);
            const callArgs = (prisma.journalEntry.findMany as any).mock.calls[0][0];
            expect(callArgs.where.accountId).toBe("acc-resolved-from-empty");
        });

        it("leaves accountId omitted if default account resolver returns null (no accounts registered)", async () => {
            (resolveDefaultAccountId as any).mockResolvedValue(null);

            const req = new NextRequest("http://localhost:3000/api/analytics/sessions");
            const res = await GET(req);
            expect(res.status).toBe(200);

            const callArgs = (prisma.journalEntry.findMany as any).mock.calls[0][0];
            expect(callArgs.where.accountId).toBeUndefined();
        });

        it("leaves accountId omitted if default account resolver returns 'all'", async () => {
            (resolveDefaultAccountId as any).mockResolvedValue("all");

            const req = new NextRequest("http://localhost:3000/api/analytics/sessions");
            const res = await GET(req);
            expect(res.status).toBe(200);

            const callArgs = (prisma.journalEntry.findMany as any).mock.calls[0][0];
            expect(callArgs.where.accountId).toBeUndefined();
        });

        it("filters by valid CUID without invoking default account resolver", async () => {
            const validCuid = "cm39xyz12000008l4defg5678";
            const req = new NextRequest(
                `http://localhost:3000/api/analytics/sessions?accountId=${validCuid}`
            );
            const res = await GET(req);
            expect(res.status).toBe(200);

            expect(resolveDefaultAccountId).not.toHaveBeenCalled();
            const callArgs = (prisma.journalEntry.findMany as any).mock.calls[0][0];
            expect(callArgs.where.accountId).toBe(validCuid);
        });

        it("safely binds SQL injection attempts as literal accountId without query corruption", async () => {
            const sqlInjection = "' OR 1=1; DROP TABLE trades; --";
            const req = new NextRequest(
                `http://localhost:3000/api/analytics/sessions?accountId=${encodeURIComponent(sqlInjection)}`
            );
            const res = await GET(req);
            expect(res.status).toBe(200);

            const callArgs = (prisma.journalEntry.findMany as any).mock.calls[0][0];
            expect(callArgs.where.accountId).toBe(sqlInjection);
            expect(callArgs.where.userId).toBe(mockUser.id);
            expect(callArgs.where.status).toBe("CLOSED");
        });

        it("safely binds XSS payload strings as literal accountId strings", async () => {
            const xssPayload = "<script>alert(document.cookie)</script>";
            const req = new NextRequest(
                `http://localhost:3000/api/analytics/sessions?accountId=${encodeURIComponent(xssPayload)}`
            );
            const res = await GET(req);
            expect(res.status).toBe(200);

            const callArgs = (prisma.journalEntry.findMany as any).mock.calls[0][0];
            expect(callArgs.where.accountId).toBe(xssPayload);
        });
    });

    describe("Cookie Forwarding for Default Account Resolution", () => {
        it("passes last_account_id cookie value to resolveDefaultAccountId", async () => {
            const req = new NextRequest("http://localhost:3000/api/analytics/sessions", {
                headers: {
                    cookie: "last_account_id=acc-cookie-preferred",
                },
            });
            await GET(req);

            expect(resolveDefaultAccountId).toHaveBeenCalledWith(
                mockUser.id,
                "acc-cookie-preferred"
            );
        });
    });
});
