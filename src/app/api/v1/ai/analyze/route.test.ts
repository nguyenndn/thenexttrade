import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import { reserveAiRequest, getUserQuotaUsage } from "@/lib/ai-gateway/quota-service";
import { executeAiGateway } from "@/lib/ai-gateway/provider-router";
import { validateTradingSafety } from "@/lib/ai-gateway/safety-validator";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    aiRequestAttempt: { createMany: vi.fn() },
    aiRequest: { update: vi.fn(), updateMany: vi.fn() },
  },
}));

vi.mock("@/lib/ai-gateway/quota-service", () => ({
  reserveAiRequest: vi.fn(),
  getUserQuotaUsage: vi.fn(),
}));

vi.mock("@/lib/ai-gateway/provider-router", () => ({
  executeAiGateway: vi.fn(),
}));

vi.mock("@/lib/ai-gateway/safety-validator", () => ({
  validateTradingSafety: vi.fn(),
  buildWaitFallback: vi.fn().mockReturnValue({ action: "WAIT", reason: "Fallback" }),
}));

describe("POST /api/v1/ai/analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 INVALID_LICENSE if no Bearer token", async () => {
    const req = new NextRequest("http://localhost/api/v1/ai/analyze", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error_code).toBe("INVALID_LICENSE");
  });

  it("returns 401 INVALID_LICENSE if token is wrong", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/v1/ai/analyze", {
      method: "POST",
      headers: { Authorization: "Bearer wrong_token" },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error_code).toBe("INVALID_LICENSE");
  });

  it("returns 400 SNAPSHOT_INVALID if snapshot is missing symbol", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user_id" } as any);
    const req = new NextRequest("http://localhost/api/v1/ai/analyze", {
      method: "POST",
      headers: { Authorization: "Bearer test_key" },
      body: JSON.stringify({ snapshot: { chart_timeframe: "M15" } }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error_code).toBe("SNAPSHOT_INVALID");
  });

  it("returns 409 DUPLICATE_REQUEST if reservation fails", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user_id" } as any);
    vi.mocked(reserveAiRequest).mockResolvedValue({ status: "DUPLICATE" } as any);

    const req = new NextRequest("http://localhost/api/v1/ai/analyze", {
      method: "POST",
      headers: { Authorization: "Bearer test_key" },
      body: JSON.stringify({ snapshot: { symbol: "XAUUSD" } }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(409);
    expect(body.error_code).toBe("DUPLICATE_REQUEST");
  });

  it.skip("returns 429 QUOTA_EXCEEDED if daily limit reached", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user_id" } as any);
    vi.mocked(reserveAiRequest).mockResolvedValue({
      status: "QUOTA_EXCEEDED",
      quota: { isPro: false, dailyLimit: 10, usedToday: 10, remainingToday: 0 }
    } as any);

    const req = new NextRequest("http://localhost/api/v1/ai/analyze", {
      method: "POST",
      headers: { Authorization: "Bearer test_key" },
      body: JSON.stringify({ snapshot: { symbol: "XAUUSD" } }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(429);
    expect(body.error_code).toBe("QUOTA_EXCEEDED");
    expect(body.usage.remaining_today).toBe(0);
  });

  it("returns 502 SERVER_ERROR if provider routing fails", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user_id" } as any);
    vi.mocked(reserveAiRequest).mockResolvedValue({
      status: "SUCCESS",
      aiRequest: { id: "req_123" }
    } as any);
    vi.mocked(executeAiGateway).mockResolvedValue({
      ok: false,
      attempts: [],
      error_code: "ALL_PROVIDERS_FAILED",
      message: "Test failure"
    });
    vi.mocked(getUserQuotaUsage).mockResolvedValue({ isPro: true, dailyLimit: 500, usedToday: 1, remainingToday: 499 } as any);

    const req = new NextRequest("http://localhost/api/v1/ai/analyze", {
      method: "POST",
      headers: { Authorization: "Bearer test_key" },
      body: JSON.stringify({ snapshot: { symbol: "XAUUSD" } }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(502);
    expect(body.error_code).toBe("ALL_PROVIDERS_FAILED");
  });

  it("returns WAIT if safety validator rejects it", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user_id" } as any);
    vi.mocked(reserveAiRequest).mockResolvedValue({
      status: "SUCCESS",
      aiRequest: { id: "req_123" }
    } as any);
    vi.mocked(executeAiGateway).mockResolvedValue({
      ok: true,
      attempts: [],
      normalizedResult: { action: "BUY", entry: 100, sl: 90, tp1: 120 } as any
    });
    vi.mocked(validateTradingSafety).mockReturnValue({ ok: false, reason: "Too risky" });
    vi.mocked(getUserQuotaUsage).mockResolvedValue({ isPro: true, dailyLimit: 500, usedToday: 1, remainingToday: 499 } as any);

    const req = new NextRequest("http://localhost/api/v1/ai/analyze", {
      method: "POST",
      headers: { Authorization: "Bearer test_key" },
      body: JSON.stringify({ snapshot: { symbol: "XAUUSD" } }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.action).toBe("WAIT");
    expect(prisma.aiRequest.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "REJECTED" })
    }));
  });

  it("returns successful response when validation passes", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user_id" } as any);
    vi.mocked(reserveAiRequest).mockResolvedValue({
      status: "SUCCESS",
      aiRequest: { id: "req_123" }
    } as any);
    vi.mocked(executeAiGateway).mockResolvedValue({
      ok: true,
      attempts: [],
      normalizedResult: { action: "BUY", entry: 100, sl: 90, tp1: 120 } as any
    });
    vi.mocked(validateTradingSafety).mockReturnValue({ ok: true });
    vi.mocked(getUserQuotaUsage).mockResolvedValue({ isPro: true, dailyLimit: 500, usedToday: 1, remainingToday: 499 } as any);

    const req = new NextRequest("http://localhost/api/v1/ai/analyze", {
      method: "POST",
      headers: { Authorization: "Bearer test_key" },
      body: JSON.stringify({ snapshot: { symbol: "XAUUSD" } }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.action).toBe("BUY");
    expect(prisma.aiRequest.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "COMPLETED" })
    }));
  });
});
