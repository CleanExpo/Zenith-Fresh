/**
 * Automated Data Cleanup Script
 * 
 * This script should be run as a cron job to automatically clean up expired data
 * according to the retention policies defined in DataRetentionManager.
 * 
 * Usage:
 * node scripts/cleanup-expired-data.js
 * 
 * Cron schedule example (daily at 2 AM):
 * 0 2 * * * /usr/bin/node /path/to/project/scripts/cleanup-expired-data.js
 */

const { DataRetentionManager } = require('../src/lib/data-retention-manager');
const fs = require('fs').promises;
const path = require('path');

async function main() {
  console.log('🧹 Starting data cleanup process...');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  const retentionManager = new DataRetentionManager();
  
  try {
    // Generate and log retention report
    console.log('\n📊 Generating retention report...');
    const report = await retentionManager.generateRetentionReport();
    
    // Save report to file
    const reportsDir = path.join(__dirname, '..', 'reports');
    try {
      await fs.mkdir(reportsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    const reportPath = path.join(reportsDir, `retention-report-${Date.now()}.md`);
    await fs.writeFile(reportPath, report, 'utf8');
    console.log(`📋 Report saved to: ${reportPath}`);
    
    // Perform cleanup
    console.log('\n🗑️  Performing data cleanup...');
    const cleanupResult = await retentionManager.cleanupExpiredData();
    
    // Log results
    console.log('\n✅ Cleanup completed successfully!');
    console.log('\nRecords cleaned:');
    Object.entries(cleanupResult.cleaned).forEach(([dataType, count]) => {
      console.log(`  - ${dataType}: ${count} records`);
    });
    
    if (cleanupResult.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      cleanupResult.errors.forEach(error => {
        console.log(`  - ${error.dataType}: ${error.error}`);
      });
    }
    
    // Optimize database
    console.log('\n🔧 Optimizing database...');
    await retentionManager.optimizeDatabase();
    console.log('✅ Database optimization completed');
    
    // Get updated stats
    console.log('\n📈 Getting updated statistics...');
    const stats = await retentionManager.getDataUsageStats();
    console.log(`Current data usage:
  - Total Analyses: ${stats.totalAnalyses}
  - Total Alerts: ${stats.totalAlerts}
  - Total Trends: ${stats.totalTrends}
  - Estimated size reduction: ${stats.estimatedSizeReduction} records`);
    
    console.log('\n🎉 Data cleanup process completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Data cleanup process failed:', error);
    console.error('Stack trace:', error.stack);
    
    // Log error to file for debugging
    const errorLogPath = path.join(__dirname, '..', 'logs', `cleanup-error-${Date.now()}.log`);
    try {
      await fs.mkdir(path.dirname(errorLogPath), { recursive: true });
      await fs.writeFile(errorLogPath, `${new Date().toISOString()}\n${error.stack}\n`, 'utf8');
      console.log(`Error logged to: ${errorLogPath}`);
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    process.exit(1);
  }
}

// Handle process signals gracefully
process.on('SIGINT', () => {
  console.log('\n⚠️  Received SIGINT. Exiting gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Received SIGTERM. Exiting gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main function
main();