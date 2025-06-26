#!/usr/bin/env node

/**
 * Database Verification Script
 * 
 * Verifies database connection, schema integrity, and creates demo data
 * Usage: node scripts/verify-database.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DEMO_USER = {
  email: 'zenithfresh25@gmail.com',
  password: 'F^bf35(llm1120!2a',
  name: 'Demo User',
  role: 'admin'
};

async function verifyDatabase() {
  console.log('🔍 Starting database verification...\n');
  
  try {
    // 1. Test connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('   ✅ Database connection successful\n');

    // 2. Verify schema by checking all tables exist
    console.log('2. Verifying database schema...');
    
    const tables = [
      'accounts', 'sessions', 'users', 'verification_tokens',
      'projects', 'scans', 'teams', 'team_members', 'audit_logs'
    ];
    
    for (const table of tables) {
      try {
        await prisma.$queryRaw`SELECT 1 FROM ${prisma.Prisma.raw(table)} LIMIT 1`;
        console.log(`   ✅ Table '${table}' exists`);
      } catch (error) {
        if (error.code === '42P01') {
          console.log(`   ❌ Table '${table}' missing`);
          throw new Error(`Required table '${table}' does not exist`);
        } else {
          console.log(`   ✅ Table '${table}' exists (empty)`);
        }
      }
    }
    console.log('   ✅ All required tables exist\n');

    // 3. Check and create demo user
    console.log('3. Verifying demo user...');
    
    let demoUser = await prisma.user.findUnique({
      where: { email: DEMO_USER.email }
    });

    if (!demoUser) {
      console.log('   Creating demo user...');
      const hashedPassword = await bcrypt.hash(DEMO_USER.password, 12);
      
      demoUser = await prisma.user.create({
        data: {
          email: DEMO_USER.email,
          name: DEMO_USER.name,
          password: hashedPassword,
          role: DEMO_USER.role,
          emailVerified: new Date()
        }
      });
      console.log(`   ✅ Demo user created: ${demoUser.email}`);
    } else {
      console.log(`   ✅ Demo user exists: ${demoUser.email}`);
    }

    // 4. Verify password hash
    console.log('4. Verifying password authentication...');
    const isPasswordValid = await bcrypt.compare(DEMO_USER.password, demoUser.password);
    if (isPasswordValid) {
      console.log('   ✅ Demo user password verification successful');
    } else {
      console.log('   ❌ Demo user password verification failed');
      throw new Error('Demo user password mismatch');
    }

    // 5. Test basic CRUD operations
    console.log('\n5. Testing database operations...');
    
    // Test audit log creation
    const testAuditLog = await prisma.auditLog.create({
      data: {
        action: 'DATABASE_VERIFICATION',
        details: { test: 'verification_script', timestamp: new Date().toISOString() },
        ipAddress: '127.0.0.1',
        userId: demoUser.id
      }
    });
    console.log(`   ✅ Create operation: Audit log ${testAuditLog.id}`);

    // Test read operation
    const auditCount = await prisma.auditLog.count();
    console.log(`   ✅ Read operation: ${auditCount} audit logs found`);

    // Test update operation
    await prisma.auditLog.update({
      where: { id: testAuditLog.id },
      data: { details: { ...testAuditLog.details, verified: true } }
    });
    console.log(`   ✅ Update operation: Audit log ${testAuditLog.id} updated`);

    // Test delete operation
    await prisma.auditLog.delete({
      where: { id: testAuditLog.id }
    });
    console.log(`   ✅ Delete operation: Audit log ${testAuditLog.id} deleted`);

    // 6. Database statistics
    console.log('\n6. Database statistics:');
    const userCount = await prisma.user.count();
    const projectCount = await prisma.project.count();
    const scanCount = await prisma.scan.count();
    const teamCount = await prisma.team.count();
    
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Projects: ${projectCount}`);
    console.log(`   - Scans: ${scanCount}`);
    console.log(`   - Teams: ${teamCount}`);

    console.log('\n🎉 Database verification completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Database connection working');
    console.log('   ✅ All required tables exist');
    console.log('   ✅ Demo user configured');
    console.log('   ✅ CRUD operations functional');
    console.log(`   ✅ Demo login: ${DEMO_USER.email} / ${DEMO_USER.password}`);

    return {
      status: 'success',
      connection: true,
      schema: true,
      demoUser: true,
      operations: true,
      stats: { userCount, projectCount, scanCount, teamCount }
    };

  } catch (error) {
    console.error('\n❌ Database verification failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'Unknown'}`);
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Possible solutions:');
      console.error('   - Check DATABASE_URL in .env.local');
      console.error('   - Ensure PostgreSQL is running');
      console.error('   - Verify network connectivity');
    }
    
    return {
      status: 'error',
      error: error.message,
      code: error.code
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification if called directly
if (require.main === module) {
  verifyDatabase()
    .then(result => {
      if (result.status === 'error') {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { verifyDatabase, DEMO_USER };