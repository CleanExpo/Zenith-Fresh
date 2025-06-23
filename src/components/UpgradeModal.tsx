'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Check, X, Zap, Crown, Building2 } from 'lucide-react';
import { SubscriptionPlan, SUBSCRIPTION_PLANS } from '@/lib/subscription-plans';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (planId: string) => void;
  isUpgrading?: boolean;
  feature?: string;
  message?: string;
  targetPlan?: string;
  currentPlan?: string;
}

export function UpgradeModal({
  isOpen,
  onClose,
  onUpgrade,
  isUpgrading = false,
  feature,
  message,
  targetPlan,
  currentPlan = 'free',
}: UpgradeModalProps) {
  
  const getRecommendedPlans = () => {
    if (targetPlan) {
      const target = SUBSCRIPTION_PLANS.find(p => p.id === targetPlan);
      if (target) return [target];
    }
    
    // Show plans above current plan
    const currentIndex = SUBSCRIPTION_PLANS.findIndex(p => p.id === currentPlan);
    return SUBSCRIPTION_PLANS.slice(currentIndex + 1);
  };

  const recommendedPlans = getRecommendedPlans();

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter':
        return <Zap className="w-5 h-5" />;
      case 'professional':
        return <Crown className="w-5 h-5" />;
      case 'enterprise':
        return <Building2 className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'starter':
        return 'from-blue-500 to-cyan-500';
      case 'professional':
        return 'from-purple-500 to-pink-500';
      case 'enterprise':
        return 'from-orange-500 to-red-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            {message || `Unlock ${feature || 'this feature'} with a higher plan`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {recommendedPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-6 transition-all duration-200 hover:shadow-lg ${
                plan.popular 
                  ? 'border-blue-500 shadow-blue-500/20 shadow-lg scale-105' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                </div>
              )}
              
              {plan.enterprise && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    Enterprise
                  </Badge>
                </div>
              )}

              <div className="text-center mb-6">
                <div className={`w-12 h-12 mx-auto mb-4 rounded-lg bg-gradient-to-r ${getPlanColor(plan.id)} flex items-center justify-center text-white`}>
                  {getPlanIcon(plan.id)}
                </div>
                
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                
                <div className="text-center">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-gray-500">/{plan.interval}</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {plan.features.slice(0, 6).map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    {feature.included ? (
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${feature.included ? 'text-gray-900' : 'text-gray-500'}`}>
                      {feature.name}
                      {feature.limit && feature.included && (
                        <span className="text-gray-600"> ({feature.limit})</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => onUpgrade(plan.id)}
                disabled={isUpgrading}
                className={`w-full ${
                  plan.popular
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : plan.enterprise
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                    : 'bg-gray-800 hover:bg-gray-900'
                }`}
              >
                {isUpgrading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Upgrading...
                  </div>
                ) : (
                  `Upgrade to ${plan.name}`
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* Feature comparison table for enterprise plans */}
        {recommendedPlans.some(p => p.enterprise) && (
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-4 text-center">Need something custom?</h4>
            <p className="text-gray-600 text-center mb-4">
              Enterprise plans include white-label solutions, custom integrations, and dedicated support.
            </p>
            <div className="text-center">
              <Button variant="outline" onClick={onClose}>
                Contact Sales
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={onClose}>
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}