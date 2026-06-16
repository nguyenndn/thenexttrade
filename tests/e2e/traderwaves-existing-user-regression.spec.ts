import { test, expect, type Page } from "@playwright/test";
import { loginOnce, goto } from "./helpers/auth";

test.setTimeout(3 * 60 * 1000);

test.describe("TraderWaves - Existing User Regression Protection E2E", () => {
  test.describe.configure({ mode: "serial" });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120_000);
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    page = await context.newPage();
    await loginOnce(page);
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  test("Should verify existing user lands directly on dashboard without blocks or onboarding modals", async () => {
    await goto(page, "/dashboard");

    // 1. Check URL is exactly /dashboard
    expect(page.url()).toContain("/dashboard");
    expect(page.url()).not.toContain("/onboarding");

    // 2. Verify there are no modal overlays blocking interaction
    const modalHeader = page.getByRole("dialog").locator("h2").first();
    const isModalVisible = await modalHeader.isVisible().catch(() => false);
    
    // If a modal is visible, it should not be onboarding-related
    if (isModalVisible) {
      const modalText = await modalHeader.textContent();
      expect(modalText).not.toContain("Setup");
      expect(modalText).not.toContain("Welcome");
    }

    // 3. Verify main dashboard segments are present
    const greetingHeader = page.locator("body");
    await expect(greetingHeader).toContainText(/good/i); // good morning/afternoon/evening
    
    // Check that we see the main navigation menu sidebar
    await expect(page.locator("aside")).toBeVisible();
  });
});
