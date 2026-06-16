import { test, expect, type Page } from "@playwright/test";
import { loginOnce, goto } from "./helpers/auth";

test.setTimeout(3 * 60 * 1000);

test.describe("TraderWaves Routes Smoke Tests", () => {
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

  const routes = [
    { name: "Account Hub", path: "/dashboard/accounts" },
    { name: "Sync Health Center Triggered", path: "/dashboard/accounts?health=sync" },
    { name: "Profile Settings", path: "/dashboard/settings/profile" },
    { name: "Trading Rules", path: "/dashboard/rules" },
    { name: "Journal Entry", path: "/dashboard/journal" },
    { name: "Weekly Report", path: "/dashboard/reports/weekly" },
  ];

  for (const r of routes) {
    test(`Route - ${r.name} (${r.path}) loads cleanly`, async () => {
      const errors: string[] = [];
      page.on("pageerror", (err) => {
        // Ignore known third-party or benign warnings/resize observer errors
        if (!err.message.includes("ResizeObserver") && !err.message.includes("Performance")) {
          errors.push(err.message);
        }
      });

      await goto(page, r.path);
      await expect(page.locator("body")).not.toBeEmpty();

      // Confirm there are no critical JS errors
      expect(errors).toHaveLength(0);
    });
  }
});
