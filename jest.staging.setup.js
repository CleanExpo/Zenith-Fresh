// Staging test setup
process.env.NODE_ENV = 'test';
process.env.STAGING_URL = process.env.STAGING_URL || 'https://zenith-staging.vercel.app';

// Global test utilities for staging
global.stagingFetch = async (endpoint, options = {}) => {
  const url = `${process.env.STAGING_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Staging API call failed: ${response.status} ${response.statusText}`);
  }
  
  return response;
};

// Health check utility
global.waitForStaging = async (timeout = 60000) => {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    try {
      const response = await global.stagingFetch('/api/health');
      if (response.ok) {
        return true;
      }
    } catch (error) {
      // Continue trying
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  throw new Error(`Staging environment not ready after ${timeout}ms`);
};