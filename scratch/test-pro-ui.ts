import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on("console", msg => {
    if (msg.text().includes("DEBUG_PRO:")) {
      console.log("BROWSER CONSOLE:", msg.text());
    }
  });

  // Login
  console.log("Navigating to login page...");
  await page.goto("http://localhost:3000/auth/login", { waitUntil: "domcontentloaded" });
  await page.locator('input[name="email"]').fill("keezimin@gmail.com");
  await page.locator('input[name="password"]').fill("Password123!");
  await Promise.all([
      page.waitForURL(/\/dashboard/, { timeout: 45_000 }),
      page.getByRole("button", { name: /^login$/i }).click(),
  ]);
  console.log("Login successful.");

  // Navigate to intelligence
  console.log("Navigating to intelligence page...");
  await page.goto("http://localhost:3000/dashboard/intelligence", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  // Click on Account Selector
  console.log("Clicking account selector...");
  await page.locator('button[role="combobox"]').first().click();
  await page.waitForTimeout(1000);

  // Select JustMarket
  console.log("Selecting JustMarket...");
  await page.getByText("JustMarket").first().click();
  await page.waitForTimeout(3000);

  await browser.close();
}

main().catch(err => {
  console.error("test-pro-ui error:", err);
  process.exit(1);
});
