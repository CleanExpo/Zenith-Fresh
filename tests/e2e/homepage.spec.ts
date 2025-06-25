import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('h1')).toContainText('Zenith');
    await expect(page.locator('text=Get Started')).toBeVisible();
  });

  test('should navigate to sign in page', async ({ page }) => {
    await page.goto('/');
    
    await page.click('text=Sign in');
    await expect(page).toHaveURL('/auth/signin');
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    const title = await page.title();
    expect(title).toContain('Zenith');
    
    const description = await page.getAttribute('meta[name="description"]', 'content');
    expect(description).toBeTruthy();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
  });
});