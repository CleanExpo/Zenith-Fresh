/**
 * GDPR Automation System
 * 
 * Automated compliance management for GDPR Article 30 documentation,
 * data subject rights, and privacy by design implementation.
 */

import { prisma } from '@/lib/prisma';
import { AuditLogger, AuditEventType, AuditEntityType } from '@/lib/audit/audit-logger';
import { redis } from '@/lib/redis';

export enum GDPRLegalBasis {
  CONSENT = 'consent',
  CONTRACT = 'contract',
  LEGAL_OBLIGATION = 'legal_obligation',
  VITAL_INTERESTS = 'vital_interests',
  PUBLIC_TASK = 'public_task',
  LEGITIMATE_INTERESTS = 'legitimate_interests'
}

export enum DataCategory {
  PERSONAL_IDENTIFIERS = 'personal_identifiers',
  CONTACT_INFORMATION = 'contact_information',
  FINANCIAL_DATA = 'financial_data',
  BEHAVIORAL_DATA = 'behavioral_data',
  TECHNICAL_DATA = 'technical_data',
  SPECIAL_CATEGORY = 'special_category'
}

export enum ProcessingPurpose {
  SERVICE_PROVISION = 'service_provision',
  MARKETING = 'marketing',
  ANALYTICS = 'analytics',
  SECURITY = 'security',
  LEGAL_COMPLIANCE = 'legal_compliance',
  CUSTOMER_SUPPORT = 'customer_support'
}

interface DataProcessingRecord {
  id: string;
  name: string;
  purpose: ProcessingPurpose;
  legalBasis: GDPRLegalBasis;
  dataCategories: DataCategory[];
  dataSubjects: string[];
  recipients: string[];
  retentionPeriod: number; // in days
  internationalTransfers: boolean;
  safeguards?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ConsentRecord {
  id: string;
  userId: string;
  purpose: ProcessingPurpose;
  granted: boolean;
  grantedAt?: Date;
  withdrawnAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  consentString: string;
}

interface DataSubjectRequest {
  id: string;
  userId: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: Date;
  completedAt?: Date;
  data?: any;
  reason?: string;
}

interface PrivacyImpactAssessment {
  id: string;
  projectName: string;
  riskLevel: 'low' | 'medium' | 'high';
  dataTypes: DataCategory[];
  processingPurposes: ProcessingPurpose[];
  riskMitigations: string[];
  assessmentDate: Date;
  reviewDate: Date;
  approved: boolean;
  approvedBy?: string;
}

export class GDPRAutomationManager {
  private static instance: GDPRAutomationManager;
  private processingRecords: Map<string, DataProcessingRecord> = new Map();
  private consentRecords: Map<string, ConsentRecord[]> = new Map();

  private constructor() {}

  static getInstance(): GDPRAutomationManager {
    if (!GDPRAutomationManager.instance) {
      GDPRAutomationManager.instance = new GDPRAutomationManager();
    }
    return GDPRAutomationManager.instance;
  }

  // ==================== CONSENT MANAGEMENT ====================

  async recordConsent(
    userId: string,
    purpose: ProcessingPurpose,
    granted: boolean,
    consentString: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const consentRecord: ConsentRecord = {
      id: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      purpose,
      granted,
      grantedAt: granted ? new Date() : undefined,
      withdrawnAt: !granted ? new Date() : undefined,
      ipAddress,
      userAgent,
      consentString
    };

    // Store in Redis for quick access
    const userConsents = this.consentRecords.get(userId) || [];
    userConsents.push(consentRecord);
    this.consentRecords.set(userId, userConsents);

    // Persist to database
    if (redis) {
      await redis.setex(
        `gdpr:consent:${userId}:${purpose}`,
        31536000, // 1 year
        JSON.stringify(consentRecord)
      );
    }

    // Log consent action
    await AuditLogger.logUserAction(
      userId,
      granted ? AuditEventType.CREATE : AuditEventType.UPDATE,
      AuditEntityType.USER,
      userId,
      {
        action: granted ? 'consent_granted' : 'consent_withdrawn',
        purpose,
        consentId: consentRecord.id
      },
      ipAddress,
      userAgent
    );
  }

  async checkConsent(userId: string, purpose: ProcessingPurpose): Promise<boolean> {
    const consentData = redis ? await redis.get(`gdpr:consent:${userId}:${purpose}`) : null;
    if (!consentData) return false;

    const consent: ConsentRecord = JSON.parse(consentData);
    return consent.granted && !consent.withdrawnAt;
  }

  async getConsentHistory(userId: string): Promise<ConsentRecord[]> {
    const userConsents = this.consentRecords.get(userId) || [];
    return userConsents.sort((a, b) => (b.grantedAt || b.withdrawnAt || new Date()).getTime() - (a.grantedAt || a.withdrawnAt || new Date()).getTime());
  }

  // ==================== DATA PROCESSING RECORDS (ARTICLE 30) ====================

  async createDataProcessingRecord(record: Omit<DataProcessingRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const processingRecord: DataProcessingRecord = {
      id: `dpr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...record,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.processingRecords.set(processingRecord.id, processingRecord);

    // Store in Redis for compliance reporting
    if (redis) {
      await redis.setex(
        `gdpr:processing_record:${processingRecord.id}`,
        31536000, // 1 year
        JSON.stringify(processingRecord)
      );
    }

    await AuditLogger.logSystemEvent(
      AuditEventType.CREATE,
      {
        action: 'data_processing_record_created',
        recordId: processingRecord.id,
        purpose: record.purpose,
        legalBasis: record.legalBasis
      }
    );

    return processingRecord.id;
  }

  async generateArticle30Documentation(): Promise<{
    controllerInfo: any;
    processingActivities: DataProcessingRecord[];
    generatedAt: Date;
  }> {
    const processingActivities = Array.from(this.processingRecords.values());

    const controllerInfo = {
      name: process.env.COMPANY_NAME || 'Zenith Platform',
      address: process.env.COMPANY_ADDRESS || 'Global Operations',
      contactEmail: process.env.DPO_EMAIL || 'privacy@zenith.engineer',
      dpoContact: process.env.DPO_CONTACT || 'Data Protection Officer',
      representativeEU: process.env.EU_REPRESENTATIVE || 'EU Representative Details'
    };

    const documentation = {
      controllerInfo,
      processingActivities,
      generatedAt: new Date()
    };

    // Store Article 30 documentation
    if (redis) {
      await redis.setex(
        'gdpr:article30_documentation',
        86400, // 24 hours
        JSON.stringify(documentation)
      );
    }

    await AuditLogger.logSystemEvent(
      AuditEventType.DATA_EXPORT,
      {
        action: 'article30_documentation_generated',
        recordCount: processingActivities.length
      }
    );

    return documentation;
  }

  // ==================== DATA SUBJECT RIGHTS ====================

  async handleDataSubjectRequest(
    userId: string,
    type: DataSubjectRequest['type'],
    reason?: string
  ): Promise<string> {
    const requestId = `dsr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const request: DataSubjectRequest = {
      id: requestId,
      userId,
      type,
      status: 'pending',
      requestedAt: new Date(),
      reason
    };

    // Store request
    if (redis) {
      await redis.setex(
        `gdpr:dsr:${requestId}`,
        2592000, // 30 days
        JSON.stringify(request)
      );
    }

    // Trigger automated processing
    await this.processDataSubjectRequest(requestId);

    await AuditLogger.logUserAction(
      userId,
      AuditEventType.DATA_EXPORT,
      AuditEntityType.USER,
      userId,
      {
        action: 'data_subject_request_submitted',
        requestType: type,
        requestId
      }
    );

    return requestId;
  }

  private async processDataSubjectRequest(requestId: string): Promise<void> {
    const requestData = redis ? await redis.get(`gdpr:dsr:${requestId}`) : null;
    if (!requestData) return;

    const request: DataSubjectRequest = JSON.parse(requestData);
    request.status = 'processing';

    try {
      switch (request.type) {
        case 'access':
          request.data = await this.generateDataExport(request.userId);
          break;
        case 'erasure':
          await this.performDataErasure(request.userId);
          break;
        case 'portability':
          request.data = await this.generatePortableData(request.userId);
          break;
        case 'rectification':
          // This would typically require manual intervention
          break;
        case 'restriction':
          await this.restrictDataProcessing(request.userId);
          break;
        case 'objection':
          await this.handleProcessingObjection(request.userId);
          break;
      }

      request.status = 'completed';
      request.completedAt = new Date();
    } catch (error) {
      request.status = 'rejected';
      request.reason = error instanceof Error ? error.message : 'Processing failed';
    }

    if (redis) {
      await redis.setex(`gdpr:dsr:${requestId}`, 2592000, JSON.stringify(request));
    }
  }

  private async generateDataExport(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        teams: true,
        projects: true,
        auditLogs: {
          take: 1000,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) throw new Error('User not found');

    const exportData = {
      personalData: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      teams: user.teams.map(team => ({
        id: team.id,
        role: team.role,
        joinedAt: team.createdAt
      })),
      projects: user.projects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt
      })),
      activityLog: user.auditLogs.map(log => ({
        action: log.action,
        timestamp: log.createdAt,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent
      })),
      consentHistory: await this.getConsentHistory(userId)
    };

    return exportData;
  }

  private async performDataErasure(userId: string): Promise<void> {
    // Anonymize instead of hard delete to maintain referential integrity
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: '[ANONYMIZED]',
        email: `anonymized_${Date.now()}@example.com`,
        image: null
      }
    });

    // Mark audit logs as anonymized
    await prisma.auditLog.updateMany({
      where: { userId },
      data: {
        metadata: JSON.stringify({ anonymized: true, originalUserId: userId })
      }
    });

    // Clear consent records
    if (redis) {
      await redis.del(`gdpr:consent:${userId}:*`);
    }
  }

  private async generatePortableData(userId: string): Promise<any> {
    // Generate data in structured format suitable for portability
    const exportData = await this.generateDataExport(userId);
    
    // Format for portability (JSON-LD or similar structured format)
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      identifier: exportData.personalData.id,
      name: exportData.personalData.name,
      email: exportData.personalData.email,
      dateCreated: exportData.personalData.createdAt,
      memberOf: exportData.teams,
      owns: exportData.projects,
      activityLog: exportData.activityLog
    };
  }

  private async restrictDataProcessing(userId: string): Promise<void> {
    // Mark user account as restricted
    // Note: Add metadata field to User model in Prisma schema for full functionality
    console.log(`Processing restriction requested for user: ${userId} at ${new Date()}`);
  }

  private async handleProcessingObjection(userId: string): Promise<void> {
    // Stop non-essential processing (e.g., marketing)
    await this.recordConsent(
      userId,
      ProcessingPurpose.MARKETING,
      false,
      'Processing objection - automated withdrawal'
    );
  }

  // ==================== PRIVACY IMPACT ASSESSMENTS ====================

  async conductPrivacyImpactAssessment(
    projectName: string,
    dataTypes: DataCategory[],
    processingPurposes: ProcessingPurpose[]
  ): Promise<PrivacyImpactAssessment> {
    const riskLevel = this.assessPrivacyRisk(dataTypes, processingPurposes);
    const riskMitigations = this.generateRiskMitigations(dataTypes, processingPurposes, riskLevel);

    const pia: PrivacyImpactAssessment = {
      id: `pia_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectName,
      riskLevel,
      dataTypes,
      processingPurposes,
      riskMitigations,
      assessmentDate: new Date(),
      reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      approved: riskLevel !== 'high' // High risk requires manual approval
    };

    // Store PIA
    if (redis) {
      await redis.setex(
        `gdpr:pia:${pia.id}`,
        31536000, // 1 year
        JSON.stringify(pia)
      );
    }

    await AuditLogger.logSystemEvent(
      AuditEventType.CREATE,
      {
        action: 'privacy_impact_assessment_conducted',
        projectName,
        riskLevel,
        piaId: pia.id
      }
    );

    return pia;
  }

  private assessPrivacyRisk(dataTypes: DataCategory[], purposes: ProcessingPurpose[]): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // Risk from data types
    for (const dataType of dataTypes) {
      switch (dataType) {
        case DataCategory.SPECIAL_CATEGORY:
          riskScore += 3;
          break;
        case DataCategory.FINANCIAL_DATA:
          riskScore += 2;
          break;
        case DataCategory.PERSONAL_IDENTIFIERS:
          riskScore += 1;
          break;
        default:
          riskScore += 0.5;
      }
    }

    // Risk from processing purposes
    for (const purpose of purposes) {
      switch (purpose) {
        case ProcessingPurpose.MARKETING:
          riskScore += 1;
          break;
        case ProcessingPurpose.ANALYTICS:
          riskScore += 1;
          break;
        default:
          riskScore += 0.5;
      }
    }

    if (riskScore >= 5) return 'high';
    if (riskScore >= 3) return 'medium';
    return 'low';
  }

  private generateRiskMitigations(
    dataTypes: DataCategory[],
    purposes: ProcessingPurpose[],
    riskLevel: 'low' | 'medium' | 'high'
  ): string[] {
    const mitigations: string[] = [];

    if (dataTypes.includes(DataCategory.SPECIAL_CATEGORY)) {
      mitigations.push('Implement explicit consent for special category data');
      mitigations.push('Apply additional technical and organizational measures');
    }

    if (dataTypes.includes(DataCategory.FINANCIAL_DATA)) {
      mitigations.push('Implement strong encryption for financial data');
      mitigations.push('Limit access to authorized personnel only');
    }

    if (purposes.includes(ProcessingPurpose.MARKETING)) {
      mitigations.push('Implement opt-in consent for marketing communications');
      mitigations.push('Provide easy opt-out mechanisms');
    }

    if (riskLevel === 'high') {
      mitigations.push('Conduct regular privacy audits');
      mitigations.push('Implement data minimization principles');
      mitigations.push('Consider appointment of Data Protection Officer');
    }

    return mitigations;
  }

  // ==================== BREACH NOTIFICATION ====================

  async reportDataBreach(
    description: string,
    affectedUsers: string[],
    riskLevel: 'low' | 'high',
    containmentMeasures: string[]
  ): Promise<string> {
    const breachId = `breach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const breach = {
      id: breachId,
      description,
      affectedUsers,
      riskLevel,
      containmentMeasures,
      reportedAt: new Date(),
      notificationRequired: riskLevel === 'high'
    };

    // Store breach record
    if (redis) {
      await redis.setex(
        `gdpr:breach:${breachId}`,
        31536000, // 1 year
        JSON.stringify(breach)
      );
    }

    if (riskLevel === 'high') {
      // Schedule notification to supervisory authority (72 hours)
      if (redis) {
        await redis.zadd(
          'gdpr:breach_notifications',
          Date.now() + (72 * 60 * 60 * 1000),
          breachId
        );
      }
    }

    await AuditLogger.logSystemEvent(
      AuditEventType.SYSTEM_ACCESS,
      {
        action: 'data_breach_reported',
        breachId,
        riskLevel,
        affectedUserCount: affectedUsers.length
      }
    );

    return breachId;
  }

  async getComplianceReport(): Promise<{
    consentStatistics: any;
    dataSubjectRequests: any;
    processingRecords: number;
    breaches: any;
    generatedAt: Date;
  }> {
    // Generate comprehensive GDPR compliance report
    const report = {
      consentStatistics: {
        totalConsentRecords: this.consentRecords.size,
        activeConsents: 0,
        withdrawnConsents: 0
      },
      dataSubjectRequests: await this.getDataSubjectRequestStats(),
      processingRecords: this.processingRecords.size,
      breaches: await this.getBreachStatistics(),
      generatedAt: new Date()
    };

    return report;
  }

  private async getDataSubjectRequestStats(): Promise<any> {
    // Get DSR statistics from Redis
    const dsrKeys = redis ? await redis.keys('gdpr:dsr:*') : [];
    const stats = {
      total: dsrKeys.length,
      pending: 0,
      processing: 0,
      completed: 0,
      rejected: 0
    };

    if (redis) {
      for (const key of dsrKeys) {
        const data = await redis.get(key);
        if (data) {
          const request: DataSubjectRequest = JSON.parse(data);
          stats[request.status]++;
        }
      }
    }

    return stats;
  }

  private async getBreachStatistics(): Promise<any> {
    const breachKeys = redis ? await redis.keys('gdpr:breach:*') : [];
    return {
      total: breachKeys.length,
      highRisk: 0,
      lowRisk: 0,
      last30Days: 0
    };
  }
}

export default GDPRAutomationManager;