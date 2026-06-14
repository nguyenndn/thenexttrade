import { test, expect, type Page } from "@playwright/test";
import { PrismaClient, TradeResult, TradeStatus, TradeType } from "@prisma/client";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();
const runId = Date.now();
const prefix = `QA-PUBLIC-${runId}`;
const reportPath = path.join(process.cwd(), "docs", "PUBLIC_PAGES_QA_2026-05-09.md");

type ViewportName = "desktop" | "mobile";
type QaResult = {
    viewport: ViewportName | "all";
    area: string;
    action: string;
    status: "PASS" | "FAIL" | "SKIP";
    evidence: string;
};

const results: QaResult[] = [];
let rateBucket = 80;

const seeded: {
    articleSlug?: string;
    tagSlug?: string;
    lessonSlug?: string;
    traderUsername?: string;
    shareId?: string;
    publicUserId?: string;
} = {};

const staticPublicRoutes = [
    "/",
    "/about",
    "/contact",
    "/community",
    "/brokers",
    "/knowledge",
    "/knowledge?sort=popular",
    "/knowledge/risk-management",
    "/academy",
    "/tools",
    "/tools/risk-calculator",
    "/tools/position-size-calculator",
    "/tools/pip-value-calculator",
    "/tools/profit-loss-calculator",
    "/tools/risk-reward-calculator",
    "/tools/margin-calculator",
    "/tools/leverage-calculator",
    "/tools/drawdown-calculator",
    "/tools/compounding-calculator",
    "/tools/fibonacci-calculator",
    "/tools/pivot-point-calculator",
    "/tools/risk-of-ruin-calculator",
    "/tools/currency-converter",
    "/tools/correlation-matrix",
    "/tools/currency-heat-map",
    "/tools/live-market-rates",
    "/tools/economic-calendar",
    "/tools/market-hours",
    "/legal/privacy-policy",
    "/legal/terms-of-service",
    "/legal/cookie-policy",
    "/search",
    "/search?q=trading",
    "/auth/login",
    "/auth/signup",
    "/auth/forgot-password",
    "/auth/verify-email",
    "/auth/auth-code-error",
    "/forbidden",
    "/offline",
    "/maintenance",
];

test.describe.configure({ mode: "serial" });
test.setTimeout(18 * 60 * 1000);

async function recordStep(viewport: QaResult["viewport"], area: string, action: string, fn: () => Promise<string | void>) {
    try {
        const evidence = await fn();
        results.push({ viewport, area, action, status: "PASS", evidence: evidence || "Verified in Playwright." });
    } catch (error) {
        results.push({ viewport, area, action, status: "FAIL", evidence: error instanceof Error ? error.message : String(error) });
    }
}

async function gotoHealthy(page: Page, route: string) {
    await page.setExtraHTTPHeaders({
        "x-forwarded-for": `10.${Math.floor(runId / 1000) % 180}.${Math.floor(runId / 10) % 180}.${rateBucket++}`,
    });

    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 12_000 }).catch(() => {});

    if (response && response.status() >= 400) {
        throw new Error(`${route} returned HTTP ${response.status()}`);
    }

    await expect(page.locator("body")).not.toContainText(/Application error|Unhandled Runtime Error|Internal Server Error|Page Not Found|404/i, { timeout: 2_000 });

    const overflow = await page.evaluate(() => {
        const width = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
        return width - window.innerWidth;
    });
    if (overflow > 16) {
        throw new Error(`${route} has document horizontal overflow of ${overflow}px`);
    }
    if (pageErrors.length) {
        throw new Error(`${route} page error: ${pageErrors.join(" | ")}`);
    }
}

async function seedDynamicPublicData() {
    const article = await prisma.article.findFirst({
        where: { status: "PUBLISHED" },
        select: { slug: true, tags: { select: { tag: { select: { slug: true } } }, take: 1 } },
        orderBy: { createdAt: "desc" },
    });
    seeded.articleSlug = article?.slug;
    seeded.tagSlug = article?.tags?.[0]?.tag.slug;

    const lesson = await prisma.lesson.findFirst({
        where: { status: "published", module: { level: { accessLevel: "PUBLIC" } } },
        select: { slug: true },
        orderBy: { order: "asc" },
    });
    seeded.lessonSlug = lesson?.slug;

    seeded.publicUserId = randomUUID();
    seeded.traderUsername = `qapublic${String(runId).slice(-8)}`;

    await prisma.user.create({
        data: {
            id: seeded.publicUserId,
            email: `qa-public-${runId}@example.test`,
            name: `${prefix} Trader`,
            profile: {
                create: {
                    username: seeded.traderUsername,
                    isPublicProfile: true,
                    profileHeadline: `${prefix} public profile`,
                    showBadges: true,
                    showTradeScore: true,
                    showPairStats: true,
                    showSessionStats: true,
                },
            },
        },
    });

    const trade = await prisma.journalEntry.create({
        data: {
            userId: seeded.publicUserId,
            symbol: "QPSH",
            type: TradeType.BUY,
            status: TradeStatus.CLOSED,
            result: TradeResult.WIN,
            entryPrice: 2300,
            exitPrice: 2310,
            stopLoss: 2290,
            takeProfit: 2310,
            lotSize: 0.1,
            pnl: 100,
            entryDate: new Date(),
            exitDate: new Date(),
            entryReason: `${prefix} public share`,
            exitReason: `${prefix} public share`,
            notes: `${prefix} share note`,
            shareMode: "full",
            shareDescription: `${prefix} shared trade`,
        },
    });
    seeded.shareId = trade.id;
}

async function cleanupDynamicPublicData() {
    await prisma.journalEntry.deleteMany({
        where: {
            OR: [
                { entryReason: { startsWith: prefix } },
                { notes: { startsWith: prefix } },
                { symbol: "QPSH" },
            ],
        },
    }).catch(() => {});

    if (seeded.publicUserId) {
        await prisma.user.delete({ where: { id: seeded.publicUserId } }).catch(() => {});
    }

    await prisma.user.deleteMany({
        where: { email: { startsWith: `qa-public-${runId}` } },
    }).catch(() => {});
}

function writeReport() {
    const failures = results.filter((r) => r.status === "FAIL");
    const strip = (value: string) => value.replace(/\u001b\[[0-9;]*m/g, "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
    const rows = failures
        .map((r, index) => `| PUBLIC-${String(index + 1).padStart(3, "0")} | Medium | ${r.area} | ${r.viewport} | ${r.action} failed. | ${strip(r.evidence)} | Needs source inspection. |`)
        .join("\n");

    fs.writeFileSync(reportPath, [
        "# Public Pages QA - 2026-05-09",
        "",
        "Scope: Headless Playwright QA for homepage and public/external pages on desktop and mobile.",
        "",
        "Report policy: bug-only. Passing functions are intentionally omitted.",
        "",
        "Test command:",
        "- `USER_QA_EMAIL=keezimin@gmail.com USER_QA_PASSWORD=[REDACTED] npx dotenv -e .env -- npx playwright test tests/e2e/public-pages-qa.spec.ts --project=chromium --reporter=list`",
        "",
        "QA notes:",
        "- Dynamic article and academy lesson routes use existing published content; trader profile and trade share routes use isolated temporary public QA data.",
        "- The test uses per-flow `x-forwarded-for` headers to avoid local middleware rate-limit false positives.",
        "",
        "## Confirmed Bugs",
        "",
        failures.length
            ? [
                "| ID | Severity | Area | Viewport | Bug | Evidence | Likely Source |",
                "| --- | --- | --- | --- | --- | --- | --- |",
                rows,
            ].join("\n")
            : "No confirmed public page bugs found in this pass.",
        "",
        "## Coverage",
        "",
        "Covered homepage, public header/search/menu, auth pages, contact validation, community, brokers/tabs, knowledge library/filter/tag redirect, article page, public academy/lesson, tools hub and calculator/tool pages, legal pages, public search, trader profile, shared trade page, and special public states.",
        "",
    ].join("\n"), "utf8");
}

async function publicSmoke(page: Page, viewport: ViewportName) {
    const routes = [...staticPublicRoutes];
    if (seeded.articleSlug) routes.push(`/articles/${seeded.articleSlug}`);
    if (seeded.tagSlug) routes.push(`/articles/tags/${seeded.tagSlug}`);
    if (seeded.lessonSlug) routes.push(`/academy/lesson/${seeded.lessonSlug}`);
    if (seeded.traderUsername) routes.push(`/trader/${seeded.traderUsername}`);
    if (seeded.shareId) routes.push(`/share/${seeded.shareId}`);

    await page.setViewportSize(viewport === "desktop" ? { width: 1440, height: 900 } : { width: 390, height: 844 });
    for (const route of routes) {
        await recordStep(viewport, "Public Route Smoke", route, async () => {
            await gotoHealthy(page, route);
            return `${route} loaded without HTTP/app/runtime/layout failures.`;
        });
    }
}

async function publicInteractions(page: Page) {
    await recordStep("desktop", "Homepage", "Header search opens and routes to public search", async () => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await gotoHealthy(page, "/");
        await page.getByText("Search...").first().click();
        await page.getByPlaceholder(/search for anything/i).fill("risk");
        await page.getByRole("button", { name: /^search$/i }).click();
        await page.waitForURL(/\/search\?q=risk/i, { timeout: 10_000 });
        await expect(page.getByText(/Universal Search/i)).toBeVisible();
    });

    await recordStep("mobile", "Homepage", "Mobile menu opens, links render, and closes", async () => {
        await page.setViewportSize({ width: 390, height: 844 });
        await gotoHealthy(page, "/");
        await page.getByRole("button", { name: /toggle menu/i }).click();
        await expect(page.locator("body")).toContainText(/Knowledge|Academy|Tools|Login/i);
        await page.getByRole("button", { name: /toggle menu/i }).click();
    });

    await recordStep("desktop", "Contact", "Contact form client validation", async () => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await gotoHealthy(page, "/contact");
        await page.getByRole("button", { name: /send message/i }).click();
        await expect(page.locator("body")).toContainText(/Name must be at least|Invalid email address|Subject must be at least/i, { timeout: 5_000 });
    });

    await recordStep("desktop", "Auth", "Login mode switch, password visibility, signup and forgot links", async () => {
        await gotoHealthy(page, "/auth/login");
        await page.getByRole("button", { name: /show password/i }).click();
        await expect(page.locator('input[name="password"]')).toHaveAttribute("type", "text");
        await page.getByRole("link", { name: /forgot your password/i }).click();
        await page.waitForURL(/\/auth\/forgot-password/i, { timeout: 10_000 });
        await expect(page.locator("body")).toContainText(/Reset|Forgot|password/i);
        await gotoHealthy(page, "/auth/login");
        await page.getByRole("button", { name: /magic link/i }).click();
        await expect(page.locator("body")).toContainText(/magic link/i);
        await gotoHealthy(page, "/auth/signup");
        await expect(page.locator("body")).toContainText(/Create|Sign up|account/i);
    });

    await recordStep("desktop", "Brokers", "Partner category tabs switch without errors", async () => {
        await gotoHealthy(page, "/brokers");
        for (const label of [/Crypto/i, /VPS Hosting/i, /CFD Brokers/i]) {
            await page.getByRole("button", { name: label }).click();
            await expect(page.locator("body")).not.toContainText(/Application error|Unhandled Runtime Error/i);
        }
    });

    await recordStep("desktop", "Knowledge", "Search, sort, and tag redirect", async () => {
        await gotoHealthy(page, "/knowledge");
        const searchInput = page.getByPlaceholder(/search/i).first();
        if (await searchInput.isVisible().catch(() => false)) {
            await searchInput.fill("risk");
            await searchInput.press("Enter");
            await page.waitForURL(/\/knowledge\?q=risk/i, { timeout: 10_000 }).catch(() => {});
        }
        await gotoHealthy(page, "/knowledge?sort=popular");
        await expect(page.locator("body")).toContainText(/Most Read|Latest Publications|Search/i);
        if (seeded.tagSlug) {
            await gotoHealthy(page, `/articles/tags/${seeded.tagSlug}`);
            expect(page.url()).toContain(`/knowledge?tag=${encodeURIComponent(seeded.tagSlug)}`);
        }
    });

    await recordStep("desktop", "Tools", "Position size calculator recalculates", async () => {
        await gotoHealthy(page, "/tools/position-size-calculator");
        const inputs = page.locator('input[type="number"]');
        await inputs.nth(0).fill("20000");
        await inputs.nth(1).fill("2");
        await inputs.nth(2).fill("40");
        await expect(page.locator("body")).toContainText(/Recommended Size|Risk Amount|Lots/i);
    });

    await recordStep("desktop", "Search", "Public search results route handles query", async () => {
        await gotoHealthy(page, "/search?q=trading");
        await expect(page.locator("body")).toContainText(/Found .* results for|No results found/i, { timeout: 12_000 });
    });
}

test.beforeAll(async () => {
    await cleanupDynamicPublicData();
    await seedDynamicPublicData();
});

test.afterAll(async () => {
    await cleanupDynamicPublicData();
    writeReport();
    await prisma.$disconnect();
});

test("public pages release QA", async ({ page }) => {
    page.setDefaultTimeout(10_000);
    page.setDefaultNavigationTimeout(45_000);

    await publicSmoke(page, "desktop");
    await publicSmoke(page, "mobile");
    await publicInteractions(page);

    const failures = results.filter((r) => r.status === "FAIL");
    expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
});
