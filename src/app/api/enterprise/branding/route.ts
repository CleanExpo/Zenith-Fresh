import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { BrandingManager, CustomDomainManager } from '@/lib/white-label/branding-system';

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

    const branding = await BrandingManager.getBrandingConfig(tenantId);
    const customDomain = await CustomDomainManager.getCustomDomain(tenantId);

    return NextResponse.json({ branding, customDomain });
  } catch (error) {
    console.error('Branding get error:', error);
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
    const { tenantId, branding, customDomain } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Save branding configuration
    if (branding) {
      await BrandingManager.saveBrandingConfig({ ...branding, tenantId });
    }

    // Handle custom domain
    if (customDomain) {
      if (customDomain.action === 'add') {
        const domainConfig = await CustomDomainManager.addCustomDomain(tenantId, customDomain.domain);
        return NextResponse.json({ domainConfig });
      } else if (customDomain.action === 'verify') {
        const verified = await CustomDomainManager.verifyDomain(customDomain.domain);
        return NextResponse.json({ verified });
      } else if (customDomain.action === 'remove') {
        await CustomDomainManager.removeCustomDomain(tenantId);
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Branding save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}