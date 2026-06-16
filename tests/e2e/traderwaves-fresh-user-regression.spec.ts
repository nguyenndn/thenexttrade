import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { loginOnce, goto } from "./helpers/auth";

test.setTimeout(3 * 60 * 1000);

const prisma = new PrismaClient();
const userEmail = process.env.USER_QA_EMAIL || "keezimin@gmail.com";

test.describe("TraderWaves - Fresh User Onboarding Flow E2E", () => {
  test.describe.configure({ mode: "serial" });

  let page: Page;
  let initialSettings: any = null;
  let userId: string = "";

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120_000);
    // 1. Fetch user and snapshot settings
    const user = await prisma.user.findFirst({
      where: { email: userEmail },
    });
    if (!user) throw new Error(`QA User ${userEmail} not found in database`);

    userId = user.id;
    initialSettings = user.settings;

    // 2. Clear onboarding state from user settings to trigger onboarding redirect
    const currentSettings = (user.settings as Record<string, any>) || {};
    const newSettings = { ...currentSettings };
    delete newSettings.onboarding;

    await prisma.user.update({
      where: { id: user.id },
      data: { settings: newSettings },
    });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    page = await context.newPage();
    await loginOnce(page);
  });

  test.afterAll(async () => {
    // Restore initial settings
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { settings: initialSettings },
      });
    }
    await prisma.$disconnect();
    await page.context().close();
  });

  test("Should complete 4-step onboarding wizard successfully", async () => {
    // Navigate to dashboard, should be redirected to /onboarding
    await goto(page, "/dashboard");
    await page.waitForURL(/\/onboarding/, { timeout: 10_000 });
    expect(page.url()).toContain("/onboarding");

    // === Step 1: Identity ===
    await expect(page.getByText("Set up your profile")).toBeVisible();
    
    // Fill in username if empty
    const usernameInput = page.locator('input[name="username"]');
    const currentUsername = await usernameInput.inputValue();
    if (!currentUsername) {
      await usernameInput.fill(`fresh_trader_${Date.now()}`);
    }

    // Click Continue
    await page.getByRole("button", { name: /continue/i }).first().click();
    await page.waitForTimeout(1000);

    // === Step 2: Trading Goal ===
    await expect(page.getByText("What's your main goal?")).toBeVisible();
    await page.getByText("Build discipline").first().click();
    await page.getByRole("button", { name: /continue/i }).first().click();
    await page.waitForTimeout(1000);

    // === Step 3: Sync Preference ===
    await expect(page.getByText("How will you log trades?")).toBeVisible();
    await page.getByText("Manual Journal").first().click();
    await page.getByRole("button", { name: /continue/i }).first().click();
    await page.waitForTimeout(1000);

    // === Step 4: Next Action ===
    await expect(page.getByText("You're all set!")).toBeVisible();
    await expect(page.getByText("Log First Trade")).toBeVisible();

    // Finish onboarding
    await Promise.all([
      page.waitForURL(/\/dashboard\/journal/, { timeout: 15_000 }),
      page.getByRole("button", { name: /log first trade/i }).first().click(),
    ]);

    // Verify redirected to journal page
    expect(page.url()).toContain("/dashboard/journal");
  });
});
