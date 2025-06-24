'use client';

import { useState, useEffect } from 'react';
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
  Star,
  Activity,
  Award,
  Target,
  BarChart3,
  Clock,
  Sparkles,
  Play
} from 'lucide-react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (session?.user) {
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleGetHealthScore = async () => {
    if (!websiteUrl) return;
    
    setIsAnalyzing(true);
    // Simulate analysis time
    setTimeout(() => {
      // Redirect to register with website URL as parameter
      router.push(`/auth/register?website=${encodeURIComponent(websiteUrl)}`);
    }, 2000);
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
            <span className="ml-2 text-xl font-bold text-white">Zenith</span>
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
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with URL Input */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-sm font-medium">Free Website Health Analysis</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6"
          >
            Get Your Free
            <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Website Health Score
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto"
          >
            Discover how your website performs against competitors. Get actionable insights 
            to boost your SEO, speed, and conversions - completely free.
          </motion.p>

          {/* URL Input Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-2xl mx-auto mb-12"
          >
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="Enter your website URL (e.g., https://yoursite.com)"
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                </div>
                <button
                  onClick={handleGetHealthScore}
                  disabled={!websiteUrl || isAnalyzing}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Activity className="w-5 h-5" />
                      Get Free Analysis
                    </>
                  )}
                </button>
              </div>
              <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>No Credit Card Required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Results in 30 Seconds</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span>100% Free</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-8 text-gray-300"
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full border-2 border-white/20"></div>
                ))}
              </div>
              <span className="text-sm">25,000+ websites analyzed</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="text-sm ml-2">4.9/5 user rating</span>
            </div>
            <div className="text-sm">Trusted by 5,000+ businesses</div>
          </motion.div>
        </div>
      </div>

      {/* What You'll Discover */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            What You&apos;ll Discover
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Get a comprehensive analysis of your website&apos;s performance across all critical areas
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: <BarChart3 className="w-8 h-8 text-blue-400" />,
              title: "SEO Performance Score",
              description: "Analyze your search rankings and optimization opportunities",
              metric: "0-100 Score"
            },
            {
              icon: <Activity className="w-8 h-8 text-purple-400" />,
              title: "Site Speed Analysis",
              description: "Measure loading times and identify performance bottlenecks",
              metric: "Load Time"
            },
            {
              icon: <Shield className="w-8 h-8 text-green-400" />,
              title: "Security Audit",
              description: "Check for SSL, malware, and security vulnerabilities",
              metric: "Security Rating"
            },
            {
              icon: <Target className="w-8 h-8 text-red-400" />,
              title: "Competitor Analysis",
              description: "See how you stack up against your top competitors",
              metric: "Market Position"
            },
            {
              icon: <TrendingUp className="w-8 h-8 text-yellow-400" />,
              title: "Conversion Optimization",
              description: "Identify opportunities to improve your conversion rates",
              metric: "CRO Score"
            },
            {
              icon: <Award className="w-8 h-8 text-indigo-400" />,
              title: "Overall Health Grade",
              description: "Get a comprehensive grade for your website's health",
              metric: "A+ to F Grade"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 + index * 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 transition-all duration-200"
            >
              <div className="mb-4 flex justify-center">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-300 mb-3">{feature.description}</p>
              <div className="text-sm bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full px-3 py-1 text-blue-300 border border-blue-500/20">
                {feature.metric}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Competitive Comparison */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Choose Zenith Over Competitors?
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-4 px-6 text-white font-semibold">Feature</th>
                  <th className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-semibold">Zenith</span>
                    </div>
                  </th>
                  <th className="py-4 px-6 text-center text-gray-400">Competitor A</th>
                  <th className="py-4 px-6 text-center text-gray-400">Competitor B</th>
                  <th className="py-4 px-6 text-center text-gray-400">Competitor C</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Real-time Analysis", "✓", "✓", "✗", "✓"],
                  ["Competitor Insights", "✓", "✗", "✗", "Limited"],
                  ["Mobile Optimization", "✓", "✓", "✓", "✗"],
                  ["SEO Recommendations", "✓", "Limited", "✓", "Basic"],
                  ["Security Scanning", "✓", "✗", "Premium", "✗"],
                  ["Free Tier", "✓", "Limited", "✗", "✗"],
                  ["Customer Support", "24/7", "Business hrs", "Email only", "Premium only"]
                ].map((row, index) => (
                  <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 text-gray-300">{row[0]}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-green-400 font-semibold">{row[1]}</span>
                    </td>
                    <td className="py-4 px-6 text-center text-gray-400">{row[2]}</td>
                    <td className="py-4 px-6 text-center text-gray-400">{row[3]}</td>
                    <td className="py-4 px-6 text-center text-gray-400">{row[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            What Our Users Say
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: "Sarah Chen",
              role: "Marketing Director",
              company: "TechStart Inc.",
              quote: "Zenith&apos;s analysis revealed critical SEO issues we didn&apos;t know existed. Our organic traffic increased 150% in 3 months!",
              rating: 5
            },
            {
              name: "Mike Rodriguez",
              role: "E-commerce Owner",
              company: "Shop Local",
              quote: "The competitor analysis feature is incredible. We discovered gaps in our strategy that led to a 40% boost in conversions.",
              rating: 5
            },
            {
              name: "Emily Watson",
              role: "Digital Agency CEO",
              company: "Growth Partners",
              quote: "We use Zenith for all our client audits. The comprehensive reports save us hours and impress every client.",
              rating: 5
            }
          ].map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.0 + index * 0.2 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
            >
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-300 mb-4 italic">&quot;{testimonial.quote}&quot;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full"></div>
                <div>
                  <div className="text-white font-semibold">{testimonial.name}</div>
                  <div className="text-gray-400 text-sm">{testimonial.role}, {testimonial.company}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl border border-white/20 rounded-2xl p-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready for Your Free Website Health Check?
            </h2>
            <p className="text-gray-300 mb-8 text-lg max-w-2xl mx-auto">
              Join 25,000+ businesses that have improved their online presence with Zenith. 
              Get your comprehensive analysis in under 30 seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => document.querySelector('input[type="url"]')?.focus()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105"
              >
                <Play className="w-5 h-5" />
                Start Free Analysis
              </button>
              <Link
                href="/auth/signin"
                className="border border-white/20 hover:border-white/40 text-white px-12 py-4 rounded-xl font-semibold text-lg transition-all duration-200 backdrop-blur-sm"
              >
                Sign In to Dashboard
              </Link>
            </div>
            <div className="mt-6 text-sm text-gray-400">
              ⚡ No signup required for basic analysis • 🔒 Your data stays private • 📊 Instant results
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