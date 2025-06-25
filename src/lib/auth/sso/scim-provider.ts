import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { hash } from 'bcryptjs';

export interface ScimUser {
  schemas: string[];
  id?: string;
  externalId?: string;
  userName: string;
  name: {
    givenName?: string;
    familyName?: string;
    formatted?: string;
  };
  emails: Array<{
    value: string;
    type?: string;
    primary?: boolean;
  }>;
  active: boolean;
  groups?: Array<{
    value: string;
    display: string;
  }>;
  meta?: {
    resourceType: string;
    created?: string;
    lastModified?: string;
    location?: string;
  };
}

export interface ScimGroup {
  schemas: string[];
  id?: string;
  displayName: string;
  members?: Array<{
    value: string;
    display: string;
    type?: string;
  }>;
  meta?: {
    resourceType: string;
    created?: string;
    lastModified?: string;
    location?: string;
  };
}

export interface ScimListResponse<T> {
  schemas: string[];
  totalResults: number;
  itemsPerPage: number;
  startIndex: number;
  Resources: T[];
}

export class ScimProvider {
  private tenantId: string;
  private baseUrl: string;

  constructor(tenantId: string, baseUrl: string) {
    this.tenantId = tenantId;
    this.baseUrl = baseUrl;
  }

  // User operations
  async createUser(scimUser: ScimUser): Promise<ScimUser> {
    const primaryEmail = scimUser.emails.find(e => e.primary)?.value || scimUser.emails[0]?.value;
    if (!primaryEmail) {
      throw new Error('Email is required');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: primaryEmail.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: primaryEmail.toLowerCase(),
        name: scimUser.name.formatted || `${scimUser.name.givenName} ${scimUser.name.familyName}`.trim(),
        password: await hash(randomUUID(), 10), // Random password for SCIM users
        emailVerified: new Date(), // SCIM users are pre-verified
        active: scimUser.active,
        scimExternalId: scimUser.externalId,
      },
    });

    // Create SCIM mapping
    await prisma.sCIMMapping.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        resourceType: 'User',
        resourceId: user.id,
        externalId: scimUser.externalId || user.id,
        metadata: {
          userName: scimUser.userName,
          emails: scimUser.emails,
          name: scimUser.name,
        },
      },
    });

    return this.userToScimUser(user);
  }

  async getUser(userId: string): Promise<ScimUser | null> {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { scimExternalId: userId },
        ],
      },
      include: {
        scimMapping: {
          where: { tenantId: this.tenantId },
        },
      },
    });

    if (!user) {
      return null;
    }

    return this.userToScimUser(user);
  }

  async updateUser(userId: string, scimUser: Partial<ScimUser>): Promise<ScimUser> {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { scimExternalId: userId },
        ],
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updateData: any = {};

    if (scimUser.name) {
      updateData.name = scimUser.name.formatted || 
        `${scimUser.name.givenName} ${scimUser.name.familyName}`.trim();
    }

    if (scimUser.active !== undefined) {
      updateData.active = scimUser.active;
    }

    if (scimUser.emails) {
      const primaryEmail = scimUser.emails.find(e => e.primary)?.value || scimUser.emails[0]?.value;
      if (primaryEmail && primaryEmail !== user.email) {
        updateData.email = primaryEmail.toLowerCase();
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // Update SCIM mapping metadata
    if (scimUser.userName || scimUser.emails || scimUser.name) {
      await prisma.sCIMMapping.updateMany({
        where: {
          resourceId: user.id,
          tenantId: this.tenantId,
        },
        data: {
          metadata: {
            userName: scimUser.userName,
            emails: scimUser.emails,
            name: scimUser.name,
          },
        },
      });
    }

    return this.userToScimUser(updatedUser);
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { scimExternalId: userId },
        ],
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Soft delete - deactivate user
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        active: false,
        deletedAt: new Date(),
      },
    });

    // Remove SCIM mapping
    await prisma.sCIMMapping.deleteMany({
      where: {
        resourceId: user.id,
        tenantId: this.tenantId,
      },
    });
  }

  async listUsers(
    filter?: string,
    startIndex: number = 1,
    count: number = 100
  ): Promise<ScimListResponse<ScimUser>> {
    const where: any = {};

    // Parse SCIM filter
    if (filter) {
      const match = filter.match(/(\w+)\s+eq\s+"([^"]+)"/);
      if (match) {
        const [, field, value] = match;
        if (field === 'userName' || field === 'email') {
          where.email = value.toLowerCase();
        } else if (field === 'externalId') {
          where.scimExternalId = value;
        }
      }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: startIndex - 1,
        take: count,
        include: {
          scimMapping: {
            where: { tenantId: this.tenantId },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      totalResults: total,
      itemsPerPage: count,
      startIndex,
      Resources: users.map(user => this.userToScimUser(user)),
    };
  }

  // Group operations
  async createGroup(scimGroup: ScimGroup): Promise<ScimGroup> {
    const group = await prisma.team.create({
      data: {
        id: randomUUID(),
        name: scimGroup.displayName,
        tenantId: this.tenantId,
      },
    });

    // Create SCIM mapping
    await prisma.sCIMMapping.create({
      data: {
        id: randomUUID(),
        tenantId: this.tenantId,
        resourceType: 'Group',
        resourceId: group.id,
        externalId: group.id,
        metadata: {
          displayName: scimGroup.displayName,
        },
      },
    });

    // Add members if provided
    if (scimGroup.members && scimGroup.members.length > 0) {
      await this.syncGroupMembers(group.id, scimGroup.members);
    }

    return this.teamToScimGroup(group);
  }

  async getGroup(groupId: string): Promise<ScimGroup | null> {
    const group = await prisma.team.findFirst({
      where: {
        id: groupId,
        tenantId: this.tenantId,
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!group) {
      return null;
    }

    return this.teamToScimGroup(group);
  }

  async updateGroup(groupId: string, scimGroup: Partial<ScimGroup>): Promise<ScimGroup> {
    const group = await prisma.team.findFirst({
      where: {
        id: groupId,
        tenantId: this.tenantId,
      },
    });

    if (!group) {
      throw new Error('Group not found');
    }

    if (scimGroup.displayName) {
      await prisma.team.update({
        where: { id: group.id },
        data: { name: scimGroup.displayName },
      });
    }

    if (scimGroup.members) {
      await this.syncGroupMembers(group.id, scimGroup.members);
    }

    return this.getGroup(group.id) as Promise<ScimGroup>;
  }

  async deleteGroup(groupId: string): Promise<void> {
    const group = await prisma.team.findFirst({
      where: {
        id: groupId,
        tenantId: this.tenantId,
      },
    });

    if (!group) {
      throw new Error('Group not found');
    }

    // Delete group and its members
    await prisma.team.delete({
      where: { id: group.id },
    });

    // Remove SCIM mapping
    await prisma.sCIMMapping.deleteMany({
      where: {
        resourceId: group.id,
        tenantId: this.tenantId,
      },
    });
  }

  // Helper methods
  private userToScimUser(user: any): ScimUser {
    const scimMapping = user.scimMapping?.[0];
    const metadata = scimMapping?.metadata || {};

    return {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
      id: user.id,
      externalId: user.scimExternalId || user.id,
      userName: metadata.userName || user.email,
      name: metadata.name || {
        formatted: user.name,
      },
      emails: metadata.emails || [{
        value: user.email,
        type: 'work',
        primary: true,
      }],
      active: user.active !== false && !user.deletedAt,
      meta: {
        resourceType: 'User',
        created: user.createdAt.toISOString(),
        lastModified: user.updatedAt.toISOString(),
        location: `${this.baseUrl}/scim/v2/Users/${user.id}`,
      },
    };
  }

  private teamToScimGroup(team: any): ScimGroup {
    const members = team.members?.map((member: any) => ({
      value: member.userId,
      display: member.user?.email || member.userId,
      type: 'User',
    })) || [];

    return {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
      id: team.id,
      displayName: team.name,
      members,
      meta: {
        resourceType: 'Group',
        created: team.createdAt.toISOString(),
        lastModified: team.updatedAt.toISOString(),
        location: `${this.baseUrl}/scim/v2/Groups/${team.id}`,
      },
    };
  }

  private async syncGroupMembers(groupId: string, members: Array<{ value: string }>) {
    // Get current members
    const currentMembers = await prisma.teamMember.findMany({
      where: { teamId: groupId },
      select: { userId: true },
    });

    const currentUserIds = new Set(currentMembers.map(m => m.userId));
    const newUserIds = new Set(members.map(m => m.value));

    // Remove members not in the new list
    const toRemove = [...currentUserIds].filter(id => !newUserIds.has(id));
    if (toRemove.length > 0) {
      await prisma.teamMember.deleteMany({
        where: {
          teamId: groupId,
          userId: { in: toRemove },
        },
      });
    }

    // Add new members
    const toAdd = [...newUserIds].filter(id => !currentUserIds.has(id));
    if (toAdd.length > 0) {
      await prisma.teamMember.createMany({
        data: toAdd.map(userId => ({
          id: randomUUID(),
          teamId: groupId,
          userId,
          role: 'member',
        })),
      });
    }
  }
}

// SCIM authentication
export class ScimAuth {
  static async validateToken(token: string, tenantId: string): Promise<boolean> {
    const apiToken = await prisma.aPIKey.findFirst({
      where: {
        key: token,
        tenantId,
        active: true,
        scope: { has: 'scim' },
        expiresAt: { gt: new Date() },
      },
    });

    if (apiToken) {
      // Update last used
      await prisma.aPIKey.update({
        where: { id: apiToken.id },
        data: { lastUsedAt: new Date() },
      });
      return true;
    }

    return false;
  }
}