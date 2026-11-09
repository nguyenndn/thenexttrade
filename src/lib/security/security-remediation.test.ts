import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { resolveSyncAuth } from "@/lib/sync-auth";
import { safeFetchWithRedirects } from "@/lib/security/ssrf";
import { GET as getLessonPreview } from "@/app/api/academy/lessons/[id]/preview/route";
import { POST as postSyncHeartbeat } from "@/app/api/sync/heartbeat/route";
import { POST as postMt5Sync } from "@/app/api/mt5/sync/route";
import { GET as getRevealKey } from "@/app/api/trading-accounts/[id]/reveal-key/route";
import { GET as getExportCsv } from "@/app/api/export/csv/route";
import { GET as getProfile, PUT as putProfile } from "@/app/api/profile/route";
import { POST as postSecurityLog } from "@/app/api/internal/security-log/route";

vi.mock("@/lib/prisma", () => ({
    prisma: {
        lesson: {
            findFirst: vi.fn(),
        },
        user: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        profile: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            upsert: vi.fn(),
        },
        tradingAccount: {
            findFirst: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn(),
        },
        journalEntry: {
            findFirst: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
    },
}));

vi.mock("@/lib/auth-cache", () => ({
    getAuthUser: vi.fn(),
}));

vi.mock("@/lib/sync-auth", () => ({
    resolveSyncAuth: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn(async () => ({
        auth: {
            getUser: vi.fn(async () => ({
                data: { user: { id: "user-1", email: "trader@example.com" } },
            })),
            updateUser: vi.fn(async () => ({})),
        },
    })),
}));

vi.mock("@/lib/onboarding/onboarding.server", () => ({
    getOnboardingState: vi.fn(async () => ({ tradingGoal: "Consistency" })),
    updateOnboardingSettings: vi.fn(async () => ({})),
}));

vi.mock("@/lib/security-logger", () => ({
    logSecurityEvent: vi.fn(async () => ({})),
}));

describe("Security Audit Remediation Suite (2026-10-31)", () => {
    const originalFetch = global.fetch;
    const originalEnv = { ...process.env };

    beforeEach(() => {
        vi.clearAllMocks();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        global.fetch = originalFetch;
        process.env = originalEnv;
    });

    describe("HIGH-3: Academy Lesson Preview Paywall Protection", () => {
        const longHtmlContent =
            "<h2>Secret Institutional Orderflow</h2><p>" +
            "Orderblock liquidity sweep strategy details. ".repeat(40) +
            "</p>";

        it("truncates non-PUBLIC lesson content to plain-text teaser for unauthenticated visitors", async () => {
            vi.mocked(getAuthUser).mockResolvedValue(null);
            vi.mocked(prisma.lesson.findFirst).mockResolvedValue({
                id: "lesson-1",
                title: "Orderflow Mastery",
                slug: "orderflow-mastery",
                content: longHtmlContent,
                duration: 15,
                module: {
                    title: "Module 2",
                    level: {
                        title: "Level 2",
                        order: 2,
                        accessLevel: "MEMBER",
                    },
                },
            } as any);

            const req = new NextRequest(
                "http://localhost/api/academy/lessons/orderflow-mastery/preview"
            );
            const res = await getLessonPreview(req, {
                params: Promise.resolve({ id: "orderflow-mastery" }),
            });

            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.isLocked).toBe(true);
            expect(data.content).not.toContain("<h2>");
            expect(data.content.startsWith("<p>")).toBe(true);
            expect(data.content.endsWith("…</p>")).toBe(true);
            expect(data.content.length).toBeLessThanOrEqual(820);
        });

        it("returns full lesson HTML for PUBLIC levels even when unauthenticated", async () => {
            vi.mocked(getAuthUser).mockResolvedValue(null);
            vi.mocked(prisma.lesson.findFirst).mockResolvedValue({
                id: "lesson-public",
                title: "What is Forex?",
                slug: "what-is-forex",
                content: longHtmlContent,
                duration: 10,
                module: {
                    title: "Module 1",
                    level: {
                        title: "Level 1",
                        order: 1,
                        accessLevel: "PUBLIC",
                    },
                },
            } as any);

            const req = new NextRequest(
                "http://localhost/api/academy/lessons/what-is-forex/preview"
            );
            const res = await getLessonPreview(req, {
                params: Promise.resolve({ id: "what-is-forex" }),
            });

            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.isLocked).toBe(false);
            expect(data.content).toBe(longHtmlContent);
        });
    });

    describe("MEDIUM-4: SSRF Redirect Hop Validation (safeFetchWithRedirects)", () => {
        it("blocks a 302 redirect from an external URL to 127.0.0.1 or cloud metadata", async () => {
            global.fetch = vi.fn().mockResolvedValueOnce(
                new Response(null, {
                    status: 302,
                    headers: {
                        Location: "http://169.254.169.254/latest/meta-data/",
                    },
                })
            );

            await expect(
                safeFetchWithRedirects("https://93.184.216.34/article")
            ).rejects.toThrow(/Unsafe URL blocked by SSRF guard/);

            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(global.fetch).toHaveBeenCalledWith(
                "https://93.184.216.34/article",
                expect.objectContaining({ redirect: "manual" })
            );
        });

        it("blocks a 301 redirect to localhost (127.0.0.1:5055)", async () => {
            global.fetch = vi.fn().mockResolvedValueOnce(
                new Response(null, {
                    status: 301,
                    headers: {
                        Location: "http://127.0.0.1:5055/admin/connections",
                    },
                })
            );

            await expect(
                safeFetchWithRedirects("https://93.184.216.34/start")
            ).rejects.toThrow(/Unsafe URL blocked by SSRF guard/);
        });

        it("follows safe public redirects up to maxRedirects and returns final response", async () => {
            global.fetch = vi
                .fn()
                .mockResolvedValueOnce(
                    new Response(null, {
                        status: 302,
                        headers: {
                            Location: "https://93.184.216.34/final-destination",
                        },
                    })
                )
                .mockResolvedValueOnce(
                    new Response("<html><title>OK</title></html>", {
                        status: 200,
                    })
                );

            const res = await safeFetchWithRedirects(
                "https://93.184.216.34/initial"
            );
            expect(res.status).toBe(200);
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });
    });

    describe("LOW-7: Sensitive Endpoints Enforce Cache-Control: no-store", () => {
        it("sets Cache-Control: no-store on GET /api/trading-accounts/[id]/reveal-key", async () => {
            vi.mocked(getAuthUser).mockResolvedValue({
                id: "user-1",
            } as any);
            vi.mocked(prisma.tradingAccount.findFirst).mockResolvedValue({
                apiKey: "secret-ea-key-123",
            } as any);

            const req = new NextRequest(
                "http://localhost/api/trading-accounts/acc-1/reveal-key"
            );
            const res = await getRevealKey(req, {
                params: Promise.resolve({ id: "acc-1" }),
            });

            expect(res.status).toBe(200);
            expect(res.headers.get("Cache-Control")).toBe(
                "no-store, no-cache, must-revalidate, private"
            );
        });

        it("sets Cache-Control: no-store on GET /api/export/csv", async () => {
            vi.mocked(getAuthUser).mockResolvedValue({
                id: "user-1",
            } as any);
            vi.mocked(prisma.journalEntry.findMany).mockResolvedValue([]);

            const req = new NextRequest("http://localhost/api/export/csv");
            const res = await getExportCsv(req);

            expect(res.status).toBe(200);
            expect(res.headers.get("Cache-Control")).toBe(
                "no-store, no-cache, must-revalidate, private"
            );
        });

        it("sets Cache-Control: no-store on GET /api/profile", async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
                id: "user-1",
                name: "Trader",
                email: "trader@example.com",
                image: null,
                streak: 1,
                level: 1,
                xp: 10,
                profile: {
                    bio: "",
                    telegramId: "",
                    country: "VN",
                    role: "USER",
                    username: "trader1",
                },
            } as any);

            const res = await getProfile();
            expect(res.status).toBe(200);
            expect(res.headers.get("Cache-Control")).toBe(
                "no-store, no-cache, must-revalidate, private"
            );
        });
    });

    describe("HIGH-NEW-1: Lock broker & server on /api/sync/heartbeat", () => {
        it("does NOT overwrite already-stored broker and server on subsequent heartbeats", async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
                id: "user-1",
                tradingAccounts: [
                    {
                        id: "acc-locked",
                        accountNumber: "888001",
                        broker: "RandomBroker",
                        server: "RandomBroker-Demo",
                    },
                ],
            } as any);
            vi.mocked(prisma.tradingAccount.update).mockResolvedValue({} as any);

            const req = new NextRequest(
                "http://localhost/api/sync/heartbeat",
                {
                    method: "POST",
                    headers: { "X-Sync-Key": "valid-sync-key" },
                    body: JSON.stringify({
                        accounts: [
                            {
                                accountNumber: "888001",
                                connected: true,
                                balance: 10000,
                                equity: 10000,
                                broker: "Vantage",
                                server: "VantageInternational-Live",
                            },
                        ],
                    }),
                }
            );

            const res = await postSyncHeartbeat(req);
            expect(res.status).toBe(200);
            expect(prisma.tradingAccount.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: "acc-locked" },
                    data: expect.not.objectContaining({
                        broker: expect.anything(),
                        server: expect.anything(),
                    }),
                })
            );
        });

        it("sets broker and server when initially null on first heartbeat", async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
                id: "user-1",
                tradingAccounts: [
                    {
                        id: "acc-new",
                        accountNumber: "888002",
                        broker: null,
                        server: null,
                    },
                ],
            } as any);
            vi.mocked(prisma.tradingAccount.update).mockResolvedValue({} as any);

            const req = new NextRequest(
                "http://localhost/api/sync/heartbeat",
                {
                    method: "POST",
                    headers: { "X-Sync-Key": "valid-sync-key" },
                    body: JSON.stringify({
                        accounts: [
                            {
                                accountNumber: "888002",
                                connected: true,
                                balance: 500,
                                equity: 500,
                                broker: "Exness",
                                server: "Exness-MT5Real",
                            },
                        ],
                    }),
                }
            );

            const res = await postSyncHeartbeat(req);
            expect(res.status).toBe(200);
            expect(prisma.tradingAccount.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: "acc-new" },
                    data: expect.objectContaining({
                        server: "Exness-MT5Real",
                    }),
                })
            );
        });
    });

    describe("MEDIUM-NEW-2: Batch Limits & Error Masking in /api/mt5/sync and /api/profile", () => {
        it("rejects batches > 500 trades in POST /api/mt5/sync with HTTP 413", async () => {
            vi.mocked(resolveSyncAuth).mockResolvedValue({
                success: true,
                data: {
                    user: { id: "user-1" } as any,
                    account: { id: "acc-1", userId: "user-1" } as any,
                    authMode: "USER_SYNC_KEY",
                },
            });

            const oversizedTrades = Array.from({ length: 501 }, (_, i) => ({
                ticket: i + 1,
                symbol: "XAUUSD",
                type: "BUY",
                lots: 0.1,
                openTime: 1700000000,
                openPrice: 2000,
                closeTime: 1700003600,
                closePrice: 2010,
                sl: 1990,
                tp: 2020,
                commission: 0,
                swap: 0,
                profit: 100,
                comment: "",
                magic: 0,
            }));

            const req = new NextRequest("http://localhost/api/mt5/sync", {
                method: "POST",
                headers: { "X-Sync-Key": "sync-key-1" },
                body: JSON.stringify({
                    accountId: "acc-1",
                    trades: oversizedTrades,
                }),
            });

            const res = await postMt5Sync(req);
            expect(res.status).toBe(413);
            const data = await res.json();
            expect(data.error).toContain("Batch size exceeds maximum");
        });

        it("masks internal DB error details on 500 in PUT /api/profile", async () => {
            vi.mocked(prisma.user.update).mockRejectedValue(
                new Error(
                    "Invalid `prisma.user.update()` invocation: connection pool timeout at host db.internal:5432"
                )
            );

            const req = new Request("http://localhost/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "Valid Trader",
                }),
            });

            const res = await putProfile(req);
            expect(res.status).toBe(500);
            const data = await res.json();
            expect(data.error).toBe("Internal Server Error");
            expect(data.error).not.toContain("prisma");
            expect(data.error).not.toContain("5432");
        });
    });

    describe("LOW-NEW-3: Internal Security Log Auth", () => {
        it("requires Bearer secret on /api/internal/security-log whenever INTERNAL_SECURITY_SECRET is set", async () => {
            process.env.INTERNAL_SECURITY_SECRET = "top-secret-internal-token";

            // Attempt bypass with only x-internal-security: 1
            const spoofedReq = new NextRequest(
                "http://localhost/api/internal/security-log",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-internal-security": "1",
                    },
                    body: JSON.stringify({
                        type: "RATE_LIMIT",
                        ip: "1.2.3.4",
                    }),
                }
            );
            const spoofedRes = await postSecurityLog(spoofedReq);
            expect(spoofedRes.status).toBe(403);

            // Valid Bearer token succeeds
            const validReq = new NextRequest(
                "http://localhost/api/internal/security-log",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer top-secret-internal-token",
                    },
                    body: JSON.stringify({
                        type: "RATE_LIMIT",
                        ip: "1.2.3.4",
                    }),
                }
            );
            const validRes = await postSecurityLog(validReq);
            expect(validRes.status).toBe(200);
        });
    });
});

