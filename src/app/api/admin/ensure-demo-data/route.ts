import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

// This endpoint is disabled in production - no mock data allowed
export async function POST(request: NextRequest) {
  // Completely disabled in production environment
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ 
      error: 'Demo data endpoint disabled in production',
      message: 'This endpoint is only available in development environments'
    }, { status: 403 });
  }

  try {
    // Check for admin secret
    const body = await request.json();
    const { adminSecret } = body;
    
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if demo user exists
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demo@zenith.engineer' }
    });

    if (demoUser) {
      return NextResponse.json({ 
        message: 'Demo data already exists',
        userId: demoUser.id 
      });
    }

    // Create demo user
    const hashedPassword = await hash('demo123!secure', 12);
    const user = await prisma.user.create({
      data: {
        name: 'Demo User',
        email: 'demo@zenith.engineer',
        password: hashedPassword,
        role: 'USER',
      },
    });

    // Create user preferences
    await prisma.userPreferences.create({
      data: {
        userId: user.id,
        theme: 'dark',
        emailNotifications: true,
        pushNotifications: true,
      },
    });

    // Create sample projects
    const projects = await Promise.all([
      prisma.project.create({
        data: {
          name: 'Enterprise AI Implementation',
          description: 'Full-scale AI agent deployment for Fortune 500 client automation and optimization.',
          status: 'in_progress',
          userId: user.id
        }
      }),
      
      prisma.project.create({
        data: {
          name: 'Multi-Platform Integration Hub',
          description: 'Seamless API integrations across CRM, marketing, and analytics platforms.',
          status: 'active',
          userId: user.id
        }
      }),
      
      prisma.project.create({
        data: {
          name: 'Autonomous Content Engine',
          description: 'AI-powered content creation and distribution system with performance tracking.',
          status: 'completed',
          userId: user.id
        }
      })
    ]);

    // Create tasks
    const tasks = [];
    for (const project of projects) {
      const projectTasks = await Promise.all([
        prisma.task.create({
          data: {
            title: `${project.name} - Setup & Configuration`,
            description: 'Initial project setup and agent configuration',
            status: project.status === 'completed' ? 'COMPLETED' : 'IN_PROGRESS',
            priority: 'HIGH',
            projectId: project.id,
            userId: user.id,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        }),
        
        prisma.task.create({
          data: {
            title: `${project.name} - Quality Assurance`,
            description: 'Comprehensive testing and optimization',
            status: project.status === 'completed' ? 'COMPLETED' : 'TODO',
            priority: 'MEDIUM',
            projectId: project.id,
            userId: user.id,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          }
        })
      ]);
      
      tasks.push(...projectTasks);
    }

    // Create files
    const files = await Promise.all([
      prisma.file.create({
        data: {
          name: 'AI Strategy Document.pdf',
          type: 'application/pdf',
          size: 1024000,
          url: '/demo/ai-strategy.pdf',
          userId: user.id,
          projectId: projects[0].id
        }
      }),
      
      prisma.file.create({
        data: {
          name: 'Integration Config.json',
          type: 'application/json',
          size: 256000,
          url: '/demo/integration-config.json',
          userId: user.id,
          projectId: projects[1].id
        }
      })
    ]);

    // Create notifications
    const notifications = await Promise.all([
      prisma.notification.create({
        data: {
          type: 'project_update',
          message: 'Enterprise AI Implementation reached major milestone! 🚀',
          userId: user.id,
          read: false,
          projectId: projects[0].id
        }
      }),
      
      prisma.notification.create({
        data: {
          type: 'task_completed',
          message: 'Autonomous Content Engine project completed successfully!',
          userId: user.id,
          read: true,
          projectId: projects[2].id
        }
      })
    ]);

    // Create activity logs
    await Promise.all([
      prisma.activityLog.create({
        data: {
          action: 'project_created',
          details: JSON.stringify({
            projectName: projects[0].name,
            status: projects[0].status
          }),
          userId: user.id,
          projectId: projects[0].id
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

    return NextResponse.json({
      message: 'Demo data created successfully',
      summary: {
        user: user.email,
        projects: projects.length,
        tasks: tasks.length,
        files: files.length,
        notifications: notifications.length
      }
    });

  } catch (error) {
    console.error('Demo data creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create demo data' },
      { status: 500 }
    );
  }
}