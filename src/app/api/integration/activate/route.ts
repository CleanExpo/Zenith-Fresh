/**
 * Enterprise Integration Hub Activation API
 * 
 * POST /api/integration/activate - Activate the Enterprise Integration Hub
 * GET /api/integration/status - Get activation status
 */

import { NextRequest, NextResponse } from 'next/server';
import { activateEnterpriseHub, HubActivationConfig } from '@/lib/integration/activate-enterprise-hub';
import { runIntegrationTests } from '@/lib/integration/integration-testing-framework';
import { enterpriseCache } from '@/lib/scalability/enterprise-redis-cache';
import { auditLogger, AuditEventType } from '@/lib/audit/audit-logger';

// POST /api/integration/activate
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API: Activating Enterprise Integration Hub...');
    
    const body = await request.json().catch(() => ({}));
    const config: HubActivationConfig = {
      enableDeveloperPortal: body.enableDeveloperPortal ?? true,
      enableAPIGateway: body.enableAPIGateway ?? true,
      enableWebhooks: body.enableWebhooks ?? true,
      enableSDKGeneration: body.enableSDKGeneration ?? true,
      enableMarketplace: body.enableMarketplace ?? true,
      integrationTemplates: body.integrationTemplates ?? true,
      generateDocumentation: body.generateDocumentation ?? true,
      setupTestEnvironment: body.setupTestEnvironment ?? true
    };

    // Check if already activated recently
    const lastActivation = await enterpriseCache.get('hub:last-activation');
    if (lastActivation) {
      const lastActivationTime = new Date(lastActivation);
      const timeSinceLastActivation = Date.now() - lastActivationTime.getTime();
      
      if (timeSinceLastActivation < 300000) { // 5 minutes
        return NextResponse.json({
          success: false,
          message: 'Integration Hub was recently activated. Please wait before reactivating.',
          lastActivation: lastActivationTime,
          nextAllowedActivation: new Date(lastActivationTime.getTime() + 300000)
        }, { status: 429 });
      }
    }

    // Activate the hub
    const activationResult = await activateEnterpriseHub(config);
    
    // Store activation result
    await enterpriseCache.set('hub:activation-result', JSON.stringify(activationResult), 3600);
    await enterpriseCache.set('hub:last-activation', new Date().toISOString(), 3600);

    // Run integration tests if activation was successful
    let testResults = null;
    if (activationResult.success && body.runTests !== false) {
      try {
        console.log('🧪 Running integration tests...');
        testResults = await runIntegrationTests();
        await enterpriseCache.set('hub:test-results', JSON.stringify(testResults), 3600);
      } catch (error) {
        console.warn('Integration tests failed:', error);
        activationResult.warnings.push(`Integration tests failed: ${error}`);
      }
    }

    await auditLogger.logSystemEvent(
      AuditEventType.SYSTEM_ACCESS,
      {
        action: 'hub_activation_api_called',
        success: activationResult.success,
        config,
        testResults: testResults?.summary
      }
    );

    const response = {
      success: activationResult.success,
      message: activationResult.message,
      statistics: activationResult.statistics,
      endpoints: activationResult.endpoints,
      warnings: activationResult.warnings,
      errors: activationResult.errors,
      testResults: testResults?.summary,
      timestamp: new Date().toISOString()
    };

    const status = activationResult.success ? 200 : 500;
    return NextResponse.json(response, { status });

  } catch (error) {
    console.error('❌ Hub activation API error:', error);
    
    await auditLogger.logSystemEvent(
      AuditEventType.SYSTEM_ERROR,
      {
        action: 'hub_activation_api_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    );

    return NextResponse.json({
      success: false,
      message: `Hub activation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET /api/integration/status
export async function GET(request: NextRequest) {
  try {
    console.log('📊 API: Getting Enterprise Integration Hub status...');

    // Get cached activation result
    const cachedResult = await enterpriseCache.get('hub:activation-result');
    const cachedTests = await enterpriseCache.get('hub:test-results');
    const lastActivation = await enterpriseCache.get('hub:last-activation');

    let activationResult = null;
    let testResults = null;

    if (cachedResult) {
      try {
        activationResult = JSON.parse(cachedResult);
      } catch (error) {
        console.warn('Failed to parse cached activation result:', error);
      }
    }

    if (cachedTests) {
      try {
        testResults = JSON.parse(cachedTests);
      } catch (error) {
        console.warn('Failed to parse cached test results:', error);
      }
    }

    const response = {
      activated: !!activationResult?.success,
      lastActivation: lastActivation ? new Date(lastActivation) : null,
      activationResult,
      testResults,
      endpoints: activationResult?.endpoints || {
        apiGateway: '/api/integration/gateway',
        developerPortal: '/dev-portal',
        marketplace: '/integration-marketplace',
        documentation: '/docs/integrations',
        webhooks: '/api/webhooks'
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Hub status API error:', error);
    
    return NextResponse.json({
      success: false,
      message: `Failed to get hub status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}