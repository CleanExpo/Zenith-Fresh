import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMLService } from '@/lib/ml/utils';
import { rateLimit } from '@/lib/security/rate-limiter';

// Rate limiting for model training (very strict)
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Only 5 training requests per hour
  message: 'Too many training requests, please try again later'
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await limiter.check(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded for training requests' },
        { status: 429 }
      );
    }

    // Authenticate user (only admins can train models)
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { modelType, parameters = {} } = body;

    if (!modelType) {
      return NextResponse.json(
        { error: 'Model type is required' },
        { status: 400 }
      );
    }

    const mlService = getMLService();
    let result;
    const startTime = Date.now();

    switch (modelType) {
      case 'churn':
        result = await mlService.trainChurnModel();
        break;

      case 'all':
        // Train all models sequentially
        const results = {};
        
        console.log('Training churn model...');
        results.churn = await mlService.trainChurnModel();
        
        // Add other model training calls when they are implemented
        // results.revenue = await mlService.trainRevenueModel();
        // results.ltv = await mlService.trainLTVModel();
        // results.feature_adoption = await mlService.trainFeatureAdoptionModel();
        
        result = results;
        break;

      default:
        return NextResponse.json(
          { error: `Unknown model type: ${modelType}` },
          { status: 400 }
        );
    }

    const trainingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      modelType,
      trainingTime,
      data: result,
      timestamp: new Date().toISOString(),
      trainedBy: session.user.id
    });

  } catch (error) {
    console.error('ML Training error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error during model training',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const mlService = getMLService();

    switch (action) {
      case 'status':
        // Get training status and model performance
        const status = {
          models: {
            churn: mlService.getModelPerformance('churn'),
            revenue: mlService.getModelPerformance('revenue'),
            ltv: mlService.getModelPerformance('ltv'),
            feature_adoption: mlService.getModelPerformance('feature_adoption')
          },
          lastUpdate: new Date().toISOString(),
          systemStatus: 'healthy'
        };
        
        return NextResponse.json({
          success: true,
          data: status,
          timestamp: new Date().toISOString()
        });

      case 'performance':
        const modelType = searchParams.get('modelType');
        let performanceData;
        
        if (modelType) {
          performanceData = mlService.getModelPerformance(modelType);
        } else {
          performanceData = {
            churn: mlService.getModelPerformance('churn'),
            revenue: mlService.getModelPerformance('revenue'),
            ltv: mlService.getModelPerformance('ltv'),
            feature_adoption: mlService.getModelPerformance('feature_adoption')
          };
        }
        
        return NextResponse.json({
          success: true,
          data: performanceData,
          timestamp: new Date().toISOString()
        });

      case 'history':
        // Return training history (mock data - would be stored in database)
        const history = [
          {
            id: '1',
            modelType: 'churn',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            performance: { accuracy: 87.3, precision: 84.2, recall: 89.1 },
            dataPoints: 1247,
            trainingTime: 45000,
            status: 'completed'
          },
          {
            id: '2',
            modelType: 'revenue',
            timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            performance: { accuracy: 92.1, mae: 15420, rmse: 23150 },
            dataPoints: 890,
            trainingTime: 32000,
            status: 'completed'
          }
        ];
        
        return NextResponse.json({
          success: true,
          data: history,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('ML Training GET error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user (only admins can clear models)
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const mlService = getMLService();

    switch (action) {
      case 'cache':
        // Clear feature cache
        mlService.clearCache();
        
        return NextResponse.json({
          success: true,
          message: 'Feature cache cleared',
          timestamp: new Date().toISOString(),
          clearedBy: session.user.id
        });

      case 'models':
        // This would clear/reset trained models
        // Implementation depends on how models are stored
        mlService.clearCache(); // For now, just clear cache
        
        return NextResponse.json({
          success: true,
          message: 'Models reset (cache cleared)',
          timestamp: new Date().toISOString(),
          resetBy: session.user.id
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('ML Training DELETE error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}