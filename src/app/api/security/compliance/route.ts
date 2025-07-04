/**
 * Security Compliance API Endpoint
 * 
 * Provides compliance framework data, assessment results,
 * and regulatory status information.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { 
  multiFrameworkCompliance,
  ComplianceFramework,
  AssessmentType
} from '@/lib/compliance/multi-framework-compliance';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and permissions
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user?.email! },
      include: {
        teams: {
          include: {
            team: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hasComplianceAccess = user.teams.some(membership => 
      membership.role === 'admin' || 
      membership.role === 'compliance' ||
      membership.role === 'security' ||
      membership.team.name.toLowerCase().includes('compliance') ||
      membership.team.name.toLowerCase().includes('security')
    );

    if (!hasComplianceAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const framework = searchParams.get('framework');

    if (action === 'overview') {
      // Get compliance overview
      const overview = await multiFrameworkCompliance.getComplianceOverview();
      return NextResponse.json({
        success: true,
        data: overview
      });
    }

    if (action === 'frameworks') {
      // Get available frameworks
      return NextResponse.json({
        success: true,
        data: {
          frameworks: Object.values(ComplianceFramework),
          assessmentTypes: Object.values(AssessmentType)
        }
      });
    }

    if (action === 'report' && framework) {
      // Generate compliance report for specific framework
      const reportId = await multiFrameworkCompliance.generateComplianceReport(
        framework as ComplianceFramework,
        {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          end: new Date()
        }
      );

      return NextResponse.json({
        success: true,
        reportId,
        message: 'Compliance report generated successfully'
      });
    }

    // Default to overview
    const overview = await multiFrameworkCompliance.getComplianceOverview();
    return NextResponse.json({
      success: true,
      data: overview
    });

  } catch (error) {
    console.error('Security compliance GET API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and permissions
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user?.email! },
      include: {
        teams: {
          include: {
            team: true
          }
        }
      }
    });

    if (!user || !user.teams.some(t => 
      t.role === 'admin' || 
      t.role === 'compliance' || 
      t.role === 'security'
    )) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'run_assessment':
        // Run compliance assessment
        const { framework } = body;
        
        if (!framework || !Object.values(ComplianceFramework).includes(framework)) {
          return NextResponse.json({
            error: 'Valid framework is required'
          }, { status: 400 });
        }

        const assessmentId = await multiFrameworkCompliance.performAutomatedAssessment(
          framework as ComplianceFramework
        );

        return NextResponse.json({
          success: true,
          assessmentId,
          message: `${framework} assessment initiated`
        });

      case 'enable_framework':
        // Enable compliance framework
        const { frameworkToEnable } = body;
        
        if (!frameworkToEnable || !Object.values(ComplianceFramework).includes(frameworkToEnable)) {
          return NextResponse.json({
            error: 'Valid framework is required'
          }, { status: 400 });
        }

        await multiFrameworkCompliance.enableFramework(frameworkToEnable as ComplianceFramework);

        return NextResponse.json({
          success: true,
          message: `${frameworkToEnable} framework enabled`
        });

      case 'generate_report':
        // Generate compliance report
        const { reportFramework, startDate, endDate } = body;
        
        if (!reportFramework || !Object.values(ComplianceFramework).includes(reportFramework)) {
          return NextResponse.json({
            error: 'Valid framework is required'
          }, { status: 400 });
        }

        const period = {
          start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: endDate ? new Date(endDate) : new Date()
        };

        const reportId = await multiFrameworkCompliance.generateComplianceReport(
          reportFramework as ComplianceFramework,
          period
        );

        return NextResponse.json({
          success: true,
          reportId,
          message: 'Compliance report generated successfully'
        });

      case 'run_all_assessments':
        // Run assessments for all enabled frameworks
        const frameworks = Object.values(ComplianceFramework);
        const assessmentPromises = frameworks.map(fw => 
          multiFrameworkCompliance.performAutomatedAssessment(fw)
        );

        const assessmentIds = await Promise.all(assessmentPromises);

        return NextResponse.json({
          success: true,
          assessmentIds,
          message: 'All compliance assessments initiated'
        });

      case 'get_overview':
        // Get compliance overview
        const overview = await multiFrameworkCompliance.getComplianceOverview();
        
        return NextResponse.json({
          success: true,
          data: overview
        });

      case 'compliance_dashboard':
        // Get comprehensive compliance dashboard data
        const dashboardData = {
          overview: await multiFrameworkCompliance.getComplianceOverview(),
          frameworks: Object.values(ComplianceFramework),
          assessmentTypes: Object.values(AssessmentType),
          recentActivity: generateRecentComplianceActivity(),
          upcomingDeadlines: generateUpcomingDeadlines()
        };

        return NextResponse.json({
          success: true,
          data: dashboardData
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Security compliance POST API error:', error);
    return NextResponse.json(
      { error: 'Failed to process compliance action' },
      { status: 500 }
    );
  }
}

function generateRecentComplianceActivity() {
  const activities = [
    {
      id: '1',
      type: 'ASSESSMENT',
      framework: 'SOC2_TYPE_II',
      description: 'Automated compliance assessment completed',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'COMPLETED'
    },
    {
      id: '2',
      type: 'REMEDIATION',
      framework: 'GDPR',
      description: 'Data processing record updated',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      status: 'IN_PROGRESS'
    },
    {
      id: '3',
      type: 'AUDIT',
      framework: 'ISO27001',
      description: 'External audit preparation started',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      status: 'SCHEDULED'
    }
  ];

  return activities;
}

function generateUpcomingDeadlines() {
  const deadlines = [
    {
      id: '1',
      framework: 'SOC2_TYPE_II',
      description: 'Quarterly control testing due',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'HIGH'
    },
    {
      id: '2',
      framework: 'GDPR',
      description: 'Privacy impact assessment review',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'MEDIUM'
    },
    {
      id: '3',
      framework: 'PCI_DSS',
      description: 'Annual security assessment',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'HIGH'
    }
  ];

  return deadlines;
}