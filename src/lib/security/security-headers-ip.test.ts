import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { proxy } from "@/proxy";
import { updateSession } from "@/lib/supabase/middleware";
import { safeFetchWithRedirects } from "@/lib/security/ssrf";
import { POST as postAiRewrite } from "@/app/api/ai/rewrite/route";
import { generateSessionId } from "@/lib/analytics";
import { getClientIpFromHeaders } from "@/lib/security/client-ip";

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
        it("prioritizes cf-connecting-ip when behind Cloudflare", async () => {
            const req = new NextRequest("http://localhost/about", {
                headers: {
                    "cf-connecting-ip": "203.0.113.9",
                    "x-real-ip": "198.51.100.1",
                    "x-vercel-forwarded-for": "203.0.113.2, 10.0.0.1",
                    "x-forwarded-for": "192.0.2.3, 10.0.0.2",
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                },
            });

            await proxy(req);

            expect(generateSessionId).toHaveBeenCalledWith("203.0.113.9", expect.anything());
        });

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

    describe("2. Trusted client-IP helper used by auth actions", () => {
        it("prioritizes cf-connecting-ip when behind Cloudflare", () => {
            const h = new Headers({
                "cf-connecting-ip": "203.0.113.9",
                "x-real-ip": "198.51.100.1",
                "x-vercel-forwarded-for": "203.0.113.2, 10.0.0.1",
                "x-forwarded-for": "192.0.2.3, 10.0.0.2",
            });

            expect(getClientIpFromHeaders(h)).toBe("203.0.113.9");
        });

        it("prioritizes x-real-ip when cf-connecting-ip is absent", () => {
            const h = new Headers({
                "x-real-ip": "198.51.100.1",
                "x-vercel-forwarded-for": "203.0.113.2, 10.0.0.1",
                "x-forwarded-for": "192.0.2.3, 10.0.0.2",
            });

            expect(getClientIpFromHeaders(h)).toBe("198.51.100.1");
        });

        it("falls back to the first IP of x-vercel-forwarded-for", () => {
            const h = new Headers({
                "x-vercel-forwarded-for": "203.0.113.2, 10.0.0.1",
                "x-forwarded-for": "192.0.2.3, 10.0.0.2",
            });

            expect(getClientIpFromHeaders(h)).toBe("203.0.113.2");
        });

        it("falls back to the first IP of x-forwarded-for", () => {
            const h = new Headers({
                "x-forwarded-for": "192.0.2.3, 10.0.0.2",
            });

            expect(getClientIpFromHeaders(h)).toBe("192.0.2.3");
        });

        it("defaults to 127.0.0.1 when no IP headers are provided", () => {
            expect(getClientIpFromHeaders(new Headers())).toBe("127.0.0.1");
        });

        it("honours a caller-provided fallback", () => {
            expect(getClientIpFromHeaders(new Headers(), "Unknown IP")).toBe("Unknown IP");
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

    describe("5. CSP nonce in src/proxy.ts", () => {
        // addSecurityHeaders() only runs outside dev, so the CSP assertions
        // need the production branch of the proxy.
        beforeEach(() => {
            vi.stubEnv("NODE_ENV", "production");
        });

        afterEach(() => {
            vi.unstubAllEnvs();
        });

        const makeRequest = () =>
            new NextRequest("http://localhost/about", {
                headers: {
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                },
            });

        const getScriptSrc = (csp: string) =>
            csp
                .split(";")
                .map((part) => part.trim())
                .find((part) => part.startsWith("script-src")) ?? "";

        it("emits a nonce-based script-src without 'unsafe-inline' or 'unsafe-eval'", async () => {
            const res = await proxy(makeRequest());
            const csp = res.headers.get("content-security-policy");

            expect(csp).toBeTruthy();
            const scriptSrc = getScriptSrc(csp!);
            expect(scriptSrc).toMatch(/'nonce-[^']+'/);
            expect(scriptSrc).not.toContain("'unsafe-inline'");
            expect(scriptSrc).not.toContain("'unsafe-eval'");
            expect(scriptSrc).toContain("'strict-dynamic'");
        });

        it("forwards the same nonce to the request headers consumed by the root layout", async () => {
            const res = await proxy(makeRequest());
            const csp = res.headers.get("content-security-policy") ?? "";
            const nonceInHeader = csp.match(/'nonce-([^']+)'/)?.[1];

            expect(nonceInHeader).toBeTruthy();
            expect(updateSession).toHaveBeenCalledWith(
                expect.any(NextRequest),
                expect.objectContaining({ "x-nonce": nonceInHeader })
            );
        });

        it("generates a fresh nonce for each request", async () => {
            const [first, second] = await Promise.all([
                proxy(makeRequest()),
                proxy(makeRequest()),
            ]);

            const firstNonce = first.headers
                .get("content-security-policy")
                ?.match(/'nonce-([^']+)'/)?.[1];
            const secondNonce = second.headers
                .get("content-security-policy")
                ?.match(/'nonce-([^']+)'/)?.[1];

            expect(firstNonce).toBeTruthy();
            expect(secondNonce).toBeTruthy();
            expect(firstNonce).not.toBe(secondNonce);
        });
    });
});
