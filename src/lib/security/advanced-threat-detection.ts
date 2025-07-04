/**
 * Advanced Threat Detection System
 * 
 * AI-powered security monitoring with behavioral analytics,
 * anomaly detection, and automated incident response.
 */

import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';
import { AuditLogger, AuditEventType } from '@/lib/audit/audit-logger';

export enum ThreatLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum ThreatType {
  BRUTE_FORCE_ATTACK = 'BRUTE_FORCE_ATTACK',
  SQL_INJECTION = 'SQL_INJECTION',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  DATA_EXFILTRATION = 'DATA_EXFILTRATION',
  ACCOUNT_TAKEOVER = 'ACCOUNT_TAKEOVER',
  INSIDER_THREAT = 'INSIDER_THREAT',
  DDoS_ATTACK = 'DDoS_ATTACK',
  MALWARE_DETECTION = 'MALWARE_DETECTION',
  ANOMALOUS_BEHAVIOR = 'ANOMALOUS_BEHAVIOR'
}

export enum SecurityAction {
  MONITOR = 'MONITOR',
  ALERT = 'ALERT',
  BLOCK_IP = 'BLOCK_IP',
  DISABLE_ACCOUNT = 'DISABLE_ACCOUNT',
  QUARANTINE = 'QUARANTINE',
  ESCALATE = 'ESCALATE',
  AUTO_REMEDIATE = 'AUTO_REMEDIATE'
}

interface ThreatIndicator {
  id: string;
  type: ThreatType;
  level: ThreatLevel;
  source: string;
  target?: string;
  description: string;
  indicators: Record<string, any>;
  confidence: number; // 0-100
  timestamp: Date;
  resolved: boolean;
  falsePositive: boolean;
}

interface SecurityIncident {
  id: string;
  title: string;
  type: ThreatType;
  level: ThreatLevel;
  status: 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED' | 'FALSE_POSITIVE';
  description: string;
  affectedAssets: string[];
  indicators: ThreatIndicator[];
  timeline: SecurityEvent[];
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: string;
  source: string;
  message: string;
  metadata: Record<string, any>;
  severity: ThreatLevel;
}

interface BehavioralProfile {
  userId: string;
  baseline: {
    avgSessionDuration: number;
    commonAccessPatterns: string[];
    typicalLocations: string[];
    usualDevices: string[];
    activityTimestamps: number[];
  };
  currentBehavior: {
    sessionDuration: number;
    accessPattern: string[];
    location: string;
    device: string;
    timestamp: number;
  };
  anomalyScore: number;
  lastUpdated: Date;
}

interface ThreatIntelligence {
  maliciousIPs: Set<string>;
  suspiciousUserAgents: Set<string>;
  knownAttackPatterns: RegExp[];
  compromisedCredentials: Set<string>;
  lastUpdated: Date;
}

export class AdvancedThreatDetectionEngine {
  private static instance: AdvancedThreatDetectionEngine;
  private threatIndicators: Map<string, ThreatIndicator> = new Map();
  private securityIncidents: Map<string, SecurityIncident> = new Map();
  private behavioralProfiles: Map<string, BehavioralProfile> = new Map();
  private threatIntelligence: ThreatIntelligence;
  private isMonitoring = false;

  private constructor() {
    this.threatIntelligence = {
      maliciousIPs: new Set(),
      suspiciousUserAgents: new Set(),
      knownAttackPatterns: [],
      compromisedCredentials: new Set(),
      lastUpdated: new Date()
    };
    this.initializeThreatIntelligence();
  }

  static getInstance(): AdvancedThreatDetectionEngine {
    if (!AdvancedThreatDetectionEngine.instance) {
      AdvancedThreatDetectionEngine.instance = new AdvancedThreatDetectionEngine();
    }
    return AdvancedThreatDetectionEngine.instance;
  }

  // ==================== THREAT DETECTION ====================

  async analyzeSecurityEvent(event: {
    type: string;
    source: string;
    target?: string;
    metadata: Record<string, any>;
    timestamp?: Date;
  }): Promise<ThreatIndicator[]> {
    const threats: ThreatIndicator[] = [];
    const timestamp = event.timestamp || new Date();

    // Analyze for different threat types
    const bruteForce = await this.detectBruteForceAttack(event);
    if (bruteForce) threats.push(bruteForce);

    const sqlInjection = await this.detectSQLInjection(event);
    if (sqlInjection) threats.push(sqlInjection);

    const xssAttempt = await this.detectXSSAttempt(event);
    if (xssAttempt) threats.push(xssAttempt);

    const privilegeEscalation = await this.detectPrivilegeEscalation(event);
    if (privilegeEscalation) threats.push(privilegeEscalation);

    const dataExfiltration = await this.detectDataExfiltration(event);
    if (dataExfiltration) threats.push(dataExfiltration);

    const ddosAttack = await this.detectDDoSAttack(event);
    if (ddosAttack) threats.push(ddosAttack);

    const anomalousBehavior = await this.detectAnomalousBehavior(event);
    if (anomalousBehavior) threats.push(anomalousBehavior);

    // Process and store threats
    for (const threat of threats) {
      await this.processThreatIndicator(threat);
    }

    return threats;
  }

  private async detectBruteForceAttack(event: any): Promise<ThreatIndicator | null> {
    if (event.type !== 'LOGIN_FAILED') return null;

    const source = event.source;
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    const threshold = 5; // 5 failed attempts

    // Count recent failed attempts from this source
    const recentFailures = await this.getRecentEvents(source, 'LOGIN_FAILED', timeWindow);
    
    if (recentFailures >= threshold) {
      return {
        id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: ThreatType.BRUTE_FORCE_ATTACK,
        level: ThreatLevel.HIGH,
        source,
        target: event.target,
        description: `Brute force attack detected: ${recentFailures} failed login attempts in ${timeWindow / 60000} minutes`,
        indicators: {
          failedAttempts: recentFailures,
          timeWindow: timeWindow / 60000,
          threshold,
          userAgent: event.metadata.userAgent,
          targetAccounts: [event.target]
        },
        confidence: 85,
        timestamp: new Date(),
        resolved: false,
        falsePositive: false
      };
    }

    return null;
  }

  private async detectSQLInjection(event: any): Promise<ThreatIndicator | null> {
    const sqlPatterns = [
      /(\bOR\b|\bAND\b).*(=|<|>|\bLIKE\b)/i,
      /UNION.*(SELECT|INSERT|UPDATE|DELETE)/i,
      /;\s*(DROP|DELETE|UPDATE|INSERT)/i,
      /--|\#|\/\*|\*\//,
      /\b(EXEC|EXECUTE|SP_|XP_)/i,
      /(\bSELECT\b.*\bFROM\b|\bINSERT\b.*\bINTO\b|\bUPDATE\b.*\bSET\b|\bDELETE\b.*\bFROM\b)/i
    ];

    const payload = JSON.stringify(event.metadata);
    
    for (const pattern of sqlPatterns) {
      if (pattern.test(payload)) {
        return {
          id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: ThreatType.SQL_INJECTION,
          level: ThreatLevel.HIGH,
          source: event.source,
          target: event.target,
          description: 'SQL injection attempt detected in request payload',
          indicators: {
            pattern: pattern.source,
            payload: payload.substring(0, 500), // Truncate for storage
            endpoint: event.metadata.endpoint,
            userAgent: event.metadata.userAgent
          },
          confidence: 90,
          timestamp: new Date(),
          resolved: false,
          falsePositive: false
        };
      }
    }

    return null;
  }

  private async detectXSSAttempt(event: any): Promise<ThreatIndicator | null> {
    const xssPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi,
      /<iframe[\s\S]*?>/gi,
      /<object[\s\S]*?>/gi,
      /eval\s*\(/gi,
      /document\.write/gi
    ];

    const payload = JSON.stringify(event.metadata);
    
    for (const pattern of xssPatterns) {
      if (pattern.test(payload)) {
        return {
          id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: ThreatType.XSS_ATTEMPT,
          level: ThreatLevel.MEDIUM,
          source: event.source,
          target: event.target,
          description: 'Cross-site scripting (XSS) attempt detected',
          indicators: {
            pattern: pattern.source,
            payload: payload.substring(0, 500),
            endpoint: event.metadata.endpoint,
            userAgent: event.metadata.userAgent
          },
          confidence: 80,
          timestamp: new Date(),
          resolved: false,
          falsePositive: false
        };
      }
    }

    return null;
  }

  private async detectPrivilegeEscalation(event: any): Promise<ThreatIndicator | null> {
    if (event.type !== 'PERMISSION_CHANGE' && event.type !== 'ROLE_CHANGE') return null;

    const userId = event.metadata.userId;
    const newPermissions = event.metadata.newPermissions || [];
    const oldPermissions = event.metadata.oldPermissions || [];
    
    // Check for suspicious privilege escalation
    const addedPermissions = newPermissions.filter((p: string) => !oldPermissions.includes(p));
    const highPrivilegePermissions = ['admin', 'superuser', 'owner', 'delete_all', 'manage_users'];
    
    const escalatedPrivileges = addedPermissions.filter((p: string) => 
      highPrivilegePermissions.some(hp => p.toLowerCase().includes(hp))
    );

    if (escalatedPrivileges.length > 0) {
      return {
        id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: ThreatType.PRIVILEGE_ESCALATION,
        level: ThreatLevel.HIGH,
        source: event.source,
        target: userId,
        description: 'Suspicious privilege escalation detected',
        indicators: {
          userId,
          escalatedPrivileges,
          addedPermissions,
          changedBy: event.metadata.changedBy,
          timestamp: event.timestamp
        },
        confidence: 75,
        timestamp: new Date(),
        resolved: false,
        falsePositive: false
      };
    }

    return null;
  }

  private async detectDataExfiltration(event: any): Promise<ThreatIndicator | null> {
    if (event.type !== 'DATA_EXPORT' && event.type !== 'FILE_DOWNLOAD') return null;

    const fileSize = event.metadata.fileSize || 0;
    const recordCount = event.metadata.recordCount || 0;
    const userId = event.metadata.userId;

    // Large data export threshold
    const suspiciousThresholds = {
      fileSize: 100 * 1024 * 1024, // 100MB
      recordCount: 10000, // 10K records
      offHours: this.isOffHours(new Date())
    };

    if (fileSize > suspiciousThresholds.fileSize || 
        recordCount > suspiciousThresholds.recordCount ||
        suspiciousThresholds.offHours) {
      
      const riskFactors: string[] = [];
      if (fileSize > suspiciousThresholds.fileSize) riskFactors.push('large_file_size');
      if (recordCount > suspiciousThresholds.recordCount) riskFactors.push('high_record_count');
      if (suspiciousThresholds.offHours) riskFactors.push('off_hours_access');

      return {
        id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: ThreatType.DATA_EXFILTRATION,
        level: riskFactors.length > 1 ? ThreatLevel.HIGH : ThreatLevel.MEDIUM,
        source: event.source,
        target: userId,
        description: 'Suspicious data export activity detected',
        indicators: {
          userId,
          fileSize,
          recordCount,
          riskFactors,
          exportType: event.metadata.exportType,
          timestamp: event.timestamp
        },
        confidence: 70,
        timestamp: new Date(),
        resolved: false,
        falsePositive: false
      };
    }

    return null;
  }

  private async detectDDoSAttack(event: any): Promise<ThreatIndicator | null> {
    const source = event.source;
    const timeWindow = 60 * 1000; // 1 minute
    const threshold = 100; // 100 requests per minute

    // Count recent requests from this source
    const recentRequests = await this.getRecentEvents(source, 'REQUEST', timeWindow);
    
    if (recentRequests >= threshold) {
      return {
        id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: ThreatType.DDoS_ATTACK,
        level: ThreatLevel.HIGH,
        source,
        description: `Potential DDoS attack: ${recentRequests} requests in ${timeWindow / 1000} seconds`,
        indicators: {
          requestCount: recentRequests,
          timeWindow: timeWindow / 1000,
          threshold,
          userAgent: event.metadata.userAgent,
          endpoints: event.metadata.endpoints || []
        },
        confidence: 80,
        timestamp: new Date(),
        resolved: false,
        falsePositive: false
      };
    }

    return null;
  }

  private async detectAnomalousBehavior(event: any): Promise<ThreatIndicator | null> {
    const userId = event.metadata.userId;
    if (!userId) return null;

    const profile = await this.getBehavioralProfile(userId);
    if (!profile) return null;

    const anomalyScore = await this.calculateAnomalyScore(profile, event);
    
    if (anomalyScore > 0.8) { // 80% anomaly threshold
      return {
        id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: ThreatType.ANOMALOUS_BEHAVIOR,
        level: anomalyScore > 0.9 ? ThreatLevel.HIGH : ThreatLevel.MEDIUM,
        source: event.source,
        target: userId,
        description: 'Anomalous user behavior detected',
        indicators: {
          userId,
          anomalyScore,
          deviations: profile.currentBehavior,
          baseline: profile.baseline,
          timestamp: event.timestamp
        },
        confidence: Math.round(anomalyScore * 100),
        timestamp: new Date(),
        resolved: false,
        falsePositive: false
      };
    }

    return null;
  }

  // ==================== BEHAVIORAL ANALYSIS ====================

  async updateBehavioralProfile(userId: string, event: any): Promise<void> {
    let profile = this.behavioralProfiles.get(userId);
    
    if (!profile) {
      profile = await this.createInitialProfile(userId);
    }

    // Update current behavior
    profile.currentBehavior = {
      sessionDuration: event.metadata.sessionDuration || 0,
      accessPattern: event.metadata.accessPattern || [],
      location: event.metadata.location || 'unknown',
      device: event.metadata.device || 'unknown',
      timestamp: Date.now()
    };

    // Update baseline (rolling average)
    this.updateBaseline(profile, event);
    
    // Calculate anomaly score
    profile.anomalyScore = await this.calculateAnomalyScore(profile, event);
    profile.lastUpdated = new Date();

    this.behavioralProfiles.set(userId, profile);

    // Store in Redis for persistence
    if (redis) {
      await redis.setex(
        `behavioral_profile:${userId}`,
        86400, // 24 hours
        JSON.stringify(profile)
      );
    }
  }

  private async createInitialProfile(userId: string): Promise<BehavioralProfile> {
    // Get historical data for baseline
    const historicalData = await this.getHistoricalUserData(userId);
    
    return {
      userId,
      baseline: {
        avgSessionDuration: historicalData.avgSessionDuration || 1800, // 30 minutes
        commonAccessPatterns: historicalData.commonAccessPatterns || [],
        typicalLocations: historicalData.typicalLocations || [],
        usualDevices: historicalData.usualDevices || [],
        activityTimestamps: historicalData.activityTimestamps || []
      },
      currentBehavior: {
        sessionDuration: 0,
        accessPattern: [],
        location: 'unknown',
        device: 'unknown',
        timestamp: Date.now()
      },
      anomalyScore: 0,
      lastUpdated: new Date()
    };
  }

  private updateBaseline(profile: BehavioralProfile, event: any): void {
    // Update session duration (rolling average)
    if (event.metadata.sessionDuration) {
      profile.baseline.avgSessionDuration = 
        (profile.baseline.avgSessionDuration * 0.9) + (event.metadata.sessionDuration * 0.1);
    }

    // Update access patterns
    if (event.metadata.accessPattern) {
      const pattern = event.metadata.accessPattern;
      if (!profile.baseline.commonAccessPatterns.includes(pattern)) {
        profile.baseline.commonAccessPatterns.push(pattern);
        // Keep only top 10 patterns
        if (profile.baseline.commonAccessPatterns.length > 10) {
          profile.baseline.commonAccessPatterns.shift();
        }
      }
    }

    // Update locations
    if (event.metadata.location) {
      const location = event.metadata.location;
      if (!profile.baseline.typicalLocations.includes(location)) {
        profile.baseline.typicalLocations.push(location);
        if (profile.baseline.typicalLocations.length > 5) {
          profile.baseline.typicalLocations.shift();
        }
      }
    }

    // Update devices
    if (event.metadata.device) {
      const device = event.metadata.device;
      if (!profile.baseline.usualDevices.includes(device)) {
        profile.baseline.usualDevices.push(device);
        if (profile.baseline.usualDevices.length > 3) {
          profile.baseline.usualDevices.shift();
        }
      }
    }
  }

  private async calculateAnomalyScore(profile: BehavioralProfile, event: any): Promise<number> {
    let anomalies = 0;
    let checks = 0;

    // Session duration anomaly
    checks++;
    const sessionDuration = event.metadata.sessionDuration || 0;
    const baselineDuration = profile.baseline.avgSessionDuration;
    if (Math.abs(sessionDuration - baselineDuration) > baselineDuration * 0.5) {
      anomalies++;
    }

    // Location anomaly
    checks++;
    const currentLocation = event.metadata.location || 'unknown';
    if (!profile.baseline.typicalLocations.includes(currentLocation)) {
      anomalies++;
    }

    // Device anomaly
    checks++;
    const currentDevice = event.metadata.device || 'unknown';
    if (!profile.baseline.usualDevices.includes(currentDevice)) {
      anomalies++;
    }

    // Time anomaly (off-hours activity)
    checks++;
    if (this.isOffHours(new Date())) {
      anomalies++;
    }

    return checks > 0 ? anomalies / checks : 0;
  }

  // ==================== INCIDENT MANAGEMENT ====================

  async createSecurityIncident(
    indicators: ThreatIndicator[],
    title?: string
  ): Promise<SecurityIncident> {
    const primaryIndicator = indicators[0];
    const incident: SecurityIncident = {
      id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title || `${primaryIndicator.type.replace('_', ' ')} - ${primaryIndicator.description}`,
      type: primaryIndicator.type,
      level: this.calculateIncidentLevel(indicators),
      status: 'OPEN',
      description: this.generateIncidentDescription(indicators),
      affectedAssets: this.extractAffectedAssets(indicators),
      indicators,
      timeline: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store incident
    this.securityIncidents.set(incident.id, incident);

    // Store in Redis
    if (redis) {
      await redis.setex(
        `security_incident:${incident.id}`,
        2592000, // 30 days
        JSON.stringify(incident)
      );
    }

    // Trigger automated response
    await this.triggerIncidentResponse(incident);

    await AuditLogger.logSystemEvent(
      AuditEventType.CREATE,
      {
        action: 'security_incident_created',
        incidentId: incident.id,
        type: incident.type,
        level: incident.level,
        indicatorCount: indicators.length
      }
    );

    return incident;
  }

  private async triggerIncidentResponse(incident: SecurityIncident): Promise<void> {
    const actions = this.determineResponseActions(incident);
    
    for (const action of actions) {
      await this.executeSecurityAction(action, incident);
    }
  }

  private determineResponseActions(incident: SecurityIncident): SecurityAction[] {
    const actions: SecurityAction[] = [];

    switch (incident.level) {
      case ThreatLevel.CRITICAL:
        actions.push(SecurityAction.ESCALATE);
        actions.push(SecurityAction.AUTO_REMEDIATE);
        if (incident.type === ThreatType.BRUTE_FORCE_ATTACK || incident.type === ThreatType.DDoS_ATTACK) {
          actions.push(SecurityAction.BLOCK_IP);
        }
        if (incident.type === ThreatType.ACCOUNT_TAKEOVER) {
          actions.push(SecurityAction.DISABLE_ACCOUNT);
        }
        break;

      case ThreatLevel.HIGH:
        actions.push(SecurityAction.ALERT);
        if (incident.type === ThreatType.BRUTE_FORCE_ATTACK) {
          actions.push(SecurityAction.BLOCK_IP);
        }
        if (incident.type === ThreatType.MALWARE_DETECTION) {
          actions.push(SecurityAction.QUARANTINE);
        }
        break;

      case ThreatLevel.MEDIUM:
        actions.push(SecurityAction.ALERT);
        actions.push(SecurityAction.MONITOR);
        break;

      case ThreatLevel.LOW:
        actions.push(SecurityAction.MONITOR);
        break;
    }

    return actions;
  }

  private async executeSecurityAction(action: SecurityAction, incident: SecurityIncident): Promise<void> {
    try {
      switch (action) {
        case SecurityAction.BLOCK_IP:
          await this.blockIPAddress(incident);
          break;

        case SecurityAction.DISABLE_ACCOUNT:
          await this.disableUserAccount(incident);
          break;

        case SecurityAction.QUARANTINE:
          await this.quarantineAsset(incident);
          break;

        case SecurityAction.ALERT:
          await this.sendSecurityAlert(incident);
          break;

        case SecurityAction.ESCALATE:
          await this.escalateIncident(incident);
          break;

        case SecurityAction.AUTO_REMEDIATE:
          await this.autoRemediate(incident);
          break;

        case SecurityAction.MONITOR:
          await this.enhanceMonitoring(incident);
          break;
      }

      // Log action execution
      incident.timeline.push({
        id: `event_${Date.now()}`,
        timestamp: new Date(),
        type: 'ACTION_EXECUTED',
        source: 'AUTOMATED_RESPONSE',
        message: `Executed security action: ${action}`,
        metadata: { action, incidentId: incident.id },
        severity: ThreatLevel.LOW
      });

    } catch (error) {
      console.error(`Failed to execute security action ${action}:`, error);
    }
  }

  // ==================== HELPER METHODS ====================

  private async getRecentEvents(source: string, type: string, timeWindow: number): Promise<number> {
    if (!redis) return 0;

    const key = `security_events:${source}:${type}`;
    const now = Date.now();
    const cutoff = now - timeWindow;

    // Count events in time window
    const count = await redis.zcount(key, cutoff, now);
    return count;
  }

  private async getBehavioralProfile(userId: string): Promise<BehavioralProfile | null> {
    let profile = this.behavioralProfiles.get(userId);
    
    if (!profile && redis) {
      const stored = await redis.get(`behavioral_profile:${userId}`);
      if (stored) {
        profile = JSON.parse(stored);
        this.behavioralProfiles.set(userId, profile!);
      }
    }

    return profile || null;
  }

  private async getHistoricalUserData(userId: string): Promise<any> {
    // Get user's historical activity data
    const auditLogs = await prisma.auditLog.findMany({
      where: { userId },
      take: 100,
      orderBy: { createdAt: 'desc' }
    });

    return {
      avgSessionDuration: 1800, // Default 30 minutes
      commonAccessPatterns: [],
      typicalLocations: [],
      usualDevices: [],
      activityTimestamps: auditLogs.map(log => log.createdAt.getTime())
    };
  }

  private isOffHours(date: Date): boolean {
    const hour = date.getHours();
    const day = date.getDay();
    
    // Weekend or outside 9-5
    return day === 0 || day === 6 || hour < 9 || hour > 17;
  }

  private calculateIncidentLevel(indicators: ThreatIndicator[]): ThreatLevel {
    const levels = indicators.map(i => i.level);
    
    if (levels.includes(ThreatLevel.CRITICAL)) return ThreatLevel.CRITICAL;
    if (levels.includes(ThreatLevel.HIGH)) return ThreatLevel.HIGH;
    if (levels.includes(ThreatLevel.MEDIUM)) return ThreatLevel.MEDIUM;
    return ThreatLevel.LOW;
  }

  private generateIncidentDescription(indicators: ThreatIndicator[]): string {
    const types = [...new Set(indicators.map(i => i.type))];
    const sources = [...new Set(indicators.map(i => i.source))];
    
    return `Security incident involving ${types.join(', ')} from ${sources.length} source(s). ${indicators.length} threat indicator(s) detected.`;
  }

  private extractAffectedAssets(indicators: ThreatIndicator[]): string[] {
    const assets = new Set<string>();
    
    indicators.forEach(indicator => {
      if (indicator.source) assets.add(indicator.source);
      if (indicator.target) assets.add(indicator.target);
    });

    return Array.from(assets);
  }

  private async processThreatIndicator(threat: ThreatIndicator): Promise<void> {
    // Store threat indicator
    this.threatIndicators.set(threat.id, threat);

    // Store in Redis
    if (redis) {
      await redis.setex(
        `threat_indicator:${threat.id}`,
        86400, // 24 hours
        JSON.stringify(threat)
      );

      // Add to timeline
      await redis.zadd(
        'security_timeline',
        threat.timestamp.getTime(),
        JSON.stringify({
          id: threat.id,
          type: threat.type,
          level: threat.level,
          source: threat.source
        })
      );
    }

    // Check if incident should be created
    if (threat.level === ThreatLevel.HIGH || threat.level === ThreatLevel.CRITICAL) {
      await this.createSecurityIncident([threat]);
    }
  }

  private async blockIPAddress(incident: SecurityIncident): Promise<void> {
    const ips = incident.affectedAssets.filter(asset => 
      /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(asset)
    );

    for (const ip of ips) {
      if (redis) {
        await redis.setex(`blocked_ip:${ip}`, 3600, 'SECURITY_INCIDENT'); // 1 hour block
      }
    }
  }

  private async disableUserAccount(incident: SecurityIncident): Promise<void> {
    const userIds = incident.affectedAssets.filter(asset => 
      asset.startsWith('user_') || asset.includes('@')
    );

    for (const userId of userIds) {
      // Mark user as disabled due to security incident
      if (redis) {
        await redis.setex(`disabled_user:${userId}`, 3600, incident.id);
      }
    }
  }

  private async quarantineAsset(incident: SecurityIncident): Promise<void> {
    // Quarantine affected assets
    console.log(`Quarantining assets for incident: ${incident.id}`);
  }

  private async sendSecurityAlert(incident: SecurityIncident): Promise<void> {
    // Send alert to security team
    console.log(`Security Alert: ${incident.title} - Level: ${incident.level}`);
  }

  private async escalateIncident(incident: SecurityIncident): Promise<void> {
    // Escalate to senior security team
    incident.status = 'INVESTIGATING';
    console.log(`Escalating incident: ${incident.id}`);
  }

  private async autoRemediate(incident: SecurityIncident): Promise<void> {
    // Automated remediation actions
    console.log(`Auto-remediating incident: ${incident.id}`);
  }

  private async enhanceMonitoring(incident: SecurityIncident): Promise<void> {
    // Increase monitoring for affected assets
    console.log(`Enhanced monitoring for incident: ${incident.id}`);
  }

  private async initializeThreatIntelligence(): Promise<void> {
    // Initialize with known malicious IPs and patterns
    const maliciousIPs = [
      // Add known malicious IP ranges
    ];

    const suspiciousUserAgents = [
      'sqlmap',
      'nikto',
      'nmap',
      'masscan',
      'gobuster'
    ];

    maliciousIPs.forEach(ip => this.threatIntelligence.maliciousIPs.add(ip));
    suspiciousUserAgents.forEach(ua => this.threatIntelligence.suspiciousUserAgents.add(ua));
  }

  // ==================== PUBLIC API ====================

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🔍 Advanced Threat Detection Engine started');

    // Start periodic threat intelligence updates
    setInterval(async () => {
      await this.updateThreatIntelligence();
    }, 3600000); // Every hour

    // Start behavioral profile maintenance
    setInterval(async () => {
      await this.maintainBehavioralProfiles();
    }, 1800000); // Every 30 minutes
  }

  async stopMonitoring(): Promise<void> {
    this.isMonitoring = false;
    console.log('🛑 Advanced Threat Detection Engine stopped');
  }

  async getThreatSummary(): Promise<{
    activeThreats: number;
    openIncidents: number;
    threatsByLevel: Record<ThreatLevel, number>;
    topThreatTypes: { type: ThreatType; count: number }[];
  }> {
    const threats = Array.from(this.threatIndicators.values());
    const incidents = Array.from(this.securityIncidents.values());
    
    const threatsByLevel = {
      [ThreatLevel.LOW]: 0,
      [ThreatLevel.MEDIUM]: 0,
      [ThreatLevel.HIGH]: 0,
      [ThreatLevel.CRITICAL]: 0
    };

    const threatTypeCounts = new Map<ThreatType, number>();

    threats.forEach(threat => {
      if (!threat.resolved) {
        threatsByLevel[threat.level]++;
        threatTypeCounts.set(threat.type, (threatTypeCounts.get(threat.type) || 0) + 1);
      }
    });

    const topThreatTypes = Array.from(threatTypeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      activeThreats: threats.filter(t => !t.resolved).length,
      openIncidents: incidents.filter(i => i.status !== 'RESOLVED').length,
      threatsByLevel,
      topThreatTypes
    };
  }

  private async updateThreatIntelligence(): Promise<void> {
    // Update threat intelligence feeds
    this.threatIntelligence.lastUpdated = new Date();
  }

  private async maintainBehavioralProfiles(): Promise<void> {
    // Clean up old behavioral profiles
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    for (const [userId, profile] of this.behavioralProfiles.entries()) {
      if (now - profile.lastUpdated.getTime() > maxAge) {
        this.behavioralProfiles.delete(userId);
        if (redis) {
          await redis.del(`behavioral_profile:${userId}`);
        }
      }
    }
  }
}

export const threatDetectionEngine = AdvancedThreatDetectionEngine.getInstance();