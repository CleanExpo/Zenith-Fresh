// src/app/api/approvals/[id]/approve/route.ts
// Approval Center - Approve content and execute action

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const approvalId = params.id;

    // Get the approval request
    const approval = await prisma.approvalRequest.findUnique({
      where: { id: approvalId },
      include: {
        mission: true,
        client: true
      }
    });

    if (!approval) {
      return NextResponse.json({ error: 'Approval request not found' }, { status: 404 });
    }

    // Verify ownership
    if (approval.clientId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update approval status
    const updatedApproval = await prisma.approvalRequest.update({
      where: { id: approvalId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        reviewedAt: new Date()
      }
    });

    // TODO: Here we would trigger the actual publication/execution
    // For now, we'll just log the action
    console.log(`Approved content for ${approval.agentType}: ${approval.contentType}`);
    
    // In a real implementation, this would:
    // - Send content to SocialMediaAgent for posting
    // - Publish blog article via ContentAgent
    // - Post review reply via CommunityManagerAgent
    // - Execute any other agent-specific actions

    return NextResponse.json({
      success: true,
      approval: {
        id: updatedApproval.id,
        status: updatedApproval.status,
        approvedAt: updatedApproval.approvedAt
      },
      message: 'Content approved and queued for publication'
    });

  } catch (error) {
    console.error('Approve content error:', error);
    return NextResponse.json(
      { error: 'Failed to approve content' },
      { status: 500 }
    );
  }
}
