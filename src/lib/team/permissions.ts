import { prisma } from '@/lib/prisma';

export type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type Permission = 'read' | 'write' | 'admin' | 'owner';

export interface PermissionResult {
  success: boolean;
  role?: TeamRole;
  error?: string;
  status?: number;
}

/**
 * Role hierarchy and permissions
 * OWNER: Full control - can delete team, manage all settings, billing
 * ADMIN: Can manage members, settings, projects (cannot delete team or change billing)
 * MEMBER: Can create and edit projects, view team analytics
 * VIEWER: Read-only access to team content
 */
const ROLE_PERMISSIONS: Record<TeamRole, Permission[]> = {
  OWNER: ['read', 'write', 'admin', 'owner'],
  ADMIN: ['read', 'write', 'admin'],
  MEMBER: ['read', 'write'],
  VIEWER: ['read']
};

/**
 * Check if a user has the required permission for a team
 */
export async function checkTeamPermission(
  userEmail: string,
  teamId: string,
  requiredPermission: Permission
): Promise<PermissionResult> {
  try {
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        user: {
          email: userEmail
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        },
        team: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!teamMember) {
      return {
        success: false,
        error: 'You are not a member of this team',
        status: 403
      };
    }

    const userRole = teamMember.role as TeamRole;
    const userPermissions = ROLE_PERMISSIONS[userRole];

    if (!userPermissions.includes(requiredPermission)) {
      return {
        success: false,
        error: `Insufficient permissions. Required: ${requiredPermission}, Your role: ${userRole}`,
        status: 403
      };
    }

    return {
      success: true,
      role: userRole
    };
  } catch (error) {
    console.error('Permission check error:', error);
    return {
      success: false,
      error: 'Failed to check permissions',
      status: 500
    };
  }
}

/**
 * Check if a user can perform an action on another team member
 */
export async function checkMemberPermission(
  userEmail: string,
  teamId: string,
  targetMemberId: string,
  action: 'remove' | 'update_role'
): Promise<PermissionResult> {
  try {
    const [currentUser, targetMember] = await Promise.all([
      prisma.teamMember.findFirst({
        where: {
          teamId,
          user: { email: userEmail }
        }
      }),
      prisma.teamMember.findUnique({
        where: { id: targetMemberId }
      })
    ]);

    if (!currentUser) {
      return {
        success: false,
        error: 'You are not a member of this team',
        status: 403
      };
    }

    if (!targetMember) {
      return {
        success: false,
        error: 'Target member not found',
        status: 404
      };
    }

    const currentRole = currentUser.role as TeamRole;
    const targetRole = targetMember.role as TeamRole;

    // Only owners can remove other owners
    if (targetRole === 'OWNER' && currentRole !== 'OWNER') {
      return {
        success: false,
        error: 'Only owners can manage other owners',
        status: 403
      };
    }

    // Admins and owners can manage members and viewers
    if (currentRole === 'ADMIN' || currentRole === 'OWNER') {
      if (targetRole === 'MEMBER' || targetRole === 'VIEWER') {
        return { success: true, role: currentRole };
      }
    }

    // Only owners can manage admins
    if (targetRole === 'ADMIN' && currentRole !== 'OWNER') {
      return {
        success: false,
        error: 'Only owners can manage admins',
        status: 403
      };
    }

    // Users cannot manage themselves (except owners)
    if (currentUser.userId === targetMember.userId && action === 'remove') {
      if (currentRole === 'OWNER') {
        // Check if there are other owners
        const ownerCount = await prisma.teamMember.count({
          where: {
            teamId,
            role: 'OWNER'
          }
        });

        if (ownerCount <= 1) {
          return {
            success: false,
            error: 'Cannot remove the last owner. Transfer ownership first.',
            status: 400
          };
        }
      }
      return { success: true, role: currentRole };
    }

    return { success: true, role: currentRole };
  } catch (error) {
    console.error('Member permission check error:', error);
    return {
      success: false,
      error: 'Failed to check member permissions',
      status: 500
    };
  }
}

/**
 * Get available roles that a user can assign based on their role
 */
export function getAssignableRoles(userRole: TeamRole): TeamRole[] {
  switch (userRole) {
    case 'OWNER':
      return ['ADMIN', 'MEMBER', 'VIEWER'];
    case 'ADMIN':
      return ['MEMBER', 'VIEWER'];
    default:
      return [];
  }
}

/**
 * Check if a role transition is valid
 */
export function isValidRoleTransition(
  fromRole: TeamRole,
  toRole: TeamRole,
  userRole: TeamRole
): boolean {
  // Owners can change any role except owner to owner (need special transfer process)
  if (userRole === 'OWNER') {
    if (toRole === 'OWNER') return false; // Use ownership transfer instead
    return true;
  }

  // Admins can only manage members and viewers
  if (userRole === 'ADMIN') {
    if (fromRole === 'OWNER' || fromRole === 'ADMIN') return false;
    if (toRole === 'OWNER' || toRole === 'ADMIN') return false;
    return true;
  }

  return false;
}

/**
 * Get team role hierarchy level (higher number = more permissions)
 */
export function getRoleLevel(role: TeamRole): number {
  switch (role) {
    case 'OWNER': return 4;
    case 'ADMIN': return 3;
    case 'MEMBER': return 2;
    case 'VIEWER': return 1;
    default: return 0;
  }
}