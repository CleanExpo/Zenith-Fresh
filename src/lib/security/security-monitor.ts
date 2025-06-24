/**
 * ZENITH ENTERPRISE SECURITY MONITOR
 * Real-time security monitoring and incident response system
 */

import { EventEmitter } from 'events';
import { securitySuite } from './enterprise-security-suite';

export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: SecurityEventType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  ip: string;
  userAgent?: string;
  userId?: string;
  endpoint?: string;
  details: any;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
}

export type SecurityEventType = 
  | 'AUTHENTICATION_FAILURE'
  | 'BRUTE_FORCE_ATTACK'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'SQL_INJECTION_ATTEMPT'
  | 'XSS_ATTEMPT'
  | 'COMMAND_INJECTION_ATTEMPT'
  | 'DIRECTORY_TRAVERSAL_ATTEMPT'
  | 'MALICIOUS_FILE_UPLOAD'
  | 'UNAUTHORIZED_ACCESS'
  | 'PRIVILEGE_ESCALATION'
  | 'DATA_BREACH_ATTEMPT'
  | 'ACCOUNT_TAKEOVER'
  | 'ANOMALOUS_BEHAVIOR'
  | 'SECURITY_SCAN_DETECTED'
  | 'VULNERABILITY_EXPLOIT_ATTEMPT';

export interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<SecurityEventType, number>;
  eventsBySeverity: Record<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', number>;
  topAttackers: Array<{ ip: string; count: number }>;
  topTargets: Array<{ endpoint: string; count: number }>;
  timeRange: {
    start: string;
    end: string;
  };
}

export interface ThreatIntelligence {
  ip: string;
  reputation: 'CLEAN' | 'SUSPICIOUS' | 'MALICIOUS';
  lastSeen: string;
  eventCount: number;
  eventTypes: SecurityEventType[];
  geoLocation?: {
    country: string;
    city: string;
    coordinates: [number, number];
  };
  isp?: string;
  tags: string[];
}

export class SecurityMonitor extends EventEmitter {
  private events: SecurityEvent[] = [];
  private threatIntel: Map<string, ThreatIntelligence> = new Map();
  private attackPatterns: Map<string, { count: number; lastSeen: Date }> = new Map();
  private alerts: SecurityEvent[] = [];
  private maxEvents = 10000; // Keep last 10k events in memory
  private readonly monitoringRules: SecurityMonitoringRule[] = [];

  constructor() {
    super();
    this.initializeDefaultRules();
    this.startPeriodicCleanup();
  }

  // Initialize default monitoring rules
  private initializeDefaultRules(): void {
    this.monitoringRules.push(
      // Brute force detection
      {
        id: 'brute_force_detection',
        name: 'Brute Force Attack Detection',
        condition: (events) => {
          const recentFailures = events.filter(e => 
            e.type === 'AUTHENTICATION_FAILURE' && 
            Date.now() - new Date(e.timestamp).getTime() < 5 * 60 * 1000
          );
          return recentFailures.length >= 5;
        },
        action: (events) => {
          const attackerIPs = [...new Set(events.map(e => e.ip))];
          attackerIPs.forEach(ip => {
            this.recordSecurityEvent({
              type: 'BRUTE_FORCE_ATTACK',
              severity: 'HIGH',
              source: 'SecurityMonitor',
              ip,
              details: { 
                failedAttempts: events.filter(e => e.ip === ip).length,
                timeWindow: '5 minutes'
              }
            });
          });
        }
      },

      // Rapid scanning detection
      {
        id: 'rapid_scanning',
        name: 'Rapid Endpoint Scanning Detection',
        condition: (events) => {
          const recentEvents = events.filter(e => 
            Date.now() - new Date(e.timestamp).getTime() < 60 * 1000
          );
          const uniqueEndpoints = new Set(recentEvents.map(e => e.endpoint));
          return uniqueEndpoints.size > 20;
        },
        action: (events) => {
          const scannerIPs = [...new Set(events.map(e => e.ip))];
          scannerIPs.forEach(ip => {
            this.recordSecurityEvent({
              type: 'SECURITY_SCAN_DETECTED',
              severity: 'MEDIUM',
              source: 'SecurityMonitor',
              ip,
              details: { 
                endpointsScanned: events.filter(e => e.ip === ip).length,
                timeWindow: '1 minute'
              }
            });
          });
        }
      },

      // Suspicious activity pattern
      {
        id: 'suspicious_pattern',
        name: 'Suspicious Activity Pattern Detection',
        condition: (events) => {
          const suspiciousTypes = [
            'SQL_INJECTION_ATTEMPT',
            'XSS_ATTEMPT',
            'COMMAND_INJECTION_ATTEMPT',
            'DIRECTORY_TRAVERSAL_ATTEMPT'
          ];
          const recentSuspicious = events.filter(e => 
            suspiciousTypes.includes(e.type) &&
            Date.now() - new Date(e.timestamp).getTime() < 10 * 60 * 1000
          );
          return recentSuspicious.length >= 3;
        },
        action: (events) => {
          const attackerIPs = [...new Set(events.map(e => e.ip))];
          attackerIPs.forEach(ip => {
            this.recordSecurityEvent({
              type: 'ANOMALOUS_BEHAVIOR',
              severity: 'HIGH',
              source: 'SecurityMonitor',
              ip,
              details: { 
                suspiciousEvents: events.filter(e => e.ip === ip).length,
                timeWindow: '10 minutes'
              }
            });
          });
        }
      }
    );
  }

  // Record a security event
  recordSecurityEvent(eventData: {
    type: SecurityEventType;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    source: string;
    ip: string;
    userAgent?: string;
    userId?: string;
    endpoint?: string;
    details: any;
  }): SecurityEvent {
    const event: SecurityEvent = {
      id: securitySuite.generateSecureUUID(),
      timestamp: new Date().toISOString(),
      status: 'OPEN',
      ...eventData,
    };

    // Add to events array
    this.events.unshift(event);
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }

    // Update threat intelligence
    this.updateThreatIntelligence(event);

    // Check monitoring rules
    this.checkMonitoringRules();

    // Emit event for real-time processing
    this.emit('securityEvent', event);

    // Auto-respond to critical events
    if (event.severity === 'CRITICAL') {
      this.handleCriticalEvent(event);
    }

    // Log to console and external systems
    console.warn(`[SECURITY EVENT] ${event.type} from ${event.ip} - Severity: ${event.severity}`);
    
    return event;
  }

  // Update threat intelligence for an IP
  private updateThreatIntelligence(event: SecurityEvent): void {
    const existing = this.threatIntel.get(event.ip) || {
      ip: event.ip,
      reputation: 'CLEAN' as const,
      lastSeen: event.timestamp,
      eventCount: 0,
      eventTypes: [],
      tags: [],
    };

    existing.lastSeen = event.timestamp;
    existing.eventCount++;
    
    if (!existing.eventTypes.includes(event.type)) {
      existing.eventTypes.push(event.type);
    }

    // Update reputation based on event patterns
    const suspiciousTypes = [
      'BRUTE_FORCE_ATTACK',
      'SQL_INJECTION_ATTEMPT',
      'XSS_ATTEMPT',
      'COMMAND_INJECTION_ATTEMPT',
    ];

    const maliciousTypes = [
      'DATA_BREACH_ATTEMPT',
      'PRIVILEGE_ESCALATION',
      'ACCOUNT_TAKEOVER',
    ];

    if (maliciousTypes.includes(event.type) || existing.eventCount > 50) {
      existing.reputation = 'MALICIOUS';
      existing.tags.push('HIGH_RISK');
    } else if (suspiciousTypes.includes(event.type) || existing.eventCount > 10) {
      existing.reputation = 'SUSPICIOUS';
      existing.tags.push('WATCH_LIST');
    }

    this.threatIntel.set(event.ip, existing);
  }

  // Check all monitoring rules
  private checkMonitoringRules(): void {
    this.monitoringRules.forEach(rule => {
      try {
        if (rule.condition(this.events)) {
          rule.action(this.events);
        }
      } catch (error) {
        console.error(`Error in monitoring rule ${rule.id}:`, error);
      }
    });
  }

  // Handle critical security events
  private handleCriticalEvent(event: SecurityEvent): void {
    // Add to alerts
    this.alerts.unshift(event);
    
    // Automatic blocking for certain IPs
    if (this.shouldAutoBlock(event)) {
      this.blockIP(event.ip, 'Automatic blocking due to critical security event');
    }

    // Notify security team (in production, integrate with PagerDuty, Slack, etc.)
    this.notifySecurityTeam(event);
  }

  // Determine if an IP should be automatically blocked
  private shouldAutoBlock(event: SecurityEvent): boolean {
    const autoBlockTypes: SecurityEventType[] = [
      'BRUTE_FORCE_ATTACK',
      'DATA_BREACH_ATTEMPT',
      'PRIVILEGE_ESCALATION',
    ];

    const threat = this.threatIntel.get(event.ip);
    return autoBlockTypes.includes(event.type) || 
           (threat && threat.reputation === 'MALICIOUS');
  }

  // Block an IP address (integrate with firewall/WAF)
  private blockIP(ip: string, reason: string): void {
    console.warn(`[AUTO-BLOCK] Blocking IP ${ip}: ${reason}`);
    
    // In production, integrate with:
    // - AWS WAF
    // - Cloudflare
    // - Nginx/Apache rules
    // - Firewall APIs
    
    this.emit('ipBlocked', { ip, reason, timestamp: new Date().toISOString() });
  }

  // Notify security team
  private notifySecurityTeam(event: SecurityEvent): void {
    // In production, integrate with:
    // - PagerDuty
    // - Slack
    // - Email alerts
    // - SMS alerts
    
    console.error(`[CRITICAL ALERT] ${event.type} detected from ${event.ip}`);
    this.emit('criticalAlert', event);
  }

  // Get security metrics
  getSecurityMetrics(timeRange?: { start: Date; end: Date }): SecurityMetrics {
    let eventsToAnalyze = this.events;
    
    if (timeRange) {
      eventsToAnalyze = this.events.filter(e => {
        const eventTime = new Date(e.timestamp);
        return eventTime >= timeRange.start && eventTime <= timeRange.end;
      });
    }

    const eventsByType: Record<SecurityEventType, number> = {} as any;
    const eventsBySeverity: Record<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };

    const attackerCounts: Record<string, number> = {};
    const targetCounts: Record<string, number> = {};

    eventsToAnalyze.forEach(event => {
      // Count by type
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      
      // Count by severity
      eventsBySeverity[event.severity]++;
      
      // Count attackers
      attackerCounts[event.ip] = (attackerCounts[event.ip] || 0) + 1;
      
      // Count targets
      if (event.endpoint) {
        targetCounts[event.endpoint] = (targetCounts[event.endpoint] || 0) + 1;
      }
    });

    const topAttackers = Object.entries(attackerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));

    const topTargets = Object.entries(targetCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));

    return {
      totalEvents: eventsToAnalyze.length,
      eventsByType,
      eventsBySeverity,
      topAttackers,
      topTargets,
      timeRange: {
        start: timeRange?.start.toISOString() || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        end: timeRange?.end.toISOString() || new Date().toISOString(),
      },
    };
  }

  // Get threat intelligence for an IP
  getThreatIntelligence(ip: string): ThreatIntelligence | null {
    return this.threatIntel.get(ip) || null;
  }

  // Get all threats above a certain reputation level
  getThreatsAboveLevel(minReputation: 'SUSPICIOUS' | 'MALICIOUS'): ThreatIntelligence[] {
    const threats = Array.from(this.threatIntel.values());
    
    if (minReputation === 'MALICIOUS') {
      return threats.filter(t => t.reputation === 'MALICIOUS');
    } else {
      return threats.filter(t => t.reputation === 'SUSPICIOUS' || t.reputation === 'MALICIOUS');
    }
  }

  // Get recent alerts
  getRecentAlerts(limit: number = 50): SecurityEvent[] {
    return this.alerts.slice(0, limit);
  }

  // Search events
  searchEvents(criteria: {
    type?: SecurityEventType;
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    ip?: string;
    timeRange?: { start: Date; end: Date };
    limit?: number;
  }): SecurityEvent[] {
    let results = this.events;

    if (criteria.type) {
      results = results.filter(e => e.type === criteria.type);
    }

    if (criteria.severity) {
      results = results.filter(e => e.severity === criteria.severity);
    }

    if (criteria.ip) {
      results = results.filter(e => e.ip === criteria.ip);
    }

    if (criteria.timeRange) {
      results = results.filter(e => {
        const eventTime = new Date(e.timestamp);
        return eventTime >= criteria.timeRange!.start && eventTime <= criteria.timeRange!.end;
      });
    }

    if (criteria.limit) {
      results = results.slice(0, criteria.limit);
    }

    return results;
  }

  // Start periodic cleanup
  private startPeriodicCleanup(): void {
    setInterval(() => {
      // Clean up old events (keep last 24 hours)
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      this.events = this.events.filter(e => new Date(e.timestamp) > cutoff);
      
      // Clean up old threat intel
      for (const [ip, intel] of this.threatIntel.entries()) {
        if (new Date(intel.lastSeen) < cutoff && intel.reputation === 'CLEAN') {
          this.threatIntel.delete(ip);
        }
      }
    }, 60 * 60 * 1000); // Run every hour
  }

  // Generate security report
  generateSecurityReport(): string {
    const metrics = this.getSecurityMetrics();
    const threats = this.getThreatsAboveLevel('SUSPICIOUS');
    const alerts = this.getRecentAlerts(10);

    return `
ZENITH ENTERPRISE SECURITY REPORT
Generated: ${new Date().toISOString()}

SUMMARY:
- Total Events (24h): ${metrics.totalEvents}
- Critical Events: ${metrics.eventsBySeverity.CRITICAL}
- High Events: ${metrics.eventsBySeverity.HIGH}
- Active Threats: ${threats.length}
- Recent Alerts: ${alerts.length}

TOP ATTACKERS:
${metrics.topAttackers.map(a => `- ${a.ip}: ${a.count} events`).join('\n')}

TOP TARGETS:
${metrics.topTargets.map(t => `- ${t.endpoint}: ${t.count} events`).join('\n')}

THREAT INTELLIGENCE:
${threats.map(t => `- ${t.ip} (${t.reputation}): ${t.eventCount} events`).join('\n')}

RECENT CRITICAL ALERTS:
${alerts.filter(a => a.severity === 'CRITICAL').map(a => `- ${a.type} from ${a.ip} at ${a.timestamp}`).join('\n')}
    `.trim();
  }
}

interface SecurityMonitoringRule {
  id: string;
  name: string;
  condition: (events: SecurityEvent[]) => boolean;
  action: (events: SecurityEvent[]) => void;
}

// Create singleton instance
export const securityMonitor = new SecurityMonitor();

// Export helper functions
export const recordSecurityEvent = (eventData: Parameters<SecurityMonitor['recordSecurityEvent']>[0]) =>
  securityMonitor.recordSecurityEvent(eventData);

export const getSecurityMetrics = (timeRange?: { start: Date; end: Date }) =>
  securityMonitor.getSecurityMetrics(timeRange);

export const getThreatIntelligence = (ip: string) =>
  securityMonitor.getThreatIntelligence(ip);