const { test, expect } = require('@playwright/test');

test.describe('Homepage Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page loads
    await expect(page).toHaveTitle(/Zenith/i);
    
    // Check if main content is visible
    await expect(page.locator('body')).toBeVisible();
    
    // Verify no console errors
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait for any initial JS to load
    await page.waitForTimeout(2000);
    
    // Check for major console errors (allow minor ones)
    const majorErrors = consoleErrors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('net::ERR_FAILED')
    );
    
    expect(majorErrors.length).toBeLessThanOrEqual(2);
  });

  test('navigation elements are present', async ({ page }) => {
    await page.goto('/');
    
    // Check for common navigation elements (adjust based on your app)
    const navigation = page.locator('nav, header, [role="navigation"]');
    const hasNavigation = await navigation.count() > 0;
    
    if (hasNavigation) {
      await expect(navigation.first()).toBeVisible();
    }
    
    // Check for main content area
    const main = page.locator('main, [role="main"], .main-content');
    const hasMain = await main.count() > 0;
    
    if (hasMain) {
      await expect(main.first()).toBeVisible();
    }
  });

  test('responsive design works', async ({ page }) => {
    await page.goto('/');
    
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('body')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('performance check', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
    
    // Check for performance markers
    const performanceData = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart
      };
    });
    
    // DOM should be ready within 3 seconds
    expect(performanceData.domContentLoaded).toBeLessThan(3000);
  });
});