import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { GET } from "./route";

describe("GET /api/proxy-image", () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it("returns 400 when url param is missing", async () => {
        const req = new Request("http://localhost/api/proxy-image");
        const res = await GET(req);

        expect(res.status).toBe(400);
        const text = await res.text();
        expect(text).toContain("Missing url parameter");
    });

    it("returns 400 for invalid url", async () => {
        const req = new Request("http://localhost/api/proxy-image?url=not-a-url");
        const res = await GET(req);

        expect(res.status).toBe(400);
        const text = await res.text();
        expect(text).toContain("Invalid URL");
    });

    it("returns 403 for non-TradingView URLs", async () => {
        const req = new Request("http://localhost/api/proxy-image?url=https://attacker.com/evil.png");
        const res = await GET(req);

        expect(res.status).toBe(403);
        const text = await res.text();
        expect(text).toContain("Forbidden");
    });

    it("returns 403 for subdomain or credential bypass attempts", async () => {
        const req1 = new Request("http://localhost/api/proxy-image?url=https://s3.tradingview.com.attacker.com/evil.png");
        const res1 = await GET(req1);
        expect(res1.status).toBe(403);

        const req2 = new Request("http://localhost/api/proxy-image?url=https://s3.tradingview.com@attacker.com/evil.png");
        const res2 = await GET(req2);
        expect(res2.status).toBe(403);
    });

    it("returns 415 for prohibited SVG images (XSS protection)", async () => {
        global.fetch = vi.fn().mockResolvedValue(
            new Response("<svg><script>alert(1)</script></svg>", {
                status: 200,
                headers: { "Content-Type": "image/svg+xml" },
            })
        );

        const req = new Request(
            "http://localhost/api/proxy-image?url=https://s3.tradingview.com/snapshots/x/xyz.svg"
        );
        const res = await GET(req);

        expect(res.status).toBe(415);
        const text = await res.text();
        expect(text).toContain("Forbidden - Unsupported or prohibited");
    });

    it("returns 415 for HTML responses (XSS protection)", async () => {
        global.fetch = vi.fn().mockResolvedValue(
            new Response("<html><body>Login phishing</body></html>", {
                status: 200,
                headers: { "Content-Type": "text/html; charset=utf-8" },
            })
        );

        const req = new Request(
            "http://localhost/api/proxy-image?url=https://s3.tradingview.com/snapshots/x/xyz.png"
        );
        const res = await GET(req);

        expect(res.status).toBe(415);
    });

    it("returns 200 with security headers for valid PNG images", async () => {
        const dummyBuffer = new Uint8Array([137, 80, 78, 71]).buffer;
        global.fetch = vi.fn().mockResolvedValue(
            new Response(dummyBuffer, {
                status: 200,
                headers: { "Content-Type": "image/png" },
            })
        );

        const req = new Request(
            "http://localhost/api/proxy-image?url=https://s3.tradingview.com/snapshots/x/xyz.png"
        );
        const res = await GET(req);

        expect(res.status).toBe(200);
        expect(res.headers.get("Content-Type")).toBe("image/png");
        expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
        expect(res.headers.get("Content-Security-Policy")).toBe("default-src 'none'");

        // Verify fetch was called with redirect: "error"
        expect(global.fetch).toHaveBeenCalledWith(
            "https://s3.tradingview.com/snapshots/x/xyz.png",
            expect.objectContaining({ redirect: "error" })
        );
    });

    it("returns 200 for allowed JPEG and WebP images", async () => {
        const dummyBuffer = new Uint8Array([255, 216, 255]).buffer;
        global.fetch = vi.fn().mockResolvedValue(
            new Response(dummyBuffer, {
                status: 200,
                headers: { "Content-Type": "image/jpeg; charset=binary" },
            })
        );

        const req = new Request(
            "http://localhost/api/proxy-image?url=https://s3.tradingview.com/snapshots/x/xyz.jpg"
        );
        const res = await GET(req);

        expect(res.status).toBe(200);
        expect(res.headers.get("Content-Type")).toBe("image/jpeg");
    });

    it("returns 500 when fetch encounters a redirect error (SSRF prevention)", async () => {
        global.fetch = vi.fn().mockRejectedValue(
            new TypeError("fetch failed: redirect not allowed")
        );

        const req = new Request(
            "http://localhost/api/proxy-image?url=https://s3.tradingview.com/snapshots/x/redirect-me"
        );
        const res = await GET(req);

        expect(res.status).toBe(500);
    });
});
