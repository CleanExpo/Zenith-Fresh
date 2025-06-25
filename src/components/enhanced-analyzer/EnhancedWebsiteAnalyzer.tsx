/**
 * Enhanced Website Analyzer - Week 2 Feature
 * Advanced AI-powered website analysis with intelligent insights
 * 
 * Features:
 * - AI-powered content analysis
 * - Advanced performance metrics
 * - SEO optimization recommendations
 * - User experience scoring
 * - Competitive intelligence
 * - ROI-based recommendations
 */

'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  BarChart3,
  Target,
  Zap,
  Eye,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  X,
  Download,
  Share2,
  Clock,
  DollarSign,
  Users,
  Search,
  Smartphone,
  Globe,
  Star,
  ArrowRight,
  Lightbulb,
  Award,
  Flag
} from 'lucide-react';
import { useFeatureFlag } from '@/lib/feature-flags';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface EnhancedAnalysisResult {
  analysisId: string;
  overallScore: number;
  contentQuality: {
    readabilityScore: number;
    engagementPotential: number;
    contentGaps: string[];
    strengths: string[];
  };
  seoInsights: {
    technicalScore: number;
    contentScore: number;
    opportunityAreas: string[];
    criticalIssues: string[];
  };
  userExperience: {
    usabilityScore: number;
    accessibilityScore: number;
    mobileExperience: number;
  };
  performanceInsights: {
    coreWebVitalsAnalysis: {
      lcp: { current: number; target: number; impact: string };
      inp: { current: number; target: number; impact: string };
      cls: { current: number; target: number; impact: string };
    };
    bottleneckAnalysis: string[];
    optimizationOpportunities: {
      priority: 'high' | 'medium' | 'low';
      category: string;
      description: string;
      estimatedImpact: string;
    }[];
  };
  recommendations: {
    id: string;
    title: string;
    description: string;
    category: 'seo' | 'performance' | 'content' | 'ux' | 'accessibility' | 'security';
    priority: 'critical' | 'high' | 'medium' | 'low';
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    estimatedImpact: {
      trafficIncrease: number;
      conversionImprovement: number;
      performanceGain: number;
      timeToComplete: string;
    };
    roiEstimate: {
      effort: number;
      value: number;
      paybackPeriod: string;
    };
  }[];
  competitiveIntelligence?: {
    marketPosition: string;
    benchmarkComparison: {
      category: string;
      userScore: number;
      industryAverage: number;
      topPerformer: number;
    }[];
  };
  timestamp: string;
}

interface EnhancedWebsiteAnalyzerProps {
  isOpen: boolean;
  onClose: () => void;
  initialUrl?: string;
}

const EnhancedWebsiteAnalyzer = memo(function EnhancedWebsiteAnalyzer({ 
  isOpen, 
  onClose, 
  initialUrl = '' 
}: EnhancedWebsiteAnalyzerProps) {
  const [url, setUrl] = useState(initialUrl);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<EnhancedAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'input' | 'analyzing' | 'results'>('input');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  // Feature flag check
  const isEnhancedAnalyzerEnabled = useFeatureFlag('enhanced_website_analyzer');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && !initialUrl) {
      setUrl('');
      setResults(null);
      setError(null);
      setCurrentStep('input');
      setAnalysisProgress(0);
      setActiveTab('overview');
    }
  }, [isOpen, initialUrl]);

  // Simulate enhanced analysis progress
  useEffect(() => {
    if (isAnalyzing) {
      const phases = [
        { name: 'Crawling website content...', duration: 2000 },
        { name: 'AI content analysis...', duration: 3000 },
        { name: 'Performance deep dive...', duration: 2500 },
        { name: 'SEO intelligence scan...', duration: 2000 },
        { name: 'UX evaluation...', duration: 1500 },
        { name: 'Competitive analysis...', duration: 2000 },
        { name: 'Generating insights...', duration: 1500 }
      ];

      let currentPhase = 0;
      let progress = 0;

      const timer = setInterval(() => {
        progress += Math.random() * 8 + 2;
        
        if (progress >= 100) {
          progress = 100;
          clearInterval(timer);
        }
        
        setAnalysisProgress(progress);
      }, 200);

      return () => clearInterval(timer);
    }
  }, [isAnalyzing]);

  const validateUrl = useCallback((input: string): boolean => {
    try {
      const urlObject = new URL(input);
      return urlObject.protocol === 'http:' || urlObject.protocol === 'https:';
    } catch {
      return false;
    }
  }, []);

  const analyzeWebsite = async () => {
    if (!url || !validateUrl(url)) {
      setError('Please enter a valid URL (including https://)');
      return;
    }

    if (!isEnhancedAnalyzerEnabled) {
      setError('Enhanced Website Analyzer is not available in your plan');
      return;
    }

    setIsAnalyzing(true);
    setCurrentStep('analyzing');
    setError(null);

    try {
      // Simulate enhanced analysis
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Mock enhanced results
      const mockResults: EnhancedAnalysisResult = {
        analysisId: `enhanced_${Date.now()}`,
        overallScore: Math.floor(Math.random() * 20) + 75,
        contentQuality: {
          readabilityScore: Math.floor(Math.random() * 20) + 75,
          engagementPotential: Math.floor(Math.random() * 25) + 70,
          contentGaps: [
            'Missing customer testimonials',
            'No video content',
            'Limited technical specifications',
            'Lack of comparison tables'
          ],
          strengths: [
            'Clear value proposition',
            'Professional design',
            'Well-structured content',
            'Good use of headings'
          ]
        },
        seoInsights: {
          technicalScore: Math.floor(Math.random() * 20) + 78,
          contentScore: Math.floor(Math.random() * 15) + 80,
          opportunityAreas: [
            'Schema markup implementation',
            'Internal linking optimization',
            'Featured snippet optimization',
            'Local SEO enhancement'
          ],
          criticalIssues: [
            'Missing alt text on 8 images',
            'Duplicate meta descriptions on 3 pages',
            'Slow loading hero image',
            'Missing breadcrumb navigation'
          ]
        },
        userExperience: {
          usabilityScore: Math.floor(Math.random() * 20) + 72,
          accessibilityScore: Math.floor(Math.random() * 25) + 68,
          mobileExperience: Math.floor(Math.random() * 18) + 76
        },
        performanceInsights: {
          coreWebVitalsAnalysis: {
            lcp: { current: 2800, target: 2500, impact: 'Moderate impact on user experience' },
            inp: { current: 180, target: 200, impact: 'Good interaction responsiveness' },
            cls: { current: 0.15, target: 0.1, impact: 'Layout shifts affecting usability' }
          },
          bottleneckAnalysis: [
            'Large unoptimized hero image (1.2MB)',
            'Render-blocking JavaScript (3 files)',
            'Third-party analytics delays',
            'Excessive DOM complexity (2,847 nodes)'
          ],
          optimizationOpportunities: [
            {
              priority: 'high',
              category: 'Images',
              description: 'Optimize hero image with WebP format',
              estimatedImpact: '15-20% LCP improvement'
            },
            {
              priority: 'high',
              category: 'JavaScript',
              description: 'Implement code splitting for non-critical JS',
              estimatedImpact: '300ms reduction in load time'
            },
            {
              priority: 'medium',
              category: 'CSS',
              description: 'Remove unused CSS rules',
              estimatedImpact: '10% reduction in CSS bundle size'
            }
          ]
        },
        recommendations: [
          {
            id: 'rec-1',
            title: 'Optimize Core Web Vitals',
            description: 'Your LCP and CLS scores need improvement for better user experience and SEO rankings.',
            category: 'performance',
            priority: 'high',
            difficulty: 'medium',
            estimatedImpact: {
              trafficIncrease: 8,
              conversionImprovement: 12,
              performanceGain: 25,
              timeToComplete: '2-4 hours'
            },
            roiEstimate: {
              effort: 6,
              value: 8,
              paybackPeriod: '2-4 weeks'
            }
          },
          {
            id: 'rec-2',
            title: 'Implement Schema Markup',
            description: 'Add structured data to improve search visibility and rich snippet opportunities.',
            category: 'seo',
            priority: 'high',
            difficulty: 'easy',
            estimatedImpact: {
              trafficIncrease: 15,
              conversionImprovement: 5,
              performanceGain: 0,
              timeToComplete: '1-2 hours'
            },
            roiEstimate: {
              effort: 3,
              value: 7,
              paybackPeriod: '3-6 weeks'
            }
          },
          {
            id: 'rec-3',
            title: 'Improve Content Readability',
            description: 'Break up long paragraphs and add more visual elements to improve engagement.',
            category: 'content',
            priority: 'medium',
            difficulty: 'easy',
            estimatedImpact: {
              trafficIncrease: 5,
              conversionImprovement: 8,
              performanceGain: 0,
              timeToComplete: '2-3 hours'
            },
            roiEstimate: {
              effort: 4,
              value: 6,
              paybackPeriod: '4-8 weeks'
            }
          }
        ],
        competitiveIntelligence: {
          marketPosition: 'Above average performer with significant growth opportunities',
          benchmarkComparison: [
            { category: 'Performance', userScore: 78, industryAverage: 72, topPerformer: 89 },
            { category: 'SEO', userScore: 81, industryAverage: 75, topPerformer: 91 },
            { category: 'UX', userScore: 74, industryAverage: 79, topPerformer: 87 },
            { category: 'Content', userScore: 79, industryAverage: 73, topPerformer: 88 }
          ]
        },
        timestamp: new Date().toISOString()
      };

      setAnalysisProgress(100);
      
      setTimeout(() => {
        setResults(mockResults);
        setCurrentStep('results');
        setIsAnalyzing(false);
      }, 500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enhanced analysis failed');
      setIsAnalyzing(false);
      setCurrentStep('input');
      setAnalysisProgress(0);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-blue-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 85) return 'from-green-400 to-emerald-500';
    if (score >= 70) return 'from-blue-400 to-cyan-500';
    if (score >= 60) return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-rose-500';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'seo': return <Search className="w-4 h-4" />;
      case 'performance': return <Zap className="w-4 h-4" />;
      case 'content': return <Brain className="w-4 h-4" />;
      case 'ux': return <Users className="w-4 h-4" />;
      case 'accessibility': return <Eye className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="max-w-7xl w-full max-h-[90vh] overflow-hidden backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    Enhanced Website Analyzer
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-400/20">
                      <Flag className="w-3 h-3 mr-1" />
                      AI-Powered
                    </Badge>
                  </h2>
                  <p className="text-gray-400 text-sm">Advanced AI insights and competitive intelligence</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Step 1: URL Input */}
            {currentStep === 'input' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Website URL for Enhanced Analysis
                  </label>
                  <div className="flex gap-4">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="flex-1 px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          analyzeWebsite();
                        }
                      }}
                    />
                    <Button
                      onClick={analyzeWebsite}
                      disabled={!url || isAnalyzing}
                      className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      Analyze with AI
                    </Button>
                  </div>
                  {error && (
                    <p className="text-red-400 text-sm mt-2">{error}</p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-white/5 border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-400" />
                      AI-Powered Analysis
                    </h3>
                    <div className="space-y-3">
                      {[
                        { icon: <Target className="w-4 h-4" />, text: 'Content Quality Assessment', color: 'text-purple-400' },
                        { icon: <Search className="w-4 h-4" />, text: 'Advanced SEO Intelligence', color: 'text-blue-400' },
                        { icon: <Users className="w-4 h-4" />, text: 'UX & Accessibility Scoring', color: 'text-green-400' },
                        { icon: <BarChart3 className="w-4 h-4" />, text: 'Competitive Benchmarking', color: 'text-orange-400' }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={item.color}>{item.icon}</div>
                          <span className="text-gray-300 text-sm">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="bg-white/5 border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-400" />
                      Intelligent Recommendations
                    </h3>
                    <div className="space-y-3">
                      {[
                        { icon: <DollarSign className="w-4 h-4" />, text: 'ROI Impact Estimates', color: 'text-green-400' },
                        { icon: <Clock className="w-4 h-4" />, text: 'Implementation Time', color: 'text-blue-400' },
                        { icon: <TrendingUp className="w-4 h-4" />, text: 'Traffic Growth Predictions', color: 'text-purple-400' },
                        { icon: <Award className="w-4 h-4" />, text: 'Priority-Based Action Items', color: 'text-orange-400' }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={item.color}>{item.icon}</div>
                          <span className="text-gray-300 text-sm">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* Step 2: Analysis in Progress */}
            {currentStep === 'analyzing' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 text-center space-y-8"
              >
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Brain className="w-12 h-12 text-white" />
                  </motion.div>
                </div>

                <div>
                  <h3 className="text-3xl font-bold text-white mb-2">AI Analysis in Progress</h3>
                  <p className="text-gray-400 text-lg">Running comprehensive analysis with AI insights...</p>
                </div>

                <div className="max-w-lg mx-auto">
                  <div className="bg-white/10 rounded-full h-4 overflow-hidden mb-3">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-400 to-blue-400"
                      style={{ width: `${analysisProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-sm text-gray-400">{Math.round(analysisProgress)}% Complete</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                  {[
                    { icon: <Globe className="w-5 h-5" />, label: 'Content Crawling', complete: analysisProgress > 15 },
                    { icon: <Brain className="w-5 h-5" />, label: 'AI Analysis', complete: analysisProgress > 40 },
                    { icon: <Zap className="w-5 h-5" />, label: 'Performance Check', complete: analysisProgress > 65 },
                    { icon: <BarChart3 className="w-5 h-5" />, label: 'Insights Generation', complete: analysisProgress > 85 }
                  ].map((item, i) => (
                    <div key={i} className="text-center space-y-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto ${
                        item.complete ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-400'
                      }`}>
                        {item.complete ? <CheckCircle2 className="w-5 h-5" /> : item.icon}
                      </div>
                      <p className={`text-xs ${item.complete ? 'text-green-400' : 'text-gray-400'}`}>
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Enhanced Results */}
            {currentStep === 'results' && results && (
              <div className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-5 bg-white/5 border border-white/10">
                    <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                    <TabsTrigger value="recommendations" className="text-xs">AI Insights</TabsTrigger>
                    <TabsTrigger value="performance" className="text-xs">Performance</TabsTrigger>
                    <TabsTrigger value="seo" className="text-xs">SEO</TabsTrigger>
                    <TabsTrigger value="competitive" className="text-xs">Competitive</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6 mt-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center"
                    >
                      <div className="relative w-40 h-40 mx-auto mb-6">
                        <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke="rgb(255 255 255 / 0.1)"
                            strokeWidth="6"
                            fill="none"
                          />
                          <motion.circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke="url(#scoreGradient)"
                            strokeWidth="6"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 45}`}
                            initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - results.overallScore / 100) }}
                            transition={{ duration: 1.5, delay: 0.5 }}
                          />
                          <defs>
                            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#8b5cf6" />
                              <stop offset="100%" stopColor="#3b82f6" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className={`text-4xl font-bold ${getScoreColor(results.overallScore)}`}>
                              {results.overallScore}
                            </div>
                            <div className="text-xs text-gray-400">/ 100</div>
                          </div>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">Enhanced Analysis Score</h3>
                      <p className="text-gray-400 max-w-md mx-auto">
                        {results.overallScore >= 85 ? 'Excellent! Your website is performing exceptionally well.' :
                         results.overallScore >= 70 ? 'Good performance with opportunities for optimization.' :
                         'Significant opportunities for improvement identified.'}
                      </p>
                    </motion.div>

                    <div className="grid md:grid-cols-4 gap-4">
                      {[
                        { title: 'Content Quality', score: results.contentQuality.readabilityScore, icon: <Brain className="w-5 h-5" /> },
                        { title: 'SEO Score', score: (results.seoInsights.technicalScore + results.seoInsights.contentScore) / 2, icon: <Search className="w-5 h-5" /> },
                        { title: 'User Experience', score: results.userExperience.usabilityScore, icon: <Users className="w-5 h-5" /> },
                        { title: 'Performance', score: 78, icon: <Zap className="w-5 h-5" /> }
                      ].map((metric, i) => (
                        <Card key={i} className="bg-white/5 border-white/10 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {metric.icon}
                              <span className="text-sm text-gray-300">{metric.title}</span>
                            </div>
                            <span className={`text-lg font-bold ${getScoreColor(metric.score)}`}>
                              {Math.round(metric.score)}
                            </span>
                          </div>
                          <Progress 
                            value={metric.score} 
                            className="h-2"
                          />
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="recommendations" className="space-y-6 mt-6">
                    <div className="space-y-4">
                      {results.recommendations.map((rec, i) => (
                        <Card key={rec.id} className="bg-white/5 border-white/10 p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-purple-500/20">
                                {getCategoryIcon(rec.category)}
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-white mb-1">{rec.title}</h4>
                                <p className="text-gray-400 text-sm mb-3">{rec.description}</p>
                                <div className="flex items-center gap-2 mb-3">
                                  <Badge className={`${getPriorityColor(rec.priority)} text-white text-xs`}>
                                    {rec.priority}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {rec.difficulty}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {rec.category}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-400 mb-1">ROI Score</div>
                              <div className="text-xl font-bold text-green-400">
                                {(rec.roiEstimate.value / rec.roiEstimate.effort * 10).toFixed(1)}
                              </div>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-3 gap-4">
                            <div className="bg-white/5 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Traffic Impact</div>
                              <div className="text-lg font-semibold text-green-400">
                                +{rec.estimatedImpact.trafficIncrease}%
                              </div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Conversion Impact</div>
                              <div className="text-lg font-semibold text-blue-400">
                                +{rec.estimatedImpact.conversionImprovement}%
                              </div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Time to Complete</div>
                              <div className="text-lg font-semibold text-purple-400">
                                {rec.estimatedImpact.timeToComplete}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="performance" className="space-y-6 mt-6">
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      {[
                        { 
                          metric: 'LCP', 
                          current: results.performanceInsights.coreWebVitalsAnalysis.lcp.current, 
                          target: results.performanceInsights.coreWebVitalsAnalysis.lcp.target,
                          unit: 'ms'
                        },
                        { 
                          metric: 'INP', 
                          current: results.performanceInsights.coreWebVitalsAnalysis.inp.current, 
                          target: results.performanceInsights.coreWebVitalsAnalysis.inp.target,
                          unit: 'ms'
                        },
                        { 
                          metric: 'CLS', 
                          current: results.performanceInsights.coreWebVitalsAnalysis.cls.current, 
                          target: results.performanceInsights.coreWebVitalsAnalysis.cls.target,
                          unit: ''
                        }
                      ].map((vital, i) => (
                        <Card key={i} className="bg-white/5 border-white/10 p-4">
                          <div className="text-center">
                            <div className="text-xs text-gray-400 mb-2">{vital.metric}</div>
                            <div className={`text-2xl font-bold mb-1 ${
                              vital.current <= vital.target ? 'text-green-400' : 'text-yellow-400'
                            }`}>
                              {vital.current}{vital.unit}
                            </div>
                            <div className="text-xs text-gray-500">
                              Target: {vital.target}{vital.unit}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    <Card className="bg-white/5 border-white/10 p-6">
                      <h4 className="text-lg font-semibold text-white mb-4">Performance Bottlenecks</h4>
                      <div className="space-y-3">
                        {results.performanceInsights.bottleneckAnalysis.map((bottleneck, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                            <span className="text-gray-300">{bottleneck}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="seo" className="space-y-6 mt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card className="bg-white/5 border-white/10 p-6">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                          SEO Opportunities
                        </h4>
                        <div className="space-y-3">
                          {results.seoInsights.opportunityAreas.map((opportunity, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                              <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">{opportunity}</span>
                            </div>
                          ))}
                        </div>
                      </Card>

                      <Card className="bg-white/5 border-white/10 p-6">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                          Critical Issues
                        </h4>
                        <div className="space-y-3">
                          {results.seoInsights.criticalIssues.map((issue, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                              <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                              <span className="text-gray-300 text-sm">{issue}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="competitive" className="space-y-6 mt-6">
                    {results.competitiveIntelligence && (
                      <>
                        <Card className="bg-white/5 border-white/10 p-6">
                          <h4 className="text-lg font-semibold text-white mb-4">Market Position</h4>
                          <p className="text-gray-300">{results.competitiveIntelligence.marketPosition}</p>
                        </Card>

                        <div className="space-y-4">
                          {results.competitiveIntelligence.benchmarkComparison.map((benchmark, i) => (
                            <Card key={i} className="bg-white/5 border-white/10 p-6">
                              <div className="flex items-center justify-between mb-4">
                                <h5 className="text-white font-medium">{benchmark.category}</h5>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-gray-400">You: {benchmark.userScore}</span>
                                  <span className="text-gray-400">Industry: {benchmark.industryAverage}</span>
                                  <span className="text-green-400">Top: {benchmark.topPerformer}</span>
                                </div>
                              </div>
                              <div className="relative">
                                <div className="bg-white/10 rounded-full h-2 mb-2">
                                  <div 
                                    className="bg-blue-400 h-2 rounded-full"
                                    style={{ width: `${(benchmark.userScore / benchmark.topPerformer) * 100}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>0</span>
                                  <span>{benchmark.topPerformer}</span>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t border-white/10">
                  <Button className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                    <Download className="w-4 h-4 mr-2" />
                    Download Full Report
                  </Button>
                  <Button variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Analysis
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-white/20 text-gray-300 hover:bg-white/10"
                    onClick={() => {
                      setCurrentStep('input');
                      setResults(null);
                      setUrl('');
                    }}
                  >
                    Analyze Another
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

export default EnhancedWebsiteAnalyzer;