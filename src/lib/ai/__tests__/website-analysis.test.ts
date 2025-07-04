/**
 * AI Website Analysis Engine Tests
 * Comprehensive test suite for AI-powered analysis functionality
 */

import { jest } from '@jest/globals';
import { enhancedAIAnalyzer } from '../website-analysis';
import type { AIAnalysisRequest } from '../website-analysis';

// Mock dependencies
jest.mock('@/lib/feature-flags', () => ({
  featureFlagService: {
    isFeatureEnabled: jest.fn(() => true)
  }
}));

jest.mock('@/lib/analytics/analytics-enhanced', () => ({
  analytics: {
    trackEvent: jest.fn()
  }
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    websiteAnalysis: {
      create: jest.fn()
    }
  }
}));

jest.mock('@/lib/redis', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn()
  }
}));

// Mock fetch
global.fetch = jest.fn();

describe('Enhanced AI Analyzer', () => {
  const mockAnalysisRequest: AIAnalysisRequest = {
    url: 'https://example.com',
    content: '<html><head><title>Test Page</title></head><body><h1>Hello World</h1><p>This is a test page.</p></body></html>',
    metadata: {
      title: 'Test Page',
      description: 'A test page for analysis',
      keywords: ['test', 'example'],
      pageType: 'homepage'
    },
    options: {
      analysisType: 'comprehensive',
      competitorUrls: ['https://competitor.com'],
      industry: 'technology'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock OpenAI/Claude API responses
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: {
            content: 'Readability: 75, Engagement: 70, Content gaps: Missing testimonials'
          }
        }]
      })
    });
  });

  describe('AI Analysis Request Validation', () => {
    it('should validate required fields', async () => {
      const invalidRequest = {
        ...mockAnalysisRequest,
        url: ''
      };

      await expect(enhancedAIAnalyzer.analyzeWebsite(invalidRequest))
        .rejects.toThrow();
    });

    it('should handle missing content gracefully', async () => {
      const requestWithoutContent = {
        ...mockAnalysisRequest,
        content: ''
      };

      const result = await enhancedAIAnalyzer.analyzeWebsite(requestWithoutContent);
      expect(result).toBeDefined();
      expect(result.analysisId).toBeDefined();
    });

    it('should validate URL format', async () => {
      const invalidUrlRequest = {
        ...mockAnalysisRequest,
        url: 'invalid-url'
      };

      await expect(enhancedAIAnalyzer.analyzeWebsite(invalidUrlRequest))
        .rejects.toThrow();
    });
  });

  describe('Content Quality Analysis', () => {
    it('should analyze content readability', async () => {
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      expect(result.contentQuality).toBeDefined();
      expect(result.contentQuality.readabilityScore).toBeGreaterThanOrEqual(0);
      expect(result.contentQuality.readabilityScore).toBeLessThanOrEqual(100);
    });

    it('should identify content gaps', async () => {
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      expect(result.contentQuality.contentGaps).toBeInstanceOf(Array);
      expect(result.contentQuality.strengths).toBeInstanceOf(Array);
    });

    it('should analyze sentiment and tone', async () => {
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      expect(result.contentQuality.sentimentAnalysis).toBeDefined();
      expect(['professional', 'casual', 'technical', 'promotional'])
        .toContain(result.contentQuality.sentimentAnalysis.tone);
      expect(['positive', 'neutral', 'negative'])
        .toContain(result.contentQuality.sentimentAnalysis.sentiment);
    });

    it('should evaluate content structure', async () => {
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      expect(result.contentQuality.contentStructure).toBeDefined();
      expect(result.contentQuality.contentStructure.headingHierarchy).toBeDefined();
      expect(result.contentQuality.contentStructure.callsToAction).toBeGreaterThanOrEqual(0);
    });
  });

  describe('SEO Insights Analysis', () => {
    it('should provide technical SEO score', async () => {
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      expect(result.seoInsights.technicalScore).toBeGreaterThanOrEqual(0);
      expect(result.seoInsights.technicalScore).toBeLessThanOrEqual(100);
    });

    it('should identify opportunity areas', async () => {
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      expect(result.seoInsights.opportunityAreas).toBeInstanceOf(Array);
      expect(result.seoInsights.criticalIssues).toBeInstanceOf(Array);
    });

    it('should analyze keyword optimization', async () => {
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      expect(result.seoInsights.keywordOptimization).toBeDefined();
      expect(result.seoInsights.keywordOptimization.targetKeywords).toBeInstanceOf(Array);
      expect(result.seoInsights.keywordOptimization.missingKeywords).toBeInstanceOf(Array);
    });

    it('should assess search intent alignment', async () => {
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      expect(result.seoInsights.searchIntentAlignment).toBeDefined();
      expect(['informational', 'navigational', 'transactional', 'commercial'])
        .toContain(result.seoInsights.searchIntentAlignment.primaryIntent);
      expect(result.seoInsights.searchIntentAlignment.alignment).toBeGreaterThanOrEqual(0);
      expect(result.seoInsights.searchIntentAlignment.alignment).toBeLessThanOrEqual(100);
    });
  });

  describe('User Experience Analysis', () => {
    it('should calculate usability score', async () => {
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      expect(result.userExperience.usabilityScore).toBeGreaterThanOrEqual(0);
      expect(result.userExperience.usabilityScore).toBeLessThanOrEqual(100);
    });

    it('should assess accessibility', async () => {
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      expect(result.userExperience.accessibilityScore).toBeGreaterThanOrEqual(0);
      expect(result.userExperience.accessibilityScore).toBeLessThanOrEqual(100);
    });

    it('should evaluate mobile experience', async () => {
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      expect(result.userExperience.mobileExperience).toBeGreaterThanOrEqual(0);
      expect(result.userExperience.mobileExperience).toBeLessThanOrEqual(100);
    });

    it('should analyze conversion optimization factors', async () => {
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      expect(result.userExperience.conversionOptimization).toBeDefined();
      expect(result.userExperience.conversionOptimization.ctaEffectiveness).toBeGreaterThanOrEqual(0);
      expect(result.userExperience.conversionOptimization.trustSignals).toBeGreaterThanOrEqual(0);
    });

    it('should identify user journey issues', async () => {
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      expect(result.userExperience.userJourneyIssues).toBeInstanceOf(Array);
      expect(result.userExperience.cognitiveLoadFactors).toBeInstanceOf(Array);
    });
  });

  describe('Performance Insights', () => {
    it('should analyze Core Web Vitals', async () => {
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      expect(result.performanceInsights.coreWebVitalsAnalysis).toBeDefined();
      expect(result.performanceInsights.coreWebVitalsAnalysis.lcp).toBeDefined();
      expect(result.performanceInsights.coreWebVitalsAnalysis.inp).toBeDefined();
      expect(result.performanceInsights.coreWebVitalsAnalysis.cls).toBeDefined();
    });

    it('should identify performance bottlenecks', async () => {
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      expect(result.performanceInsights.bottleneckAnalysis).toBeInstanceOf(Array);
      expect(result.performanceInsights.optimizationOpportunities).toBeInstanceOf(Array);
    });

    it('should provide optimization recommendations', async () => {
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      result.performanceInsights.optimizationOpportunities.forEach(opportunity => {
        expect(['high', 'medium', 'low']).toContain(opportunity.priority);
        expect(opportunity.description).toBeDefined();
        expect(opportunity.estimatedImpact).toBeDefined();
      });
    });
  });

  describe('Intelligent Recommendations', () => {
    it('should generate prioritized recommendations', async () => {
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.recommendations.length).toBeGreaterThan(0);
      
      result.recommendations.forEach(recommendation => {
        expect(recommendation.id).toBeDefined();
        expect(recommendation.title).toBeDefined();
        expect(recommendation.description).toBeDefined();
        expect(['critical', 'high', 'medium', 'low']).toContain(recommendation.priority);
        expect(['easy', 'medium', 'hard', 'expert']).toContain(recommendation.difficulty);
      });
    });

    it('should include ROI estimates', async () => {
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      result.recommendations.forEach(recommendation => {
        expect(recommendation.roiEstimate).toBeDefined();
        expect(recommendation.roiEstimate.effort).toBeGreaterThanOrEqual(1);
        expect(recommendation.roiEstimate.effort).toBeLessThanOrEqual(10);
        expect(recommendation.roiEstimate.value).toBeGreaterThanOrEqual(1);
        expect(recommendation.roiEstimate.value).toBeLessThanOrEqual(10);
      });
    });

    it('should provide implementation guidance', async () => {
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      result.recommendations.forEach(recommendation => {
        expect(recommendation.implementation).toBeDefined();
        expect(recommendation.implementation.steps).toBeInstanceOf(Array);
        expect(recommendation.implementation.resources).toBeInstanceOf(Array);
        expect(recommendation.implementation.toolsNeeded).toBeInstanceOf(Array);
      });
    });

    it('should estimate impact metrics', async () => {
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      result.recommendations.forEach(recommendation => {
        expect(recommendation.estimatedImpact).toBeDefined();
        expect(recommendation.estimatedImpact.trafficIncrease).toBeGreaterThanOrEqual(0);
        expect(recommendation.estimatedImpact.conversionImprovement).toBeGreaterThanOrEqual(0);
        expect(recommendation.estimatedImpact.timeToComplete).toBeDefined();
      });
    });
  });

  describe('Competitive Analysis', () => {
    it('should analyze competitors when URLs provided', async () => {
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      if (result.competitiveIntelligence) {
        expect(result.competitiveIntelligence.competitorInsights).toBeInstanceOf(Array);
        expect(result.competitiveIntelligence.marketPosition).toBeDefined();
        expect(result.competitiveIntelligence.benchmarkComparison).toBeInstanceOf(Array);
      }
    });

    it('should provide differentiation opportunities', async () => {
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      if (result.competitiveIntelligence) {
        expect(result.competitiveIntelligence.differentiationOpportunities).toBeInstanceOf(Array);
      }
    });

    it('should benchmark against industry metrics', async () => {
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      if (result.competitiveIntelligence) {
        result.competitiveIntelligence.benchmarkComparison.forEach(benchmark => {
          expect(benchmark.category).toBeDefined();
          expect(benchmark.userScore).toBeGreaterThanOrEqual(0);
          expect(benchmark.industryAverage).toBeGreaterThanOrEqual(0);
          expect(benchmark.topPerformer).toBeGreaterThanOrEqual(0);
        });
      }
    });
  });

  describe('Overall Scoring', () => {
    it('should calculate weighted overall score', async () => {
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(Number.isInteger(result.overallScore)).toBe(true);
    });

    it('should provide consistent scoring across runs', async () => {
      // Mock cache to return null
      const { cache } = require('@/lib/redis');
      cache.get.mockResolvedValue(null);
      
      const result1 = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      const result2 = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      // Scores should be consistent for same input
      expect(Math.abs(result1.overallScore - result2.overallScore)).toBeLessThan(10);
    });
  });

  describe('Caching and Performance', () => {
    it('should cache analysis results', async () => {
      const { cache } = require('@/lib/redis');
      cache.get.mockResolvedValue(null);
      
      await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      expect(cache.set).toHaveBeenCalled();
    });

    it('should return cached results when available', async () => {
      const { cache } = require('@/lib/redis');
      const cachedResult = {
        analysisId: 'cached-123',
        overallScore: 85,
        contentQuality: { readabilityScore: 80 },
        timestamp: new Date().toISOString()
      };
      
      cache.get.mockResolvedValue(cachedResult);
      
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      expect(result.analysisId).toBe('cached-123');
      expect(result.overallScore).toBe(85);
    });

    it('should handle cache errors gracefully', async () => {
      const { cache } = require('@/lib/redis');
      cache.get.mockRejectedValue(new Error('Cache error'));
      cache.set.mockRejectedValue(new Error('Cache error'));
      
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      expect(result).toBeDefined();
      expect(result.analysisId).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle AI service failures gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('AI service error'));
      
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      // Should fall back to mock responses
      expect(result).toBeDefined();
      expect(result.analysisId).toBeDefined();
    });

    it('should handle malformed AI responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' })
      });
      
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      expect(result).toBeDefined();
      expect(result.analysisId).toBeDefined();
    });

    it('should handle network timeouts', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );
      
      const result = await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      expect(result).toBeDefined();
      expect(result.analysisId).toBeDefined();
    });
  });

  describe('Analytics Integration', () => {
    it('should track analysis events', async () => {
      const { analytics } = require('@/lib/analytics/analytics-enhanced');
      
      await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      expect(analytics.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: expect.stringContaining('analysis')
        })
      );
    });

    it('should track error events', async () => {
      const { analytics } = require('@/lib/analytics/analytics-enhanced');
      const { featureFlagService } = require('@/lib/feature-flags');
      
      featureFlagService.isFeatureEnabled.mockReturnValue(false);
      
      await expect(enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest))
        .rejects.toThrow();
      
      expect(analytics.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: expect.stringContaining('error')
        })
      );
    });
  });

  describe('Feature Flags Integration', () => {
    it('should respect feature flag settings', async () => {
      const { featureFlagService } = require('@/lib/feature-flags');
      featureFlagService.isFeatureEnabled.mockReturnValue(false);
      
      await expect(enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest))
        .rejects.toThrow('Enhanced Website Analyzer is not enabled');
    });

    it('should check correct feature flag', async () => {
      const { featureFlagService } = require('@/lib/feature-flags');
      
      await enhancedAIAnalyzer.analyzeWebsite(mockAnalysisRequest);
      
      expect(featureFlagService.isFeatureEnabled).toHaveBeenCalledWith(
        'enhanced_website_analyzer',
        expect.any(Object)
      );
    });
  });
});