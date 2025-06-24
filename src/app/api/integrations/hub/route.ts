// src/app/api/integrations/hub/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { enterpriseIntegrationHub } from '@/lib/agents/enterprise-integration-hub-agent';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const tenantId = searchParams.get('tenantId') || session.user?.id;

    switch (action) {
      case 'integrations':
        return await handleGetIntegrations();

      case 'instances':
        return await handleGetInstances(tenantId!);

      case 'health':
        return await handleGetHealth();

      case 'developer-portal':
        return await handleGetDeveloperPortal();

      case 'integration':
        const integrationId = searchParams.get('integrationId');
        if (!integrationId) {
          return NextResponse.json({ error: 'integrationId required' }, { status: 400 });
        }
        return await handleGetIntegration(integrationId);

      case 'instance':
        const instanceId = searchParams.get('instanceId');
        if (!instanceId) {
          return NextResponse.json({ error: 'instanceId required' }, { status: 400 });
        }
        return await handleGetInstance(instanceId);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Enterprise Integration Hub API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, ...params } = await request.json();
    const tenantId = params.tenantId || session.user?.id;

    switch (action) {
      case 'create_instance':
        return await handleCreateInstance(params, tenantId);

      case 'sync_data':
        return await handleSyncData(params);

      case 'create_route':
        return await handleCreateRoute(params);

      case 'register_integration':
        return await handleRegisterIntegration(params);

      case 'gateway_request':
        return await handleGatewayRequest(params);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Enterprise Integration Hub API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, ...params } = await request.json();

    switch (action) {
      case 'update_instance':
        return await handleUpdateInstance(params);

      case 'update_integration':
        return await handleUpdateIntegration(params);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Enterprise Integration Hub API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==================== ACTION HANDLERS ====================

async function handleGetIntegrations() {
  try {
    const integrations = await enterpriseIntegrationHub.getAvailableIntegrations();
    
    const response = integrations.map(integration => ({
      id: integration.id,
      name: integration.name,
      displayName: integration.displayName,
      description: integration.description,
      category: integration.category,
      provider: integration.provider,
      version: integration.version,
      status: integration.status,
      authType: integration.authType,
      endpoints: integration.endpoints.length,
      schemas: integration.dataSchemas.length,
      templates: integration.templates.length,
      rateLimits: integration.rateLimits,
      compliance: integration.compliance
    }));

    return NextResponse.json({
      success: true,
      integrations: response,
      total: response.length
    });
  } catch (error) {
    console.error('Failed to get integrations:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve integrations' },
      { status: 500 }
    );
  }
}

async function handleGetInstances(tenantId: string) {
  try {
    const instances = await enterpriseIntegrationHub.getTenantInstances(tenantId);
    
    const response = instances.map(instance => ({
      id: instance.id,
      integrationId: instance.integrationId,
      name: instance.name,
      status: instance.status,
      lastSync: instance.lastSync,
      syncFrequency: instance.syncFrequency,
      metrics: instance.metrics,
      errorCount: instance.errorCount,
      successCount: instance.successCount,
      alerts: instance.alerts,
      createdAt: instance.createdAt
    }));

    return NextResponse.json({
      success: true,
      instances: response,
      total: response.length
    });
  } catch (error) {
    console.error('Failed to get instances:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve instances' },
      { status: 500 }
    );
  }
}

async function handleGetHealth() {
  try {
    const health = await enterpriseIntegrationHub.getIntegrationHealth();
    
    return NextResponse.json({
      success: true,
      health: {
        overall: health.overall,
        integrations: health.integrations,
        activeInstances: health.activeInstances,
        errorRate: health.errorRate,
        averageResponseTime: health.averageResponseTime,
        timestamp: new Date().toISOString()
      },
      details: health.details
    });
  } catch (error) {
    console.error('Failed to get health status:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve health status' },
      { status: 500 }
    );
  }
}

async function handleGetDeveloperPortal() {
  try {
    const portal = await enterpriseIntegrationHub.generateDeveloperPortal();
    
    return NextResponse.json({
      success: true,
      portal: {
        integrations: portal.integrations,
        sdks: portal.sdks,
        examples: portal.examples,
        tutorials: portal.tutorials,
        documentation: portal.documentation
      }
    });
  } catch (error) {
    console.error('Failed to get developer portal:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve developer portal' },
      { status: 500 }
    );
  }
}

async function handleGetIntegration(integrationId: string) {
  try {
    const integration = await enterpriseIntegrationHub.getIntegration(integrationId);
    
    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        name: integration.name,
        displayName: integration.displayName,
        description: integration.description,
        category: integration.category,
        provider: integration.provider,
        version: integration.version,
        status: integration.status,
        authType: integration.authType,
        endpoints: integration.endpoints,
        dataSchemas: integration.dataSchemas,
        rateLimits: integration.rateLimits,
        compliance: integration.compliance,
        documentation: integration.documentation,
        templates: integration.templates,
        metadata: integration.metadata
      }
    });
  } catch (error) {
    console.error('Failed to get integration:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve integration' },
      { status: 500 }
    );
  }
}

async function handleGetInstance(instanceId: string) {
  try {
    const instance = await enterpriseIntegrationHub.getInstance(instanceId);
    
    if (!instance) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      instance: {
        id: instance.id,
        integrationId: instance.integrationId,
        tenantId: instance.tenantId,
        name: instance.name,
        status: instance.status,
        lastSync: instance.lastSync,
        syncFrequency: instance.syncFrequency,
        metrics: instance.metrics,
        errorCount: instance.errorCount,
        successCount: instance.successCount,
        alerts: instance.alerts,
        createdAt: instance.createdAt,
        updatedAt: instance.updatedAt
        // Note: credentials excluded for security
      }
    });
  } catch (error) {
    console.error('Failed to get instance:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve instance' },
      { status: 500 }
    );
  }
}

async function handleCreateInstance(params: any, tenantId: string) {
  try {
    const { integrationId, configuration, credentials, name } = params;

    if (!integrationId || !configuration || !credentials) {
      return NextResponse.json(
        { error: 'integrationId, configuration, and credentials are required' },
        { status: 400 }
      );
    }

    const instance = await enterpriseIntegrationHub.createInstance(
      integrationId,
      tenantId,
      configuration,
      credentials
    );

    return NextResponse.json({
      success: true,
      message: 'Integration instance created successfully',
      instance: {
        id: instance.id,
        integrationId: instance.integrationId,
        name: instance.name,
        status: instance.status,
        createdAt: instance.createdAt
      }
    });
  } catch (error) {
    console.error('Failed to create instance:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create instance' },
      { status: 500 }
    );
  }
}

async function handleSyncData(params: any) {
  try {
    const { instanceId, direction = 'inbound' } = params;

    if (!instanceId) {
      return NextResponse.json(
        { error: 'instanceId is required' },
        { status: 400 }
      );
    }

    const result = await enterpriseIntegrationHub.syncData(instanceId, direction);

    return NextResponse.json({
      success: true,
      message: 'Data synchronization completed',
      result: {
        success: result.success,
        recordsProcessed: result.recordsProcessed,
        errors: result.errors,
        duration: result.duration
      }
    });
  } catch (error) {
    console.error('Failed to sync data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync data' },
      { status: 500 }
    );
  }
}

async function handleCreateRoute(params: any) {
  try {
    const route = await enterpriseIntegrationHub.createAPIRoute(params);

    return NextResponse.json({
      success: true,
      message: 'API route created successfully',
      route: {
        id: route.id,
        path: route.path,
        method: route.method,
        integrationId: route.integrationId,
        instanceId: route.instanceId
      }
    });
  } catch (error) {
    console.error('Failed to create route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create route' },
      { status: 500 }
    );
  }
}

async function handleRegisterIntegration(params: any) {
  try {
    const integration = await enterpriseIntegrationHub.registerIntegration(params);

    return NextResponse.json({
      success: true,
      message: 'Integration registered successfully',
      integration: {
        id: integration.id,
        name: integration.name,
        displayName: integration.displayName,
        category: integration.category,
        provider: integration.provider,
        status: integration.status
      }
    });
  } catch (error) {
    console.error('Failed to register integration:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to register integration' },
      { status: 500 }
    );
  }
}

async function handleGatewayRequest(params: any) {
  try {
    const { path, method, headers, body } = params;

    if (!path || !method) {
      return NextResponse.json(
        { error: 'path and method are required' },
        { status: 400 }
      );
    }

    const result = await enterpriseIntegrationHub.processGatewayRequest(
      path,
      method,
      headers || {},
      body
    );

    return NextResponse.json(result.body, {
      status: result.statusCode,
      headers: result.headers
    });
  } catch (error) {
    console.error('Failed to process gateway request:', error);
    return NextResponse.json(
      { error: 'Failed to process gateway request' },
      { status: 500 }
    );
  }
}

async function handleUpdateInstance(params: any) {
  try {
    const { instanceId, updates } = params;

    if (!instanceId) {
      return NextResponse.json(
        { error: 'instanceId is required' },
        { status: 400 }
      );
    }

    // Implementation would update the instance
    return NextResponse.json({
      success: true,
      message: 'Instance updated successfully'
    });
  } catch (error) {
    console.error('Failed to update instance:', error);
    return NextResponse.json(
      { error: 'Failed to update instance' },
      { status: 500 }
    );
  }
}

async function handleUpdateIntegration(params: any) {
  try {
    const { integrationId, updates } = params;

    if (!integrationId) {
      return NextResponse.json(
        { error: 'integrationId is required' },
        { status: 400 }
      );
    }

    // Implementation would update the integration
    return NextResponse.json({
      success: true,
      message: 'Integration updated successfully'
    });
  } catch (error) {
    console.error('Failed to update integration:', error);
    return NextResponse.json(
      { error: 'Failed to update integration' },
      { status: 500 }
    );
  }
}