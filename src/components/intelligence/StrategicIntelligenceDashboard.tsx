// src/components/intelligence/StrategicIntelligenceDashboard.tsx
// Strategic Intelligence Dashboard - Executive-level competitive intelligence

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown,
  Target, 
  Brain,
  AlertTriangle, 
  Eye, 
  BarChart3,
  Globe,
  DollarSign,
  Users,
  Zap,
  Shield,
  RefreshCw,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  ChevronRight,
  Activity,
  Lightbulb,
  Flag,
  Award,
  AlertCircle
} from 'lucide-react';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StrategicIntelligenceDashboardProps {
  targetDomain: string;
  teamId: string;
}

interface MarketIntelligenceData {
  targetDomain: string;
  industry: string;
  analysisDate: string;
  marketTrends: {
    marketSize: {
      current: number;
      projected: number;
      growthRate: number;
      timeframe: string;
    };
    trends: Array<{
      trend: string;
      momentum: 'rising' | 'stable' | 'declining';
      impact: 'high' | 'medium' | 'low';
      confidence: number;
      timelineMonths: number;
    }>;
    seasonality: Array<{
      month: string;
      demandIndex: number;
      keyFactors: string[];
    }>;
  };
  competitiveLandscape: {
    marketStructure: string;
    concentrationRatio: number;
    competitiveIntensity: number;
    marketLeaders: Array<{
      company: string;
      domain: string;
      marketShare: number;
      recentMoves: Array<{
        action: string;
        date: string;
        impact: 'high' | 'medium' | 'low';
      }>;
    }>;
    emergingPlayers: Array<{
      company: string;
      domain: string;
      growthRate: number;
      disruptionPotential: 'high' | 'medium' | 'low';
    }>;
  };
  customerSentiment: {
    overallSentiment: 'positive' | 'neutral' | 'negative';
    sentimentScore: number;
    sentimentTrends: Array<{
      date: string;
      score: number;
      volume: number;
    }>;
    topicsAnalysis: Array<{
      topic: string;
      sentiment: 'positive' | 'neutral' | 'negative';
      volume: number;
    }>;
    competitorSentiment: Array<{
      competitor: string;
      overallScore: number;
      strengths: string[];
      weaknesses: string[];
    }>;
  };
  opportunities: {
    opportunities: Array<{
      id: string;
      title: string;
      category: string;
      marketSize: number;
      growthPotential: number;
      timeToMarket: number;
      investmentRequired: 'low' | 'medium' | 'high';
      riskLevel: 'low' | 'medium' | 'high';
      strategicFit: number;
    }>;
    whitespaceAreas: Array<{
      area: string;
      description: string;
      marketPotential: number;
      competitiveVacuum: boolean;
    }>;
  };
  threats: Array<{
    threat: string;
    probability: 'high' | 'medium' | 'low';
    impact: 'high' | 'medium' | 'low';
    timeframe: string;
    mitigationStrategies: string[];
  }>;
  strategicRecommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    recommendation: string;
    rationale: string;
    expectedROI: number;
    timeframe: string;
    kpis: string[];
  }>;
  alerts: Array<{
    id: string;
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    createdAt: string;
    actionRequired: boolean;
  }>;
}

const StrategicIntelligenceDashboard: React.FC<StrategicIntelligenceDashboardProps> = ({ 
  targetDomain, 
  teamId 
}) => {
  const [data, setData] = useState<MarketIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'competitive' | 'opportunities' | 'threats'>('overview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'6m' | '1y' | '2y' | '5y'>('2y');

  useEffect(() => {
    loadMarketIntelligence();
  }, [targetDomain, teamId, selectedTimeframe]);

  const loadMarketIntelligence = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/intelligence/market?domain=${targetDomain}&timeframe=${selectedTimeframe}`, {
        headers: {
          'x-team-id': teamId
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          setData(null);
          setError(null);
          return;
        }
        throw new Error('Failed to load market intelligence');
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

  const generateMarketIntelligence = async () => {
    try {
      setIsGenerating(true);
      const response = await fetch('/api/intelligence/market', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-team-id': teamId
        },
        body: JSON.stringify({
          targetDomain,
          timeframe: selectedTimeframe,
          options: {
            includePredictive: true,
            includeCompetitors: [],
            depth: 'comprehensive'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate market intelligence');
      }

      const result = await response.json();
      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate intelligence');
    } finally {
      setIsGenerating(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getMomentumIcon = (momentum: string) => {
    switch (momentum) {
      case 'rising': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading strategic intelligence...</p>
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
      <div className="max-w-6xl mx-auto p-6">
        <Card variant="glass" className="text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Brain className="h-6 w-6" />
              Strategic Market Intelligence
            </CardTitle>
            <CardDescription>
              Generate comprehensive market intelligence and strategic insights for {targetDomain}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <span>Market Trend Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  <span>Competitive Landscape</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-purple-500" />
                  <span>Strategic Opportunities</span>
                </div>
              </div>

              <div className="flex items-center gap-4 justify-center">
                <label className="text-sm font-medium">Analysis Timeframe:</label>
                <select 
                  value={selectedTimeframe} 
                  onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="6m">6 Months</option>
                  <option value="1y">1 Year</option>
                  <option value="2y">2 Years</option>
                  <option value="5y">5 Years</option>
                </select>
              </div>
              
              <Button 
                onClick={generateMarketIntelligence}
                disabled={isGenerating}
                variant="gradient"
                size="lg"
                className="w-full max-w-md"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating Intelligence...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Generate Strategic Intelligence
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Chart configurations
  const sentimentTrendChart = {
    data: {
      labels: data.customerSentiment.sentimentTrends.map(t => t.date),
      datasets: [
        {
          label: 'Sentiment Score',
          data: data.customerSentiment.sentimentTrends.map(t => t.score),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  };

  const marketShareChart = {
    data: {
      labels: data.competitiveLandscape.marketLeaders.map(l => l.company),
      datasets: [
        {
          data: data.competitiveLandscape.marketLeaders.map(l => l.marketShare),
          backgroundColor: [
            '#3B82F6',
            '#10B981',
            '#F59E0B',
            '#EF4444',
            '#8B5CF6'
          ]
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom' as const
        }
      }
    }
  };

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
            <Brain className="h-8 w-8" />
            Strategic Intelligence
          </h1>
          <p className="text-muted-foreground mt-1">
            {targetDomain} • {data.industry} • Updated {new Date(data.analysisDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadMarketIntelligence}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </motion.div>

      {/* Critical Alerts */}
      {data.alerts.filter(a => a.severity === 'critical' || a.actionRequired).length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="glass" className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                Critical Intelligence Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.alerts
                  .filter(a => a.severity === 'critical' || a.actionRequired)
                  .slice(0, 4)
                  .map((alert) => (
                    <Alert key={alert.id} className="p-3">
                      <AlertDescription className="text-sm">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{alert.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {alert.description}
                            </p>
                          </div>
                          <Badge className={getSeverityColor(alert.severity)}>
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

      {/* Executive Summary Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card variant="glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Market Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.marketTrends.marketSize.current)}
            </div>
            <div className="flex items-center mt-1 text-sm">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-600">+{data.marketTrends.marketSize.growthRate}%</span>
              <span className="text-muted-foreground ml-1">annual growth</span>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customer Sentiment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.customerSentiment.sentimentScore}/100
            </div>
            <div className="flex items-center mt-1 text-sm">
              <Badge className={`${
                data.customerSentiment.overallSentiment === 'positive' ? 'bg-green-100 text-green-800' :
                data.customerSentiment.overallSentiment === 'neutral' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {data.customerSentiment.overallSentiment}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Market Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.opportunities.opportunities.length}
            </div>
            <div className="flex items-center mt-1 text-sm">
              <span className="text-muted-foreground">
                {formatCurrency(
                  data.opportunities.opportunities.reduce((sum, opp) => sum + opp.marketSize, 0)
                )} total value
              </span>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Threat Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.threats.filter(t => t.probability === 'high').length}
            </div>
            <div className="flex items-center mt-1 text-sm">
              <span className="text-muted-foreground">high probability threats</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Market Trends</TabsTrigger>
            <TabsTrigger value="competitive">Competitive</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="threats">Threats & Risks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Strategic Recommendations */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  Strategic Recommendations
                </CardTitle>
                <CardDescription>
                  AI-powered strategic recommendations based on comprehensive market analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.strategicRecommendations.slice(0, 3).map((rec, index) => (
                    <div key={index} className="p-4 rounded-lg bg-muted/50 border">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(rec.priority)}`} />
                          <Badge className={getSeverityColor(rec.priority)}>
                            {rec.priority}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{rec.category}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">
                            +{rec.expectedROI}% ROI
                          </p>
                          <p className="text-xs text-muted-foreground">{rec.timeframe}</p>
                        </div>
                      </div>
                      <h4 className="font-medium mb-2">{rec.recommendation}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{rec.rationale}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">KPIs:</span>
                        {rec.kpis.slice(0, 3).map((kpi, kpiIndex) => (
                          <Badge key={kpiIndex} variant="outline" className="text-xs">
                            {kpi}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Market Position & Sentiment */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card variant="glass">
                <CardHeader>
                  <CardTitle>Market Leaders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Doughnut data={marketShareChart.data} options={marketShareChart.options} />
                  </div>
                </CardContent>
              </Card>

              <Card variant="glass">
                <CardHeader>
                  <CardTitle>Sentiment Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Line data={sentimentTrendChart.data} options={sentimentTrendChart.options} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            {/* Market Trends Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card variant="glass">
                <CardHeader>
                  <CardTitle>Key Market Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.marketTrends.trends.slice(0, 5).map((trend, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="mt-1">
                          {getMomentumIcon(trend.momentum)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{trend.trend}</h4>
                            <Badge className={`text-xs ${
                              trend.impact === 'high' ? 'bg-red-100 text-red-800' :
                              trend.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {trend.impact} impact
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{trend.timelineMonths} months</span>
                            <span>{Math.round(trend.confidence * 100)}% confidence</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card variant="glass">
                <CardHeader>
                  <CardTitle>Market Growth Projection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {formatCurrency(data.marketTrends.marketSize.projected)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Projected market size by {data.marketTrends.marketSize.timeframe}
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Current Size</span>
                        <span className="font-medium">
                          {formatCurrency(data.marketTrends.marketSize.current)}
                        </span>
                      </div>
                      <Progress value={60} className="h-2" />
                      <div className="flex justify-between text-sm">
                        <span>Growth Rate</span>
                        <span className="font-medium text-green-600">
                          +{data.marketTrends.marketSize.growthRate}% annually
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Seasonality Analysis */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Seasonal Demand Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {data.marketTrends.seasonality.map((season, index) => (
                    <div key={index} className="text-center p-3 rounded-lg bg-muted/50">
                      <h4 className="font-medium mb-2">{season.month}</h4>
                      <div className="text-2xl font-bold mb-2">{season.demandIndex}</div>
                      <div className="space-y-1">
                        {season.keyFactors.slice(0, 2).map((factor, factorIndex) => (
                          <p key={factorIndex} className="text-xs text-muted-foreground">
                            {factor}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="competitive" className="space-y-6">
            {/* Competitive Landscape */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card variant="glass">
                <CardHeader>
                  <CardTitle>Market Structure</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Market Type</span>
                      <Badge variant="outline">{data.competitiveLandscape.marketStructure}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Concentration Ratio</span>
                      <span className="font-medium">{data.competitiveLandscape.concentrationRatio}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Competitive Intensity</span>
                      <div className="flex items-center gap-2">
                        <Progress value={data.competitiveLandscape.competitiveIntensity * 10} className="w-16 h-2" />
                        <span className="text-sm font-medium">
                          {data.competitiveLandscape.competitiveIntensity}/10
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card variant="glass">
                <CardHeader>
                  <CardTitle>Emerging Players</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.competitiveLandscape.emergingPlayers.map((player, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{player.company}</p>
                          <p className="text-sm text-muted-foreground">{player.domain}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">
                            +{player.growthRate}%
                          </p>
                          <Badge className={`text-xs ${
                            player.disruptionPotential === 'high' ? 'bg-red-100 text-red-800' :
                            player.disruptionPotential === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {player.disruptionPotential} disruption
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Competitor Sentiment Analysis */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Competitor Sentiment Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.customerSentiment.competitorSentiment.map((comp, index) => (
                    <div key={index} className="p-4 rounded-lg bg-muted/50 border">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{comp.competitor}</h4>
                        <div className="text-right">
                          <div className="text-lg font-bold">{comp.overallScore}</div>
                          <div className="text-xs text-muted-foreground">sentiment score</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium text-green-600 mb-1">Strengths</p>
                          <div className="flex flex-wrap gap-1">
                            {comp.strengths.slice(0, 2).map((strength, sIndex) => (
                              <Badge key={sIndex} variant="outline" className="text-xs">
                                {strength}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-red-600 mb-1">Weaknesses</p>
                          <div className="flex flex-wrap gap-1">
                            {comp.weaknesses.slice(0, 2).map((weakness, wIndex) => (
                              <Badge key={wIndex} variant="outline" className="text-xs">
                                {weakness}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-6">
            {/* Market Opportunities */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Strategic Opportunities
                </CardTitle>
                <CardDescription>
                  Prioritized market opportunities ranked by strategic value
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.opportunities.opportunities.slice(0, 6).map((opportunity) => (
                    <div key={opportunity.id} className="p-4 rounded-lg bg-muted/50 border">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{opportunity.title}</h4>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {opportunity.category}
                            </Badge>
                            <Badge className={`text-xs ${
                              opportunity.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                              opportunity.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {opportunity.riskLevel} risk
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{formatCurrency(opportunity.marketSize)}</p>
                          <p className="text-xs text-muted-foreground">market size</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Growth Potential</p>
                          <p className="font-medium text-green-600">+{opportunity.growthPotential}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Time to Market</p>
                          <p className="font-medium">{opportunity.timeToMarket} months</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Strategic Fit</p>
                          <div className="flex items-center gap-1">
                            <Progress value={opportunity.strategicFit * 10} className="w-12 h-1" />
                            <span className="text-xs">{opportunity.strategicFit}/10</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Whitespace Areas */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Market Whitespace</CardTitle>
                <CardDescription>
                  Underserved market segments with minimal competition
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.opportunities.whitespaceAreas.map((area, index) => (
                    <div key={index} className="p-4 rounded-lg bg-muted/50 border">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{area.area}</h4>
                        {area.competitiveVacuum && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            No Competition
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{area.description}</p>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">
                          {formatCurrency(area.marketPotential)}
                        </p>
                        <p className="text-xs text-muted-foreground">potential value</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="threats" className="space-y-6">
            {/* Threat Analysis */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Market Threats & Risks
                </CardTitle>
                <CardDescription>
                  Potential threats to market position and strategic initiatives
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.threats.map((threat, index) => (
                    <div key={index} className="p-4 rounded-lg bg-muted/50 border">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium mb-2">{threat.threat}</h4>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className={`text-xs ${
                              threat.probability === 'high' ? 'bg-red-100 text-red-800' :
                              threat.probability === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {threat.probability} probability
                            </Badge>
                            <Badge className={`text-xs ${
                              threat.impact === 'high' ? 'bg-red-100 text-red-800' :
                              threat.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {threat.impact} impact
                            </Badge>
                            <span className="text-xs text-muted-foreground">{threat.timeframe}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-2">Mitigation Strategies:</p>
                        <div className="space-y-1">
                          {threat.mitigationStrategies.map((strategy, strategyIndex) => (
                            <div key={strategyIndex} className="flex items-center gap-2 text-sm">
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              <span>{strategy}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default StrategicIntelligenceDashboard;