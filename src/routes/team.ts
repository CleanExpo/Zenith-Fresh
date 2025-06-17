import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';
import { cache } from '../middleware/cache';
import { hasRole } from '../middleware/roles';
import { createAuditLog } from './audit';
import crypto from 'crypto';
import { sendEmail } from '../utils/email';

const router = Router();
const prisma = new PrismaClient();

// Create team
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user!.id;

    const team = await prisma.team.create({
      data: {
        name,
        description,
        members: {
          create: {
            userId,
            role: 'ADMIN'
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
                email: true
              }
            }
          }
        }
      }
    });

    await createAuditLog({
      action: 'create',
      entityType: 'team',
      entityId: team.id,
      newValue: team,
      userId
    });

    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's teams
router.get('/', auth, cache(300), async (req, res) => {
  try {
    const userId = req.user!.id;

    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId
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
                email: true
              }
            }
          }
        },
        projects: true
      }
    });

    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get team details
router.get('/:id', auth, cache(300), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const team = await prisma.team.findFirst({
      where: {
        id,
        members: {
          some: {
            userId
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
                email: true
              }
            }
          }
        },
        projects: true,
        invitations: {
          where: {
            status: 'pending'
          }
        }
      }
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update team
router.patch('/:id', auth, hasRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user!.id;

    const oldTeam = await prisma.team.findUnique({
      where: { id }
    });

    const team = await prisma.team.update({
      where: { id },
      data: {
        name,
        description
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    await createAuditLog({
      action: 'update',
      entityType: 'team',
      entityId: team.id,
      oldValue: oldTeam,
      newValue: team,
      userId
    });

    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Invite team member
router.post('/:id/invite', auth, hasRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;
    const userId = req.user!.id;

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invitation = await prisma.teamInvitation.create({
      data: {
        email,
        role,
        token,
        expiresAt,
        teamId: id,
        invitedBy: userId
      }
    });

    // Send invitation email
    await sendEmail({
      to: email,
      subject: 'Team Invitation',
      template: 'team-invitation',
      data: {
        teamName: (await prisma.team.findUnique({ where: { id } }))!.name,
        inviterName: (await prisma.user.findUnique({ where: { id: userId } }))!.name,
        role,
        acceptUrl: `${process.env.FRONTEND_URL}/teams/join/${token}`
      }
    });

    await createAuditLog({
      action: 'invite',
      entityType: 'team',
      entityId: id,
      newValue: invitation,
      userId
    });

    res.json(invitation);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept team invitation
router.post('/join/:token', auth, async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.user!.id;

    const invitation = await prisma.teamInvitation.findUnique({
      where: { token }
    });

    if (!invitation || invitation.status !== 'pending' || invitation.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }

    const [teamMember, updatedInvitation] = await prisma.$transaction([
      prisma.teamMember.create({
        data: {
          userId,
          teamId: invitation.teamId,
          role: invitation.role
        },
        include: {
          team: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'accepted',
          acceptedBy: userId
        }
      })
    ]);

    await createAuditLog({
      action: 'accept_invitation',
      entityType: 'team',
      entityId: invitation.teamId,
      newValue: teamMember,
      userId
    });

    res.json(teamMember);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove team member
router.delete('/:teamId/members/:userId', auth, hasRole(['ADMIN']), async (req, res) => {
  try {
    const { teamId, userId } = req.params;
    const adminId = req.user!.id;

    const member = await prisma.teamMember.delete({
      where: {
        userId_teamId: {
          userId,
          teamId
        }
      }
    });

    await createAuditLog({
      action: 'remove_member',
      entityType: 'team',
      entityId: teamId,
      oldValue: member,
      userId: adminId
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 