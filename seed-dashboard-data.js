const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedDashboardData() {
  console.log('Creating sample dashboard data...\n');
  
  try {
    await prisma.$connect();
    
    // Find the test user
    const user = await prisma.user.findUnique({
      where: { email: 'test@zenith.engineer' }
    });
    
    if (!user) {
      console.log('❌ Test user not found. Run create-test-user.js first.');
      return;
    }
    
    console.log(`✅ Found user: ${user.name} (${user.email})`);
    
    // Create sample projects
    const projects = await Promise.all([
      prisma.project.create({
        data: {
          name: 'AI Content Generation Campaign',
          description: 'Autonomous content creation using our AI agent workforce for enterprise client engagement.',
          status: 'in_progress',
          userId: user.id
        }
      }),
      
      prisma.project.create({
        data: {
          name: 'Enterprise Integration Hub',
          description: 'Building seamless integrations with Fortune 500 client systems using our integration architect agent.',
          status: 'in_progress',
          userId: user.id
        }
      }),
      
      prisma.project.create({
        data: {
          name: 'Autonomous SEO Optimization',
          description: 'AI-driven SEO strategy and implementation for client portfolio growth and search dominance.',
          status: 'active',
          userId: user.id
        }
      }),
      
      prisma.project.create({
        data: {
          name: 'Voice Interface Development',
          description: 'Next-generation voice commands and AI conversation interfaces for hands-free platform control.',
          status: 'completed',
          userId: user.id
        }
      })
    ]);
    
    console.log(`✅ Created ${projects.length} sample projects`);
    
    // Create tasks for projects
    const tasks = [];
    for (const project of projects) {
      const projectTasks = await Promise.all([
        prisma.task.create({
          data: {
            title: `${project.name} - Phase 1 Setup`,
            description: 'Initial project configuration and agent deployment',
            status: project.status === 'completed' ? 'completed' : 'in_progress',
            priority: 'high',
            projectId: project.id,
            userId: user.id,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
          }
        }),
        
        prisma.task.create({
          data: {
            title: `${project.name} - Quality Review`,
            description: 'Comprehensive quality assessment and optimization',
            status: project.status === 'completed' ? 'completed' : 'pending',
            priority: 'medium',
            projectId: project.id,
            userId: user.id,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
          }
        })
      ]);
      
      tasks.push(...projectTasks);
    }
    
    console.log(`✅ Created ${tasks.length} sample tasks`);
    
    // Create some files
    const files = await Promise.all([
      prisma.file.create({
        data: {
          name: 'AI Content Strategy Document.pdf',
          type: 'application/pdf',
          size: 2048576,
          url: 'https://example.com/files/ai-content-strategy.pdf',
          userId: user.id,
          projectId: projects[0].id
        }
      }),
      
      prisma.file.create({
        data: {
          name: 'Integration Architecture Config.json',
          type: 'application/json',
          size: 512000,
          url: 'https://example.com/files/integration-architecture.json',
          userId: user.id,
          projectId: projects[1].id
        }
      }),
      
      prisma.file.create({
        data: {
          name: 'SEO Analysis Report.xlsx',
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          size: 1024000,
          url: 'https://example.com/files/seo-analysis-report.xlsx',
          userId: user.id,
          projectId: projects[2].id
        }
      })
    ]);
    
    console.log(`✅ Created ${files.length} sample files`);
    
    // Create activity logs
    const activities = await Promise.all([
      prisma.activityLog.create({
        data: {
          action: 'project_created',
          details: JSON.stringify({
            projectName: projects[0].name,
            category: projects[0].category
          }),
          userId: user.id,
          projectId: projects[0].id
        }
      }),
      
      prisma.activityLog.create({
        data: {
          action: 'task_completed',
          details: JSON.stringify({
            taskTitle: tasks[0].title,
            completedAt: new Date().toISOString()
          }),
          userId: user.id,
          projectId: projects[0].id,
          taskId: tasks[0].id
        }
      }),
      
      prisma.activityLog.create({
        data: {
          action: 'file_uploaded',
          details: JSON.stringify({
            filename: files[0].name,
            size: files[0].size
          }),
          userId: user.id,
          projectId: projects[0].id,
          fileId: files[0].id
        }
      })
    ]);
    
    console.log(`✅ Created ${activities.length} activity logs`);
    
    // Create analytics data
    const analytics = await Promise.all([
      prisma.analytics.create({
        data: {
          type: 'project_completion',
          action: 'completed_project',
          userId: user.id,
          metadata: JSON.stringify({
            projectId: projects[3].id,
            completionTime: '45 days',
            efficiency: '95%'
          })
        }
      }),
      
      prisma.analytics.create({
        data: {
          type: 'task_efficiency',
          action: 'task_automation',
          userId: user.id,
          metadata: JSON.stringify({
            automationRate: '78%',
            timeSaved: '32 hours',
            tasksAutomated: 15
          })
        }
      })
    ]);
    
    console.log(`✅ Created ${analytics.length} analytics entries`);
    
    // Create notifications
    const notifications = await Promise.all([
      prisma.notification.create({
        data: {
          type: 'project_milestone',
          message: 'AI Content Generation Campaign reached 75% completion milestone! 🎉',
          userId: user.id,
          read: false,
          projectId: projects[0].id
        }
      }),
      
      prisma.notification.create({
        data: {
          type: 'task_assigned',
          message: 'New autonomous task assigned by Integration Architect Agent',
          userId: user.id,
          read: false,
          taskId: tasks[1].id
        }
      }),
      
      prisma.notification.create({
        data: {
          type: 'system_update',
          message: 'Voice Interface Development project completed successfully! Ready for deployment.',
          userId: user.id,
          read: true,
          projectId: projects[3].id
        }
      })
    ]);
    
    console.log(`✅ Created ${notifications.length} notifications`);
    
    console.log('\n🎉 Dashboard data seeding complete!');
    console.log('\n📊 Summary:');
    console.log(`   • ${projects.length} Projects (1 completed, 3 active)`);
    console.log(`   • ${tasks.length} Tasks (various statuses)`);
    console.log(`   • ${files.length} Files uploaded`);
    console.log(`   • ${activities.length} Activity log entries`);
    console.log(`   • ${analytics.length} Analytics data points`);
    console.log(`   • ${notifications.length} Notifications`);
    
    console.log('\n🔗 Test the dashboard at: https://zenith.engineer/auth/signin');
    console.log('📧 Email: test@zenith.engineer');
    console.log('🔑 Password: testpass123');
    
  } catch (error) {
    console.error('❌ Error seeding dashboard data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDashboardData();