import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SamlProvider, SamlConfigManager } from '@/lib/auth/sso/saml-provider';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = request.nextUrl.searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const config = await SamlConfigManager.getConfig(tenantId);
    
    if (!config) {
      return NextResponse.json({ error: 'SAML not configured' }, { status: 404 });
    }

    const samlProvider = new SamlProvider(tenantId, config);
    const metadata = await samlProvider.generateMetadata();

    return new NextResponse(metadata, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('SAML metadata error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, config, enabled } = body;

    if (!tenantId || !config) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate configuration
    const validation = await SamlConfigManager.validateConfig(config);
    if (!validation.valid) {
      return NextResponse.json({ 
        error: 'Invalid configuration', 
        details: validation.errors 
      }, { status: 400 });
    }

    await SamlConfigManager.saveConfig(tenantId, config, enabled);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('SAML config save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}