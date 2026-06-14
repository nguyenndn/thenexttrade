import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const screenshotDir = 'C:/Users/Kee/.gemini/antigravity-ide/brain/97293f1d-d2a4-449c-ba0e-6daa3b2a6147/screenshots';

// Ensure dir exists
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

// Helper function to auto scroll to bottom to trigger animations/IntersectionObservers
async function autoScroll(page: Page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 150; // Scroll distance in pixels
      const timer = setInterval(() => {
        const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          // Scroll back to top to ensure layout is captured properly from top
          window.scrollTo(0, 0);
          resolve(true);
        }
      }, 80); // interval ms
    });
  });
  // Wait a bit after scroll finishes to let animations settle
  await page.waitForTimeout(2000);
}

test.describe('Capture SaaS Landing Page Screenshots', () => {
  test('Capture on Desktop', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 1440, height: 900 });
    
    console.log('Navigating to landing page on Desktop...');
    await page.goto('/', { waitUntil: 'load', timeout: 30000 });
    
    console.log('Scrolling to trigger animations...');
    await autoScroll(page);
    
    const savePath = path.join(screenshotDir, 'landing_desktop.png');
    await page.screenshot({ path: savePath, fullPage: true });
    console.log(`Saved desktop screenshot to ${savePath}`);
  });

  test('Capture on Tablet (iPad)', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 768, height: 1024 });
    
    console.log('Navigating to landing page on Tablet...');
    await page.goto('/', { waitUntil: 'load', timeout: 30000 });
    
    console.log('Scrolling to trigger animations...');
    await autoScroll(page);
    
    const savePath = path.join(screenshotDir, 'landing_tablet.png');
    await page.screenshot({ path: savePath, fullPage: true });
    console.log(`Saved tablet screenshot to ${savePath}`);
  });

  test('Capture on Mobile (Xiaomi)', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 390, height: 873 });
    
    console.log('Navigating to landing page on Mobile...');
    await page.goto('/', { waitUntil: 'load', timeout: 30000 });
    
    console.log('Scrolling to trigger animations...');
    await autoScroll(page);
    
    const savePath = path.join(screenshotDir, 'landing_mobile.png');
    await page.screenshot({ path: savePath, fullPage: true });
    console.log(`Saved mobile screenshot to ${savePath}`);
  });
});
