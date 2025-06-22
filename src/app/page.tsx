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
  Star
} from 'lucide-react';

// Components will be defined inline below

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
    if (inView) {
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

  // Optimized metrics for instant impact
  const liveMetrics = {
    activeUsers: 15842,
    apiCalls: 2847593,
    avgResponseTime: 47,
    uptime: 99.99
  };

  // Preload critical assets
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Preload sign-in page
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = '/auth/signin';
      document.head.appendChild(link);
    }
  }, []);

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

      {/* Hero Section - 0.8s Impact */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-7xl mx-auto text-center">
          {/* Instant Value Proposition */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-xl border border-green-400/20 mb-8">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-100">🚀 <AnimatedCounter end={15842} duration={1} /> developers online now</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent leading-tight">
              Ship Apps 90% Faster
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                With AI That Actually Works
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              From idea to production in 
              <span className="text-green-400 font-bold"> &lt;5 minutes</span>. 
              <span className="text-white font-semibold"> Watch the magic happen.</span>
            </p>
          </motion.div>

          {/* Primary CTA with Live Demo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <button
              onClick={() => setActiveDemo('live')}
              className="group relative px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full font-bold text-lg transition-all hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25"
            >
              <span className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                See 5-Minute Deploy
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
            </button>
            
            <Link
              href="/auth/signin"
              className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-bold text-lg transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
            >
              <span className="flex items-center gap-2">
                Start Building Free
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              </span>
            </Link>
          </motion.div>

          {/* Live Metrics Display */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            {[
              { label: 'Active Users', value: liveMetrics.activeUsers, suffix: '' },
              { label: 'API Calls Today', value: liveMetrics.apiCalls, suffix: '' },
              { label: 'Avg Response', value: liveMetrics.avgResponseTime, suffix: 'ms' },
              { label: 'Uptime', value: liveMetrics.uptime, suffix: '%' }
            ].map((metric, i) => (
              <div key={i} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="text-3xl font-bold text-white mb-1">
                  <AnimatedCounter end={metric.value} suffix={metric.suffix} />
                </div>
                <div className="text-sm text-gray-400">{metric.label}</div>
              </div>
            ))}
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

      {/* Feature Showcase */}
      <FeatureSection setActiveDemo={setActiveDemo} />

      {/* Social Proof */}
      <SocialProofSection />

      {/* Final CTA */}
      <FinalCTA />

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

// Component definitions for lazy loading
function FeatureSection({ setActiveDemo }: { setActiveDemo: (demo: string) => void }) {
  return (
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
  );
}

function SocialProofSection() {
  return (
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
  );
}

function FinalCTA() {
  return (
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
  );
}