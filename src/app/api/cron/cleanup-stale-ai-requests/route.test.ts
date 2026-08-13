import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { GET } from "./route";
import { requireCronSecret } from "@/lib/api-auth";
import { sweepStaleAiRequests } from "@/lib/ai-gateway/quota-service";

vi.mock("@/lib/api-auth", () => ({
    requireCronSecret: vi.fn(),
}));

vi.mock("@/lib/ai-gateway/quota-service", () => ({
    sweepStaleAiRequests: vi.fn(),
}));

describe("GET /api/cron/cleanup-stale-ai-requests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("rejects when CRON_SECRET auth fails", async () => {
        vi.mocked(requireCronSecret).mockReturnValue(
            NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        );

        const req = new NextRequest("http://localhost/api/cron/cleanup-stale-ai-requests");
        const res = await GET(req);

        expect(res.status).toBe(401);
        expect(sweepStaleAiRequests).not.toHaveBeenCalled();
    });

    it("sweeps stale requests and reports how many were cleared", async () => {
        vi.mocked(requireCronSecret).mockReturnValue(true as any);
        vi.mocked(sweepStaleAiRequests).mockResolvedValue(7);

        const req = new NextRequest("http://localhost/api/cron/cleanup-stale-ai-requests");
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual({ ok: true, cleared: 7 });
        expect(sweepStaleAiRequests).toHaveBeenCalledOnce();
    });

    it("returns 500 if the sweep throws", async () => {
        vi.mocked(requireCronSecret).mockReturnValue(true as any);
        vi.mocked(sweepStaleAiRequests).mockRejectedValue(
            new Error("db down")
        );

        const req = new NextRequest("http://localhost/api/cron/cleanup-stale-ai-requests");
        const res = await GET(req);

        expect(res.status).toBe(500);
    });
});
