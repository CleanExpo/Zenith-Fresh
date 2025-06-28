/**
 * GDPR Data Subject Rights API
 * 
 * Automated handling of GDPR data subject requests including:
 * - Right of Access (Article 15)
 * - Right to Rectification (Article 16)
 * - Right to Erasure (Article 17)
 * - Right to Data Portability (Article 20)
 * - Right to Restrict Processing (Article 18)
 * - Right to Object (Article 21)
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuditLogger, AuditEventType, AuditEntityType } from '@/lib/audit/audit-logger';
import { GDPRAutomationManager, ProcessingPurpose } from '@/lib/compliance/gdpr-automation';
import { prisma } from '@/lib/prisma';

// Rate limiting for data subject requests
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours
const MAX_REQUESTS_PER_USER = 5; // Max 5 requests per 24 hours per user

async function checkRateLimit(userId: string): Promise<boolean> {
  const requests = await prisma.auditLog.count({
    where: {
      userId,
      action: 'DATA_EXPORT',
      createdAt: {
        gte: new Date(Date.now() - RATE_LIMIT_WINDOW)
      }
    }
  });

  return requests < MAX_REQUESTS_PER_USER;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');
    const action = searchParams.get('action') || 'status';

    const gdprManager = GDPRAutomationManager.getInstance();

    let responseData: any = {};

    switch (action) {
      case 'export':
        // Generate data export for the user
        const exportData = await generateUserDataExport(session.user.id);
        responseData = {
          exportGenerated: true,
          data: exportData,
          generatedAt: new Date()
        };
        break;

      case 'consent-history':
        // Get user's consent history
        const consentHistory = await gdprManager.getConsentHistory(session.user.id);
        responseData = {
          consentHistory,
          total: consentHistory.length
        };
        break;

      case 'processing-info':
        // Get information about data processing
        const processingInfo = await getProcessingInformation();
        responseData = processingInfo;
        break;

      case 'status':
      default:
        // Get status of existing requests
        const requestStatus = await getUserRequestStatus(session.user.id, requestId || undefined);
        responseData = requestStatus;
        break;
    }

    // Log the access
    await AuditLogger.logUserAction(
      session.user.id,
      AuditEventType.READ,
      AuditEntityType.USER,
      session.user.id,
      {
        action: 'gdpr_data_access',
        requestType: action,
        requestId
      }
    );

    return NextResponse.json({
      success: true,
      data: responseData,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('GDPR data subject request error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process GDPR request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limiting
    if (!await checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 5 requests per 24 hours.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { type, reason, data } = body;

    const validTypes = ['access', 'rectification', 'erasure', 'portability', 'restriction', 'objection'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid request type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const gdprManager = GDPRAutomationManager.getInstance();
    let result: any = {};

    switch (type) {
      case 'access':
        result = await handleAccessRequest(session.user.id, gdprManager);
        break;

      case 'rectification':
        result = await handleRectificationRequest(session.user.id, data, gdprManager);
        break;

      case 'erasure':
        result = await handleErasureRequest(session.user.id, reason, gdprManager);
        break;

      case 'portability':
        result = await handlePortabilityRequest(session.user.id, gdprManager);
        break;

      case 'restriction':
        result = await handleRestrictionRequest(session.user.id, reason, gdprManager);
        break;

      case 'objection':
        result = await handleObjectionRequest(session.user.id, reason, data, gdprManager);
        break;
    }

    return NextResponse.json({
      success: true,
      requestType: type,
      requestId: result.requestId,
      status: result.status,
      message: result.message,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('GDPR request processing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process GDPR request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ==================== REQUEST HANDLERS ====================

async function handleAccessRequest(userId: string, gdprManager: GDPRAutomationManager) {
  const requestId = await gdprManager.handleDataSubjectRequest(userId, 'access');
  
  return {
    requestId,
    status: 'processing',
    message: 'Your data access request is being processed. You will receive your data export within 30 days.',
    estimatedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  };
}

async function handleRectificationRequest(
  userId: string, 
  data: any, 
  gdprManager: GDPRAutomationManager
) {
  if (!data || !data.corrections) {
    throw new Error('Data corrections must be specified for rectification requests');
  }

  const requestId = await gdprManager.handleDataSubjectRequest(
    userId, 
    'rectification',
    `Requested corrections: ${JSON.stringify(data.corrections)}`
  );
  
  return {
    requestId,
    status: 'pending',
    message: 'Your data rectification request has been submitted and will be reviewed by our team.',
    estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  };
}

async function handleErasureRequest(
  userId: string, 
  reason: string, 
  gdprManager: GDPRAutomationManager
) {
  // Check if user has active subscriptions or legal obligations
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      teams: true
    }
  });

  const hasActiveSubscriptions = user?.teams && user.teams.length > 0;

  if (hasActiveSubscriptions) {
    return {
      requestId: null,
      status: 'rejected',
      message: 'Data erasure cannot be completed due to active subscriptions. Please cancel all subscriptions first.',
      reason: 'Active contractual obligations prevent data erasure'
    };
  }

  const requestId = await gdprManager.handleDataSubjectRequest(
    userId, 
    'erasure',
    reason || 'User requested data erasure'
  );
  
  return {
    requestId,
    status: 'processing',
    message: 'Your data erasure request is being processed. Account data will be anonymized within 30 days.',
    estimatedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  };
}

async function handlePortabilityRequest(userId: string, gdprManager: GDPRAutomationManager) {
  const requestId = await gdprManager.handleDataSubjectRequest(userId, 'portability');
  
  return {
    requestId,
    status: 'processing',
    message: 'Your data portability request is being processed. You will receive your data in a structured format within 30 days.',
    estimatedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  };
}

async function handleRestrictionRequest(
  userId: string, 
  reason: string, 
  gdprManager: GDPRAutomationManager
) {
  const requestId = await gdprManager.handleDataSubjectRequest(
    userId, 
    'restriction',
    reason || 'User requested processing restriction'
  );
  
  return {
    requestId,
    status: 'processing',
    message: 'Your request to restrict data processing is being implemented. Non-essential processing will be stopped.',
    estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  };
}

async function handleObjectionRequest(
  userId: string, 
  reason: string, 
  data: any, 
  gdprManager: GDPRAutomationManager
) {
  // Handle specific objections (e.g., marketing)
  if (data?.purposes && Array.isArray(data.purposes)) {
    for (const purpose of data.purposes) {
      if (Object.values(ProcessingPurpose).includes(purpose)) {
        await gdprManager.recordConsent(
          userId,
          purpose as ProcessingPurpose,
          false,
          'Processing objection - user withdrawal'
        );
      }
    }
  }

  const requestId = await gdprManager.handleDataSubjectRequest(
    userId, 
    'objection',
    reason || 'User objects to data processing'
  );
  
  return {
    requestId,
    status: 'processing',
    message: 'Your objection to data processing has been recorded. Specified processing activities will be stopped.',
    estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  };
}

// ==================== HELPER FUNCTIONS ====================

async function generateUserDataExport(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      teams: true
    }
  });

  // Get user's audit logs separately
  const auditLogs = await prisma.auditLog.findMany({
    where: { userId },
    take: 1000,
    orderBy: { createdAt: 'desc' },
    select: {
      action: true,
      createdAt: true,
      ipAddress: true,
      userAgent: true,
      entityType: true
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get consent history
  const gdprManager = GDPRAutomationManager.getInstance();
  const consentHistory = await gdprManager.getConsentHistory(userId);

  return {
    personalData: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    },
    teamMemberships: user.teams.map(team => ({
      teamId: team.teamId,
      role: team.role,
      joinedAt: team.createdAt
    })),
    activityHistory: auditLogs.map(log => ({
      action: log.action,
      entityType: log.entityType,
      timestamp: log.createdAt,
      ipAddress: log.ipAddress ? `${log.ipAddress.substring(0, 8)}...` : null, // Masked for privacy
      userAgent: log.userAgent ? log.userAgent.substring(0, 50) + '...' : null
    })),
    consentHistory,
    dataExportInfo: {
      exportedAt: new Date(),
      dataRetentionPeriod: '7 years from account closure',
      legalBasis: 'Legitimate interest for service provision',
      dataController: process.env.COMPANY_NAME || 'Zenith Platform',
      dataProtectionOfficer: process.env.DPO_EMAIL || 'privacy@zenith.engineer'
    }
  };
}

async function getUserRequestStatus(userId: string, requestId?: string) {
  // Get recent data subject requests from audit logs
  const recentRequests = await prisma.auditLog.findMany({
    where: {
      userId,
      action: 'DATA_EXPORT',
      createdAt: {
        gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  const requests = recentRequests.map(log => ({
    id: (log.metadata as any)?.requestId || log.id,
    type: (log.metadata as any)?.requestType || 'unknown',
    status: 'completed', // Simplified status
    submittedAt: log.createdAt,
    completedAt: new Date(log.createdAt.getTime() + 24 * 60 * 60 * 1000) // Assuming 24h processing
  }));

  if (requestId) {
    const specificRequest = requests.find(req => req.id === requestId);
    return specificRequest ? { request: specificRequest } : { error: 'Request not found' };
  }

  return {
    requests,
    total: requests.length,
    canSubmitNew: await checkRateLimit(userId)
  };
}

async function getProcessingInformation() {
  return {
    dataController: {
      name: process.env.COMPANY_NAME || 'Zenith Platform',
      address: process.env.COMPANY_ADDRESS || 'Global Operations',
      email: process.env.CONTACT_EMAIL || 'contact@zenith.engineer'
    },
    dataProtectionOfficer: {
      email: process.env.DPO_EMAIL || 'privacy@zenith.engineer',
      contact: process.env.DPO_CONTACT || 'Data Protection Officer'
    },
    processingPurposes: [
      {
        purpose: 'Service Provision',
        legalBasis: 'Contract',
        dataTypes: ['Personal identifiers', 'Contact information', 'Technical data'],
        retention: 'Duration of service plus 7 years'
      },
      {
        purpose: 'Customer Support',
        legalBasis: 'Legitimate Interest',
        dataTypes: ['Contact information', 'Communication records'],
        retention: '3 years from last contact'
      },
      {
        purpose: 'Security and Fraud Prevention',
        legalBasis: 'Legitimate Interest',
        dataTypes: ['Technical data', 'Behavioral data'],
        retention: '2 years from last activity'
      },
      {
        purpose: 'Analytics and Improvement',
        legalBasis: 'Consent',
        dataTypes: ['Behavioral data', 'Technical data'],
        retention: '2 years or until consent withdrawn'
      }
    ],
    yourRights: [
      'Right of access to your personal data',
      'Right to rectification of inaccurate data',
      'Right to erasure ("right to be forgotten")',
      'Right to data portability',
      'Right to restrict processing',
      'Right to object to processing',
      'Right to withdraw consent at any time',
      'Right to lodge a complaint with supervisory authority'
    ],
    internationalTransfers: {
      occurs: true,
      safeguards: 'EU-US Data Privacy Framework, Standard Contractual Clauses',
      countries: ['United States', 'United Kingdom']
    }
  };
}