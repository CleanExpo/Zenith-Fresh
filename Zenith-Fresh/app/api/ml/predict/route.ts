import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMLService } from '@/lib/ml/utils';
import { rateLimit } from '@/lib/security/rate-limiter';

// Rate limiting for ML predictions
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many prediction requests, please try again later'
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await limiter.check(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, userId, parameters = {} } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'Prediction type is required' },
        { status: 400 }
      );
    }

    const mlService = getMLService();
    let result;

    switch (type) {
      case 'churn':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId is required for churn prediction' },
            { status: 400 }
          );
        }
        result = await mlService.predictChurn(userId);
        break;

      case 'ltv':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId is required for LTV prediction' },
            { status: 400 }
          );
        }
        result = await mlService.predictLTV(userId);
        break;

      case 'feature_adoption':
        if (!userId || !parameters.featureName) {
          return NextResponse.json(
            { error: 'userId and featureName are required for feature adoption prediction' },
            { status: 400 }
          );
        }
        result = await mlService.predictFeatureAdoption(userId, parameters.featureName);
        break;

      case 'revenue_forecast':
        const timeHorizon = parameters.timeHorizon || 30;
        result = await mlService.forecastRevenue(timeHorizon);
        break;

      case 'user_segments':
        result = await mlService.segmentUsers();
        break;

      case 'cohort_analysis':
        const cohortPeriod = parameters.cohortPeriod || 'monthly';
        result = await mlService.performCohortAnalysis(cohortPeriod);
        break;

      case 'anomaly_detection':
        const metrics = parameters.metrics || ['revenue', 'usage', 'churn'];
        result = await mlService.detectAnomalies(metrics);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown prediction type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      type,
      data: result,
      timestamp: new Date().toISOString(),
      userId: session.user.id
    });

  } catch (error) {
    console.error('ML Prediction error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error during prediction',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await limiter.check(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');

    if (!type) {
      return NextResponse.json(
        { error: 'Prediction type is required' },
        { status: 400 }
      );
    }

    const mlService = getMLService();
    let result;

    switch (type) {
      case 'model_performance':
        const modelType = searchParams.get('modelType');
        if (modelType) {
          result = mlService.getModelPerformance(modelType);
        } else {
          // Return performance for all models
          result = {
            churn: mlService.getModelPerformance('churn'),
            revenue: mlService.getModelPerformance('revenue'),
            ltv: mlService.getModelPerformance('ltv'),
            feature_adoption: mlService.getModelPerformance('feature_adoption')
          };
        }
        break;

      case 'user_features':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId is required for user features' },
            { status: 400 }
          );
        }
        result = await mlService.extractUserFeatures(userId);
        break;

      case 'quick_churn':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId is required for churn prediction' },
            { status: 400 }
          );
        }
        const churnPrediction = await mlService.predictChurn(userId);
        result = {
          churnProbability: churnPrediction.churnProbability,
          riskLevel: churnPrediction.riskLevel,
          timeToChurn: churnPrediction.timeToChurn,
          confidence: churnPrediction.confidence
        };
        break;

      case 'quick_ltv':
        if (!userId) {
          return NextResponse.json(
            { error: 'userId is required for LTV prediction' },
            { status: 400 }
          );
        }
        const ltvPrediction = await mlService.predictLTV(userId);
        result = {
          lifetimeValue: ltvPrediction.lifetimeValue,
          expectedLifespan: ltvPrediction.expectedLifespan,
          monthlyValue: ltvPrediction.monthlyValue,
          confidence: ltvPrediction.confidence
        };
        break;

      default:
        return NextResponse.json(
          { error: `Unknown prediction type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      type,
      data: result,
      timestamp: new Date().toISOString(),
      userId: session.user.id
    });

  } catch (error) {
    console.error('ML Prediction GET error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error during prediction',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Batch prediction endpoint
export async function PUT(request: NextRequest) {
  try {
    // Apply rate limiting (stricter for batch operations)
    const batchLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10, // Lower limit for batch operations
      message: 'Too many batch prediction requests'
    });

    const rateLimitResult = await batchLimiter.check(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { predictions } = body;

    if (!predictions || !Array.isArray(predictions)) {
      return NextResponse.json(
        { error: 'Predictions array is required' },
        { status: 400 }
      );
    }

    if (predictions.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 predictions per batch' },
        { status: 400 }
      );
    }

    const mlService = getMLService();
    const results = [];

    for (const prediction of predictions) {
      try {
        const { type, userId, parameters = {} } = prediction;
        let result;

        switch (type) {
          case 'churn':
            result = await mlService.predictChurn(userId);
            break;
          case 'ltv':
            result = await mlService.predictLTV(userId);
            break;
          case 'feature_adoption':
            result = await mlService.predictFeatureAdoption(userId, parameters.featureName);
            break;
          default:
            result = { error: `Unknown prediction type: ${type}` };
        }

        results.push({
          type,
          userId,
          success: !result.error,
          data: result.error ? null : result,
          error: result.error || null
        });

      } catch (error) {
        results.push({
          type: prediction.type,
          userId: prediction.userId,
          success: false,
          data: null,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      batchSize: predictions.length,
      results,
      timestamp: new Date().toISOString(),
      userId: session.user.id
    });

  } catch (error) {
    console.error('ML Batch Prediction error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error during batch prediction',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}