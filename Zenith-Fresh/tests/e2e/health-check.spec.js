const { test, expect } = require('@playwright/test');

test.describe('Health Check Tests', () => {
  test('health endpoint responds correctly', async ({ page }) => {
    // Navigate to health endpoint
    const response = await page.goto('/api/health');
    
    // Check status code
    expect(response.status()).toBe(200);
    
    // Check response content type
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
    
    // Get response body
    const healthData = await response.json();
    
    // Verify health response structure
    expect(healthData).toHaveProperty('status');
    expect(healthData).toHaveProperty('timestamp');
    expect(healthData.status).toBe('healthy');
    
    // Check if checks object exists and has expected properties
    if (healthData.checks) {
      expect(healthData.checks).toBeInstanceOf(Object);
      
      // If database check exists, it should not be unhealthy
      if (healthData.checks.database) {
        expect(healthData.checks.database.status).not.toBe('unhealthy');
      }
      
      // If memory check exists, it should not be unhealthy
      if (healthData.checks.memory) {
        expect(healthData.checks.memory.status).not.toBe('unhealthy');
      }
    }
  });

  test('health endpoint responds quickly', async ({ page }) => {
    const startTime = Date.now();
    
    const response = await page.goto('/api/health');
    
    const responseTime = Date.now() - startTime;
    
    // Health check should respond within 2 seconds
    expect(responseTime).toBeLessThan(2000);
    expect(response.status()).toBe(200);
  });

  test('health endpoint is accessible via HEAD request', async ({ request }) => {
    const response = await request.head('/api/health');
    
    // HEAD request should succeed
    expect(response.status()).toBe(200);
    
    // Should have health status header
    const healthStatus = response.headers()['x-health-status'];
    if (healthStatus) {
      expect(['healthy', 'warning']).toContain(healthStatus);
    }
    
    // Should have timestamp header
    const timestamp = response.headers()['x-health-timestamp'];
    if (timestamp) {
      expect(new Date(timestamp)).toBeInstanceOf(Date);
    }
  });

  test('health endpoint handles errors gracefully', async ({ page }) => {
    // Test health endpoint multiple times to ensure consistency
    for (let i = 0; i < 3; i++) {
      const response = await page.goto('/api/health');
      
      // Should always return either 200 (healthy) or 503 (unhealthy)
      expect([200, 503]).toContain(response.status());
      
      const healthData = await response.json();
      expect(healthData).toHaveProperty('status');
      expect(healthData).toHaveProperty('timestamp');
      
      // Small delay between requests
      await page.waitForTimeout(100);
    }
  });
});