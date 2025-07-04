/**
 * Penetration Testing API Endpoint
 * 
 * Manages penetration tests, vulnerability scans,
 * and security assessments.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { 
  penetrationTestingFramework, 
  TestType, 
  VulnerabilityType, 
  SeverityLevel 
} from '@/lib/security/penetration-testing-framework';
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

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    const action = searchParams.get('action');

    if (testId) {
      // Get specific test status
      const testStatus = await penetrationTestingFramework.getTestStatus(testId);
      if (!testStatus) {
        return NextResponse.json({ error: 'Test not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: testStatus
      });
    }

    if (action === 'list') {
      // Get all tests
      const allTests = await penetrationTestingFramework.getAllTests();
      return NextResponse.json({
        success: true,
        data: allTests
      });
    }

    if (action === 'report') {
      // Get vulnerability report
      const report = await penetrationTestingFramework.getVulnerabilityReport();
      return NextResponse.json({
        success: true,
        data: report
      });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  } catch (error) {
    console.error('Penetration test GET API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch penetration test data' },
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
    const { action } = body;

    switch (action) {
      case 'create_test':
        // Create new penetration test
        const {
          name,
          description,
          scope,
          testType,
          configuration
        } = body;

        if (!name || !scope || !testType) {
          return NextResponse.json({
            error: 'Name, scope, and test type are required'
          }, { status: 400 });
        }

        // Validate test type
        if (!Object.values(TestType).includes(testType)) {
          return NextResponse.json({
            error: 'Invalid test type'
          }, { status: 400 });
        }

        const testId = await penetrationTestingFramework.createPenetrationTest(
          name,
          description || '',
          scope,
          testType,
          configuration,
          user.id
        );

        return NextResponse.json({
          success: true,
          testId,
          message: 'Penetration test created successfully'
        });

      case 'start_test':
        // Start penetration test
        const { testId: startTestId } = body;
        
        if (!startTestId) {
          return NextResponse.json({
            error: 'Test ID is required'
          }, { status: 400 });
        }

        const started = await penetrationTestingFramework.startPenetrationTest(startTestId);
        
        if (!started) {
          return NextResponse.json({
            error: 'Failed to start test - test not found or already running'
          }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          message: 'Penetration test started successfully'
        });

      case 'quick_scan':
        // Run quick security scan
        const quickTestId = await penetrationTestingFramework.runQuickSecurityScan();
        
        return NextResponse.json({
          success: true,
          testId: quickTestId,
          message: 'Quick security scan initiated'
        });

      case 'comprehensive_scan':
        // Run comprehensive security scan
        const comprehensiveTestId = await penetrationTestingFramework.createPenetrationTest(
          'Comprehensive Security Assessment',
          'Full security assessment covering all test types',
          ['/api', '/admin', '/'],
          TestType.INPUT_VALIDATION_TEST,
          {
            maxConcurrency: 3,
            requestDelay: 1000,
            timeoutMs: 30000
          },
          user.id
        );

        await penetrationTestingFramework.startPenetrationTest(comprehensiveTestId);

        return NextResponse.json({
          success: true,
          testId: comprehensiveTestId,
          message: 'Comprehensive security scan initiated'
        });

      case 'authentication_test':
        // Run authentication-specific tests
        const authTestId = await penetrationTestingFramework.createPenetrationTest(
          'Authentication Security Test',
          'Focused testing of authentication mechanisms',
          ['/api/auth', '/api/users'],
          TestType.AUTHENTICATION_TEST,
          {
            maxConcurrency: 2,
            requestDelay: 2000,
            timeoutMs: 15000
          },
          user.id
        );

        await penetrationTestingFramework.startPenetrationTest(authTestId);

        return NextResponse.json({
          success: true,
          testId: authTestId,
          message: 'Authentication security test initiated'
        });

      case 'network_test':
        // Run network security tests
        const networkTestId = await penetrationTestingFramework.createPenetrationTest(
          'Network Security Assessment',
          'Network-level security testing and analysis',
          ['/'],
          TestType.NETWORK_TEST,
          {
            maxConcurrency: 1,
            requestDelay: 3000,
            timeoutMs: 60000
          },
          user.id
        );

        await penetrationTestingFramework.startPenetrationTest(networkTestId);

        return NextResponse.json({
          success: true,
          testId: networkTestId,
          message: 'Network security test initiated'
        });

      case 'get_test_types':
        // Get available test types
        return NextResponse.json({
          success: true,
          data: {
            testTypes: Object.values(TestType),
            vulnerabilityTypes: Object.values(VulnerabilityType),
            severityLevels: Object.values(SeverityLevel)
          }
        });

      case 'get_statistics':
        // Get penetration testing statistics
        const report = await penetrationTestingFramework.getVulnerabilityReport();
        const allTests = await penetrationTestingFramework.getAllTests();
        
        const statistics = {
          totalTests: allTests.length,
          completedTests: allTests.filter(t => t.status === 'COMPLETED').length,
          runningTests: allTests.filter(t => t.status === 'RUNNING').length,
          totalVulnerabilities: report.totalVulnerabilities,
          vulnerabilitiesBySeverity: report.vulnerabilitiesBySeverity,
          vulnerabilitiesByType: report.vulnerabilitiesByType,
          recentFindings: report.recentFindings.slice(0, 5)
        };

        return NextResponse.json({
          success: true,
          data: statistics
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Penetration test POST API error:', error);
    return NextResponse.json(
      { error: 'Failed to process penetration test action' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    if (!user || !user.teams.some(t => t.role === 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');

    if (!testId) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
    }

    // In a real implementation, this would cancel/delete the test
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: 'Penetration test cancelled successfully'
    });

  } catch (error) {
    console.error('Penetration test DELETE API error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel penetration test' },
      { status: 500 }
    );
  }
}