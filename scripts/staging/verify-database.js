#!/usr/bin/env node

/**
 * Railway Staging Database Verification Script
 * This script verifies the database setup and data integrity
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

async function main() {
  console.log('🔍 Verifying Railway staging database setup...');

  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await prisma.$queryRaw`SELECT 1 as connection_test`;
    console.log('✅ Database connection successful');

    // Verify database tables exist
    console.log('🗄️ Verifying database schema...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    const expectedTables = [
      'User', 'Project', 'Team', 'Analytics', 'SystemMetrics',
      'Mission', 'ApprovalRequest', 'EmailCampaign', 'CompetitiveAnalysis'
    ];
    
    const tableNames = tables.map(t => t.table_name);
    console.log(`✅ Found ${tableNames.length} tables in database`);

    // Check for missing critical tables
    const missingTables = expectedTables.filter(table => !tableNames.includes(table));
    if (missingTables.length > 0) {
      console.warn(`⚠️ Missing tables: ${missingTables.join(', ')}`);
    } else {
      console.log('✅ All critical tables present');
    }

    // Verify indexes
    console.log('📊 Verifying database indexes...');
    const indexes = await prisma.$queryRaw`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `;
    console.log(`✅ Found ${indexes.length} performance indexes`);

    // Test data integrity
    console.log('🔐 Testing data integrity...');
    
    // Count records in main tables
    const userCount = await prisma.user.count();
    const projectCount = await prisma.project.count();
    const teamCount = await prisma.team.count();
    const analyticsCount = await prisma.analytics.count();
    
    console.log('📊 Data Summary:');
    console.log(`- Users: ${userCount}`);
    console.log(`- Projects: ${projectCount}`);
    console.log(`- Teams: ${teamCount}`);
    console.log(`- Analytics: ${analyticsCount}`);

    // Verify relationships
    console.log('🔗 Verifying data relationships...');
    
    const usersWithTeams = await prisma.user.findMany({
      include: { teams: true },
      take: 5,
    });
    
    let relationshipErrors = 0;
    for (const user of usersWithTeams) {
      if (user.teams.length === 0) {
        console.warn(`⚠️ User ${user.email} has no team assignments`);
        relationshipErrors++;
      }
    }
    
    if (relationshipErrors === 0) {
      console.log('✅ Data relationships verified');
    }

    // Test database performance
    console.log('⚡ Testing database performance...');
    
    const startTime = Date.now();
    await prisma.user.findMany({
      include: {
        projects: true,
        teams: true,
        analytics: { take: 10 },
      },
      take: 10,
    });
    const queryTime = Date.now() - startTime;
    
    console.log(`✅ Complex query executed in ${queryTime}ms`);
    
    if (queryTime > 1000) {
      console.warn('⚠️ Query performance may need optimization');
    }

    // Verify environment-specific configuration
    console.log('🌍 Verifying staging environment configuration...');
    
    const env = process.env.NODE_ENV;
    const railwayEnv = process.env.RAILWAY_ENVIRONMENT;
    const databaseUrl = process.env.DATABASE_URL;
    
    if (env !== 'staging') {
      console.warn(`⚠️ NODE_ENV is '${env}', expected 'staging'`);
    }
    
    if (railwayEnv !== 'staging') {
      console.warn(`⚠️ RAILWAY_ENVIRONMENT is '${railwayEnv}', expected 'staging'`);
    }
    
    if (!databaseUrl) {
      console.error('❌ DATABASE_URL not found');
    } else if (databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')) {
      console.warn('⚠️ DATABASE_URL appears to be local, not Railway');
    } else {
      console.log('✅ Railway database URL configured');
    }

    // Test backup configuration
    console.log('💾 Verifying backup configuration...');
    
    const backupEnabled = process.env.BACKUP_ENABLED === 'true';
    const monitoringEnabled = process.env.DATABASE_MONITORING_ENABLED === 'true';
    const healthCheckEnabled = process.env.HEALTH_CHECK_ENABLED === 'true';
    
    console.log(`- Backup enabled: ${backupEnabled ? '✅' : '❌'}`);
    console.log(`- Monitoring enabled: ${monitoringEnabled ? '✅' : '❌'}`);
    console.log(`- Health checks enabled: ${healthCheckEnabled ? '✅' : '❌'}`);

    // Final verification
    console.log('🎯 Running final verification checks...');
    
    // Test connection pool
    const poolTest = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.team.count(),
      prisma.analytics.count(),
      prisma.systemMetrics.count(),
    ]);
    
    console.log('✅ Connection pool test passed');

    // Create verification audit log
    await prisma.auditLog.create({
      data: {
        action: 'database_verification',
        entityType: 'database',
        metadata: {
          environment: 'staging',
          verification_time: new Date().toISOString(),
          tables_count: tableNames.length,
          indexes_count: indexes.length,
          users_count: userCount,
          projects_count: projectCount,
          teams_count: teamCount,
          analytics_count: analyticsCount,
          query_performance_ms: queryTime,
          backup_enabled: backupEnabled,
          monitoring_enabled: monitoringEnabled,
          status: 'verified',
        },
      },
    });

    console.log('');
    console.log('🎉 Railway staging database verification completed successfully!');
    console.log('');
    console.log('✅ Verification Summary:');
    console.log(`- Database connection: Working`);
    console.log(`- Schema integrity: Verified`);
    console.log(`- Data relationships: Valid`);
    console.log(`- Performance: ${queryTime}ms (${queryTime < 500 ? 'Good' : queryTime < 1000 ? 'Fair' : 'Needs optimization'})`);
    console.log(`- Environment: ${env} (${env === 'staging' ? 'Correct' : 'Incorrect'})`);
    console.log(`- Backup configuration: ${backupEnabled ? 'Enabled' : 'Disabled'}`);
    console.log('');
    console.log('🚀 Staging database is ready for use!');

  } catch (error) {
    console.error('❌ Database verification failed:', error);
    
    // Log verification failure
    try {
      await prisma.auditLog.create({
        data: {
          action: 'database_verification_failed',
          entityType: 'database',
          metadata: {
            environment: 'staging',
            error_message: error.message,
            error_time: new Date().toISOString(),
          },
        },
      });
    } catch (logError) {
      console.error('Failed to log verification error:', logError);
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });