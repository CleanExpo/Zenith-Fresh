/**
 * Competitor Feature Tracker - Automated Feature Detection and Analysis
 * 
 * Monitors competitor websites, product pages, and changelogs for new features,
 * pricing changes, and strategic moves.
 */

import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { technologyMonitor } from './technology-monitor';
import { aiSearch } from '@/lib/ai/ai-search';
import { webFetch } from '@/lib/tools/web-fetch';

interface CompetitorProfile {
  id: string;
  name: string;
  domain: string;
  category: 'direct' | 'indirect' | 'adjacent';
  productsTracked: string[];
  trackingUrls: {
    features: string;
    pricing: string;
    changelog?: string;
    blog?: string;
    docs?: string;
  };
  lastChecked: Date;
  checkFrequency: 'daily' | 'weekly' | 'realtime';
}

interface FeatureDetection {
  id: string;
  competitorId: string;
  featureName: string;
  category: 'core' | 'addon' | 'integration' | 'performance' | 'ui' | 'api' | 'pricing';
  description: string;
  detectedDate: Date;
  launchDate?: Date;
  screenshots?: string[];
  technicalDetails: {
    stack?: string[];
    apis?: string[];
    integrations?: string[];
    performance?: string;
  };
  pricingImpact?: {
    type: 'new_tier' | 'price_change' | 'feature_bundling' | 'free_tier_change';
    oldPrice?: number;
    newPrice?: number;
    affectedTiers?: string[];
    details: string;
  };
  marketAnalysis: {
    targetAudience: string[];
    uniqueValue: string;
    competitiveAdvantage: string;
    estimatedDevelopmentTime: string;
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  userReaction?: {
    sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
    feedback: string[];
    adoptionSignals: string[];
  };
}

interface PricingChange {
  id: string;
  competitorId: string;
  changeType: 'increase' | 'decrease' | 'new_plan' | 'plan_removal' | 'feature_change';
  oldPricing: any;
  newPricing: any;
  affectedPlans: string[];
  percentageChange?: number;
  effectiveDate: Date;
  detectedDate: Date;
  marketImpact: string;
  recommendedResponse: string;
}

interface CompetitorSnapshot {
  id: string;
  competitorId: string;
  timestamp: Date;
  features: any[];
  pricing: any;
  marketPosition: any;
  changes: {
    newFeatures: string[];
    removedFeatures: string[];
    priceChanges: any[];
    otherChanges: string[];
  };
}

export class CompetitorFeatureTracker {
  private readonly TRACKING_INTERVAL = 86400000; // 24 hours
  private readonly REALTIME_INTERVAL = 3600000; // 1 hour
  
  constructor() {
    console.log('🎯 Competitor Feature Tracker initialized');
  }

  /**
   * Setup competitor tracking
   */
  async setupCompetitorTracking(competitor: Omit<CompetitorProfile, 'id' | 'lastChecked'>): Promise<string> {
    try {
      // Store competitor profile
      const profile = await prisma.competitorProfile.create({
        data: {
          name: competitor.name,
          domain: competitor.domain,
          category: competitor.category,
          productsTracked: competitor.productsTracked,
          trackingUrls: competitor.trackingUrls,
          checkFrequency: competitor.checkFrequency,
          isActive: true
        }
      });

      // Take initial snapshot
      await this.takeCompetitorSnapshot(profile.id);

      console.log(`✅ Competitor tracking setup for ${competitor.name}`);
      return profile.id;
    } catch (error) {
      console.error('Error setting up competitor tracking:', error);
      throw error;
    }
  }

  /**
   * Monitor all tracked competitors
   */
  async monitorCompetitors(): Promise<FeatureDetection[]> {
    const detectedFeatures: FeatureDetection[] = [];

    try {
      // Get active competitors
      const competitors = await prisma.competitorProfile.findMany({
        where: { isActive: true }
      });

      for (const competitor of competitors) {
        try {
          // Check if it's time to monitor
          if (this.shouldMonitor(competitor)) {
            const features = await this.detectCompetitorChanges(competitor);
            detectedFeatures.push(...features);

            // Update last checked
            await prisma.competitorProfile.update({
              where: { id: competitor.id },
              data: { lastChecked: new Date() }
            });
          }
        } catch (error) {
          console.error(`Error monitoring ${competitor.name}:`, error);
        }
      }

      return detectedFeatures;
    } catch (error) {
      console.error('Error monitoring competitors:', error);
      return detectedFeatures;
    }
  }

  /**
   * Detect changes for a specific competitor
   */
  private async detectCompetitorChanges(competitor: any): Promise<FeatureDetection[]> {
    const detections: FeatureDetection[] = [];

    try {
      // Get current state
      const currentState = await this.scrapeCompetitorData(competitor);
      
      // Get previous snapshot
      const previousSnapshot = await prisma.competitorSnapshot.findFirst({
        where: { competitorId: competitor.id },
        orderBy: { timestamp: 'desc' }
      });

      if (!previousSnapshot) {
        // First scan - save baseline
        await this.saveCompetitorSnapshot(competitor.id, currentState);
        return [];
      }

      // Compare states
      const changes = await this.compareStates(previousSnapshot, currentState);

      // Analyze each change
      for (const change of changes.newFeatures) {
        const analysis = await this.analyzeFeature(change, competitor);
        if (analysis) {
          detections.push(analysis);
        }
      }

      // Check for pricing changes
      if (changes.priceChanges.length > 0) {
        for (const priceChange of changes.priceChanges) {
          await this.handlePricingChange(priceChange, competitor);
        }
      }

      // Save new snapshot if changes detected
      if (changes.newFeatures.length > 0 || changes.priceChanges.length > 0) {
        await this.saveCompetitorSnapshot(competitor.id, currentState, changes);
      }

      return detections;
    } catch (error) {
      console.error(`Error detecting changes for ${competitor.name}:`, error);
      return detections;
    }
  }

  /**
   * Scrape competitor data
   */
  private async scrapeCompetitorData(competitor: any): Promise<any> {
    const data: any = {
      features: [],
      pricing: {},
      timestamp: new Date()
    };

    try {
      // Scrape features page
      if (competitor.trackingUrls.features) {
        const featuresContent = await webFetch.fetch(competitor.trackingUrls.features);
        data.features = await this.extractFeatures(featuresContent, competitor);
      }

      // Scrape pricing page
      if (competitor.trackingUrls.pricing) {
        const pricingContent = await webFetch.fetch(competitor.trackingUrls.pricing);
        data.pricing = await this.extractPricing(pricingContent, competitor);
      }

      // Scrape changelog if available
      if (competitor.trackingUrls.changelog) {
        const changelogContent = await webFetch.fetch(competitor.trackingUrls.changelog);
        data.recentUpdates = await this.extractChangelog(changelogContent);
      }

      // Scrape blog for feature announcements
      if (competitor.trackingUrls.blog) {
        const blogContent = await webFetch.fetch(competitor.trackingUrls.blog);
        data.blogPosts = await this.extractBlogAnnouncements(blogContent);
      }

      return data;
    } catch (error) {
      console.error(`Error scraping ${competitor.name}:`, error);
      return data;
    }
  }

  /**
   * Extract features from HTML content
   */
  private async extractFeatures(html: string, competitor: any): Promise<any[]> {
    const prompt = `
      Extract all product features from this HTML content.
      For each feature, identify:
      1. Feature name
      2. Description
      3. Category (core, addon, integration, performance, ui, api)
      4. Target audience
      5. Any technical details mentioned
      6. Pricing tier (if mentioned)
      
      Focus on ${competitor.productsTracked.join(', ')} products.
      
      HTML: ${html.substring(0, 20000)}
      
      Return as JSON array with detailed feature objects.
    `;

    try {
      const extracted = await aiSearch.generateResponse(prompt);
      return JSON.parse(extracted);
    } catch (error) {
      console.error('Error extracting features:', error);
      return [];
    }
  }

  /**
   * Extract pricing information
   */
  private async extractPricing(html: string, competitor: any): Promise<any> {
    const prompt = `
      Extract pricing information from this HTML content.
      Identify:
      1. All pricing tiers/plans
      2. Price for each tier
      3. Features included in each tier
      4. Any limitations or quotas
      5. Billing periods (monthly/annual)
      6. Any special offers or discounts
      
      HTML: ${html.substring(0, 15000)}
      
      Return as structured JSON with all pricing details.
    `;

    try {
      const extracted = await aiSearch.generateResponse(prompt);
      return JSON.parse(extracted);
    } catch (error) {
      console.error('Error extracting pricing:', error);
      return {};
    }
  }

  /**
   * Extract changelog entries
   */
  private async extractChangelog(html: string): Promise<any[]> {
    const prompt = `
      Extract recent changelog entries from this HTML.
      For each entry, identify:
      1. Date
      2. Version (if mentioned)
      3. Changes/features added
      4. Bug fixes
      5. Breaking changes
      
      Focus on entries from the last 30 days.
      
      HTML: ${html.substring(0, 10000)}
      
      Return as JSON array of changelog entries.
    `;

    try {
      const extracted = await aiSearch.generateResponse(prompt);
      return JSON.parse(extracted);
    } catch (error) {
      console.error('Error extracting changelog:', error);
      return [];
    }
  }

  /**
   * Extract blog announcements
   */
  private async extractBlogAnnouncements(html: string): Promise<any[]> {
    const prompt = `
      Extract product/feature announcements from this blog page.
      Look for:
      1. New feature launches
      2. Product updates
      3. Partnership announcements
      4. Technology integrations
      
      For each announcement, extract:
      - Title
      - Date
      - Summary
      - Key features mentioned
      
      HTML: ${html.substring(0, 10000)}
      
      Return as JSON array.
    `;

    try {
      const extracted = await aiSearch.generateResponse(prompt);
      return JSON.parse(extracted);
    } catch (error) {
      console.error('Error extracting blog announcements:', error);
      return [];
    }
  }

  /**
   * Compare states to detect changes
   */
  private async compareStates(previous: any, current: any): Promise<any> {
    const changes = {
      newFeatures: [],
      removedFeatures: [],
      priceChanges: [],
      otherChanges: []
    };

    // Compare features
    const prevFeatures = previous.features || [];
    const currFeatures = current.features || [];

    // Find new features
    for (const feature of currFeatures) {
      const exists = prevFeatures.find((f: any) => 
        f.name === feature.name || this.similarityScore(f.name, feature.name) > 0.8
      );
      
      if (!exists) {
        changes.newFeatures.push(feature);
      }
    }

    // Find removed features
    for (const feature of prevFeatures) {
      const stillExists = currFeatures.find((f: any) => 
        f.name === feature.name || this.similarityScore(f.name, feature.name) > 0.8
      );
      
      if (!stillExists) {
        changes.removedFeatures.push(feature);
      }
    }

    // Compare pricing
    if (JSON.stringify(previous.pricing) !== JSON.stringify(current.pricing)) {
      changes.priceChanges = await this.analyzePricingChanges(previous.pricing, current.pricing);
    }

    return changes;
  }

  /**
   * Analyze a detected feature
   */
  private async analyzeFeature(feature: any, competitor: any): Promise<FeatureDetection | null> {
    try {
      const prompt = `
        Analyze this new competitor feature:
        Competitor: ${competitor.name}
        Feature: ${JSON.stringify(feature)}
        
        Provide analysis including:
        1. Target audience and use cases
        2. Unique value proposition
        3. Competitive advantage it provides
        4. Estimated development time to match
        5. Threat level (low/medium/high/critical)
        6. Recommended response strategy
        
        Consider our product context and competitive position.
        Return as structured JSON.
      `;

      const analysis = await aiSearch.generateResponse(prompt);
      const parsed = JSON.parse(analysis);

      return {
        id: `feature_${Date.now()}_${Math.random()}`,
        competitorId: competitor.id,
        featureName: feature.name,
        category: feature.category || 'core',
        description: feature.description,
        detectedDate: new Date(),
        launchDate: feature.date ? new Date(feature.date) : undefined,
        technicalDetails: {
          stack: feature.technologies || [],
          apis: feature.apis || [],
          integrations: feature.integrations || []
        },
        marketAnalysis: {
          targetAudience: parsed.targetAudience || [],
          uniqueValue: parsed.uniqueValue || '',
          competitiveAdvantage: parsed.competitiveAdvantage || '',
          estimatedDevelopmentTime: parsed.developmentTime || 'Unknown',
          threatLevel: parsed.threatLevel || 'medium'
        }
      };
    } catch (error) {
      console.error('Error analyzing feature:', error);
      return null;
    }
  }

  /**
   * Analyze pricing changes
   */
  private async analyzePricingChanges(oldPricing: any, newPricing: any): Promise<any[]> {
    const changes: any[] = [];

    try {
      const prompt = `
        Compare these pricing structures and identify all changes:
        
        Old Pricing: ${JSON.stringify(oldPricing)}
        New Pricing: ${JSON.stringify(newPricing)}
        
        For each change, identify:
        1. Type of change (increase/decrease/new plan/removed plan/feature change)
        2. Affected plans/tiers
        3. Percentage change (if applicable)
        4. Strategic implications
        5. Recommended response
        
        Return as JSON array of changes.
      `;

      const analysis = await aiSearch.generateResponse(prompt);
      return JSON.parse(analysis);
    } catch (error) {
      console.error('Error analyzing pricing changes:', error);
      return changes;
    }
  }

  /**
   * Handle detected pricing change
   */
  private async handlePricingChange(change: any, competitor: any): Promise<void> {
    try {
      await prisma.pricingChange.create({
        data: {
          competitorId: competitor.id,
          changeType: change.type,
          oldPricing: change.old,
          newPricing: change.new,
          affectedPlans: change.affectedPlans || [],
          percentageChange: change.percentageChange,
          effectiveDate: change.effectiveDate ? new Date(change.effectiveDate) : new Date(),
          detectedDate: new Date(),
          marketImpact: change.marketImpact || 'Unknown',
          recommendedResponse: change.recommendedResponse || 'Monitor situation'
        }
      });

      // Create alert for significant changes
      if (Math.abs(change.percentageChange || 0) > 10) {
        await this.createCompetitorAlert({
          type: 'pricing_change',
          severity: 'high',
          competitor: competitor.name,
          title: `${competitor.name} changed pricing by ${change.percentageChange}%`,
          description: change.marketImpact,
          action: change.recommendedResponse
        });
      }
    } catch (error) {
      console.error('Error handling pricing change:', error);
    }
  }

  /**
   * Save competitor snapshot
   */
  private async saveCompetitorSnapshot(competitorId: string, data: any, changes?: any): Promise<void> {
    try {
      await prisma.competitorSnapshot.create({
        data: {
          competitorId,
          timestamp: new Date(),
          features: data.features || [],
          pricing: data.pricing || {},
          marketPosition: data.marketPosition || {},
          changes: changes || {
            newFeatures: [],
            removedFeatures: [],
            priceChanges: [],
            otherChanges: []
          }
        }
      });
    } catch (error) {
      console.error('Error saving competitor snapshot:', error);
    }
  }

  /**
   * Take initial competitor snapshot
   */
  private async takeCompetitorSnapshot(competitorId: string): Promise<void> {
    try {
      const competitor = await prisma.competitorProfile.findUnique({
        where: { id: competitorId }
      });

      if (!competitor) return;

      const data = await this.scrapeCompetitorData(competitor);
      await this.saveCompetitorSnapshot(competitorId, data);
    } catch (error) {
      console.error('Error taking competitor snapshot:', error);
    }
  }

  /**
   * Create competitor alert
   */
  private async createCompetitorAlert(alert: any): Promise<void> {
    try {
      await prisma.competitorAlert.create({
        data: {
          type: alert.type,
          severity: alert.severity,
          competitor: alert.competitor,
          title: alert.title,
          description: alert.description,
          recommendedAction: alert.action,
          isRead: false,
          createdAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error creating competitor alert:', error);
    }
  }

  /**
   * Check if monitoring is needed
   */
  private shouldMonitor(competitor: any): boolean {
    if (!competitor.lastChecked) return true;

    const timeSinceLastCheck = Date.now() - competitor.lastChecked.getTime();
    
    switch (competitor.checkFrequency) {
      case 'realtime':
        return timeSinceLastCheck >= this.REALTIME_INTERVAL;
      case 'daily':
        return timeSinceLastCheck >= this.TRACKING_INTERVAL;
      case 'weekly':
        return timeSinceLastCheck >= this.TRACKING_INTERVAL * 7;
      default:
        return timeSinceLastCheck >= this.TRACKING_INTERVAL;
    }
  }

  /**
   * Calculate similarity score between strings
   */
  private similarityScore(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    if (s1 === s2) return 1;
    
    // Simple similarity based on common words
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    const commonWords = words1.filter(w => words2.includes(w));
    
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  /**
   * Get feature detection report
   */
  async getFeatureDetectionReport(timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<any> {
    const startDate = new Date();
    
    switch (timeframe) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
    }

    try {
      // Get detected features
      const detections = await prisma.featureDetection.findMany({
        where: {
          detectedDate: { gte: startDate }
        },
        include: {
          competitor: true
        },
        orderBy: { detectedDate: 'desc' }
      });

      // Get pricing changes
      const pricingChanges = await prisma.pricingChange.findMany({
        where: {
          detectedDate: { gte: startDate }
        },
        include: {
          competitor: true
        },
        orderBy: { detectedDate: 'desc' }
      });

      // Analyze trends
      const featuresByCategory = detections.reduce((acc, det) => {
        acc[det.category] = (acc[det.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const threatLevels = detections.reduce((acc, det) => {
        const level = det.marketAnalysis.threatLevel;
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        timeframe,
        summary: {
          totalFeatures: detections.length,
          pricingChanges: pricingChanges.length,
          criticalThreats: detections.filter(d => d.marketAnalysis.threatLevel === 'critical').length,
          competitorsTracked: new Set(detections.map(d => d.competitorId)).size
        },
        featuresByCategory,
        threatLevels,
        recentDetections: detections.slice(0, 10),
        recentPricingChanges: pricingChanges.slice(0, 5),
        recommendations: await this.generateRecommendations(detections, pricingChanges)
      };
    } catch (error) {
      console.error('Error generating feature detection report:', error);
      throw error;
    }
  }

  /**
   * Generate strategic recommendations
   */
  private async generateRecommendations(detections: any[], pricingChanges: any[]): Promise<any[]> {
    const criticalFeatures = detections.filter(d => 
      d.marketAnalysis.threatLevel === 'critical' || d.marketAnalysis.threatLevel === 'high'
    );

    const recommendations = [];

    if (criticalFeatures.length > 0) {
      recommendations.push({
        priority: 'urgent',
        title: 'Address competitive feature gaps',
        description: `${criticalFeatures.length} high-threat features detected`,
        actions: criticalFeatures.map(f => ({
          feature: f.featureName,
          competitor: f.competitor.name,
          responseTime: f.marketAnalysis.estimatedDevelopmentTime
        }))
      });
    }

    if (pricingChanges.some(p => p.changeType === 'decrease')) {
      recommendations.push({
        priority: 'high',
        title: 'Review pricing strategy',
        description: 'Competitors are reducing prices',
        actions: ['Analyze price elasticity', 'Consider value-added features', 'Review cost structure']
      });
    }

    return recommendations;
  }
}

export const competitorFeatureTracker = new CompetitorFeatureTracker();

// Export types
export type {
  CompetitorProfile,
  FeatureDetection,
  PricingChange,
  CompetitorSnapshot
};