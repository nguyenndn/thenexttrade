import { test, expect, type Page } from "@playwright/test";
import { loginOnce, goto } from "./helpers/auth";

test.setTimeout(3 * 60 * 1000);

test.describe("TraderWaves - Rulebook & Goals E2E Loop", () => {
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

  test("Should manage custom trading rules", async () => {
    await goto(page, "/dashboard/rules");

    // Click "Add Rule" or "Create Custom Rule"
    const addRuleBtn = page.getByRole("button", { name: /add rule/i }).or(
      page.getByRole("button", { name: /create custom rule/i })
    ).first();
    await addRuleBtn.click();

    // Fill rule details
    const ruleTitle = `Playwright Test Rule ${Date.now()}`;
    await page.locator('input[placeholder*="Stop after"]').fill(ruleTitle);
    await page.locator('textarea[placeholder*="Provide context"]').fill("This rule is created by Playwright E2E automation.");
    
    // Choose Risk category
    await page.locator('select[name="category"]').or(page.locator('select')).first().selectOption("RISK");
    
    // Submit
    await page.getByRole("button", { name: /create rule/i }).click();

    // Verify toast & rule existence
    await expect(page.getByText("Rule created successfully!")).toBeVisible();
    await expect(page.locator("body")).toContainText(ruleTitle);

    // Edit the rule
    const ruleCard = page.locator("div.grid > div").filter({ hasText: ruleTitle }).first();
    await ruleCard.getByTitle("Edit Rule").click();

    // Update Title
    const editedTitle = `${ruleTitle} Edited`;
    await page.locator('input[placeholder*="Stop after"]').fill(editedTitle);
    await page.getByRole("button", { name: /save changes/i }).click();

    // Verify toast & updated text
    await expect(page.getByText("Rule updated successfully!")).toBeVisible();
    await expect(page.locator("body")).toContainText(editedTitle);

    // Delete the rule — the app uses a custom ConfirmDialog, not window.confirm
    const editedCard = page.locator("div.grid > div").filter({ hasText: editedTitle }).first();
    await editedCard.getByTitle("Delete Rule").click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    await expect(page.getByText("Rule deleted successfully!")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(editedTitle);
  });

  test("Should manage behavior goals and update manual stepper progress", async () => {
    await goto(page, "/dashboard/rules");

    // Switch to Behavior Goals tab
    await page.getByRole("button", { name: "Behavior Goals", exact: true }).click();
    await page.waitForTimeout(1000);

    // Click "Add Goal" or "Set Behavior Goal"
    const addGoalBtn = page.getByRole("button", { name: /add goal/i }).or(
      page.getByRole("button", { name: /set behavior goal/i })
    ).first();
    await addGoalBtn.click();

    // Fill goal details
    const goalTitle = `Playwright Study Goal ${Date.now()}`;
    await page.locator('input[placeholder*="Journal 5 trades"]').fill(goalTitle);
    
    // Select Manual Goal type "STUDY"
    await page.locator('select').first().selectOption("STUDY");
    
    // Set Target Value — use the modal's unique placeholder (the goal card's
    // stepper also renders an input[type="number"], so a bare type selector
    // hits a strict-mode violation)
    await page.getByPlaceholder("e.g. 5").fill("5");
    
    // Submit
    await page.getByRole("button", { name: /create goal/i }).click();

    // Verify toast & goal card
    await expect(page.getByText("Goal created successfully!")).toBeVisible();
    
    const goalCard = page.locator("div.grid > div").filter({ hasText: goalTitle }).first();
    await expect(goalCard).toBeVisible();
    await expect(goalCard.locator("text=0 / 5")).toBeVisible();

    // Click the "+" stepper button to increment progress
    const plusBtn = goalCard.getByRole("button", { name: "+" });
    await plusBtn.click();

    // Verify progress updated
    await expect(page.getByText("Progress updated!")).toBeVisible();
    await expect(goalCard.locator("text=1 / 5")).toBeVisible();

    // Click "-" stepper button to decrement progress
    const minusBtn = goalCard.getByRole("button", { name: "-" });
    await minusBtn.click();

    // Verify progress decremented
    await expect(page.getByText("Progress updated!")).toBeVisible();
    await expect(goalCard.locator("text=0 / 5")).toBeVisible();

    // Delete the goal — the app uses a custom ConfirmDialog, not window.confirm
    await goalCard.getByTitle("Delete Goal").click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    await expect(page.getByText("Goal deleted successfully!")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(goalTitle);
  });
});
