import { type Page, expect } from "@playwright/test";

export const userEmail = process.env.USER_QA_EMAIL || "keezimin@gmail.com";
export const userPassword = process.env.USER_QA_PASSWORD || "Password123!";
const authenticatedUrlPattern = /\/(dashboard|onboarding)/;

export async function loginOnce(page: Page) {
  await page.goto("/auth/login", { waitUntil: "domcontentloaded" });

  // If already logged in, skip
  if (authenticatedUrlPattern.test(page.url())) return;

  const emailInput = page.locator('input[name="email"]').first();
  if (!(await emailInput.isVisible({ timeout: 30000 }).catch(() => false))) {
    if (authenticatedUrlPattern.test(page.url())) return;
    throw new Error("Login form not found and not on dashboard");
  }

  await emailInput.fill(userEmail);
  await expect(emailInput).toHaveValue(userEmail);

  const passwordInput = page.locator('input[name="password"]').first();
  await passwordInput.fill(userPassword);
  await expect(passwordInput).toHaveValue(userPassword);
  
  // Click login
  await page.getByRole("button", { name: /^login$/i }).click();

  // Race between dashboard redirection and rate limit error message
  const result = await Promise.race([
    page.waitForURL(authenticatedUrlPattern, { timeout: 60_000 }).then(() => "success").catch(() => "timeout" as const),
    page.getByText("Too many attempts").waitFor({ state: "visible", timeout: 15_000 }).then(() => "ratelimit").catch(() => "timeout" as const)
  ]);

  if (result === "ratelimit") {
    // Wait for the Supabase lockout period (usually 60 seconds) to clear
    console.log("Supabase Auth rate limit hit. Waiting 65s for lockout reset...");
    await page.waitForTimeout(65_000);
    
    // Reload page and re-attempt login
    await page.goto("/auth/login", { waitUntil: "domcontentloaded" });
    await page.locator('input[name="email"]').first().fill(userEmail);
    await page.locator('input[name="password"]').first().fill(userPassword);
    
    await Promise.all([
      page.waitForURL(authenticatedUrlPattern, { timeout: 60_000 }),
      page.getByRole("button", { name: /^login$/i }).click(),
    ]);
  } else if (result === "timeout") {
    if (authenticatedUrlPattern.test(page.url())) return;
    const errorText = await page.locator("[role='alert'], .text-red-600, .text-red-400").first().textContent().catch(() => null);
    throw new Error(errorText ? `Login failed: ${errorText}` : "Login did not redirect to dashboard or onboarding");
  }

  await page.waitForLoadState("networkidle", { timeout: 12_000 }).catch(() => {});
}

export async function dismissOverlays(page: Page) {
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

export async function goto(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
  await dismissOverlays(page);
}
