// src/app/api/approvals/[id]/reject/route.ts
// Approval Center - Reject content and return to agent

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const rejectSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
  returnToAgent: z.boolean().default(true)
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reason, returnToAgent } = rejectSchema.parse(body);
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
        status: 'REJECTED',
        rejectedAt: new Date(),
        reviewedAt: new Date(),
        rejectionReason: reason
      }
    });

    // TODO: Here we would notify the agent about the rejection
    // For now, we'll just log the action
    console.log(`Rejected content for ${approval.agentType}: ${approval.contentType} - Reason: ${reason}`);
    
    // In a real implementation, this would:
    // - Notify the responsible agent about the rejection
    // - Queue the content for revision if returnToAgent is true
    // - Update the mission status if needed
    // - Send feedback to improve future agent output

    return NextResponse.json({
      success: true,
      approval: {
        id: updatedApproval.id,
        status: updatedApproval.status,
        rejectedAt: updatedApproval.rejectedAt,
        rejectionReason: updatedApproval.rejectionReason
      },
      message: returnToAgent 
        ? 'Content rejected and returned to agent for revision'
        : 'Content rejected and discarded'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Reject content error:', error);
    return NextResponse.json(
      { error: 'Failed to reject content' },
      { status: 500 }
    );
  }
}
