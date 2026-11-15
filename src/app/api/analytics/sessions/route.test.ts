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
        vi.mocked(getAuthUser).mockResolvedValue(mockUser as never);
        vi.mocked(prisma.journalEntry.findMany).mockResolvedValue(mockTrades as never);
        vi.mocked(resolveDefaultAccountId).mockResolvedValue("acc-default-primary");
    });

    describe("Authentication & Authorization", () => {
        it("returns 401 Unauthorized when session is unauthenticated", async () => {
            vi.mocked(getAuthUser).mockResolvedValue(null);

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

            const callArgs = vi.mocked(prisma.journalEntry.findMany).mock.calls[0][0];
            expect(callArgs?.where?.userId).toBe(mockUser.id);
            expect(callArgs?.where?.status).toBe("CLOSED");
            expect(callArgs?.where?.accountId).toBeUndefined();
            expect(callArgs?.where?.exitDate).toBeUndefined();
            // Should NOT call resolveDefaultAccountId when explicit "all" is requested
            expect(resolveDefaultAccountId).not.toHaveBeenCalled();
        });

        it("scales Cent (USC) trades to USD equivalent when accountId='all'", async () => {
            vi.mocked(prisma.journalEntry.findMany).mockResolvedValueOnce([
                {
                    id: "cent-trade-1",
                    accountId: "acc-cent",
                    account: { currency: "USC", server: "Exness-MT5Cent" },
                    pnl: 10000,
                    commission: 0,
                    swap: 0,
                    status: "CLOSED",
                    exitPrice: 1.105,
                    entryDate: new Date("2026-10-15T08:30:00Z"),
                    exitDate: new Date("2026-10-15T09:30:00Z"),
                    tradingSession: "LONDON",
                },
                {
                    id: "usd-trade-1",
                    accountId: "acc-usd",
                    account: { currency: "USD", server: "ICMarkets-Live" },
                    pnl: 50,
                    commission: 0,
                    swap: 0,
                    status: "CLOSED",
                    exitPrice: 1.106,
                    entryDate: new Date("2026-10-15T09:00:00Z"),
                    exitDate: new Date("2026-10-15T10:00:00Z"),
                    tradingSession: "LONDON",
                },
            ] as never);

            const req = new NextRequest("http://localhost:3000/api/analytics/sessions?accountId=all");
            const res = await GET(req);
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(json.currency).toBe("USD");
            const london = json.sessionStats.find(
                (s: { session: string }) => s.session === "LONDON"
            );
            // 10,000 USC ($100) + $50 USD = $150 USD (not $10,050)
            expect(london.totalPnL).toBeCloseTo(150, 2);
        });

        it("falls back to default account resolution when accountId is omitted (undefined)", async () => {
            vi.mocked(resolveDefaultAccountId).mockResolvedValue("acc-resolved-default");

            const req = new NextRequest("http://localhost:3000/api/analytics/sessions");
            const res = await GET(req);
            expect(res.status).toBe(200);

            expect(resolveDefaultAccountId).toHaveBeenCalledWith(mockUser.id, undefined);
            const callArgs = vi.mocked(prisma.journalEntry.findMany).mock.calls[0][0];
            expect(callArgs?.where?.accountId).toBe("acc-resolved-default");
            expect(callArgs?.where?.exitDate).toBeUndefined();
        });

        it("falls back to default account resolution when accountId is empty string", async () => {
            vi.mocked(resolveDefaultAccountId).mockResolvedValue("acc-resolved-from-empty");

            const req = new NextRequest("http://localhost:3000/api/analytics/sessions?accountId=");
            const res = await GET(req);
            expect(res.status).toBe(200);

            expect(resolveDefaultAccountId).toHaveBeenCalledWith(mockUser.id, undefined);
            const callArgs = vi.mocked(prisma.journalEntry.findMany).mock.calls[0][0];
            expect(callArgs?.where?.accountId).toBe("acc-resolved-from-empty");
        });

        it("leaves accountId omitted if default account resolver returns null (no accounts registered)", async () => {
            vi.mocked(resolveDefaultAccountId).mockResolvedValue(null as never);

            const req = new NextRequest("http://localhost:3000/api/analytics/sessions");
            const res = await GET(req);
            expect(res.status).toBe(200);

            const callArgs = vi.mocked(prisma.journalEntry.findMany).mock.calls[0][0];
            expect(callArgs?.where?.accountId).toBeUndefined();
        });

        it("leaves accountId omitted if default account resolver returns 'all'", async () => {
            vi.mocked(resolveDefaultAccountId).mockResolvedValue("all");

            const req = new NextRequest("http://localhost:3000/api/analytics/sessions");
            const res = await GET(req);
            expect(res.status).toBe(200);

            const callArgs = vi.mocked(prisma.journalEntry.findMany).mock.calls[0][0];
            expect(callArgs?.where?.accountId).toBeUndefined();
        });

        it("filters by valid CUID without invoking default account resolver", async () => {
            const validCuid = "cm39xyz12000008l4defg5678";
            const req = new NextRequest(
                `http://localhost:3000/api/analytics/sessions?accountId=${validCuid}`
            );
            const res = await GET(req);
            expect(res.status).toBe(200);

            expect(resolveDefaultAccountId).not.toHaveBeenCalled();
            const callArgs = vi.mocked(prisma.journalEntry.findMany).mock.calls[0][0];
            expect(callArgs?.where?.accountId).toBe(validCuid);
        });

        it("safely binds SQL injection attempts as literal accountId without query corruption", async () => {
            const sqlInjection = "' OR 1=1; DROP TABLE trades; --";
            const req = new NextRequest(
                `http://localhost:3000/api/analytics/sessions?accountId=${encodeURIComponent(sqlInjection)}`
            );
            const res = await GET(req);
            expect(res.status).toBe(200);

            const callArgs = vi.mocked(prisma.journalEntry.findMany).mock.calls[0][0];
            expect(callArgs?.where?.accountId).toBe(sqlInjection);
            expect(callArgs?.where?.userId).toBe(mockUser.id);
            expect(callArgs?.where?.status).toBe("CLOSED");
        });

        it("safely binds XSS payload strings as literal accountId strings", async () => {
            const xssPayload = "<script>alert(document.cookie)</script>";
            const req = new NextRequest(
                `http://localhost:3000/api/analytics/sessions?accountId=${encodeURIComponent(xssPayload)}`
            );
            const res = await GET(req);
            expect(res.status).toBe(200);

            const callArgs = vi.mocked(prisma.journalEntry.findMany).mock.calls[0][0];
            expect(callArgs?.where?.accountId).toBe(xssPayload);
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
