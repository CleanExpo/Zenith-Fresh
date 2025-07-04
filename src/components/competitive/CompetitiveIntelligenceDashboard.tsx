// src/components/competitive/CompetitiveIntelligenceDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Target, 
  Link, 
  FileText, 
  AlertTriangle, 
  Eye, 
  Search,
  BarChart3,
  Globe,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

interface CompetitiveIntelligenceDashboardProps {
  targetDomain: string;
  teamId: string;
}

interface CompetitiveData {
  analysisId?: string;
  targetDomain: string;
  competitiveScore: number;
  executiveSummary: string;
  marketPosition: {
    rank: number;
    percentile: number;
    totalAnalyzed: number;
  };
  competitors: Array<{
    domain: string;
    name: string;
    relevanceScore: number;
    authorityScore: number;
    estimatedTraffic: number;
    industry: string;
  }>;
  gaps: {
    keywords: {
      total: number;
      urgent: number;
      high: number;
      potentialTraffic: number;
      topOpportunities: any[];
    };
    backlinks: {
      total: number;
      highAuthority: number;
      readyForOutreach: number;
      potentialDAIncrease: number;
      topOpportunities: any[];
    };
    content: {
      total: number;
      urgent: number;
      potentialTraffic: number;
      quickWins: any[];
      topOpportunities: any[];
    };
  };
  opportunities: Array<{
    category: string;
    impact: 'high' | 'medium' | 'low';
    description: string;
    competitorExample?: string;
  }>;
  recommendations: Array<{
    priority: 'urgent' | 'high' | 'medium' | 'low';
    category: string;
    action: string;
    expectedImprovement: number;
    timeframe: string;
  }>;
  alerts: Array<{
    id: string;
    type: string;
    severity: string;
    title: string;
    description: string;
    createdAt: string;
  }>;
}

const CompetitiveIntelligenceDashboard: React.FC<CompetitiveIntelligenceDashboardProps> = ({ 
  targetDomain, 
  teamId 
}) => {
  const [data, setData] = useState<CompetitiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'keywords' | 'backlinks' | 'content'>('overview');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadCompetitiveIntelligence();
  }, [targetDomain, teamId]);

  const loadCompetitiveIntelligence = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/competitive/intelligence/report?domain=${targetDomain}`, {
        headers: {
          'x-team-id': teamId
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No existing analysis, offer to generate one
          setData(null);
          setError(null);
          return;
        }
        throw new Error('Failed to load competitive intelligence');
      }

      const result = await response.json();
      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const generateCompetitiveReport = async () => {
    try {
      setIsGenerating(true);
      const response = await fetch('/api/competitive/intelligence/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-team-id': teamId
        },
        body: JSON.stringify({
          targetDomain,
          options: {
            maxCompetitors: 5,
            includeKeywordGaps: true,
            includeBacklinkGaps: true,
            includeContentGaps: true
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate report');
      }

      const result = await response.json();
      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading competitive intelligence...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <Alert className="max-w-2xl mx-auto mt-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card variant="glass" className="text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Target className="h-6 w-6" />
              Competitive Intelligence Analysis
            </CardTitle>
            <CardDescription>
              Generate a comprehensive competitive analysis for {targetDomain}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-blue-500" />
                  <span>Competitor Discovery</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-green-500" />
                  <span>Keyword Gap Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link className="h-4 w-4 text-purple-500" />
                  <span>Backlink Intelligence</span>
                </div>
              </div>
              
              <Button 
                onClick={generateCompetitiveReport}
                disabled={isGenerating}
                variant="gradient"
                size="lg"
                className="w-full max-w-md"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating Analysis...
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4 mr-2" />
                    Generate Competitive Analysis
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8" />
            Competitive Intelligence
          </h1>
          <p className="text-muted-foreground mt-1">{targetDomain}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadCompetitiveIntelligence}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Competitive Score & Summary */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Competitive Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(data.competitiveScore)}`}>
                {data.competitiveScore}/100
              </div>
              <Progress value={data.competitiveScore} className="mt-2" />
              <p className="text-sm text-muted-foreground mt-2">
                Market Position: #{data.marketPosition.rank} of {data.marketPosition.totalAnalyzed}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{data.executiveSummary}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Active Alerts ({data.alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.alerts.slice(0, 4).map((alert) => (
                  <Alert key={alert.id} className="p-3">
                    <AlertDescription className="text-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{alert.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {alert.description}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {alert.severity}
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Navigation Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex space-x-1 bg-muted p-1 rounded-lg"
      >
        {[
          { id: 'overview', label: 'Overview', icon: Globe },
          { id: 'keywords', label: 'Keywords', icon: Search },
          { id: 'backlinks', label: 'Backlinks', icon: Link },
          { id: 'content', label: 'Content', icon: FileText }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      <motion.div 
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Competitors */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Top Competitors</CardTitle>
                <CardDescription>
                  Discovered through SERP analysis and keyword overlap
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.competitors.slice(0, 5).map((competitor, index) => (
                    <div key={competitor.domain} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{competitor.name || competitor.domain}</p>
                        <p className="text-xs text-muted-foreground">
                          DA: {competitor.authorityScore} • Traffic: {competitor.estimatedTraffic.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Opportunities */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Top Opportunities</CardTitle>
                <CardDescription>
                  High-impact opportunities across all channels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.opportunities.filter(o => o.impact === 'high').slice(0, 5).map((opportunity, index) => (
                    <div key={index} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{opportunity.category}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {opportunity.description}
                          </p>
                        </div>
                        <Badge className={`text-xs ml-2 ${
                          opportunity.impact === 'high' ? 'bg-red-100 text-red-800' :
                          opportunity.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {opportunity.impact}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'keywords' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Keyword Stats */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Keyword Gaps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{data.gaps.keywords.total}</div>
                    <p className="text-sm text-muted-foreground">Total Opportunities</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Urgent</span>
                      <span className="font-medium text-red-600">{data.gaps.keywords.urgent}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>High Priority</span>
                      <span className="font-medium text-orange-600">{data.gaps.keywords.high}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Potential Traffic</span>
                      <span className="font-medium">{Math.round(data.gaps.keywords.potentialTraffic).toLocaleString()}/mo</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Keyword Opportunities */}
            <Card variant="glass" className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Top Keyword Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.gaps.keywords.topOpportunities.slice(0, 6).map((keyword: any, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{keyword.keyword}</p>
                        <p className="text-xs text-muted-foreground">
                          Volume: {keyword.searchVolume.toLocaleString()} • Difficulty: {keyword.difficulty}%
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(keyword.priority)}>
                          {keyword.priority}
                        </Badge>
                        <div className="text-right">
                          <p className="text-sm font-medium">{Math.round(keyword.opportunityScore)}</p>
                          <p className="text-xs text-muted-foreground">Score</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'backlinks' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Backlink Stats */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Backlink Gaps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{data.gaps.backlinks.total}</div>
                    <p className="text-sm text-muted-foreground">Link Opportunities</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>High Authority</span>
                      <span className="font-medium text-green-600">{data.gaps.backlinks.highAuthority}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Ready for Outreach</span>
                      <span className="font-medium text-blue-600">{data.gaps.backlinks.readyForOutreach}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Potential DA Increase</span>
                      <span className="font-medium">+{data.gaps.backlinks.potentialDAIncrease.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Backlink Opportunities */}
            <Card variant="glass" className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Top Backlink Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.gaps.backlinks.topOpportunities.slice(0, 6).map((backlink: any, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{backlink.linkingDomain}</p>
                        <p className="text-xs text-muted-foreground">
                          DA: {backlink.domainAuthority} • Competitors: {backlink.competitorsLinking?.length || 0}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(backlink.priority)}>
                          {backlink.priority}
                        </Badge>
                        <div className="text-right">
                          <p className="text-sm font-medium">{Math.round(backlink.linkValue)}</p>
                          <p className="text-xs text-muted-foreground">Value</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Content Stats */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Content Gaps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{data.gaps.content.total}</div>
                    <p className="text-sm text-muted-foreground">Content Opportunities</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Urgent</span>
                      <span className="font-medium text-red-600">{data.gaps.content.urgent}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Quick Wins</span>
                      <span className="font-medium text-green-600">{data.gaps.content.quickWins.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Potential Traffic</span>
                      <span className="font-medium">{Math.round(data.gaps.content.potentialTraffic).toLocaleString()}/mo</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Content Opportunities */}
            <Card variant="glass" className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Top Content Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.gaps.content.topOpportunities.slice(0, 6).map((content: any, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{content.topic}</p>
                        <p className="text-xs text-muted-foreground">
                          {content.contentType.replace('_', ' ')} • Traffic: {content.estimatedTraffic.toLocaleString()}/mo
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(content.priority)}>
                          {content.priority}
                        </Badge>
                        <div className="text-right">
                          <p className="text-sm font-medium">{Math.round(content.opportunityScore)}</p>
                          <p className="text-xs text-muted-foreground">Score</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>

      {/* Recommendations */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Strategic Recommendations</CardTitle>
            <CardDescription>
              Prioritized action items based on competitive analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.recommendations.slice(0, 6).map((recommendation, index) => (
                <div key={index} className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={getPriorityColor(recommendation.priority)}>
                      {recommendation.priority}
                    </Badge>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        +{recommendation.expectedImprovement}%
                      </p>
                      <p className="text-xs text-muted-foreground">Impact</p>
                    </div>
                  </div>
                  <h4 className="font-medium mb-2">{recommendation.category}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {recommendation.action}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Timeline: {recommendation.timeframe}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CompetitiveIntelligenceDashboard;