/**
 * End-to-End tests for critical user journeys
 * Tests complete user flows from signup to key feature usage
 */

const { test, expect } = require('@playwright/test');

// Test configuration
const TEST_CONFIG = {
  timeout: 60000,
  retries: 2,
  baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
  testUser: {
    email: 'test-user@zenith-test.com',
    password: 'TestPassword123!',
    name: 'Test User',
  },
  testTeam: {
    name: 'Test Team E2E',
    description: 'End-to-end testing team',
  },
  testWebsite: 'https://example.com',
};

test.describe('Critical User Journeys', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Setup test data cleanup
    await page.addInitScript(() => {
      // Clean up any existing test data
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('User Registration and Authentication', () => {
    test('should complete user signup flow', async () => {
      await page.goto('/auth/signin');

      // Navigate to signup
      await page.click('text=Sign up');
      await expect(page).toHaveURL(/auth\/signup/);

      // Fill signup form
      await page.fill('[data-testid="name-input"]', TEST_CONFIG.testUser.name);
      await page.fill('[data-testid="email-input"]', TEST_CONFIG.testUser.email);
      await page.fill('[data-testid="password-input"]', TEST_CONFIG.testUser.password);
      await page.fill('[data-testid="confirm-password-input"]', TEST_CONFIG.testUser.password);

      // Accept terms
      await page.check('[data-testid="terms-checkbox"]');

      // Submit form
      await page.click('[data-testid="signup-button"]');

      // Should redirect to dashboard or verification
      await expect(page).toHaveURL(/dashboard|verify/);

      // If verification required, handle it
      if (page.url().includes('verify')) {
        // For testing, we might need to mock email verification
        await page.goto('/dashboard');
      }

      // Verify user is logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should handle login with existing credentials', async () => {
      await page.goto('/auth/signin');

      // Fill login form
      await page.fill('[data-testid="email-input"]', 'zenithfresh25@gmail.com');
      await page.fill('[data-testid="password-input"]', 'F^bf35(llm1120!2a');

      // Submit form
      await page.click('[data-testid="signin-button"]');

      // Should redirect to dashboard
      await expect(page).toHaveURL(/dashboard/);

      // Verify user is logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should handle login errors gracefully', async () => {
      await page.goto('/auth/signin');

      // Fill with invalid credentials
      await page.fill('[data-testid="email-input"]', 'invalid@email.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');

      // Submit form
      await page.click('[data-testid="signin-button"]');

      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText(/Invalid credentials|Sign in failed/);
    });

    test('should handle password reset flow', async () => {
      await page.goto('/auth/signin');

      // Click forgot password
      await page.click('text=Forgot password?');
      await expect(page).toHaveURL(/auth\/forgot-password/);

      // Fill email
      await page.fill('[data-testid="email-input"]', TEST_CONFIG.testUser.email);

      // Submit
      await page.click('[data-testid="reset-button"]');

      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });
  });

  test.describe('Website Analyzer Journey', () => {
    test.beforeEach(async () => {
      // Login before each test
      await page.goto('/auth/signin');
      await page.fill('[data-testid="email-input"]', 'zenithfresh25@gmail.com');
      await page.fill('[data-testid="password-input"]', 'F^bf35(llm1120!2a');
      await page.click('[data-testid="signin-button"]');
      await expect(page).toHaveURL(/dashboard/);
    });

    test('should complete website analysis flow', async () => {
      // Navigate to website analyzer
      await page.click('[data-testid="website-analyzer-nav"]');
      await expect(page).toHaveURL(/tools\/website-analyzer/);

      // Fill URL input
      await page.fill('[data-testid="url-input"]', TEST_CONFIG.testWebsite);

      // Start analysis
      await page.click('[data-testid="analyze-button"]');

      // Should show loading state
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();

      // Wait for analysis to complete (with timeout)
      await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible({ timeout: 30000 });

      // Verify results sections are present
      await expect(page.locator('[data-testid="performance-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="seo-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="accessibility-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="security-score"]')).toBeVisible();

      // Verify scores are numbers
      const performanceScore = await page.textContent('[data-testid="performance-score"]');
      expect(performanceScore).toMatch(/\d+/);
    });

    test('should handle invalid URLs gracefully', async () => {
      await page.goto('/tools/website-analyzer');

      // Fill invalid URL
      await page.fill('[data-testid="url-input"]', 'not-a-valid-url');

      // Try to analyze
      await page.click('[data-testid="analyze-button"]');

      // Should show error
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText(/Invalid URL|URL format/);
    });

    test('should save analysis to history', async () => {
      await page.goto('/tools/website-analyzer');

      // Perform analysis
      await page.fill('[data-testid="url-input"]', TEST_CONFIG.testWebsite);
      await page.click('[data-testid="analyze-button"]');
      await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible({ timeout: 30000 });

      // Navigate to history
      await page.click('[data-testid="scan-history-tab"]');

      // Should see the analysis in history
      await expect(page.locator(`[data-testid="history-item-${TEST_CONFIG.testWebsite}"]`)).toBeVisible();
    });

    test('should generate PDF report', async () => {
      await page.goto('/tools/website-analyzer');

      // Perform analysis first
      await page.fill('[data-testid="url-input"]', TEST_CONFIG.testWebsite);
      await page.click('[data-testid="analyze-button"]');
      await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible({ timeout: 30000 });

      // Click PDF download
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-pdf-button"]');
      const download = await downloadPromise;

      // Verify download
      expect(download.suggestedFilename()).toContain('.pdf');
      expect(await download.path()).toBeTruthy();
    });

    test('should schedule recurring scans', async () => {
      await page.goto('/tools/website-analyzer');

      // Navigate to scheduled scans
      await page.click('[data-testid="scheduled-scans-tab"]');

      // Create new scheduled scan
      await page.click('[data-testid="create-schedule-button"]');

      // Fill schedule form
      await page.fill('[data-testid="schedule-url-input"]', TEST_CONFIG.testWebsite);
      await page.selectOption('[data-testid="frequency-select"]', 'weekly');
      await page.fill('[data-testid="notification-email"]', TEST_CONFIG.testUser.email);

      // Save schedule
      await page.click('[data-testid="save-schedule-button"]');

      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

      // Should appear in scheduled scans list
      await expect(page.locator(`[data-testid="schedule-item-${TEST_CONFIG.testWebsite}"]`)).toBeVisible();
    });
  });

  test.describe('Team Management Journey', () => {
    test.beforeEach(async () => {
      // Login before each test
      await page.goto('/auth/signin');
      await page.fill('[data-testid="email-input"]', 'zenithfresh25@gmail.com');
      await page.fill('[data-testid="password-input"]', 'F^bf35(llm1120!2a');
      await page.click('[data-testid="signin-button"]');
      await expect(page).toHaveURL(/dashboard/);
    });

    test('should create new team', async () => {
      // Navigate to teams
      await page.click('[data-testid="teams-nav"]');
      await expect(page).toHaveURL(/teams/);

      // Click create team
      await page.click('[data-testid="create-team-button"]');

      // Fill team form
      await page.fill('[data-testid="team-name-input"]', TEST_CONFIG.testTeam.name);
      await page.fill('[data-testid="team-description-input"]', TEST_CONFIG.testTeam.description);

      // Verify slug is auto-generated
      const slugValue = await page.inputValue('[data-testid="team-slug-input"]');
      expect(slugValue).toBe('test-team-e2e');

      // Submit form
      await page.click('[data-testid="create-team-submit"]');

      // Should navigate to team page
      await expect(page).toHaveURL(/teams\/test-team-e2e/);

      // Verify team details
      await expect(page.locator('[data-testid="team-name"]')).toContainText(TEST_CONFIG.testTeam.name);
      await expect(page.locator('[data-testid="team-description"]')).toContainText(TEST_CONFIG.testTeam.description);
    });

    test('should handle team name conflicts', async () => {
      await page.goto('/teams');

      await page.click('[data-testid="create-team-button"]');
      await page.fill('[data-testid="team-name-input"]', 'Existing Team Name');
      await page.click('[data-testid="create-team-submit"]');

      // Should show error for existing team name
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText(/already exists|taken/);
    });

    test('should invite team members', async () => {
      // First create a team
      await page.goto('/teams');
      await page.click('[data-testid="create-team-button"]');
      await page.fill('[data-testid="team-name-input"]', `${TEST_CONFIG.testTeam.name} Invite`);
      await page.click('[data-testid="create-team-submit"]');
      await expect(page).toHaveURL(/teams\//);

      // Navigate to members tab
      await page.click('[data-testid="members-tab"]');

      // Click invite member
      await page.click('[data-testid="invite-member-button"]');

      // Fill invitation form
      await page.fill('[data-testid="invite-email-input"]', 'newmember@test.com');
      await page.selectOption('[data-testid="invite-role-select"]', 'MEMBER');

      // Send invitation
      await page.click('[data-testid="send-invitation-button"]');

      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

      // Should appear in pending invitations
      await expect(page.locator('[data-testid="pending-invitation-newmember@test.com"]')).toBeVisible();
    });

    test('should manage team projects', async () => {
      // Navigate to existing team or create one
      await page.goto('/teams');
      
      // If no teams exist, create one first
      const teamExists = await page.locator('[data-testid="team-card"]').count();
      if (teamExists === 0) {
        await page.click('[data-testid="create-team-button"]');
        await page.fill('[data-testid="team-name-input"]', TEST_CONFIG.testTeam.name);
        await page.click('[data-testid="create-team-submit"]');
      } else {
        await page.click('[data-testid="team-card"]').first();
      }

      // Navigate to projects tab
      await page.click('[data-testid="projects-tab"]');

      // Create new project
      await page.click('[data-testid="create-project-button"]');
      await page.fill('[data-testid="project-name-input"]', 'Test Project');
      await page.fill('[data-testid="project-url-input"]', TEST_CONFIG.testWebsite);
      await page.click('[data-testid="create-project-submit"]');

      // Should show success and project in list
      await expect(page.locator('[data-testid="project-Test Project"]')).toBeVisible();
    });

    test('should handle team settings', async () => {
      await page.goto('/teams');
      
      // Navigate to team (create if needed)
      const teamExists = await page.locator('[data-testid="team-card"]').count();
      if (teamExists === 0) {
        await page.click('[data-testid="create-team-button"]');
        await page.fill('[data-testid="team-name-input"]', TEST_CONFIG.testTeam.name);
        await page.click('[data-testid="create-team-submit"]');
      } else {
        await page.click('[data-testid="team-card"]').first();
      }

      // Go to settings
      await page.click('[data-testid="team-settings-tab"]');

      // Update team settings
      await page.fill('[data-testid="team-name-edit"]', `${TEST_CONFIG.testTeam.name} Updated`);
      await page.click('[data-testid="save-settings-button"]');

      // Should show success
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });
  });

  test.describe('Dashboard and Navigation', () => {
    test.beforeEach(async () => {
      // Login before each test
      await page.goto('/auth/signin');
      await page.fill('[data-testid="email-input"]', 'zenithfresh25@gmail.com');
      await page.fill('[data-testid="password-input"]', 'F^bf35(llm1120!2a');
      await page.click('[data-testid="signin-button"]');
      await expect(page).toHaveURL(/dashboard/);
    });

    test('should display dashboard overview', async () => {
      // Verify dashboard elements
      await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="recent-scans"]')).toBeVisible();
      await expect(page.locator('[data-testid="team-activity"]')).toBeVisible();
      await expect(page.locator('[data-testid="quick-actions"]')).toBeVisible();
    });

    test('should navigate between main sections', async () => {
      // Test navigation to different sections
      const navItems = [
        { testId: 'dashboard-nav', url: '/dashboard' },
        { testId: 'website-analyzer-nav', url: '/tools/website-analyzer' },
        { testId: 'teams-nav', url: '/teams' },
        { testId: 'billing-nav', url: '/billing' },
      ];

      for (const item of navItems) {
        await page.click(`[data-testid="${item.testId}"]`);
        await expect(page).toHaveURL(new RegExp(item.url.replace('/', '\\/')));
      }
    });

    test('should handle user menu actions', async () => {
      // Open user menu
      await page.click('[data-testid="user-menu"]');

      // Verify menu items
      await expect(page.locator('[data-testid="profile-link"]')).toBeVisible();
      await expect(page.locator('[data-testid="settings-link"]')).toBeVisible();
      await expect(page.locator('[data-testid="logout-link"]')).toBeVisible();

      // Test profile navigation
      await page.click('[data-testid="profile-link"]');
      await expect(page).toHaveURL(/profile/);
    });

    test('should handle logout', async () => {
      // Open user menu and logout
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-link"]');

      // Should redirect to login
      await expect(page).toHaveURL(/auth\/signin/);

      // Verify user is logged out
      await expect(page.locator('[data-testid="signin-button"]')).toBeVisible();
    });
  });

  test.describe('Responsive Design and Accessibility', () => {
    test.beforeEach(async () => {
      // Login before each test
      await page.goto('/auth/signin');
      await page.fill('[data-testid="email-input"]', 'zenithfresh25@gmail.com');
      await page.fill('[data-testid="password-input"]', 'F^bf35(llm1120!2a');
      await page.click('[data-testid="signin-button"]');
      await expect(page).toHaveURL(/dashboard/);
    });

    test('should work on mobile viewport', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Test navigation on mobile
      await page.click('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

      // Test website analyzer on mobile
      await page.click('[data-testid="website-analyzer-nav"]');
      await page.fill('[data-testid="url-input"]', TEST_CONFIG.testWebsite);
      
      // Form should be usable on mobile
      await expect(page.locator('[data-testid="url-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="analyze-button"]')).toBeVisible();
    });

    test('should work on tablet viewport', async () => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      // Test layout on tablet
      await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();

      // Test team creation on tablet
      await page.goto('/teams');
      await page.click('[data-testid="create-team-button"]');
      await expect(page.locator('[data-testid="team-name-input"]')).toBeVisible();
    });

    test('should have proper keyboard navigation', async () => {
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');

      // Should be able to navigate with keyboard
      const focusedElement = await page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should have proper ARIA labels', async () => {
      // Check for important ARIA attributes
      await expect(page.locator('[role="main"]')).toBeVisible();
      await expect(page.locator('[role="navigation"]')).toBeVisible();
      
      // Form elements should have proper labels
      await page.goto('/tools/website-analyzer');
      const urlInput = page.locator('[data-testid="url-input"]');
      await expect(urlInput).toHaveAttribute('aria-label');
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async () => {
      // Mock network failure
      await page.route('**/api/**', route => route.abort());

      await page.goto('/auth/signin');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'password');
      await page.click('[data-testid="signin-button"]');

      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    });

    test('should handle slow API responses', async () => {
      // Mock slow API response
      await page.route('**/api/website-analyzer/analyze', async route => {
        await new Promise(resolve => setTimeout(resolve, 5000));
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ url: TEST_CONFIG.testWebsite, score: 85 }),
        });
      });

      await page.goto('/auth/signin');
      await page.fill('[data-testid="email-input"]', 'zenithfresh25@gmail.com');
      await page.fill('[data-testid="password-input"]', 'F^bf35(llm1120!2a');
      await page.click('[data-testid="signin-button"]');
      
      await page.goto('/tools/website-analyzer');
      await page.fill('[data-testid="url-input"]', TEST_CONFIG.testWebsite);
      await page.click('[data-testid="analyze-button"]');

      // Should show loading state
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
      
      // Should eventually complete
      await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible({ timeout: 10000 });
    });

    test('should handle browser back/forward navigation', async () => {
      await page.goto('/auth/signin');
      await page.fill('[data-testid="email-input"]', 'zenithfresh25@gmail.com');
      await page.fill('[data-testid="password-input"]', 'F^bf35(llm1120!2a');
      await page.click('[data-testid="signin-button"]');

      // Navigate through pages
      await page.click('[data-testid="teams-nav"]');
      await page.click('[data-testid="website-analyzer-nav"]');

      // Use browser back button
      await page.goBack();
      await expect(page).toHaveURL(/teams/);

      // Use browser forward button
      await page.goForward();
      await expect(page).toHaveURL(/website-analyzer/);
    });
  });

  test.describe('Performance and Load Testing', () => {
    test('should load pages within acceptable time', async () => {
      const startTime = Date.now();
      
      await page.goto('/auth/signin');
      await page.fill('[data-testid="email-input"]', 'zenithfresh25@gmail.com');
      await page.fill('[data-testid="password-input"]', 'F^bf35(llm1120!2a');
      await page.click('[data-testid="signin-button"]');
      
      const loadTime = Date.now() - startTime;
      
      // Dashboard should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle multiple concurrent actions', async () => {
      await page.goto('/auth/signin');
      await page.fill('[data-testid="email-input"]', 'zenithfresh25@gmail.com');
      await page.fill('[data-testid="password-input"]', 'F^bf35(llm1120!2a');
      await page.click('[data-testid="signin-button"]');

      // Perform multiple actions simultaneously
      const actions = [
        page.click('[data-testid="teams-nav"]'),
        page.click('[data-testid="website-analyzer-nav"]'),
        page.click('[data-testid="user-menu"]'),
      ];

      // Should handle concurrent navigation
      await Promise.all(actions);
      
      // App should remain responsive
      await expect(page.locator('body')).toBeVisible();
    });
  });
});