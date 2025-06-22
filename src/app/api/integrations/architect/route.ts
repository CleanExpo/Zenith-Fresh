// src/app/api/integrations/architect/route.ts

import { NextRequest, NextResponse } from 'next/server';
import IntegrationArchitectAgent from '@/lib/agents/integration-architect-agent';

const integrationAgent = new IntegrationArchitectAgent();

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json();

    switch (action) {
      case 'process_directive':
        return await handleProcessDirective(params);
      
      case 'execute_integration':
        return await handleExecuteIntegration(params);
      
      case 'get_status':
        return await handleGetStatus(params);
      
      case 'get_supported_services':
        return await handleGetSupportedServices();
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('IntegrationArchitect API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'active_integrations':
        const integrations = await integrationAgent.getActiveIntegrations();
        return NextResponse.json({ integrations });
      
      case 'supported_services':
        const services = integrationAgent.getSupportedServices();
        return NextResponse.json({ services });
      
      default:
        return NextResponse.json(
          { error: 'Action parameter required' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('IntegrationArchitect API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==================== ACTION HANDLERS ====================

async function handleProcessDirective(params: any) {
  try {
    const { clientId, goal, priority = 'MEDIUM' } = params;

    if (!clientId || !goal) {
      return NextResponse.json(
        { error: 'clientId and goal are required' },
        { status: 400 }
      );
    }

    console.log(`Processing integration directive: "${goal}" for client ${clientId}`);

    const integrationPlan = await integrationAgent.processClientDirective(
      clientId,
      goal,
      priority
    );

    return NextResponse.json({
      success: true,
      message: 'Integration plan created successfully',
      integrationPlan: {
        integrationId: integrationPlan.integrationId,
        sourceService: integrationPlan.request.sourceService,
        targetLocation: integrationPlan.request.targetLocation,
        estimatedComplexity: integrationPlan.estimatedComplexity,
        estimatedTimeMinutes: integrationPlan.estimatedTimeMinutes,
        authMethod: integrationPlan.authenticationPlan.method,
        credentialsRequired: integrationPlan.authenticationPlan.credentialsRequired,
        apiRoutes: integrationPlan.backendScaffolding.apiRoutes.length,
        components: integrationPlan.frontendIntegration.components.length,
        dataTransformations: integrationPlan.dataMapping.transformations.length
      }
    });
  } catch (error) {
    console.error('Error processing directive:', error);
    return NextResponse.json(
      { error: 'Failed to process integration directive' },
      { status: 500 }
    );
  }
}

async function handleExecuteIntegration(params: any) {
  try {
    const { integrationId } = params;

    if (!integrationId) {
      return NextResponse.json(
        { error: 'integrationId is required' },
        { status: 400 }
      );
    }

    console.log(`Executing integration: ${integrationId}`);

    const result = await integrationAgent.executeIntegration(integrationId);

    return NextResponse.json({
      success: true,
      message: 'Integration executed successfully',
      result: {
        integrationId: result.integrationId,
        status: result.status,
        estimatedValue: result.estimatedValue,
        pullRequest: {
          url: result.pullRequest.url,
          title: result.pullRequest.title,
          branch: result.pullRequest.branch,
          filesCreated: result.pullRequest.files.length
        },
        nextSteps: result.nextSteps
      }
    });
  } catch (error) {
    console.error('Error executing integration:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute integration' },
      { status: 500 }
    );
  }
}

async function handleGetStatus(params: any) {
  try {
    const { integrationId } = params;

    if (!integrationId) {
      return NextResponse.json(
        { error: 'integrationId is required' },
        { status: 400 }
      );
    }

    const status = await integrationAgent.getIntegrationStatus(integrationId);

    return NextResponse.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error getting status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get integration status' },
      { status: 500 }
    );
  }
}

async function handleGetSupportedServices() {
  try {
    const services = integrationAgent.getSupportedServices();
    
    const serviceDetails = services.map(service => ({
      name: service,
      displayName: service.charAt(0).toUpperCase() + service.slice(1),
      category: getServiceCategory(service),
      commonUse: getCommonUseCase(service)
    }));

    return NextResponse.json({
      success: true,
      services: serviceDetails,
      totalSupported: services.length
    });
  } catch (error) {
    console.error('Error getting supported services:', error);
    return NextResponse.json(
      { error: 'Failed to get supported services' },
      { status: 500 }
    );
  }
}

// ==================== HELPER FUNCTIONS ====================

function getServiceCategory(service: string): string {
  const categories: Record<string, string> = {
    shopify: 'E-commerce',
    stripe: 'Payments',
    mailchimp: 'Email Marketing',
    google: 'Analytics & Productivity',
    slack: 'Communication',
    hubspot: 'CRM',
    salesforce: 'CRM',
    zapier: 'Automation',
    airtable: 'Database',
    notion: 'Productivity'
  };
  
  return categories[service] || 'Other';
}

function getCommonUseCase(service: string): string {
  const useCases: Record<string, string> = {
    shopify: 'Display products, sync inventory, track orders',
    stripe: 'Process payments, manage subscriptions, track revenue',
    mailchimp: 'Email campaigns, subscriber management, automation',
    google: 'Analytics tracking, calendar integration, drive access',
    slack: 'Team notifications, channel management, bot integration',
    hubspot: 'Contact management, deal tracking, marketing automation',
    salesforce: 'Customer relationship management, lead tracking',
    zapier: 'Workflow automation, app connections, triggers',
    airtable: 'Database operations, record management, collaboration',
    notion: 'Content management, knowledge base, task tracking'
  };
  
  return useCases[service] || 'Custom integration';
}
