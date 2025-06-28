/**
 * Redis Health Check API Endpoint
 * Tests Redis connectivity and availability
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { cache, initRedis } from '@/lib/redis';

/**
 * GET /api/health/redis
 * Returns Redis connection status
 */
export async function GET(request: NextRequest) {
  try {
    await initRedis();
    
    const redisOk = cache.isAvailable();
    
    return NextResponse.json(
      { 
        redisOk,
        status: redisOk ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
      },
      { status: redisOk ? 200 : 503 }
    );
  } catch (error) {
    return NextResponse.json(
      { 
        redisOk: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}