import { test, expect } from "@playwright/test";
import { loginOnce, goto } from "./helpers/auth";

/**
 * Part 2 (Coach & Retention) runtime smoke test.
 *
 * Verifies the highest-risk fixes from the audit end-to-end in the running app:
 *  1. Dashboard renders for the QA user (DashboardClient / coach nudge / criticalSyncIssue).
 *  2. /dashboard/accounts?setup=sync opens the sync wizard EXACTLY ONCE — the
 *     handledParamsRef + router.replace guard must stop the modal from
 *     re-opening the instant the user closes it (the old history.replaceState
 *     trap).
 *  3. /onboarding loads (or redirects) without a crash — resume/auth fixes.
 *  4. /admin/reports loads — the activation inbox data path (admin-activation.ts).
 */
test("Part 2 smoke: dashboard, accounts modal-trap, onboarding, admin reports", async ({
  page,
}) => {
  // Multi-step smoke: login + several page navigations exceed the 30s default.
  test.setTimeout(150_000);

  // 1. Login (shared QA account)
  await loginOnce(page);

  // 2. Dashboard renders with greeting + no error boundary
  await goto(page, "/dashboard");
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByText(/Application error|Something went wrong/i)
  ).toHaveCount(0);

  // 3. Accounts modal-trap: wizard opens once and does NOT re-open after close
  await page.goto("/dashboard/accounts?setup=sync&method=ea", {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByText("Interactive Sync Wizard")).toBeVisible({
    timeout: 15_000,
  });

  await page.keyboard.press("Escape");
  await expect(page.getByText("Interactive Sync Wizard")).toBeHidden({
    timeout: 5_000,
  });

  // Wait past any effect re-fire window; the guard must keep it closed.
  await page.waitForTimeout(2_500);
  await expect(
    page.getByText("Interactive Sync Wizard")
  ).not.toBeVisible();

  // Query params should have been cleaned from the URL (router.replace).
  expect(page.url()).not.toContain("setup=");

  // 4. Onboarding loads (or redirects to /dashboard) without crashing
  await page.goto("/onboarding", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 12_000 }).catch(() => {});
  expect(page.url()).toMatch(/\/dashboard|\/onboarding/);

  // 5. Admin reports loads (activation inbox data path)
  await page.goto("/admin/reports", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Admin Reports")).toBeVisible({
    timeout: 20_000,
  });
});
