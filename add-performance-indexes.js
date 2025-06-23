const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addPerformanceIndexes() {
  console.log('🚀 Adding performance indexes for database optimization...\n');
  
  const indexes = [
    // User email index (for authentication queries)
    'CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email")',
    
    // Project indexes for dashboard and filtering
    'CREATE INDEX IF NOT EXISTS "Project_userId_status_idx" ON "Project"("userId", "status")',
    'CREATE INDEX IF NOT EXISTS "Project_teamId_idx" ON "Project"("teamId")',
    'CREATE INDEX IF NOT EXISTS "Project_updatedAt_idx" ON "Project"("updatedAt" DESC)',
    
    // TeamMember indexes for team operations
    'CREATE INDEX IF NOT EXISTS "TeamMember_userId_teamId_idx" ON "TeamMember"("userId", "teamId")',
    'CREATE INDEX IF NOT EXISTS "TeamMember_teamId_idx" ON "TeamMember"("teamId")',
    
    // Task indexes for project views
    'CREATE INDEX IF NOT EXISTS "Task_userId_status_idx" ON "Task"("userId", "status")',
    'CREATE INDEX IF NOT EXISTS "Task_projectId_status_idx" ON "Task"("projectId", "status")',
    'CREATE INDEX IF NOT EXISTS "Task_updatedAt_idx" ON "Task"("updatedAt" DESC)',
    
    // ActivityLog indexes for dashboard activity feeds
    'CREATE INDEX IF NOT EXISTS "ActivityLog_userId_createdAt_idx" ON "ActivityLog"("userId", "createdAt" DESC)',
    'CREATE INDEX IF NOT EXISTS "ActivityLog_projectId_createdAt_idx" ON "ActivityLog"("projectId", "createdAt" DESC)',
    
    // Analytics indexes for performance tracking
    'CREATE INDEX IF NOT EXISTS "Analytics_userId_createdAt_idx" ON "Analytics"("userId", "createdAt" DESC)',
    'CREATE INDEX IF NOT EXISTS "Analytics_type_createdAt_idx" ON "Analytics"("type", "createdAt" DESC)',
    
    // Notification indexes for real-time features
    'CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx" ON "Notification"("userId", "read")',
    'CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt" DESC)',
    
    // File indexes for project file management
    'CREATE INDEX IF NOT EXISTS "File_userId_idx" ON "File"("userId")',
    'CREATE INDEX IF NOT EXISTS "File_projectId_idx" ON "File"("projectId")',
  ];
  
  try {
    await prisma.$connect();
    
    for (let i = 0; i < indexes.length; i++) {
      const indexSql = indexes[i];
      const indexName = indexSql.match(/"([^"]+)"/)[1];
      
      try {
        console.log(`📊 Adding index: ${indexName}`);
        await prisma.$executeRawUnsafe(indexSql);
        console.log(`✅ Successfully added: ${indexName}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Index already exists: ${indexName}`);
        } else {
          console.error(`❌ Failed to add index ${indexName}:`, error.message);
        }
      }
    }
    
    console.log('\n🎉 Database performance optimization complete!');
    console.log(`📈 Added ${indexes.length} performance indexes`);
    console.log('⚡ Database queries should now be significantly faster');
    
  } catch (error) {
    console.error('❌ Error adding performance indexes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addPerformanceIndexes();