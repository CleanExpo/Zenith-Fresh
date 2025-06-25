/**
 * Security Threats API Endpoint
 * 
 * Provides threat intelligence data, active threats,
 * and security incident information.
 */

import { NextRequest, NextResponse } from 'next/server';
import { threatDetectionEngine } from '@/lib/security/advanced-threat-detection';
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

    // Get threat summary
    const threatSummary = await threatDetectionEngine.getThreatSummary();

    // Generate mock recent threats data
    const recentThreats = generateRecentThreats();

    // Generate risk trends data
    const riskTrends = generateRiskTrends();

    const threatData = {
      summary: threatSummary,
      recentThreats,
      riskTrends
    };

    return NextResponse.json({
      success: true,
      data: threatData
    });

  } catch (error) {
    console.error('Security threats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threat data' },
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
    const { action, threatId, incidentId } = body;

    switch (action) {
      case 'acknowledge_threat':
        // Acknowledge a threat
        if (!threatId) {
          return NextResponse.json({ error: 'Threat ID required' }, { status: 400 });
        }
        // In real implementation, update threat status
        return NextResponse.json({ 
          success: true, 
          message: 'Threat acknowledged' 
        });

      case 'escalate_incident':
        // Escalate a security incident
        if (!incidentId) {
          return NextResponse.json({ error: 'Incident ID required' }, { status: 400 });
        }
        // In real implementation, escalate incident
        return NextResponse.json({ 
          success: true, 
          message: 'Incident escalated' 
        });

      case 'run_threat_scan':
        // Trigger immediate threat scan
        await threatDetectionEngine.startMonitoring();
        return NextResponse.json({ 
          success: true, 
          message: 'Threat scan initiated' 
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Security threats POST API error:', error);
    return NextResponse.json(
      { error: 'Failed to process threat action' },
      { status: 500 }
    );
  }
}

function generateRecentThreats() {
  const threatTypes = [
    'SQL_INJECTION',
    'XSS_ATTEMPT',
    'BRUTE_FORCE_ATTACK',
    'PRIVILEGE_ESCALATION',
    'DATA_EXFILTRATION',
    'DDoS_ATTACK',
    'MALWARE_DETECTION',
    'ANOMALOUS_BEHAVIOR'
  ];

  const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const statuses = ['OPEN', 'INVESTIGATING', 'CONTAINED', 'RESOLVED'];

  const threats = [];
  for (let i = 0; i < 10; i++) {
    const timestamp = new Date(Date.now() - Math.random() * 86400000 * 7); // Last 7 days
    threats.push({
      id: `threat_${Date.now()}_${i}`,
      type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
      level: levels[Math.floor(Math.random() * levels.length)],
      source: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      timestamp: timestamp.toISOString(),
      status: statuses[Math.floor(Math.random() * statuses.length)]
    });
  }

  return threats.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function generateRiskTrends() {
  const trends = [];
  for (let i = 23; i >= 0; i--) {
    const date = new Date();
    date.setHours(date.getHours() - i);
    trends.push({
      timestamp: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      riskScore: Math.floor(Math.random() * 40) + 20,
      threats: Math.floor(Math.random() * 10),
      incidents: Math.floor(Math.random() * 3)
    });
  }
  return trends;
}