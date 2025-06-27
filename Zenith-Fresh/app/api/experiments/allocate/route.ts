/**
 * Experiment Allocation API
 * Allocate users to experiment variants
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '../../../../lib/prisma';
import { ExperimentService } from '../../../../lib/services/experiment-service';
import {
  AllocateUserRequest,
  AllocationError,
  ExperimentError,
  UserContext
} from '../../../../types/ab-testing';

const experimentService = new ExperimentService(prisma);

/**
 * POST /api/experiments/allocate
 * Allocate user to experiment variant
 */
export async function POST(request: NextRequest) {
  try {
    const body: AllocateUserRequest = await request.json();
    const { experimentId, userContext, forceVariant } = body;

    if (!experimentId) {
      return NextResponse.json(
        { error: 'Experiment ID is required' },
        { status: 400 }
      );
    }

    if (!userContext) {
      return NextResponse.json(
        { error: 'User context is required' },
        { status: 400 }
      );
    }

    // Enhance user context with session data if available
    const session = await getServerSession(authOptions);
    const enhancedUserContext: UserContext = {
      ...userContext,
      userId: userContext.userId || session?.user?.id,
      // Add any additional context from headers
      userAgent: userContext.userAgent || request.headers.get('user-agent') || undefined,
      ipAddress: userContext.ipAddress || getClientIP(request),
      platform: userContext.platform || 'web'
    };

    // Allocate user to variant
    const allocation = await experimentService.allocateUser(
      experimentId,
      enhancedUserContext,
      forceVariant
    );

    return NextResponse.json(allocation);

  } catch (error) {
    console.error('Error allocating user to experiment:', error);

    if (error instanceof AllocationError) {
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code,
          details: error.details
        },
        { status: 400 }
      );
    }

    if (error instanceof ExperimentError) {
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code,
          details: error.details
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to allocate user to experiment' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/experiments/allocate?userId=[id]&sessionId=[id]
 * Get user's current experiment allocations
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'Either userId or sessionId is required' },
        { status: 400 }
      );
    }

    // Enhance user context
    const session = await getServerSession(authOptions);
    const userContext: UserContext = {
      userId: userId || session?.user?.id,
      sessionId: sessionId || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: getClientIP(request),
      platform: 'web'
    };

    // Get user's allocations
    const allocations = await experimentService.getUserAllocations(userContext);

    // Format response
    const formattedAllocations = allocations.map(allocation => ({
      experimentId: allocation.experimentId,
      experimentName: allocation.experiment.name,
      variantId: allocation.variantId,
      variantName: allocation.variant.name,
      allocationId: allocation.id,
      configuration: allocation.variant.configuration,
      featureFlags: allocation.variant.featureFlags,
      firstExposure: allocation.firstExposure,
      lastExposure: allocation.lastExposure,
      exposureCount: allocation.exposureCount
    }));

    return NextResponse.json({
      allocations: formattedAllocations,
      count: formattedAllocations.length
    });

  } catch (error) {
    console.error('Error fetching user allocations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user allocations' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/experiments/allocate
 * Remove user from experiment
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const experimentId = searchParams.get('experimentId');
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    if (!experimentId) {
      return NextResponse.json(
        { error: 'Experiment ID is required' },
        { status: 400 }
      );
    }

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'Either userId or sessionId is required' },
        { status: 400 }
      );
    }

    // Check authorization - only allow users to remove themselves or admins
    const session = await getServerSession(authOptions);
    if (userId && userId !== session?.user?.id) {
      // Check if user is admin or experiment owner
      const experiment = await prisma.experiment.findUnique({
        where: { id: experimentId },
        select: { createdBy: true }
      });

      if (!experiment || experiment.createdBy !== session?.user?.id) {
        return NextResponse.json(
          { error: 'Unauthorized to remove this user from experiment' },
          { status: 403 }
        );
      }
    }

    const userContext: UserContext = {
      userId: userId || session?.user?.id,
      sessionId: sessionId || undefined
    };

    await experimentService.removeUserFromExperiment(experimentId, userContext);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error removing user from experiment:', error);
    return NextResponse.json(
      { error: 'Failed to remove user from experiment' },
      { status: 500 }
    );
  }
}

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (clientIP) {
    return clientIP;
  }
  
  // Fallback to connection remote address
  return request.ip || 'unknown';
}