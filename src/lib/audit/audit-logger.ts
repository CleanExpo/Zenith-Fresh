import { prisma } from '@/lib/prisma';

export enum AuditEventType {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  DATA_EXPORT = 'DATA_EXPORT',
  SYSTEM_ACCESS = 'SYSTEM_ACCESS',
  API_ACCESS = 'API_ACCESS',
}

export enum SecuritySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AuditEntityType {
  USER = 'USER',
  PROJECT = 'PROJECT',
  TEAM = 'TEAM',
  SYSTEM = 'SYSTEM',
  FILE = 'FILE',
  API = 'API',
}

interface AuditTrailOptions {
  userId?: string;
  resource?: string;
  limit: number;
  offset: number;
  startDate?: Date;
  endDate?: Date;
  eventTypes?: AuditEventType[];
  severity?: SecuritySeverity;
}

interface AuditLogEntry {
  id: string;
  action: AuditEventType;
  entityType: AuditEntityType;
  entityId?: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  createdAt: Date;
}

export class AuditLogger {
  static async log(
    action: AuditEventType,
    data: {
      userId: string;
      entityType?: AuditEntityType;
      entityId?: string;
      ipAddress?: string;
      userAgent?: string;
      metadata?: any;
    },
    entityType: AuditEntityType = AuditEntityType.SYSTEM
  ): Promise<void> {
    try {
      // Skip audit logging if no userId provided (system operations)
      if (!data.userId) {
        console.log(`System audit log skipped: ${action} on ${entityType}`);
        return;
      }
      
      await prisma.auditLog.create({
        data: {
          action,
          entityType,
          entityId: data.entityId,
          userId: data.userId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          metadata: data.metadata || {},
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging should not break application flow
    }
  }

  static async getAuditTrail(
    userId?: string,
    resource?: string,
    limit: number = 100,
    offset: number = 0,
    startDate?: Date,
    endDate?: Date,
    eventTypes?: AuditEventType[],
    severity?: SecuritySeverity
  ): Promise<{
    logs: AuditLogEntry[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const where: any = {};

      if (userId) {
        where.userId = userId;
      }

      if (resource) {
        where.entityId = resource;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      if (eventTypes && eventTypes.length > 0) {
        where.action = { in: eventTypes };
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        prisma.auditLog.count({ where }),
      ]);

      return {
        logs: logs.map(log => ({
          id: log.id,
          action: log.action as AuditEventType,
          entityType: log.entityType as AuditEntityType,
          entityId: log.entityId || undefined,
          userId: log.userId,
          ipAddress: log.ipAddress || undefined,
          userAgent: log.userAgent || undefined,
          metadata: log.metadata,
          createdAt: log.createdAt,
        })),
        total,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      console.error('Failed to fetch audit trail:', error);
      return {
        logs: [],
        total: 0,
        hasMore: false,
      };
    }
  }

  static async logUserAction(
    userId: string,
    action: AuditEventType,
    entityType: AuditEntityType,
    entityId?: string,
    metadata?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    return this.log(action, {
      userId,
      entityType,
      entityId,
      metadata,
      ipAddress,
      userAgent,
    }, entityType);
  }

  static async logSystemEvent(
    action: AuditEventType,
    metadata?: any,
    userId?: string
  ): Promise<void> {
    // Only log if userId is provided, skip pure system events
    if (!userId) {
      console.log(`System event not logged (no user context): ${action}`);
      return;
    }
    
    return this.log(action, {
      userId,
      metadata,
    }, AuditEntityType.SYSTEM);
  }
}

export const auditLogger = AuditLogger;
export default AuditLogger;