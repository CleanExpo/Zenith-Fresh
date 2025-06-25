import { NextRequest, NextResponse } from 'next/server';
import { ScimProvider, ScimAuth } from '@/lib/auth/sso/scim-provider';

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const filter = request.nextUrl.searchParams.get('filter');
    const startIndex = parseInt(request.nextUrl.searchParams.get('startIndex') || '1');
    const count = parseInt(request.nextUrl.searchParams.get('count') || '100');

    const users = await scim.listUsers(filter || undefined, startIndex, count);

    return NextResponse.json(users);
  } catch (error) {
    console.error('SCIM Users GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const user = await scim.createUser(userData);

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('SCIM Users POST error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'User already exists') {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      if (error.message === 'Email is required') {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}