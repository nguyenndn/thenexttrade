import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const screenshotDir = 'C:/Users/Kee/.gemini/antigravity-ide/brain/97293f1d-d2a4-449c-ba0e-6daa3b2a6147/screenshots';

// Ensure dir exists
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

const routes = [
  { name: 'landing', path: '/' },
  { name: 'about', path: '/about' },
  { name: 'contact', path: '/contact' },
  { name: 'academy', path: '/academy' },
  { name: 'brokers', path: '/brokers' },
  { name: 'cookie_policy', path: '/legal/cookie-policy' },
  { name: 'privacy_policy', path: '/legal/privacy-policy' },
  { name: 'terms_of_service', path: '/legal/terms-of-service' },
  { name: 'tools_hub', path: '/tools' },
  { name: 'compounding_calculator', path: '/tools/compounding-calculator' },
  { name: 'margin_calculator', path: '/tools/margin-calculator' },
  { name: 'risk_reward_calculator', path: '/tools/risk-reward-calculator' },
  { name: 'currency_converter', path: '/tools/currency-converter' },
  { name: 'position_size_calculator', path: '/tools/position-size-calculator' },
  { name: 'economic_calendar', path: '/tools/economic-calendar' },
  { name: 'knowledge_hub', path: '/knowledge' },
  { name: 'risk_management', path: '/knowledge/risk-management' },
  { name: 'search_results', path: '/search?q=risk' },
  { name: 'article_detail', path: '/articles/xau-usd-gold-trading-complete-guide' },
  { name: 'get_started', path: '/get-started' },
  { name: 'community', path: '/community' },
  { name: 'auth_login', path: '/auth/login' },
  { name: 'auth_signup', path: '/auth/signup' },
  { name: 'auth_forgot_password', path: '/auth/forgot-password' }
];

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

test.describe.configure({ mode: 'serial' }); // Run sequentially

test.describe('Capture Screenshots of Public Pages', () => {
  
  test('Capture on iPad (Tablet)', async ({ page }) => {
    test.setTimeout(300000); // 300s timeout
    await page.setViewportSize({ width: 768, height: 1024 });
    
    for (const route of routes) {
      console.log(`Navigating to ${route.path} on iPad...`);
      try {
        await page.goto(route.path, { waitUntil: 'load', timeout: 45000 });
        console.log(`Scrolling ${route.path} to trigger animations...`);
        await autoScroll(page);
        
        const savePath = path.join(screenshotDir, `${route.name}_ipad.png`);
        await page.screenshot({ path: savePath, fullPage: true });
        console.log(`Saved screenshot to ${savePath}`);
      } catch (err) {
        console.error(`Failed to capture ${route.path} on iPad:`, err);
      }
    }
  });

  test('Capture on Xiaomi (Mobile)', async ({ page }) => {
    test.setTimeout(300000); // 300s timeout
    await page.setViewportSize({ width: 390, height: 873 });
    
    for (const route of routes) {
      console.log(`Navigating to ${route.path} on Xiaomi 13 Pro...`);
      try {
        await page.goto(route.path, { waitUntil: 'load', timeout: 45000 });
        console.log(`Scrolling ${route.path} to trigger animations...`);
        await autoScroll(page);
        
        const savePath = path.join(screenshotDir, `${route.name}_xiaomi.png`);
        await page.screenshot({ path: savePath, fullPage: true });
        console.log(`Saved screenshot to ${savePath}`);
      } catch (err) {
        console.error(`Failed to capture ${route.path} on Xiaomi:`, err);
      }
    }
  });
});
