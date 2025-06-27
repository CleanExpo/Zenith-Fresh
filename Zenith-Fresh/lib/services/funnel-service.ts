// ===== FUNNEL SERVICE - CORE BUSINESS LOGIC =====

import { PrismaClient } from '@prisma/client';
import { 
  FunnelConfig, 
  FunnelWithSteps, 
  FunnelMetrics, 
  FunnelAnalysis,
  FunnelOptimization,
  OptimizationSuggestion,
  TrackFunnelEventRequest,
  FunnelUserJourney,
  FunnelHealthScore,
  CohortDefinition,
  FunnelAnalysisType,
  OptimizationType
} from '../../types/funnel';

export class FunnelService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ===== FUNNEL MANAGEMENT =====

  async createFunnel(config: FunnelConfig, ownerId: string, teamId?: string, projectId?: string): Promise<FunnelWithSteps> {
    const funnel = await this.prisma.funnel.create({
      data: {
        name: config.name,
        description: config.description,
        ownerId,
        teamId,
        projectId,
        category: config.category,
        optimizationGoal: config.optimizationGoal,
        timeWindow: config.timeWindow || 2592000, // 30 days
        attributionWindow: config.attributionWindow || 86400, // 24 hours
        allowParallelPaths: config.allowParallelPaths || false,
        requireSequential: config.requireSequential !== false,
        steps: {
          create: config.steps.map((step, index) => ({
            stepNumber: index + 1,
            name: step.name,
            description: step.description,
            eventType: step.eventType,
            eventCriteria: step.eventCriteria,
            isRequired: step.isRequired !== false,
            timeLimit: step.timeLimit,
            revenueValue: step.revenueValue || 0
          }))
        },
        goals: config.goals ? {
          create: config.goals.map(goal => ({
            name: goal.name,
            description: goal.description,
            targetMetric: goal.targetMetric,
            targetValue: goal.targetValue,
            comparisonType: goal.comparisonType,
            priority: goal.priority || 'medium'
          }))
        } : undefined
      },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' }
        },
        goals: true,
        analyses: {
          orderBy: { generatedAt: 'desc' },
          take: 5
        },
        optimizations: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    return funnel;
  }

  async getFunnel(funnelId: string): Promise<FunnelWithSteps | null> {
    return this.prisma.funnel.findUnique({
      where: { id: funnelId },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' }
        },
        goals: true,
        analyses: {
          orderBy: { generatedAt: 'desc' },
          take: 10
        },
        optimizations: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
  }

  async getFunnelsByOwner(ownerId: string, teamId?: string): Promise<FunnelWithSteps[]> {
    return this.prisma.funnel.findMany({
      where: {
        ownerId,
        teamId,
        isActive: true
      },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' }
        },
        goals: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateFunnel(funnelId: string, updates: Partial<FunnelConfig>): Promise<FunnelWithSteps> {
    const funnel = await this.prisma.funnel.update({
      where: { id: funnelId },
      data: {
        name: updates.name,
        description: updates.description,
        category: updates.category,
        optimizationGoal: updates.optimizationGoal,
        timeWindow: updates.timeWindow,
        attributionWindow: updates.attributionWindow,
        allowParallelPaths: updates.allowParallelPaths,
        requireSequential: updates.requireSequential
      },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' }
        },
        goals: true,
        analyses: {
          orderBy: { generatedAt: 'desc' },
          take: 5
        },
        optimizations: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    return funnel;
  }

  async deleteFunnel(funnelId: string): Promise<void> {
    await this.prisma.funnel.update({
      where: { id: funnelId },
      data: { isActive: false }
    });
  }

  // ===== EVENT TRACKING =====

  async trackEvent(request: TrackFunnelEventRequest): Promise<string> {
    const event = await this.prisma.funnelEvent.create({
      data: {
        funnelId: request.funnelId,
        stepId: request.stepId,
        userId: request.userId,
        sessionId: request.sessionId,
        eventType: request.eventType,
        eventData: request.eventData,
        properties: request.properties,
        revenueValue: request.revenueValue || 0,
        timestamp: new Date()
      }
    });

    // Trigger real-time analysis if needed
    await this.updateRealTimeMetrics(request.funnelId, request.stepId);

    return event.id;
  }

  async trackPageView(funnelId: string, stepId: string, sessionId: string, userId?: string, url?: string): Promise<string> {
    return this.trackEvent({
      funnelId,
      stepId,
      sessionId,
      userId,
      eventType: 'PAGE_VIEW',
      eventData: { url },
      properties: { timestamp: new Date().toISOString() }
    });
  }

  async trackClick(funnelId: string, stepId: string, sessionId: string, userId?: string, element?: string): Promise<string> {
    return this.trackEvent({
      funnelId,
      stepId,
      sessionId,
      userId,
      eventType: 'BUTTON_CLICK',
      eventData: { element },
      properties: { timestamp: new Date().toISOString() }
    });
  }

  async trackFormSubmit(funnelId: string, stepId: string, sessionId: string, userId?: string, formData?: any): Promise<string> {
    return this.trackEvent({
      funnelId,
      stepId,
      sessionId,
      userId,
      eventType: 'FORM_SUBMIT',
      eventData: formData,
      properties: { timestamp: new Date().toISOString() }
    });
  }

  // ===== ANALYTICS =====

  async getFunnelMetrics(funnelId: string, periodStart: Date, periodEnd: Date): Promise<FunnelMetrics> {
    const [funnel, events, stepMetrics] = await Promise.all([
      this.getFunnel(funnelId),
      this.getFunnelEvents(funnelId, periodStart, periodEnd),
      this.getStepMetrics(funnelId, periodStart, periodEnd)
    ]);

    if (!funnel) {
      throw new Error(`Funnel ${funnelId} not found`);
    }

    const uniqueUsers = new Set(events.filter(e => e.userId).map(e => e.userId)).size;
    const uniqueSessions = new Set(events.map(e => e.sessionId)).size;
    const totalRevenue = events.reduce((sum, event) => sum + (Number(event.revenueValue) || 0), 0);

    const userJourneys = await this.getUserJourneys(funnelId, periodStart, periodEnd);
    const completedJourneys = userJourneys.filter(j => j.overallStatus === 'completed');
    const conversionRate = uniqueUsers > 0 ? completedJourneys.length / uniqueUsers : 0;

    const averageTimeToConvert = completedJourneys.length > 0
      ? completedJourneys.reduce((sum, j) => sum + (j.conversionTime || 0), 0) / completedJourneys.length
      : 0;

    const dropoffPoints = await this.getDropoffPoints(funnelId, periodStart, periodEnd);
    const topSources = await this.getTopTrafficSources(funnelId, periodStart, periodEnd);
    const cohortPerformance = await this.getCohortPerformance(funnelId, periodStart, periodEnd);

    return {
      totalUsers: uniqueUsers,
      totalSessions: uniqueSessions,
      overallConversionRate: conversionRate,
      averageTimeToConvert,
      averageRevenuePerUser: uniqueUsers > 0 ? totalRevenue / uniqueUsers : 0,
      totalRevenue,
      stepConversionRates: stepMetrics,
      dropoffPoints,
      topSources,
      cohortPerformance
    };
  }

  async generateAnalysis(funnelId: string, analysisType: FunnelAnalysisType, periodStart: Date, periodEnd: Date): Promise<FunnelAnalysis> {
    const metrics = await this.getFunnelMetrics(funnelId, periodStart, periodEnd);
    
    let results: any = {};
    let analysisMetrics: any = {};

    switch (analysisType) {
      case FunnelAnalysisType.CONVERSION_RATE:
        results = await this.analyzeConversionRates(funnelId, periodStart, periodEnd);
        analysisMetrics = {
          overallConversionRate: metrics.overallConversionRate,
          stepConversionRates: metrics.stepConversionRates,
          bestPerformingStep: metrics.stepConversionRates.reduce((best, step) => 
            step.conversionRate > best.conversionRate ? step : best, metrics.stepConversionRates[0]),
          worstPerformingStep: metrics.stepConversionRates.reduce((worst, step) => 
            step.conversionRate < worst.conversionRate ? step : worst, metrics.stepConversionRates[0])
        };
        break;

      case FunnelAnalysisType.DROPOFF_ANALYSIS:
        results = await this.analyzeDropoffs(funnelId, periodStart, periodEnd);
        analysisMetrics = {
          totalDropoffs: metrics.dropoffPoints.reduce((sum, dp) => sum + dp.dropoffCount, 0),
          highestDropoffPoint: metrics.dropoffPoints.reduce((highest, dp) => 
            dp.dropoffRate > highest.dropoffRate ? dp : highest, metrics.dropoffPoints[0]),
          potentialRevenueLoss: metrics.dropoffPoints.reduce((sum, dp) => sum + dp.potentialRevenueLoss, 0)
        };
        break;

      case FunnelAnalysisType.COHORT_ANALYSIS:
        results = await this.analyzeCohorts(funnelId, periodStart, periodEnd);
        analysisMetrics = {
          cohortCount: metrics.cohortPerformance.length,
          bestPerformingCohort: metrics.cohortPerformance.reduce((best, cohort) => 
            cohort.conversionRate > best.conversionRate ? cohort : best, metrics.cohortPerformance[0]),
          cohortVariance: this.calculateCohortVariance(metrics.cohortPerformance)
        };
        break;

      case FunnelAnalysisType.TIME_ANALYSIS:
        results = await this.analyzeTimeToConvert(funnelId, periodStart, periodEnd);
        analysisMetrics = {
          averageTimeToConvert: metrics.averageTimeToConvert,
          medianTimeToConvert: await this.getMedianTimeToConvert(funnelId, periodStart, periodEnd),
          timeDistribution: results.timeDistribution
        };
        break;

      case FunnelAnalysisType.ATTRIBUTION_ANALYSIS:
        results = await this.analyzeAttribution(funnelId, periodStart, periodEnd);
        analysisMetrics = {
          topSources: metrics.topSources,
          attributionModel: 'last_click', // TODO: Make configurable
          channelPerformance: results.channelPerformance
        };
        break;

      case FunnelAnalysisType.REVENUE_ANALYSIS:
        results = await this.analyzeRevenue(funnelId, periodStart, periodEnd);
        analysisMetrics = {
          totalRevenue: metrics.totalRevenue,
          averageRevenuePerUser: metrics.averageRevenuePerUser,
          revenueByStep: results.revenueByStep,
          revenueGrowthRate: results.revenueGrowthRate
        };
        break;
    }

    return this.prisma.funnelAnalysis.create({
      data: {
        funnelId,
        analysisType,
        periodStart,
        periodEnd,
        results,
        metrics: analysisMetrics,
        generatedBy: 'system'
      }
    });
  }

  // ===== OPTIMIZATION =====

  async generateOptimizationSuggestions(funnelId: string, analysisTypes?: OptimizationType[]): Promise<OptimizationSuggestion[]> {
    const metrics = await this.getFunnelMetrics(funnelId, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date());
    const funnel = await this.getFunnel(funnelId);
    
    if (!funnel) {
      throw new Error(`Funnel ${funnelId} not found`);
    }

    const suggestions: OptimizationSuggestion[] = [];

    // Analyze dropoff points for optimization opportunities
    for (const dropoff of metrics.dropoffPoints) {
      if (dropoff.dropoffRate > 0.5) { // High dropoff rate
        suggestions.push({
          id: `dropoff-${dropoff.fromStep}-${dropoff.toStep}`,
          type: OptimizationType.FLOW_SIMPLIFICATION,
          title: `Reduce dropoff between ${dropoff.fromStepName} and ${dropoff.toStepName}`,
          description: `${(dropoff.dropoffRate * 100).toFixed(1)}% of users drop off at this point. Consider simplifying the flow or reducing friction.`,
          impact: dropoff.dropoffRate > 0.7 ? 'HIGH' : 'MEDIUM',
          effort: 'MEDIUM',
          confidence: 0.8,
          expectedLift: dropoff.dropoffRate * 0.3, // Assume 30% improvement
          category: 'UX_IMPROVEMENT',
          implementation: {
            steps: [
              'Analyze user behavior recordings at this step',
              'Identify common friction points',
              'A/B test simplified flow',
              'Monitor conversion rate improvement'
            ],
            requirements: ['User research', 'Design resources', 'Development time'],
            estimatedTimeHours: 40,
            technicalComplexity: 'medium',
            resources: ['UX Designer', 'Frontend Developer', 'Data Analyst']
          },
          testingRecommendation: {
            testType: 'ab_test',
            sampleSize: Math.max(1000, Math.ceil(metrics.totalUsers * 0.1)),
            testDuration: 14,
            successMetrics: ['Step conversion rate', 'Overall funnel conversion rate'],
            riskAssessment: 'Low risk - can be easily reverted'
          }
        });
      }
    }

    // Analyze step conversion rates
    for (const step of metrics.stepConversionRates) {
      if (step.conversionRate < 0.3) { // Low conversion rate
        suggestions.push({
          id: `step-optimization-${step.stepNumber}`,
          type: OptimizationType.COPY_OPTIMIZATION,
          title: `Optimize ${step.stepName} conversion`,
          description: `Step ${step.stepNumber} has a ${(step.conversionRate * 100).toFixed(1)}% conversion rate. Consider improving copy, design, or user experience.`,
          impact: 'HIGH',
          effort: 'LOW',
          confidence: 0.7,
          expectedLift: (0.5 - step.conversionRate) * 0.6, // Target 50% conversion with 60% improvement
          category: 'CONTENT',
          implementation: {
            steps: [
              'Review current step content and design',
              'Analyze user feedback and behavior',
              'Create improved variations',
              'A/B test new versions'
            ],
            requirements: ['Content review', 'Design mockups', 'A/B testing setup'],
            estimatedTimeHours: 16,
            technicalComplexity: 'low',
            resources: ['Content Writer', 'UX Designer']
          },
          testingRecommendation: {
            testType: 'ab_test',
            sampleSize: Math.max(500, Math.ceil(step.users * 0.2)),
            testDuration: 7,
            successMetrics: ['Step conversion rate', 'Time on step'],
            riskAssessment: 'Very low risk - content changes only'
          }
        });
      }
    }

    // Revenue optimization suggestions
    if (metrics.averageRevenuePerUser < 50) { // Assuming low revenue threshold
      suggestions.push({
        id: `revenue-optimization`,
        type: OptimizationType.PERSONALIZATION,
        title: 'Implement revenue optimization strategies',
        description: `Average revenue per user is $${metrics.averageRevenuePerUser.toFixed(2)}. Consider upselling, cross-selling, or premium features.`,
        impact: 'HIGH',
        effort: 'HIGH',
        confidence: 0.6,
        expectedLift: 0.25, // 25% revenue increase
        category: 'MARKETING',
        implementation: {
          steps: [
            'Analyze user segments and purchase patterns',
            'Design personalized offers',
            'Implement recommendation engine',
            'Test and optimize pricing strategies'
          ],
          requirements: ['User segmentation', 'Personalization platform', 'Revenue tracking'],
          estimatedTimeHours: 120,
          technicalComplexity: 'high',
          resources: ['Product Manager', 'Data Scientist', 'Backend Developer', 'Marketing Manager']
        },
        testingRecommendation: {
          testType: 'multivariate',
          sampleSize: Math.max(2000, Math.ceil(metrics.totalUsers * 0.3)),
          testDuration: 21,
          successMetrics: ['Revenue per user', 'Conversion rate', 'Average order value'],
          riskAssessment: 'Medium risk - pricing changes may affect user behavior'
        }
      });
    }

    return suggestions.sort((a, b) => {
      // Sort by impact and confidence
      const scoreA = this.calculateOptimizationScore(a);
      const scoreB = this.calculateOptimizationScore(b);
      return scoreB - scoreA;
    });
  }

  async implementOptimization(funnelId: string, optimizationId: string, implementedBy: string): Promise<FunnelOptimization> {
    return this.prisma.funnelOptimization.update({
      where: { id: optimizationId },
      data: {
        status: 'implemented',
        implementedAt: new Date(),
        implementedBy
      }
    });
  }

  // ===== HELPER METHODS =====

  private async getFunnelEvents(funnelId: string, periodStart: Date, periodEnd: Date) {
    return this.prisma.funnelEvent.findMany({
      where: {
        funnelId,
        timestamp: {
          gte: periodStart,
          lte: periodEnd
        }
      },
      orderBy: { timestamp: 'asc' }
    });
  }

  private async getStepMetrics(funnelId: string, periodStart: Date, periodEnd: Date) {
    const funnel = await this.getFunnel(funnelId);
    if (!funnel) return [];

    const stepMetrics = [];
    
    for (const step of funnel.steps) {
      const stepEvents = await this.prisma.funnelEvent.findMany({
        where: {
          funnelId,
          stepId: step.id,
          timestamp: {
            gte: periodStart,
            lte: periodEnd
          }
        }
      });

      const uniqueUsers = new Set(stepEvents.filter(e => e.userId).map(e => e.userId)).size;
      const nextStep = funnel.steps.find(s => s.stepNumber === step.stepNumber + 1);
      
      let conversionRate = 0;
      if (nextStep) {
        const nextStepEvents = await this.prisma.funnelEvent.findMany({
          where: {
            funnelId,
            stepId: nextStep.id,
            timestamp: {
              gte: periodStart,
              lte: periodEnd
            }
          }
        });
        const nextStepUsers = new Set(nextStepEvents.filter(e => e.userId).map(e => e.userId)).size;
        conversionRate = uniqueUsers > 0 ? nextStepUsers / uniqueUsers : 0;
      }

      const revenueGenerated = stepEvents.reduce((sum, event) => sum + (Number(event.revenueValue) || 0), 0);
      const averageTimeOnStep = await this.calculateAverageTimeOnStep(step.id, periodStart, periodEnd);

      stepMetrics.push({
        stepNumber: step.stepNumber,
        stepName: step.name,
        users: uniqueUsers,
        conversionRate,
        dropoffRate: 1 - conversionRate,
        averageTimeOnStep,
        revenueGenerated
      });
    }

    return stepMetrics;
  }

  private async getUserJourneys(funnelId: string, periodStart: Date, periodEnd: Date): Promise<FunnelUserJourney[]> {
    const events = await this.getFunnelEvents(funnelId, periodStart, periodEnd);
    const journeyMap = new Map<string, FunnelUserJourney>();

    for (const event of events) {
      const key = event.userId || event.sessionId;
      
      if (!journeyMap.has(key)) {
        journeyMap.set(key, {
          userId: event.userId || '',
          sessionId: event.sessionId,
          steps: [],
          overallStatus: 'not_started',
          revenueGenerated: 0
        });
      }

      const journey = journeyMap.get(key)!;
      const existingStep = journey.steps.find(s => s.stepId === event.stepId);
      
      if (!existingStep) {
        journey.steps.push({
          stepId: event.stepId,
          status: 'completed',
          timestamp: event.timestamp,
          timeSpent: 0
        });
      }

      journey.revenueGenerated += Number(event.revenueValue) || 0;
    }

    // Calculate journey status and conversion time
    const funnel = await this.getFunnel(funnelId);
    if (!funnel) return [];

    for (const journey of journeyMap.values()) {
      const completedSteps = journey.steps.filter(s => s.status === 'completed').length;
      const totalSteps = funnel.steps.length;
      
      if (completedSteps === totalSteps) {
        journey.overallStatus = 'completed';
        const firstStep = journey.steps.reduce((earliest, step) => 
          step.timestamp && (!earliest.timestamp || step.timestamp < earliest.timestamp) ? step : earliest);
        const lastStep = journey.steps.reduce((latest, step) => 
          step.timestamp && (!latest.timestamp || step.timestamp > latest.timestamp) ? step : latest);
        
        if (firstStep.timestamp && lastStep.timestamp) {
          journey.conversionTime = (lastStep.timestamp.getTime() - firstStep.timestamp.getTime()) / 1000;
        }
      } else if (completedSteps > 0) {
        journey.overallStatus = 'in_progress';
      } else {
        journey.overallStatus = 'dropped_off';
      }
    }

    return Array.from(journeyMap.values());
  }

  private async getDropoffPoints(funnelId: string, periodStart: Date, periodEnd: Date) {
    const stepMetrics = await this.getStepMetrics(funnelId, periodStart, periodEnd);
    const dropoffPoints = [];

    for (let i = 0; i < stepMetrics.length - 1; i++) {
      const currentStep = stepMetrics[i];
      const nextStep = stepMetrics[i + 1];
      
      const dropoffCount = currentStep.users - nextStep.users;
      const dropoffRate = currentStep.users > 0 ? dropoffCount / currentStep.users : 0;
      const potentialRevenueLoss = dropoffCount * (currentStep.revenueGenerated / Math.max(currentStep.users, 1));

      dropoffPoints.push({
        fromStep: currentStep.stepNumber,
        toStep: nextStep.stepNumber,
        fromStepName: currentStep.stepName,
        toStepName: nextStep.stepName,
        dropoffCount,
        dropoffRate,
        potentialRevenueLoss
      });
    }

    return dropoffPoints;
  }

  private async getTopTrafficSources(funnelId: string, periodStart: Date, periodEnd: Date) {
    const events = await this.prisma.funnelEvent.findMany({
      where: {
        funnelId,
        timestamp: {
          gte: periodStart,
          lte: periodEnd
        },
        utmSource: { not: null }
      },
      select: {
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        userId: true,
        sessionId: true,
        revenueValue: true
      }
    });

    const sourceMap = new Map();
    
    for (const event of events) {
      const key = `${event.utmSource}-${event.utmMedium}`;
      if (!sourceMap.has(key)) {
        sourceMap.set(key, {
          source: event.utmSource,
          medium: event.utmMedium,
          campaign: event.utmCampaign,
          users: new Set(),
          sessions: new Set(),
          revenue: 0
        });
      }
      
      const sourceData = sourceMap.get(key);
      if (event.userId) sourceData.users.add(event.userId);
      sourceData.sessions.add(event.sessionId);
      sourceData.revenue += Number(event.revenueValue) || 0;
    }

    return Array.from(sourceMap.values()).map(source => ({
      source: source.source,
      medium: source.medium,
      campaign: source.campaign,
      users: source.users.size,
      sessions: source.sessions.size,
      conversionRate: 0, // TODO: Calculate conversion rate
      revenuePerUser: source.users.size > 0 ? source.revenue / source.users.size : 0
    })).sort((a, b) => b.users - a.users);
  }

  private async getCohortPerformance(funnelId: string, periodStart: Date, periodEnd: Date) {
    // TODO: Implement cohort performance analysis
    return [];
  }

  private async updateRealTimeMetrics(funnelId: string, stepId: string): Promise<void> {
    // TODO: Implement real-time metrics update
    // This could update a Redis cache or trigger webhooks
  }

  private calculateOptimizationScore(suggestion: OptimizationSuggestion): number {
    const impactScore = suggestion.impact === 'HIGH' ? 3 : suggestion.impact === 'MEDIUM' ? 2 : 1;
    const effortScore = suggestion.effort === 'LOW' ? 3 : suggestion.effort === 'MEDIUM' ? 2 : 1;
    const confidenceScore = suggestion.confidence;
    
    return (impactScore * 0.4 + effortScore * 0.3 + confidenceScore * 0.3) * suggestion.expectedLift;
  }

  private calculateCohortVariance(cohorts: any[]): number {
    if (cohorts.length === 0) return 0;
    
    const mean = cohorts.reduce((sum, c) => sum + c.conversionRate, 0) / cohorts.length;
    const variance = cohorts.reduce((sum, c) => sum + Math.pow(c.conversionRate - mean, 2), 0) / cohorts.length;
    
    return Math.sqrt(variance);
  }

  private async calculateAverageTimeOnStep(stepId: string, periodStart: Date, periodEnd: Date): Promise<number> {
    // TODO: Implement time on step calculation
    // This would require tracking session events and calculating time differences
    return 0;
  }

  private async getMedianTimeToConvert(funnelId: string, periodStart: Date, periodEnd: Date): Promise<number> {
    const journeys = await this.getUserJourneys(funnelId, periodStart, periodEnd);
    const conversionTimes = journeys
      .filter(j => j.overallStatus === 'completed' && j.conversionTime)
      .map(j => j.conversionTime!)
      .sort((a, b) => a - b);
    
    if (conversionTimes.length === 0) return 0;
    
    const middle = Math.floor(conversionTimes.length / 2);
    return conversionTimes.length % 2 === 0
      ? (conversionTimes[middle - 1] + conversionTimes[middle]) / 2
      : conversionTimes[middle];
  }

  // Analysis methods (placeholders for detailed implementations)
  private async analyzeConversionRates(funnelId: string, periodStart: Date, periodEnd: Date): Promise<any> {
    // TODO: Implement detailed conversion rate analysis
    return {};
  }

  private async analyzeDropoffs(funnelId: string, periodStart: Date, periodEnd: Date): Promise<any> {
    // TODO: Implement detailed dropoff analysis
    return {};
  }

  private async analyzeCohorts(funnelId: string, periodStart: Date, periodEnd: Date): Promise<any> {
    // TODO: Implement detailed cohort analysis
    return {};
  }

  private async analyzeTimeToConvert(funnelId: string, periodStart: Date, periodEnd: Date): Promise<any> {
    // TODO: Implement detailed time analysis
    return { timeDistribution: {} };
  }

  private async analyzeAttribution(funnelId: string, periodStart: Date, periodEnd: Date): Promise<any> {
    // TODO: Implement detailed attribution analysis
    return { channelPerformance: {} };
  }

  private async analyzeRevenue(funnelId: string, periodStart: Date, periodEnd: Date): Promise<any> {
    // TODO: Implement detailed revenue analysis
    return { revenueByStep: {}, revenueGrowthRate: 0 };
  }
}