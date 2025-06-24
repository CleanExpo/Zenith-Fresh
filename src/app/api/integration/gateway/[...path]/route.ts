/**
 * Enterprise API Gateway
 * 
 * Dynamic route handler for all integration API requests
 * Handles routing, authentication, rate limiting, caching, and transformations
 */

import { NextRequest, NextResponse } from 'next/server';
import { enterpriseIntegrationHub } from '@/lib/agents/enterprise-integration-hub-agent';
import { auditLogger, AuditEventType } from '@/lib/audit/audit-logger';

interface RouteParams {
  path: string[];
}

// Handle all HTTP methods
export async function GET(request: NextRequest, { params }: { params: RouteParams }) {
  return handleGatewayRequest(request, 'GET', params.path);
}

export async function POST(request: NextRequest, { params }: { params: RouteParams }) {
  return handleGatewayRequest(request, 'POST', params.path);
}

export async function PUT(request: NextRequest, { params }: { params: RouteParams }) {
  return handleGatewayRequest(request, 'PUT', params.path);
}

export async function PATCH(request: NextRequest, { params }: { params: RouteParams }) {
  return handleGatewayRequest(request, 'PATCH', params.path);
}

export async function DELETE(request: NextRequest, { params }: { params: RouteParams }) {
  return handleGatewayRequest(request, 'DELETE', params.path);
}

async function handleGatewayRequest(
  request: NextRequest,
  method: string,
  pathSegments: string[]
): Promise<NextResponse> {
  const startTime = Date.now();
  const fullPath = '/' + pathSegments.join('/');
  
  try {
    console.log(`🚪 API Gateway: ${method} ${fullPath}`);

    // Extract headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Extract body for non-GET requests
    let body = null;
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        const contentType = headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          body = await request.json();
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          const formData = await request.formData();
          body = Object.fromEntries(formData.entries());
        } else {
          body = await request.text();
        }
      } catch (error) {
        // Ignore body parsing errors for empty bodies
      }
    }

    // Process request through the integration hub
    const response = await enterpriseIntegrationHub.processGatewayRequest(
      fullPath,
      method,
      headers,
      body
    );

    const duration = Date.now() - startTime;

    // Log the request
    await auditLogger.logSystemEvent(
      AuditEventType.SYSTEM_ACCESS,
      {
        action: 'api_gateway_request',
        method,
        path: fullPath,
        statusCode: response.statusCode,
        duration,
        userAgent: headers['user-agent'],
        ip: request.ip || 'unknown'
      }
    );

    // Add performance headers
    const responseHeaders = {
      ...response.headers,
      'X-Response-Time': `${duration}ms`,
      'X-Gateway': 'Zenith-Enterprise-Hub',
      'X-Timestamp': new Date().toISOString()
    };

    return new NextResponse(
      JSON.stringify(response.body),
      {
        status: response.statusCode,
        headers: responseHeaders
      }
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ API Gateway error for ${method} ${fullPath}:`, error);

    await auditLogger.logSystemEvent(
      AuditEventType.SYSTEM_ERROR,
      {
        action: 'api_gateway_error',
        method,
        path: fullPath,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      }
    );

    return NextResponse.json(
      {
        error: 'Gateway Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        path: fullPath,
        method,
        timestamp: new Date().toISOString()
      },
      {
        status: 500,
        headers: {
          'X-Response-Time': `${duration}ms`,
          'X-Gateway': 'Zenith-Enterprise-Hub',
          'X-Error': 'true'
        }
      }
    );
  }
}