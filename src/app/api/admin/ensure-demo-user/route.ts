import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// Skip CSRF for admin operations
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const demoEmail = 'zenithfresh25@gmail.com';
    const demoPassword = 'F^bf35(llm1120!2a';

    // Check if demo user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: demoEmail },
    });

    if (existingUser) {
      return NextResponse.json({ 
        message: 'Demo user already exists',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
        }
      });
    }

    // Create demo user
    const hashedPassword = await hash(demoPassword, 12);
    
    const user = await prisma.user.create({
      data: {
        name: 'Demo Admin User',
        email: demoEmail,
        password: hashedPassword,
        role: 'ADMIN',
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

    // Log the creation
    await prisma.activityLog.create({
      data: {
        action: 'demo_user_created',
        details: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          role: user.role,
        }),
        userId: user.id,
      },
    });

    return NextResponse.json({
      message: 'Demo user created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating demo user:', error);
    return NextResponse.json(
      { error: 'Failed to create demo user' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const demoEmail = 'zenithfresh25@gmail.com';
    
    const user = await prisma.user.findUnique({
      where: { email: demoEmail },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ 
        exists: false,
        message: 'Demo user does not exist' 
      });
    }

    return NextResponse.json({
      exists: true,
      message: 'Demo user exists',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      }
    });

  } catch (error) {
    console.error('Error checking demo user:', error);
    return NextResponse.json(
      { error: 'Failed to check demo user' },
      { status: 500 }
    );
  }
}