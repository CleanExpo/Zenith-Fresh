describe('Staging Health Checks', () => {
  beforeAll(async () => {
    await global.waitForStaging();
  }, 60000);

  test('should respond to health check endpoint', async () => {
    const response = await global.stagingFetch('/api/health');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.timestamp).toBeDefined();
  });

  test('should serve homepage without errors', async () => {
    const response = await global.stagingFetch('/');
    
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
  });

  test('should handle API routes correctly', async () => {
    const response = await global.stagingFetch('/api/auth/providers');
    
    expect(response.status).toBe(200);
    const providers = await response.json();
    expect(providers).toBeDefined();
  });

  test('should have proper security headers', async () => {
    const response = await global.stagingFetch('/');
    
    expect(response.headers.get('x-frame-options')).toBeDefined();
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  });

  test('should handle 404 routes gracefully', async () => {
    const response = await fetch(`${process.env.STAGING_URL}/non-existent-route`);
    
    expect(response.status).toBe(404);
  });
});