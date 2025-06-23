'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { SubscriptionLimits, SubscriptionPlan, SUBSCRIPTION_PLANS, getPlanById } from '@/lib/subscription-plans';

interface SubscriptionStatus {
  plan: string;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  usage: Record<string, { current: number; limit: number | boolean; percentage?: number }>;
  nextBillingDate?: string;
  trialEndsAt?: string;
}

interface UpgradeModalState {
  isOpen: boolean;
  feature?: keyof SubscriptionLimits;
  message?: string;
  targetPlan?: string;
}

export function useSubscription(teamId?: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [upgradeModal, setUpgradeModal] = useState<UpgradeModalState>({ isOpen: false });

  // Get subscription status
  const {
    data: subscription,
    isLoading,
    error,
  } = useQuery<SubscriptionStatus>({
    queryKey: ['subscription', teamId],
    queryFn: async () => {
      const endpoint = teamId 
        ? `/api/team/${teamId}/subscription` 
        : '/api/user/subscription';
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }
      return response.json();
    },
    enabled: !!session?.user,
  });

  // Check feature access
  const checkFeatureAccess = async (feature: keyof SubscriptionLimits): Promise<boolean> => {
    if (!session?.user) return false;
    
    try {
      const endpoint = teamId 
        ? `/api/team/${teamId}/subscription/check-feature`
        : '/api/user/subscription/check-feature';
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature }),
      });
      
      const result = await response.json();
      
      if (!result.allowed && result.upgradeRequired) {
        setUpgradeModal({
          isOpen: true,
          feature,
          message: result.message,
          targetPlan: getRecommendedPlan(feature),
        });
        return false;
      }
      
      return result.allowed;
    } catch (error) {
      console.error('Failed to check feature access:', error);
      return false;
    }
  };

  // Check usage limits
  const checkUsageLimit = async (feature: keyof SubscriptionLimits): Promise<boolean> => {
    if (!session?.user) return false;
    
    try {
      const endpoint = teamId 
        ? `/api/team/${teamId}/subscription/check-usage`
        : '/api/user/subscription/check-usage';
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature }),
      });
      
      const result = await response.json();
      
      if (!result.allowed && result.upgradeRequired) {
        setUpgradeModal({
          isOpen: true,
          feature,
          message: result.message,
          targetPlan: getRecommendedPlan(feature),
        });
        return false;
      }
      
      return result.allowed;
    } catch (error) {
      console.error('Failed to check usage limit:', error);
      return false;
    }
  };

  // Create checkout session for upgrade
  const createCheckoutMutation = useMutation({
    mutationFn: async ({ priceId, planId }: { priceId: string; planId: string }) => {
      const endpoint = teamId 
        ? `/api/team/${teamId}/billing/create-checkout`
        : '/api/user/billing/create-checkout';
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, planId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      if (typeof window !== 'undefined' && data.sessionId) {
        const stripe = (window as any).Stripe?.(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
        if (stripe) {
          stripe.redirectToCheckout({ sessionId: data.sessionId });
        } else {
          // Fallback: redirect to Stripe Checkout URL
          window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
        }
      }
    },
    onError: (error) => {
      toast.error('Failed to start upgrade process');
      console.error('Checkout error:', error);
    },
  });

  // Upgrade to specific plan
  const upgradeToPlan = (planId: string) => {
    const plan = getPlanById(planId);
    if (!plan || !plan.stripePriceId) {
      toast.error('Invalid plan selected');
      return;
    }

    createCheckoutMutation.mutate({
      priceId: plan.stripePriceId,
      planId: plan.id,
    });
  };

  // Close upgrade modal
  const closeUpgradeModal = () => {
    setUpgradeModal({ isOpen: false });
  };

  // Get current plan details
  const currentPlan = subscription ? getPlanById(subscription.plan) : null;

  // Check if user has specific feature
  const hasFeature = (feature: keyof SubscriptionLimits): boolean => {
    if (!currentPlan) return false;
    const limit = currentPlan.limits[feature];
    return typeof limit === 'boolean' ? limit : limit > 0 || limit === -1;
  };

  // Get usage percentage for a feature
  const getUsagePercentage = (feature: keyof SubscriptionLimits): number => {
    if (!subscription?.usage[feature]) return 0;
    return subscription.usage[feature].percentage || 0;
  };

  // Check if near limit (>80%)
  const isNearLimit = (feature: keyof SubscriptionLimits): boolean => {
    return getUsagePercentage(feature) > 80;
  };

  // Get recommended plan for a feature
  const getRecommendedPlan = (feature: keyof SubscriptionLimits): string => {
    const currentPlanId = subscription?.plan || 'free';
    const planOrder = ['free', 'starter', 'professional', 'enterprise'];
    const currentIndex = planOrder.indexOf(currentPlanId);
    
    // Find the next plan that has the feature
    for (let i = currentIndex + 1; i < planOrder.length; i++) {
      const plan = getPlanById(planOrder[i]);
      if (plan && plan.limits[feature]) {
        return plan.id;
      }
    }
    
    return 'professional'; // Default fallback
  };

  return {
    // Data
    subscription,
    currentPlan,
    availablePlans: SUBSCRIPTION_PLANS,
    isLoading,
    error,
    
    // Feature checking
    checkFeatureAccess,
    checkUsageLimit,
    hasFeature,
    
    // Usage tracking
    getUsagePercentage,
    isNearLimit,
    
    // Upgrade flow
    upgradeToPlan,
    upgradeModal,
    closeUpgradeModal,
    isUpgrading: createCheckoutMutation.isPending,
    
    // Utilities
    getRecommendedPlan,
  };
}

// Hook for requiring feature access with automatic upgrade prompts
export function useFeatureGuard() {
  const subscription = useSubscription();
  
  const requireFeature = async (feature: keyof SubscriptionLimits): Promise<boolean> => {
    const hasAccess = await subscription.checkFeatureAccess(feature);
    return hasAccess;
  };
  
  const requireUsage = async (feature: keyof SubscriptionLimits): Promise<boolean> => {
    const withinLimit = await subscription.checkUsageLimit(feature);
    return withinLimit;
  };
  
  return {
    requireFeature,
    requireUsage,
    ...subscription,
  };
}