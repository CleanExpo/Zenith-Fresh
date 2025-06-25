/**
 * Zero Trust Security API Endpoint
 * 
 * Provides zero trust architecture data, access control
 * information, and policy management capabilities.
 */

import { NextRequest, NextResponse } from 'next/server';
import { zeroTrustEngine, TrustLevel, ResourceSensitivity } from '@/lib/security/zero-trust-architecture';
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

    // Get zero trust status
    const zeroTrustStatus = await zeroTrustEngine.getZeroTrustStatus();

    return NextResponse.json({
      success: true,
      data: zeroTrustStatus
    });

  } catch (error) {
    console.error('Zero trust API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch zero trust data' },
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
      case 'evaluate_access':
        // Evaluate access request
        const { resource, actionType, deviceInfo, networkInfo } = body;
        
        if (!resource || !actionType) {
          return NextResponse.json({ 
            error: 'Resource and action are required' 
          }, { status: 400 });
        }

        const accessRequest = await zeroTrustEngine.evaluateAccess(
          user.id,
          resource,
          actionType,
          deviceInfo || {},
          networkInfo || { sourceIP: '127.0.0.1' }
        );

        return NextResponse.json({
          success: true,
          data: accessRequest
        });

      case 'create_microsegment':
        // Create micro-segment
        const { 
          name, 
          description, 
          resources, 
          sensitivity, 
          requiredTrustLevel 
        } = body;
        
        if (!name || !resources) {
          return NextResponse.json({ 
            error: 'Name and resources are required' 
          }, { status: 400 });
        }

        const segmentId = await zeroTrustEngine.createMicroSegment(
          name,
          description || '',
          resources,
          sensitivity || ResourceSensitivity.INTERNAL,
          requiredTrustLevel || TrustLevel.MEDIUM
        );

        return NextResponse.json({
          success: true,
          segmentId,
          message: 'Micro-segment created successfully'
        });

      case 'continuous_verification':
        // Perform continuous verification
        const { sessionId } = body;
        
        if (!sessionId) {
          return NextResponse.json({ 
            error: 'Session ID is required' 
          }, { status: 400 });
        }

        const verificationResult = await zeroTrustEngine.performContinuousVerification(sessionId);

        return NextResponse.json({
          success: true,
          data: verificationResult
        });

      case 'get_status':
        // Get zero trust status
        const status = await zeroTrustEngine.getZeroTrustStatus();
        
        return NextResponse.json({
          success: true,
          data: status
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Zero trust POST API error:', error);
    return NextResponse.json(
      { error: 'Failed to process zero trust action' },
      { status: 500 }
    );
  }
}