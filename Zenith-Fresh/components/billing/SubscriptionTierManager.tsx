/**
 * Enterprise Subscription Tier Management System
 * Comprehensive tier management with custom pricing and enterprise features
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Check,
  X,
  Crown,
  Building,
  Zap,
  Shield,
  Globe,
  Users,
  Database,
  BarChart3,
  Settings,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  Percent,
  Star,
  Target,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Copy,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface PlanTier {
  id: string;
  name: string;
  description: string;
  tier: 'FREEMIUM' | 'STARTER' | 'PROFESSIONAL' | 'BUSINESS' | 'ENTERPRISE' | 'CUSTOM';
  billingInterval: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ONE_TIME';
  amount: number;
  currency: string;
  stripePriceId: string;
  stripeProductId: string;
  
  // Feature limits
  maxProjects: number;
  maxTeamMembers: number;
  maxAPIRequests: number;
  maxMonitoringChecks: number;
  
  // Features
  features: PlanFeatures;
  
  // Usage-based pricing
  meteringEnabled: boolean;
  usageType?: string;
  unitAmount?: number;
  
  // Enterprise features
  customPricing: boolean;
  requiresApproval: boolean;
  contractRequired: boolean;
  
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
  
  createdAt: Date;
  updatedAt: Date;
}

interface PlanFeatures {
  websiteAnalyzer: boolean;
  basicReporting: boolean;
  emailSupport: boolean;
  advancedAnalytics: boolean;
  teamCollaboration: boolean;
  enterpriseIntegrations: boolean;
  customReporting: boolean;
  prioritySupport: boolean;
  sla: string | boolean;
  sso: boolean;
  auditLogs: boolean;
  apiAccess: 'limited' | 'standard' | 'full' | 'unlimited';
  whiteLabeling: boolean;
  customContracts: boolean;
  dedicatedSupport?: boolean;
  onPremise?: boolean;
  customIntegrations?: boolean;
  dataResidency?: boolean;
  advancedSecurity?: boolean;
  customFeatures?: boolean;
}

interface CustomPricingConfig {
  basePrice: number;
  volumeDiscounts: VolumeDiscount[];
  contractDiscounts: ContractDiscount[];
  customFeaturePricing: CustomFeature[];
  setupFees: SetupFee[];
}

interface VolumeDiscount {
  minQuantity: number;
  discountPercent: number;
  description: string;
}

interface ContractDiscount {
  contractLength: number; // months
  discountPercent: number;
  description: string;
}

interface CustomFeature {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  oneTimePrice?: number;
  required: boolean;
}

interface SetupFee {
  name: string;
  amount: number;
  description: string;
  waivable: boolean;
}

interface SubscriptionTierManagerProps {
  isAdmin?: boolean;
  currentUserTier?: string;
  onTierChange?: (newTier: string) => void;
}

export default function SubscriptionTierManager({ 
  isAdmin = false, 
  currentUserTier,
  onTierChange 
}: SubscriptionTierManagerProps) {
  const [activeTab, setActiveTab] = useState('tiers');
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PlanTier[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCustomPricingDialog, setShowCustomPricingDialog] = useState(false);
  
  // Form states
  const [newPlan, setNewPlan] = useState<Partial<PlanTier>>({
    name: '',
    description: '',
    tier: 'STARTER',
    billingInterval: 'MONTHLY',
    amount: 0,
    currency: 'usd',
    maxProjects: 10,
    maxTeamMembers: 5,
    maxAPIRequests: 10000,
    maxMonitoringChecks: 1000,
    features: {
      websiteAnalyzer: true,
      basicReporting: true,
      emailSupport: true,
      advancedAnalytics: false,
      teamCollaboration: false,
      enterpriseIntegrations: false,
      customReporting: false,
      prioritySupport: false,
      sla: false,
      sso: false,
      auditLogs: false,
      apiAccess: 'limited',
      whiteLabeling: false,
      customContracts: false
    },
    meteringEnabled: false,
    customPricing: false,
    requiresApproval: false,
    contractRequired: false,
    isActive: true,
    isPopular: false,
    sortOrder: 0
  });

  // Fetch plans
  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/billing/plans');
      const data = await response.json();
      
      if (data.success) {
        setPlans(data.plans || []);
      } else {
        toast.error('Failed to load subscription plans');
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load plans on mount
  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Create plan
  const createPlan = useCallback(async () => {
    try {
      const response = await fetch('/api/billing/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlan)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Plan created successfully');
        setShowCreateDialog(false);
        fetchPlans();
        setNewPlan({
          name: '',
          description: '',
          tier: 'STARTER',
          billingInterval: 'MONTHLY',
          amount: 0,
          currency: 'usd',
          features: {
            websiteAnalyzer: true,
            basicReporting: true,
            emailSupport: true,
            advancedAnalytics: false,
            teamCollaboration: false,
            enterpriseIntegrations: false,
            customReporting: false,
            prioritySupport: false,
            sla: false,
            sso: false,
            auditLogs: false,
            apiAccess: 'limited',
            whiteLabeling: false,
            customContracts: false
          }
        });
      } else {
        toast.error(data.error || 'Failed to create plan');
      }
    } catch (error) {
      console.error('Failed to create plan:', error);
      toast.error('Failed to create plan');
    }
  }, [newPlan, fetchPlans]);

  // Update plan
  const updatePlan = useCallback(async (planId: string, updates: Partial<PlanTier>) => {
    try {
      const response = await fetch(`/api/billing/plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Plan updated successfully');
        fetchPlans();
      } else {
        toast.error(data.error || 'Failed to update plan');
      }
    } catch (error) {
      console.error('Failed to update plan:', error);
      toast.error('Failed to update plan');
    }
  }, [fetchPlans]);

  // Format currency
  const formatCurrency = useCallback((amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2
    }).format(amount / 100);
  }, []);

  // Get tier color
  const getTierColor = useCallback((tier: string) => {
    const colors = {
      'FREEMIUM': 'bg-gray-100 text-gray-800',
      'STARTER': 'bg-blue-100 text-blue-800',
      'PROFESSIONAL': 'bg-purple-100 text-purple-800',
      'BUSINESS': 'bg-green-100 text-green-800',
      'ENTERPRISE': 'bg-orange-100 text-orange-800',
      'CUSTOM': 'bg-red-100 text-red-800'
    };
    return colors[tier as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }, []);

  // Get tier icon
  const getTierIcon = useCallback((tier: string) => {
    const icons = {
      'FREEMIUM': Star,
      'STARTER': Zap,
      'PROFESSIONAL': Target,
      'BUSINESS': Building,
      'ENTERPRISE': Crown,
      'CUSTOM': Settings
    };
    const Icon = icons[tier as keyof typeof icons] || Star;
    return <Icon className="h-4 w-4" />;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription Tiers</h1>
          <p className="text-gray-600 mt-1">Manage subscription plans and pricing</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="tiers">Subscription Tiers</TabsTrigger>
          <TabsTrigger value="comparison">Feature Comparison</TabsTrigger>
          {isAdmin && <TabsTrigger value="management">Plan Management</TabsTrigger>}
        </TabsList>

        {/* Subscription Tiers Tab */}
        <TabsContent value="tiers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {plans
              .filter(plan => plan.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`relative ${plan.isPopular ? 'ring-2 ring-blue-500 shadow-lg' : ''} ${
                    currentUserTier === plan.tier.toLowerCase() ? 'ring-2 ring-green-500' : ''
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                    </div>
                  )}
                  
                  {currentUserTier === plan.tier.toLowerCase() && (
                    <div className="absolute -top-3 right-4">
                      <Badge className="bg-green-500 text-white">Current Plan</Badge>
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge className={getTierColor(plan.tier)}>
                        {getTierIcon(plan.tier)}
                        <span className="ml-1">{plan.tier}</span>
                      </Badge>
                      {plan.customPricing && (
                        <Badge variant="outline">Custom</Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <p className="text-gray-600 text-sm">{plan.description}</p>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Pricing */}
                    <div className="text-center">
                      {plan.customPricing ? (
                        <div>
                          <p className="text-3xl font-bold">Custom</p>
                          <p className="text-sm text-gray-600">Contact sales</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-3xl font-bold">
                            {formatCurrency(plan.amount, plan.currency)}
                          </p>
                          <p className="text-sm text-gray-600">
                            per {plan.billingInterval.toLowerCase().replace('ly', '')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Key Limits */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Projects:</span>
                        <span className="font-medium">
                          {plan.maxProjects === -1 ? 'Unlimited' : plan.maxProjects.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Team Members:</span>
                        <span className="font-medium">
                          {plan.maxTeamMembers === -1 ? 'Unlimited' : plan.maxTeamMembers.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>API Requests:</span>
                        <span className="font-medium">
                          {plan.maxAPIRequests === -1 ? 'Unlimited' : `${(plan.maxAPIRequests / 1000).toFixed(0)}K`}
                        </span>
                      </div>
                    </div>

                    {/* Key Features */}
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        {plan.features.advancedAnalytics ? (
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <X className="h-4 w-4 text-gray-300 mr-2" />
                        )}
                        Advanced Analytics
                      </div>
                      <div className="flex items-center text-sm">
                        {plan.features.teamCollaboration ? (
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <X className="h-4 w-4 text-gray-300 mr-2" />
                        )}
                        Team Collaboration
                      </div>
                      <div className="flex items-center text-sm">
                        {plan.features.prioritySupport ? (
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <X className="h-4 w-4 text-gray-300 mr-2" />
                        )}
                        Priority Support
                      </div>
                      <div className="flex items-center text-sm">
                        {plan.features.sso ? (
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <X className="h-4 w-4 text-gray-300 mr-2" />
                        )}
                        Single Sign-On
                      </div>
                      {typeof plan.features.sla === 'string' && (
                        <div className="flex items-center text-sm">
                          <Shield className="h-4 w-4 text-blue-500 mr-2" />
                          {plan.features.sla} SLA
                        </div>
                      )}
                    </div>

                    {/* CTA Button */}
                    <div className="pt-4">
                      {currentUserTier === plan.tier.toLowerCase() ? (
                        <Button className="w-full" variant="outline" disabled>
                          Current Plan
                        </Button>
                      ) : plan.customPricing ? (
                        <Button className="w-full" variant="outline">
                          Contact Sales
                        </Button>
                      ) : (
                        <Button 
                          className="w-full"
                          onClick={() => onTierChange?.(plan.tier.toLowerCase())}
                        >
                          {currentUserTier ? 'Upgrade' : 'Get Started'}
                        </Button>
                      )}
                    </div>

                    {/* Trial Info */}
                    {plan.tier !== 'FREEMIUM' && !currentUserTier && (
                      <p className="text-xs text-center text-gray-600">
                        14-day free trial included
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Feature Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Features</th>
                      {plans
                        .filter(plan => plan.isActive)
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((plan) => (
                          <th key={plan.id} className="text-center p-4">
                            <div className="flex flex-col items-center">
                              <Badge className={getTierColor(plan.tier)}>
                                {plan.tier}
                              </Badge>
                              <span className="text-sm font-normal mt-1">{plan.name}</span>
                            </div>
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Resource Limits */}
                    <tr className="border-b bg-gray-50">
                      <td className="p-4 font-medium" colSpan={plans.length + 1}>
                        Resource Limits
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">Projects</td>
                      {plans.map((plan) => (
                        <td key={plan.id} className="text-center p-4">
                          {plan.maxProjects === -1 ? 'Unlimited' : plan.maxProjects.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">Team Members</td>
                      {plans.map((plan) => (
                        <td key={plan.id} className="text-center p-4">
                          {plan.maxTeamMembers === -1 ? 'Unlimited' : plan.maxTeamMembers.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">API Requests</td>
                      {plans.map((plan) => (
                        <td key={plan.id} className="text-center p-4">
                          {plan.maxAPIRequests === -1 ? 'Unlimited' : `${(plan.maxAPIRequests / 1000).toFixed(0)}K`}
                        </td>
                      ))}
                    </tr>

                    {/* Core Features */}
                    <tr className="border-b bg-gray-50">
                      <td className="p-4 font-medium" colSpan={plans.length + 1}>
                        Core Features
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">Website Analyzer</td>
                      {plans.map((plan) => (
                        <td key={plan.id} className="text-center p-4">
                          {plan.features.websiteAnalyzer ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">Advanced Analytics</td>
                      {plans.map((plan) => (
                        <td key={plan.id} className="text-center p-4">
                          {plan.features.advancedAnalytics ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">Team Collaboration</td>
                      {plans.map((plan) => (
                        <td key={plan.id} className="text-center p-4">
                          {plan.features.teamCollaboration ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Enterprise Features */}
                    <tr className="border-b bg-gray-50">
                      <td className="p-4 font-medium" colSpan={plans.length + 1}>
                        Enterprise Features
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">Single Sign-On (SSO)</td>
                      {plans.map((plan) => (
                        <td key={plan.id} className="text-center p-4">
                          {plan.features.sso ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">Audit Logs</td>
                      {plans.map((plan) => (
                        <td key={plan.id} className="text-center p-4">
                          {plan.features.auditLogs ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">White Labeling</td>
                      {plans.map((plan) => (
                        <td key={plan.id} className="text-center p-4">
                          {plan.features.whiteLabeling ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Support & SLA */}
                    <tr className="border-b bg-gray-50">
                      <td className="p-4 font-medium" colSpan={plans.length + 1}>
                        Support & SLA
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">Support Level</td>
                      {plans.map((plan) => (
                        <td key={plan.id} className="text-center p-4">
                          {plan.features.dedicatedSupport 
                            ? 'Dedicated' 
                            : plan.features.prioritySupport 
                            ? 'Priority' 
                            : 'Standard'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">SLA</td>
                      {plans.map((plan) => (
                        <td key={plan.id} className="text-center p-4">
                          {typeof plan.features.sla === 'string' ? plan.features.sla : 
                           plan.features.sla ? 'Yes' : 'No'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plan Management Tab (Admin Only) */}
        {isAdmin && (
          <TabsContent value="management" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {plans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge className={getTierColor(plan.tier)}>
                          {getTierIcon(plan.tier)}
                          <span className="ml-1">{plan.tier}</span>
                        </Badge>
                        <h3 className="text-lg font-semibold">{plan.name}</h3>
                        {!plan.isActive && (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                        {plan.isPopular && (
                          <Badge className="bg-blue-500 text-white">Popular</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={plan.isActive}
                          onCheckedChange={(checked) => 
                            updatePlan(plan.id, { isActive: checked })
                          }
                        />
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Pricing</h4>
                        <p className="text-2xl font-bold">
                          {plan.customPricing ? 'Custom' : formatCurrency(plan.amount, plan.currency)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {plan.billingInterval.toLowerCase()}
                        </p>
                        {plan.meteringEnabled && (
                          <Badge variant="outline" className="mt-1">
                            Usage-based
                          </Badge>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Limits</h4>
                        <div className="space-y-1 text-sm">
                          <div>Projects: {plan.maxProjects === -1 ? '∞' : plan.maxProjects.toLocaleString()}</div>
                          <div>Team: {plan.maxTeamMembers === -1 ? '∞' : plan.maxTeamMembers.toLocaleString()}</div>
                          <div>API: {plan.maxAPIRequests === -1 ? '∞' : `${(plan.maxAPIRequests / 1000).toFixed(0)}K`}</div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Settings</h4>
                        <div className="space-y-1 text-sm">
                          <div>Sort Order: {plan.sortOrder}</div>
                          <div>Stripe Price: {plan.stripePriceId}</div>
                          {plan.requiresApproval && (
                            <Badge variant="outline">Requires Approval</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Create Plan Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Plan</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  value={newPlan.name || ''}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Professional Plan"
                />
              </div>
              
              <div>
                <Label htmlFor="tier">Tier</Label>
                <Select 
                  value={newPlan.tier} 
                  onValueChange={(value) => setNewPlan(prev => ({ ...prev, tier: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREEMIUM">Freemium</SelectItem>
                    <SelectItem value="STARTER">Starter</SelectItem>
                    <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                    <SelectItem value="BUSINESS">Business</SelectItem>
                    <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newPlan.description || ''}
                onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Plan description..."
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="amount">Amount (cents)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newPlan.amount || 0}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                />
              </div>
              
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  value={newPlan.currency} 
                  onValueChange={(value) => setNewPlan(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD</SelectItem>
                    <SelectItem value="eur">EUR</SelectItem>
                    <SelectItem value="gbp">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="interval">Billing Interval</Label>
                <Select 
                  value={newPlan.billingInterval} 
                  onValueChange={(value) => setNewPlan(prev => ({ ...prev, billingInterval: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                    <SelectItem value="ONE_TIME">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="maxProjects">Max Projects</Label>
                <Input
                  id="maxProjects"
                  type="number"
                  value={newPlan.maxProjects || 0}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, maxProjects: parseInt(e.target.value) || 0 }))}
                />
              </div>
              
              <div>
                <Label htmlFor="maxTeamMembers">Max Team Members</Label>
                <Input
                  id="maxTeamMembers"
                  type="number"
                  value={newPlan.maxTeamMembers || 0}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, maxTeamMembers: parseInt(e.target.value) || 0 }))}
                />
              </div>
              
              <div>
                <Label htmlFor="maxAPIRequests">Max API Requests</Label>
                <Input
                  id="maxAPIRequests"
                  type="number"
                  value={newPlan.maxAPIRequests || 0}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, maxAPIRequests: parseInt(e.target.value) || 0 }))}
                />
              </div>
              
              <div>
                <Label htmlFor="maxMonitoringChecks">Max Monitoring Checks</Label>
                <Input
                  id="maxMonitoringChecks"
                  type="number"
                  value={newPlan.maxMonitoringChecks || 0}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, maxMonitoringChecks: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {/* Features */}
            <div>
              <Label>Features</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                {Object.entries(newPlan.features || {}).map(([key, value]) => {
                  if (key === 'sla' || key === 'apiAccess') return null;
                  return (
                    <div key={key} className="flex items-center space-x-2">
                      <Switch
                        checked={value as boolean}
                        onCheckedChange={(checked) => 
                          setNewPlan(prev => ({
                            ...prev,
                            features: { ...prev.features!, [key]: checked }
                          }))
                        }
                      />
                      <Label className="text-sm">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Options */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newPlan.meteringEnabled || false}
                  onCheckedChange={(checked) => setNewPlan(prev => ({ ...prev, meteringEnabled: checked }))}
                />
                <Label>Usage-based billing</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newPlan.customPricing || false}
                  onCheckedChange={(checked) => setNewPlan(prev => ({ ...prev, customPricing: checked }))}
                />
                <Label>Custom pricing</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newPlan.requiresApproval || false}
                  onCheckedChange={(checked) => setNewPlan(prev => ({ ...prev, requiresApproval: checked }))}
                />
                <Label>Requires approval</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newPlan.isPopular || false}
                  onCheckedChange={(checked) => setNewPlan(prev => ({ ...prev, isPopular: checked }))}
                />
                <Label>Popular plan</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createPlan}>
                Create Plan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}