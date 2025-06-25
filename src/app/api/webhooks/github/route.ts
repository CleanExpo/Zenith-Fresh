import { NextRequest, NextResponse } from 'next/server';
import { handleGitHubWebhook } from '@/lib/integrations/github-integration';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('X-Hub-Signature-256');
    const event = request.headers.get('X-GitHub-Event');
    const tenantId = request.nextUrl.searchParams.get('tenantId');

    if (!signature || !event || !tenantId) {
      return NextResponse.json({ error: 'Missing required headers or tenant ID' }, { status: 400 });
    }

    const body = await request.text();
    const result = await handleGitHubWebhook(body, signature, tenantId);

    return NextResponse.json({ message: result.message }, { status: result.status });
  } catch (error) {
    console.error('GitHub webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}