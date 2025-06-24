// src/components/AIPoweredContentAnalysis.tsx
// AI-Powered Content Analysis Component
// Advanced content gap analysis and optimization recommendations

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Brain, 
  FileText, 
  Search, 
  Target, 
  TrendingUp, 
  Lightbulb, 
  Zap, 
  Star,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  MessageSquare,
  Globe,
  BarChart3,
  Users,
  Eye,
  ThumbsUp,
  ArrowRight,
  Download,
  RefreshCw
} from 'lucide-react';

interface ContentGap {
  topic: string;
  searchVolume: number;
  competitionLevel: 'low' | 'medium' | 'high';
  aiOpportunity: 'high' | 'medium' | 'low';
  contentTypeRecommendations: string[];
  estimatedTraffic: number;
  difficultyScore: number;
  timeToRank: string;
}

interface AIOptimizationRecommendation {
  category: 'structure' | 'content' | 'technical' | 'ai_readiness';
  recommendation: string;
  implementation: string;
  expectedImpact: 'high' | 'medium' | 'low';
  aiSearchBenefit: string;
  priority: number;
  effort: 'low' | 'medium' | 'high';
}

interface TopicCluster {
  mainTopic: string;
  relatedTopics: string[];
  pillarContentNeeded: boolean;
  supportingContentCount: number;
  aiDiscoveryScore: number;
  currentCoverage: number;
  opportunityScore: number;
}

interface AIContentBrief {
  title: string;
  targetKeyword: string;
  aiOptimizationFocus: string[];
  structureRecommendations: string[];
  questionOpportunities: string[];
  schemaMarkupNeeded: string[];
  estimatedLength: number;
  contentType: string;
  targetAudience: string;
}

interface CitationOptimization {
  contentSection: string;
  citationReadinessScore: number;
  improvementSuggestions: string[];
  authoritativeSourceRecommendations: string[];
  factualGaps: string[];
  expertQuoteOpportunities: string[];
}

interface AIPoweredContentAnalysisProps {
  content?: string;
  targetKeywords?: string[];
  industry?: string;
  competitorUrls?: string[];
  onGenerateBrief?: (brief: AIContentBrief) => void;
  onOptimizeContent?: (optimizations: AIOptimizationRecommendation[]) => void;
}

export default function AIPoweredContentAnalysis({
  content = "",
  targetKeywords = [],
  industry = "",
  competitorUrls = [],
  onGenerateBrief,
  onOptimizeContent
}: AIPoweredContentAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisInput, setAnalysisInput] = useState(content);
  const [keywordInput, setKeywordInput] = useState(targetKeywords.join(', '));
  const [contentGaps, setContentGaps] = useState<ContentGap[]>([]);
  const [recommendations, setRecommendations] = useState<AIOptimizationRecommendation[]>([]);
  const [topicClusters, setTopicClusters] = useState<TopicCluster[]>([]);
  const [contentBriefs, setContentBriefs] = useState<AIContentBrief[]>([]);
  const [citationOptimizations, setCitationOptimizations] = useState<CitationOptimization[]>([]);
  const [selectedBrief, setSelectedBrief] = useState<AIContentBrief | null>(null);

  useEffect(() => {
    if (content || targetKeywords.length > 0) {
      performAIAnalysis();
    }
  }, [content, targetKeywords]);

  const performAIAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock content gaps
      const mockGaps: ContentGap[] = [
        {
          topic: "AI-powered SEO optimization",
          searchVolume: 8500,
          competitionLevel: 'medium',
          aiOpportunity: 'high',
          contentTypeRecommendations: ['How-to guide', 'Case study', 'Tool comparison'],
          estimatedTraffic: 2500,
          difficultyScore: 65,
          timeToRank: '3-4 months'
        },
        {
          topic: "Voice search optimization strategies",
          searchVolume: 5200,
          competitionLevel: 'low',
          aiOpportunity: 'high',
          contentTypeRecommendations: ['FAQ page', 'Complete guide', 'Best practices'],
          estimatedTraffic: 1800,
          difficultyScore: 45,
          timeToRank: '2-3 months'
        },
        {
          topic: "Generative engine optimization",
          searchVolume: 3100,
          competitionLevel: 'low',
          aiOpportunity: 'high',
          contentTypeRecommendations: ['Ultimate guide', 'Tutorial series', 'Checklist'],
          estimatedTraffic: 1200,
          difficultyScore: 35,
          timeToRank: '1-2 months'
        }
      ];

      // Mock AI optimization recommendations
      const mockRecommendations: AIOptimizationRecommendation[] = [
        {
          category: 'ai_readiness',
          recommendation: 'Add conversational Q&A sections',
          implementation: 'Structure content with clear questions followed by direct, concise answers',
          expectedImpact: 'high',
          aiSearchBenefit: 'Better AI citation potential and voice search optimization',
          priority: 95,
          effort: 'medium'
        },
        {
          category: 'structure',
          recommendation: 'Implement topic cluster architecture',
          implementation: 'Create pillar pages with supporting cluster content around main topics',
          expectedImpact: 'high',
          aiSearchBenefit: 'Enhanced topic authority and AI content understanding',
          priority: 90,
          effort: 'high'
        },
        {
          category: 'content',
          recommendation: 'Add authoritative source citations',
          implementation: 'Include statistics, expert quotes, and research references throughout content',
          expectedImpact: 'medium',
          aiSearchBenefit: 'Increased AI trust signals and citation worthiness',
          priority: 80,
          effort: 'medium'
        }
      ];

      // Mock topic clusters
      const mockClusters: TopicCluster[] = [
        {
          mainTopic: 'SEO Optimization',
          relatedTopics: ['Keyword research', 'On-page SEO', 'Technical SEO', 'Link building'],
          pillarContentNeeded: true,
          supportingContentCount: 8,
          aiDiscoveryScore: 75,
          currentCoverage: 60,
          opportunityScore: 85
        },
        {
          mainTopic: 'AI in Marketing',
          relatedTopics: ['AI tools', 'Content generation', 'Personalization', 'Analytics'],
          pillarContentNeeded: true,
          supportingContentCount: 6,
          aiDiscoveryScore: 85,
          currentCoverage: 40,
          opportunityScore: 90
        }
      ];

      // Mock content briefs
      const mockBriefs: AIContentBrief[] = [
        {
          title: 'Complete Guide to AI-Powered SEO Optimization',
          targetKeyword: 'AI SEO optimization',
          aiOptimizationFocus: ['Question-answer format', 'Voice search ready', 'AI citation optimization'],
          structureRecommendations: ['Add FAQ section', 'Include step-by-step processes', 'Create comparison tables'],
          questionOpportunities: ['What is AI SEO?', 'How does AI improve SEO?', 'Best AI SEO tools?'],
          schemaMarkupNeeded: ['Article', 'FAQ', 'HowTo', 'SoftwareApplication'],
          estimatedLength: 3500,
          contentType: 'Ultimate Guide',
          targetAudience: 'Marketing professionals and business owners'
        },
        {
          title: 'Voice Search Optimization: The Complete 2024 Strategy',
          targetKeyword: 'voice search optimization',
          aiOptimizationFocus: ['Conversational keywords', 'Featured snippet optimization', 'Local SEO integration'],
          structureRecommendations: ['Use natural language', 'Include location-based content', 'Add voice search statistics'],
          questionOpportunities: ['How to optimize for voice search?', 'Voice search trends 2024?', 'Voice SEO best practices?'],
          schemaMarkupNeeded: ['Article', 'FAQ', 'LocalBusiness'],
          estimatedLength: 2800,
          contentType: 'Strategy Guide',
          targetAudience: 'SEO specialists and digital marketers'
        }
      ];

      // Mock citation optimizations
      const mockCitations: CitationOptimization[] = [
        {
          contentSection: 'Introduction',
          citationReadinessScore: 65,
          improvementSuggestions: ['Add industry statistics', 'Include expert definitions', 'Reference recent studies'],
          authoritativeSourceRecommendations: ['Google AI research papers', 'SEMrush industry reports', 'Moz SEO studies'],
          factualGaps: ['Missing voice search usage statistics', 'No AI adoption rates mentioned'],
          expertQuoteOpportunities: ['SEO industry leaders', 'AI researchers', 'Digital marketing experts']
        },
        {
          contentSection: 'Main Content',
          citationReadinessScore: 70,
          improvementSuggestions: ['Add case study data', 'Include tool comparisons', 'Reference algorithm updates'],
          authoritativeSourceRecommendations: ['Google Search Central', 'OpenAI research', 'Industry case studies'],
          factualGaps: ['Missing ROI data', 'No performance metrics'],
          expertQuoteOpportunities: ['Tool creators', 'SEO consultants', 'Marketing directors']
        }
      ];

      setContentGaps(mockGaps);
      setRecommendations(mockRecommendations);
      setTopicClusters(mockClusters);
      setContentBriefs(mockBriefs);
      setCitationOptimizations(mockCitations);
      
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getOpportunityColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getImpactBadgeVariant = (impact: string) => {
    switch (impact) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'structure': return <BarChart3 className="h-4 w-4" />;
      case 'content': return <FileText className="h-4 w-4" />;
      case 'technical': return <Zap className="h-4 w-4" />;
      case 'ai_readiness': return <Brain className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const handleGenerateBrief = (brief: AIContentBrief) => {
    setSelectedBrief(brief);
    if (onGenerateBrief) {
      onGenerateBrief(brief);
    }
  };

  const handleOptimizeContent = () => {
    if (onOptimizeContent) {
      onOptimizeContent(recommendations);
    }
  };

  return (
    <div className="space-y-6">
      {/* Analysis Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI Content Analysis Engine
          </CardTitle>
          <CardDescription>
            Advanced content gap analysis and AI optimization recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="keywords">Target Keywords</Label>
              <Input
                id="keywords"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Enter keywords separated by commas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={industry}
                placeholder="e.g., Technology, Healthcare, Finance"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content to Analyze (Optional)</Label>
            <Textarea
              id="content"
              value={analysisInput}
              onChange={(e) => setAnalysisInput(e.target.value)}
              placeholder="Paste your content here for AI analysis..."
              rows={6}
            />
          </div>
          <Button 
            onClick={performAIAnalysis}
            disabled={isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Start AI Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {(contentGaps.length > 0 || recommendations.length > 0) && (
        <Tabs defaultValue="gaps" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="gaps">Content Gaps</TabsTrigger>
            <TabsTrigger value="recommendations">AI Optimization</TabsTrigger>
            <TabsTrigger value="clusters">Topic Clusters</TabsTrigger>
            <TabsTrigger value="briefs">Content Briefs</TabsTrigger>
            <TabsTrigger value="citations">Citation Optimization</TabsTrigger>
          </TabsList>

          <TabsContent value="gaps" className="space-y-4">
            <div className="grid gap-4">
              {contentGaps.map((gap, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{gap.topic}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getOpportunityColor(gap.aiOpportunity)}>
                          {gap.aiOpportunity} AI opportunity
                        </Badge>
                        <Badge variant="secondary" className={getCompetitionColor(gap.competitionLevel)}>
                          {gap.competitionLevel} competition
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="font-medium">{gap.searchVolume.toLocaleString()}</div>
                          <div className="text-gray-600">Search Volume</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="font-medium">{gap.estimatedTraffic.toLocaleString()}</div>
                          <div className="text-gray-600">Est. Traffic</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-purple-600" />
                        <div>
                          <div className="font-medium">{gap.difficultyScore}/100</div>
                          <div className="text-gray-600">Difficulty</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-orange-600" />
                        <div>
                          <div className="font-medium">{gap.timeToRank}</div>
                          <div className="text-gray-600">Time to Rank</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-2">Recommended Content Types:</div>
                      <div className="flex flex-wrap gap-2">
                        {gap.contentTypeRecommendations.map((type, i) => (
                          <Badge key={i} variant="outline">{type}</Badge>
                        ))}
                      </div>
                    </div>
                    <Progress value={100 - gap.difficultyScore} className="h-2" />
                    <div className="text-xs text-gray-600">
                      Opportunity Score: {100 - gap.difficultyScore}% (Higher is better)
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">AI Optimization Recommendations</h3>
              <Button onClick={handleOptimizeContent} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Apply Optimizations
              </Button>
            </div>
            <div className="space-y-4">
              {recommendations
                .sort((a, b) => b.priority - a.priority)
                .map((rec, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(rec.category)}
                        <CardTitle className="text-base">{rec.recommendation}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getImpactBadgeVariant(rec.expectedImpact)}>
                          {rec.expectedImpact} impact
                        </Badge>
                        <Badge variant="outline">
                          Priority: {rec.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Implementation:</div>
                      <div className="text-sm text-gray-600">{rec.implementation}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-green-700 mb-1">AI Search Benefit:</div>
                      <div className="text-sm text-green-600">{rec.aiSearchBenefit}</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Category: {rec.category.replace('_', ' ')}</span>
                      <span>Effort: {rec.effort}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="clusters" className="space-y-4">
            <div className="grid gap-4">
              {topicClusters.map((cluster, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-purple-600" />
                        {cluster.mainTopic}
                      </CardTitle>
                      <Badge variant={cluster.pillarContentNeeded ? "destructive" : "default"}>
                        {cluster.pillarContentNeeded ? "Pillar Needed" : "Complete"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium">AI Discovery Score</div>
                        <div className="flex items-center gap-2">
                          <Progress value={cluster.aiDiscoveryScore} className="h-2 flex-1" />
                          <span className="text-sm font-medium">{cluster.aiDiscoveryScore}%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Current Coverage</div>
                        <div className="flex items-center gap-2">
                          <Progress value={cluster.currentCoverage} className="h-2 flex-1" />
                          <span className="text-sm font-medium">{cluster.currentCoverage}%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Opportunity Score</div>
                        <div className="flex items-center gap-2">
                          <Progress value={cluster.opportunityScore} className="h-2 flex-1" />
                          <span className="text-sm font-medium">{cluster.opportunityScore}%</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-2">Related Topics:</div>
                      <div className="flex flex-wrap gap-2">
                        {cluster.relatedTopics.map((topic, i) => (
                          <Badge key={i} variant="secondary">{topic}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Supporting Content Needed: {cluster.supportingContentCount}</span>
                      {cluster.pillarContentNeeded && (
                        <span className="text-red-600 font-medium">⚠ Pillar content required</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="briefs" className="space-y-4">
            <div className="grid gap-4">
              {contentBriefs.map((brief, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      {brief.title}
                    </CardTitle>
                    <CardDescription>
                      Target: {brief.targetKeyword} • {brief.contentType} • {brief.estimatedLength} words
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium mb-2">AI Optimization Focus:</div>
                        <div className="space-y-1">
                          {brief.aiOptimizationFocus.map((focus, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              {focus}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-2">Structure Recommendations:</div>
                        <div className="space-y-1">
                          {brief.structureRecommendations.map((rec, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <ArrowRight className="h-3 w-3 text-blue-600" />
                              {rec}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-2">Question Opportunities:</div>
                      <div className="flex flex-wrap gap-2">
                        {brief.questionOpportunities.map((question, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{question}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-2">Schema Markup Needed:</div>
                      <div className="flex flex-wrap gap-2">
                        {brief.schemaMarkupNeeded.map((schema, i) => (
                          <Badge key={i} variant="secondary">{schema}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Target Audience: {brief.targetAudience}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleGenerateBrief(brief)}
                        variant="outline"
                      >
                        <Download className="mr-2 h-3 w-3" />
                        Generate Brief
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="citations" className="space-y-4">
            <div className="space-y-4">
              {citationOptimizations.map((citation, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-600" />
                        {citation.contentSection}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Progress value={citation.citationReadinessScore} className="w-20 h-2" />
                        <span className="text-sm font-medium">{citation.citationReadinessScore}%</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium mb-2 text-blue-700">Improvement Suggestions:</div>
                        <div className="space-y-1">
                          {citation.improvementSuggestions.map((suggestion, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <Lightbulb className="h-3 w-3 mt-0.5 text-blue-600" />
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-2 text-green-700">Authoritative Sources:</div>
                        <div className="space-y-1">
                          {citation.authoritativeSourceRecommendations.map((source, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <Globe className="h-3 w-3 mt-0.5 text-green-600" />
                              {source}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {citation.factualGaps.length > 0 && (
                      <Alert className="border-yellow-200 bg-yellow-50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Factual Gaps Identified</AlertTitle>
                        <AlertDescription>
                          <div className="mt-2 space-y-1">
                            {citation.factualGaps.map((gap, i) => (
                              <div key={i} className="text-sm">• {gap}</div>
                            ))}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                    <div>
                      <div className="text-sm font-medium mb-2 text-purple-700">Expert Quote Opportunities:</div>
                      <div className="flex flex-wrap gap-2">
                        {citation.expertQuoteOpportunities.map((expert, i) => (
                          <Badge key={i} variant="outline">{expert}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Selected Brief Modal/Card */}
      {selectedBrief && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Content Brief Generated: {selectedBrief.title}</AlertTitle>
          <AlertDescription>
            Your AI-optimized content brief is ready. The brief includes structured recommendations 
            for {selectedBrief.aiOptimizationFocus.length} AI optimization areas and 
            {selectedBrief.questionOpportunities.length} question opportunities.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}