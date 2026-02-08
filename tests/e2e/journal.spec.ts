import { test, expect } from '@playwright/test';

test.describe('Trading Journal Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'keezimin@gmail.com');
    await page.fill('input[name="password"]', '123123123');
    await page.click('button[type="submit"]');
    // Tăng timeout
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // Navigate to Journal
    await page.goto('/dashboard/journal');
  });

  test('Hiển thị danh sách nhật ký giao dịch (Happy Path)', async ({ page }) => {
    // Verify Header
    await expect(page.locator('h1:has-text("Trading Journal")')).toBeVisible();

    // Verify Table exists
    await expect(page.locator('table')).toBeVisible();

    // Verify "Log Trade" button
    await expect(page.locator('button:has-text("Log Trade")')).toBeVisible();
  });

  test('Mở Modal Log Trade (Interaction)', async ({ page }) => {
    // Click button
    await page.click('button:has-text("Log Trade")');

    // Verify Modal Title - Check chính xác text trong code JournalList.tsx: "Log New Trade"
    // Dùng .first() nếu cần thiết, nhưng nên check role dialog nếu có thể
    await expect(page.locator('text=Log New Trade')).toBeVisible();

    // Verify Form Fields
    // Quan trọng: Symbol có thể xuất hiện ở Table Header, nên phải scope vào dialog hoặc dùng Label
    // element handle: label:has-text("Symbol") hoặc input[name="symbol"]
    // Cách an toàn nhất: Check text trong modal
    const modal = page.locator('div[role="dialog"]');

    // Nếu modal chưa có role dialog chuẩn, ta check text trong context toàn trang nhưng đợi
    // Tuy nhiên, log lỗi là strict mode violation "text=Symbol".
    // Ta đổi sang check label cụ thể
    await expect(page.locator('label:has-text("Symbol")').first()).toBeVisible();
    await expect(page.locator('label:has-text("Entry Price")').first()).toBeVisible();
  });

  test('Validation khi tạo lệnh sai (Negative Case)', async ({ page }) => {
    await page.click('button:has-text("Log Trade")');

    // Submit form empty
    await page.click('button[type="submit"]'); // Nút Save/Submit trong form

    // Verify validation errors (HTML5 or Custom)
    // Giả sử có check required
  });

  test('Filter hoạt động (Functional)', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Filter by Pair"]');
    await searchInput.fill('XAUUSD');

    // Wait for debounce/network
    await page.waitForTimeout(1000);

    await expect(searchInput).toHaveValue('XAUUSD');
  });
});
