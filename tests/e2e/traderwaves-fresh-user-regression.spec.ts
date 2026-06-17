import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { loginOnce, goto } from "./helpers/auth";

test.setTimeout(3 * 60 * 1000);

const prisma = new PrismaClient();
const freshEmail = "fresh_e2e_user@thenexttrade.com";
const freshPassword = "Password123!";

test.describe("TraderWaves - Fresh User Onboarding Flow E2E", () => {
  test.describe.configure({ mode: "serial" });

  let page: Page;
  let userId: string = "";

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120_000);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase URL and service role key are required for E2E tests");
    }

    const admin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Ensure test user exists in Supabase Auth
    const { data: usersList, error: listError } = await admin.auth.admin.listUsers();
    if (listError) throw listError;
    
    const existingSupabaseUser = usersList.users.find(u => u.email === freshEmail);
    if (existingSupabaseUser) {
      userId = existingSupabaseUser.id;
    } else {
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email: freshEmail,
        password: freshPassword,
        email_confirm: true,
        user_metadata: {
          full_name: "Fresh Trader",
        }
      });
      if (createError || !newUser.user) {
        throw new Error(`Failed to create fresh user in Supabase: ${createError?.message}`);
      }
      userId = newUser.user.id;
    }

    // 2. Wipe out any Prisma DB state for this user (this will cascade delete everything)
    const dbUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (dbUser) {
      await prisma.user.delete({
        where: { id: userId }
      });
    }

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    page = await context.newPage();
    await loginOnce(page, freshEmail, freshPassword);
  });

  test.afterAll(async () => {
    // Clean up DB records for fresh user to keep things tidy
    if (userId) {
      await prisma.user.delete({
        where: { id: userId }
      }).catch(() => {});
    }
    await prisma.$disconnect();
    await page.context().close();
  });

  test("Should complete 4-step onboarding wizard successfully", async () => {
    // Navigate to dashboard, should be redirected to /onboarding because onboardingDone is false and there's no data
    await goto(page, "/dashboard");
    await page.waitForURL(/\/onboarding/, { timeout: 15_000 });
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
