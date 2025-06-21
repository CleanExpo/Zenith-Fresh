# The Zenith Agent Orchestrator Blueprint
## Core Backend Architecture for Autonomous Agent Operations

**Version**: 1.0  
**Date**: June 21, 2025  
**Objective**: Implement the backend infrastructure that enables autonomous operation of the Zenith Agentic Workforce

---

## Executive Summary

The Agent Orchestrator is the central nervous system that enables clients to delegate high-level goals and have them executed autonomously by specialized AI agents. This dedicated backend architecture handles long-running, complex, multi-step tasks that go far beyond traditional web requests.

---

## Section 1: Core Technology Stack

### Dedicated Agentic Backend
**Framework**: Node.js with Express.js (maintains consistency with existing Next.js codebase)
**Why Separate Service**:
- **Asynchronous Tasks**: Handle jobs that take minutes/hours, not milliseconds
- **Scalability**: Independent scaling from main web application
- **Reliability**: Dedicated resources for mission-critical agent operations

### Technology Components
- **API Framework**: Express.js with TypeScript
- **Queue System**: BullMQ with Redis
- **Real-time Updates**: Socket.IO
- **Database**: Prisma with PostgreSQL (extends existing schema)
- **AI Integration**: OpenAI/Gemini APIs for agent intelligence

---

## Section 2: The Agent Orchestrator API

### Primary Endpoint: POST /api/agents/delegate

**Request Schema**:
```typescript
interface DelegationRequest {
  clientId: string;
  goal: string;
  tier: 'Freemium' | 'Premium' | 'Enterprise';
  priority?: 'low' | 'normal' | 'high';
  deadline?: Date;
  context?: {
    brandGuidelines?: object;
    targetAudience?: string;
    existingAssets?: string[];
  };
}
```

**Response Schema**:
```typescript
interface DelegationResponse {
  missionId: string;
  status: 'accepted';
  estimatedCompletion: Date;
  agentsAssigned: string[];
  realTimeChannelId: string;
}
```

**Flow**:
1. Receive delegation request
2. Create Mission record in database
3. Decompose goal into agent tasks
4. Queue initial tasks
5. Return 202 Accepted with mission tracking info

---

## Section 3: Mission Management System

### Database Schema Extension

```prisma
model Mission {
  id              String            @id @default(cuid())
  goal            String
  status          MissionStatus     @default(PENDING)
  priority        Priority          @default(NORMAL)
  results         Json?
  estimatedHours  Float?
  actualHours     Float?
  clientId        String
  client          User              @relation(fields: [clientId], references: [id])
  tasks           MissionTask[]
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  completedAt     DateTime?
  
  @@map("missions")
}

model MissionTask {
  id          String      @id @default(cuid())
  missionId   String
  mission     Mission     @relation(fields: [missionId], references: [id])
  agentType   String      // 'ContentAgent', 'MediaAgent', etc.
  taskType    String      // 'write_copy', 'generate_image', etc.
  status      TaskStatus  @default(QUEUED)
  inputs      Json
  outputs     Json?
  startedAt   DateTime?
  completedAt DateTime?
  createdAt   DateTime    @default(now())
  dependsOn   String[]    // Task IDs this task depends on
  
  @@map("mission_tasks")
}

enum MissionStatus {
  PENDING
  IN_PROGRESS
  COMPLETE
  FAILED
  CANCELLED
}

enum TaskStatus {
  QUEUED
  IN_PROGRESS
  COMPLETE
  FAILED
  RETRYING
}

enum Priority {
  LOW
  NORMAL
  HIGH
  URGENT
}
```

---

## Section 4: Task Queue Architecture

### BullMQ Queue Implementation

```typescript
// src/lib/orchestrator/queue.ts
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Specialized queues for different agent types
export const queues = {
  content: new Queue('content-agent', { connection: redis }),
  media: new Queue('media-agent', { connection: redis }),
  uiux: new Queue('uiux-agent', { connection: redis }),
  social: new Queue('social-agent', { connection: redis }),
  orchestrator: new Queue('orchestrator', { connection: redis })
};

export interface AgentJob {
  missionId: string;
  taskId: string;
  agentType: string;
  taskType: string;
  inputs: Record<string, any>;
  context: {
    clientId: string;
    tier: string;
    priority: string;
  };
}
```

### Queue Workers

```typescript
// src/lib/orchestrator/workers.ts
import { Worker } from 'bullmq';
import { ContentAgentService } from '../agents/content-agent-service';
import { MediaAgentService } from '../agents/media-agent-service';
import { UIUXAgentService } from '../agents/uiux-agent-service';

// Content Agent Worker
export const contentWorker = new Worker('content-agent', async (job: Job<AgentJob>) => {
  const { missionId, taskId, taskType, inputs, context } = job.data;
  
  const contentAgent = new ContentAgentService();
  const result = await contentAgent.processTask(taskType, inputs, context);
  
  // Update task status in database
  await updateTaskStatus(taskId, 'COMPLETE', result);
  
  // Notify orchestrator of completion
  await queues.orchestrator.add('task-completed', {
    missionId,
    taskId,
    result
  });
  
  return result;
}, { connection: redis });

// Media Agent Worker
export const mediaWorker = new Worker('media-agent', async (job: Job<AgentJob>) => {
  const { missionId, taskId, taskType, inputs, context } = job.data;
  
  const mediaAgent = new MediaAgentService();
  const result = await mediaAgent.processTask(taskType, inputs, context);
  
  await updateTaskStatus(taskId, 'COMPLETE', result);
  
  await queues.orchestrator.add('task-completed', {
    missionId,
    taskId,
    result
  });
  
  return result;
}, { connection: redis });
```

---

## Section 5: Agent Service Architecture

### Base Agent Service

```typescript
// src/lib/agents/base-agent-service.ts
export abstract class BaseAgentService {
  abstract processTask(
    taskType: string, 
    inputs: Record<string, any>, 
    context: AgentContext
  ): Promise<AgentResult>;

  protected async callLLM(prompt: string, model: string = 'gpt-4'): Promise<string> {
    // Centralized LLM calling logic
  }

  protected async saveResult(result: any, taskId: string): Promise<void> {
    // Centralized result saving
  }
}

export interface AgentContext {
  clientId: string;
  tier: string;
  priority: string;
  brandGuidelines?: object;
  targetAudience?: string;
}

export interface AgentResult {
  status: 'success' | 'failed' | 'partial';
  outputs: Record<string, any>;
  nextTasks?: Array<{
    agentType: string;
    taskType: string;
    inputs: Record<string, any>;
  }>;
  estimatedTime?: number;
  qualityScore?: number;
}
```

### Content Agent Service

```typescript
// src/lib/agents/content-agent-service.ts
export class ContentAgentService extends BaseAgentService {
  async processTask(
    taskType: string, 
    inputs: Record<string, any>, 
    context: AgentContext
  ): Promise<AgentResult> {
    
    switch (taskType) {
      case 'write_landing_page_copy':
        return await this.writeLandingPageCopy(inputs, context);
      case 'create_blog_post':
        return await this.createBlogPost(inputs, context);
      case 'write_social_captions':
        return await this.writeSocialCaptions(inputs, context);
      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
  }

  private async writeLandingPageCopy(
    inputs: Record<string, any>, 
    context: AgentContext
  ): Promise<AgentResult> {
    
    const prompt = `
    Create compelling landing page copy for: ${inputs.goal}
    Target Audience: ${context.targetAudience || 'General'}
    Brand Guidelines: ${JSON.stringify(context.brandGuidelines) || 'Modern, professional'}
    
    Include:
    - Compelling headline
    - Subheadline
    - Value propositions (3-5 points)
    - Call-to-action text
    - Social proof section
    `;

    const generatedCopy = await this.callLLM(prompt);
    
    // Parse and structure the response
    const structuredCopy = this.parseLandingPageCopy(generatedCopy);
    
    return {
      status: 'success',
      outputs: {
        landingPageCopy: structuredCopy,
        wordCount: generatedCopy.length,
        readabilityScore: this.calculateReadability(generatedCopy)
      },
      nextTasks: [
        {
          agentType: 'MediaAgent',
          taskType: 'generate_hero_image',
          inputs: {
            copyHeadline: structuredCopy.headline,
            brandGuidelines: context.brandGuidelines
          }
        }
      ],
      qualityScore: 85
    };
  }

  private parseLandingPageCopy(rawCopy: string): any {
    // AI-powered parsing logic to extract structured components
    return {
      headline: "...",
      subheadline: "...",
      valueProps: ["...", "...", "..."],
      ctaText: "...",
      socialProof: "..."
    };
  }

  private calculateReadability(text: string): number {
    // Implement readability scoring algorithm
    return 85;
  }
}
```

### Media Agent Service

```typescript
// src/lib/agents/media-agent-service.ts
export class MediaAgentService extends BaseAgentService {
  async processTask(
    taskType: string, 
    inputs: Record<string, any>, 
    context: AgentContext
  ): Promise<AgentResult> {
    
    switch (taskType) {
      case 'generate_hero_image':
        return await this.generateHeroImage(inputs, context);
      case 'create_social_graphics':
        return await this.createSocialGraphics(inputs, context);
      case 'optimize_images':
        return await this.optimizeImages(inputs, context);
      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
  }

  private async generateHeroImage(
    inputs: Record<string, any>, 
    context: AgentContext
  ): Promise<AgentResult> {
    
    const imagePrompt = `
    Create a professional hero image for: ${inputs.copyHeadline}
    Style: Modern, clean, professional
    Colors: Based on brand guidelines
    Elements: Abstract, technology-focused, inspiring
    `;

    // Call DALL-E or Midjourney API
    const imageUrl = await this.generateImage(imagePrompt);
    
    // Optimize for web
    const optimizedImages = await this.optimizeForWeb(imageUrl);
    
    return {
      status: 'success',
      outputs: {
        heroImage: {
          original: imageUrl,
          optimized: optimizedImages,
          alt: `Hero image for ${inputs.copyHeadline}`,
          dimensions: { width: 1920, height: 1080 }
        }
      },
      nextTasks: [
        {
          agentType: 'UIUXAgent',
          taskType: 'create_landing_section',
          inputs: {
            copy: inputs.landingPageCopy,
            heroImage: optimizedImages.large
          }
        }
      ],
      qualityScore: 90
    };
  }

  private async generateImage(prompt: string): Promise<string> {
    // Integration with DALL-E 3 or Midjourney
    return "https://generated-image-url.com/image.jpg";
  }

  private async optimizeForWeb(imageUrl: string): Promise<any> {
    // Use Sharp or similar for optimization
    return {
      large: "optimized-large.webp",
      medium: "optimized-medium.webp", 
      small: "optimized-small.webp"
    };
  }
}
```

---

## Section 6: Orchestrator Core

### Mission Orchestrator

```typescript
// src/lib/orchestrator/mission-orchestrator.ts
export class MissionOrchestrator {
  
  async delegateGoal(request: DelegationRequest): Promise<DelegationResponse> {
    // 1. Create mission record
    const mission = await this.createMission(request);
    
    // 2. Decompose goal into tasks
    const tasks = await this.decomposeGoal(request.goal, request.context);
    
    // 3. Create task dependencies
    const taskGraph = this.buildTaskGraph(tasks);
    
    // 4. Queue initial tasks (no dependencies)
    await this.queueInitialTasks(mission.id, taskGraph);
    
    // 5. Set up real-time monitoring
    const channelId = `mission_${mission.id}`;
    
    return {
      missionId: mission.id,
      status: 'accepted',
      estimatedCompletion: this.calculateEstimatedCompletion(tasks),
      agentsAssigned: tasks.map(t => t.agentType),
      realTimeChannelId: channelId
    };
  }

  private async decomposeGoal(goal: string, context?: any): Promise<TaskDefinition[]> {
    const decompositionPrompt = `
    Decompose this business goal into specific agent tasks:
    Goal: ${goal}
    Context: ${JSON.stringify(context)}
    
    Available Agents: ContentAgent, MediaAgent, UIUXAgent, SocialAgent, SEOAgent
    
    Return a JSON array of tasks with dependencies.
    `;
    
    const llmResponse = await this.callLLM(decompositionPrompt);
    return JSON.parse(llmResponse);
  }

  private buildTaskGraph(tasks: TaskDefinition[]): TaskGraph {
    // Build dependency graph for task execution order
    return new TaskGraph(tasks);
  }

  async handleTaskCompletion(missionId: string, taskId: string, result: any): Promise<void> {
    // 1. Update task status
    await this.updateTaskStatus(taskId, 'COMPLETE', result);
    
    // 2. Check for dependent tasks
    const nextTasks = await this.getReadyTasks(missionId);
    
    // 3. Queue next tasks
    for (const task of nextTasks) {
      await this.queueTask(task);
    }
    
    // 4. Check mission completion
    const missionComplete = await this.checkMissionCompletion(missionId);
    
    if (missionComplete) {
      await this.completeMission(missionId);
    }
    
    // 5. Emit real-time update
    this.emitUpdate(missionId, {
      type: 'task_completed',
      taskId,
      result: result.outputs,
      nextTasks: nextTasks.map(t => t.agentType)
    });
  }
}
```

---

## Section 7: Real-Time Communication

### WebSocket Implementation

```typescript
// src/lib/orchestrator/websocket-server.ts
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';

export class OrchestratorWebSocket {
  private io: SocketIOServer;

  constructor(server: any) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('subscribe_mission', (missionId: string) => {
        socket.join(`mission_${missionId}`);
        console.log(`Client ${socket.id} subscribed to mission ${missionId}`);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  emitMissionUpdate(missionId: string, update: MissionUpdate): void {
    this.io.to(`mission_${missionId}`).emit('mission_update', update);
  }

  emitTaskProgress(missionId: string, progress: TaskProgress): void {
    this.io.to(`mission_${missionId}`).emit('task_progress', progress);
  }
}

interface MissionUpdate {
  type: 'task_started' | 'task_completed' | 'mission_completed' | 'error';
  timestamp: Date;
  message: string;
  data?: any;
}

interface TaskProgress {
  taskId: string;
  agentType: string;
  progress: number; // 0-100
  currentStep: string;
}
```

---

## Section 8: API Routes Integration

### Next.js API Routes for Frontend Communication

```typescript
// src/app/api/agents/delegate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MissionOrchestrator } from '@/lib/orchestrator/mission-orchestrator';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const delegationRequest = {
      clientId: session.user.id,
      goal: body.goal,
      tier: body.tier || 'Premium',
      priority: body.priority || 'normal',
      context: body.context
    };

    const orchestrator = new MissionOrchestrator();
    const response = await orchestrator.delegateGoal(delegationRequest);

    return NextResponse.json(response, { status: 202 });
    
  } catch (error) {
    console.error('Agent delegation error:', error);
    return NextResponse.json(
      { error: 'Failed to delegate to agents' },
      { status: 500 }
    );
  }
}
```

```typescript
// src/app/api/missions/[missionId]/status/route.ts
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
        tasks: true
      }
    });

    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    return NextResponse.json({
      mission: {
        id: mission.id,
        goal: mission.goal,
        status: mission.status,
        progress: calculateProgress(mission.tasks),
        estimatedCompletion: mission.estimatedCompletion,
        results: mission.results
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch mission status' },
      { status: 500 }
    );
  }
}
```

---

## Section 9: Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1-2)
- ✅ Database schema updates (Mission, MissionTask models)
- ✅ Basic queue setup with BullMQ and Redis
- ✅ Mission Orchestrator core class
- ✅ Basic agent service architecture

### Phase 2: Agent Services (Week 3-4)
- ✅ ContentAgentService implementation
- ✅ MediaAgentService implementation
- ✅ UIUXAgentService integration with existing component generator
- ✅ Task decomposition and dependency management

### Phase 3: Real-Time Communication (Week 5-6)
- ✅ WebSocket server setup
- ✅ Frontend real-time UI components
- ✅ Mission progress tracking
- ✅ Error handling and recovery

### Phase 4: Advanced Features (Week 7-8)
- ✅ Advanced task dependency resolution
- ✅ Performance optimization
- ✅ Comprehensive testing
- ✅ Production deployment

---

## Section 10: Success Metrics

### Technical Performance
- **Queue Processing**: <5 second average task pickup time
- **Task Completion**: >95% success rate
- **Real-Time Updates**: <100ms latency
- **System Uptime**: 99.9% availability

### Business Impact
- **Mission Completion**: >90% successful goal achievement
- **Client Satisfaction**: >4.8/5 average rating
- **Time to Delivery**: 70% faster than traditional agencies
- **Cost Efficiency**: 60% lower operational costs

---

## Conclusion

The Agent Orchestrator is the "ignition system" that transforms Zenith from a tools platform into an autonomous digital agency. This architecture provides the power, scalability, and resilience needed to deliver an experience that is truly unparalleled in the industry.

**Next Step**: Begin Phase 1 implementation with database schema updates and basic queue infrastructure.
