import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login
  await page.goto("http://localhost:3000/auth/login", { waitUntil: "domcontentloaded" });
  await page.locator('input[name="email"]').fill("keezimin@gmail.com");
  await page.locator('input[name="password"]').fill("Password123!");
  await Promise.all([
      page.waitForURL(/\/dashboard/, { timeout: 45_000 }),
      page.getByRole("button", { name: /^login$/i }).click(),
  ]);

  // Navigate to intelligence
  await page.goto("http://localhost:3000/dashboard/intelligence", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  // Print initial state of Pro status
  console.log("=== INITIAL STATE ===");
  const initialProActiveVisible = await page.getByText("Pro Active").isVisible();
  const initialFreePlanVisible = await page.getByText("Free Plan").isVisible();
  console.log("Pro Active visible:", initialProActiveVisible);
  console.log("Free Plan visible:", initialFreePlanVisible);

  // Click on Account Selector
  console.log("Clicking account selector...");
  await page.locator('button[role="combobox"]').first().click();
  await page.waitForTimeout(1000);

  // Select JustMarket
  console.log("Selecting JustMarket...");
  await page.getByText("JustMarket").first().click();
  await page.waitForTimeout(4000); // Wait for navigation and state updates

  // Print state after switching
  console.log("=== AFTER SWITCHING ===");
  const afterProActiveVisible = await page.getByText("Pro Active").isVisible();
  const afterFreePlanVisible = await page.getByText("Free Plan").isVisible();
  console.log("Pro Active visible:", afterProActiveVisible);
  console.log("Free Plan visible:", afterFreePlanVisible);

  await browser.close();
}

main().catch(err => {
  console.error("test-pro-ui error:", err);
  process.exit(1);
});
