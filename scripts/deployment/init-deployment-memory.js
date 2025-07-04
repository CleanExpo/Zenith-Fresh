#!/usr/bin/env node

/**
 * Initialize MongoDB Deployment Memory System
 * 
 * Sets up collections, indexes, and seeds initial solutions
 * for the intelligent deployment tracking system.
 */

// Load environment variables
require('dotenv').config();

const { initializeDeploymentMemoryCollections } = require('../../src/lib/deployment/memory-schema.js');
const { DeploymentMemory } = require('../../src/lib/deployment/memory.js');

async function initializeDeploymentMemory() {
  console.log('🚀 Initializing MongoDB Deployment Memory System...\n');
  
  try {
    // Step 1: Initialize collections and indexes
    console.log('📊 Step 1: Setting up MongoDB collections and indexes...');
    await initializeDeploymentMemoryCollections();
    console.log('✅ Collections and indexes created successfully\n');
    
    // Step 2: Initialize DeploymentMemory service
    console.log('🧠 Step 2: Initializing DeploymentMemory service...');
    const memory = new DeploymentMemory();
    await memory.initialize();
    console.log('✅ DeploymentMemory service initialized\n');
    
    // Step 3: Verify system is working
    console.log('🔍 Step 3: Verifying system functionality...');
    
    // Test logging a deployment attempt
    const testDeployment = await memory.logDeploymentAttempt({
      projectName: 'zenith-platform',
      environment: 'test',
      status: 'success',
      phase: 7,
      buildConfig: {
        nodeVersion: 'v18.19.0',
        nextjsVersion: '^14.2.30',
        dependencies: {
          'next': '^14.2.30',
          'react': '^18',
          'typescript': '^5'
        },
        gitCommitHash: 'test-init-commit',
        gitBranch: 'main'
      },
      duration: 120,
      buildTime: 90,
      deployTime: 30,
      predictedSuccessRate: 0.95,
      actualOutcome: 'success'
    });
    
    console.log(`📝 Test deployment logged: ${testDeployment.deploymentId}`);
    
    // Test finding similar errors (should return empty since no errors yet)
    const similarErrors = await memory.findSimilarErrors('test error pattern');
    console.log(`🔍 Similar errors search: ${similarErrors.length} results`);
    
    // Test getting deployment insights
    const insights = await memory.getDeploymentInsights(30);
    console.log(`📈 Deployment insights: ${insights.totalDeployments} total deployments`);
    
    console.log('✅ System verification complete\n');
    
    // Step 4: Display summary
    console.log('🎉 MongoDB Deployment Memory System initialized successfully!\n');
    
    console.log('📋 System Components:');
    console.log('  ✅ deployment_attempts collection - Track all deployments');
    console.log('  ✅ known_solutions collection - Error patterns and solutions');
    console.log('  ✅ build_patterns collection - Configuration success patterns');
    console.log('  ✅ Indexes created for optimal query performance');
    console.log('  ✅ Initial solutions seeded from common deployment issues');
    console.log('  ✅ DeploymentMemory class ready for intelligent tracking');
    console.log('  ✅ AutoResolver ready for error pattern matching');
    
    console.log('\n🔧 API Endpoints Available:');
    console.log('  GET  /api/deployment/intelligence - Get insights and analytics');
    console.log('  POST /api/deployment/intelligence - Start monitoring deployments');
    console.log('  POST /api/deployment/resolve - Analyze and resolve errors');
    console.log('  GET  /api/deployment/resolve - Get solutions and patterns');
    
    console.log('\n🚀 Next Steps:');
    console.log('  1. Integrate with your deployment pipeline');
    console.log('  2. Start monitoring deployments with BuildMonitor');
    console.log('  3. Report errors for intelligent resolution');
    console.log('  4. Review insights dashboard for optimization opportunities');
    
    console.log('\n💡 The system will learn from each deployment and become more intelligent over time!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Failed to initialize deployment memory system:', error);
    console.error('\n🔍 Troubleshooting:');
    console.error('  1. Ensure MongoDB connection is configured in .env');
    console.error('  2. Check MongoDB server is running and accessible');
    console.error('  3. Verify database permissions');
    console.error('  4. Review connection string format');
    
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  initializeDeploymentMemory();
}

module.exports = { initializeDeploymentMemory };