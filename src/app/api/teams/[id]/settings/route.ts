import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkTeamPermission } from '@/lib/team/permissions';
import { AuditLogger, AuditEventType, AuditEntityType } from '@/lib/audit/audit-logger';
import * as Sentry from '@sentry/nextjs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = params.id;
    const hasPermission = await checkTeamPermission(session.user.email, teamId, 'read');
    
    if (!hasPermission.success) {
      return NextResponse.json({ error: hasPermission.error }, { status: hasPermission.status });
    }

    const settings = await prisma.teamSettings.findUnique({
      where: { teamId },
      include: {
        notifications: true,
        integrations: true
      }
    });

    if (!settings) {
      // Create default settings if they don't exist
      const defaultSettings = await prisma.teamSettings.create({
        data: {
          teamId,
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
        },
        include: {
          notifications: true,
          integrations: true
        }
      });

      return NextResponse.json({ settings: defaultSettings });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Get team settings error:', error);
    Sentry.captureException(error as Error);
    return NextResponse.json({ error: 'Failed to fetch team settings' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = params.id;
    const hasPermission = await checkTeamPermission(session.user.email, teamId, 'admin');
    
    if (!hasPermission.success) {
      return NextResponse.json({ error: hasPermission.error }, { status: hasPermission.status });
    }

    const { timezone, language, notifications, integrations } = await request.json();

    // Get old settings for audit log
    const oldSettings = await prisma.teamSettings.findUnique({
      where: { teamId },
      include: {
        notifications: true,
        integrations: true
      }
    });

    // Update team settings
    const settings = await prisma.teamSettings.upsert({
      where: { teamId },
      update: {
        timezone: timezone || undefined,
        language: language || undefined
      },
      create: {
        teamId,
        timezone: timezone || 'UTC',
        language: language || 'en'
      },
      include: {
        notifications: true,
        integrations: true
      }
    });

    // Update notifications if provided
    if (notifications) {
      await prisma.notifications.upsert({
        where: { teamSettingsId: settings.id },
        update: notifications,
        create: {
          teamSettingsId: settings.id,
          ...notifications
        }
      });
    }

    // Update integrations if provided
    if (integrations) {
      await prisma.integrations.upsert({
        where: { teamSettingsId: settings.id },
        update: integrations,
        create: {
          teamSettingsId: settings.id,
          ...integrations
        }
      });
    }

    // Fetch updated settings
    const updatedSettings = await prisma.teamSettings.findUnique({
      where: { teamId },
      include: {
        notifications: true,
        integrations: true
      }
    });

    // Log audit event
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    await AuditLogger.logUserAction(
      user?.id || '',
      AuditEventType.UPDATE,
      AuditEntityType.TEAM,
      teamId,
      {
        action: 'settings_updated',
        oldSettings: oldSettings ? {
          timezone: oldSettings.timezone,
          language: oldSettings.language,
          notifications: oldSettings.notifications,
          integrations: oldSettings.integrations
        } : null,
        newSettings: {
          timezone: updatedSettings?.timezone,
          language: updatedSettings?.language,
          notifications: updatedSettings?.notifications,
          integrations: updatedSettings?.integrations
        }
      }
    );

    return NextResponse.json({ settings: updatedSettings });
  } catch (error) {
    console.error('Update team settings error:', error);
    Sentry.captureException(error as Error);
    return NextResponse.json({ error: 'Failed to update team settings' }, { status: 500 });
  }
}