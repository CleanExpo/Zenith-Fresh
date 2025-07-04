import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/middleware/auth';

const prisma = new PrismaClient();

// Example of converting Express route to Next.js API route
export async function GET(req: NextRequest) {
  try {
    // Authentication check
    const user = await auth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Your route logic here
    const data = await prisma.activityLog.findMany({
      where: {
        userId: user.id
      }
    });

    // Return response
    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 
