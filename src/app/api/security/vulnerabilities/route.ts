/**
 * Security Vulnerabilities API Endpoint
 * 
 * Provides vulnerability scanning results, penetration testing
 * data, and security assessment information.
 */

import { NextRequest, NextResponse } from 'next/server';
import { penetrationTestingFramework, TestType } from '@/lib/security/penetration-testing-framework';
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

    const hasSecurityAccess = user.teams.some(membership => 
      membership.role === 'admin' || 
      membership.role === 'security' ||
      membership.team.name.toLowerCase().includes('security')
    );

    if (!hasSecurityAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get vulnerability report
    const vulnerabilityReport = await penetrationTestingFramework.getVulnerabilityReport();

    return NextResponse.json({
      success: true,
      data: vulnerabilityReport
    });

  } catch (error) {
    console.error('Security vulnerabilities API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vulnerability data' },
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

    if (!user || !user.teams.some(t => t.role === 'admin' || t.role === 'security')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { action, testType, scope, configuration } = body;

    switch (action) {
      case 'run_vulnerability_scan':
        // Run a vulnerability scan
        const testId = await penetrationTestingFramework.createPenetrationTest(
          'API Triggered Vulnerability Scan',
          'Security vulnerability scan initiated via API',
          scope || ['/api'],
          testType || TestType.INPUT_VALIDATION_TEST,
          configuration,
          user.id
        );

        await penetrationTestingFramework.startPenetrationTest(testId);

        return NextResponse.json({
          success: true,
          testId,
          message: 'Vulnerability scan initiated'
        });

      case 'run_quick_scan':
        // Run quick security scan
        const quickTestId = await penetrationTestingFramework.runQuickSecurityScan();
        
        return NextResponse.json({
          success: true,
          testId: quickTestId,
          message: 'Quick security scan initiated'
        });

      case 'get_test_status':
        // Get test status
        const { testId: statusTestId } = body;
        if (!statusTestId) {
          return NextResponse.json({ error: 'Test ID required' }, { status: 400 });
        }

        const testStatus = await penetrationTestingFramework.getTestStatus(statusTestId);
        if (!testStatus) {
          return NextResponse.json({ error: 'Test not found' }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          data: testStatus
        });

      case 'get_all_tests':
        // Get all tests
        const allTests = await penetrationTestingFramework.getAllTests();
        
        return NextResponse.json({
          success: true,
          data: allTests
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Security vulnerabilities POST API error:', error);
    return NextResponse.json(
      { error: 'Failed to process vulnerability action' },
      { status: 500 }
    );
  }
}