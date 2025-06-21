import { NextRequest, NextResponse } from 'next/server';

// GET /api/approvals - Fetch all pending approval items
export async function GET(request: NextRequest) {
  try {
    // Simplified mock data for now - in real implementation this would fetch from database
    const mockApprovalItems = [
      {
        id: '1',
        type: 'social_post',
        content: {
          text: 'Check out our latest product update! 🚀 We\'ve added new features that will revolutionize your workflow. #innovation #tech'
        }
      },
      {
        id: '2', 
        type: 'blog_article',
        content: {
          text: 'Title: "5 Ways AI is Transforming Modern Business"\n\nArtificial Intelligence is reshaping how companies operate, from customer service to data analysis. Here are the top 5 ways AI is making an impact...'
        }
      },
      {
        id: '3',
        type: 'review_reply',
        content: {
          text: 'Thank you for your 5-star review! We\'re thrilled to hear that our service exceeded your expectations. Your feedback helps us continue to improve and deliver excellence.'
        }
      }
    ];

    return NextResponse.json(mockApprovalItems);
  } catch (error) {
    console.error('Error fetching approval items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approval items' },
      { status: 500 }
    );
  }
}
