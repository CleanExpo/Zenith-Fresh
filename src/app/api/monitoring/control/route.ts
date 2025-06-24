/**
 * ZENITH MONITORING CONTROL API
 * Control endpoints for advanced monitoring and observability agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { monitoringAgent, activateMonitoring, deactivateMonitoring, getMonitoringReport } from '@/lib/agents/advanced-monitoring-observability-agent';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        return NextResponse.json({
          success: true,
          data: monitoringAgent.getStatus(),
        });
      
      case 'report':
        const report = await getMonitoringReport();
        return NextResponse.json({
          success: true,
          data: {
            report,
            generatedAt: new Date().toISOString(),
          },
        });
      
      case 'incidents':
        const incidents = monitoringAgent.getIncidents();
        return NextResponse.json({
          success: true,
          data: {
            incidents,
            total: incidents.length,
            active: incidents.filter(i => i.status !== 'closed').length,
          },
        });
      
      case 'sla':
        const slaTargets = monitoringAgent.getSLATargets();
        return NextResponse.json({
          success: true,
          data: {
            targets: slaTargets,
            summary: {
              total: slaTargets.length,
              healthy: slaTargets.filter(s => s.status === 'healthy').length,
              warning: slaTargets.filter(s => s.status === 'warning').length,
              critical: slaTargets.filter(s => s.status === 'critical').length,
            },
          },
        });
      
      case 'dashboards':
        const dashboards = monitoringAgent.getDashboards();
        return NextResponse.json({
          success: true,
          data: {
            dashboards,
            total: dashboards.length,
          },
        });
      
      default:
        return NextResponse.json({
          success: true,
          data: {
            message: 'Monitoring Control API - Available actions: status, report, incidents, sla, dashboards',
            endpoints: {
              status: 'GET /api/monitoring/control?action=status',
              report: 'GET /api/monitoring/control?action=report',
              incidents: 'GET /api/monitoring/control?action=incidents',
              sla: 'GET /api/monitoring/control?action=sla',
              dashboards: 'GET /api/monitoring/control?action=dashboards',
              activate: 'POST /api/monitoring/control (body: {"action": "activate"})',
              deactivate: 'POST /api/monitoring/control (body: {"action": "deactivate"})',
              recordMetric: 'POST /api/monitoring/control (body: {"action": "recordMetric", "metric": {...}})',
              createIncident: 'POST /api/monitoring/control (body: {"action": "createIncident", "incident": {...}})',
            },
          },
        });
    }

  } catch (error) {
    console.error('Monitoring control API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process monitoring control request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'activate':
        await activateMonitoring();
        return NextResponse.json({
          success: true,
          message: 'Advanced Monitoring & Observability Agent activated',
          timestamp: new Date().toISOString(),
        });
      
      case 'deactivate':
        await deactivateMonitoring();
        return NextResponse.json({
          success: true,
          message: 'Advanced Monitoring & Observability Agent deactivated',
          timestamp: new Date().toISOString(),
        });
      
      case 'recordMetric':
        const { metric } = body;
        if (!metric) {
          return NextResponse.json(
            { success: false, error: 'Metric data required' },
            { status: 400 }
          );
        }
        
        monitoringAgent.recordBusinessMetric(metric);
        return NextResponse.json({
          success: true,
          message: 'Business metric recorded',
          metric: { ...metric, id: `metric_${Date.now()}`, timestamp: new Date() },
        });
      
      case 'createIncident':
        const { incident } = body;
        if (!incident) {
          return NextResponse.json(
            { success: false, error: 'Incident data required' },
            { status: 400 }
          );
        }
        
        const createdIncident = monitoringAgent.createIncident(incident);
        return NextResponse.json({
          success: true,
          message: 'Incident created',
          incident: createdIncident,
        });
      
      case 'startTrace':
        const { operationName, serviceName } = body;
        if (!operationName) {
          return NextResponse.json(
            { success: false, error: 'Operation name required' },
            { status: 400 }
          );
        }
        
        const trace = monitoringAgent.startTrace(operationName, serviceName);
        return NextResponse.json({
          success: true,
          message: 'Trace started',
          trace: {
            traceId: trace.traceId,
            spanId: trace.spanId,
            operationName: trace.operationName,
            serviceName: trace.serviceName,
            startTime: trace.startTime,
          },
        });
      
      case 'recordUserExperience':
        const { userExperience } = body;
        if (!userExperience) {
          return NextResponse.json(
            { success: false, error: 'User experience data required' },
            { status: 400 }
          );
        }
        
        monitoringAgent.recordUserExperienceMetric(userExperience);
        return NextResponse.json({
          success: true,
          message: 'User experience metric recorded',
          sessionId: userExperience.sessionId,
        });
      
      case 'updateConfiguration':
        const { config } = body;
        if (!config) {
          return NextResponse.json(
            { success: false, error: 'Configuration required' },
            { status: 400 }
          );
        }
        
        // In a real implementation, would update the configuration
        return NextResponse.json({
          success: true,
          message: 'Configuration updated (simulated)',
          config,
        });
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Monitoring control POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process monitoring control request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id } = body;

    switch (action) {
      case 'updateIncident':
        const { updates, user } = body;
        if (!id || !updates) {
          return NextResponse.json(
            { success: false, error: 'Incident ID and updates required' },
            { status: 400 }
          );
        }
        
        const updatedIncident = monitoringAgent.updateIncident(id, updates, user);
        if (!updatedIncident) {
          return NextResponse.json(
            { success: false, error: 'Incident not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          message: 'Incident updated',
          incident: updatedIncident,
        });
      
      case 'resolveIncident':
        const { resolvedBy, resolution } = body;
        if (!id) {
          return NextResponse.json(
            { success: false, error: 'Incident ID required' },
            { status: 400 }
          );
        }
        
        const resolvedIncident = monitoringAgent.updateIncident(id, {
          status: 'resolved',
          rootCause: resolution?.rootCause,
          postMortem: resolution?.postMortem,
        }, resolvedBy);
        
        if (!resolvedIncident) {
          return NextResponse.json(
            { success: false, error: 'Incident not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          message: 'Incident resolved',
          incident: resolvedIncident,
        });
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action for PUT request' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Monitoring control PUT error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process monitoring control request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'DELETE operations not supported for monitoring control' },
    { status: 405 }
  );
}