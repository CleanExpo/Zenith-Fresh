import { NextResponse } from 'next/server';
import { checkMongoConnection, getDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    // Check basic connection
    const connectionCheck = await checkMongoConnection();
    
    if (connectionCheck.status === 'error') {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'MongoDB connection failed',
          error: connectionCheck.message 
        },
        { status: 500 }
      );
    }

    // Test database operations
    const db = await getDatabase();
    const collections = await db.listCollections().toArray();
    
    // Get database stats
    const stats = await db.stats();
    
    return NextResponse.json({
      status: 'healthy',
      message: 'MongoDB connection successful',
      database: process.env.MONGODB_DB_NAME || 'zenith_production',
      collections: collections.length,
      dataSize: stats.dataSize,
      indexSize: stats.indexSize,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('MongoDB health check error:', error);
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'MongoDB health check failed',
        error: error.message 
      },
      { status: 500 }
    );
  }
}