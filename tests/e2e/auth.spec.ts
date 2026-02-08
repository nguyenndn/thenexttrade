import { test, expect } from '@playwright/test';

test.describe('Authentication Module', () => {

  test('Login thành công (Happy Path)', async ({ page }) => {
    // 1. Vào trang login
    await page.goto('/auth/login');

    // 2. Điền thông tin hợp lệ
    await page.fill('input[name="email"]', 'keezimin@gmail.com');
    await page.fill('input[name="password"]', '123123123');

    // 3. Submit
    await page.click('button[type="submit"]');

    // 4. Verify chuyển hướng và hiển thị Dashboard
    // Tăng timeout lên 15s cho chắc
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // Kiểm tra các chỉ số quan trọng (Total Balance, Winrate)
    // Dùng .first() nếu text xuất hiện nhiều lần (VD: breadcrumb + card)
    await expect(page.locator('text=Total Balance').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Winrate').first()).toBeVisible({ timeout: 10000 });
  });

  test('Login thất bại - Sai Password (Negative Case)', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'keezimin@gmail.com');
    await page.fill('input[name="password"]', 'WrongPass');
    await page.click('button[type="submit"]');

    // Verify thông báo lỗi (dựa trên class text-red-500)
    await expect(page.locator('.text-red-500')).toBeVisible();
  });

  test('Login thất bại - Bỏ trống fields (Validation)', async ({ page }) => {
    await page.goto('/auth/login');
    // Click submit luôn

    const emailInput = page.locator('input[name="email"]');
    // Kiểm tra HTML5 validation
    const isInvalid = await emailInput.evaluate((e: HTMLInputElement) => !e.checkValidity());
    expect(isInvalid).toBeTruthy();
  });

  test('Security - Access Control', async ({ page }) => {
    // Cố truy cập Dashboard mà chưa login
    await page.context().clearCookies();
    await page.goto('/dashboard');

    // Phải bị redirect về Login
    await expect(page).toHaveURL(/.*auth\/login/);
  });

});
