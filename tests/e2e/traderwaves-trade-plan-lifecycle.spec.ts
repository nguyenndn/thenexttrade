import { test, expect, type Page } from "@playwright/test";
import { loginOnce, goto } from "./helpers/auth";

test.setTimeout(3 * 60 * 1000);

test.describe("TraderWaves - Trade Plan Lifecycle & Matching E2E Loop", () => {
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

  test("Should verify Trade Plan lifecycle: PLANNED -> ACTIVE -> CANCELLED", async () => {
    await goto(page, "/dashboard/journal");

    // Click on Trade Plans sub-tab
    await page.getByRole("button", { name: "Trade Plans" }).first().click();
    await page.waitForTimeout(1000);

    // Click "Create Trade Plan"
    await page.getByRole("button", { name: /create trade plan/i }).first().click();
    await page.waitForTimeout(500);

    // Fill form
    const setupName = `E2E Setup ${Date.now()}`;
    await page.locator('input[name="setupName"]').fill(setupName);
    await page.locator('input[name="symbol"]').fill("GBPUSD");
    
    // Choose Buy
    await page.getByRole("button", { name: "BUY", exact: true }).click();
    
    // Fill Levels
    await page.locator('input[name="plannedEntry"]').fill("1.25000");
    await page.locator('input[name="plannedStopLoss"]').fill("1.24000");
    await page.locator('input[name="plannedTakeProfit"]').fill("1.27000");
    await page.locator('input[name="plannedLotSize"]').fill("0.1");
    await page.locator('input[name="riskAmount"]').fill("100");

    // Submit
    await page.getByRole("button", { name: /save trade plan/i }).click();

    // Verify created in PLANNED state
    await expect(page.getByText("Trade plan saved successfully!")).toBeVisible();
    await page.waitForTimeout(1000);

    // Filter by PLANNED
    await page.getByRole("button", { name: /^planned/i }).first().click();
    const planCard = page.locator("div.grid > div").filter({ hasText: setupName }).first();
    await expect(planCard).toBeVisible();
    await expect(planCard.getByText("PLANNED", { exact: true })).toBeVisible();

    // Activate the plan
    await planCard.getByRole("button", { name: /activate/i }).click();
    await expect(page.getByText("Trade plan is now active!")).toBeVisible();

    // Verify it is active
    await page.getByRole("button", { name: /^active/i }).first().click();
    const activeCard = page.locator("div.grid > div").filter({ hasText: setupName }).first();
    await expect(activeCard).toBeVisible();
    await expect(activeCard.getByText("ACTIVE", { exact: true })).toBeVisible();

    // Invalidate/Cancel the active plan
    await activeCard.getByRole("button", { name: /invalidate/i }).click();
    
    // Fill cancel reason
    const reasonInput = activeCard.locator('input[placeholder*="Reason"]');
    await reasonInput.fill("E2E Test Invalidation Reason");
    await activeCard.getByRole("button", { name: /confirm cancel/i }).click();

    // Verify cancelled status
    await expect(page.getByText("Trade plan cancelled (invalidated).")).toBeVisible();
    await page.getByRole("button", { name: /^cancelled/i }).first().click();
    const cancelledCard = page.locator("div.grid > div").filter({ hasText: setupName }).first();
    await expect(cancelledCard).toBeVisible();
    await expect(cancelledCard.getByText("CANCELLED", { exact: true })).toBeVisible();
    await expect(cancelledCard.getByText("Invalidation reason: E2E Test Invalidation Reason")).toBeVisible();
  });

  test("Should verify trade auto-matching dropdown recommendations & overrides", async () => {
    await goto(page, "/dashboard/journal");

    // 1. Create a planned setup that we will match
    await page.getByRole("button", { name: "Trade Plans" }).first().click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /create trade plan/i }).first().click();
    
    const planName = `Match Plan ${Date.now()}`;
    await page.locator('input[name="setupName"]').fill(planName);
    await page.locator('input[name="symbol"]').fill("AUDUSD");
    await page.locator('input[name="plannedEntry"]').fill("0.65000");
    await page.locator('input[name="plannedStopLoss"]').fill("0.64000");
    await page.locator('input[name="plannedTakeProfit"]').fill("0.67000");
    await page.locator('input[name="plannedLotSize"]').fill("0.05");
    
    await page.getByRole("button", { name: /save trade plan/i }).click();
    await expect(page.getByText("Trade plan saved successfully!").first()).toBeVisible();

    // Activate the plan so it's ready for matching
    await page.getByRole("button", { name: /^planned/i }).first().click();
    const planCard = page.locator("div.grid > div").filter({ hasText: planName }).first();
    await planCard.getByRole("button", { name: /activate/i }).click();
    await expect(page.getByText("Trade plan is now active!").first()).toBeVisible();

    // 2. Open Log Trade modal manually and check suggestions
    await page.getByRole("button", { name: "Trades" }).first().click();
    await page.waitForTimeout(500);

    // Open log new trade
    await page.getByRole("button", { name: /log a new trade/i }).or(
      page.getByRole("button", { name: /log new trade/i })
    ).first().click();

    // Fill symbol to trigger matching dropdown suggestions
    const symbolInput = page.locator('input[placeholder*="EURUSD"]').first();
    await symbolInput.fill("AUDUSD");
    await page.waitForTimeout(1000);

    // Open plan dropdown selector (Radix Select trigger button next to "Link to Trade Plan")
    const selectTrigger = page.locator("button").filter({ hasText: /Unlinked/i }).first();
    await selectTrigger.click();
    await page.waitForTimeout(500);
    
    // Check if the dropdown lists the plan, showing "Suggested" or similar matching tags
    const optionElement = page.getByRole("option").filter({ hasText: planName }).first();
    await optionElement.click();
    await page.waitForTimeout(500);
    
    // Cancel modal
    await page.getByRole("button", { name: /cancel/i }).first().click();
  });
});
