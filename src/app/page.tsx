'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Shield, 
  TrendingUp,
  Users,
  ArrowRight,
  CheckCircle2,
  Globe,
  Clock,
  AlertCircle,
  Check,
  X,
  Search,
  BarChart3,
  Eye,
  Target
} from 'lucide-react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [healthCheck, setHealthCheck] = useState({
    url: '',
    loading: false,
    result: null,
    showResults: false
  });

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (session?.user) {
      router.push('/dashboard');
    }
  }, [session, router]);

  // URL Health Check Function
  const performHealthCheck = async () => {
    if (!healthCheck.url.trim()) return;
    
    setHealthCheck(prev => ({ ...prev, loading: true, showResults: false }));
    
    try {
      const response = await fetch('/api/health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: healthCheck.url })
      });
      
      const result = await response.json();
      setHealthCheck(prev => ({ 
        ...prev, 
        loading: false, 
        result,
        showResults: true 
      }));
    } catch (error) {
      setHealthCheck(prev => ({ 
        ...prev, 
        loading: false,
        result: { error: 'Failed to check URL health' },
        showResults: true 
      }));
    }
  };

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Navigation */}
      <nav className="relative z-10 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Zap className="h-8 w-8 text-blue-400" />
            <span className="ml-2 text-xl font-bold text-white">Zenith Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/signin"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6"
          >
            AI-Powered
            <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Team Management
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto"
          >
            Transform your team productivity with intelligent project management, 
            real-time analytics, and seamless collaboration tools.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              href="/auth/signin"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200 transform hover:scale-105"
            >
              Access Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/auth/register"
              className="border border-white/20 hover:border-white/40 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-200 backdrop-blur-sm"
            >
              Start Free Trial
            </Link>
          </motion.div>

        </div>
      </div>

      {/* Free URL Health Check Tool */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
        >
          <div className="text-center mb-6">
            <Globe className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Free SEO & Traffic Analysis</h2>
            <p className="text-gray-300">Get instant insights into your website's SEO rankings, top keywords, estimated traffic, and performance metrics - completely free, no signup required!</p>
          </div>

          <div className="flex gap-4 mb-6">
            <input
              type="url"
              placeholder="Enter your website URL (e.g., https://example.com)"
              value={healthCheck.url}
              onChange={(e) => setHealthCheck(prev => ({ ...prev, url: e.target.value }))}
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && performHealthCheck()}
            />
            <button
              onClick={performHealthCheck}
              disabled={healthCheck.loading || !healthCheck.url.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200"
            >
              {healthCheck.loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Checking...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Check Health
                </>
              )}
            </button>
          </div>

          {/* Health Check Results */}
          {healthCheck.showResults && healthCheck.result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              {healthCheck.result.error ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-400">
                    <X className="w-5 h-5" />
                    <span className="font-medium">Error: {healthCheck.result.error}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Basic Health Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Check className="w-5 h-5 text-green-400" />
                        <span className="font-medium text-green-400">Status</span>
                      </div>
                      <p className="text-white text-lg">{healthCheck.result.status}</p>
                    </div>
                    
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-blue-400" />
                        <span className="font-medium text-blue-400">Response Time</span>
                      </div>
                      <p className="text-white text-lg">{healthCheck.result.responseTime}ms</p>
                      <p className="text-gray-400 text-sm">{healthCheck.result.performance}</p>
                    </div>
                    
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-purple-400" />
                        <span className="font-medium text-purple-400">Security</span>
                      </div>
                      <p className="text-white text-lg">{healthCheck.result.ssl ? 'SSL Enabled' : 'No SSL'}</p>
                      <p className="text-gray-400 text-sm">Score: {healthCheck.result.securityScore}/100</p>
                    </div>
                  </div>

                  {/* SEO & Traffic Analytics */}
                  {healthCheck.result.seo && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Search className="w-5 h-5 text-blue-400" />
                        SEO & Traffic Analytics
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Traffic Estimate */}
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Eye className="w-5 h-5 text-orange-400" />
                            <span className="font-medium text-orange-400">Monthly Traffic</span>
                          </div>
                          <p className="text-white text-lg">{healthCheck.result.seo.traffic?.estimated?.toLocaleString() || 'N/A'}</p>
                          <p className="text-gray-400 text-sm">Estimated visitors</p>
                        </div>

                        {/* Global Rank */}
                        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="w-5 h-5 text-cyan-400" />
                            <span className="font-medium text-cyan-400">Global Rank</span>
                          </div>
                          <p className="text-white text-lg">#{healthCheck.result.seo.traffic?.rank?.toLocaleString() || 'N/A'}</p>
                          <p className="text-gray-400 text-sm">Worldwide ranking</p>
                        </div>

                        {/* SEO Score */}
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-5 h-5 text-green-400" />
                            <span className="font-medium text-green-400">SEO Score</span>
                          </div>
                          <p className="text-white text-lg">{healthCheck.result.seo.pageRank || 'N/A'}/100</p>
                          <p className="text-gray-400 text-sm">Lighthouse SEO</p>
                        </div>

                        {/* Content Analysis */}
                        <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Globe className="w-5 h-5 text-violet-400" />
                            <span className="font-medium text-violet-400">Content</span>
                          </div>
                          <p className="text-white text-lg">{healthCheck.result.seo.imageCount} images</p>
                          <p className="text-gray-400 text-sm">{healthCheck.result.seo.linkCount} links</p>
                        </div>
                      </div>

                      {/* Top Keywords */}
                      {healthCheck.result.seo.topKeywords && healthCheck.result.seo.topKeywords.length > 0 && (
                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
                          <h4 className="font-medium text-indigo-400 mb-3 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Top 3 Keywords Found on Page
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {healthCheck.result.seo.topKeywords.map((item: any, index: number) => (
                              <span 
                                key={index}
                                className="bg-indigo-600/20 text-indigo-300 px-3 py-1 rounded-full text-sm border border-indigo-500/30"
                              >
                                {item.keyword} ({item.frequency}x)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Page Title & Description */}
                      {(healthCheck.result.seo.title || healthCheck.result.seo.description) && (
                        <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-4">
                          <h4 className="font-medium text-teal-400 mb-3">SEO Meta Data</h4>
                          {healthCheck.result.seo.title && (
                            <div className="mb-2">
                              <p className="text-gray-400 text-sm">Title:</p>
                              <p className="text-white">{healthCheck.result.seo.title}</p>
                            </div>
                          )}
                          {healthCheck.result.seo.description && (
                            <div>
                              <p className="text-gray-400 text-sm">Description:</p>
                              <p className="text-white text-sm">{healthCheck.result.seo.description}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Sales Funnel CTA */}
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-6 mt-6">
                <h3 className="text-xl font-bold text-white mb-2">Unlock Complete SEO & Traffic Intelligence</h3>
                <p className="text-gray-300 mb-4">
                  Get real-time keyword rankings, accurate traffic data from SimilarWeb, competitor analysis, backlink monitoring, 24/7 uptime alerts, and comprehensive SEO audits with our Pro plans.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/auth/register"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200"
                  >
                    Start Free 14-Day Trial
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/pricing"
                    className="border border-white/20 hover:border-white/40 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 text-center"
                  >
                    View Pricing
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
          >
            <Users className="w-12 h-12 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Team Management</h3>
            <p className="text-gray-300">
              Organize teams, assign roles, and track performance with intelligent analytics.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
          >
            <TrendingUp className="w-12 h-12 text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Real-time Analytics</h3>
            <p className="text-gray-300">
              Get insights into project progress, team productivity, and performance metrics.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
          >
            <Shield className="w-12 h-12 text-green-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Enterprise Security</h3>
            <p className="text-gray-300">
              Bank-level security with audit logs, access controls, and compliance features.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Key Benefits */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Why Choose Zenith Platform?
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            'Real-time project tracking and analytics',
            'Intelligent task assignment and automation',
            'Comprehensive user and role management',
            'Secure file sharing and collaboration',
            'Custom workflows and approval processes',
            'Advanced reporting and insights'
          ].map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1.4 + index * 0.1 }}
              className="flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="text-gray-300">{benefit}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2.0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Team?
            </h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Join thousands of teams already using Zenith Platform to streamline their workflows 
              and boost productivity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signin"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105"
              >
                Sign In Now
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/auth/register"
                className="border border-white/20 hover:border-white/40 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-200 backdrop-blur-sm"
              >
                Create Account
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-cyan-900/20" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/30 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/30 rounded-full filter blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/20 rounded-full filter blur-3xl animate-pulse delay-2000" />
      </div>
    </div>
  );
}