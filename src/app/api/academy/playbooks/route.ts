// src/app/api/academy/playbooks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import TrainingAgent from '@/lib/agents/training-agent';

export async function GET(request: NextRequest) {
  try {
    // In production, this would fetch from database
    // For now, return sample master playbooks
    const masterPlaybooks = [
      {
        id: 'playbook_zenith_101',
        title: 'Zenith 101: Mastering Your Dashboard',
        description: 'Learn the fundamentals of navigating and optimizing your Zenith platform experience',
        level: 'beginner',
        category: 'Platform Basics',
        estimatedDuration: '45 minutes',
        isPublished: true,
        modules: [
          {
            id: 'zenith-basics',
            title: 'Platform Fundamentals',
            description: 'Understanding the core concepts and navigation',
            lessons: [],
            prerequisites: [],
            learningObjectives: ['Navigate the dashboard', 'Understand key metrics', 'Set up basic configurations']
          },
          {
            id: 'dashboard-navigation',
            title: 'Dashboard Mastery',
            description: 'Deep dive into dashboard features and customization',
            lessons: [],
            prerequisites: [],
            learningObjectives: ['Customize your workspace', 'Use quick actions', 'Interpret analytics']
          }
        ],
        createdAt: new Date('2024-01-01')
      },
      {
        id: 'playbook_eeat_framework',
        title: 'The E-E-A-T Playbook: Building Unshakeable Trust',
        description: 'Master Google\'s Experience, Expertise, Authoritativeness, and Trust framework',
        level: 'intermediate',
        category: 'SEO Strategy',
        estimatedDuration: '1.5 hours',
        isPublished: true,
        modules: [
          {
            id: 'eeat-framework',
            title: 'Understanding E-E-A-T',
            description: 'Core concepts of Experience, Expertise, Authoritativeness, and Trust',
            lessons: [],
            prerequisites: ['zenith-basics'],
            learningObjectives: ['Define E-E-A-T principles', 'Assess current content quality', 'Identify improvement areas']
          },
          {
            id: 'content-optimization',
            title: 'Content Optimization Strategies',
            description: 'Practical techniques for improving content authority',
            lessons: [],
            prerequisites: ['eeat-framework'],
            learningObjectives: ['Optimize existing content', 'Create authoritative content', 'Build topical authority']
          }
        ],
        createdAt: new Date('2024-02-01')
      }
    ];

    return NextResponse.json({
      success: true,
      playbooks: masterPlaybooks
    });

  } catch (error) {
    console.error('Playbooks fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch master playbooks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { command, adminUserId } = await request.json();
    
    if (!command || !adminUserId) {
      return NextResponse.json(
        { error: 'Command and admin user ID are required' },
        { status: 400 }
      );
    }

    // Verify admin permissions (in production)
    // For now, proceed with playbook creation
    
    const trainingAgent = new TrainingAgent(adminUserId);
    const playbook = await trainingAgent.createMasterPlaybook(command);

    return NextResponse.json({
      success: true,
      playbook,
      message: 'Master playbook created and sent to approval queue'
    });

  } catch (error) {
    console.error('Playbook creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create master playbook' },
      { status: 500 }
    );
  }
}
