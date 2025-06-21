'use client';

import { motion } from 'framer-motion';
import { 
  Zap, 
  Shield, 
  Globe, 
  TrendingUp, 
  Users, 
  Code2, 
  Database, 
  Cpu, 
  Cloud, 
  Lock, 
  BarChart3, 
  Rocket,
  ArrowRight,
  Check,
  Sparkles,
  Bot,
  Eye,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const FeaturesPage = () => {
  const featureCategories = [
    {
      title: 'AI-Powered Platform',
      description: 'Advanced AI capabilities that transform how you build and scale',
      icon: <Bot className="w-8 h-8" />,
      color: 'from-purple-500 to-pink-500',
      features: [
        {
          icon: <Sparkles className="w-6 h-6" />,
          title: 'Intelligent Automation',
          description: 'AI agents that handle complex workflows automatically',
          benefits: ['Reduce manual work by 90%', 'Smart decision making', 'Continuous optimization']
        },
        {
          icon: <Eye className="w-6 h-6" />,
          title: 'Real-time Insights',
          description: 'AI-powered analytics that predict trends and opportunities',
          benefits: ['Predictive analytics', 'Anomaly detection', 'Smart recommendations']
        },
        {
          icon: <Code2 className="w-6 h-6" />,
          title: 'Code Generation',
          description: 'Generate production-ready code from natural language',
          benefits: ['10x faster development', 'Best practices built-in', 'Multi-language support']
        }
      ]
    },
    {
      title: 'Enterprise Security',
      description: 'Bank-grade security with compliance built-in',
      icon: <Shield className="w-8 h-8" />,
      color: 'from-green-500 to-emerald-500',
      features: [
        {
          icon: <Lock className="w-6 h-6" />,
          title: 'End-to-End Encryption',
          description: 'AES-256 encryption for all data in transit and at rest',
          benefits: ['Zero-trust architecture', 'SOC2 Type II compliant', 'GDPR ready']
        },
        {
          icon: <Database className="w-6 h-6" />,
          title: 'Secure Data Handling',
          description: 'Advanced data protection with audit trails',
          benefits: ['Complete audit logs', 'Data residency control', 'Backup encryption']
        },
        {
          icon: <Users className="w-6 h-6" />,
          title: 'Access Management',
          description: 'Granular permissions and role-based access control',
          benefits: ['Multi-factor authentication', 'SSO integration', 'API key management']
        }
      ]
    },
    {
      title: 'Global Infrastructure',
      description: 'Worldwide deployment with edge computing capabilities',
      icon: <Globe className="w-8 h-8" />,
      color: 'from-blue-500 to-cyan-500',
      features: [
        {
          icon: <Cloud className="w-6 h-6" />,
          title: 'Edge Computing',
          description: 'Deploy to 300+ locations worldwide for ultra-low latency',
          benefits: ['<50ms response times', 'Auto-scaling', '99.99% uptime SLA']
        },
        {
          icon: <Cpu className="w-6 h-6" />,
          title: 'High Performance',
          description: 'Optimized infrastructure for maximum speed and reliability',
          benefits: ['CDN optimization', 'Load balancing', 'Geographic redundancy']
        },
        {
          icon: <BarChart3 className="w-6 h-6" />,
          title: 'Real-time Monitoring',
          description: 'Comprehensive monitoring and alerting across all regions',
          benefits: ['Performance metrics', 'Health checks', 'Incident response']
        }
      ]
    },
    {
      title: 'Developer Experience',
      description: 'Tools and APIs designed for developer productivity',
      icon: <Code2 className="w-8 h-8" />,
      color: 'from-orange-500 to-red-500',
      features: [
        {
          icon: <Layers className="w-6 h-6" />,
          title: 'REST & GraphQL APIs',
          description: 'Flexible APIs with comprehensive documentation',
          benefits: ['OpenAPI specification', 'SDK in 10+ languages', 'Webhook support']
        },
        {
          icon: <Rocket className="w-6 h-6" />,
          title: 'Developer Tools',
          description: 'CLI, SDKs, and integrations for your favorite tools',
          benefits: ['One-line deployment', 'IDE extensions', 'Git integration']
        },
        {
          icon: <TrendingUp className="w-6 h-6" />,
          title: 'Analytics & Insights',
          description: 'Deep analytics to understand usage and optimize performance',
          benefits: ['Usage analytics', 'Performance insights', 'Cost optimization']
        }
      ]
    }
  ];

  const integrations = [
    { name: 'GitHub', logo: '📦' },
    { name: 'Slack', logo: '💬' },
    { name: 'Discord', logo: '🎮' },
    { name: 'Stripe', logo: '💳' },
    { name: 'AWS', logo: '☁️' },
    { name: 'Google Cloud', logo: '🌐' },
    { name: 'Azure', logo: '🔷' },
    { name: 'Docker', logo: '🐳' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Hero Section */}
      <div className="relative pt-20 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
              Everything You Need to Build at Scale
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              From AI-powered automation to enterprise-grade security, 
              our platform provides all the tools you need to build, deploy, and scale your applications.
            </p>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105 transition-transform text-lg px-8 py-4">
              Start Building Today
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Feature Categories */}
      <div className="relative px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          {featureCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
              className="mb-20"
            >
              {/* Category Header */}
              <div className="text-center mb-12">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${category.color} p-0.5 mx-auto mb-6`}>
                  <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center text-white">
                    {category.icon}
                  </div>
                </div>
                <h2 className="text-4xl font-bold text-white mb-4">{category.title}</h2>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">{category.description}</p>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-3 gap-8">
                {category.features.map((feature, featureIndex) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: featureIndex * 0.1 }}
                  >
                    <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 h-full hover:bg-white/10 transition-all">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${category.color} p-0.5 mb-6`}>
                        <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center text-white">
                          {feature.icon}
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                      <p className="text-gray-300 mb-6">{feature.description}</p>
                      <div className="space-y-3">
                        {feature.benefits.map((benefit, benefitIndex) => (
                          <div key={benefitIndex} className="flex items-center gap-3">
                            <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                            <span className="text-gray-300">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Integrations Section */}
      <div className="relative px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Seamless Integrations</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Connect with your favorite tools and services with just a few clicks
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
            {integrations.map((integration, index) => (
              <motion.div
                key={integration.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all"
              >
                <div className="text-4xl mb-3">{integration.logo}</div>
                <div className="text-sm text-gray-300 font-medium">{integration.name}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="relative px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12"
          >
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">Built for Performance</h2>
              <p className="text-xl text-gray-300">
                Our platform delivers enterprise-grade performance at scale
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { metric: '99.99%', label: 'Uptime SLA', icon: <Shield className="w-8 h-8" /> },
                { metric: '<50ms', label: 'Response Time', icon: <Zap className="w-8 h-8" /> },
                { metric: '300+', label: 'Global Locations', icon: <Globe className="w-8 h-8" /> },
                { metric: '10M+', label: 'API Calls/Day', icon: <TrendingUp className="w-8 h-8" /> }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 p-0.5 mx-auto mb-4">
                    <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center text-white">
                      {stat.icon}
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">{stat.metric}</div>
                  <div className="text-gray-300">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 text-center"
          >
            <Rocket className="w-16 h-16 text-purple-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Experience the Future?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of developers who are already building the next generation 
              of applications with our platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105 transition-transform">
                <span className="flex items-center gap-2">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </span>
              </Button>
              <Button className="backdrop-blur-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-300">
                Schedule Demo
              </Button>
            </div>
            <p className="text-sm text-gray-400 mt-6">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;
