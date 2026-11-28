import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { resolveDefaultAccountId } from "@/actions/main-account";
import { GET } from "./route";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        tradingAccount: {
            findMany: vi.fn(),
        },
        $queryRaw: vi.fn(),
    },
}));

vi.mock("@/lib/auth-cache", () => ({
    getAuthUser: vi.fn(),
}));

vi.mock("@/actions/main-account", () => ({
    resolveDefaultAccountId: vi.fn(),
}));

type SqlCall = { strings: string[]; values: unknown[] };

function sqlCalls(): SqlCall[] {
    return vi
        .mocked(prisma.$queryRaw)
        .mock.calls.map((call) => call[0] as unknown as SqlCall);
}

function sqlText(call: SqlCall): string {
    return call.strings.join("?");
}

const mockUser = {
    id: "user-session-challenger",
    email: "session-challenger@example.com",
};

const mockAccounts = [
    { id: "acc-cent", currency: "USC", server: "Exness-MT5Cent" },
    { id: "acc-usd", currency: "USD", server: "ICMarkets-Live" },
];

const sessionAggRows = [
    {
        session: "LONDON",
        totalTrades: 3,
        winCount: 2,
        lossCount: 1,
        totalPnL: 150,
        grossProfit: 200,
        grossLoss: 50,
    },
];

const hourAggRows = [{ hour: 8, totalTrades: 3, winCount: 2, totalPnL: 150 }];

describe("Session Analytics API Route - SQL aggregation contract", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getAuthUser).mockResolvedValue(mockUser as never);
        vi.mocked(resolveDefaultAccountId).mockResolvedValue("acc-default-primary");
        vi.mocked(prisma.tradingAccount.findMany).mockResolvedValue(
            mockAccounts as never
        );
        vi.mocked(prisma.$queryRaw)
            .mockResolvedValueOnce(sessionAggRows as never)
            .mockResolvedValueOnce(hourAggRows as never);
    });

    it("returns 401 Unauthorized when unauthenticated and runs no SQL", async () => {
        vi.mocked(getAuthUser).mockResolvedValue(null);

        const req = new NextRequest("http://localhost:3000/api/analytics/sessions");
        const res = await GET(req);
        const json = await res.json();

        expect(res.status).toBe(401);
        expect(json.error).toBe("Unauthorized");
        expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it("queries the mapped trading_session column (not the Prisma field name)", async () => {
        const req = new NextRequest("http://localhost:3000/api/analytics/sessions");
        await GET(req);

        const [sessionQuery] = sqlCalls();
        expect(sqlText(sessionQuery)).toContain('je."trading_session"');
        expect(sqlText(sessionQuery)).not.toContain("tradingSession");
    });

    it("keeps net_pnl at full precision and classifies wins/losses at ±0.01", async () => {
        const req = new NextRequest("http://localhost:3000/api/analytics/sessions");
        await GET(req);

        const [sessionQuery, hourQuery] = sqlCalls();
        for (const call of [sessionQuery, hourQuery]) {
            expect(sqlText(call)).toContain("net_pnl > 0.01");
        }
        expect(sqlText(sessionQuery)).toContain("net_pnl < -0.01");
        // Totals are summed at full precision; the only rounding left is the
        // per-trade ROUND(..., 4) that keeps float noise from flipping a
        // break-even. A ROUND(SUM(...)) would reintroduce display rounding here.
        const text = sqlText(sessionQuery);
        expect(text).toContain("ROUND(");
        expect(text).toMatch(/ROUND\(\s*\(/);
        expect(text).not.toMatch(/ROUND\(\s*(COALESCE\(\s*)?SUM\(/);
    });

    it("scopes both aggregates to the authenticated user and CLOSED trades", async () => {
        const req = new NextRequest(
            "http://localhost:3000/api/analytics/sessions?accountId=acc-usd"
        );
        await GET(req);

        const calls = sqlCalls();
        expect(calls).toHaveLength(2);
        for (const call of calls) {
            const text = sqlText(call);
            expect(text).toContain('je."userId"');
            expect(text).toContain('je."status"');
            expect(text).toContain('je."accountId" =');
            expect(call.values).toContain(mockUser.id);
            expect(text).toContain("'CLOSED'");
            expect(call.values).toContain("acc-usd");
            // Single-account mode reports native currency: no FX/Cent rates CTE
            expect(text).not.toContain("rates(account_id, rate)");
        }
    });

    it("aggregates across all accounts with per-account FX/Cent rates", async () => {
        const req = new NextRequest(
            "http://localhost:3000/api/analytics/sessions?accountId=all"
        );
        const res = await GET(req);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.currency).toBe("USD");
        expect(resolveDefaultAccountId).not.toHaveBeenCalled();

        const [sessionQuery] = sqlCalls();
        expect(sqlText(sessionQuery)).toContain("rates(account_id, rate)");
        expect(sqlText(sessionQuery)).not.toContain('je."accountId" =');
        // USC account contributes a 0.01 USD rate; the USD account 1.0
        expect(sessionQuery.values).toContain(0.01);
        expect(sessionQuery.values).toContain(1);
        expect(sessionQuery.values).toContain("acc-cent");
        expect(sessionQuery.values).toContain("acc-usd");
    });

    it("reports the single account's native currency without converting", async () => {
        const req = new NextRequest(
            "http://localhost:3000/api/analytics/sessions?accountId=acc-cent"
        );
        const res = await GET(req);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.currency).toBe("USC");
        // Mocked aggregate is returned unchanged (no JS-side conversion)
        expect(json.sessionStats[0].totalPnL).toBe(150);
    });

    it("resolves the default account when accountId is omitted", async () => {
        vi.mocked(resolveDefaultAccountId).mockResolvedValue("acc-resolved-default");

        const req = new NextRequest("http://localhost:3000/api/analytics/sessions");
        await GET(req);

        expect(resolveDefaultAccountId).toHaveBeenCalledWith(mockUser.id, undefined);
        const [sessionQuery] = sqlCalls();
        expect(sessionQuery.values).toContain("acc-resolved-default");
    });

    it("passes the last_account_id cookie to default account resolution", async () => {
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

    it.each([
        ["null (no accounts registered)", null],
        ["'all'", "all"],
    ])(
        "omits the account filter when the default resolver returns %s",
        async (_label, resolved) => {
            vi.mocked(resolveDefaultAccountId).mockResolvedValue(resolved as never);

            const req = new NextRequest("http://localhost:3000/api/analytics/sessions");
            const res = await GET(req);
            expect(res.status).toBe(200);

            const [sessionQuery] = sqlCalls();
            expect(sqlText(sessionQuery)).not.toContain('je."accountId" =');
        }
    );

    it("binds an injection payload as a value, never inside the SQL text", async () => {
        const sqlInjection = "' OR 1=1; DROP TABLE journal_entries; --";
        const req = new NextRequest(
            `http://localhost:3000/api/analytics/sessions?accountId=${encodeURIComponent(sqlInjection)}`
        );
        const res = await GET(req);
        expect(res.status).toBe(200);

        for (const call of sqlCalls()) {
            expect(sqlText(call)).not.toContain(sqlInjection);
            expect(call.values).toContain(sqlInjection);
        }
    });

    it("binds an XSS payload as a literal value", async () => {
        const xssPayload = "<script>alert(document.cookie)</script>";
        const req = new NextRequest(
            `http://localhost:3000/api/analytics/sessions?accountId=${encodeURIComponent(xssPayload)}`
        );
        const res = await GET(req);
        expect(res.status).toBe(200);

        const [sessionQuery] = sqlCalls();
        expect(sqlText(sessionQuery)).not.toContain(xssPayload);
        expect(sessionQuery.values).toContain(xssPayload);
    });

    it("passes date-range bounds as bound Date parameters", async () => {
        const req = new NextRequest(
            "http://localhost:3000/api/analytics/sessions?startDate=2026-01-01&endDate=2026-01-31"
        );
        await GET(req);

        const [sessionQuery] = sqlCalls();
        const text = sqlText(sessionQuery);
        expect(text).toContain('je."exitDate" >=');
        expect(text).toContain('je."exitDate" <=');
        expect(sessionQuery.values.filter((v) => v instanceof Date)).toHaveLength(2);
    });

    it("shapes session and hourly aggregates with the expected derived fields", async () => {
        const req = new NextRequest("http://localhost:3000/api/analytics/sessions");
        const res = await GET(req);
        const json = await res.json();

        expect(json.sessionStats[0]).toMatchObject({
            session: "LONDON",
            displayName: "London",
            totalTrades: 3,
            winCount: 2,
            lossCount: 1,
            totalPnL: 150,
        });
        expect(json.sessionStats[0].winRate).toBeCloseTo((2 / 3) * 100, 6);
        expect(json.sessionStats[0].profitFactor).toBeCloseTo(4, 6);
        expect(json.hourlyStats).toHaveLength(24);
        expect(json.hourlyStats[8]).toMatchObject({
            hour: 8,
            hourLabel: "08:00",
            totalTrades: 3,
            totalPnL: 150,
        });
        expect(json.hourlyStats[0]).toMatchObject({ totalTrades: 0, totalPnL: 0 });
    });
});
