/**
 * Security Overview API Endpoint
 * 
 * Provides comprehensive security metrics and overview data
 * for the security dashboard and monitoring systems.
 */

import { NextRequest, NextResponse } from 'next/server';
import { threatDetectionEngine } from '@/lib/security/advanced-threat-detection';
import { penetrationTestingFramework } from '@/lib/security/penetration-testing-framework';
import { zeroTrustEngine } from '@/lib/security/zero-trust-architecture';
import { multiFrameworkCompliance } from '@/lib/compliance/multi-framework-compliance';
import { securitySuite } from '@/lib/security/comprehensive-security-suite';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

interface SecurityOverview {
  riskScore: number;
  activeThreats: number;
  securityIncidents: number;
  complianceScore: number;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  uptime: number;
  performanceMetrics: {
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
  lastUpdated: string;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - only allow admin/security roles
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

    // Gather security metrics from various systems
    const [
      threatSummary,
      vulnerabilityReport,
      zeroTrustStatus,
      complianceOverview,
      systemMetrics
    ] = await Promise.all([
      threatDetectionEngine.getThreatSummary(),
      penetrationTestingFramework.getVulnerabilityReport(),
      zeroTrustEngine.getZeroTrustStatus(),
      multiFrameworkCompliance.getComplianceOverview(),
      getSystemMetrics()
    ]);

    // Calculate overall risk score
    const riskScore = calculateOverallRiskScore({
      threats: threatSummary,
      vulnerabilities: vulnerabilityReport,
      compliance: complianceOverview,
      zeroTrust: zeroTrustStatus
    });

    // Calculate system uptime
    const uptime = await calculateSystemUptime();

    const overview: SecurityOverview = {
      riskScore,
      activeThreats: threatSummary.activeThreats,
      securityIncidents: threatSummary.openIncidents,
      complianceScore: complianceOverview.overallCompliance,
      vulnerabilities: {
        critical: vulnerabilityReport.vulnerabilitiesBySeverity.CRITICAL || 0,
        high: vulnerabilityReport.vulnerabilitiesBySeverity.HIGH || 0,
        medium: vulnerabilityReport.vulnerabilitiesBySeverity.MEDIUM || 0,
        low: vulnerabilityReport.vulnerabilitiesBySeverity.LOW || 0
      },
      uptime,
      performanceMetrics: systemMetrics,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: overview
    });

  } catch (error) {
    console.error('Security overview API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security overview' },
      { status: 500 }
    );
  }
}

function calculateOverallRiskScore(metrics: {
  threats: any;
  vulnerabilities: any;
  compliance: any;
  zeroTrust: any;
}): number {
  let riskScore = 0;
  
  // Threat-based risk (40% weight)
  const threatRisk = Math.min(100, (metrics.threats.activeThreats * 10) + 
    (metrics.threats.threatsByLevel.CRITICAL * 25) +
    (metrics.threats.threatsByLevel.HIGH * 15) +
    (metrics.threats.threatsByLevel.MEDIUM * 8) +
    (metrics.threats.threatsByLevel.LOW * 3));
  riskScore += threatRisk * 0.4;

  // Vulnerability-based risk (30% weight)
  const vulnRisk = Math.min(100, 
    (metrics.vulnerabilities.vulnerabilitiesBySeverity.CRITICAL * 30) +
    (metrics.vulnerabilities.vulnerabilitiesBySeverity.HIGH * 20) +
    (metrics.vulnerabilities.vulnerabilitiesBySeverity.MEDIUM * 10) +
    (metrics.vulnerabilities.vulnerabilitiesBySeverity.LOW * 5));
  riskScore += vulnRisk * 0.3;

  // Compliance-based risk (20% weight)
  const complianceRisk = 100 - metrics.compliance.overallCompliance;
  riskScore += complianceRisk * 0.2;

  // Zero trust risk (10% weight)
  const ztRisk = (metrics.zeroTrust.riskDistribution.HIGH + 
    metrics.zeroTrust.riskDistribution.CRITICAL) * 2;
  riskScore += ztRisk * 0.1;

  return Math.min(100, Math.max(0, Math.round(riskScore)));
}

async function getSystemMetrics(): Promise<{
  responseTime: number;
  errorRate: number;
  throughput: number;
}> {
  // In a real implementation, this would fetch from monitoring systems
  // For now, return simulated metrics
  return {
    responseTime: Math.floor(Math.random() * 50) + 50, // 50-100ms
    errorRate: Math.random() * 2, // 0-2%
    throughput: Math.floor(Math.random() * 500) + 1000 // 1000-1500 req/min
  };
}

async function calculateSystemUptime(): Promise<number> {
  // In a real implementation, this would calculate from actual uptime data
  // For now, return a simulated high uptime
  return Math.round((99.5 + Math.random() * 0.5) * 100) / 100; // 99.5-100%
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}