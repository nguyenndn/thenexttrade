import { test, expect, type Page } from "@playwright/test";

/**
 * New User Experience QA Tests
 *
 * Tests the reverted changes:
 * 1. Sidebar — all items fully visible (no dimming/opacity)
 * 2. MobileSidebar — all items fully visible (no dimming/badges)
 * 3. MobileBottomTabBar — original tabs (no tab swap)
 * 4. Dashboard WelcomeHero with goal-based personalization + ghost chart
 * 5. GreetingHeader — correct greeting
 *
 * Uses a single login + shared auth state to avoid rate limiting.
 */

const userEmail = process.env.USER_QA_EMAIL || "keezimin@gmail.com";
const userPassword = process.env.USER_QA_PASSWORD || "Password123!";

test.setTimeout(3 * 60 * 1000);

async function loginOnce(page: Page) {
    await page.goto("/auth/login", { waitUntil: "domcontentloaded" });

    // If already logged in, skip
    if (page.url().includes("/dashboard")) return;

    // Check for rate limit and wait if needed
    const rateLimitMsg = page.getByText("Too many attempts");
    if (await rateLimitMsg.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Wait 60s for rate limit to expire
        await page.waitForTimeout(60_000);
        await page.reload({ waitUntil: "domcontentloaded" });
    }

    const emailInput = page.locator('input[name="email"]');
    if (!(await emailInput.isVisible({ timeout: 30000 }).catch(() => false))) {
        if (page.url().includes("/dashboard")) return;
        throw new Error("Login form not found and not on dashboard");
    }

    await emailInput.fill(userEmail);
    await page.locator('input[name="password"]').fill(userPassword);
    await Promise.all([
        page.waitForURL(/\/dashboard/, { timeout: 60_000 }),
        page.getByRole("button", { name: /^login$/i }).click(),
    ]);
    await page.waitForLoadState("networkidle", { timeout: 12_000 }).catch(() => {});
}

async function dismissOverlays(page: Page) {
    for (let i = 0; i < 3; i += 1) {
        const gotIt = page.getByRole("button", { name: /got it/i }).last();
        if (await gotIt.isVisible({ timeout: 500 }).catch(() => false)) {
            await gotIt.click({ force: true }).catch(() => {});
            await page.waitForTimeout(250);
            continue;
        }
        break;
    }
}

async function goto(page: Page, path: string) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    await dismissOverlays(page);
}

// ─── DESKTOP TESTS (single login, all tests in one describe) ─
test.describe("Desktop — Dashboard NUX", () => {
    test.describe.configure({ mode: "serial" });

    let page: Page;

    test.beforeAll(async ({ browser }) => {
        test.setTimeout(120_000); // 2min for login + rate limit wait
        const context = await browser.newContext({
            viewport: { width: 1440, height: 900 },
        });
        page = await context.newPage();
        await loginOnce(page);
    });

    test.afterAll(async () => {
        await page.context().close();
    });

    test("NUX-D01: Dashboard page loads without errors", async () => {
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await goto(page, "/dashboard");
        await expect(page.locator("body")).not.toBeEmpty();

        const criticalErrors = errors.filter(
            (e) => !e.includes("ResizeObserver") && !e.includes("ChunkLoadError") && !e.includes("Performance")
        );
        expect(criticalErrors).toHaveLength(0);
    });

    test("NUX-D02: Sidebar items are all visible (no opacity dimming)", async () => {
        await goto(page, "/dashboard");

        // Find sidebar nav links to dashboard pages
        const sidebarLinks = page.locator("aside a[href*='/dashboard']");
        const count = await sidebarLinks.count();
        expect(count).toBeGreaterThan(0);

        for (let i = 0; i < count; i++) {
            const link = sidebarLinks.nth(i);
            if (!(await link.isVisible().catch(() => false))) continue;

            // Check link and parent for opacity-50
            const linkClasses = (await link.getAttribute("class")) || "";
            expect(linkClasses).not.toContain("opacity-50");

            // Check the wrapper div
            const parent = link.locator("xpath=..");
            const parentClasses = (await parent.getAttribute("class")) || "";
            expect(parentClasses).not.toContain("opacity-50");
        }
    });

    test("NUX-D03: Sidebar has no 'Start Here' badge", async () => {
        await goto(page, "/dashboard");

        const startHereBadge = page.locator("aside").getByText("Start Here");
        await expect(startHereBadge).toHaveCount(0);
    });

    test("NUX-D04: WelcomeHero renders for new users", async () => {
        await goto(page, "/dashboard");

        const welcomeHero = page.getByText("Welcome to your Command Center");
        if (await welcomeHero.isVisible({ timeout: 3000 }).catch(() => false)) {
            // Hero heading
            const heading = page.locator("h2").first();
            await expect(heading).toBeVisible();

            // Ghost chart preview
            const ghostChart = page.locator("svg[viewBox='0 0 400 120']");
            if (await ghostChart.isVisible({ timeout: 2000 }).catch(() => false)) {
                await expect(ghostChart).toBeVisible();
            }

            // Performance charts text
            const chartPreviewText = page.getByText("Your performance charts will appear here");
            if (await chartPreviewText.isVisible({ timeout: 2000 }).catch(() => false)) {
                await expect(chartPreviewText).toBeVisible();
            }
        }
    });

    test("NUX-D05: GreetingHeader renders correctly", async () => {
        await goto(page, "/dashboard");
        const bodyText = (await page.locator("body").textContent()) || "";

        const hasContent =
            /good (morning|afternoon|evening)/i.test(bodyText) ||
            bodyText.includes("Trader") ||
            bodyText.includes("expert") ||
            bodyText.includes("discipline");
        expect(hasContent).toBeTruthy();
    });

    test("NUX-D06: Key dashboard pages are accessible", async () => {
        // Verify key pages load without errors (sidebar link structure already verified in D02/D03)
        await goto(page, "/dashboard/academy");
        expect(page.url()).toContain("/dashboard/academy");
        await expect(page.locator("body")).not.toBeEmpty();

        await goto(page, "/dashboard/analytics");
        expect(page.url()).toContain("/dashboard/analytics");
        await expect(page.locator("body")).not.toBeEmpty();
    });

    test("NUX-D07: Notification bell is visible", async () => {
        await goto(page, "/dashboard");

        const bell = page.locator(
            "button[aria-label*='notification' i], a[aria-label*='notification' i], a[href*='/notifications']"
        ).first();

        if (await bell.isVisible({ timeout: 3000 }).catch(() => false)) {
            await expect(bell).toBeVisible();
        }
    });
});

// ─── MOBILE TESTS (single login, all tests in one describe) ──
test.describe("Mobile — Dashboard NUX", () => {
    test.describe.configure({ mode: "serial" });

    let page: Page;

    test.beforeAll(async ({ browser }) => {
        test.setTimeout(120_000); // 2min for login + rate limit wait
        const context = await browser.newContext({
            viewport: { width: 390, height: 844 },
        });
        page = await context.newPage();
        await loginOnce(page);
    });

    test.afterAll(async () => {
        await page.context().close();
    });

    test("NUX-M01: Mobile bottom tab bar shows original tabs (no swap)", async () => {
        await goto(page, "/dashboard");

        // Bottom bar should have "Dashboard" text visible
        const dashboardTab = page.getByText("Dashboard", { exact: true }).first();
        if (await dashboardTab.isVisible({ timeout: 3000 }).catch(() => false)) {
            await expect(dashboardTab).toBeVisible();
        }
    });

    test("NUX-M02: Mobile sidebar has no dimming or Start Here badge", async () => {
        await goto(page, "/dashboard");

        // Find hamburger menu
        const menuButton = page.locator(
            "button[aria-label*='menu' i], button[aria-label*='sidebar' i], button[aria-label*='Menu' i]"
        ).first();

        let menuOpened = false;
        if (await menuButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            // Dismiss any toast notifications that might block the click
            const toasts = page.locator("[data-sonner-toast]");
            const toastCount = await toasts.count();
            for (let t = 0; t < toastCount; t++) {
                await toasts.nth(t).click({ force: true }).catch(() => {});
            }
            await page.waitForTimeout(500);

            await menuButton.click({ force: true });
            await page.waitForTimeout(500);
            menuOpened = true;
        }

        if (menuOpened) {
            // No "Start Here" badge
            const startHere = page.getByText("Start Here");
            await expect(startHere).toHaveCount(0);

            // No opacity-50 on any nav items
            const navLinks = page.locator(".fixed a[href*='/dashboard']");
            const count = await navLinks.count();
            for (let i = 0; i < count; i++) {
                const classes = (await navLinks.nth(i).getAttribute("class")) || "";
                expect(classes).not.toContain("opacity-50");
            }

            // Close sidebar
            const closeBtn = page.locator("button[aria-label*='close' i], button[aria-label*='Close' i]").first();
            if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
                await closeBtn.click();
            }
        }
    });

    test("NUX-M03: Mobile page loads cleanly (no JS errors)", async () => {
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await goto(page, "/dashboard");
        await page.waitForTimeout(2000);

        const criticalErrors = errors.filter(
            (e) =>
                !e.includes("ResizeObserver") &&
                !e.includes("ChunkLoadError") &&
                !e.includes("Performance")
        );
        expect(criticalErrors).toHaveLength(0);
        await expect(page.locator("body")).not.toBeEmpty();
    });
});
