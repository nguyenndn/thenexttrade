import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { GET } from "./route";
import { requireCronSecret } from "@/lib/api-auth";
import { runVipPolicyReconciliation } from "@/lib/services/vip-policy.service";

vi.mock("@/lib/api-auth", () => ({
    requireCronSecret: vi.fn(),
}));

vi.mock("@/lib/services/vip-policy.service", () => ({
    runVipPolicyReconciliation: vi.fn(),
}));

describe("GET /api/cron/vip-policy", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("rejects when CRON_SECRET auth fails", async () => {
        vi.mocked(requireCronSecret).mockReturnValue(
            NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        );

        const req = new NextRequest("http://localhost/api/cron/vip-policy");
        const res = await GET(req);

        expect(res.status).toBe(401);
        expect(runVipPolicyReconciliation).not.toHaveBeenCalled();
    });

    it("runs VIP reconciliation when authorized", async () => {
        vi.mocked(requireCronSecret).mockReturnValue(true as any);
        vi.mocked(runVipPolicyReconciliation).mockResolvedValue({
            scannedCount: 5,
            pausedCount: 1,
            expiredCount: 0,
            recheckedFundingCount: 2,
            fundingGraceCount: 1,
            errors: [],
        });

        const req = new NextRequest("http://localhost/api/cron/vip-policy");
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.result.scannedCount).toBe(5);
        expect(runVipPolicyReconciliation).toHaveBeenCalledOnce();
    });

    it("returns 500 when reconciliation throws", async () => {
        vi.mocked(requireCronSecret).mockReturnValue(true as any);
        vi.mocked(runVipPolicyReconciliation).mockRejectedValue(
            new Error("DB failure")
        );

        const req = new NextRequest("http://localhost/api/cron/vip-policy");
        const res = await GET(req);

        expect(res.status).toBe(500);
    });
});
