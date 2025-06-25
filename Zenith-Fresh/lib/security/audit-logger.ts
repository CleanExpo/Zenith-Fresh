import { prisma } from '../prisma';
import { getRedis, RedisKeys } from '../redis';

// Security event types
export const SECURITY_EVENT_TYPES = {
  // Authentication
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  
  // API Security
  API_KEY_CREATED: 'API_KEY_CREATED',
  API_KEY_USED: 'API_KEY_USED',
  API_KEY_REVOKED: 'API_KEY_REVOKED',
  API_KEY_EXPIRED: 'API_KEY_EXPIRED',
  INVALID_API_KEY: 'INVALID_API_KEY',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  RATE_LIMIT_WARNING: 'RATE_LIMIT_WARNING',  // 80% of limit reached
  
  // IP Filtering
  IP_BLOCKED: 'IP_BLOCKED',
  IP_WHITELISTED: 'IP_WHITELISTED',
  IP_BLACKLISTED: 'IP_BLACKLISTED',
  IP_WHITELIST_REMOVED: 'IP_WHITELIST_REMOVED',
  IP_BLACKLIST_REMOVED: 'IP_BLACKLIST_REMOVED',
  IP_RANGE_WHITELISTED: 'IP_RANGE_WHITELISTED',
  IP_RANGE_BLACKLISTED: 'IP_RANGE_BLACKLISTED',
  AUTO_BLOCK_PREVENTED: 'AUTO_BLOCK_PREVENTED',
  
  // Threat Detection
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  BRUTE_FORCE_ATTEMPT: 'BRUTE_FORCE_ATTEMPT',
  SQL_INJECTION_ATTEMPT: 'SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT: 'XSS_ATTEMPT',
  CSRF_ATTEMPT: 'CSRF_ATTEMPT',
  MALICIOUS_PAYLOAD: 'MALICIOUS_PAYLOAD',
  
  // DDoS Protection
  DDOS_DETECTED: 'DDOS_DETECTED',
  DDOS_MITIGATED: 'DDOS_MITIGATED',
  TRAFFIC_SPIKE: 'TRAFFIC_SPIKE',
  
  // System Security
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  PRIVILEGE_ESCALATION: 'PRIVILEGE_ESCALATION',
  DATA_BREACH_ATTEMPT: 'DATA_BREACH_ATTEMPT',
  CONFIGURATION_CHANGED: 'CONFIGURATION_CHANGED',
  
  // User Actions
  USER_CREATED: 'USER_CREATED',
  USER_DELETED: 'USER_DELETED',
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
  DATA_EXPORTED: 'DATA_EXPORTED',
  SENSITIVE_DATA_ACCESSED: 'SENSITIVE_DATA_ACCESSED',
  
  // System Events
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  SECURITY_SCAN_COMPLETED: 'SECURITY_SCAN_COMPLETED',
  BACKUP_COMPLETED: 'BACKUP_COMPLETED',
  UPDATE_INSTALLED: 'UPDATE_INSTALLED',
} as const;

export type SecurityEventType = keyof typeof SECURITY_EVENT_TYPES;

export interface SecurityEventData {
  type: SecurityEventType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sourceIp: string;
  userAgent?: string;
  userId?: string;
  apiKeyId?: string;
  details?: Record<string, any>;
  blocked?: boolean;
  resolved?: boolean;
  resolvedBy?: string;
}

/**
 * Log a security event
 */
export async function logSecurityEvent(eventData: SecurityEventData): Promise<string | null> {
  try {
    // Create the security event in database
    const securityEvent = await prisma.securityEvent.create({
      data: {
        type: eventData.type,
        severity: eventData.severity,
        sourceIp: eventData.sourceIp,
        userAgent: eventData.userAgent,
        userId: eventData.userId,
        apiKeyId: eventData.apiKeyId,
        details: eventData.details || {},
        blocked: eventData.blocked || false,
        resolved: eventData.resolved || false,
        resolvedBy: eventData.resolvedBy,
      },
    });
    
    // Cache high-severity events in Redis for real-time monitoring
    if (['HIGH', 'CRITICAL'].includes(eventData.severity)) {
      const redis = getRedis();
      const alertData = {
        id: securityEvent.id,
        type: eventData.type,
        severity: eventData.severity,
        sourceIp: eventData.sourceIp,
        userId: eventData.userId,
        timestamp: securityEvent.createdAt.toISOString(),
        details: eventData.details,
      };
      
      // Store in Redis with 24-hour expiry
      await redis.setex(
        RedisKeys.securityAlert(securityEvent.id),
        86400,
        JSON.stringify(alertData)
      );
      
      // Add to real-time alerts queue
      await redis.lpush('security:alerts:queue', JSON.stringify(alertData));
      await redis.ltrim('security:alerts:queue', 0, 999); // Keep last 1000 alerts
      
      // Trigger real-time notifications
      await triggerSecurityAlert(alertData);
    }
    
    // Update security metrics
    await updateSecurityMetrics(eventData);
    
    // Check for auto-response triggers
    await checkAutoResponseTriggers(eventData);
    
    return securityEvent.id;
  } catch (error) {
    console.error('Error logging security event:', error);
    return null;
  }
}

/**
 * Get security events with filtering
 */
export async function getSecurityEvents(filters: {
  type?: SecurityEventType;
  severity?: string;
  sourceIp?: string;
  userId?: string;
  resolved?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  try {
    const where: any = {};
    
    if (filters.type) where.type = filters.type;
    if (filters.severity) where.severity = filters.severity;
    if (filters.sourceIp) where.sourceIp = filters.sourceIp;
    if (filters.userId) where.userId = filters.userId;
    if (filters.resolved !== undefined) where.resolved = filters.resolved;
    
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }
    
    return await prisma.securityEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        apiKey: {
          select: { id: true, name: true, keyPreview: true },
        },
      },
    });
  } catch (error) {
    console.error('Error getting security events:', error);
    return [];
  }
}

/**
 * Get security event statistics
 */
export async function getSecurityEventStats(days: number = 30): Promise<any> {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    // Get total events by severity
    const severityStats = await prisma.securityEvent.groupBy({
      by: ['severity'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: { severity: true },
    });
    
    // Get events by type
    const typeStats = await prisma.securityEvent.groupBy({
      by: ['type'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: { type: true },
    });
    
    // Get daily event counts
    const dailyStats = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM security_events
      WHERE created_at >= ${startDate} AND created_at <= ${endDate}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    
    // Get top source IPs
    const topSourceIPs = await prisma.securityEvent.groupBy({
      by: ['sourceIp'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: { sourceIp: true },
      orderBy: {
        _count: {
          sourceIp: 'desc',
        },
      },
      take: 10,
    });
    
    // Get unresolved critical events
    const unresolvedCritical = await prisma.securityEvent.count({
      where: {
        severity: 'CRITICAL',
        resolved: false,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
    
    return {
      totalEvents: severityStats.reduce((sum, stat) => sum + stat._count.severity, 0),
      severityBreakdown: severityStats.reduce((acc, stat) => {
        acc[stat.severity] = stat._count.severity;
        return acc;
      }, {} as Record<string, number>),
      typeBreakdown: typeStats.reduce((acc, stat) => {
        acc[stat.type] = stat._count.type;
        return acc;
      }, {} as Record<string, number>),
      dailyStats,
      topSourceIPs: topSourceIPs.map(ip => ({
        ip: ip.sourceIp,
        count: ip._count.sourceIp,
      })),
      unresolvedCritical,
    };
  } catch (error) {
    console.error('Error getting security event stats:', error);
    return {
      totalEvents: 0,
      severityBreakdown: {},
      typeBreakdown: {},
      dailyStats: [],
      topSourceIPs: [],
      unresolvedCritical: 0,
    };
  }
}

/**
 * Resolve a security event
 */
export async function resolveSecurityEvent(
  eventId: string,
  resolvedBy: string,
  notes?: string
): Promise<boolean> {
  try {
    await prisma.securityEvent.update({
      where: { id: eventId },
      data: {
        resolved: true,
        resolvedBy,
        resolvedAt: new Date(),
        details: {
          ...{}, // Keep existing details
          resolutionNotes: notes,
        },
      },
    });
    
    return true;
  } catch (error) {
    console.error('Error resolving security event:', error);
    return false;
  }
}

/**
 * Get real-time security alerts from Redis
 */
export async function getRealtimeSecurityAlerts(limit: number = 50): Promise<any[]> {
  try {
    const redis = getRedis();
    const alerts = await redis.lrange('security:alerts:queue', 0, limit - 1);
    
    return alerts.map(alert => JSON.parse(alert));
  } catch (error) {
    console.error('Error getting real-time security alerts:', error);
    return [];
  }
}

/**
 * Update security metrics in Redis
 */
async function updateSecurityMetrics(eventData: SecurityEventData): Promise<void> {
  try {
    const redis = getRedis();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const hour = now.getHours();
    
    // Update daily counters
    await redis.hincrby(`security:metrics:daily:${today}`, 'total', 1);
    await redis.hincrby(`security:metrics:daily:${today}`, eventData.severity.toLowerCase(), 1);
    await redis.hincrby(`security:metrics:daily:${today}`, eventData.type, 1);
    
    // Update hourly counters
    await redis.hincrby(`security:metrics:hourly:${today}:${hour}`, 'total', 1);
    await redis.hincrby(`security:metrics:hourly:${today}:${hour}`, eventData.severity.toLowerCase(), 1);
    
    // Update IP-based counters
    await redis.hincrby(`security:metrics:ip:${eventData.sourceIp}`, 'total', 1);
    await redis.hincrby(`security:metrics:ip:${eventData.sourceIp}`, eventData.type, 1);
    
    // Set expiry for metrics (keep for 30 days)
    await redis.expire(`security:metrics:daily:${today}`, 30 * 24 * 3600);
    await redis.expire(`security:metrics:hourly:${today}:${hour}`, 24 * 3600);
    await redis.expire(`security:metrics:ip:${eventData.sourceIp}`, 7 * 24 * 3600);
  } catch (error) {
    console.error('Error updating security metrics:', error);
  }
}

/**
 * Trigger security alert notifications
 */
async function triggerSecurityAlert(alertData: any): Promise<void> {
  try {
    // This would integrate with your notification system
    // For now, just log critical alerts
    if (alertData.severity === 'CRITICAL') {
      console.error(`🚨 CRITICAL SECURITY ALERT: ${alertData.type}`, {
        sourceIp: alertData.sourceIp,
        userId: alertData.userId,
        details: alertData.details,
      });
      
      // In a real system, you might:
      // - Send email alerts to security team
      // - Send Slack/Discord notifications
      // - Trigger PagerDuty incidents
      // - Send SMS alerts
      // - Create support tickets
    }
  } catch (error) {
    console.error('Error triggering security alert:', error);
  }
}

/**
 * Check for auto-response triggers
 */
async function checkAutoResponseTriggers(eventData: SecurityEventData): Promise<void> {
  try {
    // Auto-response logic based on event type and severity
    switch (eventData.type) {
      case 'BRUTE_FORCE_ATTEMPT':
      case 'SQL_INJECTION_ATTEMPT':
      case 'XSS_ATTEMPT':
        // These might trigger automatic IP blocking
        if (eventData.severity === 'CRITICAL' || eventData.severity === 'HIGH') {
          // Import IP filtering functions (avoid circular dependency)
          const { autoBlockSuspiciousIP } = await import('./ip-filtering');
          await autoBlockSuspiciousIP(
            eventData.sourceIp,
            `Auto-blocked due to ${eventData.type}`,
            eventData.severity as 'HIGH' | 'CRITICAL',
            3600 // Block for 1 hour
          );
        }
        break;
        
      case 'RATE_LIMIT_EXCEEDED':
        // Multiple rate limit violations might trigger extended blocking
        const recentViolations = await prisma.securityEvent.count({
          where: {
            sourceIp: eventData.sourceIp,
            type: 'RATE_LIMIT_EXCEEDED',
            createdAt: {
              gte: new Date(Date.now() - 10 * 60 * 1000), // Last 10 minutes
            },
          },
        });
        
        if (recentViolations > 10) {
          const { autoBlockSuspiciousIP } = await import('./ip-filtering');
          await autoBlockSuspiciousIP(
            eventData.sourceIp,
            'Excessive rate limit violations',
            'HIGH',
            7200 // Block for 2 hours
          );
        }
        break;
    }
  } catch (error) {
    console.error('Error checking auto-response triggers:', error);
  }
}

/**
 * Search security events
 */
export async function searchSecurityEvents(
  query: string,
  filters?: {
    type?: SecurityEventType;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): Promise<any[]> {
  try {
    const where: any = {
      OR: [
        { sourceIp: { contains: query } },
        { userAgent: { contains: query } },
        { type: { contains: query } },
      ],
    };
    
    if (filters?.type) where.type = filters.type;
    if (filters?.severity) where.severity = filters.severity;
    
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }
    
    return await prisma.securityEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        apiKey: {
          select: { id: true, name: true, keyPreview: true },
        },
      },
    });
  } catch (error) {
    console.error('Error searching security events:', error);
    return [];
  }
}

/**
 * Export security events to CSV
 */
export async function exportSecurityEvents(
  filters: {
    startDate?: Date;
    endDate?: Date;
    type?: SecurityEventType;
    severity?: string;
  }
): Promise<string> {
  try {
    const events = await getSecurityEvents({
      ...filters,
      limit: 10000, // Large limit for export
    });
    
    const csvHeader = 'ID,Type,Severity,Source IP,User Agent,User ID,API Key ID,Blocked,Resolved,Created At,Details\n';
    const csvRows = events.map(event => {
      const details = JSON.stringify(event.details || {}).replace(/"/g, '""');
      return [
        event.id,
        event.type,
        event.severity,
        event.sourceIp,
        event.userAgent || '',
        event.userId || '',
        event.apiKeyId || '',
        event.blocked ? 'Yes' : 'No',
        event.resolved ? 'Yes' : 'No',
        event.createdAt.toISOString(),
        `"${details}"`
      ].join(',');
    }).join('\n');
    
    return csvHeader + csvRows;
  } catch (error) {
    console.error('Error exporting security events:', error);
    return '';
  }
}