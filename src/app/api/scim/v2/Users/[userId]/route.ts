import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { ScimProvider, ScimAuth } from '@/lib/auth/sso/scim-provider';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authorization = request.headers.get('Authorization');
    const tenantId = request.nextUrl.searchParams.get('tenantId') || 'default';

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authorization.substring(7);
    const isValid = await ScimAuth.validateToken(token, tenantId);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const scim = new ScimProvider(tenantId, request.url);
    const user = await scim.getUser(params.userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('SCIM User GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authorization = request.headers.get('Authorization');
    const tenantId = request.nextUrl.searchParams.get('tenantId') || 'default';

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authorization.substring(7);
    const isValid = await ScimAuth.validateToken(token, tenantId);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const scim = new ScimProvider(tenantId, request.url);
    const userData = await request.json();

    const user = await scim.updateUser(params.userId, userData);

    return NextResponse.json(user);
  } catch (error) {
    console.error('SCIM User PUT error:', error);
    
    if (error instanceof Error && error.message === 'User not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authorization = request.headers.get('Authorization');
    const tenantId = request.nextUrl.searchParams.get('tenantId') || 'default';

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authorization.substring(7);
    const isValid = await ScimAuth.validateToken(token, tenantId);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const scim = new ScimProvider(tenantId, request.url);
    await scim.deleteUser(params.userId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('SCIM User DELETE error:', error);
    
    if (error instanceof Error && error.message === 'User not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}