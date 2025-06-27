import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMLService } from '@/lib/ml/utils';
import { rateLimit } from '@/lib/security/rate-limiter';

// Rate limiting for forecasting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: 'Too many forecasting requests, please try again later'
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
    const { 
      type, 
      timeHorizon = 30, 
      granularity = 'daily',
      includeConfidenceIntervals = true,
      scenarios = ['conservative', 'expected', 'optimistic'],
      parameters = {}
    } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'Forecast type is required' },
        { status: 400 }
      );
    }

    const mlService = getMLService();
    let result;

    switch (type) {
      case 'revenue':
        result = await mlService.forecastRevenue(timeHorizon);
        
        // Enhance with additional forecast data
        if (includeConfidenceIntervals) {
          result.confidenceIntervals = {
            '80%': { lower: result.forecastAmount * 0.9, upper: result.forecastAmount * 1.1 },
            '95%': { lower: result.forecastAmount * 0.85, upper: result.forecastAmount * 1.15 }
          };
        }
        
        // Add scenario analysis
        result.scenarios = {
          conservative: result.scenarios?.conservative || result.forecastAmount * 0.85,
          expected: result.scenarios?.expected || result.forecastAmount,
          optimistic: result.scenarios?.optimistic || result.forecastAmount * 1.25
        };
        
        break;

      case 'user_growth':
        // Mock user growth forecast - would implement actual forecasting
        const currentUsers = 2500; // Would get from database
        const growthRate = 0.12; // 12% monthly growth
        
        const userGrowthData = [];
        for (let i = 0; i <= timeHorizon; i++) {
          const baseGrowth = currentUsers * Math.pow(1 + growthRate/30, i);
          const seasonalFactor = 1 + 0.1 * Math.sin((i / 30) * 2 * Math.PI);
          const noise = 0.95 + Math.random() * 0.1;
          
          userGrowthData.push({
            day: i,
            predicted: Math.floor(baseGrowth * seasonalFactor * noise),
            conservative: Math.floor(baseGrowth * seasonalFactor * 0.8),
            optimistic: Math.floor(baseGrowth * seasonalFactor * 1.3)
          });
        }
        
        result = {
          prediction: userGrowthData[userGrowthData.length - 1].predicted,
          confidence: 0.78,
          uncertainty: 0.15,
          factors: [
            { name: 'Historical Growth', importance: 0.4 },
            { name: 'Seasonality', importance: 0.25 },
            { name: 'Marketing Spend', importance: 0.2 },
            { name: 'Market Conditions', importance: 0.15 }
          ],
          timestamp: new Date(),
          forecastData: userGrowthData,
          scenarios: {
            conservative: userGrowthData[userGrowthData.length - 1].conservative,
            expected: userGrowthData[userGrowthData.length - 1].predicted,
            optimistic: userGrowthData[userGrowthData.length - 1].optimistic
          }
        };
        break;

      case 'churn_rate':
        // Mock churn rate forecast
        const currentChurnRate = 0.05; // 5% monthly churn
        const churnTrend = -0.001; // Improving by 0.1% per month
        
        const churnForecastData = [];
        for (let i = 0; i <= timeHorizon; i++) {
          const baseChurn = Math.max(0.01, currentChurnRate + (churnTrend * i / 30));
          const seasonalFactor = 1 + 0.05 * Math.sin((i / 30) * 2 * Math.PI);
          
          churnForecastData.push({
            day: i,
            predicted: baseChurn * seasonalFactor,
            conservative: baseChurn * seasonalFactor * 1.2,
            optimistic: baseChurn * seasonalFactor * 0.8
          });
        }
        
        result = {
          prediction: churnForecastData[churnForecastData.length - 1].predicted,
          confidence: 0.83,
          uncertainty: 0.12,
          factors: [
            { name: 'Historical Patterns', importance: 0.35 },
            { name: 'Customer Satisfaction', importance: 0.25 },
            { name: 'Competitive Pressure', importance: 0.2 },
            { name: 'Product Updates', importance: 0.2 }
          ],
          timestamp: new Date(),
          forecastData: churnForecastData,
          scenarios: {
            conservative: churnForecastData[churnForecastData.length - 1].conservative,
            expected: churnForecastData[churnForecastData.length - 1].predicted,
            optimistic: churnForecastData[churnForecastData.length - 1].optimistic
          }
        };
        break;

      case 'usage_patterns':
        // Mock usage forecasting
        const currentUsage = 150000; // Daily API calls
        const usageGrowth = 0.08; // 8% monthly growth
        
        const usageForecastData = [];
        for (let i = 0; i <= timeHorizon; i++) {
          const baseUsage = currentUsage * Math.pow(1 + usageGrowth/30, i);
          const weekdayFactor = [0.8, 1.2, 1.2, 1.2, 1.2, 1.2, 0.9][i % 7]; // Weekly pattern
          const noise = 0.9 + Math.random() * 0.2;
          
          usageForecastData.push({
            day: i,
            predicted: Math.floor(baseUsage * weekdayFactor * noise),
            conservative: Math.floor(baseUsage * weekdayFactor * 0.85),
            optimistic: Math.floor(baseUsage * weekdayFactor * 1.25)
          });
        }
        
        result = {
          prediction: usageForecastData[usageForecastData.length - 1].predicted,
          confidence: 0.89,
          uncertainty: 0.08,
          factors: [
            { name: 'User Growth', importance: 0.4 },
            { name: 'Feature Adoption', importance: 0.3 },
            { name: 'Weekly Patterns', importance: 0.2 },
            { name: 'Seasonal Effects', importance: 0.1 }
          ],
          timestamp: new Date(),
          forecastData: usageForecastData,
          scenarios: {
            conservative: usageForecastData[usageForecastData.length - 1].conservative,
            expected: usageForecastData[usageForecastData.length - 1].predicted,
            optimistic: usageForecastData[usageForecastData.length - 1].optimistic
          }
        };
        break;

      case 'conversion_rates':
        // Mock conversion rate forecasting
        const currentConversionRate = 0.15; // 15% trial to paid conversion
        
        const conversionForecastData = [];
        for (let i = 0; i <= timeHorizon; i++) {
          const trend = 0.001; // Improving by 0.1% per month
          const baseConversion = Math.min(0.5, currentConversionRate + (trend * i / 30));
          const seasonalFactor = 1 + 0.05 * Math.sin((i / 30 + 3) * 2 * Math.PI); // Peak in Q4
          
          conversionForecastData.push({
            day: i,
            predicted: baseConversion * seasonalFactor,
            conservative: baseConversion * seasonalFactor * 0.9,
            optimistic: baseConversion * seasonalFactor * 1.15
          });
        }
        
        result = {
          prediction: conversionForecastData[conversionForecastData.length - 1].predicted,
          confidence: 0.76,
          uncertainty: 0.18,
          factors: [
            { name: 'Onboarding Quality', importance: 0.3 },
            { name: 'Feature Value', importance: 0.25 },
            { name: 'Pricing Strategy', importance: 0.2 },
            { name: 'Market Timing', importance: 0.15 },
            { name: 'Competition', importance: 0.1 }
          ],
          timestamp: new Date(),
          forecastData: conversionForecastData,
          scenarios: {
            conservative: conversionForecastData[conversionForecastData.length - 1].conservative,
            expected: conversionForecastData[conversionForecastData.length - 1].predicted,
            optimistic: conversionForecastData[conversionForecastData.length - 1].optimistic
          }
        };
        break;

      default:
        return NextResponse.json(
          { error: `Unknown forecast type: ${type}` },
          { status: 400 }
        );
    }

    // Add metadata
    result.metadata = {
      timeHorizon,
      granularity,
      generatedAt: new Date().toISOString(),
      modelVersion: '1.0.0',
      requestedBy: session.user.id
    };

    return NextResponse.json({
      success: true,
      type,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('ML Forecast error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error during forecasting',
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
    const action = searchParams.get('action');

    switch (action) {
      case 'types':
        // Return available forecast types
        const forecastTypes = [
          {
            type: 'revenue',
            name: 'Revenue Forecast',
            description: 'Predict future revenue with confidence intervals',
            timeHorizons: [30, 90, 365],
            granularities: ['daily', 'weekly', 'monthly']
          },
          {
            type: 'user_growth',
            name: 'User Growth',
            description: 'Forecast user acquisition and growth patterns',
            timeHorizons: [30, 90, 365],
            granularities: ['daily', 'weekly', 'monthly']
          },
          {
            type: 'churn_rate',
            name: 'Churn Rate',
            description: 'Predict customer churn rates over time',
            timeHorizons: [30, 90, 180],
            granularities: ['daily', 'weekly', 'monthly']
          },
          {
            type: 'usage_patterns',
            name: 'Usage Patterns',
            description: 'Forecast product usage and API consumption',
            timeHorizons: [7, 30, 90],
            granularities: ['hourly', 'daily', 'weekly']
          },
          {
            type: 'conversion_rates',
            name: 'Conversion Rates',
            description: 'Predict trial to paid conversion rates',
            timeHorizons: [30, 90, 180],
            granularities: ['daily', 'weekly', 'monthly']
          }
        ];
        
        return NextResponse.json({
          success: true,
          data: forecastTypes,
          timestamp: new Date().toISOString()
        });

      case 'quick_metrics':
        // Return quick forecast metrics for dashboard
        const quickMetrics = {
          revenue: {
            current: 125000,
            forecast30d: 135000,
            trend: 'increasing',
            confidence: 0.87
          },
          users: {
            current: 2500,
            forecast30d: 2750,
            trend: 'increasing',
            confidence: 0.78
          },
          churn: {
            current: 5.2,
            forecast30d: 4.8,
            trend: 'decreasing',
            confidence: 0.83
          },
          usage: {
            current: 150000,
            forecast30d: 165000,
            trend: 'increasing',
            confidence: 0.89
          }
        };
        
        return NextResponse.json({
          success: true,
          data: quickMetrics,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('ML Forecast GET error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}