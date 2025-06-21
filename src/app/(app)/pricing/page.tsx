'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Check, 
  Zap, 
  Star, 
  Crown, 
  Rocket,
  Shield,
  Users,
  Globe,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const plans = [
    {
      name: 'Starter',
      icon: <Zap className="w-6 h-6" />,
      description: 'Perfect for individuals and small projects',
      monthlyPrice: 29,
      annualPrice: 290,
      features: [
        '5 Projects',
        '10,000 API Calls/month',
        'Basic Analytics',
        'Email Support',
        'Standard Templates',
        '1 Team Member',
        'Basic Integrations'
      ],
      cta: 'Start Free Trial',
      popular: false,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Professional',
      icon: <Star className="w-6 h-6" />,
      description: 'Ideal for growing businesses and teams',
      monthlyPrice: 99,
      annualPrice: 990,
      features: [
        'Unlimited Projects',
        '100,000 API Calls/month',
        'Advanced Analytics',
        'Priority Support',
        'Premium Templates',
        '10 Team Members',
        'All Integrations',
        'Custom Workflows',
        'Real-time Collaboration'
      ],
      cta: 'Start Free Trial',
      popular: true,
      color: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Enterprise',
      icon: <Crown className="w-6 h-6" />,
      description: 'For large organizations with custom needs',
      monthlyPrice: 299,
      annualPrice: 2990,
      features: [
        'Unlimited Everything',
        'Custom API Limits',
        'Dedicated Support',
        'White-label Solution',
        'Custom Integrations',
        'Unlimited Team Members',
        'Advanced Security',
        'SLA Guarantee',
        'Custom Training',
        'Priority Feature Requests'
      ],
      cta: 'Contact Sales',
      popular: false,
      color: 'from-amber-500 to-orange-500'
    }
  ];

  const handleSubscribe = async (planName: string) => {
    setLoading(planName);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(null);
    // Redirect to checkout or show success
  };

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
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Choose the perfect plan for your needs. All plans include our core features 
              with no hidden fees or surprise charges.
            </p>
          </motion.div>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center mb-12"
          >
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-full p-1 flex items-center">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-3 rounded-full font-medium transition-all relative ${
                  billingCycle === 'annual'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Annual
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-green-400 to-blue-400 text-xs px-2 py-1 rounded-full text-black font-bold">
                  Save 20%
                </span>
              </button>
            </div>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-400 mb-16"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span>30-day money-back guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>No setup fees</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-400" />
              <span>Cancel anytime</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="relative px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Most Popular
                    </div>
                  </div>
                )}
                
                <Card className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden ${
                  plan.popular ? 'ring-2 ring-purple-500/50 transform scale-105' : ''
                }`}>
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${plan.color} opacity-5`} />
                  
                  <div className="relative">
                    {/* Plan Header */}
                    <div className="text-center mb-8">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${plan.color} p-0.5 mx-auto mb-4`}>
                        <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center text-white">
                          {plan.icon}
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                      <p className="text-gray-400 text-sm">{plan.description}</p>
                    </div>

                    {/* Pricing */}
                    <div className="text-center mb-8">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold text-white">
                          ${billingCycle === 'monthly' ? plan.monthlyPrice : Math.floor(plan.annualPrice / 12)}
                        </span>
                        <span className="text-gray-400">
                          /{billingCycle === 'monthly' ? 'month' : 'month'}
                        </span>
                      </div>
                      {billingCycle === 'annual' && (
                        <div className="text-sm text-gray-400 mt-2">
                          Billed annually (${plan.annualPrice})
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-8">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <Button
                      onClick={() => handleSubscribe(plan.name)}
                      disabled={loading === plan.name}
                      className={`w-full h-12 rounded-2xl font-semibold text-lg transition-all ${
                        plan.popular
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105'
                          : `bg-gradient-to-r ${plan.color} hover:scale-105`
                      } ${loading === plan.name ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {loading === plan.name ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        <span className="flex items-center gap-2">
                          {plan.cta}
                          <ArrowRight className="w-5 h-5" />
                        </span>
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Enterprise CTA */}
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
              Need Something Custom?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              We work with enterprise teams to create custom solutions that scale 
              with your business needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105 transition-transform">
                Schedule a Demo
              </Button>
              <Button className="backdrop-blur-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-300">
                Contact Sales
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="relative px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                question: "Can I change plans anytime?",
                answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and we'll prorate any billing differences."
              },
              {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards, PayPal, and bank transfers for annual plans. All payments are processed securely through Stripe."
              },
              {
                question: "Is there a free trial?",
                answer: "Yes! All paid plans come with a 14-day free trial. No credit card required to start."
              },
              {
                question: "What happens if I exceed my API limits?",
                answer: "We'll notify you when you're approaching your limits. You can upgrade your plan or purchase additional API calls as needed."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-3">{faq.question}</h3>
                <p className="text-gray-300">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
