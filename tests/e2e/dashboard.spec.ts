import { test, expect } from '@playwright/test';

test.describe('Dashboard Module', () => {
  // Hook beforeEach để login trước khi test
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'keezimin@gmail.com');
    await page.fill('input[name="password"]', '123123123');
    await page.click('button[type="submit"]');
    // Tăng timeout
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('Hiển thị đầy đủ thông tin Dashboard (Happy Path)', async ({ page }) => {
    // 1. Kiểm tra KPI Cards (Quan trọng nhất)
    // Dùng .first() để tránh strict mode violation
    await expect(page.locator('text=Total Balance').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Winrate').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Win Streak').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Net Profit').first()).toBeVisible({ timeout: 10000 });

    // 2. Kiểm tra Charts hiện hữu
    await expect(page.locator('text=Period Growth').first()).toBeVisible();
    await expect(page.locator('text=Profit Distribution').first()).toBeVisible();
    await expect(page.locator('text=Lot Distribution').first()).toBeVisible();
  });

  test('Dashboard Responsive - Mobile View', async ({ page }) => {
    // Set viewport size to mobile
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify layout stack (KPI cards should stack vertically or 2 cols)
    await expect(page.locator('text=Total Balance').first()).toBeVisible({ timeout: 10000 });
  });
});
