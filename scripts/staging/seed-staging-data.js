#!/usr/bin/env node

/**
 * Railway Staging Database Seeding Script
 * This script populates the staging database with test data for development and testing
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('🌱 Starting Railway staging database seeding...');

  try {
    // Create test users
    console.log('👥 Creating test users...');
    
    const testUsers = [
      {
        name: 'Staging Admin',
        email: 'admin@staging.zenith.engineer',
        password: await bcrypt.hash('staging123!', 12),
        role: 'ADMIN',
      },
      {
        name: 'Test User 1',
        email: 'user1@staging.zenith.engineer',
        password: await bcrypt.hash('staging123!', 12),
        role: 'USER',
      },
      {
        name: 'Test User 2',
        email: 'user2@staging.zenith.engineer',
        password: await bcrypt.hash('staging123!', 12),
        role: 'USER',
      },
      {
        name: 'Test Team Lead',
        email: 'teamlead@staging.zenith.engineer',
        password: await bcrypt.hash('staging123!', 12),
        role: 'TEAM_LEAD',
      },
    ];

    const createdUsers = [];
    for (const userData of testUsers) {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: userData,
        create: userData,
      });
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.email}`);
    }

    // Create test teams
    console.log('🏢 Creating test teams...');
    
    const testTeam = await prisma.team.upsert({
      where: { id: 'staging-team-1' },
      update: {
        name: 'Staging Test Team',
        description: 'Primary staging team for testing',
        subscriptionPlan: 'premium',
        subscriptionStatus: 'active',
      },
      create: {
        id: 'staging-team-1',
        name: 'Staging Test Team',
        description: 'Primary staging team for testing',
        subscriptionPlan: 'premium',
        subscriptionStatus: 'active',
      },
    });

    // Add users to team
    console.log('👥 Adding users to team...');
    for (const user of createdUsers) {
      await prisma.teamMember.upsert({
        where: {
          userId_teamId: {
            userId: user.id,
            teamId: testTeam.id,
          },
        },
        update: {
          role: user.role === 'ADMIN' ? 'OWNER' : 'MEMBER',
        },
        create: {
          userId: user.id,
          teamId: testTeam.id,
          role: user.role === 'ADMIN' ? 'OWNER' : 'MEMBER',
        },
      });
    }

    // Create test projects
    console.log('📋 Creating test projects...');
    
    const testProjects = [
      {
        name: 'Staging Website Analysis',
        description: 'Test project for website health analysis',
        status: 'active',
        userId: createdUsers[0].id,
        teamId: testTeam.id,
      },
      {
        name: 'Competitive Research Demo',
        description: 'Demo project for competitive intelligence',
        status: 'draft',
        userId: createdUsers[1].id,
        teamId: testTeam.id,
      },
      {
        name: 'Content Strategy Planning',
        description: 'Test project for content generation',
        status: 'active',
        userId: createdUsers[2].id,
        teamId: testTeam.id,
      },
    ];

    const createdProjects = [];
    for (const projectData of testProjects) {
      const project = await prisma.project.create({
        data: projectData,
      });
      createdProjects.push(project);
      console.log(`✅ Created project: ${project.name}`);
    }

    // Create test analytics data
    console.log('📊 Creating test analytics data...');
    
    const analyticsData = [
      {
        type: 'page_view',
        action: 'dashboard_access',
        userId: createdUsers[0].id,
        projectId: createdProjects[0].id,
        metadata: { page: '/dashboard', duration: 45 },
      },
      {
        type: 'feature_usage',
        action: 'website_scan',
        userId: createdUsers[1].id,
        projectId: createdProjects[0].id,
        metadata: { scan_type: 'health_check', url: 'https://example.com' },
      },
      {
        type: 'api_call',
        action: 'competitive_analysis',
        userId: createdUsers[2].id,
        projectId: createdProjects[1].id,
        metadata: { endpoint: '/api/competitive/analysis', response_time: 1200 },
      },
    ];

    for (const analyticsItem of analyticsData) {
      await prisma.analytics.create({
        data: analyticsItem,
      });
    }

    // Create test user preferences
    console.log('⚙️ Creating user preferences...');
    
    for (const user of createdUsers) {
      await prisma.userPreferences.upsert({
        where: { userId: user.id },
        update: {
          theme: 'dark',
          language: 'en',
          emailNotifications: true,
          timezone: 'UTC',
        },
        create: {
          userId: user.id,
          theme: 'dark',
          language: 'en',
          emailNotifications: true,
          timezone: 'UTC',
        },
      });
    }

    // Create system metrics for monitoring
    console.log('📈 Creating system metrics...');
    
    const systemMetrics = [
      { type: 'database_connections', value: 5.0 },
      { type: 'api_response_time', value: 250.0 },
      { type: 'memory_usage', value: 65.5 },
      { type: 'cpu_usage', value: 23.8 },
    ];

    for (const metric of systemMetrics) {
      await prisma.systemMetrics.create({
        data: metric,
      });
    }

    // Create audit log entry for seeding
    console.log('📝 Creating audit log entry...');
    
    await prisma.auditLog.create({
      data: {
        action: 'database_seeding',
        entityType: 'database',
        metadata: {
          environment: 'staging',
          users_created: createdUsers.length,
          teams_created: 1,
          projects_created: createdProjects.length,
          timestamp: new Date().toISOString(),
        },
        userId: createdUsers[0].id,
      },
    });

    console.log('✅ Railway staging database seeding completed successfully!');
    console.log('');
    console.log('📊 Seeding Summary:');
    console.log(`- Users created: ${createdUsers.length}`);
    console.log(`- Teams created: 1`);
    console.log(`- Projects created: ${createdProjects.length}`);
    console.log(`- Analytics entries: ${analyticsData.length}`);
    console.log(`- System metrics: ${systemMetrics.length}`);
    console.log('');
    console.log('🔐 Test Credentials:');
    console.log('Admin: admin@staging.zenith.engineer / staging123!');
    console.log('User: user1@staging.zenith.engineer / staging123!');
    console.log('');
    console.log('🚀 Staging environment ready for testing!');

  } catch (error) {
    console.error('❌ Error during database seeding:', error);
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