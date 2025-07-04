import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { auditLogger } from '@/lib/audit/audit-logger';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        teams: {
          include: {
            team: {
              include: {
                members: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                      }
                    }
                  }
                },
                projects: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                    createdAt: true
                  }
                },
                analytics: true,
                settings: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const teams = user.teams.map(membership => ({
      ...membership.team,
      role: membership.role,
      joinedAt: membership.createdAt
    }));

    return NextResponse.json({ teams });
  } catch (error) {
    console.error('Get teams error:', error);
    Sentry.captureException(error as Error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create team with default settings
    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER'
          }
        },
        settings: {
          create: {
            timezone: 'UTC',
            language: 'en',
            notifications: {
              create: {
                email: true,
                slack: false,
                discord: false
              }
            },
            integrations: {
              create: {
                slack: false,
                discord: false,
                github: false
              }
            }
          }
        },
        analytics: {
          create: {
            totalRequests: 0,
            totalTokens: 0,
            growthRate: 0
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        settings: {
          include: {
            notifications: true,
            integrations: true
          }
        },
        analytics: true
      }
    });

    // Log team creation
    await auditLogger.log({
      action: 'team_created',
      resource: 'team',
      resourceId: team.id,
      userId: user.id,
      metadata: {
        teamName: team.name,
        description: team.description
      }
    });

    return NextResponse.json({ 
      team: {
        ...team,
        role: 'OWNER',
        joinedAt: team.createdAt
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Create team error:', error);
    Sentry.captureException(error as Error);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}