import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { proxy } from "@/proxy";
import { login } from "@/app/auth/actions";
import { safeFetchWithRedirects } from "@/lib/security/ssrf";
import { POST as postAiRewrite } from "@/app/api/ai/rewrite/route";
import { generateSessionId } from "@/lib/analytics";
import { checkAuthRateLimit } from "@/lib/security/auth-rate-limit";
import { headers } from "next/headers";

// Mock Supabase middleware for proxy
vi.mock("@/lib/supabase/middleware", () => ({
    updateSession: vi.fn(async () => NextResponse.next()),
}));

// Mock youtube-transcript to avoid CJS/ESM module scope issue in vitest
vi.mock("youtube-transcript", () => ({
    YoutubeTranscript: { fetchTranscript: vi.fn() },
}));

// Mock Analytics for proxy
vi.mock("@/lib/analytics", () => ({
    parseUserAgent: vi.fn(() => ({ device: "desktop", browser: "chrome", os: "windows" })),
    generateSessionId: vi.fn((ip: string) => `session-${ip}`),
    isTrackablePath: vi.fn(() => true),
    getGeoFromHeaders: vi.fn(() => ({ country: "US", city: "New York", region: "NY" })),
    shouldTrackPageviewRequest: vi.fn(() => true),
}));

// Mock next/headers for auth actions
vi.mock("next/headers", () => ({
    headers: vi.fn(),
}));

// Mock auth rate limiter
vi.mock("@/lib/security/auth-rate-limit", () => ({
    checkAuthRateLimit: vi.fn(async () => true), // Return true to abort early after IP extraction
}));

// Mock Supabase server client
vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn(async () => ({})),
}));

// Mock API Admin Auth for AI rewrite
vi.mock("@/lib/api-auth", () => ({
    requireAdmin: vi.fn(async () => ({ user: { id: "admin-1", role: "ADMIN" } })),
}));

describe("Security Headers & IP Precedence Suite (Phase 3 QA)", () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    describe("1. IP Header Fallback Precedence in src/proxy.ts", () => {
        it("prioritizes x-real-ip when multiple IP headers are present", async () => {
            const req = new NextRequest("http://localhost/about", {
                headers: {
                    "x-real-ip": "198.51.100.1",
                    "x-vercel-forwarded-for": "203.0.113.2, 10.0.0.1",
                    "x-forwarded-for": "192.0.2.3, 10.0.0.2",
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                },
            });

            await proxy(req);

            expect(generateSessionId).toHaveBeenCalledWith("198.51.100.1", expect.anything());
        });

        it("falls back to first IP of x-vercel-forwarded-for when x-real-ip is absent", async () => {
            const req = new NextRequest("http://localhost/about", {
                headers: {
                    "x-vercel-forwarded-for": "203.0.113.2, 10.0.0.1",
                    "x-forwarded-for": "192.0.2.3, 10.0.0.2",
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                },
            });

            await proxy(req);

            expect(generateSessionId).toHaveBeenCalledWith("203.0.113.2", expect.anything());
        });

        it("falls back to first IP of x-forwarded-for when x-real-ip and x-vercel-forwarded-for are absent", async () => {
            const req = new NextRequest("http://localhost/about", {
                headers: {
                    "x-forwarded-for": "192.0.2.3, 10.0.0.2",
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                },
            });

            await proxy(req);

            expect(generateSessionId).toHaveBeenCalledWith("192.0.2.3", expect.anything());
        });

        it("defaults to 127.0.0.1 when no forwarding IP headers exist", async () => {
            const req = new NextRequest("http://localhost/about", {
                headers: {
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                },
            });

            await proxy(req);

            expect(generateSessionId).toHaveBeenCalledWith("127.0.0.1", expect.anything());
        });
    });

    describe("2. IP Header Fallback Precedence in src/app/auth/actions.ts", () => {
        it("prioritizes x-real-ip in getClientIP during login action", async () => {
            const mockHeaders = new Headers({
                "x-real-ip": "198.51.100.1",
                "x-vercel-forwarded-for": "203.0.113.2, 10.0.0.1",
                "x-forwarded-for": "192.0.2.3, 10.0.0.2",
            });
            vi.mocked(headers).mockResolvedValue(mockHeaders as any);

            const formData = new FormData();
            formData.set("email", "trader@example.com");
            formData.set("password", "SecurePassword123!");

            await login(formData);

            expect(checkAuthRateLimit).toHaveBeenCalledWith("login", "198.51.100.1", "trader@example.com");
        });

        it("falls back to first IP in x-vercel-forwarded-for in getClientIP during login", async () => {
            const mockHeaders = new Headers({
                "x-vercel-forwarded-for": "203.0.113.2, 10.0.0.1",
                "x-forwarded-for": "192.0.2.3, 10.0.0.2",
            });
            vi.mocked(headers).mockResolvedValue(mockHeaders as any);

            const formData = new FormData();
            formData.set("email", "trader@example.com");
            formData.set("password", "SecurePassword123!");

            await login(formData);

            expect(checkAuthRateLimit).toHaveBeenCalledWith("login", "203.0.113.2", "trader@example.com");
        });

        it("falls back to first IP in x-forwarded-for in getClientIP during login", async () => {
            const mockHeaders = new Headers({
                "x-forwarded-for": "192.0.2.3, 10.0.0.2",
            });
            vi.mocked(headers).mockResolvedValue(mockHeaders as any);

            const formData = new FormData();
            formData.set("email", "trader@example.com");
            formData.set("password", "SecurePassword123!");

            await login(formData);

            expect(checkAuthRateLimit).toHaveBeenCalledWith("login", "192.0.2.3", "trader@example.com");
        });

        it("defaults to 127.0.0.1 in getClientIP when no IP headers are provided", async () => {
            const mockHeaders = new Headers({});
            vi.mocked(headers).mockResolvedValue(mockHeaders as any);

            const formData = new FormData();
            formData.set("email", "trader@example.com");
            formData.set("password", "SecurePassword123!");

            await login(formData);

            expect(checkAuthRateLimit).toHaveBeenCalledWith("login", "127.0.0.1", "trader@example.com");
        });
    });

    describe("3. Framework Security Headers in next.config.js", () => {
        it("verifies next.config.js disables poweredByHeader to mitigate fingerprinting", () => {
            const rawConfig = require("../../../next.config.js");
            const config = typeof rawConfig === "function" ? rawConfig("", {}) : rawConfig;
            expect(config.poweredByHeader).toBe(false);
        });
    });

    describe("4. SSRF Guard and fallbackScrape in AI Rewrite Route", () => {
        it("blocks direct requests to loopback and private IP addresses", async () => {
            const req = new NextRequest("http://localhost/api/ai/rewrite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    urls: ["http://127.0.0.1:8000/internal-secrets"],
                }),
            });

            const res = await postAiRewrite(req);
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toContain("Forbidden - Invalid or unsafe URL: http://127.0.0.1:8000/internal-secrets");
        });

        it("blocks cloud metadata address (169.254.169.254) in AI rewrite route", async () => {
            const req = new NextRequest("http://localhost/api/ai/rewrite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    urls: ["http://169.254.169.254/latest/meta-data"],
                }),
            });

            const res = await postAiRewrite(req);
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toContain("Forbidden - Invalid or unsafe URL: http://169.254.169.254/latest/meta-data");
        });

        it("safeFetchWithRedirects blocks 302 redirects to RFC 1918 private IP targets", async () => {
            global.fetch = vi.fn().mockResolvedValueOnce(
                new Response(null, {
                    status: 302,
                    headers: { Location: "http://192.168.1.1/admin" },
                })
            );

            await expect(
                safeFetchWithRedirects("https://93.184.216.34/article")
            ).rejects.toThrow(/Unsafe URL blocked by SSRF guard/);
        });
    });
});
