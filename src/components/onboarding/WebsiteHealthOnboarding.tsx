'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity,
  BarChart3,
  Shield,
  Target,
  TrendingUp,
  Award,
  Zap,
  CheckCircle,
  AlertTriangle,
  Clock,
  Users,
  Star,
  ArrowRight,
  Sparkles,
  Lock,
  Crown
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface WebsiteHealthOnboardingProps {
  website: string;
  onComplete?: () => void;
  onUpgrade?: () => void;
}

interface HealthMetric {
  name: string;
  score: number;
  grade: string;
  color: string;
  icon: React.ReactNode;
  issues: string[];
  recommendations: string[];
  isPremium?: boolean;
}

export default function WebsiteHealthOnboarding({ 
  website, 
  onComplete, 
  onUpgrade 
}: WebsiteHealthOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [showResults, setShowResults] = useState(false);

  // Simulate analysis
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnalyzing(false);
      setShowResults(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Mock health data - in production this would come from actual analysis
  const healthMetrics: HealthMetric[] = [
    {
      name: 'SEO Performance',
      score: 72,
      grade: 'B-',
      color: 'text-blue-500',
      icon: <BarChart3 className="w-6 h-6" />,
      issues: ['Missing meta descriptions', 'Slow page load times', 'No structured data'],
      recommendations: ['Add meta descriptions to all pages', 'Optimize images', 'Implement schema markup']
    },
    {
      name: 'Site Speed',
      score: 68,
      grade: 'C+',
      color: 'text-purple-500',
      icon: <Activity className="w-6 h-6" />,
      issues: ['Large image files', 'Unoptimized CSS', 'No browser caching'],
      recommendations: ['Compress images', 'Minify CSS/JS', 'Enable browser caching']
    },
    {
      name: 'Security',
      score: 91,
      grade: 'A-',
      color: 'text-green-500',
      icon: <Shield className="w-6 h-6" />,
      issues: ['Minor SSL configuration'],
      recommendations: ['Update SSL certificate', 'Enable HSTS headers']
    },
    {
      name: 'Mobile Optimization',
      score: 85,
      grade: 'B+',
      color: 'text-indigo-500',
      icon: <Target className="w-6 h-6" />,
      issues: ['Touch targets too small', 'Viewport not optimized'],
      recommendations: ['Increase button sizes', 'Optimize mobile viewport']
    },
    {
      name: 'Competitor Analysis',
      score: 0,
      grade: 'N/A',
      color: 'text-gray-400',
      icon: <TrendingUp className="w-6 h-6" />,
      issues: ['Analysis not available in free plan'],
      recommendations: ['Upgrade to see how you compare'],
      isPremium: true
    },
    {
      name: 'Advanced Insights',
      score: 0,
      grade: 'N/A',
      color: 'text-gray-400',
      icon: <Award className="w-6 h-6" />,
      issues: ['Premium feature'],
      recommendations: ['Unlock detailed analytics'],
      isPremium: true
    }
  ];

  const overallScore = Math.round(
    healthMetrics
      .filter(m => !m.isPremium)
      .reduce((acc, m) => acc + m.score, 0) / 
    healthMetrics.filter(m => !m.isPremium).length
  );

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/30 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-t-blue-500 rounded-full animate-spin"></div>
                <Zap className="absolute inset-0 w-6 h-6 text-blue-400 m-auto" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Analyzing Your Website</h2>
            <p className="text-gray-300 mb-6">
              We&apos;re examining {website} across multiple performance metrics...
            </p>
            <div className="space-y-2 text-left">
              {[
                'Checking SEO performance...',
                'Measuring site speed...',
                'Testing security...',
                'Analyzing mobile optimization...',
                'Gathering competitive insights...'
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.5 }}
                  className="flex items-center gap-2 text-sm text-gray-300"
                >
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  {step}
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-4">
            <Sparkles className="w-4 h-4 text-green-400" />
            <span className="text-green-300 text-sm font-medium">Analysis Complete</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Website Health Report for {website}
          </h1>
          <p className="text-gray-300 text-lg">
            Here&apos;s how your website is performing and where you can improve
          </p>
        </motion.div>

        {/* Overall Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl p-8">
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${overallScore * 2.51} 251`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getGradeColor(overallScore)}`}>
                      {overallScore}
                    </div>
                    <div className="text-sm text-gray-400">Overall Score</div>
                  </div>
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Your website scored {overallScore}/100
            </h2>
            <p className="text-gray-300">
              {overallScore >= 80 
                ? "Great job! Your website is performing well with room for minor improvements."
                : overallScore >= 60
                ? "Good foundation! There are several opportunities to boost your performance."
                : "Significant improvements needed. Let&apos;s get your website optimized!"
              }
            </p>
          </Card>
        </motion.div>

        {/* Detailed Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          {healthMetrics.map((metric, index) => (
            <Card 
              key={metric.name} 
              className={`bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl p-6 relative ${
                metric.isPremium ? 'opacity-75' : ''
              }`}
            >
              {metric.isPremium && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 ${metric.color}`}>
                  {metric.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{metric.name}</h3>
                  {!metric.isPremium && (
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${getGradeColor(metric.score)}`}>
                        {metric.score}
                      </span>
                      <span className="text-gray-400">({metric.grade})</span>
                    </div>
                  )}
                </div>
              </div>

              {metric.isPremium ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Lock className="w-4 h-4" />
                    <span className="text-sm">Premium Feature</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Unlock detailed competitor analysis and advanced insights
                  </p>
                  <Button 
                    onClick={onUpgrade}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                  >
                    Upgrade to Pro
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-red-300 mb-1">Issues Found:</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {metric.issues.map((issue, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-green-300 mb-1">Recommendations:</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {metric.recommendations.slice(0, 2).map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </motion.div>

        {/* Action Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        >
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Quick Wins</h3>
            <p className="text-gray-300 mb-4">
              Start with these high-impact, low-effort improvements:
            </p>
            <div className="space-y-3">
              {[
                'Add meta descriptions to your main pages',
                'Optimize your largest images',
                'Enable browser caching',
                'Fix mobile touch targets'
              ].map((action, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg border border-green-500/20">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-white text-sm">{action}</span>
                  <Badge className="ml-auto bg-green-500/20 text-green-300">
                    {Math.floor(Math.random() * 10) + 5} points
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Long-term Goals</h3>
            <p className="text-gray-300 mb-4">
              Bigger improvements that will significantly boost your score:
            </p>
            <div className="space-y-3">
              {[
                'Implement comprehensive SEO strategy',
                'Redesign for mobile-first experience',
                'Set up advanced security measures',
                'Create content optimization plan'
              ].map((goal, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                  <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Target className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-white text-sm">{goal}</span>
                  <Badge className="ml-auto bg-blue-500/20 text-blue-300">
                    {Math.floor(Math.random() * 15) + 10} points
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Upgrade CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl border-white/20 shadow-2xl p-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Optimize Your Website?
            </h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Get detailed competitor analysis, automated monitoring, and personalized recommendations 
              to boost your website&apos;s performance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={onUpgrade}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg"
              >
                <Crown className="w-5 h-5 mr-2" />
                Upgrade to Pro
              </Button>
              <Button 
                onClick={onComplete}
                variant="outline"
                className="border-white/20 hover:border-white/40 text-white px-8 py-4 text-lg"
              >
                Continue to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
            <div className="mt-4 text-sm text-gray-400">
              ⚡ 30-day money-back guarantee • 🔒 Cancel anytime • 📊 Track improvements
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}