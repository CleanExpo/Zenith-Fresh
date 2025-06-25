/**
 * Billing Page
 * Main billing dashboard with subscription management
 */

'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BillingDashboard } from '@/components/billing/BillingDashboard';
import { UpgradePlans } from '@/components/billing/UpgradePlans';
import { UsageAnalytics } from '@/components/billing/UsageAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  BarChart3, 
  TrendingUp, 
  Shield,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';

export default function BillingPage() {
  const { data: session } = useSession();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  // Get team ID from session or URL
  const teamId = 'current'; // This would come from your team context

  const { data: currentSubscription } = useQuery({
    queryKey: ['subscription', teamId],
    queryFn: async () => {
      const response = await fetch('/api/billing/subscription');
      if (!response.ok) throw new Error('Failed to fetch subscription');
      return response.json();
    },
    enabled: !!session,
  });

  const handlePlanSelection = async (planId: string, stripePriceId: string | null) => {
    if (!stripePriceId) {
      // Free plan or no payment required
      return;
    }

    setSelectedPlan(planId);
    setUpgradeLoading(true);

    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          stripePriceId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const data = await response.json();
      
      if (data.clientSecret) {
        // Handle payment with Stripe (if needed)
        // This would typically redirect to Stripe Checkout or use Stripe Elements
        window.location.href = `/billing/checkout?session_id=${data.clientSecret}`;
      } else {
        // Trial or free subscription created
        window.location.reload();
      }
    } catch (error) {
      console.error('Error selecting plan:', error);
      alert('Failed to select plan. Please try again.');
    } finally {
      setUpgradeLoading(false);
      setSelectedPlan(null);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Please sign in to access billing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Billing & Subscription</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage your subscription, monitor usage, and access premium features
          </p>
        </div>

        {/* Current Plan Alert */}
        {currentSubscription?.subscription?.status === 'trialing' && (
          <Alert className="border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              You're currently on a free trial. Your trial ends on{' '}
              {new Date(currentSubscription.subscription.trialEnd).toLocaleDateString()}.
            </AlertDescription>
          </Alert>
        )}

        {currentSubscription?.subscription?.status === 'past_due' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your payment is past due. Please update your payment method to continue using our services.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Usage
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Plans
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <BillingDashboard teamId={teamId} />
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage">
            <UsageAnalytics teamId={teamId} />
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Choose Your Plan</h2>
                <p className="text-gray-600">
                  Upgrade to unlock premium features and higher usage limits
                </p>
              </div>
              
              <UpgradePlans
                currentPlan={currentSubscription?.plan?.id}
                onSelectPlan={handlePlanSelection}
                loading={upgradeLoading}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Feature Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Why Upgrade?</CardTitle>
            <CardDescription>
              Unlock powerful features to grow your business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-3">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold">Advanced AI Analysis</h3>
                <p className="text-sm text-gray-600">
                  Get deeper insights with GPT-4 powered analysis and recommendations
                </p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold">Unlimited Usage</h3>
                <p className="text-sm text-gray-600">
                  Remove usage limits and scale your operations without restrictions
                </p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold">Priority Support</h3>
                <p className="text-sm text-gray-600">
                  Get priority support with faster response times and dedicated assistance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Can I change my plan anytime?</h4>
                <p className="text-gray-600">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately 
                  and you'll be prorated accordingly.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">What happens if I exceed my usage limits?</h4>
                <p className="text-gray-600">
                  For API calls and storage, you'll be charged for overage usage. Team member limits 
                  will prevent adding new members until you upgrade.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Is there a free trial?</h4>
                <p className="text-gray-600">
                  Yes! All paid plans come with a 14-day free trial. No credit card required to start.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Can I cancel anytime?</h4>
                <p className="text-gray-600">
                  Absolutely. You can cancel your subscription at any time. You'll retain access 
                  until the end of your current billing period.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}