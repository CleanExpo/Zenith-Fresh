'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  Crown,
  Zap,
  Shield,
  Globe
} from 'lucide-react';

interface BillingDashboardProps {
  teamId: string;
}

interface SubscriptionUsage {
  plan: {
    id: string;
    name: string;
    price: number;
    interval: string;
    features: string[];
    limits: {
      websiteScans?: number;
      competitiveReports?: number;
      teamMembers?: number;
      apiCalls?: number;
    };
  };
  usage: {
    websiteScans: number;
    competitiveReports: number;
    teamMembers: number;
    apiCalls: number;
  };
  limits: {
    websiteScans?: number;
    competitiveReports?: number;
    teamMembers?: number;
    apiCalls?: number;
  };
  percentages: {
    websiteScans: number;
    competitiveReports: number;
    teamMembers: number;
  };
}

const PLAN_ICONS = {
  freemium: <Zap className="w-5 h-5 text-blue-500" />,
  premium: <Crown className="w-5 h-5 text-yellow-500" />,
  enterprise: <Shield className="w-5 h-5 text-purple-500" />
};

const PLAN_COLORS = {
  freemium: 'border-blue-200 bg-blue-50',
  premium: 'border-yellow-200 bg-yellow-50',
  enterprise: 'border-purple-200 bg-purple-50'
};

export function BillingDashboard({ teamId }: BillingDashboardProps) {
  const queryClient = useQueryClient();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const { data: subscription, isLoading } = useQuery<SubscriptionUsage>({
    queryKey: ['subscription', teamId],
    queryFn: async () => {
      const response = await fetch(`/api/team/${teamId}/billing/subscription`);
      if (!response.ok) throw new Error('Failed to fetch subscription');
      return response.json();
    }
  });

  const upgradeMutation = useMutation({
    mutationFn: async ({ action, priceId, subscriptionId }: any) => {
      const response = await fetch(`/api/team/${teamId}/billing/subscription`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, priceId, subscriptionId })
      });
      if (!response.ok) throw new Error('Failed to update subscription');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', teamId] });
      toast.success('Subscription updated successfully');
      setIsUpgrading(false);
    },
    onError: (error) => {
      toast.error('Failed to update subscription');
      setIsUpgrading(false);
    }
  });

  const openPortalMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/team/${teamId}/billing/portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnUrl: window.location.href })
      });
      if (!response.ok) throw new Error('Failed to create portal session');
      return response.json();
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: () => {
      toast.error('Failed to open billing portal');
    }
  });

  const handleUpgrade = async (targetPlan: string) => {
    setIsUpgrading(true);
    
    const priceIds = {
      premium: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
      enterprise: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID
    };

    if (subscription?.plan.id === 'freemium') {
      // Create new subscription
      upgradeMutation.mutate({
        action: 'create',
        priceId: priceIds[targetPlan as keyof typeof priceIds]
      });
    } else {
      // Update existing subscription
      upgradeMutation.mutate({
        action: 'update',
        priceId: priceIds[targetPlan as keyof typeof priceIds],
        subscriptionId: 'current' // Will be handled by the API
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading billing information...</div>
      </div>
    );
  }

  if (!subscription) return null;

  const isLimitReached = (usage: number, limit?: number) => {
    return limit !== undefined && limit !== -1 && usage >= limit;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <Card className={`${PLAN_COLORS[subscription.plan.id as keyof typeof PLAN_COLORS]}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {PLAN_ICONS[subscription.plan.id as keyof typeof PLAN_ICONS]}
              <div>
                <CardTitle className="text-xl">{subscription.plan.name} Plan</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {subscription.plan.price === 0 
                    ? 'Free forever' 
                    : `$${subscription.plan.price}/${subscription.plan.interval}`
                  }
                </p>
              </div>
            </div>
            {subscription.plan.id !== 'enterprise' && (
              <Button 
                onClick={() => handleUpgrade(subscription.plan.id === 'freemium' ? 'premium' : 'enterprise')}
                disabled={isUpgrading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isUpgrading ? 'Upgrading...' : 'Upgrade Plan'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Plan Features</h4>
              <ul className="space-y-1 text-sm">
                {subscription.plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Current Usage</h4>
              <div className="space-y-3">
                {/* Website Scans */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Website Scans (Daily)</span>
                    <span className={getUsageColor(subscription.percentages.websiteScans)}>
                      {subscription.usage.websiteScans}
                      {subscription.limits.websiteScans === -1 ? '' : `/${subscription.limits.websiteScans}`}
                    </span>
                  </div>
                  {subscription.limits.websiteScans !== -1 && (
                    <Progress 
                      value={subscription.percentages.websiteScans} 
                      className="h-2"
                    />
                  )}
                  {isLimitReached(subscription.usage.websiteScans, subscription.limits.websiteScans) && (
                    <p className="text-xs text-red-600 mt-1">Daily limit reached</p>
                  )}
                </div>

                {/* Competitive Reports */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Competitive Reports (Monthly)</span>
                    <span className={getUsageColor(subscription.percentages.competitiveReports)}>
                      {subscription.usage.competitiveReports}
                      {subscription.limits.competitiveReports === -1 ? '' : `/${subscription.limits.competitiveReports}`}
                    </span>
                  </div>
                  {subscription.limits.competitiveReports !== -1 && (
                    <Progress 
                      value={subscription.percentages.competitiveReports} 
                      className="h-2"
                    />
                  )}
                </div>

                {/* Team Members */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Team Members</span>
                    <span className={getUsageColor(subscription.percentages.teamMembers)}>
                      {subscription.usage.teamMembers}
                      {subscription.limits.teamMembers === -1 ? '' : `/${subscription.limits.teamMembers}`}
                    </span>
                  </div>
                  {subscription.limits.teamMembers !== -1 && (
                    <Progress 
                      value={subscription.percentages.teamMembers} 
                      className="h-2"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Warnings */}
      {(subscription.percentages.websiteScans > 80 || 
        subscription.percentages.competitiveReports > 80 || 
        subscription.percentages.teamMembers > 80) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-orange-800">Usage Warning</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 mb-4">
              You&apos;re approaching your plan limits. Consider upgrading to avoid service interruption.
            </p>
            <Button 
              onClick={() => handleUpgrade('premium')}
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              Upgrade Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plan Comparison for Freemium Users */}
      {subscription.plan.id === 'freemium' && (
        <Card>
          <CardHeader>
            <CardTitle>Unlock More with Premium</CardTitle>
            <p className="text-muted-foreground">
              Get advanced features and higher limits to grow your business
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Premium Plan */}
              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-semibold">Premium Plan</h3>
                </div>
                <div className="text-2xl font-bold mb-2">$79/month</div>
                <ul className="space-y-2 text-sm mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    100 daily website scans
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    10 competitive reports/month
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Priority support
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    API access
                  </li>
                </ul>
                <Button 
                  onClick={() => handleUpgrade('premium')}
                  disabled={isUpgrading}
                  className="w-full"
                >
                  Start 14-day Free Trial
                </Button>
              </div>

              {/* Enterprise Plan */}
              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-purple-500" />
                  <h3 className="font-semibold">Enterprise Plan</h3>
                </div>
                <div className="text-2xl font-bold mb-2">$199/month</div>
                <ul className="space-y-2 text-sm mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Unlimited scans & reports
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    White-label reports
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Custom integrations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Dedicated support
                  </li>
                </ul>
                <Button 
                  onClick={() => handleUpgrade('enterprise')}
                  disabled={isUpgrading}
                  variant="outline"
                  className="w-full"
                >
                  Contact Sales
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Management */}
      {subscription.plan.id !== 'freemium' && (
        <Card>
          <CardHeader>
            <CardTitle>Billing Management</CardTitle>
            <p className="text-muted-foreground">
              Manage your subscription, payment methods, and billing history
            </p>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => openPortalMutation.mutate()}
              disabled={openPortalMutation.isPending}
              variant="outline"
              className="flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              {openPortalMutation.isPending ? 'Opening...' : 'Manage Billing'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}