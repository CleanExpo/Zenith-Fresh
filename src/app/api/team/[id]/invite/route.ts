import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/middleware/auth';
import { sendEmail } from '@/utils/email';
import { generateToken } from '@/lib/token';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await auth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, role } = await request.json();
    const teamId = params.id;

    // Verify team exists and user has permission
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user is already a member
    const existingMember = team.members.find(m => m.email === email);
    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
    }

    // Generate invitation token
    const token = await generateToken();

    // Create invitation
    const invitation = await prisma.teamInvitation.create({
      data: {
        teamId,
        email,
        role,
        token,
        invitedById: user.id
      }
    });

    // Send invitation email
    const teamName = team.name;
    const inviterName = user.name;
    const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/team/join?token=${token}`;

    const data = {
      teamName,
      inviterName,
      role,
      acceptUrl
    };

    await sendEmail({
      to: email,
      subject: 'Team Invitation',
      template: 'team-invitation',
      data
    });

    return NextResponse.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('Team invitation error:', error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
} 