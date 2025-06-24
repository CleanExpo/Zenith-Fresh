import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { emailAutomation } from '@/lib/email/email-automation';

const triggerSequenceSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  sequence: z.enum(['onboarding', 'reengagement', 'upgrade']),
  website: z.string().url().optional(),
  healthScore: z.number().min(0).max(100).optional(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = triggerSequenceSchema.parse(body);

    const { userId, email, sequence, website, healthScore, metadata } = validatedData;

    switch (sequence) {
      case 'onboarding':
        if (!website || !healthScore) {
          return NextResponse.json(
            { error: 'Website and healthScore are required for onboarding sequence' },
            { status: 400 }
          );
        }
        await emailAutomation.triggerOnboardingSequence(userId, email, website, healthScore);
        break;

      case 'reengagement':
        // Trigger re-engagement email for inactive users
        await emailAutomation.scheduleEmail(
          userId,
          'inactive_user',
          {
            first_name: email.split('@')[0],
            website: website || 'your website',
            days_inactive: metadata?.daysInactive || 7,
            dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
          },
          0 // Send immediately
        );
        break;

      case 'upgrade':
        // Trigger upgrade email sequence
        await emailAutomation.scheduleEmail(
          userId,
          'day21_upgrade',
          {
            first_name: email.split('@')[0],
            website: website || 'your website',
            dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
            upgrade_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade`,
          },
          0 // Send immediately
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid sequence type' },
          { status: 400 }
        );
    }

    return NextResponse.json(
      { 
        message: `${sequence} email sequence triggered successfully`,
        userId,
        email,
        sequence
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Email sequence trigger error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to trigger email sequence' },
      { status: 500 }
    );
  }
}