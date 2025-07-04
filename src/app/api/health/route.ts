import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
      JWT_SECRET: !!process.env.JWT_SECRET,
    };

    // Check database connection and demo data
    let dbStatus = 'unknown';
    let demoDataExists = false;
    
    try {
      await prisma.$connect();
      dbStatus = 'connected';
      
      // Check if demo user exists
      const demoUser = await prisma.user.findUnique({
        where: { email: 'test@zenith.engineer' }
      });
      
      demoDataExists = !!demoUser;
    } catch (dbError) {
      dbStatus = 'error';
      console.error('Database connection error:', dbError);
    }

    return NextResponse.json({
      status: 'ok',
      authentication: 'NextAuth + Prisma',
      database: dbStatus,
      demoData: demoDataExists,
      environment: envCheck,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
