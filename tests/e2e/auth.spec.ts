import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display sign in page', async ({ page }) => {
    await page.goto('/auth/signin');
    
    await expect(page.locator('h1')).toContainText('Sign in');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should handle invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin');
    
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Use demo credentials
    await page.fill('input[type="email"]', 'zenithfresh25@gmail.com');
    await page.fill('input[type="password"]', 'F^bf35(llm1120!2a');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
  });

  test('should allow user to sign out', async ({ page }) => {
    // Login first
    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', 'zenithfresh25@gmail.com');
    await page.fill('input[type="password"]', 'F^bf35(llm1120!2a');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    
    // Sign out
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Sign out');
    
    await expect(page).toHaveURL('/');
  });
});