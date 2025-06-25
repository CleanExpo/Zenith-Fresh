// Global teardown for Playwright tests
module.exports = async (config) => {
  console.log('🧹 Cleaning up after Playwright tests...');
  
  // Perform any cleanup tasks here
  // Examples:
  // - Close database connections
  // - Clean up test data
  // - Reset services
  
  console.log('✅ Playwright teardown complete');
};