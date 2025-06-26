#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function applyIndexes() {
  console.log('Applying performance optimization indexes...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'prisma', 'migrations', 'add_performance_indexes.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await prisma.$executeRawUnsafe(statement);
        successCount++;
        console.log('✅ Success\n');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⏭️  Index already exists, skipping\n');
          skipCount++;
        } else {
          console.error('❌ Error:', error.message, '\n');
          errorCount++;
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('Index Application Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Successfully created: ${successCount} indexes`);
    console.log(`⏭️  Already existed: ${skipCount} indexes`);
    console.log(`❌ Failed: ${errorCount} indexes`);
    console.log('='.repeat(50));

    // Verify indexes
    console.log('\nVerifying indexes...');
    
    const tables = [
      'users', 'sessions', 'projects', 'website_scans', 
      'alerts', 'audit_logs', 'team_members', 'api_keys'
    ];

    for (const table of tables) {
      try {
        const indexes = await prisma.$queryRaw`
          SELECT indexname, indexdef 
          FROM pg_indexes 
          WHERE tablename = ${table} 
          AND schemaname = 'public'
          ORDER BY indexname;
        `;
        
        if (indexes.length > 0) {
          console.log(`\n${table} table indexes (${indexes.length}):`);
          indexes.forEach(idx => {
            console.log(`  - ${idx.indexname}`);
          });
        }
      } catch (error) {
        console.error(`Failed to query indexes for ${table}:`, error.message);
      }
    }

    // Test query performance
    console.log('\n\nTesting query performance...');
    console.log('='.repeat(50));

    // Test 1: User lookup by email
    const start1 = Date.now();
    await prisma.user.findFirst({ where: { email: 'test@example.com' } });
    const time1 = Date.now() - start1;
    console.log(`User lookup by email: ${time1}ms`);

    // Test 2: Recent scans with project
    const start2 = Date.now();
    await prisma.websiteScan.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { project: true }
    });
    const time2 = Date.now() - start2;
    console.log(`Recent scans query: ${time2}ms`);

    // Test 3: Unresolved alerts count
    const start3 = Date.now();
    await prisma.alert.count({
      where: { isResolved: false }
    });
    const time3 = Date.now() - start3;
    console.log(`Unresolved alerts count: ${time3}ms`);

    console.log('='.repeat(50));
    console.log('\n✅ Performance indexes applied successfully!');

  } catch (error) {
    console.error('Failed to apply indexes:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
applyIndexes().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});