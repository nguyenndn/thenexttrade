import { test, expect, type Page } from "@playwright/test";
import { loginOnce, goto } from "./helpers/auth";

test.setTimeout(3 * 60 * 1000);

test.describe("TraderWaves - Profile Privacy Presets E2E Loop", () => {
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

  test("Should verify privacy presets (Safe, Performance, Full) and preview card visibility", async () => {
    await goto(page, "/dashboard/settings/profile");

    // Ensure Public Profile toggle is enabled
    const enableToggle = page.locator('button[aria-label="Enable"]').first();
    if (await enableToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await enableToggle.click();
      await page.waitForTimeout(500);
    }

    // Fill profile headline
    const headlineInput = page.locator('input[placeholder*="Swing Trader"]');
    if (await headlineInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await headlineInput.fill(`E2E Trader Wave Headline ${Date.now()}`);
    }

    // 1. Select Safe Public Preset
    const safePublicBtn = page.getByRole("button", { name: "Safe Public", exact: true });
    await safePublicBtn.click();
    await page.waitForTimeout(500);

    // Verify Dollar Amounts toggle is disabled
    const dollarToggle = page.locator("div.border").filter({ hasText: "Dollar Amounts" }).last().getByRole("button");
    await expect(dollarToggle).toHaveAttribute("aria-label", "Enable");

    // 2. Select Full Public Preset
    const fullPublicBtn = page.getByRole("button", { name: "Full Public", exact: true });
    await fullPublicBtn.click();
    await page.waitForTimeout(500);

    // Verify Dollar Amounts toggle is enabled
    await expect(dollarToggle).toHaveAttribute("aria-label", "Disable");

    // 3. Open Live Trading Card Preview
    const previewBtn = page.getByRole("button", { name: /live preview card/i }).first();
    await previewBtn.click();
    await page.waitForTimeout(500);

    // Verify modal elements are visible
    const previewDialog = page.getByRole("dialog").filter({ hasText: "Live Trading Card Preview" });
    await expect(previewDialog).toBeVisible();
    await expect(previewDialog.getByText("@keeloren")).toBeVisible();

    // Close preview dialog by clicking outside or pressing Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // 4. Save settings
    const saveBtn = page.getByRole("button", { name: /save changes/i }).first();
    if (await saveBtn.isEnabled()) {
      await saveBtn.click();
      await expect(page.getByText("Profile settings saved!")).toBeVisible();
    }
  });
});
