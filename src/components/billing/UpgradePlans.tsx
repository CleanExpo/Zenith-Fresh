/**
 * Upgrade Plans Component
 * Shows pricing plans with feature comparison
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Check, 
  Crown, 
  Shield, 
  Zap, 
  Star,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  limits: Record<string, number>;
  stripePriceId: string | null;
  isPopular: boolean;
}

interface UpgradePlansProps {
  currentPlan?: string;
  onSelectPlan: (planId: string, stripePriceId: string | null) => void;
  loading?: boolean;
}

export function UpgradePlans({ currentPlan = 'free', onSelectPlan, loading = false }: UpgradePlansProps) {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [isYearly, setIsYearly] = useState(false);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/billing/plans');
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setPlansLoading(false);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free':
        return <Zap className="h-6 w-6 text-blue-500" />;
      case 'pro':
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 'enterprise':
        return <Shield className="h-6 w-6 text-purple-500" />;
      default:
        return <Star className="h-6 w-6 text-gray-500" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'free':
        return 'border-blue-200 hover:border-blue-300';
      case 'pro':
        return 'border-yellow-200 hover:border-yellow-300 ring-2 ring-yellow-200';
      case 'enterprise':
        return 'border-purple-200 hover:border-purple-300';
      default:
        return 'border-gray-200 hover:border-gray-300';
    }
  };

  const formatPrice = (price: number, interval: string) => {
    const yearlyPrice = price * 10; // 2 months free
    const displayPrice = isYearly ? yearlyPrice : price;
    return {
      price: displayPrice,
      period: isYearly ? 'year' : interval,
      savings: isYearly ? price * 2 : 0,
    };
  };

  const formatLimit = (value: number) => {
    if (value === -1) return 'Unlimited';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  if (plansLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-96 bg-gray-200 animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Billing Toggle */}
      <div className="flex items-center justify-center space-x-4">
        <span className={`text-sm font-medium ${!isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
          Monthly
        </span>
        <Switch
          checked={isYearly}
          onCheckedChange={setIsYearly}
          className="data-[state=checked]:bg-green-500"
        />
        <span className={`text-sm font-medium ${isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
          Yearly
        </span>
        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
          Save 20%
        </Badge>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const pricing = formatPrice(plan.price, plan.interval);
          const isCurrentPlan = plan.id === currentPlan;
          const isPopular = plan.isPopular || plan.id === 'pro';

          return (
            <Card 
              key={plan.id} 
              className={`relative ${getPlanColor(plan.id)} transition-all duration-200 hover:shadow-lg ${
                isPopular ? 'scale-105' : ''
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 border-0">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-3">
                  {getPlanIcon(plan.id)}
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  {plan.description}
                </CardDescription>
                
                <div className="mt-4">
                  {plan.price === 0 ? (
                    <div className="text-4xl font-bold">Free</div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-4xl font-bold">
                        ${pricing.price}
                        <span className="text-lg font-normal text-gray-500">/{pricing.period}</span>
                      </div>
                      {isYearly && pricing.savings > 0 && (
                        <div className="text-sm text-green-600 font-medium">
                          Save ${pricing.savings}/year
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features List */}
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Usage Limits */}
                {Object.keys(plan.limits).length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Usage Limits</h4>
                    <div className="space-y-2">
                      {Object.entries(plan.limits).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </span>
                          <span className="font-medium text-gray-900">
                            {formatLimit(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <Button
                  onClick={() => onSelectPlan(plan.id, plan.stripePriceId)}
                  disabled={loading || isCurrentPlan}
                  className={`w-full ${
                    isCurrentPlan 
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                      : isPopular
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                  }`}
                  variant={isCurrentPlan ? 'secondary' : 'default'}
                >
                  {loading ? (
                    'Processing...'
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : plan.price === 0 ? (
                    'Get Started Free'
                  ) : (
                    <>
                      Start Free Trial
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                {/* Trial Info */}
                {plan.price > 0 && !isCurrentPlan && (
                  <p className="text-xs text-gray-500 text-center">
                    14-day free trial • No credit card required
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Enterprise Contact */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
        <CardContent className="text-center py-8">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Need a custom solution?</h3>
          <p className="text-gray-600 mb-4">
            Get in touch for enterprise pricing, custom features, and dedicated support.
          </p>
          <Button variant="outline" className="border-gray-300">
            Contact Sales
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}