import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
      JWT_SECRET: !!process.env.JWT_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL,
    };

    // Basic health check without database queries during build
    let dbStatus = 'configured';
    let demoDataExists = false;
    
    // Only check database connection at runtime, not during build
    if (process.env.NODE_ENV !== 'production' || req.url.includes('runtime-check')) {
      try {
        const { prisma } = await import('@/lib/prisma');
        await prisma.$connect();
        dbStatus = 'connected';
        
        // Check if demo user exists
        const demoUser = await prisma.user.findUnique({
          where: { email: 'test@zenith.engineer' }
        });
        
        demoDataExists = !!demoUser;
        await prisma.$disconnect();
      } catch (dbError) {
        dbStatus = 'error';
        console.error('Database connection error:', dbError);
      }
    }

    return NextResponse.json({
      status: 'ok',
      authentication: 'NextAuth + Prisma',
      database: dbStatus,
      demoData: demoDataExists,
      environment: envCheck,
      timestamp: new Date().toISOString(),
      buildTime: process.env.NODE_ENV === 'production' && !req.url.includes('runtime-check'),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
