// src/components/GEODashboard.tsx
// Generative Engine Optimization (GEO) Dashboard
// Complete AI-Future Proofing & Advanced Analytics Control Center

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  Target, 
  Search, 
  Mic, 
  Star, 
  Globe,
  BarChart3,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Play,
  Settings,
  Eye,
  Users,
  Calendar,
  FileText,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Minus,
  Clock,
  Shield
} from 'lucide-react';

// Import our AI components
import AIReadinessScoring from './AIReadinessScoring';
import AIPoweredContentAnalysis from './AIPoweredContentAnalysis';

interface GEOMetrics {
  overallGEOScore: number;
  aiReadinessScore: number;
  voiceSearchOptimization: number;
  featuredSnippetCapture: number;
  aiCitationReadiness: number;
  contentStructureScore: number;
  predictiveAccuracy: number;
}

interface PredictiveAlert {
  type: 'opportunity' | 'threat' | 'trend';
  title: string;
  description: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  timeframe: string;
  confidence: number;
  actionRequired: boolean;
}

interface MarketIntelligence {
  keywordTrends: { keyword: string; trend: 'rising' | 'stable' | 'declining'; confidence: number }[];
  competitorMovements: { competitor: string; action: string; impact: string }[];
  emergingOpportunities: { opportunity: string; value: number; difficulty: string }[];
  marketShifts: { shift: string; probability: number; preparationTime: string }[];
}

interface ImplementationProgress {
  phase: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  nextMilestone: string;
  daysRemaining: number;
}

export default function GEODashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [contentInput, setContentInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [industryInput, setIndustryInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  
  const [geoMetrics, setGeoMetrics] = useState<GEOMetrics>({
    overallGEOScore: 72,
    aiReadinessScore: 68,
    voiceSearchOptimization: 45,
    featuredSnippetCapture: 82,
    aiCitationReadiness: 71,
    contentStructureScore: 89,
    predictiveAccuracy: 84
  });

  const [predictiveAlerts, setPredictiveAlerts] = useState<PredictiveAlert[]>([
    {
      type: 'opportunity',
      title: 'Voice Search Surge Predicted',
      description: 'AI models predict 35% increase in voice search traffic for your target keywords',
      impact: 'high',
      timeframe: '2-3 months',
      confidence: 87,
      actionRequired: true
    },
    {
      type: 'threat',
      title: 'Competitor AI Optimization',
      description: 'Primary competitor implemented comprehensive AI optimization strategy',
      impact: 'high',
      timeframe: 'Immediate',
      confidence: 92,
      actionRequired: true
    },
    {
      type: 'trend',
      title: 'Featured Snippet Opportunity',
      description: 'New featured snippet opportunities detected for 8 target keywords',
      impact: 'medium',
      timeframe: '1-2 weeks',
      confidence: 78,
      actionRequired: false
    }
  ]);

  const [marketIntelligence, setMarketIntelligence] = useState<MarketIntelligence>({
    keywordTrends: [
      { keyword: 'AI SEO optimization', trend: 'rising', confidence: 89 },
      { keyword: 'voice search marketing', trend: 'rising', confidence: 84 },
      { keyword: 'traditional SEO', trend: 'declining', confidence: 76 }
    ],
    competitorMovements: [
      { competitor: 'Competitor A', action: 'Launched AI content hub', impact: 'Significant traffic increase' },
      { competitor: 'Competitor B', action: 'Voice search optimization', impact: 'Featured snippet captures' }
    ],
    emergingOpportunities: [
      { opportunity: 'AI-powered content generation', value: 85, difficulty: 'Medium' },
      { opportunity: 'Conversational search optimization', value: 92, difficulty: 'Low' }
    ],
    marketShifts: [
      { shift: 'AI search engine adoption', probability: 78, preparationTime: '6 months' },
      { shift: 'Voice-first user behavior', probability: 65, preparationTime: '12 months' }
    ]
  });

  const [implementationProgress, setImplementationProgress] = useState<ImplementationProgress[]>([
    {
      phase: 'AI Readiness Assessment',
      progress: 100,
      status: 'completed',
      nextMilestone: 'Content Optimization Phase',
      daysRemaining: 0
    },
    {
      phase: 'Content Structure Optimization',
      progress: 75,
      status: 'in_progress',
      nextMilestone: 'FAQ Implementation',
      daysRemaining: 5
    },
    {
      phase: 'Voice Search Implementation',
      progress: 35,
      status: 'in_progress',
      nextMilestone: 'Conversational Keywords',
      daysRemaining: 14
    },
    {
      phase: 'AI Engine Targeting',
      progress: 0,
      status: 'not_started',
      nextMilestone: 'Strategy Development',
      daysRemaining: 28
    }
  ]);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      updatePredictiveMetrics();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const updatePredictiveMetrics = () => {
    // Simulate metric updates
    setGeoMetrics(prev => ({
      ...prev,
      predictiveAccuracy: Math.min(95, prev.predictiveAccuracy + Math.random() * 2 - 1)
    }));
  };

  const handleFullGEOAnalysis = async () => {
    setIsLoading(true);
    
    try {
      // Simulate comprehensive analysis
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Update metrics
      setGeoMetrics(prev => ({
        ...prev,
        overallGEOScore: Math.min(100, prev.overallGEOScore + 5),
        aiReadinessScore: Math.min(100, prev.aiReadinessScore + 8),
        voiceSearchOptimization: Math.min(100, prev.voiceSearchOptimization + 12)
      }));
      
    } catch (error) {
      console.error('GEO analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMetricTrendIcon = (current: number, target: number) => {
    if (current >= target) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (current >= target * 0.8) return <ArrowUp className="h-4 w-4 text-blue-600" />;
    if (current >= target * 0.6) return <Minus className="h-4 w-4 text-yellow-600" />;
    return <ArrowDown className="h-4 w-4 text-red-600" />;
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'threat': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'trend': return <BarChart3 className="h-4 w-4 text-blue-600" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getProgressStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'blocked': return 'text-red-600';
      case 'not_started': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <ArrowUp className="h-3 w-3 text-green-600" />;
      case 'declining': return <ArrowDown className="h-3 w-3 text-red-600" />;
      case 'stable': return <Minus className="h-3 w-3 text-gray-600" />;
      default: return <Minus className="h-3 w-3 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-blue-600" />
            GEO Command Center
          </h1>
          <p className="text-gray-600 mt-1">
            Generative Engine Optimization & AI-Future Proofing Dashboard
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <CheckCircle className="mr-1 h-3 w-3" />
            Real-time Active
          </Badge>
          <Button onClick={handleFullGEOAnalysis} disabled={isLoading}>
            {isLoading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {isLoading ? 'Analyzing...' : 'Full GEO Analysis'}
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Overall GEO Score</p>
                <p className="text-2xl font-bold text-blue-900">{geoMetrics.overallGEOScore}%</p>
              </div>
              <Brain className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2">
              <Progress value={geoMetrics.overallGEOScore} className="h-2" />
              <p className="text-xs text-blue-700 mt-1">Target: 85%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">AI Readiness</p>
                <p className="text-2xl font-bold text-green-900">{geoMetrics.aiReadinessScore}%</p>
              </div>
              <Zap className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <Progress value={geoMetrics.aiReadinessScore} className="h-2" />
              <p className="text-xs text-green-700 mt-1">
                {getMetricTrendIcon(geoMetrics.aiReadinessScore, 80)} Improving
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Voice Search</p>
                <p className="text-2xl font-bold text-purple-900">{geoMetrics.voiceSearchOptimization}%</p>
              </div>
              <Mic className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2">
              <Progress value={geoMetrics.voiceSearchOptimization} className="h-2" />
              <p className="text-xs text-purple-700 mt-1">High opportunity</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">Predictive Accuracy</p>
                <p className="text-2xl font-bold text-orange-900">{geoMetrics.predictiveAccuracy}%</p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2">
              <Progress value={geoMetrics.predictiveAccuracy} className="h-2" />
              <p className="text-xs text-orange-700 mt-1">Model confidence</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="readiness">AI Readiness</TabsTrigger>
          <TabsTrigger value="content">Content Analysis</TabsTrigger>
          <TabsTrigger value="predictive">Predictive Insights</TabsTrigger>
          <TabsTrigger value="implementation">Implementation</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Predictive Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Predictive Alerts
              </CardTitle>
              <CardDescription>
                AI-powered insights and recommendations requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {predictiveAlerts.map((alert, index) => (
                <Alert key={index} className={`border-l-4 ${
                  alert.impact === 'critical' ? 'border-l-red-500 bg-red-50' :
                  alert.impact === 'high' ? 'border-l-orange-500 bg-orange-50' :
                  alert.impact === 'medium' ? 'border-l-yellow-500 bg-yellow-50' :
                  'border-l-blue-500 bg-blue-50'
                }`}>
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <AlertTitle className="flex items-center gap-2">
                        {alert.title}
                        <Badge variant="outline" className="text-xs">
                          {alert.confidence}% confidence
                        </Badge>
                        {alert.actionRequired && (
                          <Badge variant="destructive" className="text-xs">
                            Action Required
                          </Badge>
                        )}
                      </AlertTitle>
                      <AlertDescription className="mt-2">
                        {alert.description}
                      </AlertDescription>
                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {alert.timeframe}
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {alert.impact} impact
                        </div>
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}
            </CardContent>
          </Card>

          {/* Market Intelligence */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Keyword Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {marketIntelligence.keywordTrends.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {getTrendIcon(trend.trend)}
                      <span className="font-medium">{trend.keyword}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {trend.confidence}% confidence
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Competitor Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {marketIntelligence.competitorMovements.map((movement, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-sm">{movement.competitor}</div>
                    <div className="text-sm text-gray-600 mt-1">{movement.action}</div>
                    <div className="text-xs text-blue-600 mt-1">Impact: {movement.impact}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Implementation Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Implementation Progress
              </CardTitle>
              <CardDescription>
                Current status of your GEO optimization roadmap
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {implementationProgress.map((phase, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${
                        phase.status === 'completed' ? 'bg-green-600' :
                        phase.status === 'in_progress' ? 'bg-blue-600' :
                        phase.status === 'blocked' ? 'bg-red-600' :
                        'bg-gray-400'
                      }`} />
                      <span className="font-medium">{phase.phase}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={getProgressStatusColor(phase.status)}>
                        {phase.progress}%
                      </span>
                      {phase.daysRemaining > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {phase.daysRemaining} days
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Progress value={phase.progress} className="h-2" />
                  <div className="text-xs text-gray-600">
                    Next: {phase.nextMilestone}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="readiness">
          <AIReadinessScoring
            content={contentInput}
            url={urlInput}
            realTimeMode={true}
            onOptimize={(optimizations) => {
              console.log('AI Readiness optimizations:', optimizations);
            }}
          />
        </TabsContent>

        <TabsContent value="content">
          <AIPoweredContentAnalysis
            content={contentInput}
            targetKeywords={keywordInput.split(',').map(k => k.trim()).filter(k => k)}
            industry={industryInput}
            onGenerateBrief={(brief) => {
              console.log('Generated content brief:', brief);
            }}
            onOptimizeContent={(optimizations) => {
              console.log('Content optimizations:', optimizations);
            }}
          />
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                Predictive Analytics Engine
              </CardTitle>
              <CardDescription>
                AI-powered forecasting and market intelligence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Emerging Opportunities */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Emerging Opportunities</h3>
                <div className="grid gap-3">
                  {marketIntelligence.emergingOpportunities.map((opportunity, index) => (
                    <div key={index} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{opportunity.opportunity}</div>
                          <div className="text-sm text-gray-600">Difficulty: {opportunity.difficulty}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">{opportunity.value}%</div>
                          <div className="text-xs text-gray-600">Opportunity Score</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Market Shifts */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Predicted Market Shifts</h3>
                <div className="grid gap-3">
                  {marketIntelligence.marketShifts.map((shift, index) => (
                    <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{shift.shift}</div>
                          <div className="text-sm text-gray-600">Preparation: {shift.preparationTime}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">{shift.probability}%</div>
                          <div className="text-xs text-gray-600">Probability</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="implementation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Implementation Roadmap
              </CardTitle>
              <CardDescription>
                Step-by-step GEO optimization implementation plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {implementationProgress.map((phase, index) => (
                  <div key={index} className="border-l-2 border-gray-200 pl-6 pb-6 relative">
                    <div className={`absolute -left-2 w-4 h-4 rounded-full ${
                      phase.status === 'completed' ? 'bg-green-600' :
                      phase.status === 'in_progress' ? 'bg-blue-600' :
                      phase.status === 'blocked' ? 'bg-red-600' :
                      'bg-gray-400'
                    }`} />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{phase.phase}</h3>
                        <Badge variant={
                          phase.status === 'completed' ? 'default' :
                          phase.status === 'in_progress' ? 'secondary' :
                          phase.status === 'blocked' ? 'destructive' :
                          'outline'
                        }>
                          {phase.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <Progress value={phase.progress} className="h-3" />
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Progress: {phase.progress}%</span>
                        {phase.daysRemaining > 0 && (
                          <span>{phase.daysRemaining} days remaining</span>
                        )}
                      </div>
                      <div className="text-sm">
                        <strong>Next Milestone:</strong> {phase.nextMilestone}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-600" />
                GEO Analysis Configuration
              </CardTitle>
              <CardDescription>
                Configure your AI-Future Proofing analysis parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="content-input">Content to Analyze</Label>
                  <Textarea
                    id="content-input"
                    value={contentInput}
                    onChange={(e) => setContentInput(e.target.value)}
                    placeholder="Paste your content here for comprehensive AI analysis..."
                    rows={6}
                  />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="keywords">Target Keywords</Label>
                    <Input
                      id="keywords"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      placeholder="AI SEO, voice search, generative optimization"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={industryInput}
                      onChange={(e) => setIndustryInput(e.target.value)}
                      placeholder="Technology, Healthcare, Finance, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url">URL (Optional)</Label>
                    <Input
                      id="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://your-website.com/page"
                    />
                  </div>
                </div>
              </div>
              
              <Alert className="border-blue-200 bg-blue-50">
                <Shield className="h-4 w-4" />
                <AlertTitle>Enterprise AI Analysis</AlertTitle>
                <AlertDescription>
                  Your content is analyzed using advanced AI models with enterprise-grade security. 
                  All data is processed securely and not stored permanently.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button onClick={handleFullGEOAnalysis} disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Running Analysis...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Start Complete GEO Analysis
                    </>
                  )}
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}