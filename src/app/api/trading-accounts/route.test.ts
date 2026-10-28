import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { getUserProAccess } from "@/lib/pro-access";
import { notifyAdminsOfNewAccount } from "@/lib/admin/admin-notification.server";
import { GET, POST } from "./route";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        tradingAccount: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            count: vi.fn(),
        },
        user: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        profile: {
            findUnique: vi.fn().mockResolvedValue(null),
        },
    },
}));

vi.mock("@/lib/auth-cache", () => ({
    getAuthUser: vi.fn(),
}));

vi.mock("@/lib/pro-access", () => ({
    getUserProAccess: vi.fn(),
}));

vi.mock("@/lib/admin/admin-notification.server", () => ({
    notifyAdminsOfNewAccount: vi.fn().mockResolvedValue(undefined),
}));

describe("Trading Accounts API Route", () => {
    const mockUser = {
        id: "api-user-1",
        email: "api@example.com",
        name: "API Tester",
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (getAuthUser as any).mockResolvedValue(mockUser);
    });

    describe("GET /api/trading-accounts", () => {
        it("returns 401 when not authenticated", async () => {
            (getAuthUser as any).mockResolvedValue(null);

            const req = new NextRequest("http://localhost:3000/api/trading-accounts");
            const res = await GET(req);
            const json = await res.json();

            expect(res.status).toBe(401);
            expect(json.error).toBe("Unauthorized");
        });

        it("returns paginated trading accounts when authenticated", async () => {
            (prisma.tradingAccount.count as any).mockResolvedValue(1);
            (prisma.tradingAccount.findMany as any).mockResolvedValue([
                {
                    id: "acc-1",
                    name: "MT5 Demo",
                    platform: "MT5",
                    broker: "Exness",
                    accountNumber: "123456",
                    trades: [],
                    cloudSyncJob: null,
                    proEntitlement: null,
                    vipRequests: [],
                },
            ]);

            const req = new NextRequest("http://localhost:3000/api/trading-accounts?page=1&limit=10");
            const res = await GET(req);
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(json.accounts).toHaveLength(1);
            expect(json.meta.total).toBe(1);
        });
    });

    describe("POST /api/trading-accounts", () => {
        it("returns 401 when not authenticated", async () => {
            (getAuthUser as any).mockResolvedValue(null);

            const req = new NextRequest("http://localhost:3000/api/trading-accounts", {
                method: "POST",
                body: JSON.stringify({ platform: "MT5" }),
            });
            const res = await POST(req);
            const json = await res.json();

            expect(res.status).toBe(401);
            expect(json.error).toBe("Unauthorized");
        });

        it("returns 400 for invalid platform", async () => {
            const req = new NextRequest("http://localhost:3000/api/trading-accounts", {
                method: "POST",
                body: JSON.stringify({ platform: "NINJATRADER" }),
            });
            const res = await POST(req);
            const json = await res.json();

            expect(res.status).toBe(400);
            expect(json.error).toContain("Invalid platform");
        });

        it("returns 403 when free tier user already has 2 accounts", async () => {
            (prisma.user.findUnique as any).mockResolvedValue({ syncApiKey: "EXISTING_KEY" });
            (prisma.tradingAccount.count as any).mockResolvedValue(2);
            (getUserProAccess as any).mockResolvedValue({ isPro: false });

            const req = new NextRequest("http://localhost:3000/api/trading-accounts", {
                method: "POST",
                body: JSON.stringify({
                    platform: "MT5",
                    broker: "Exness",
                    accountNumber: "998877",
                }),
            });
            const res = await POST(req);
            const json = await res.json();

            expect(res.status).toBe(403);
            expect(json.error).toContain("Free tier is limited to 2 connected accounts");
            expect(prisma.tradingAccount.create).not.toHaveBeenCalled();
        });

        it("allows creating 3rd account when user has active Pro access", async () => {
            (prisma.user.findUnique as any).mockResolvedValue({ syncApiKey: "EXISTING_KEY" });
            (prisma.tradingAccount.count as any).mockResolvedValue(2);
            (getUserProAccess as any).mockResolvedValue({ isPro: true });
            (prisma.tradingAccount.findFirst as any).mockResolvedValue(null);

            (prisma.tradingAccount.create as any).mockResolvedValue({
                id: "acc-pro-3",
                userId: mockUser.id,
                name: "MT5 Account",
                platform: "MT5",
                broker: "Exness",
                accountNumber: "998877",
            });

            const req = new NextRequest("http://localhost:3000/api/trading-accounts", {
                method: "POST",
                body: JSON.stringify({
                    platform: "MT5",
                    broker: "Exness",
                    accountNumber: "998877",
                }),
            });
            const res = await POST(req);
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(json.success).toBe(true);
            expect(json.account.id).toBe("acc-pro-3");
            expect(notifyAdminsOfNewAccount).toHaveBeenCalled();
        });

        it("returns 400 when account number is already registered under the user", async () => {
            (prisma.user.findUnique as any).mockResolvedValue({ syncApiKey: "EXISTING_KEY" });
            (prisma.tradingAccount.count as any).mockResolvedValue(1);
            (prisma.tradingAccount.findFirst as any).mockResolvedValue({ id: "existing-acc" });

            const req = new NextRequest("http://localhost:3000/api/trading-accounts", {
                method: "POST",
                body: JSON.stringify({
                    platform: "MT5",
                    broker: "Exness",
                    accountNumber: "123456",
                }),
            });
            const res = await POST(req);
            const json = await res.json();

            expect(res.status).toBe(400);
            expect(json.error).toContain("already exists");
        });
    });
});
