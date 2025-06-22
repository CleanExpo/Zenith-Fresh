import { NextRequest, NextResponse } from 'next/server';

// POST /api/approvals/[id] - Handle approval or rejection of specific item
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { action } = await request.json();
    const { id } = params;

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be APPROVE or REJECT' },
        { status: 400 }
      );
    }

    // Simplified mock response - in real implementation this would update database
    console.log(`${action} action performed on approval item ${id}`);

    return NextResponse.json({
      success: true,
      message: `Item ${id} has been ${action.toLowerCase()}d`,
      action,
      id
    });

  } catch (error) {
    console.error('Error processing approval action:', error);
    return NextResponse.json(
      { error: 'Failed to process approval action' },
      { status: 500 }
    );
  }
}
