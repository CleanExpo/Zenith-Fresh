// src/app/api/intelligence/automation/route.ts
// Intelligence Automation API - Automated competitive monitoring and alerts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { intelligenceAutomationEngine } from '@/lib/intelligence/automation-engine';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      action,
      workflow,
      reportConfig,
      alertConfig
    } = body;

    // Check team access and subscription
    const teamId = request.headers.get('x-team-id');
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { billing: true }
    });

    if (!team || !['enterprise'].includes(team.subscriptionPlan || '')) {
      return NextResponse.json(
        { error: 'Enterprise subscription required for intelligence automation' },
        { status: 403 }
      );
    }

    let result;

    switch (action) {
      case 'create_workflow':
        if (!workflow) {
          return NextResponse.json(
            { error: 'Workflow configuration is required' },
            { status: 400 }
          );
        }

        result = await intelligenceAutomationEngine.createWorkflow({
          name: workflow.name,
          type: workflow.type,
          teamId,
          targetDomains: workflow.targetDomains || [],
          schedule: workflow.schedule || { frequency: 'daily' },
          triggers: workflow.triggers || [],
          actions: workflow.actions || [],
          filters: workflow.filters || [],
          isActive: workflow.isActive !== false,
          metadata: {
            createdBy: session.user.id,
            priority: workflow.priority || 'medium',
            alertingEnabled: workflow.alertingEnabled !== false,
            reportingEnabled: workflow.reportingEnabled !== false
          }
        });
        break;

      case 'generate_report':
        if (!reportConfig) {
          return NextResponse.json(
            { error: 'Report configuration is required' },
            { status: 400 }
          );
        }

        // Create a temporary workflow for report generation
        const tempWorkflow = await intelligenceAutomationEngine.createWorkflow({
          name: `One-time Report: ${reportConfig.type}`,
          type: 'custom',
          teamId,
          targetDomains: reportConfig.targetDomains || [],
          schedule: { frequency: 'real_time' },
          triggers: [],
          actions: [
            {
              type: 'generate_report',
              target: 'email',
              parameters: reportConfig,
              priority: 'medium'
            }
          ],
          filters: [],
          isActive: true,
          metadata: {
            createdBy: session.user.id,
            priority: 'medium',
            alertingEnabled: false,
            reportingEnabled: true
          }
        });

        result = await intelligenceAutomationEngine.generateAutomatedReport(
          tempWorkflow,
          reportConfig.type,
          reportConfig.data || {}
        );
        break;

      case 'test_workflow':
        if (!workflow?.id) {
          return NextResponse.json(
            { error: 'Workflow ID is required for testing' },
            { status: 400 }
          );
        }

        // Execute workflow once for testing
        await intelligenceAutomationEngine.executeWorkflow(workflow.id);
        
        result = {
          message: 'Workflow test execution completed',
          workflowId: workflow.id,
          executedAt: new Date().toISOString()
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }

    // Track API usage
    await prisma.analyticsEvent.create({
      data: {
        event: 'intelligence_automation_action',
        userId: session.user.id,
        sessionId: session.user.id,
        properties: {
          action,
          workflowType: workflow?.type || 'unknown',
          teamId
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        action,
        executedAt: new Date().toISOString(),
        teamId
      }
    });

  } catch (error) {
    console.error('Intelligence automation API error:', error);
    return NextResponse.json(
      { 
        error: 'Intelligence automation action failed',
        message: 'Unable to execute automation action. Please try again.'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource') || 'workflows';
    const workflowId = searchParams.get('workflowId');
    const teamId = request.headers.get('x-team-id');

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
    }

    let result;

    switch (resource) {
      case 'workflows':
        if (workflowId) {
          // Get specific workflow
          const workflow = await prisma.automationWorkflow.findUnique({
            where: { id: workflowId },
            include: {
              executions: {
                orderBy: { executedAt: 'desc' },
                take: 10
              }
            }
          });

          if (!workflow) {
            return NextResponse.json(
              { error: 'Workflow not found' },
              { status: 404 }
            );
          }

          result = {
            ...workflow,
            executions: workflow.executions.map(exec => ({
              ...exec,
              executedAt: exec.executedAt.toISOString()
            }))
          };
        } else {
          // Get all workflows for team
          const workflows = await prisma.automationWorkflow.findMany({
            where: { teamId },
            orderBy: { createdAt: 'desc' },
            include: {
              _count: {
                select: { executions: true }
              }
            }
          });

          result = workflows.map(workflow => ({
            id: workflow.id,
            name: workflow.name,
            type: workflow.type,
            isActive: workflow.isActive,
            lastRun: workflow.lastRun?.toISOString(),
            nextRun: workflow.nextRun?.toISOString(),
            executionCount: workflow._count.executions,
            createdAt: workflow.createdAt.toISOString()
          }));
        }
        break;

      case 'alerts':
        const alerts = await prisma.monitoringAlert.findMany({
          where: { 
            teamId,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        });

        result = alerts.map(alert => ({
          id: alert.id,
          workflowId: alert.workflowId,
          alertType: alert.alertType,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          isResolved: alert.isResolved,
          createdAt: alert.createdAt.toISOString(),
          resolvedAt: alert.resolvedAt?.toISOString()
        }));
        break;

      case 'reports':
        const reports = await prisma.automatedReport.findMany({
          where: { teamId },
          orderBy: { generatedAt: 'desc' },
          take: 20,
          select: {
            id: true,
            workflowId: true,
            reportType: true,
            title: true,
            generatedAt: true,
            deliveryStatus: true,
            period: true
          }
        });

        result = reports.map(report => ({
          ...report,
          generatedAt: report.generatedAt.toISOString()
        }));
        break;

      case 'executions':
        const executions = await prisma.workflowExecution.findMany({
          where: workflowId ? { workflowId } : {},
          orderBy: { executedAt: 'desc' },
          take: 100,
          include: {
            workflow: {
              select: {
                name: true,
                type: true
              }
            }
          }
        });

        result = executions.map(execution => ({
          id: execution.id,
          workflowId: execution.workflowId,
          workflowName: execution.workflow.name,
          workflowType: execution.workflow.type,
          status: execution.status,
          executedAt: execution.executedAt.toISOString(),
          duration: execution.duration,
          error: execution.error
        }));
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid resource type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get intelligence automation error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve automation data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workflowId, updates } = body;

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    const teamId = request.headers.get('x-team-id');
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
    }

    // Update workflow
    const updatedWorkflow = await prisma.automationWorkflow.update({
      where: { 
        id: workflowId,
        teamId // Ensure team ownership
      },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });

    // If workflow was activated/deactivated, handle scheduling
    if (updates.isActive !== undefined) {
      if (updates.isActive) {
        await intelligenceAutomationEngine.scheduleWorkflow(updatedWorkflow as any);
      }
      // Note: Workflow stopping would be handled by the automation engine
    }

    return NextResponse.json({
      success: true,
      data: updatedWorkflow
    });

  } catch (error) {
    console.error('Update workflow error:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');
    const alertId = searchParams.get('alertId');

    const teamId = request.headers.get('x-team-id');
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
    }

    if (workflowId) {
      // Delete workflow
      await prisma.automationWorkflow.delete({
        where: { 
          id: workflowId,
          teamId // Ensure team ownership
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Workflow deleted successfully'
      });
    }

    if (alertId) {
      // Resolve/dismiss alert
      await prisma.monitoringAlert.update({
        where: { 
          id: alertId,
          teamId // Ensure team ownership
        },
        data: {
          isResolved: true,
          resolvedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Alert resolved successfully'
      });
    }

    return NextResponse.json(
      { error: 'No valid resource specified for deletion' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Delete automation resource error:', error);
    return NextResponse.json(
      { error: 'Failed to delete resource' },
      { status: 500 }
    );
  }
}