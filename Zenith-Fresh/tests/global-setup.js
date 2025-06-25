// Global setup for Playwright tests
module.exports = async (config) => {
  console.log('🎭 Setting up Playwright tests...');
  
  // Log test environment
  console.log(`Base URL: ${config.use.baseURL}`);
  console.log(`CI Environment: ${process.env.CI ? 'Yes' : 'No'}`);
  
  // Wait a moment for any services to be ready
  if (process.env.CI) {
    console.log('⏳ Waiting for services to be ready in CI...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.log('✅ Playwright setup complete');
};