import { NextRequest, NextResponse } from 'next/server';
import { SlackIntegration, SlackConfigManager, handleSlackWebhook } from '@/lib/integrations/slack-integration';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = request.nextUrl.searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Handle Slack slash commands
    if (body.command) {
      const config = await SlackConfigManager.getConfig(tenantId);
      if (!config) {
        return NextResponse.json({ 
          response_type: 'ephemeral',
          text: 'Slack integration not configured' 
        });
      }

      // Validate signature
      const signature = request.headers.get('X-Slack-Signature');
      const timestamp = request.headers.get('X-Slack-Request-Timestamp');
      const bodyString = JSON.stringify(body);

      if (!signature || !timestamp) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
      }

      const isValid = await SlackIntegration.validateSignature(
        bodyString,
        signature,
        config.signingSecret,
        timestamp
      );

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }

      const slack = new SlackIntegration(tenantId, config);
      const response = await slack.handleSlashCommand(body);
      
      return NextResponse.json(response);
    }

    // Handle Slack events
    const response = await handleSlackWebhook(body, tenantId);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Slack webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}