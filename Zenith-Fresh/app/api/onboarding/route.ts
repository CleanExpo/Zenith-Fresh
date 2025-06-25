import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const onboarding = await prisma.userOnboarding.findUnique({
      where: {
        userId: session.user.id
      },
      include: {
        tourSteps: {
          orderBy: {
            stepNumber: 'asc'
          }
        }
      }
    });

    if (!onboarding) {
      return NextResponse.json({ 
        currentStep: 0,
        totalSteps: 5,
        completedSteps: [],
        skippedSteps: [],
        isCompleted: false,
        hasCreatedProject: false,
        hasRunFirstScan: false,
        hasInvitedTeamMember: false,
        hasCustomizedDashboard: false,
        hasSetupNotifications: false
      });
    }

    // Parse JSON fields safely
    const completedSteps = Array.isArray(onboarding.completedSteps) 
      ? onboarding.completedSteps as string[]
      : [];
    const skippedSteps = Array.isArray(onboarding.skippedSteps) 
      ? onboarding.skippedSteps as string[]
      : [];

    return NextResponse.json({
      currentStep: onboarding.currentStep,
      totalSteps: onboarding.totalSteps,
      completedSteps,
      skippedSteps,
      isCompleted: onboarding.isCompleted,
      hasCreatedProject: onboarding.hasCreatedProject,
      hasRunFirstScan: onboarding.hasRunFirstScan,
      hasInvitedTeamMember: onboarding.hasInvitedTeamMember,
      hasCustomizedDashboard: onboarding.hasCustomizedDashboard,
      hasSetupNotifications: onboarding.hasSetupNotifications
    });

  } catch (error) {
    console.error('Error fetching onboarding data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch onboarding data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      currentStep,
      completedSteps,
      skippedSteps,
      isCompleted,
      hasCreatedProject,
      hasRunFirstScan,
      hasInvitedTeamMember,
      hasCustomizedDashboard,
      hasSetupNotifications,
      timeSpentOnSteps,
      lastActiveStep,
      preferredTourType
    } = body;

    // Update or create onboarding record
    const onboarding = await prisma.userOnboarding.upsert({
      where: {
        userId: session.user.id
      },
      update: {
        currentStep,
        completedSteps: completedSteps || [],
        skippedSteps: skippedSteps || [],
        isCompleted: isCompleted || false,
        hasCreatedProject: hasCreatedProject || false,
        hasRunFirstScan: hasRunFirstScan || false,
        hasInvitedTeamMember: hasInvitedTeamMember || false,
        hasCustomizedDashboard: hasCustomizedDashboard || false,
        hasSetupNotifications: hasSetupNotifications || false,
        timeSpentOnSteps: timeSpentOnSteps || {},
        lastActiveStep,
        preferredTourType,
        completedAt: isCompleted ? new Date() : null,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        currentStep: currentStep || 0,
        totalSteps: 5,
        completedSteps: completedSteps || [],
        skippedSteps: skippedSteps || [],
        isCompleted: isCompleted || false,
        hasCreatedProject: hasCreatedProject || false,
        hasRunFirstScan: hasRunFirstScan || false,
        hasInvitedTeamMember: hasInvitedTeamMember || false,
        hasCustomizedDashboard: hasCustomizedDashboard || false,
        hasSetupNotifications: hasSetupNotifications || false,
        timeSpentOnSteps: timeSpentOnSteps || {},
        lastActiveStep,
        preferredTourType
      }
    });

    // If onboarding is completed, trigger welcome email and calculate time-to-value
    if (isCompleted && !onboarding.isCompleted) {
      try {
        // Calculate time to complete onboarding
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { createdAt: true }
        });

        if (user) {
          const timeToComplete = Math.floor(
            (new Date().getTime() - user.createdAt.getTime()) / (1000 * 60)
          ); // minutes

          // Record time-to-value metric
          await prisma.userSuccessMetric.create({
            data: {
              userId: session.user.id,
              metricType: 'time-to-value',
              metricName: 'onboarding-completion',
              value: timeToComplete,
              unit: 'minutes',
              category: 'onboarding',
              milestone: 'onboarding-complete'
            }
          });
        }

        // Trigger welcome completion email (you would implement this)
        // await sendOnboardingCompletionEmail(session.user);

      } catch (error) {
        console.error('Error handling onboarding completion:', error);
        // Don't fail the main request if this fails
      }
    }

    return NextResponse.json({ success: true, onboarding });

  } catch (error) {
    console.error('Error saving onboarding data:', error);
    return NextResponse.json(
      { error: 'Failed to save onboarding data' },
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
    const { stepId, action, timeSpent } = body;

    // Record step interaction
    const onboarding = await prisma.userOnboarding.findUnique({
      where: { userId: session.user.id }
    });

    if (!onboarding) {
      return NextResponse.json({ error: 'Onboarding not found' }, { status: 404 });
    }

    // Create or update tour step record
    await prisma.onboardingTourStep.upsert({
      where: {
        onboardingId_stepId: {
          onboardingId: onboarding.id,
          stepId: stepId
        }
      },
      update: {
        isCompleted: action === 'complete',
        isSkipped: action === 'skip',
        completedAt: action === 'complete' ? new Date() : null,
        timeSpent: timeSpent || null
      },
      create: {
        onboardingId: onboarding.id,
        stepNumber: onboarding.currentStep,
        stepId: stepId,
        title: stepId.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        description: `Onboarding step: ${stepId}`,
        isCompleted: action === 'complete',
        isSkipped: action === 'skip',
        completedAt: action === 'complete' ? new Date() : null,
        timeSpent: timeSpent || null
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating onboarding step:', error);
    return NextResponse.json(
      { error: 'Failed to update onboarding step' },
      { status: 500 }
    );
  }
}