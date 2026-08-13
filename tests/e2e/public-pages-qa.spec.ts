import { test, expect, type Page } from "@playwright/test";

/**
 * Public pages QA — unauthenticated visitor.
 * Verifies every public route renders HTTP 200 (no login redirect, no error
 * boundary, no 404) and that auth-dependent routes redirect as expected.
 */

const ERROR_MARKERS = [
    /Application error/i,
    /Unhandled Runtime Error/i,
    /This page could not be found/i,
    /Internal Server Error/i,
];

async function expectHealthy(page: Page, route: string) {
    const body = page.locator("body");
    for (const marker of ERROR_MARKERS) {
        await expect
            .poll(() => body.textContent(), { timeout: 8_000 })
            .not.toMatch(marker);
    }
    // No horizontal overflow
    const overflow = await page.evaluate(() => {
        const width = Math.max(
            document.documentElement.scrollWidth,
            document.body.scrollWidth
        );
        return width - window.innerWidth;
    });
    expect(overflow, `${route} has ${overflow}px horizontal overflow`).toBeLessThanOrEqual(12);
}

async function visit200(
    page: Page,
    route: string,
    label = route,
    opts: { allowAuthUrl?: boolean } = {}
) {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    const finalUrl = page.url();
    if (!opts.allowAuthUrl) {
        expect(
            finalUrl,
            `${label} got redirected to auth: ${finalUrl}`
        ).not.toMatch(/\/auth\/login/);
    }
    if (response) {
        expect(
            response.status(),
            `${label} returned HTTP ${response.status()}`
        ).toBeLessThan(400);
    }
    await expectHealthy(page, label);
}

test("public pages render for an unauthenticated visitor", async ({ page }) => {
    test.setTimeout(300_000);
    page.setDefaultNavigationTimeout(120_000);

    const staticRoutes = [
        "/",
        "/about",
        "/academy",
        "/knowledge",
        "/knowledge/risk-management",
        "/brokers",
        "/tools",
        "/tools/position-size-calculator",
        "/tools/pip-value-calculator",
        "/tools/margin-calculator",
        "/tools/profit-loss-calculator",
        "/tools/risk-reward-calculator",
        "/tools/drawdown-calculator",
        "/tools/compounding-calculator",
        "/tools/fibonacci-calculator",
        "/tools/pivot-point-calculator",
        "/tools/leverage-calculator",
        "/tools/risk-of-ruin-calculator",
        "/tools/currency-converter",
        "/tools/currency-heat-map",
        "/tools/correlation-matrix",
        "/tools/live-market-rates",
        "/tools/economic-calendar",
        "/tools/market-hours",
        "/contact",
        "/faq",
        "/edge",
        "/get-started",
        "/community",
        "/trading-systems",
        "/search",
        "/forbidden",
        "/offline",
        "/legal/terms-of-service",
        "/legal/privacy-policy",
        "/legal/cookie-policy",
        "/auth/login",
        "/auth/signup",
        "/auth/success",
    ];

    const dynamicRoutes = [
        "/articles/trading-psychology-for-beginners",
        "/academy/lesson/what-is-a-pip-and-why-its-worth-more-than-you-think",
        "/academy/quiz/cmnqy63nm0001pqj89zbzrsgr",
        "/trader/keeloren",
        "/share/cmp4b3la500izda0rnnvdknj8",
        "/knowledge?category=forex-basics",
        "/knowledge?tag=intermediate",
    ];

    const authRoutes = new Set(["/auth/login", "/auth/success"]);
    for (const route of [...staticRoutes, ...dynamicRoutes]) {
        await visit200(page, route, route, {
            allowAuthUrl: authRoutes.has(route),
        });
    }
});

test("auth-dependent routes redirect correctly when logged out", async ({ page }) => {
    test.setTimeout(180_000);
    page.setDefaultNavigationTimeout(120_000);

    // /onboarding requires auth → login
    await page.goto("/onboarding", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 20_000 });

    // Legacy article URLs redirect to the Knowledge base (no 404 dead links)
    const legacyRedirects = [
        { from: "/articles", to: /\/knowledge/ },
        { from: "/articles/category/trading-psychology", to: /\/knowledge\?category=trading-psychology/ },
        { from: "/articles/tag/intermediate", to: /\/knowledge\?tag=intermediate/ },
        { from: "/articles/tags/intermediate", to: /\/knowledge\?tag=intermediate/ },
    ];
    for (const { from, to } of legacyRedirects) {
        await page.goto(from, { waitUntil: "domcontentloaded" });
        await expect(page, `${from} should redirect`).toHaveURL(to, { timeout: 20_000 });
    }

    // /maintenance redirects to / when maintenance is OFF
    await page.goto("/maintenance", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/(?!maintenance)/, { timeout: 20_000 });

    // Protected areas must NOT be reachable while logged out
    for (const protectedRoute of ["/dashboard", "/admin", "/admin/reports", "/admin/ib/pipeline"]) {
        const response = await page.goto(protectedRoute, { waitUntil: "domcontentloaded" });
        await expect(page).toHaveURL(/\/auth\/login/, { timeout: 20_000 });
        expect(response, `${protectedRoute} should redirect to login`).toBeTruthy();
    }
});
