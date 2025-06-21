'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  Sparkles,
  Zap,
  Shield,
  Globe,
  TrendingUp,
  Users,
  Code2,
  Rocket,
  CheckCircle2,
  ArrowRight,
  Play,
  Star,
  Terminal
} from 'lucide-react';
import VisionSandbox from '../components/VisionSandbox';
import WebsiteHealthAnalyzer from '@/components/WebsiteHealthAnalyzer';

// Glassmorphic Components
const GlassCard = ({ children, className = '', delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl ${className}`}
  >
    {children}
  </motion.div>
);

// Animated counter for metrics
const AnimatedCounter = ({ end, duration = 2, suffix = '' }: any) => {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView({ triggerOnce: true });

  useEffect(() => {
    if (typeof window !== 'undefined' && inView) {
      let start = 0;
      const increment = end / (duration * 60);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 1000 / 60);
      return () => clearInterval(timer);
    }
  }, [inView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [showSandbox, setShowSandbox] = useState(false);
  const [showHealthAnalyzer, setShowHealthAnalyzer] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');

  // Metrics that demonstrate backend power
  const liveMetrics = {
    activeUsers: 15842,
    apiCalls: 2847593,
    avgResponseTime: 47,
    uptime: 99.99
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Liquid Glass Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-cyan-900/20" />
        <motion.div
          style={{ y: backgroundY }}
          className="absolute inset-0"
        >
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/30 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/30 rounded-full filter blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/20 rounded-full filter blur-3xl animate-pulse delay-2000" />
        </motion.div>
      </div>

      {/* Hero Section - Freemium Website Health Focus */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-7xl mx-auto text-center">
          {/* Instant Value Proposition */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-xl border border-white/10 mb-8">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium">Free Website Health Check • No Signup Required</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
              Get Your Free
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
                Website Health Score
              </span>
            </h1>

              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Discover what&apos;s holding your website back with our 
                <span className="text-white font-semibold"> 5-pillar health analysis</span>.
                Get actionable insights in under 30 seconds.
              </p>
          </motion.div>

          {/* URL Input CTA - Above the Fold */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="max-w-2xl mx-auto mb-12"
          >
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="url"
                    placeholder="https://sample.com"
                    className="w-full px-6 py-4 bg-black/20 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none text-lg"
                    id="website-url-input"
                  />
                </div>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
                      const input = document.getElementById('website-url-input') as HTMLInputElement;
                      const url = input?.value;
                      if (url) {
                        setSelectedUrl(url);
                        setShowHealthAnalyzer(true);
                      }
                    }
                  }}
                  className="group relative px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 whitespace-nowrap"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Analyze My Website
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500 to-blue-500 blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-4 text-center">
                ✓ Free forever &nbsp; ✓ No signup required &nbsp; ✓ Instant results &nbsp; ✓ Export reports
              </p>
            </div>
          </motion.div>

          {/* Trust Signals & Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            {[
              { label: 'Websites Analyzed', value: 47621, suffix: '+' },
              { label: 'Issues Found', value: 183924, suffix: '+' },
              { label: 'Avg Health Score', value: 73, suffix: '/100' },
              { label: 'Users Trust Us', value: 12847, suffix: '+' }
            ].map((metric, i) => (
              <div key={i} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="text-3xl font-bold text-white mb-1">
                  <AnimatedCounter end={metric.value} suffix={metric.suffix} />
                </div>
                <div className="text-sm text-gray-400">{metric.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Security & Privacy Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-wrap justify-center items-center gap-6 mt-8 text-sm text-gray-400"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Trusted by 10K+ users</span>
            </div>
            <Link href="/privacy" className="hover:text-white transition-colors underline">
              Privacy Policy
            </Link>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 animate-float">
          <div className="w-20 h-20 backdrop-blur-xl bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
            <Code2 className="w-10 h-10 text-blue-400" />
          </div>
        </div>
        <div className="absolute bottom-20 right-10 animate-float-delayed">
          <div className="w-24 h-24 backdrop-blur-xl bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
            <Rocket className="w-12 h-12 text-purple-400" />
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      {activeDemo === 'live' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setActiveDemo(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl w-full backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8"
          >
            <h2 className="text-3xl font-bold mb-6">Live Demo: AI Content Generation</h2>
            <div className="bg-black/50 rounded-2xl p-6 mb-6">
              <p className="text-gray-300 mb-4">Watch our AI generate a complete landing page in real-time:</p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-400">AI Processing your request...</span>
                </div>
                <div className="bg-white/5 rounded-xl p-4 font-mono text-sm">
                  <span className="text-blue-400">const</span> aiResponse = <span className="text-green-400">await</span> zenith.<span className="text-yellow-400">generate</span>({`{`}<br />
                  &nbsp;&nbsp;type: <span className="text-orange-400">"landing-page"</span>,<br />
                  &nbsp;&nbsp;industry: <span className="text-orange-400">"SaaS"</span>,<br />
                  &nbsp;&nbsp;tone: <span className="text-orange-400">"professional"</span><br />
                  {`}`});
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveDemo(null)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-semibold"
            >
              Close Demo
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Feature Showcase with Backend Integration */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Enterprise Features, Startup Speed
            </h2>
            <p className="text-xl text-gray-300">Every feature is live and battle-tested in production</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-8 h-8" />,
                title: 'Real-time Analytics',
                description: 'Track every metric with sub-50ms latency',
                demo: 'analytics',
                color: 'from-yellow-400 to-orange-400'
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: 'Bank-Grade Security',
                description: 'SOC2 compliant with end-to-end encryption',
                demo: 'security',
                color: 'from-green-400 to-emerald-400'
              },
              {
                icon: <Globe className="w-8 h-8" />,
                title: 'Global CDN',
                description: 'Deploy to 300+ edge locations instantly',
                demo: 'cdn',
                color: 'from-blue-400 to-cyan-400'
              }
            ].map((feature, i) => (
              <GlassCard key={i} delay={i * 0.1} className="group hover:scale-105 transition-transform cursor-pointer">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} p-0.5 mb-6`}>
                  <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 mb-4">{feature.description}</p>
                <button
                  onClick={() => setActiveDemo(feature.demo)}
                  className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
                >
                  See Live Demo <ArrowRight className="w-4 h-4" />
                </button>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Sandbox Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <GlassCard className="max-w-4xl mx-auto">
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-400 p-0.5">
                  <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
                    <Terminal className="w-10 h-10 text-cyan-400" />
                  </div>
                </div>
              </div>
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Try the Zenith Command Center
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Experience our AI-powered website analysis and optimization sandbox. 
                Analyze any website and get real-time recommendations with competitive insights.
              </p>
              <button
                onClick={() => setShowSandbox(true)}
                className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full font-semibold text-lg transition-all hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/25"
              >
                <span className="flex items-center gap-2">
                  <Terminal className="w-5 h-5" />
                  Launch Command Center
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              </button>
              <p className="text-sm text-gray-400 mt-4">
                No signup required • Analyze any website • Real competitive insights
              </p>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">10,000+</span> developers
              </h2>
              <div className="space-y-6">
                {[
                  { name: 'Sarah Chen', role: 'CTO at TechStart', comment: 'Cut our deployment time by 90%' },
                  { name: 'Marcus Johnson', role: 'Lead Dev at Scale', comment: 'Best developer experience ever' },
                  { name: 'Elena Rodriguez', role: 'Founder of NextGen', comment: 'Our secret weapon for rapid scaling' }
                ].map((testimonial, i) => (
                  <GlassCard key={i} delay={i * 0.1} className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center font-bold">
                        {testimonial.name[0]}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-gray-300 mb-2">&ldquo;{testimonial.comment}&rdquo;</p>
                      <p className="text-sm text-gray-500">
                        <span className="font-semibold">{testimonial.name}</span> • {testimonial.role}
                      </p>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>

            <div className="relative">
              <GlassCard className="text-center">
                <TrendingUp className="w-16 h-16 text-green-400 mx-auto mb-6" />
                <h3 className="text-3xl font-bold mb-4">See Your Growth Potential</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">API Requests</span>
                    <span className="text-2xl font-bold text-green-400">+847%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">User Engagement</span>
                    <span className="text-2xl font-bold text-blue-400">+523%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Time to Market</span>
                    <span className="text-2xl font-bold text-purple-400">-90%</span>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <GlassCard>
            <h2 className="text-5xl font-bold mb-6">
              Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">10x</span> Your Development?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of developers building the future with Zenith
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signin"
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-semibold text-lg hover:scale-105 transition-transform"
              >
                Start Building Now
              </Link>
              <button className="px-8 py-4 backdrop-blur-xl bg-white/10 border border-white/20 rounded-full font-semibold text-lg hover:bg-white/20 transition-all">
                Schedule Demo
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-6">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </GlassCard>
        </div>
      </section>

      {/* VisionSandbox Component */}
      <VisionSandbox isOpen={showSandbox} onClose={() => setShowSandbox(false)} />

      {/* Website Health Analyzer Component */}
      <WebsiteHealthAnalyzer 
        isOpen={showHealthAnalyzer} 
        onClose={() => setShowHealthAnalyzer(false)}
        initialUrl={selectedUrl}
      />

      {/* Footer with Privacy Links */}
      <footer className="relative z-10 border-t border-white/10 backdrop-blur-xl bg-black/50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Zenith Platform
              </h3>
              <p className="text-sm text-gray-400">
                AI-powered development platform for modern applications
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/api" className="hover:text-white transition-colors">API Reference</Link></li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                <li>
                  <a 
                    href="https://policies.google.com/privacy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center gap-1"
                  >
                    Google Privacy Policy
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/support" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/status" className="hover:text-white transition-colors">System Status</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Zenith Platform. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {/* Social Links */}
              <a href="https://www.facebook.com/profile.php?id=61577864960648" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="https://x.com/ZenithSaaS" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://github.com/zenithplatform" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
              </a>
              <a href="https://www.linkedin.com/in/phillip-mcgurk/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Compliance Note */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              This site uses Google services and is subject to the{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-300">
                Google Privacy Policy
              </a>
              {' '}and{' '}
              <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-300">
                Terms of Service
              </a>.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
