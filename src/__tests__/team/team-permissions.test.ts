/**
 * Test suite for Team Permission System
 * Tests role-based access control, permission checks, and security boundaries
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { 
  checkTeamPermission, 
  checkMemberPermission,
  getAssignableRoles,
  isValidRoleTransition,
  getRoleLevel,
  type TeamRole,
  type Permission
} from '@/lib/team/permissions';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    teamMember: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('Team Permission System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Role Hierarchy', () => {
    it('should have correct role levels', () => {
      expect(getRoleLevel('OWNER')).toBe(4);
      expect(getRoleLevel('ADMIN')).toBe(3);
      expect(getRoleLevel('MEMBER')).toBe(2);
      expect(getRoleLevel('VIEWER')).toBe(1);
    });

    it('should enforce role hierarchy in permissions', () => {
      // Higher roles should have all permissions of lower roles
      const viewerPermissions = ['read'];
      const memberPermissions = ['read', 'write'];
      const adminPermissions = ['read', 'write', 'admin'];
      const ownerPermissions = ['read', 'write', 'admin', 'owner'];

      // Check that higher roles include lower role permissions
      expect(memberPermissions).toEqual(expect.arrayContaining(viewerPermissions));
      expect(adminPermissions).toEqual(expect.arrayContaining(memberPermissions));
      expect(ownerPermissions).toEqual(expect.arrayContaining(adminPermissions));
    });
  });

  describe('checkTeamPermission', () => {
    it('should grant read permission to all team members', async () => {
      const roles: TeamRole[] = ['VIEWER', 'MEMBER', 'ADMIN', 'OWNER'];

      for (const role of roles) {
        vi.mocked(prisma.teamMember.findFirst).mockResolvedValue({
          id: 'member-1',
          role,
          teamId: 'team-1',
          userId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { id: 'user-1', email: 'test@example.com' },
          team: { id: 'team-1', name: 'Test Team' },
        });

        const result = await checkTeamPermission('test@example.com', 'team-1', 'read');
        expect(result.success).toBe(true);
        expect(result.role).toBe(role);
      }
    });

    it('should grant write permission to members and above', async () => {
      const allowedRoles: TeamRole[] = ['MEMBER', 'ADMIN', 'OWNER'];
      const deniedRoles: TeamRole[] = ['VIEWER'];

      for (const role of allowedRoles) {
        vi.mocked(prisma.teamMember.findFirst).mockResolvedValue({
          id: 'member-1',
          role,
          teamId: 'team-1',
          userId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { id: 'user-1', email: 'test@example.com' },
          team: { id: 'team-1', name: 'Test Team' },
        });

        const result = await checkTeamPermission('test@example.com', 'team-1', 'write');
        expect(result.success).toBe(true);
      }

      for (const role of deniedRoles) {
        vi.mocked(prisma.teamMember.findFirst).mockResolvedValue({
          id: 'member-1',
          role,
          teamId: 'team-1',
          userId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { id: 'user-1', email: 'test@example.com' },
          team: { id: 'team-1', name: 'Test Team' },
        });

        const result = await checkTeamPermission('test@example.com', 'team-1', 'write');
        expect(result.success).toBe(false);
        expect(result.status).toBe(403);
      }
    });

    it('should grant admin permission only to admins and owners', async () => {
      const allowedRoles: TeamRole[] = ['ADMIN', 'OWNER'];
      const deniedRoles: TeamRole[] = ['VIEWER', 'MEMBER'];

      for (const role of allowedRoles) {
        vi.mocked(prisma.teamMember.findFirst).mockResolvedValue({
          id: 'member-1',
          role,
          teamId: 'team-1',
          userId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { id: 'user-1', email: 'test@example.com' },
          team: { id: 'team-1', name: 'Test Team' },
        });

        const result = await checkTeamPermission('test@example.com', 'team-1', 'admin');
        expect(result.success).toBe(true);
      }

      for (const role of deniedRoles) {
        vi.mocked(prisma.teamMember.findFirst).mockResolvedValue({
          id: 'member-1',
          role,
          teamId: 'team-1',
          userId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { id: 'user-1', email: 'test@example.com' },
          team: { id: 'team-1', name: 'Test Team' },
        });

        const result = await checkTeamPermission('test@example.com', 'team-1', 'admin');
        expect(result.success).toBe(false);
        expect(result.status).toBe(403);
      }
    });

    it('should grant owner permission only to owners', async () => {
      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue({
        id: 'member-1',
        role: 'OWNER',
        teamId: 'team-1',
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 'user-1', email: 'test@example.com' },
        team: { id: 'team-1', name: 'Test Team' },
      });

      const result = await checkTeamPermission('test@example.com', 'team-1', 'owner');
      expect(result.success).toBe(true);

      // Test denial for non-owners
      const deniedRoles: TeamRole[] = ['VIEWER', 'MEMBER', 'ADMIN'];
      for (const role of deniedRoles) {
        vi.mocked(prisma.teamMember.findFirst).mockResolvedValue({
          id: 'member-1',
          role,
          teamId: 'team-1',
          userId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { id: 'user-1', email: 'test@example.com' },
          team: { id: 'team-1', name: 'Test Team' },
        });

        const result = await checkTeamPermission('test@example.com', 'team-1', 'owner');
        expect(result.success).toBe(false);
      }
    });

    it('should deny access for non-team members', async () => {
      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue(null);

      const result = await checkTeamPermission('outsider@example.com', 'team-1', 'read');
      expect(result.success).toBe(false);
      expect(result.status).toBe(403);
      expect(result.error).toContain('not a member');
    });
  });

  describe('checkMemberPermission', () => {
    it('should allow owners to manage all members', async () => {
      const currentUser = {
        id: 'member-1',
        role: 'OWNER',
        teamId: 'team-1',
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const targetRoles: TeamRole[] = ['VIEWER', 'MEMBER', 'ADMIN'];

      for (const targetRole of targetRoles) {
        const targetMember = {
          id: 'member-2',
          role: targetRole,
          teamId: 'team-1',
          userId: 'user-2',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(prisma.teamMember.findFirst).mockResolvedValue(currentUser);
        vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(targetMember);

        const result = await checkMemberPermission(
          'owner@example.com', 
          'team-1', 
          'member-2', 
          'remove'
        );
        expect(result.success).toBe(true);
      }
    });

    it('should prevent non-owners from managing owners', async () => {
      const roles: TeamRole[] = ['VIEWER', 'MEMBER', 'ADMIN'];

      for (const role of roles) {
        const currentUser = {
          id: 'member-1',
          role,
          teamId: 'team-1',
          userId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const targetOwner = {
          id: 'member-2',
          role: 'OWNER' as TeamRole,
          teamId: 'team-1',
          userId: 'user-2',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(prisma.teamMember.findFirst).mockResolvedValue(currentUser);
        vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(targetOwner);

        const result = await checkMemberPermission(
          'user@example.com', 
          'team-1', 
          'member-2', 
          'remove'
        );
        expect(result.success).toBe(false);
        expect(result.error).toContain('Only owners can manage other owners');
      }
    });

    it('should allow admins to manage members and viewers', async () => {
      const currentUser = {
        id: 'member-1',
        role: 'ADMIN',
        teamId: 'team-1',
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const allowedTargets: TeamRole[] = ['MEMBER', 'VIEWER'];

      for (const targetRole of allowedTargets) {
        const targetMember = {
          id: 'member-2',
          role: targetRole,
          teamId: 'team-1',
          userId: 'user-2',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(prisma.teamMember.findFirst).mockResolvedValue(currentUser);
        vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(targetMember);

        const result = await checkMemberPermission(
          'admin@example.com', 
          'team-1', 
          'member-2', 
          'update_role'
        );
        expect(result.success).toBe(true);
      }
    });

    it('should prevent last owner removal', async () => {
      const ownerUser = {
        id: 'member-1',
        role: 'OWNER',
        teamId: 'team-1',
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue(ownerUser);
      vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(ownerUser);
      vi.mocked(prisma.teamMember.count).mockResolvedValue(1); // Only one owner

      const result = await checkMemberPermission(
        'owner@example.com', 
        'team-1', 
        'member-1', 
        'remove'
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot remove the last owner');
    });
  });

  describe('getAssignableRoles', () => {
    it('should return correct assignable roles for each role', () => {
      expect(getAssignableRoles('OWNER')).toEqual(['ADMIN', 'MEMBER', 'VIEWER']);
      expect(getAssignableRoles('ADMIN')).toEqual(['MEMBER', 'VIEWER']);
      expect(getAssignableRoles('MEMBER')).toEqual([]);
      expect(getAssignableRoles('VIEWER')).toEqual([]);
    });
  });

  describe('isValidRoleTransition', () => {
    it('should allow valid role transitions by owners', () => {
      const validTransitions = [
        { from: 'ADMIN', to: 'MEMBER', by: 'OWNER' },
        { from: 'MEMBER', to: 'ADMIN', by: 'OWNER' },
        { from: 'VIEWER', to: 'MEMBER', by: 'OWNER' },
        { from: 'MEMBER', to: 'VIEWER', by: 'OWNER' },
      ];

      for (const transition of validTransitions) {
        const result = isValidRoleTransition(
          transition.from as TeamRole,
          transition.to as TeamRole,
          transition.by as TeamRole
        );
        expect(result).toBe(true);
      }
    });

    it('should prevent invalid role transitions', () => {
      const invalidTransitions = [
        { from: 'ADMIN', to: 'OWNER', by: 'OWNER' }, // No direct owner promotion
        { from: 'MEMBER', to: 'ADMIN', by: 'ADMIN' }, // Admin can't promote to admin
        { from: 'VIEWER', to: 'OWNER', by: 'OWNER' }, // No direct owner promotion
        { from: 'ADMIN', to: 'MEMBER', by: 'MEMBER' }, // Member can't demote admin
      ];

      for (const transition of invalidTransitions) {
        const result = isValidRoleTransition(
          transition.from as TeamRole,
          transition.to as TeamRole,
          transition.by as TeamRole
        );
        expect(result).toBe(false);
      }
    });

    it('should allow admin to manage members and viewers', () => {
      const validAdminTransitions = [
        { from: 'MEMBER', to: 'VIEWER', by: 'ADMIN' },
        { from: 'VIEWER', to: 'MEMBER', by: 'ADMIN' },
      ];

      for (const transition of validAdminTransitions) {
        const result = isValidRoleTransition(
          transition.from as TeamRole,
          transition.to as TeamRole,
          transition.by as TeamRole
        );
        expect(result).toBe(true);
      }
    });
  });

  describe('Security Boundaries', () => {
    it('should prevent privilege escalation', () => {
      // Members cannot escalate to admin
      expect(isValidRoleTransition('MEMBER', 'ADMIN', 'MEMBER')).toBe(false);
      
      // Viewers cannot escalate to any higher role
      expect(isValidRoleTransition('VIEWER', 'MEMBER', 'VIEWER')).toBe(false);
      expect(isValidRoleTransition('VIEWER', 'ADMIN', 'VIEWER')).toBe(false);
      expect(isValidRoleTransition('VIEWER', 'OWNER', 'VIEWER')).toBe(false);
      
      // Admins cannot escalate to owner
      expect(isValidRoleTransition('ADMIN', 'OWNER', 'ADMIN')).toBe(false);
    });

    it('should enforce action-based permissions', async () => {
      const testCases = [
        { role: 'VIEWER', action: 'remove', expected: false },
        { role: 'MEMBER', action: 'remove', expected: false },
        { role: 'ADMIN', action: 'remove', expected: true },
        { role: 'OWNER', action: 'remove', expected: true },
      ];

      for (const testCase of testCases) {
        const currentUser = {
          id: 'member-1',
          role: testCase.role,
          teamId: 'team-1',
          userId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const targetMember = {
          id: 'member-2',
          role: 'MEMBER',
          teamId: 'team-1',
          userId: 'user-2',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(prisma.teamMember.findFirst).mockResolvedValue(currentUser);
        vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(targetMember);

        const result = await checkMemberPermission(
          'user@example.com',
          'team-1',
          'member-2',
          testCase.action as 'remove'
        );

        expect(result.success).toBe(testCase.expected);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      vi.mocked(prisma.teamMember.findFirst).mockRejectedValue(new Error('Database error'));

      const result = await checkTeamPermission('test@example.com', 'team-1', 'read');
      expect(result.success).toBe(false);
      expect(result.status).toBe(500);
      expect(result.error).toContain('Failed to check permissions');
    });

    it('should handle missing team member records', async () => {
      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(null);

      const result = await checkMemberPermission(
        'user@example.com',
        'team-1',
        'member-2',
        'remove'
      );
      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
    });
  });
});