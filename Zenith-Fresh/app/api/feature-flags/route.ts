import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FEATURE_FLAGS, getEnabledFeatures } from '@/lib/feature-flags';

/**
 * GET /api/feature-flags
 * Get enabled feature flags for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const enabledFeatures = getEnabledFeatures(
      session?.user?.email,
      session?.user?.id
    );

    // Return feature flag status
    const flagStatus: Record<string, boolean> = {};
    Object.keys(FEATURE_FLAGS).forEach((flag) => {
      flagStatus[flag] = enabledFeatures.includes(flag);
    });

    return NextResponse.json({
      flags: flagStatus,
      user: session?.user?.email || 'anonymous',
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error('Feature flags error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature flags' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/feature-flags
 * Admin endpoint to update feature flags (requires admin role)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin (implement your own admin check)
    if (!session?.user?.email?.includes('admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, feature, value } = body;

    // Handle different admin actions
    switch (action) {
      case 'toggle':
        // Toggle feature on/off
        if (FEATURE_FLAGS[feature]) {
          FEATURE_FLAGS[feature].enabled = value;
        }
        break;
        
      case 'rollout':
        // Update rollout percentage
        if (FEATURE_FLAGS[feature] && typeof value === 'number') {
          FEATURE_FLAGS[feature].rolloutPercentage = value;
        }
        break;
        
      case 'allowUser':
        // Add user to allowed list
        if (FEATURE_FLAGS[feature] && typeof value === 'string') {
          if (!FEATURE_FLAGS[feature].allowedUsers) {
            FEATURE_FLAGS[feature].allowedUsers = [];
          }
          FEATURE_FLAGS[feature].allowedUsers!.push(value);
        }
        break;
    }

    return NextResponse.json({
      success: true,
      feature,
      action,
      value,
    });
  } catch (error) {
    console.error('Feature flag update error:', error);
    return NextResponse.json(
      { error: 'Failed to update feature flags' },
      { status: 500 }
    );
  }
}