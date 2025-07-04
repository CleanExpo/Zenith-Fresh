/**
 * Agent Management API Endpoints
 * 
 * RESTful API for agent registration, monitoring, and lifecycle management.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Mock agent data generator
const generateMockAgent = (id?: string) => {
  const types = ['content', 'analytics', 'monitoring', 'integration', 'security'];
  const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];
  const zones = ['a', 'b', 'c'];
  const index = id ? parseInt(id.split('-')[1]) || 1 : Math.floor(Math.random() * 32) + 1;
  
  return {
    id: id || `agent-${index}`,
    name: `${types[index % types.length]}-agent-${Math.floor(index / types.length) + 1}`,
    type: types[index % types.length],
    status: ['idle', 'busy', 'maintenance', 'offline'][Math.floor(Math.random() * 4)],
    version: '1.0.0',
    currentTasks: Math.floor(Math.random() * 5),
    capabilities: [
      {
        type: types[index % types.length],
        priority: Math.floor(Math.random() * 10) + 1,
        maxConcurrency: Math.floor(Math.random() * 5) + 1,
        estimatedExecutionTime: Math.floor(Math.random() * 5000) + 1000,
        dependencies: [],
        resourceRequirements: {
          cpu: Math.random() * 2,
          memory: Math.random() * 1024 + 512,
          network: Math.random() * 100
        }
      }
    ],
    performance: {
      completedTasks: Math.floor(Math.random() * 100) + 50,
      averageExecutionTime: Math.floor(Math.random() * 5000) + 1000,
      successRate: 95 + Math.random() * 5,
      lastActivity: new Date(Date.now() - Math.random() * 300000).toISOString()
    },
    health: {
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 8192),
      uptime: Math.floor(Math.random() * 86400),
      errors: Math.floor(Math.random() * 5),
      lastCheck: new Date().toISOString(),
      checks: Array.from({ length: 5 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        type: 'http',
        status: Math.random() > 0.1 ? 'success' : 'failure',
        responseTime: Math.random() * 1000 + 50,
        message: Math.random() > 0.1 ? 'OK' : 'Service unavailable'
      }))
    },
    location: {
      region: regions[Math.floor(Math.random() * regions.length)],
      zone: zones[Math.floor(Math.random() * zones.length)],
      datacenter: `dc-${Math.floor(Math.random() * 3) + 1}`
    },
    endpoints: [
      {
        id: `endpoint-${index}`,
        type: 'websocket',
        url: `ws://agent-${index}:8080`,
        healthCheck: '/health'
      }
    ],
    metadata: {
      description: `${types[index % types.length]} processing agent`,
      tags: [types[index % types.length], 'production', 'auto-scaled'],
      author: 'orchestration-system',
      created: new Date(Date.now() - Math.random() * 2592000000).toISOString(), // Up to 30 days ago
      updated: new Date(Date.now() - Math.random() * 86400000).toISOString() // Up to 1 day ago
    }
  };
};

/**
 * GET /api/orchestration/agents
 * List all agents with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const region = searchParams.get('region');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeHealth = searchParams.get('include_health') === 'true';
    const includePerformance = searchParams.get('include_performance') === 'true';

    // Generate mock agents
    let agents = Array.from({ length: 32 }, (_, i) => generateMockAgent(`agent-${i + 1}`));

    // Apply filters
    if (status && status !== 'all') {
      agents = agents.filter(agent => agent.status === status);
    }

    if (type && type !== 'all') {
      agents = agents.filter(agent => agent.type === type);
    }

    if (region && region !== 'all') {
      agents = agents.filter(agent => agent.location.region === region);
    }

    // Apply pagination
    const total = agents.length;
    agents = agents.slice(offset, offset + limit);

    // Filter response fields based on query params
    const filteredAgents = agents.map(agent => {
      const filtered: any = {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        status: agent.status,
        version: agent.version,
        currentTasks: agent.currentTasks,
        capabilities: agent.capabilities,
        location: agent.location,
        metadata: agent.metadata
      };

      if (includeHealth) {
        filtered.health = agent.health;
      }

      if (includePerformance) {
        filtered.performance = agent.performance;
      }

      return filtered;
    });

    return NextResponse.json({
      agents: filteredAgents,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      filters: {
        status,
        type,
        region
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orchestration/agents
 * Register a new agent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      type,
      capabilities,
      endpoints,
      metadata,
      constraints
    } = body;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Agent name and type are required' },
        { status: 400 }
      );
    }

    if (!capabilities || !Array.isArray(capabilities) || capabilities.length === 0) {
      return NextResponse.json(
        { error: 'At least one capability is required' },
        { status: 400 }
      );
    }

    if (!endpoints || !Array.isArray(endpoints) || endpoints.length === 0) {
      return NextResponse.json(
        { error: 'At least one endpoint is required' },
        { status: 400 }
      );
    }

    // Generate agent ID
    const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create agent registration
    const agent = {
      id: agentId,
      name,
      type,
      status: 'idle',
      version: '1.0.0',
      capabilities: capabilities.map((cap: any) => ({
        type: cap.type,
        priority: cap.priority || 1,
        maxConcurrency: cap.maxConcurrency || 1,
        estimatedExecutionTime: cap.estimatedExecutionTime || 5000,
        dependencies: cap.dependencies || [],
        resourceRequirements: cap.resourceRequirements || {
          cpu: 1,
          memory: 512,
          network: 10
        }
      })),
      currentTasks: [],
      performance: {
        completedTasks: 0,
        averageExecutionTime: 0,
        successRate: 1.0,
        lastActivity: new Date().toISOString()
      },
      health: {
        cpu: 0,
        memory: 0,
        uptime: 0,
        errors: 0,
        lastCheck: new Date().toISOString(),
        checks: []
      },
      endpoints: endpoints.map((ep: any, index: number) => ({
        id: `endpoint-${agentId}-${index}`,
        type: ep.type || 'http',
        url: ep.url,
        healthCheck: ep.healthCheck || '/health',
        authentication: ep.authentication
      })),
      location: {
        region: constraints?.region || 'us-east-1',
        zone: constraints?.zone || 'a',
        datacenter: constraints?.datacenter || 'dc-1'
      },
      metadata: {
        description: metadata?.description || '',
        tags: metadata?.tags || [],
        author: metadata?.author || 'unknown',
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      }
    };

    // In real implementation, this would register with the agent registry
    console.log('Agent registered:', agent);

    return NextResponse.json({
      success: true,
      agentId,
      agent,
      message: 'Agent registered successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error registering agent:', error);
    return NextResponse.json(
      { error: 'Failed to register agent' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/orchestration/agents
 * Update agent configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, updates } = body;

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    // Simulate agent update
    const updatedAgent = {
      id: agentId,
      ...updates,
      metadata: {
        ...updates.metadata,
        updated: new Date().toISOString()
      }
    };

    // In real implementation, this would update the agent in the registry
    console.log('Agent updated:', updatedAgent);

    return NextResponse.json({
      success: true,
      agentId,
      updates: updatedAgent,
      message: 'Agent updated successfully'
    });

  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/orchestration/agents
 * Unregister an agent
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const force = searchParams.get('force') === 'true';

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    // Check if agent has running tasks (unless force is true)
    if (!force) {
      const agent = generateMockAgent(agentId);
      if (agent.currentTasks > 0) {
        return NextResponse.json(
          { 
            error: 'Agent has running tasks. Use force=true to override.',
            currentTasks: agent.currentTasks
          },
          { status: 409 }
        );
      }
    }

    // In real implementation, this would unregister the agent
    console.log('Agent unregistered:', agentId);

    return NextResponse.json({
      success: true,
      agentId,
      message: 'Agent unregistered successfully'
    });

  } catch (error) {
    console.error('Error unregistering agent:', error);
    return NextResponse.json(
      { error: 'Failed to unregister agent' },
      { status: 500 }
    );
  }
}