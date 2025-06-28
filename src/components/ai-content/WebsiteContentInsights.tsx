/**
 * Website Content Insights Integration
 * Connects AI content analysis with website analyzer data
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AnalyticsIcon,
  SearchIcon,
  TrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  BarChart3Icon,
  GlobeIcon,
  EyeIcon
} from 'lucide-react';

interface WebsiteAnalysis {
  id: string;
  url: string;
  performanceScore: number;
  seoScore: number;
  accessibilityScore: number;
  contentGaps: string[];
  keywords: string[];
  recommendations: {
    category: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  lastScanned: string;
}

interface ContentOpportunity {
  type: 'keyword' | 'content' | 'technical' | 'performance';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  aiOptimization: string;
}

interface WebsiteContentInsightsProps {
  websiteUrl?: string;
  onGenerateContent?: (opportunity: ContentOpportunity) => void;
}

export default function WebsiteContentInsights({ 
  websiteUrl, 
  onGenerateContent 
}: WebsiteContentInsightsProps) {
  const [websiteAnalysis, setWebsiteAnalysis] = useState<WebsiteAnalysis | null>(null);
  const [contentOpportunities, setContentOpportunities] = useState<ContentOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (websiteUrl) {
      fetchWebsiteAnalysis(websiteUrl);
    }
  }, [websiteUrl]);

  const fetchWebsiteAnalysis = async (url: string) => {
    setLoading(true);
    setError('');

    try {
      // First, run a website analysis
      const scanResponse = await fetch('/api/analysis/website/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (scanResponse.ok) {
        const scanData = await scanResponse.json();
        
        // Transform scan data to our format
        const analysis: WebsiteAnalysis = {
          id: scanData.analysisId || 'temp-id',
          url,
          performanceScore: scanData.data?.performance?.score || 0,
          seoScore: scanData.data?.seo?.score || 0,
          accessibilityScore: scanData.data?.accessibility?.score || 0,
          contentGaps: extractContentGaps(scanData.data),
          keywords: extractKeywords(scanData.data),
          recommendations: transformRecommendations(scanData.data?.recommendations || []),
          lastScanned: new Date().toISOString()
        };

        setWebsiteAnalysis(analysis);
        
        // Generate content opportunities based on analysis
        const opportunities = await generateContentOpportunities(analysis);
        setContentOpportunities(opportunities);
      } else {
        setError('Failed to analyze website');
      }
    } catch (error) {
      console.error('Website analysis error:', error);
      setError('Failed to analyze website');
    } finally {
      setLoading(false);
    }
  };

  const extractContentGaps = (data: any): string[] => {
    const gaps = [];
    
    if (data?.seo?.missingMetaTags?.length > 0) {
      gaps.push('Missing meta descriptions');
    }
    if (data?.seo?.headingStructure?.h1Count === 0) {
      gaps.push('No H1 tags found');
    }
    if (data?.accessibility?.issues?.length > 0) {
      gaps.push('Accessibility improvements needed');
    }
    if (data?.performance?.score < 70) {
      gaps.push('Performance optimization required');
    }

    return gaps;
  };

  const extractKeywords = (data: any): string[] => {
    const keywords = [];
    
    if (data?.seo?.keywords) {
      keywords.push(...data.seo.keywords);
    }
    if (data?.content?.mainKeywords) {
      keywords.push(...data.content.mainKeywords);
    }

    return [...new Set(keywords)].slice(0, 10);
  };

  const transformRecommendations = (recommendations: any[]): WebsiteAnalysis['recommendations'] => {
    return recommendations.map(rec => ({
      category: rec.category || 'general',
      title: rec.title || rec.message,
      description: rec.description || rec.details,
      priority: rec.priority || 'medium'
    }));
  };

  const generateContentOpportunities = async (analysis: WebsiteAnalysis): Promise<ContentOpportunity[]> => {
    const opportunities: ContentOpportunity[] = [];

    // Performance-based content opportunities
    if (analysis.performanceScore < 70) {
      opportunities.push({
        type: 'performance',
        title: 'Performance Optimization Guide',
        description: 'Create content about website performance optimization techniques',
        impact: 'high',
        effort: 'medium',
        aiOptimization: 'Target "website speed optimization" keywords with technical depth'
      });
    }

    // SEO-based content opportunities
    if (analysis.seoScore < 80) {
      opportunities.push({
        type: 'content',
        title: 'SEO Content Audit',
        description: 'Develop comprehensive SEO improvement content',
        impact: 'high',
        effort: 'medium',
        aiOptimization: 'Focus on featured snippet optimization and voice search'
      });
    }

    // Keyword-based opportunities
    if (analysis.keywords.length > 0) {
      analysis.keywords.slice(0, 3).forEach(keyword => {
        opportunities.push({
          type: 'keyword',
          title: `Content for "${keyword}"`,
          description: `Create targeted content optimized for ${keyword}`,
          impact: 'medium',
          effort: 'low',
          aiOptimization: `AI-optimized long-tail variations of ${keyword}`
        });
      });
    }

    // Content gap opportunities
    analysis.contentGaps.forEach(gap => {
      opportunities.push({
        type: 'content',
        title: `Address: ${gap}`,
        description: `Create content to address identified gap: ${gap}`,
        impact: 'medium',
        effort: 'low',
        aiOptimization: 'Structure for AI citation and voice search optimization'
      });
    });

    return opportunities;
  };

  const handleGenerateContent = async (opportunity: ContentOpportunity) => {
    if (onGenerateContent) {
      onGenerateContent(opportunity);
    }

    // Optionally, trigger AI content generation here
    try {
      const response = await fetch('/api/ai/content-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_brief',
          keywords: [opportunity.title],
          industry: 'Web Development',
          targetAudience: 'Website owners and developers',
          contentType: 'article',
          aiModel: 'multi-model'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Generated content brief:', data);
      }
    } catch (error) {
      console.error('Failed to generate content brief:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AnalyticsIcon className="h-5 w-5 animate-spin" />
            Analyzing Website...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <ExclamationTriangleIcon className="h-5 w-5" />
            Analysis Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
          {websiteUrl && (
            <Button 
              onClick={() => fetchWebsiteAnalysis(websiteUrl)}
              variant="outline" 
              className="mt-4"
            >
              Retry Analysis
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!websiteAnalysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchIcon className="h-5 w-5" />
            Website Content Insights
          </CardTitle>
          <CardDescription>
            Enter a website URL in the analysis form to get AI-powered content recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <GlobeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">No website analyzed yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Website Analysis Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AnalyticsIcon className="h-5 w-5" />
            Website Analysis Summary
          </CardTitle>
          <CardDescription>{websiteAnalysis.url}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(websiteAnalysis.performanceScore)}`}>
                {websiteAnalysis.performanceScore}
              </div>
              <div className="text-sm text-gray-600">Performance</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(websiteAnalysis.seoScore)}`}>
                {websiteAnalysis.seoScore}
              </div>
              <div className="text-sm text-gray-600">SEO</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(websiteAnalysis.accessibilityScore)}`}>
                {websiteAnalysis.accessibilityScore}
              </div>
              <div className="text-sm text-gray-600">Accessibility</div>
            </div>
          </div>

          {websiteAnalysis.keywords.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Detected Keywords:</div>
              <div className="flex flex-wrap gap-2">
                {websiteAnalysis.keywords.slice(0, 8).map((keyword, index) => (
                  <Badge key={index} variant="outline">{keyword}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUpIcon className="h-5 w-5" />
            AI Content Opportunities
          </CardTitle>
          <CardDescription>
            Content suggestions based on your website analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contentOpportunities.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
              <p className="mt-2 text-gray-500">
                Great! No immediate content opportunities identified.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {contentOpportunities.map((opportunity, index) => (
                <div 
                  key={index}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {opportunity.title}
                        </h4>
                        <Badge variant={getScoreBadgeVariant(opportunity.impact === 'high' ? 90 : opportunity.impact === 'medium' ? 70 : 50)}>
                          {opportunity.impact} impact
                        </Badge>
                        <Badge variant="outline">
                          {opportunity.effort} effort
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {opportunity.description}
                      </p>
                      <div className="text-xs text-blue-600 bg-blue-50 rounded px-2 py-1 inline-block">
                        AI Optimization: {opportunity.aiOptimization}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleGenerateContent(opportunity)}
                      size="sm"
                      variant="outline"
                      className="ml-4"
                    >
                      <ArrowRightIcon className="h-4 w-4 mr-1" />
                      Generate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Website Recommendations */}
      {websiteAnalysis.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3Icon className="h-5 w-5" />
              Website Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {websiteAnalysis.recommendations.slice(0, 5).map((rec, index) => (
                <div key={index} className="flex items-start gap-3">
                  <ExclamationTriangleIcon className={`h-4 w-4 mt-0.5 ${
                    rec.priority === 'high' ? 'text-red-500' : 
                    rec.priority === 'medium' ? 'text-yellow-500' : 'text-gray-500'
                  }`} />
                  <div>
                    <div className="font-medium text-sm">{rec.title}</div>
                    <div className="text-sm text-gray-600">{rec.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}