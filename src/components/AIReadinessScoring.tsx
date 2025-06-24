// src/components/AIReadinessScoring.tsx
// AI Readiness Scoring System Component
// Real-time GEO assessment and optimization recommendations

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Brain, 
  Search, 
  MessageCircle, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
  Lightbulb,
  Zap,
  Star,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface AIReadinessScore {
  structuredDataScore: number;
  contentStructureScore: number;
  questionAnsweringScore: number;
  comprehensivenessScore: number;
  overallGEOScore: number;
  aiCitationOptimization: number;
  voiceSearchOptimization: number;
  featuredSnippetScore: number;
}

interface ScoreMetric {
  name: string;
  score: number;
  maxScore: number;
  description: string;
  icon: React.ReactNode;
  color: string;
  recommendations: string[];
}

interface PredictiveInsight {
  type: 'opportunity' | 'threat' | 'trend';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  timeframe: string;
  action: string;
}

interface AIReadinessScoringProps {
  content?: string;
  url?: string;
  onOptimize?: (optimizations: any) => void;
  realTimeMode?: boolean;
}

export default function AIReadinessScoring({ 
  content = "", 
  url = "", 
  onOptimize,
  realTimeMode = false 
}: AIReadinessScoringProps) {
  const [currentScore, setCurrentScore] = useState<AIReadinessScore>({
    structuredDataScore: 0,
    contentStructureScore: 0,
    questionAnsweringScore: 0,
    comprehensivenessScore: 0,
    overallGEOScore: 0,
    aiCitationOptimization: 0,
    voiceSearchOptimization: 0,
    featuredSnippetScore: 0
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsight[]>([]);
  const [historicalScores, setHistoricalScores] = useState<number[]>([65, 68, 72, 78, 82]);
  const [competitorBenchmark, setCompetitorBenchmark] = useState(75);

  useEffect(() => {
    if (content || url) {
      analyzeAIReadiness();
    }
  }, [content, url]);

  useEffect(() => {
    if (realTimeMode) {
      const interval = setInterval(() => {
        generatePredictiveInsights();
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [realTimeMode]);

  const analyzeAIReadiness = async () => {
    setIsAnalyzing(true);
    
    try {
      // Simulate API call to GEO framework
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock analysis results
      const mockScore: AIReadinessScore = {
        structuredDataScore: 78,
        contentStructureScore: 85,
        questionAnsweringScore: 62,
        comprehensivenessScore: 88,
        aiCitationOptimization: 71,
        voiceSearchOptimization: 56,
        featuredSnippetScore: 79,
        overallGEOScore: 74
      };

      setCurrentScore(mockScore);
      generatePredictiveInsights();
      
    } catch (error) {
      console.error('AI readiness analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generatePredictiveInsights = () => {
    const insights: PredictiveInsight[] = [
      {
        type: 'opportunity',
        title: 'Voice Search Optimization Gap',
        description: 'Your voice search readiness is below industry average. Significant opportunity for growth.',
        impact: 'high',
        timeframe: '2-3 months',
        action: 'Implement conversational content and FAQ sections'
      },
      {
        type: 'trend',
        title: 'AI Citation Requests Rising',
        description: 'AI engines are increasingly citing content similar to yours. Position for visibility.',
        impact: 'medium',
        timeframe: '1-2 months',
        action: 'Enhance factual content with authoritative sources'
      },
      {
        type: 'threat',
        title: 'Competitor GEO Advancement',
        description: 'Top competitors are improving their AI readiness scores faster than industry average.',
        impact: 'high',
        timeframe: 'Immediate',
        action: 'Accelerate structured data implementation'
      }
    ];

    setPredictiveInsights(insights);
  };

  const getScoreMetrics = (): ScoreMetric[] => [
    {
      name: 'Structured Data',
      score: currentScore.structuredDataScore,
      maxScore: 100,
      description: 'Schema markup coverage for AI discovery',
      icon: <Target className="h-4 w-4" />,
      color: getScoreColor(currentScore.structuredDataScore),
      recommendations: [
        'Add Article schema markup',
        'Implement FAQ schema',
        'Include Organization schema'
      ]
    },
    {
      name: 'Content Structure',
      score: currentScore.contentStructureScore,
      maxScore: 100,
      description: 'H1-H6 hierarchy and content organization',
      icon: <BarChart3 className="h-4 w-4" />,
      color: getScoreColor(currentScore.contentStructureScore),
      recommendations: [
        'Improve heading hierarchy',
        'Add table of contents',
        'Create clear content sections'
      ]
    },
    {
      name: 'Question Answering',
      score: currentScore.questionAnsweringScore,
      maxScore: 100,
      description: 'FAQ and direct answer optimization',
      icon: <MessageCircle className="h-4 w-4" />,
      color: getScoreColor(currentScore.questionAnsweringScore),
      recommendations: [
        'Add FAQ sections',
        'Create direct answer formats',
        'Optimize for conversational queries'
      ]
    },
    {
      name: 'Comprehensiveness',
      score: currentScore.comprehensivenessScore,
      maxScore: 100,
      description: 'Topic coverage and content depth',
      icon: <Brain className="h-4 w-4" />,
      color: getScoreColor(currentScore.comprehensivenessScore),
      recommendations: [
        'Expand topic coverage',
        'Add supporting subtopics',
        'Include related concepts'
      ]
    },
    {
      name: 'AI Citation Ready',
      score: currentScore.aiCitationOptimization,
      maxScore: 100,
      description: 'Optimization for AI engine citations',
      icon: <Star className="h-4 w-4" />,
      color: getScoreColor(currentScore.aiCitationOptimization),
      recommendations: [
        'Add authoritative sources',
        'Include statistical data',
        'Create quotable statements'
      ]
    },
    {
      name: 'Voice Search',
      score: currentScore.voiceSearchOptimization,
      maxScore: 100,
      description: 'Voice search and conversational AI readiness',
      icon: <Search className="h-4 w-4" />,
      color: getScoreColor(currentScore.voiceSearchOptimization),
      recommendations: [
        'Use natural language patterns',
        'Add location-based content',
        'Optimize for question phrases'
      ]
    },
    {
      name: 'Featured Snippets',
      score: currentScore.featuredSnippetScore,
      maxScore: 100,
      description: 'Featured snippet optimization potential',
      icon: <Lightbulb className="h-4 w-4" />,
      color: getScoreColor(currentScore.featuredSnippetScore),
      recommendations: [
        'Create concise answers',
        'Format as lists and tables',
        'Optimize paragraph length'
      ]
    }
  ];

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'threat': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'trend': return <BarChart3 className="h-4 w-4 text-blue-600" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <ArrowUp className="h-3 w-3 text-green-600" />;
    if (current < previous) return <ArrowDown className="h-3 w-3 text-red-600" />;
    return <Minus className="h-3 w-3 text-gray-600" />;
  };

  const handleOptimize = () => {
    if (onOptimize) {
      onOptimize({
        score: currentScore,
        recommendations: getScoreMetrics().map(m => m.recommendations).flat(),
        insights: predictiveInsights
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Brain className="h-6 w-6 text-blue-600" />
                AI Readiness Score
              </CardTitle>
              <CardDescription>
                Generative Engine Optimization (GEO) Assessment
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-600 flex items-center gap-1">
                {currentScore.overallGEOScore}
                {getTrendIcon(currentScore.overallGEOScore, historicalScores[historicalScores.length - 1])}
              </div>
              <div className="text-sm text-gray-600">
                Benchmark: {competitorBenchmark}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Progress 
              value={currentScore.overallGEOScore} 
              className="h-3"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>AI-Ready</span>
              <span>Industry Average: {competitorBenchmark}%</span>
              <span>AI-Optimized</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="scores" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scores">Detailed Scores</TabsTrigger>
          <TabsTrigger value="insights">Predictive Insights</TabsTrigger>
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
          <TabsTrigger value="recommendations">Action Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="scores" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getScoreMetrics().map((metric, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {metric.icon}
                      <CardTitle className="text-sm font-medium">
                        {metric.name}
                      </CardTitle>
                    </div>
                    <Badge variant={getScoreBadgeVariant(metric.score)}>
                      {metric.score}%
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {metric.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress value={metric.score} className="h-2 mb-3" />
                  <div className="space-y-1">
                    {metric.recommendations.slice(0, 2).map((rec, i) => (
                      <div key={i} className="text-xs text-gray-600 flex items-start gap-1">
                        <CheckCircle className="h-3 w-3 mt-0.5 text-green-600" />
                        {rec}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {predictiveInsights.map((insight, index) => (
              <Alert key={index} className="border-l-4 border-l-blue-500">
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <AlertTitle className="flex items-center gap-2">
                      {insight.title}
                      <Badge variant="outline" className="text-xs">
                        {insight.impact} impact
                      </Badge>
                    </AlertTitle>
                    <AlertDescription className="mt-2">
                      {insight.description}
                    </AlertDescription>
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {insight.timeframe}
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {insight.action}
                      </div>
                    </div>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GEO Score Progression</CardTitle>
              <CardDescription>
                Your AI readiness improvement over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-2">
                {historicalScores.map((score, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-600 rounded-t min-h-4 transition-all duration-500"
                      style={{ height: `${(score / 100) * 200}px` }}
                    />
                    <div className="text-xs mt-2 text-gray-600">
                      {score}%
                    </div>
                    <div className="text-xs text-gray-500">
                      Week {index + 1}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">+17</div>
                  <div className="text-xs text-gray-600">Points Growth</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">74%</div>
                  <div className="text-xs text-gray-600">Current Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">85%</div>
                  <div className="text-xs text-gray-600">Target Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="space-y-4">
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Critical Actions (Do First)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-red-600" />
                  Implement FAQ schema markup for better Q&A discovery
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-red-600" />
                  Optimize content for voice search queries
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-red-600" />
                  Add structured data for enhanced AI citations
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  High Impact Actions (Next 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-yellow-600" />
                  Create comprehensive topic clusters
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-yellow-600" />
                  Optimize for featured snippet opportunities
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-yellow-600" />
                  Enhance content comprehensiveness
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Long-term Strategy (Next 90 Days)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Develop AI-first content strategy
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Build authority for knowledge panels
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Create multi-modal content experiences
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={handleOptimize}
              disabled={isAnalyzing}
              className="flex-1"
            >
              {isAnalyzing ? 'Analyzing...' : 'Start AI Optimization'}
            </Button>
            <Button 
              variant="outline" 
              onClick={analyzeAIReadiness}
              disabled={isAnalyzing}
            >
              Re-analyze
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {realTimeMode && (
        <Alert className="border-blue-200 bg-blue-50">
          <Brain className="h-4 w-4" />
          <AlertTitle>Real-time Monitoring Active</AlertTitle>
          <AlertDescription>
            Your AI readiness score is being monitored continuously. 
            You&apos;ll receive alerts when optimization opportunities are detected.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}