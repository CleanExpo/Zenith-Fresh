#!/usr/bin/env node

/**
 * Railway Staging Database Health Check Script
 * This script monitors database health and performance metrics
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

class DatabaseHealthChecker {
  constructor() {
    this.metrics = {
      connectionTime: 0,
      queryTime: 0,
      connectionCount: 0,
      databaseSize: 0,
      indexHealth: 0,
      slowQueries: 0,
    };
  }

  async checkConnection() {
    console.log('🔌 Checking database connection...');
    
    const startTime = Date.now();
    
    try {
      await prisma.$queryRaw`SELECT 1 as health_check`;
      this.metrics.connectionTime = Date.now() - startTime;
      console.log(`✅ Connection successful (${this.metrics.connectionTime}ms)`);
      return true;
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
  }

  async checkQueryPerformance() {
    console.log('⚡ Checking query performance...');
    
    const startTime = Date.now();
    
    try {
      await prisma.user.findMany({
        include: {
          projects: { take: 5 },
          teams: { take: 3 },
          analytics: { take: 10 },
        },
        take: 10,
      });
      
      this.metrics.queryTime = Date.now() - startTime;
      console.log(`✅ Complex query executed in ${this.metrics.queryTime}ms`);
      
      if (this.metrics.queryTime > 1000) {
        console.warn('⚠️ Query performance is slow');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Query performance test failed:', error.message);
      return false;
    }
  }

  async checkConnectionPool() {
    console.log('🏊 Checking connection pool...');
    
    try {
      const result = await prisma.$queryRaw`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;
      
      this.metrics.connectionCount = parseInt(result[0].total_connections);
      const activeConnections = parseInt(result[0].active_connections);
      const idleConnections = parseInt(result[0].idle_connections);
      
      console.log(`📊 Connections - Total: ${this.metrics.connectionCount}, Active: ${activeConnections}, Idle: ${idleConnections}`);
      
      const poolMax = parseInt(process.env.DATABASE_POOL_MAX || '10');
      if (this.metrics.connectionCount > poolMax * 0.8) {
        console.warn('⚠️ Connection pool usage is high');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Connection pool check failed:', error.message);
      return false;
    }
  }

  async checkDatabaseSize() {
    console.log('💾 Checking database size...');
    
    try {
      const result = await prisma.$queryRaw`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as db_size,
          pg_database_size(current_database()) as db_size_bytes
      `;
      
      this.metrics.databaseSize = parseInt(result[0].db_size_bytes);
      const readableSize = result[0].db_size;
      
      console.log(`📊 Database size: ${readableSize}`);
      
      // Warn if database is larger than 1GB (adjust threshold as needed)
      if (this.metrics.databaseSize > 1024 * 1024 * 1024) {
        console.warn('⚠️ Database size is large, consider archiving old data');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Database size check failed:', error.message);
      return false;
    }
  }

  async checkIndexHealth() {
    console.log('📊 Checking index health...');
    
    try {
      const result = await prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_indexes,
          COUNT(*) FILTER (WHERE idx_scan = 0) as unused_indexes,
          AVG(idx_scan) as avg_index_scans
        FROM pg_stat_user_indexes
      `;
      
      const totalIndexes = parseInt(result[0].total_indexes);
      const unusedIndexes = parseInt(result[0].unused_indexes);
      const avgScans = parseFloat(result[0].avg_index_scans || 0);
      
      this.metrics.indexHealth = totalIndexes > 0 ? ((totalIndexes - unusedIndexes) / totalIndexes) * 100 : 100;
      
      console.log(`📊 Indexes - Total: ${totalIndexes}, Unused: ${unusedIndexes}, Health: ${this.metrics.indexHealth.toFixed(1)}%`);
      
      if (unusedIndexes > totalIndexes * 0.2) {
        console.warn('⚠️ High number of unused indexes detected');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Index health check failed:', error.message);
      return false;
    }
  }

  async checkSlowQueries() {
    console.log('🐌 Checking for slow queries...');
    
    try {
      const result = await prisma.$queryRaw`
        SELECT 
          query,
          mean_exec_time,
          calls,
          total_exec_time
        FROM pg_stat_statements 
        WHERE mean_exec_time > 1000 
        ORDER BY mean_exec_time DESC 
        LIMIT 5
      `;
      
      this.metrics.slowQueries = result.length;
      
      if (result.length > 0) {
        console.warn(`⚠️ Found ${result.length} slow queries (>1000ms average)`);
        result.forEach((query, index) => {
          console.warn(`  ${index + 1}. ${query.mean_exec_time.toFixed(2)}ms avg - ${query.calls} calls`);
        });
        return false;
      } else {
        console.log('✅ No slow queries detected');
        return true;
      }
    } catch (error) {
      // pg_stat_statements might not be enabled, which is okay for staging
      console.log('ℹ️ Slow query monitoring not available (pg_stat_statements not enabled)');
      return true;
    }
  }

  async checkBackupStatus() {
    console.log('💾 Checking backup status...');
    
    try {
      const lastBackup = await prisma.auditLog.findFirst({
        where: {
          action: 'database_backup',
          entityType: 'database',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      if (!lastBackup) {
        console.warn('⚠️ No backup records found');
        return false;
      }
      
      const backupAge = Date.now() - lastBackup.createdAt.getTime();
      const hoursOld = Math.floor(backupAge / (1000 * 60 * 60));
      
      console.log(`📊 Last backup: ${hoursOld} hours ago`);
      
      if (hoursOld > 24) {
        console.warn('⚠️ Last backup is older than 24 hours');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Backup status check failed:', error.message);
      return false;
    }
  }

  async checkDataIntegrity() {
    console.log('🔍 Checking data integrity...');
    
    try {
      // Check for orphaned records
      const orphanedProjects = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM "Project" p 
        LEFT JOIN "User" u ON p.user_id = u.id 
        WHERE u.id IS NULL
      `;
      
      const orphanCount = parseInt(orphanedProjects[0].count);
      
      if (orphanCount > 0) {
        console.warn(`⚠️ Found ${orphanCount} orphaned project records`);
        return false;
      }
      
      console.log('✅ Data integrity verified');
      return true;
    } catch (error) {
      console.error('❌ Data integrity check failed:', error.message);
      return false;
    }
  }

  async recordHealthMetrics() {
    console.log('📝 Recording health metrics...');
    
    try {
      await prisma.systemMetrics.createMany({
        data: [
          {
            type: 'db_connection_time',
            value: this.metrics.connectionTime,
          },
          {
            type: 'db_query_time',
            value: this.metrics.queryTime,
          },
          {
            type: 'db_connection_count',
            value: this.metrics.connectionCount,
          },
          {
            type: 'db_size_bytes',
            value: this.metrics.databaseSize,
          },
          {
            type: 'db_index_health',
            value: this.metrics.indexHealth,
          },
          {
            type: 'db_slow_queries',
            value: this.metrics.slowQueries,
          },
        ],
      });
      
      console.log('✅ Health metrics recorded');
    } catch (error) {
      console.error('❌ Failed to record health metrics:', error.message);
    }
  }

  async runHealthCheck() {
    console.log('🏥 Starting Railway staging database health check...');
    console.log('');
    
    const checks = [
      { name: 'Connection', test: () => this.checkConnection() },
      { name: 'Query Performance', test: () => this.checkQueryPerformance() },
      { name: 'Connection Pool', test: () => this.checkConnectionPool() },
      { name: 'Database Size', test: () => this.checkDatabaseSize() },
      { name: 'Index Health', test: () => this.checkIndexHealth() },
      { name: 'Slow Queries', test: () => this.checkSlowQueries() },
      { name: 'Backup Status', test: () => this.checkBackupStatus() },
      { name: 'Data Integrity', test: () => this.checkDataIntegrity() },
    ];
    
    let passedChecks = 0;
    const results = [];
    
    for (const check of checks) {
      try {
        const passed = await check.test();
        results.push({ name: check.name, passed });
        if (passed) passedChecks++;
      } catch (error) {
        console.error(`❌ ${check.name} check failed:`, error.message);
        results.push({ name: check.name, passed: false });
      }
      console.log('');
    }
    
    // Record metrics
    await this.recordHealthMetrics();
    
    // Summary
    console.log('📊 Health Check Summary:');
    console.log('');
    results.forEach(result => {
      console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
    });
    
    console.log('');
    console.log(`🎯 Overall Health: ${passedChecks}/${checks.length} checks passed`);
    
    const healthPercentage = (passedChecks / checks.length) * 100;
    console.log(`📊 Health Score: ${healthPercentage.toFixed(1)}%`);
    
    if (healthPercentage >= 90) {
      console.log('🎉 Database health is excellent!');
    } else if (healthPercentage >= 75) {
      console.log('👍 Database health is good');
    } else if (healthPercentage >= 50) {
      console.log('⚠️ Database health needs attention');
    } else {
      console.log('🚨 Database health is critical!');
    }
    
    return healthPercentage >= 75;
  }
}

async function main() {
  const healthChecker = new DatabaseHealthChecker();
  
  try {
    const isHealthy = await healthChecker.runHealthCheck();
    process.exit(isHealthy ? 0 : 1);
  } catch (error) {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run health check if called directly
if (require.main === module) {
  main();
}

module.exports = { DatabaseHealthChecker };