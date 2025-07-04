import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { emailAutomation } from '@/lib/email/email-automation';
import { trackAccountCreated } from '@/lib/analytics/conversion-tracking';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: validatedData.email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await hash(validatedData.password, 12);

    // Create the user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: 'USER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Create user preferences
    await prisma.userPreferences.create({
      data: {
        userId: user.id,
        theme: 'system',
        emailNotifications: true,
        pushNotifications: true,
      },
    });

    // Log the registration activity
    await prisma.activityLog.create({
      data: {
        action: 'user_registration',
        details: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          method: 'credentials',
        }),
        userId: user.id,
      },
    });

    // Create a welcome notification
    const welcomeMessage = validatedData.website 
      ? `Welcome to Zenith Platform, ${user.name}! Your website analysis for ${validatedData.website} is ready.`
      : `Welcome to Zenith Platform, ${user.name}! Get started by creating your first project.`;

    await prisma.notification.create({
      data: {
        type: 'welcome',
        message: welcomeMessage,
        userId: user.id,
      },
    });

    // Store website for analysis if provided
    let websiteAnalysis = null;
    if (validatedData.website) {
      // Create a mock website analysis record
      websiteAnalysis = await prisma.project.create({
        data: {
          name: `${validatedData.website} Health Analysis`,
          description: `Automated health analysis for ${validatedData.website}`,
          status: 'ACTIVE',
          userId: user.id,
        },
      });

      // Log website analysis activity
      await prisma.activityLog.create({
        data: {
          action: 'website_analysis_created',
          details: JSON.stringify({
            userId: user.id,
            website: validatedData.website,
            projectId: websiteAnalysis.id,
          }),
          userId: user.id,
          projectId: websiteAnalysis.id,
        },
      });
    }

    // Track conversion event
    await trackAccountCreated(user.id, user.email, validatedData.website);

    // Trigger onboarding email sequence
    if (validatedData.website) {
      // Generate mock health score for demo
      const healthScore = Math.floor(Math.random() * 30) + 60; // Score between 60-90
      
      try {
        await emailAutomation.triggerOnboardingSequence(
          user.id,
          user.email,
          validatedData.website,
          healthScore
        );
      } catch (emailError) {
        console.error('Failed to trigger onboarding emails:', emailError);
        // Don't fail registration if email fails
      }
    }

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        websiteAnalysis: websiteAnalysis ? {
          id: websiteAnalysis.id,
          website: validatedData.website,
          ready: true
        } : null
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    // Handle database errors
    if (error && typeof error === 'object' && 'code' in error) {
      // Prisma unique constraint error
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}