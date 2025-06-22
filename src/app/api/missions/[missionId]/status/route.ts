// src/app/api/missions/[missionId]/status/route.ts
// Mission Status Tracking - Real-time mission progress monitoring

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { missionId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mission = await prisma.mission.findFirst({
      where: {
        id: params.missionId,
        clientId: session.user.id
      },
      include: {
        tasks: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    const progress = calculateProgress(mission.tasks);
    const agentStatuses = getAgentStatuses(mission.tasks);

    return NextResponse.json({
      mission: {
        id: mission.id,
        goal: mission.goal,
        status: mission.status,
        priority: mission.priority,
        progress: {
          percentage: progress.percentage,
          completed: progress.completed,
          total: progress.total,
          current: progress.current
        },
        estimatedCompletion: mission.createdAt, // TODO: Calculate based on remaining tasks
        agentStatuses,
        tasks: mission.tasks.map(task => ({
          id: task.id,
          agentType: task.agentType,
          taskType: task.taskType,
          status: task.status,
          startedAt: task.startedAt,
          completedAt: task.completedAt,
          outputs: task.outputs
        })),
        results: mission.results,
        createdAt: mission.createdAt,
        updatedAt: mission.updatedAt,
        completedAt: mission.completedAt
      }
    });

  } catch (error) {
    console.error('Mission status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mission status' },
      { status: 500 }
    );
  }
}

function calculateProgress(tasks: any[]) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'COMPLETE').length;
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const failed = tasks.filter(t => t.status === 'FAILED').length;
  
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  let current = 'Pending';
  if (inProgress > 0) {
    const currentTask = tasks.find(t => t.status === 'IN_PROGRESS');
    if (currentTask) {
      current = `${currentTask.agentType}: ${currentTask.taskType}`;
    }
  } else if (completed === total) {
    current = 'Complete';
  } else if (failed > 0) {
    current = 'Some tasks failed';
  }

  return {
    percentage,
    completed,
    total,
    current,
    failed
  };
}

function getAgentStatuses(tasks: any[]) {
  const agents = new Map();
  
  tasks.forEach(task => {
    const agentType = task.agentType;
    if (!agents.has(agentType)) {
      agents.set(agentType, {
        name: agentType,
        status: 'idle',
        currentTask: null,
        completedTasks: 0,
        totalTasks: 0
      });
    }
    
    const agent = agents.get(agentType);
    agent.totalTasks++;
    
    if (task.status === 'COMPLETE') {
      agent.completedTasks++;
    } else if (task.status === 'IN_PROGRESS') {
      agent.status = 'working';
      agent.currentTask = task.taskType;
    } else if (task.status === 'FAILED') {
      agent.status = 'error';
    }
  });

  return Array.from(agents.values());
}
