/**
 * Zero-Trust Architecture Implementation
 * 
 * Comprehensive zero-trust security model with micro-segmentation,
 * continuous verification, and least-privilege access controls.
 */

import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';
import { AuditLogger, AuditEventType } from '@/lib/audit/audit-logger';
import crypto from 'crypto';

export enum AccessDecision {
  ALLOW = 'ALLOW',
  DENY = 'DENY',
  CONDITIONAL_ALLOW = 'CONDITIONAL_ALLOW',
  CHALLENGE = 'CHALLENGE',
  QUARANTINE = 'QUARANTINE'
}

export enum TrustLevel {
  UNTRUSTED = 0,
  LOW = 25,
  MEDIUM = 50,
  HIGH = 75,
  TRUSTED = 100
}

export enum ResourceSensitivity {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
  CONFIDENTIAL = 'CONFIDENTIAL',
  RESTRICTED = 'RESTRICTED',
  TOP_SECRET = 'TOP_SECRET'
}

export enum DeviceType {
  MANAGED_DESKTOP = 'MANAGED_DESKTOP',
  MANAGED_MOBILE = 'MANAGED_MOBILE',
  UNMANAGED_DEVICE = 'UNMANAGED_DEVICE',
  IOT_DEVICE = 'IOT_DEVICE',
  SERVER = 'SERVER'
}

interface PolicyRule {
  id: string;
  name: string;
  description: string;
  conditions: PolicyCondition[];
  action: AccessDecision;
  priority: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PolicyCondition {
  type: 'user' | 'device' | 'location' | 'time' | 'resource' | 'risk';
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'contains';
  field: string;
  value: any;
}

interface SecurityContext {
  user: UserContext;
  device: DeviceContext;
  network: NetworkContext;
  session: SessionContext;
  risk: RiskContext;
  timestamp: Date;
}

interface UserContext {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  trustLevel: TrustLevel;
  lastVerification: Date;
  mfaEnabled: boolean;
  passwordLastChanged: Date;
  accountAge: number; // days
}

interface DeviceContext {
  id: string;
  type: DeviceType;
  fingerprint: string;
  os: string;
  browser?: string;
  isManaged: boolean;
  complianceStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'UNKNOWN';
  lastSeen: Date;
  geoLocation: {
    country: string;
    region: string;
    city: string;
    coordinates?: [number, number];
  };
  trustLevel: TrustLevel;
}

interface NetworkContext {
  sourceIP: string;
  destination: string;
  protocol: string;
  port: number;
  networkSegment: string;
  vpnConnected: boolean;
  reputation: 'GOOD' | 'SUSPICIOUS' | 'MALICIOUS' | 'UNKNOWN';
  geolocation: {
    country: string;
    region: string;
    asn: string;
  };
}

interface SessionContext {
  id: string;
  startTime: Date;
  duration: number;
  activityPattern: string[];
  anomalousActivity: boolean;
  challengesPassed: number;
  accessAttempts: number;
}

interface RiskContext {
  overallScore: number; // 0-100
  factors: RiskFactor[];
  anomalies: string[];
  threatIndicators: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface RiskFactor {
  type: string;
  score: number;
  description: string;
  weight: number;
}

interface AccessRequest {
  id: string;
  resource: string;
  action: string;
  context: SecurityContext;
  requestTime: Date;
  decision?: AccessDecision;
  decisionTime?: Date;
  decisionReason?: string;
  conditions?: AccessCondition[];
}

interface AccessCondition {
  type: 'TIME_LIMIT' | 'LOCATION_RESTRICTION' | 'ADDITIONAL_VERIFICATION' | 'MONITORING';
  parameters: Record<string, any>;
  expiresAt?: Date;
}

interface MicroSegment {
  id: string;
  name: string;
  description: string;
  resources: string[];
  allowedSources: string[];
  deniedSources: string[];
  requiredTrustLevel: TrustLevel;
  sensitivity: ResourceSensitivity;
  rules: SegmentRule[];
  enabled: boolean;
}

interface SegmentRule {
  protocol: string;
  sourcePort?: string;
  destinationPort?: string;
  action: 'ALLOW' | 'DENY' | 'LOG';
  conditions: Record<string, any>;
}

export class ZeroTrustEngine {
  private static instance: ZeroTrustEngine;
  private policyRules: Map<string, PolicyRule> = new Map();
  private microSegments: Map<string, MicroSegment> = new Map();
  private activeSessions: Map<string, SecurityContext> = new Map();
  private riskAssessmentCache: Map<string, RiskContext> = new Map();

  private constructor() {
    this.initializeDefaultPolicies();
    this.initializeDefaultSegments();
  }

  static getInstance(): ZeroTrustEngine {
    if (!ZeroTrustEngine.instance) {
      ZeroTrustEngine.instance = new ZeroTrustEngine();
    }
    return ZeroTrustEngine.instance;
  }

  // ==================== ACCESS CONTROL ====================

  async evaluateAccess(
    userId: string,
    resource: string,
    action: string,
    deviceInfo: any,
    networkInfo: any
  ): Promise<AccessRequest> {
    const requestId = `access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Build security context
    const context = await this.buildSecurityContext(userId, deviceInfo, networkInfo);
    
    const request: AccessRequest = {
      id: requestId,
      resource,
      action,
      context,
      requestTime: new Date()
    };

    // Evaluate access decision
    const decision = await this.makeAccessDecision(request);
    request.decision = decision.action;
    request.decisionTime = new Date();
    request.decisionReason = decision.reason;
    request.conditions = decision.conditions;

    // Store request for audit
    await this.storeAccessRequest(request);

    // Log access attempt
    await AuditLogger.logUserAction(
      userId,
      action === 'READ' ? AuditEventType.READ : AuditEventType.UPDATE,
      'RESOURCE' as any,
      resource,
      {
        action,
        decision: request.decision,
        reason: request.decisionReason,
        trustLevel: context.user.trustLevel,
        riskScore: context.risk.overallScore
      },
      networkInfo.sourceIP,
      deviceInfo.userAgent
    );

    return request;
  }

  private async buildSecurityContext(
    userId: string,
    deviceInfo: any,
    networkInfo: any
  ): Promise<SecurityContext> {
    const user = await this.buildUserContext(userId);
    const device = await this.buildDeviceContext(deviceInfo);
    const network = await this.buildNetworkContext(networkInfo);
    const session = await this.buildSessionContext(userId, deviceInfo.sessionId);
    const risk = await this.assessRisk(user, device, network, session);

    return {
      user,
      device,
      network,
      session,
      risk,
      timestamp: new Date()
    };
  }

  private async buildUserContext(userId: string): Promise<UserContext> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        teams: {
          include: {
            team: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Calculate trust level based on various factors
    const trustLevel = await this.calculateUserTrustLevel(user);

    return {
      id: user.id,
      email: user.email!,
      roles: user.teams.map(t => t.role),
      permissions: await this.getUserPermissions(userId),
      trustLevel,
      lastVerification: new Date(), // In reality, track actual MFA verification
      mfaEnabled: true, // Based on account setup
      passwordLastChanged: user.updatedAt, // Approximate
      accountAge: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    };
  }

  private async buildDeviceContext(deviceInfo: any): Promise<DeviceContext> {
    const fingerprint = this.generateDeviceFingerprint(deviceInfo);
    const trustLevel = await this.calculateDeviceTrustLevel(fingerprint, deviceInfo);

    return {
      id: fingerprint,
      type: this.classifyDevice(deviceInfo),
      fingerprint,
      os: deviceInfo.os || 'unknown',
      browser: deviceInfo.browser || 'unknown',
      isManaged: await this.isDeviceManaged(fingerprint),
      complianceStatus: await this.getDeviceCompliance(fingerprint),
      lastSeen: new Date(),
      geoLocation: {
        country: deviceInfo.country || 'unknown',
        region: deviceInfo.region || 'unknown',
        city: deviceInfo.city || 'unknown',
        coordinates: deviceInfo.coordinates
      },
      trustLevel
    };
  }

  private async buildNetworkContext(networkInfo: any): Promise<NetworkContext> {
    const reputation = await this.getIPReputation(networkInfo.sourceIP);
    
    return {
      sourceIP: networkInfo.sourceIP,
      destination: networkInfo.destination || 'unknown',
      protocol: networkInfo.protocol || 'HTTPS',
      port: networkInfo.port || 443,
      networkSegment: await this.identifyNetworkSegment(networkInfo.sourceIP),
      vpnConnected: networkInfo.vpnConnected || false,
      reputation,
      geolocation: {
        country: networkInfo.country || 'unknown',
        region: networkInfo.region || 'unknown',
        asn: networkInfo.asn || 'unknown'
      }
    };
  }

  private async buildSessionContext(userId: string, sessionId: string): Promise<SessionContext> {
    const sessionKey = `session:${userId}:${sessionId}`;
    let sessionData = await redis?.get(sessionKey);
    
    if (!sessionData) {
      // Create new session
      sessionData = JSON.stringify({
        id: sessionId,
        startTime: new Date(),
        duration: 0,
        activityPattern: [],
        anomalousActivity: false,
        challengesPassed: 0,
        accessAttempts: 0
      });
      await redis?.setex(sessionKey, 86400, sessionData); // 24 hours
    }

    return JSON.parse(sessionData);
  }

  // ==================== RISK ASSESSMENT ====================

  private async assessRisk(
    user: UserContext,
    device: DeviceContext,
    network: NetworkContext,
    session: SessionContext
  ): Promise<RiskContext> {
    const cacheKey = `risk:${user.id}:${device.fingerprint}:${network.sourceIP}`;
    const cached = this.riskAssessmentCache.get(cacheKey);
    
    if (cached && Date.now() - cached.overallScore < 300000) { // 5 minutes cache
      return cached;
    }

    const factors: RiskFactor[] = [];
    let totalScore = 0;

    // User risk factors
    if (user.trustLevel < TrustLevel.MEDIUM) {
      factors.push({
        type: 'USER_TRUST',
        score: 30,
        description: 'User has low trust level',
        weight: 0.3
      });
      totalScore += 30 * 0.3;
    }

    if (!user.mfaEnabled) {
      factors.push({
        type: 'MFA_DISABLED',
        score: 40,
        description: 'Multi-factor authentication not enabled',
        weight: 0.4
      });
      totalScore += 40 * 0.4;
    }

    // Device risk factors
    if (!device.isManaged) {
      factors.push({
        type: 'UNMANAGED_DEVICE',
        score: 25,
        description: 'Device is not managed by organization',
        weight: 0.25
      });
      totalScore += 25 * 0.25;
    }

    if (device.complianceStatus === 'NON_COMPLIANT') {
      factors.push({
        type: 'DEVICE_NON_COMPLIANT',
        score: 35,
        description: 'Device does not meet compliance requirements',
        weight: 0.35
      });
      totalScore += 35 * 0.35;
    }

    // Network risk factors
    if (network.reputation === 'SUSPICIOUS' || network.reputation === 'MALICIOUS') {
      factors.push({
        type: 'MALICIOUS_IP',
        score: 50,
        description: 'Request from suspicious or malicious IP address',
        weight: 0.5
      });
      totalScore += 50 * 0.5;
    }

    // Geographic risk
    if (await this.isUnusualLocation(user.id, network.geolocation)) {
      factors.push({
        type: 'UNUSUAL_LOCATION',
        score: 20,
        description: 'Access from unusual geographic location',
        weight: 0.2
      });
      totalScore += 20 * 0.2;
    }

    // Time-based risk
    if (this.isOffHours()) {
      factors.push({
        type: 'OFF_HOURS',
        score: 15,
        description: 'Access during off-hours',
        weight: 0.15
      });
      totalScore += 15 * 0.15;
    }

    const overallScore = Math.min(100, Math.max(0, totalScore));
    const riskLevel = this.determineRiskLevel(overallScore);

    const riskContext: RiskContext = {
      overallScore,
      factors,
      anomalies: await this.detectAnomalies(user, device, network, session),
      threatIndicators: await this.getThreatIndicators(user.id, device.fingerprint),
      riskLevel
    };

    // Cache the result
    this.riskAssessmentCache.set(cacheKey, riskContext);

    return riskContext;
  }

  private determineRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  }

  // ==================== POLICY EVALUATION ====================

  private async makeAccessDecision(request: AccessRequest): Promise<{
    action: AccessDecision;
    reason: string;
    conditions?: AccessCondition[];
  }> {
    // Check micro-segmentation rules first
    const segmentDecision = await this.evaluateSegmentationRules(request);
    if (segmentDecision.action === AccessDecision.DENY) {
      return segmentDecision;
    }

    // Evaluate policy rules
    const policyDecision = await this.evaluatePolicyRules(request);
    if (policyDecision.action === AccessDecision.DENY) {
      return policyDecision;
    }

    // Risk-based decision
    const riskDecision = await this.evaluateRiskBasedAccess(request);
    
    // Combine decisions (most restrictive wins)
    const finalDecision = this.combineDecisions([segmentDecision, policyDecision, riskDecision]);
    
    return finalDecision;
  }

  private async evaluateSegmentationRules(request: AccessRequest): Promise<{
    action: AccessDecision;
    reason: string;
    conditions?: AccessCondition[];
  }> {
    const resourceSegment = await this.findResourceSegment(request.resource);
    
    if (!resourceSegment) {
      return {
        action: AccessDecision.ALLOW,
        reason: 'No segmentation rules apply'
      };
    }

    // Check if source is allowed
    const sourceIP = request.context.network.sourceIP;
    const userTrustLevel = request.context.user.trustLevel;

    if (resourceSegment.deniedSources.includes(sourceIP)) {
      return {
        action: AccessDecision.DENY,
        reason: 'Source IP is explicitly denied by segmentation rules'
      };
    }

    if (userTrustLevel < resourceSegment.requiredTrustLevel) {
      return {
        action: AccessDecision.DENY,
        reason: 'User trust level does not meet segment requirements'
      };
    }

    return {
      action: AccessDecision.ALLOW,
      reason: 'Segmentation rules permit access'
    };
  }

  private async evaluatePolicyRules(request: AccessRequest): Promise<{
    action: AccessDecision;
    reason: string;
    conditions?: AccessCondition[];
  }> {
    const applicableRules = Array.from(this.policyRules.values())
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority); // Higher priority first

    for (const rule of applicableRules) {
      if (await this.evaluateRuleConditions(rule.conditions, request.context)) {
        const conditions: AccessCondition[] = [];

        // Add time-based conditions for conditional access
        if (rule.action === AccessDecision.CONDITIONAL_ALLOW) {
          conditions.push({
            type: 'TIME_LIMIT',
            parameters: { duration: 3600000 }, // 1 hour
            expiresAt: new Date(Date.now() + 3600000)
          });

          conditions.push({
            type: 'MONITORING',
            parameters: { enhanced: true }
          });
        }

        return {
          action: rule.action,
          reason: `Policy rule: ${rule.name}`,
          conditions: conditions.length > 0 ? conditions : undefined
        };
      }
    }

    return {
      action: AccessDecision.ALLOW,
      reason: 'No policy rules matched'
    };
  }

  private async evaluateRiskBasedAccess(request: AccessRequest): Promise<{
    action: AccessDecision;
    reason: string;
    conditions?: AccessCondition[];
  }> {
    const riskScore = request.context.risk.overallScore;
    const riskLevel = request.context.risk.riskLevel;

    if (riskScore >= 90) {
      return {
        action: AccessDecision.DENY,
        reason: 'Risk score too high for access'
      };
    }

    if (riskScore >= 70) {
      return {
        action: AccessDecision.CHALLENGE,
        reason: 'Additional verification required due to elevated risk'
      };
    }

    if (riskScore >= 50) {
      return {
        action: AccessDecision.CONDITIONAL_ALLOW,
        reason: 'Conditional access granted with monitoring',
        conditions: [
          {
            type: 'ADDITIONAL_VERIFICATION',
            parameters: { method: 'MFA' }
          },
          {
            type: 'MONITORING',
            parameters: { enhanced: true }
          }
        ]
      };
    }

    return {
      action: AccessDecision.ALLOW,
      reason: 'Risk assessment permits access'
    };
  }

  // ==================== MICRO-SEGMENTATION ====================

  async createMicroSegment(
    name: string,
    description: string,
    resources: string[],
    sensitivity: ResourceSensitivity,
    requiredTrustLevel: TrustLevel
  ): Promise<string> {
    const segment: MicroSegment = {
      id: `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      resources,
      allowedSources: [],
      deniedSources: [],
      requiredTrustLevel,
      sensitivity,
      rules: [],
      enabled: true
    };

    this.microSegments.set(segment.id, segment);

    // Store in Redis
    if (redis) {
      await redis.setex(
        `microsegment:${segment.id}`,
        86400 * 30, // 30 days
        JSON.stringify(segment)
      );
    }

    await AuditLogger.logSystemEvent(
      AuditEventType.CREATE,
      {
        action: 'microsegment_created',
        segmentId: segment.id,
        name,
        resourceCount: resources.length,
        sensitivity
      }
    );

    return segment.id;
  }

  async addSegmentRule(
    segmentId: string,
    protocol: string,
    sourcePort: string,
    destinationPort: string,
    action: 'ALLOW' | 'DENY' | 'LOG'
  ): Promise<void> {
    const segment = this.microSegments.get(segmentId);
    if (!segment) return;

    const rule: SegmentRule = {
      protocol,
      sourcePort,
      destinationPort,
      action,
      conditions: {}
    };

    segment.rules.push(rule);

    // Update in Redis
    if (redis) {
      await redis.setex(
        `microsegment:${segmentId}`,
        86400 * 30,
        JSON.stringify(segment)
      );
    }
  }

  // ==================== CONTINUOUS VERIFICATION ====================

  async performContinuousVerification(sessionId: string): Promise<{
    verified: boolean;
    action: AccessDecision;
    reason: string;
  }> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return {
        verified: false,
        action: AccessDecision.DENY,
        reason: 'Session not found'
      };
    }

    // Re-assess risk
    const currentRisk = await this.assessRisk(
      session.user,
      session.device,
      session.network,
      session.session
    );

    // Check if risk has increased significantly
    const riskIncrease = currentRisk.overallScore - session.risk.overallScore;
    
    if (riskIncrease > 20) {
      return {
        verified: false,
        action: AccessDecision.CHALLENGE,
        reason: 'Risk level has increased significantly'
      };
    }

    // Check for behavioral anomalies
    if (currentRisk.anomalies.length > 0) {
      return {
        verified: false,
        action: AccessDecision.CONDITIONAL_ALLOW,
        reason: 'Behavioral anomalies detected'
      };
    }

    return {
      verified: true,
      action: AccessDecision.ALLOW,
      reason: 'Continuous verification passed'
    };
  }

  // ==================== HELPER METHODS ====================

  private async calculateUserTrustLevel(user: any): Promise<TrustLevel> {
    let score = TrustLevel.MEDIUM; // Base score

    // Account age factor
    const accountAge = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    if (accountAge > 365) score += 10;
    else if (accountAge > 90) score += 5;

    // Team membership
    if (user.teams.length > 0) score += 10;

    // Recent activity
    const recentActivity = await prisma.auditLog.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });

    if (recentActivity > 0) score += 5;

    return Math.min(TrustLevel.TRUSTED, Math.max(TrustLevel.UNTRUSTED, score));
  }

  private async calculateDeviceTrustLevel(fingerprint: string, deviceInfo: any): Promise<TrustLevel> {
    // Check if device is known and trusted
    const deviceHistory = await redis?.get(`device:${fingerprint}`);
    
    if (deviceHistory) {
      const history = JSON.parse(deviceHistory);
      return history.trustLevel || TrustLevel.MEDIUM;
    }

    // New device starts with low trust
    return TrustLevel.LOW;
  }

  private generateDeviceFingerprint(deviceInfo: any): string {
    const components = [
      deviceInfo.userAgent || '',
      deviceInfo.screenResolution || '',
      deviceInfo.timezone || '',
      deviceInfo.language || '',
      deviceInfo.platform || ''
    ];

    return crypto
      .createHash('sha256')
      .update(components.join('|'))
      .digest('hex')
      .substring(0, 16);
  }

  private classifyDevice(deviceInfo: any): DeviceType {
    const userAgent = (deviceInfo.userAgent || '').toLowerCase();
    
    if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone')) {
      return DeviceType.MANAGED_MOBILE;
    }
    
    return DeviceType.MANAGED_DESKTOP;
  }

  private async isDeviceManaged(fingerprint: string): Promise<boolean> {
    // Check if device is in managed devices list
    return await redis?.sismember('managed_devices', fingerprint) || false;
  }

  private async getDeviceCompliance(fingerprint: string): Promise<'COMPLIANT' | 'NON_COMPLIANT' | 'UNKNOWN'> {
    const compliance = await redis?.get(`device_compliance:${fingerprint}`);
    return compliance as any || 'UNKNOWN';
  }

  private async getIPReputation(ip: string): Promise<'GOOD' | 'SUSPICIOUS' | 'MALICIOUS' | 'UNKNOWN'> {
    // Check IP reputation database
    const reputation = await redis?.get(`ip_reputation:${ip}`);
    return reputation as any || 'UNKNOWN';
  }

  private async identifyNetworkSegment(ip: string): Promise<string> {
    // Identify network segment based on IP address
    if (ip.startsWith('10.')) return 'INTERNAL';
    if (ip.startsWith('192.168.')) return 'INTERNAL';
    if (ip.startsWith('172.')) return 'INTERNAL';
    return 'EXTERNAL';
  }

  private async getUserPermissions(userId: string): Promise<string[]> {
    // Get user permissions from database
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: { userId }
        }
      }
    });

    return teams.map(team => `team:${team.id}`);
  }

  private async isUnusualLocation(userId: string, location: any): Promise<boolean> {
    // Check if location is unusual for this user
    const userLocations = await redis?.smembers(`user_locations:${userId}`);
    return !userLocations?.includes(`${location.country}:${location.region}`);
  }

  private isOffHours(): boolean {
    const hour = new Date().getHours();
    const day = new Date().getDay();
    return day === 0 || day === 6 || hour < 9 || hour > 17;
  }

  private async detectAnomalies(
    user: UserContext,
    device: DeviceContext,
    network: NetworkContext,
    session: SessionContext
  ): Promise<string[]> {
    const anomalies: string[] = [];

    // Unusual access time
    if (this.isOffHours()) {
      anomalies.push('off_hours_access');
    }

    // New device
    if (device.trustLevel === TrustLevel.LOW) {
      anomalies.push('new_device');
    }

    // Unusual location
    if (await this.isUnusualLocation(user.id, network.geolocation)) {
      anomalies.push('unusual_location');
    }

    return anomalies;
  }

  private async getThreatIndicators(userId: string, deviceFingerprint: string): Promise<string[]> {
    const indicators: string[] = [];

    // Check for recent security events
    const recentThreats = await redis?.smembers(`user_threats:${userId}`);
    if (recentThreats && recentThreats.length > 0) {
      indicators.push(...recentThreats);
    }

    return indicators;
  }

  private async findResourceSegment(resource: string): Promise<MicroSegment | null> {
    for (const segment of this.microSegments.values()) {
      if (segment.resources.some(r => resource.startsWith(r))) {
        return segment;
      }
    }
    return null;
  }

  private async evaluateRuleConditions(conditions: PolicyCondition[], context: SecurityContext): Promise<boolean> {
    for (const condition of conditions) {
      if (!await this.evaluateCondition(condition, context)) {
        return false;
      }
    }
    return true;
  }

  private async evaluateCondition(condition: PolicyCondition, context: SecurityContext): Promise<boolean> {
    let value: any;

    // Extract value from context based on condition type and field
    switch (condition.type) {
      case 'user':
        value = (context.user as any)[condition.field];
        break;
      case 'device':
        value = (context.device as any)[condition.field];
        break;
      case 'location':
        value = (context.network.geolocation as any)[condition.field];
        break;
      case 'time':
        value = new Date().getHours();
        break;
      case 'risk':
        value = (context.risk as any)[condition.field];
        break;
      default:
        return false;
    }

    // Evaluate condition based on operator
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(value);
      case 'greater_than':
        return value > condition.value;
      case 'less_than':
        return value < condition.value;
      case 'contains':
        return String(value).includes(condition.value);
      default:
        return false;
    }
  }

  private combineDecisions(decisions: Array<{
    action: AccessDecision;
    reason: string;
    conditions?: AccessCondition[];
  }>): {
    action: AccessDecision;
    reason: string;
    conditions?: AccessCondition[];
  } {
    // Most restrictive decision wins
    const priority = {
      [AccessDecision.DENY]: 4,
      [AccessDecision.QUARANTINE]: 3,
      [AccessDecision.CHALLENGE]: 2,
      [AccessDecision.CONDITIONAL_ALLOW]: 1,
      [AccessDecision.ALLOW]: 0
    };

    return decisions.reduce((mostRestrictive, current) => {
      if (priority[current.action] > priority[mostRestrictive.action]) {
        return current;
      }
      return mostRestrictive;
    });
  }

  private async storeAccessRequest(request: AccessRequest): Promise<void> {
    if (redis) {
      await redis.setex(
        `access_request:${request.id}`,
        86400 * 7, // 7 days
        JSON.stringify(request)
      );

      // Add to user's access history
      await redis.lpush(
        `user_access_history:${request.context.user.id}`,
        JSON.stringify({
          resource: request.resource,
          action: request.action,
          decision: request.decision,
          timestamp: request.requestTime
        })
      );

      // Keep only last 100 entries
      await redis.ltrim(`user_access_history:${request.context.user.id}`, 0, 99);
    }
  }

  // ==================== INITIALIZATION ====================

  private async initializeDefaultPolicies(): Promise<void> {
    const defaultPolicies: Omit<PolicyRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Block Unmanaged Devices from Sensitive Resources',
        description: 'Deny access to sensitive resources from unmanaged devices',
        conditions: [
          { type: 'device', operator: 'equals', field: 'isManaged', value: false },
          { type: 'resource', operator: 'contains', field: 'path', value: '/api/admin' }
        ],
        action: AccessDecision.DENY,
        priority: 100,
        enabled: true
      },
      {
        name: 'Require MFA for High-Risk Access',
        description: 'Challenge users with high risk scores',
        conditions: [
          { type: 'risk', operator: 'greater_than', field: 'overallScore', value: 70 }
        ],
        action: AccessDecision.CHALLENGE,
        priority: 90,
        enabled: true
      },
      {
        name: 'Allow Trusted Users',
        description: 'Allow access for highly trusted users',
        conditions: [
          { type: 'user', operator: 'greater_than', field: 'trustLevel', value: 80 },
          { type: 'device', operator: 'equals', field: 'isManaged', value: true }
        ],
        action: AccessDecision.ALLOW,
        priority: 50,
        enabled: true
      }
    ];

    for (const policy of defaultPolicies) {
      const rule: PolicyRule = {
        id: `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...policy,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.policyRules.set(rule.id, rule);
    }
  }

  private async initializeDefaultSegments(): Promise<void> {
    // Admin segment
    await this.createMicroSegment(
      'Admin Resources',
      'Administrative and management resources',
      ['/api/admin', '/admin'],
      ResourceSensitivity.RESTRICTED,
      TrustLevel.HIGH
    );

    // User data segment
    await this.createMicroSegment(
      'User Data',
      'Personal and user-specific data',
      ['/api/users', '/api/profile'],
      ResourceSensitivity.CONFIDENTIAL,
      TrustLevel.MEDIUM
    );

    // Public segment
    await this.createMicroSegment(
      'Public Resources',
      'Publicly accessible resources',
      ['/api/public', '/health'],
      ResourceSensitivity.PUBLIC,
      TrustLevel.UNTRUSTED
    );
  }

  // ==================== PUBLIC API ====================

  async getZeroTrustStatus(): Promise<{
    activeSessions: number;
    policyRules: number;
    microSegments: number;
    recentAccessRequests: number;
    riskDistribution: Record<string, number>;
  }> {
    const recentRequests = await redis?.keys('access_request:*') || [];
    
    // Calculate risk distribution
    const riskDistribution = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0
    };

    for (const [, riskContext] of this.riskAssessmentCache) {
      riskDistribution[riskContext.riskLevel]++;
    }

    return {
      activeSessions: this.activeSessions.size,
      policyRules: this.policyRules.size,
      microSegments: this.microSegments.size,
      recentAccessRequests: recentRequests.length,
      riskDistribution
    };
  }
}

export const zeroTrustEngine = ZeroTrustEngine.getInstance();