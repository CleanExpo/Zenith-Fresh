// src/app/api/competitive/analysis/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import CompetitiveAdvantageAgent from '@/lib/agents/competitive-advantage-agent';

export async function POST(request: NextRequest) {
  try {
    const { competitor, userId } = await request.json();
    
    if (!competitor) {
      return NextResponse.json(
        { error: 'Competitor name is required' },
        { status: 400 }
      );
    }

    const competitiveAgent = new CompetitiveAdvantageAgent();
    const features = await competitiveAgent.performCompetitorAnalysis(competitor);

    return NextResponse.json({
      success: true,
      competitor,
      features,
      analysisDate: new Date().toISOString()
    });

  } catch (error) {
    console.error('Competitive analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze competitor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const competitor = searchParams.get('competitor') || 'ahrefs';
    
    const competitiveAgent = new CompetitiveAdvantageAgent();
    const features = await competitiveAgent.performCompetitorAnalysis(competitor);

    return NextResponse.json({
      success: true,
      competitor,
      features,
      analysisDate: new Date().toISOString()
    });

  } catch (error) {
    console.error('Competitive analysis fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch competitive analysis' },
      { status: 500 }
    );
  }
}
