'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown,
  X,
  Zap,
  BarChart3,
  Users,
  Shield,
  TrendingUp,
  Clock,
  Target,
  Award,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface UpgradePromptProps {
  trigger: 'feature_limit' | 'competitor_analysis' | 'advanced_metrics' | 'support' | 'milestone';
  context?: string;
  onUpgrade?: () => void;
  onDismiss?: () => void;
}

interface PricingPlan {
  name: string;
  price: number;
  originalPrice?: number;
  features: string[];
  highlight?: boolean;
  badge?: string;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Free',
    price: 0,
    features: [
      'Basic website health analysis',
      'SEO performance score',
      'Site speed metrics',
      'Security basic check',
      'Monthly reports'
    ]
  },
  {
    name: 'Pro',
    price: 29,
    originalPrice: 59,
    features: [
      'Everything in Free',
      'Competitor analysis',
      'Weekly automated reports',
      'Advanced SEO insights',
      'Mobile optimization tracking',
      'Priority support',
      'API access'
    ],
    highlight: true,
    badge: '50% OFF'
  },
  {
    name: 'Enterprise',
    price: 99,
    features: [
      'Everything in Pro',
      'White-label reports',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee',
      'Custom analytics',
      'Team collaboration tools'
    ]
  }
];

const UPGRADE_CONTEXTS = {
  feature_limit: {
    title: 'Unlock More Insights',
    subtitle: 'You&apos;ve reached your free analysis limit',
    icon: <BarChart3 className="w-6 h-6" />,
    benefits: [
      'Unlimited website analyses',
      'Competitor comparison reports',
      'Advanced SEO recommendations',
      'Weekly progress tracking'
    ]
  },
  competitor_analysis: {
    title: 'See How You Stack Up',
    subtitle: 'Discover what your competitors are doing better',
    icon: <Target className="w-6 h-6" />,
    benefits: [
      'Identify competitor keyword gaps',
      'Benchmark against top performers',
      'Steal winning strategies',
      'Track competitive changes'
    ]
  },
  advanced_metrics: {
    title: 'Get Deeper Insights',
    subtitle: 'Unlock advanced analytics and tracking',
    icon: <TrendingUp className="w-6 h-6" />,
    benefits: [
      'Conversion rate optimization',
      'User experience metrics',
      'Core web vitals tracking',
      'Historical trend analysis'
    ]
  },
  support: {
    title: 'Get Expert Help',
    subtitle: 'Priority support for faster resolution',
    icon: <Users className="w-6 h-6" />,
    benefits: [
      '24/7 priority support',
      'Expert optimization advice',
      'Custom implementation help',
      'Dedicated success manager'
    ]
  },
  milestone: {
    title: 'Celebrate Your Progress!',
    subtitle: 'You\'ve improved your score - keep the momentum going',
    icon: <Award className="w-6 h-6" />,
    benefits: [
      'Advanced progress tracking',
      'Goal setting and milestones',
      'Automated improvement suggestions',
      'Performance celebration rewards'
    ]
  }
};

export function FeatureLimitPrompt({ onUpgrade, onDismiss }: Omit<UpgradePromptProps, 'trigger'>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 right-4 z-50 max-w-sm"
    >
      <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20 shadow-2xl">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Clock className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Limit Reached</h3>
                <p className="text-xs text-gray-400">Free analyses used up</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-sm text-gray-300 mb-4">
            Upgrade to continue analyzing websites and tracking improvements.
          </p>
          
          <div className="flex gap-2">
            <Button 
              onClick={onUpgrade}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm"
            >
              <Crown className="w-4 h-4 mr-1" />
              Upgrade
            </Button>
            <Button variant="outline" size="sm" onClick={onDismiss} className="text-xs">
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function InlineUpgradePrompt({ trigger, context, onUpgrade }: UpgradePromptProps) {
  const promptData = UPGRADE_CONTEXTS[trigger];

  return (
    <Card className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border-blue-500/20 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
            <div className="text-blue-400">
              {promptData.icon}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{promptData.title}</h3>
            <p className="text-gray-400 text-sm">{promptData.subtitle}</p>
          </div>
          <Badge className="ml-auto bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
            <Crown className="w-3 h-3 mr-1" />
            Pro
          </Badge>
        </div>

        {context && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
            <p className="text-blue-300 text-sm">{context}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {promptData.benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-gray-300 text-sm">{benefit}</span>
            </div>
          ))}
        </div>

        <Button 
          onClick={onUpgrade}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Upgrade to Pro - 50% Off
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

export function PricingModal({ isOpen, onClose, onUpgrade }: {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (plan: string) => void;
}) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Choose Your Plan</h2>
            <p className="text-gray-400">Unlock powerful insights and optimization tools</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRICING_PLANS.map((plan, index) => (
            <Card 
              key={plan.name} 
              className={`relative ${
                plan.highlight 
                  ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/50 shadow-xl scale-105' 
                  : 'bg-white/5 border-white/10'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1">
                    {plan.badge}
                  </Badge>
                </div>
              )}
              
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {plan.originalPrice && (
                      <span className="text-gray-400 line-through text-lg">${plan.originalPrice}</span>
                    )}
                    <span className="text-3xl font-bold text-white">${plan.price}</span>
                    <span className="text-gray-400">/month</span>
                  </div>
                  {plan.originalPrice && (
                    <p className="text-green-400 text-sm">Save ${plan.originalPrice - plan.price}/month</p>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={() => onUpgrade(plan.name.toLowerCase())}
                  className={`w-full ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                      : plan.price === 0
                        ? 'bg-gray-600 text-gray-300 cursor-default'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                  disabled={plan.price === 0}
                >
                  {plan.price === 0 ? 'Current Plan' : `Upgrade to ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>30-day money-back guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>24/7 support</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function MilestoneUpgradePrompt({ onUpgrade, onDismiss }: Omit<UpgradePromptProps, 'trigger'>) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 z-50 max-w-lg"
    >
      <Card className="bg-gradient-to-br from-green-600/20 to-blue-600/20 border-green-500/30 shadow-2xl">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Congratulations! 🎉</h2>
          <p className="text-gray-300 mb-6">
            You&apos;ve improved your website score! Keep the momentum going with Pro features.
          </p>

          <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">+12</div>
                <div className="text-gray-400">Points Gained</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">73/100</div>
                <div className="text-gray-400">New Score</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={onUpgrade}
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
            >
              <Crown className="w-4 h-4 mr-2" />
              Unlock More Growth
            </Button>
            <Button 
              variant="outline" 
              onClick={onDismiss}
              className="border-white/20 hover:border-white/40 text-white"
            >
              Maybe Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Hook for managing upgrade prompts
export function useUpgradePrompts() {
  const [activePrompts, setActivePrompts] = useState<string[]>([]);

  const showPrompt = (promptId: string) => {
    setActivePrompts(prev => [...prev, promptId]);
  };

  const hidePrompt = (promptId: string) => {
    setActivePrompts(prev => prev.filter(id => id !== promptId));
  };

  const hideAllPrompts = () => {
    setActivePrompts([]);
  };

  return {
    activePrompts,
    showPrompt,
    hidePrompt,
    hideAllPrompts
  };
}