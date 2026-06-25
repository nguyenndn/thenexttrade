import { test, expect, type Page } from "@playwright/test";
import { loginOnce, goto } from "./helpers/auth";

test.setTimeout(3 * 60 * 1000);

test.describe("Homepage Hero Conversion & Layout Simplification Tests", () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    // Create a fresh browser context for each test to keep states isolated
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    page = await context.newPage();
  });

  test.afterEach(async () => {
    await page.context().close();
  });

  test("Logged-Out State: Hero has exactly one primary CTA, proof line, and relocated search/paths", async () => {
    const errors: string[] = [];
    page.on("pageerror", (err) => {
      if (!err.message.includes("ResizeObserver") && !err.message.includes("Performance")) {
        errors.push(err.message);
      }
    });

    // 1. Go to homepage (logged out by default with a fresh context)
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

    // 2. Validate Hero elements
    const heroSection = page.locator("section").first();
    await expect(heroSection).toBeVisible();

    // Verify only ONE primary CTA button is in the hero
    const heroBtns = heroSection.locator("button");
    const count = await heroBtns.count();
    // We expect 1 button inside the hero section (Start Free Journal)
    expect(count).toBe(1);

    const primaryCta = heroBtns.first();
    await expect(primaryCta).toHaveText("Start Free Journal");

    // Primary CTA link must point to signup with source=homepage_hero
    const primaryCtaLink = heroSection.locator("a").filter({ hasText: "Start Free Journal" });
    await expect(primaryCtaLink).toHaveAttribute("href", "/auth/signup?source=homepage_hero");

    // 3. Verify removed items are NOT in the hero
    const browseGuides = heroSection.locator("text=Browse trading guides");
    await expect(browseGuides).not.toBeVisible();

    const searchBarHero = heroSection.locator("text=Search guides, tools, brokers, and academy lessons");
    await expect(searchBarHero).not.toBeVisible();

    const welcomePill = heroSection.locator("text=Welcome back");
    await expect(welcomePill).not.toBeVisible();

    // 4. Verify proof line is visible and matches exactly
    const proofLine = heroSection.locator("text=Free to start · MT5 sync · Weekly coach reports");
    await expect(proofLine).toBeVisible();

    // 5. Verify Goal Router (StartByGoalSection) is present lower on the page
    const goalSection = page.locator("text=What do you want to improve today?");
    await expect(goalSection).toBeVisible();

    const learnTradingCard = page.locator("text=Learn Trading");
    await expect(learnTradingCard).toBeVisible();

    // 6. Verify Search Block (HomeSearchBlock) is NOT present on the page
    const searchBlockHeading = page.locator("text=Looking for something specific?");
    await expect(searchBlockHeading).not.toBeVisible();

    // Verify new Header Search Button is present and visible on desktop
    const headerSearchButton = page.locator("header").locator('button[aria-label="Search website (Ctrl+K)"]');
    await expect(headerSearchButton).toBeVisible();

    // Confirm no critical JS errors
    expect(errors).toHaveLength(0);
  });

  test("Logged-In State: Hero CTA changes to Open Dashboard and welcome back pill is removed", async () => {
    // 1. Log in first
    await loginOnce(page);

    // 2. Go to homepage
    await goto(page, "/");

    // 3. Verify CTA shows "Open Dashboard"
    const heroSection = page.locator("section").first();
    const heroBtns = heroSection.locator("button");
    const primaryCta = heroBtns.first();
    await expect(primaryCta).toHaveText("Open Dashboard");

    // Verify it links to /dashboard
    const primaryCtaLink = heroSection.locator("a").filter({ hasText: "Open Dashboard" });
    await expect(primaryCtaLink).toHaveAttribute("href", "/dashboard");

    // Verify welcome back pill is NOT visible in the hero (no duplicate dashboard action)
    const welcomePill = heroSection.locator("text=Welcome back");
    await expect(welcomePill).not.toBeVisible();
  });

  test("Mobile Viewport: CTA button size and responsiveness check", async () => {
    // Resize to mobile viewport
    await page.setViewportSize({ width: 390, height: 1000 });

    // Go to homepage
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

    // Get primary CTA button
    const primaryCta = page.locator("section").first().locator("button").first();
    await expect(primaryCta).toBeVisible();

    // Verify touch target height is >= 48px
    const boundingBox = await primaryCta.boundingBox();
    expect(boundingBox).not.toBeNull();
    if (boundingBox) {
      expect(boundingBox.height).toBeGreaterThanOrEqual(48);
    }

    // Verify no horizontal overflow/scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });
});
