// src/app/api/competitive/intelligence/report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { competitiveIntelligenceEngine } from '@/lib/services/competitive-intelligence-engine';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetDomain, options = {} } = body;

    if (!targetDomain) {
      return NextResponse.json(
        { error: 'Target domain is required' },
        { status: 400 }
      );
    }

    // Check team access
    const teamId = request.headers.get('x-team-id');
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { billing: true }
    });

    if (!team || !['pro', 'enterprise'].includes(team.subscriptionPlan || '')) {
      return NextResponse.json(
        { error: 'Upgrade required for competitive intelligence reports' },
        { status: 403 }
      );
    }

    // Generate comprehensive competitive intelligence report
    const report = await competitiveIntelligenceEngine.generateCompetitiveIntelligenceReport(
      targetDomain,
      {
        maxCompetitors: options.maxCompetitors || 5,
        includeKeywordGaps: options.includeKeywordGaps !== false,
        includeBacklinkGaps: options.includeBacklinkGaps !== false,
        includeContentGaps: options.includeContentGaps !== false
      }
    );

    // Store comprehensive analysis in database
    const analysis = await prisma.competitiveAnalysis.create({
      data: {
        targetDomain,
        teamId,
        marketPosition: report.marketPosition,
        opportunities: report.opportunities,
        strengths: [], // Would be calculated from analysis
        weaknesses: [], // Would be calculated from analysis
        recommendations: report.recommendations,
        benchmarkData: {
          averageAuthorityScore: report.competitors.reduce((sum, c) => sum + c.authorityScore, 0) / report.competitors.length,
          topPerformerScore: Math.max(...report.competitors.map(c => c.authorityScore)),
          industryMedian: report.competitors[Math.floor(report.competitors.length / 2)]?.authorityScore || 0
        },
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // Create competitive intelligence alerts for high-impact opportunities
    const highImpactOpportunities = report.opportunities.filter(o => o.impact === 'high');
    
    for (const opportunity of highImpactOpportunities.slice(0, 5)) {
      await prisma.competitiveAlert.create({
        data: {
          analysisId: analysis.id,
          teamId,
          alertType: opportunity.category.includes('Keyword') ? 'KEYWORD_OPPORTUNITY' : 
                    opportunity.category.includes('Backlink') ? 'BACKLINK_GAIN' : 'CONTENT_PUBLISHED',
          severity: opportunity.impact === 'high' ? 'HIGH' : 'MEDIUM',
          title: `New ${opportunity.category} Opportunity`,
          description: opportunity.description,
          data: {
            category: opportunity.category,
            competitorExample: opportunity.competitorExample,
            impact: opportunity.impact
          }
        }
      });
    }

    // Calculate competitive intelligence score
    const competitiveScore = this.calculateCompetitiveScore(report);

    // Generate executive summary
    const executiveSummary = this.generateExecutiveSummary(report, competitiveScore);

    // Track API usage for billing
    await prisma.analyticsEvent.create({
      data: {
        event: 'competitive_intelligence_report_generated',
        userId: session.user.id,
        sessionId: session.user.id,
        properties: {
          targetDomain,
          competitorsAnalyzed: report.competitors.length,
          keywordGapsFound: report.keywordGaps.length,
          backlinkGapsFound: report.backlinkGaps.length,
          contentGapsFound: report.contentGaps.length,
          teamId
        }
      }
    });

    // Store report usage for team
    await prisma.competitiveReport.create({
      data: {
        teamId,
        targetDomain,
        competitors: report.competitors.map(c => c.domain),
        status: 'completed'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        analysisId: analysis.id,
        targetDomain: report.targetDomain,
        competitiveScore,
        executiveSummary,
        marketPosition: report.marketPosition,
        competitors: report.competitors.map(c => ({
          domain: c.domain,
          name: c.name,
          relevanceScore: c.relevanceScore,
          trafficSimilarity: c.trafficSimilarity,
          keywordOverlap: c.keywordOverlap,
          industry: c.industry,
          estimatedTraffic: c.estimatedTraffic,
          authorityScore: c.authorityScore,
          discoveryMethod: c.discoveryMethod
        })),
        gaps: {
          keywords: {
            total: report.keywordGaps.length,
            urgent: report.keywordGaps.filter(k => k.priority === 'urgent').length,
            high: report.keywordGaps.filter(k => k.priority === 'high').length,
            potentialTraffic: report.keywordGaps
              .filter(k => k.priority === 'urgent' || k.priority === 'high')
              .reduce((sum, k) => sum + (k.searchVolume * 0.1), 0),
            topOpportunities: report.keywordGaps.slice(0, 10)
          },
          backlinks: {
            total: report.backlinkGaps.length,
            highAuthority: report.backlinkGaps.filter(b => b.domainAuthority >= 70).length,
            readyForOutreach: report.backlinkGaps.filter(b => b.contactEmail && b.outreachDifficulty < 70).length,
            potentialDAIncrease: report.backlinkGaps
              .filter(b => b.priority === 'urgent' || b.priority === 'high')
              .reduce((sum, b) => sum + (b.domainAuthority * 0.01), 0),
            topOpportunities: report.backlinkGaps.slice(0, 10)
          },
          content: {
            total: report.contentGaps.length,
            urgent: report.contentGaps.filter(c => c.priority === 'urgent').length,
            potentialTraffic: report.contentGaps.reduce((sum, c) => sum + c.estimatedTraffic, 0),
            quickWins: report.contentGaps
              .filter(c => c.estimatedTraffic > 1000 && c.priority === 'high')
              .slice(0, 5),
            topOpportunities: report.contentGaps.slice(0, 10)
          }
        },
        opportunities: report.opportunities,
        recommendations: report.recommendations,
        actionPlan: this.generateActionPlan(report),
        metadata: {
          generatedAt: new Date().toISOString(),
          analysisDepth: 'comprehensive',
          dataFreshness: '24h',
          nextRecommendedUpdate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        }
      }
    });

  } catch (error) {
    console.error('Competitive intelligence report error:', error);
    return NextResponse.json(
      { 
        error: 'Report generation failed',
        message: 'Unable to generate competitive intelligence report. Please try again.'
      },
      { status: 500 }
    );
  }

  // Helper method to calculate competitive score
  calculateCompetitiveScore(report: any): number {
    const marketPositionScore = report.marketPosition.percentile;
    const opportunityScore = Math.min(
      (report.keywordGaps.filter((k: any) => k.priority === 'urgent').length * 10 +
       report.backlinkGaps.filter((b: any) => b.priority === 'urgent').length * 15 +
       report.contentGaps.filter((c: any) => c.priority === 'urgent').length * 5), 100
    );
    
    return Math.round((marketPositionScore * 0.6 + opportunityScore * 0.4));
  }

  // Helper method to generate executive summary
  generateExecutiveSummary(report: any, competitiveScore: number): string {
    const position = report.marketPosition.rank <= 3 ? 'leading' : 
                    report.marketPosition.rank <= 10 ? 'strong' : 'developing';
    
    const urgentOpportunities = report.opportunities.filter((o: any) => o.impact === 'high').length;
    
    return `Your domain ranks #${report.marketPosition.rank} out of ${report.marketPosition.totalAnalyzed} analyzed competitors (${report.marketPosition.percentile}th percentile), indicating a ${position} market position. We identified ${urgentOpportunities} high-impact opportunities across keyword gaps, backlink acquisition, and content development. Your competitive intelligence score is ${competitiveScore}/100, with immediate potential for improvement through the recommended strategic initiatives.`;
  }

  // Helper method to generate action plan
  generateActionPlan(report: any): any {
    const urgentKeywords = report.keywordGaps.filter((k: any) => k.priority === 'urgent').length;
    const urgentBacklinks = report.backlinkGaps.filter((b: any) => b.priority === 'urgent').length;
    const urgentContent = report.contentGaps.filter((c: any) => c.priority === 'urgent').length;

    return {
      immediate: {
        duration: '0-30 days',
        priority: 'urgent',
        actions: [
          urgentKeywords > 0 && `Target ${Math.min(urgentKeywords, 5)} high-opportunity keywords`,
          urgentBacklinks > 0 && `Initiate outreach for ${Math.min(urgentBacklinks, 3)} premium backlinks`,
          urgentContent > 0 && `Create ${Math.min(urgentContent, 2)} high-impact content pieces`
        ].filter(Boolean)
      },
      shortTerm: {
        duration: '1-3 months',
        priority: 'high',
        actions: [
          'Expand content calendar based on competitor gaps',
          'Execute systematic backlink acquisition program',
          'Optimize existing content for identified keyword opportunities',
          'Monitor competitor changes and new opportunities'
        ]
      },
      longTerm: {
        duration: '3-12 months',
        priority: 'strategic',
        actions: [
          'Develop content hub around top-performing competitor topics',
          'Build domain authority through consistent link acquisition',
          'Establish thought leadership in identified content gaps',
          'Automate competitive monitoring and alerting'
        ]
      }
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetDomain = searchParams.get('domain');
    const analysisId = searchParams.get('analysisId');
    const teamId = request.headers.get('x-team-id');

    if (!targetDomain || !teamId) {
      return NextResponse.json(
        { error: 'Target domain and team ID are required' },
        { status: 400 }
      );
    }

    // Get the most recent completed analysis
    const where: any = { teamId, status: 'COMPLETED' };
    if (analysisId) {
      where.id = analysisId;
    } else {
      where.targetDomain = targetDomain;
    }

    const analysis = await prisma.competitiveAnalysis.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        keywordGaps: {
          take: 50,
          orderBy: { opportunityScore: 'desc' }
        },
        backlinkGaps: {
          take: 50,
          orderBy: { linkValue: 'desc' }
        },
        contentGaps: {
          take: 30,
          orderBy: { opportunityScore: 'desc' }
        },
        alerts: {
          where: { isRead: false },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'No competitive analysis found' },
        { status: 404 }
      );
    }

    // Get competitor profiles
    const competitorDomains = analysis.keywordGaps
      .flatMap(kg => kg.competitorData as any[])
      .map((comp: any) => comp.domain)
      .filter((domain, index, self) => self.indexOf(domain) === index)
      .slice(0, 10);

    const competitors = await prisma.competitorProfile.findMany({
      where: { domain: { in: competitorDomains } }
    });

    return NextResponse.json({
      success: true,
      data: {
        analysisId: analysis.id,
        targetDomain: analysis.targetDomain,
        status: analysis.status,
        completedAt: analysis.completedAt,
        marketPosition: analysis.marketPosition,
        competitors: competitors.map(c => ({
          domain: c.domain,
          name: c.name,
          industry: c.industry,
          estimatedTraffic: c.traffic,
          authorityScore: c.authorityScore,
          lastAnalyzed: c.lastAnalyzed
        })),
        gaps: {
          keywords: analysis.keywordGaps.map(kg => ({
            keyword: kg.keyword,
            searchVolume: kg.searchVolume,
            difficulty: kg.difficulty,
            gapType: kg.gapType.toLowerCase(),
            opportunityScore: kg.opportunityScore,
            priority: kg.priority.toLowerCase()
          })),
          backlinks: analysis.backlinkGaps.map(bg => ({
            linkingDomain: bg.linkingDomain,
            domainAuthority: bg.domainAuthority,
            linkValue: bg.linkValue,
            priority: bg.priority.toLowerCase(),
            outreachStatus: bg.outreachStatus.toLowerCase()
          })),
          content: analysis.contentGaps.map(cg => ({
            topic: cg.topic,
            contentType: cg.contentType.toLowerCase(),
            estimatedTraffic: cg.estimatedTraffic,
            opportunityScore: cg.opportunityScore,
            priority: cg.priority.toLowerCase()
          }))
        },
        opportunities: analysis.opportunities,
        recommendations: analysis.recommendations,
        alerts: analysis.alerts.map(alert => ({
          id: alert.id,
          type: alert.alertType.toLowerCase(),
          severity: alert.severity.toLowerCase(),
          title: alert.title,
          description: alert.description,
          createdAt: alert.createdAt
        })),
        metadata: {
          cached: true,
          lastUpdated: analysis.updatedAt,
          totalGaps: analysis.keywordGaps.length + analysis.backlinkGaps.length + analysis.contentGaps.length
        }
      }
    });

  } catch (error) {
    console.error('Get competitive intelligence report error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve competitive intelligence report' },
      { status: 500 }
    );
  }
}