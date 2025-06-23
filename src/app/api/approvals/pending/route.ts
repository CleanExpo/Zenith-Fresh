// src/app/api/approvals/pending/route.ts
// Approval Center - Get pending approvals for client

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';
    const agentType = searchParams.get('agentType');
    const contentType = searchParams.get('contentType');

    const whereClause: any = {
      clientId: session.user.id,
    };

    if (status !== 'all') {
      whereClause.status = status;
    }

    if (agentType) {
      whereClause.agentType = agentType;
    }

    if (contentType) {
      whereClause.contentType = contentType;
    }

    const approvals = await prisma.approvalRequest.findMany({
      where: whereClause,
      include: {
        mission: {
          select: {
            id: true,
            goal: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Calculate summary statistics
    const summary = {
      total: approvals.length,
      pending: approvals.filter(a => a.status === 'PENDING').length,
      approved: approvals.filter(a => a.status === 'APPROVED').length,
      rejected: approvals.filter(a => a.status === 'REJECTED').length,
      editing: approvals.filter(a => a.status === 'EDITING').length,
      autoApproved: approvals.filter(a => a.status === 'AUTO_APPROVED').length,
    };

    return NextResponse.json({
      approvals: approvals.map(approval => ({
        id: approval.id,
        missionId: approval.missionId,
        mission: approval.mission,
        agentType: approval.agentType,
        taskType: approval.taskType,
        contentType: approval.contentType,
        originalContent: approval.originalContent,
        editedContent: approval.editedContent,
        status: approval.status,
        priority: approval.priority,
        reviewedAt: approval.reviewedAt,
        approvedAt: approval.approvedAt,
        rejectedAt: approval.rejectedAt,
        rejectionReason: approval.rejectionReason,
        autoApprovalRule: approval.autoApprovalRule,
        createdAt: approval.createdAt,
        updatedAt: approval.updatedAt
      })),
      summary
    });

  } catch (error) {
    console.error('Get pending approvals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending approvals' },
      { status: 500 }
    );
  }
}
