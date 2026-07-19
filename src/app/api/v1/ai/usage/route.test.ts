import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { prisma } from "@/lib/prisma";
import { getUserQuotaUsage } from "@/lib/ai-gateway/quota-service";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
        },
    },
}));

vi.mock("@/lib/ai-gateway/quota-service", () => ({
    getUserQuotaUsage: vi.fn(),
}));

describe("GET /api/v1/ai/usage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 401 INVALID_LICENSE if no Bearer token", async () => {
        const req = new NextRequest("http://localhost/api/v1/ai/usage");
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).toBe(401);
        expect(body.error_code).toBe("INVALID_LICENSE");
    });

    it("returns 401 INVALID_LICENSE if token is wrong", async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
        const req = new NextRequest("http://localhost/api/v1/ai/usage", {
            headers: { Authorization: "Bearer wrong_token" },
        });
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).toBe(401);
        expect(body.error_code).toBe("INVALID_LICENSE");
    });

    it("returns 200 with free quota when user has no PRO active", async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
            id: "user_1",
        } as any);
        vi.mocked(getUserQuotaUsage).mockResolvedValue({
            isPro: false,
            dailyLimit: 20,
            usedToday: 5,
            remainingToday: 15,
            hasQuota: true,
        });

        const req = new NextRequest("http://localhost/api/v1/ai/usage", {
            headers: { Authorization: "Bearer test_token" },
        });
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.ok).toBe(true);
        expect(body.plan).toBe("free");
        expect(body.daily_limit).toBe(20);
        expect(body.used_today).toBe(5);
        expect(body.remaining_today).toBe(15);
    });

    it("returns 200 with PRO quota when user has active subscription", async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
            id: "user_2",
        } as any);
        vi.mocked(getUserQuotaUsage).mockResolvedValue({
            isPro: true,
            dailyLimit: 500,
            usedToday: 10,
            remainingToday: 490,
            hasQuota: true,
        });

        const req = new NextRequest("http://localhost/api/v1/ai/usage", {
            headers: { Authorization: "Bearer test_token" },
        });
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.ok).toBe(true);
        expect(body.plan).toBe("pro");
        expect(body.daily_limit).toBe(500);
        expect(body.used_today).toBe(10);
        expect(body.remaining_today).toBe(490);
    });
});
