import { test, expect } from '@playwright/test';

test.describe('Team Management', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create a new team', async ({ page }) => {
    await page.goto('/teams/new');
    await page.fill('input[name="name"]', 'Test Team');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/team\/[a-zA-Z0-9]+/);
    await expect(page.locator('h1')).toContainText('Test Team');
  });

  test('should update team settings', async ({ page }) => {
    await page.goto('/team/test-team/settings');
    await page.fill('input[name="name"]', 'Updated Team Name');
    await page.click('button[type="submit"]');
    await expect(page.locator('h1')).toContainText('Updated Team Name');
  });

  test('should manage team billing', async ({ page }) => {
    await page.goto('/team/test-team/billing');
    
    // Test subscription upgrade
    await page.click('text=Upgrade to Pro');
    await expect(page).toHaveURL(/\/checkout/);
    
    // Test payment method update
    await page.goto('/team/test-team/billing');
    await page.click('text=Update Payment Method');
    await expect(page).toHaveURL(/\/billing\/payment-method/);
  });

  test('should view team analytics', async ({ page }) => {
    await page.goto('/team/test-team/analytics');
    
    // Check if analytics data is displayed
    await expect(page.locator('text=Total Requests')).toBeVisible();
    await expect(page.locator('text=Total Tokens')).toBeVisible();
    
    // Check if chart is rendered
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should manage team members', async ({ page }) => {
    await page.goto('/team/test-team/members');
    
    // Test inviting a new member
    await page.fill('input[name="email"]', 'newmember@example.com');
    await page.click('text=Invite Member');
    await expect(page.locator('text=Invitation sent')).toBeVisible();
    
    // Test changing member role
    await page.click('text=Change Role');
    await page.selectOption('select[name="role"]', 'admin');
    await page.click('text=Save');
    await expect(page.locator('text=Role updated')).toBeVisible();
  });
}); 