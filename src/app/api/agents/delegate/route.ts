// src/app/api/agents/delegate/route.ts
// Agent Orchestrator Delegation Endpoint - The "ignition system" for autonomous agent operations

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Delegation Request Schema
const DelegationRequestSchema = z.object({
  goal: z.string().min(10, 'Goal must be at least 10 characters'),
  tier: z.enum(['Freemium', 'Premium', 'Enterprise']).default('Premium'),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  deadline: z.string().datetime().optional(),
  context: z.object({
    brandGuidelines: z.record(z.any()).optional(),
    targetAudience: z.string().optional(),
    existingAssets: z.array(z.string()).optional(),
  }).optional()
});

interface AgentTask {
  agentType: string;
  taskType: string;
  inputs: any;
  dependsOn: string[];
}

interface DelegationResponse {
  missionId: string;
  status: 'accepted';
  estimatedCompletion: Date;
  agentsAssigned: string[];
  realTimeChannelId: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedRequest = DelegationRequestSchema.parse(body);

    // Create mission record immediately
    const mission = await prisma.mission.create({
      data: {
        goal: validatedRequest.goal,
        status: 'PENDING',
        priority: mapPriority(validatedRequest.priority),
        clientId: session.user.id,
        estimatedHours: calculateEstimatedHours(validatedRequest.goal),
      }
    });

    // Decompose goal into agent tasks (simplified for MVP)
    const agentTasks: AgentTask[] = await decomposeGoal(validatedRequest.goal, validatedRequest.context);
    
    // Create mission tasks
    const createdTasks = await Promise.all(
      agentTasks.map(task => 
        prisma.missionTask.create({
          data: {
            missionId: mission.id,
            agentType: task.agentType,
            taskType: task.taskType,
            status: 'QUEUED',
            inputs: task.inputs,
            dependsOn: task.dependsOn,
          }
        })
      )
    );

    // Update mission status to IN_PROGRESS
    await prisma.mission.update({
      where: { id: mission.id },
      data: { status: 'IN_PROGRESS' }
    });

    // Queue initial tasks (ones with no dependencies)
    const initialTasks = createdTasks.filter(task => 
      (task.dependsOn as string[]).length === 0
    );

    // TODO: Queue tasks with BullMQ (Phase 2)
    console.log(`Queuing ${initialTasks.length} initial tasks for mission ${mission.id}`);

    const agentTypes = agentTasks.map(t => t.agentType);
    const uniqueAgentTypes = Array.from(new Set(agentTypes));

    const response: DelegationResponse = {
      missionId: mission.id,
      status: 'accepted',
      estimatedCompletion: calculateEstimatedCompletion(createdTasks.length),
      agentsAssigned: uniqueAgentTypes,
      realTimeChannelId: `mission_${mission.id}`,
      message: `Mission accepted! ${agentTasks.length} tasks queued across ${uniqueAgentTypes.length} specialized agents.`
    };

    return NextResponse.json(response, { status: 202 });
    
  } catch (error) {
    console.error('Agent delegation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delegate to agents' },
      { status: 500 }
    );
  }
}

// Helper functions
function mapPriority(priority: string): 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' {
  switch (priority) {
    case 'low': return 'LOW';
    case 'high': return 'HIGH';
    default: return 'NORMAL';
  }
}

function calculateEstimatedHours(goal: string): number {
  // Simple estimation based on goal complexity
  const wordCount = goal.split(' ').length;
  const baseHours = 2; // Minimum time
  const complexityMultiplier = Math.min(wordCount / 10, 5); // Cap at 5x
  return baseHours + complexityMultiplier;
}

function calculateEstimatedCompletion(taskCount: number): Date {
  const now = new Date();
  const estimatedMinutes = taskCount * 15; // 15 minutes per task average
  now.setMinutes(now.getMinutes() + estimatedMinutes);
  return now;
}

// Goal Decomposition Engine (MVP - simplified)
async function decomposeGoal(goal: string, context?: any): Promise<AgentTask[]> {
  const goalLower = goal.toLowerCase();
  const tasks: AgentTask[] = [];

  // Pattern matching for common business goals
  if (goalLower.includes('landing page') || goalLower.includes('page')) {
    tasks.push({
      agentType: 'ContentAgent',
      taskType: 'write_landing_page_copy',
      inputs: { goal, context },
      dependsOn: []
    });
    
    tasks.push({
      agentType: 'MediaAgent', 
      taskType: 'generate_hero_image',
      inputs: { context },
      dependsOn: []
    });

    tasks.push({
      agentType: 'UIUXAgent',
      taskType: 'create_landing_section',
      inputs: { goal },
      dependsOn: []
    });
  }

  if (goalLower.includes('social media') || goalLower.includes('campaign')) {
    tasks.push({
      agentType: 'ContentAgent',
      taskType: 'write_social_captions',
      inputs: { goal, context },
      dependsOn: []
    });

    tasks.push({
      agentType: 'MediaAgent',
      taskType: 'create_social_graphics', 
      inputs: { context },
      dependsOn: []
    });

    tasks.push({
      agentType: 'SocialAgent',
      taskType: 'schedule_posts',
      inputs: { goal },
      dependsOn: []
    });
  }

  if (goalLower.includes('blog') || goalLower.includes('article')) {
    tasks.push({
      agentType: 'ContentAgent',
      taskType: 'create_blog_post',
      inputs: { goal, context },
      dependsOn: []
    });

    tasks.push({
      agentType: 'SEOAgent',
      taskType: 'optimize_content',
      inputs: { goal },
      dependsOn: []
    });
  }

  // Default fallback for any goal
  if (tasks.length === 0) {
    tasks.push({
      agentType: 'ContentAgent',
      taskType: 'analyze_goal',
      inputs: { goal, context },
      dependsOn: []
    });

    tasks.push({
      agentType: 'UIUXAgent',
      taskType: 'create_custom_component',
      inputs: { goal },
      dependsOn: []
    });
  }

  return tasks;
}
