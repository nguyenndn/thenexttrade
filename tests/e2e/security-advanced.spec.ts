import { test, expect } from '@playwright/test';

test.describe('Security & Logic Verification (E2E)', () => {

  test('Security: Weak Password Policy Validation (Signup)', async ({ page }) => {
    await page.goto('/auth/signup');

    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', `weak-${Date.now()}@test.com`);

    // Very short password to guarantee "Invalid inputs" error seen in debug
    await page.fill('input[name="password"]', '123');
    await page.fill('input[name="confirm"]', '123');

    await page.check('#terms', { force: true });

    await page.click('button[type="submit"]');

    // Expect Error: "Invalid inputs..."
    // We match partial text to be robust
    await expect(page.locator('text=Invalid inputs')).toBeVisible({ timeout: 10000 });

    expect(page.url()).toContain('/auth/signup');
  });

  test('Security: RBAC - Protected Admin Route (Guest)', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/admin');
    await expect(page).not.toHaveURL(/\/admin/);
  });

  test('Security: XSS Input Sanitization in Profile Bio', async ({ page }) => {
    // 1. Login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'keezimin@gmail.com');
    await page.fill('input[name="password"]', '123123123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // 2. Go to Settings
    await page.goto('/dashboard/settings');

    // 3. Inject XSS
    const xssPayload = '<script>window.xssDetected = true</script>';
    // Select textarea by functionality if specific selectors fail (there's usually 1 bio textarea)
    const bioInput = page.locator('textarea').first();

    await expect(bioInput).toBeVisible();
    await bioInput.fill(xssPayload);

    // 4. Save
    await page.click('button[type="submit"]');

    // 5. Verify Success match
    // Matches "Profile updated successfully!", "Profile updated", etc.
    await expect(page.locator('text=updated')).toBeVisible();

    // 6. Reload and Check
    await page.reload();
    await expect(bioInput).toBeVisible();

    const isXssExecuted = await page.evaluate(() => (window as any).xssDetected);
    expect(isXssExecuted).toBeFalsy();

    const bioContent = await bioInput.inputValue();
    expect(bioContent).not.toContain('<script>');
  });

});
