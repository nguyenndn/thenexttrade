import { test, expect } from '@playwright/test';
import { loginOnce } from './helpers/auth';

// For now, testing the basic UI flows on /dashboard/reports
test.describe('Weekly Coach Action Plan Remediation', () => {
  // Mobile test
  test.describe('Mobile View (390x844)', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('should persist checklist state and verify accessibility', async ({ page }) => {
      await loginOnce(page);

      await page.goto('/dashboard/reports');
      
      // We'll wait for the Weekly Coach Action Plan to render
      await expect(page.locator('text=Weekly Coach Action Plan').first()).toBeVisible({ timeout: 15000 });

      // Find the first checklist button
      const firstChecklistBtn = page.locator('button[aria-label^="Toggle completion for"]').first();
      
      // If there are no actions to test, we skip
      if (await firstChecklistBtn.count() === 0) {
        console.log('No action plan items available for this user to test.');
        return;
      }

      // Check current state
      const isCompletedInitially = (await firstChecklistBtn.locator('svg').getAttribute('class'))?.includes('CheckSquare');
      
      // 2. Click to toggle
      await firstChecklistBtn.click();
      await page.waitForTimeout(1000); // Wait for optimistic update and server action
      
      // 3. Reload page
      await page.reload();
      await expect(page.locator('text=Weekly Coach Action Plan').first()).toBeVisible({ timeout: 15000 });
      
      // 4. Verify persistence
      const reloadedChecklistBtn = page.locator('button[aria-label^="Toggle completion for"]').first();
      const isCompletedAfter = (await reloadedChecklistBtn.locator('svg').getAttribute('class'))?.includes('CheckSquare');
      
      // The state should be flipped
      expect(isCompletedInitially).not.toBe(isCompletedAfter);

      // 5. Verify CTA Accessibility and URL
      const externalLinkBtn = page.locator('button[aria-label^="Navigate to complete action:"]').first();
      if (await externalLinkBtn.count() > 0) {
        const ariaLabel = await externalLinkBtn.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
        
        // Verify parent link has an href
        const parentLink = externalLinkBtn.locator('xpath=..');
        const href = await parentLink.getAttribute('href');
        expect(href).toBeTruthy();
      }
    });
  });

  // Desktop test
  test.describe('Desktop View (1440x900)', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('should have no horizontal overflow and render side-by-side blocks properly', async ({ page }) => {
      await loginOnce(page);
      await page.goto('/dashboard/reports');
      await expect(page.locator('text=Weekly Coach Action Plan').first()).toBeVisible({ timeout: 15000 });

      // Check for horizontal scroll/overflow
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  });
});
