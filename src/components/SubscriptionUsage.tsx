'use client';

import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Zap, 
  Users, 
  HardDrive, 
  FolderOpen, 
  Mail, 
  Star,
  TrendingUp,
  Crown,
  Infinity
} from 'lucide-react';
import { SubscriptionLimits } from '@/lib/subscription-plans';

interface SubscriptionUsageProps {
  teamId?: string;
  showUpgradeButton?: boolean;
  compact?: boolean;
}

export function SubscriptionUsage({ 
  teamId, 
  showUpgradeButton = true,
  compact = false 
}: SubscriptionUsageProps) {
  const {
    subscription,
    currentPlan,
    isLoading,
    getUsagePercentage,
    isNearLimit,
    upgradeToPlan,
    upgradeModal,
    closeUpgradeModal,
    isUpgrading,
  } = useSubscription(teamId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription || !currentPlan) {
    return null;
  }

  const getFeatureIcon = (feature: keyof SubscriptionLimits) => {
    const iconProps = { className: "w-4 h-4" };
    
    switch (feature) {
      case 'projects':
        return <FolderOpen {...iconProps} />;
      case 'teamMembers':
        return <Users {...iconProps} />;
      case 'apiCalls':
        return <Zap {...iconProps} />;
      case 'storage':
        return <HardDrive {...iconProps} />;
      case 'emailCampaigns':
        return <Mail {...iconProps} />;
      case 'seoAnalyses':
        return <TrendingUp {...iconProps} />;
      default:
        return <Star {...iconProps} />;
    }
  };

  const formatLimit = (limit: number | boolean): string => {
    if (typeof limit === 'boolean') return limit ? 'Available' : 'Not Available';
    if (limit === -1) return 'Unlimited';
    return limit.toLocaleString();
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const mainFeatures: (keyof SubscriptionLimits)[] = [
    'projects',
    'teamMembers',
    'apiCalls',
    'storage',
    'emailCampaigns',
    'seoAnalyses',
  ];

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">{currentPlan.name} Plan</CardTitle>
            </div>
            {currentPlan.id !== 'enterprise' && showUpgradeButton && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => upgradeToPlan('professional')}
                disabled={isUpgrading}
              >
                Upgrade
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4">
            {mainFeatures.slice(0, 4).map((feature) => {
              const usage = subscription.usage[feature];
              const percentage = usage?.percentage || 0;
              
              return (
                <div key={feature} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {getFeatureIcon(feature)}
                      <span className="font-medium capitalize">
                        {feature.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                    <span className="text-gray-600">
                      {usage?.current || 0}/{formatLimit(usage?.limit || 0)}
                    </span>
                  </div>
                  {typeof usage?.limit === 'number' && usage.limit > 0 && (
                    <Progress 
                      value={percentage} 
                      className="h-2"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">{currentPlan.name} Plan</CardTitle>
                <p className="text-gray-600">{currentPlan.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">${currentPlan.price}</div>
              <div className="text-gray-500">per {currentPlan.interval}</div>
            </div>
          </div>
        </CardHeader>
        {currentPlan.id !== 'enterprise' && showUpgradeButton && (
          <CardContent>
            <Button 
              onClick={() => upgradeToPlan('professional')}
              disabled={isUpgrading}
              className="w-full"
            >
              {isUpgrading ? 'Processing...' : 'Upgrade Plan'}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Usage Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mainFeatures.map((feature) => {
          const usage = subscription.usage[feature];
          const percentage = usage?.percentage || 0;
          const isNear = isNearLimit(feature);
          
          return (
            <Card key={feature} className={isNear ? 'border-yellow-300' : ''}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isNear ? 'bg-yellow-100' : 'bg-blue-100'
                    }`}>
                      {getFeatureIcon(feature)}
                    </div>
                    <div>
                      <h3 className="font-medium capitalize">
                        {feature.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {usage?.current || 0} / {formatLimit(usage?.limit || 0)}
                      </p>
                    </div>
                  </div>
                  {isNear && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                      Near Limit
                    </Badge>
                  )}
                </div>
                
                {typeof usage?.limit === 'number' && usage.limit > 0 && (
                  <div className="space-y-2">
                    <Progress 
                      value={percentage} 
                      className="h-3"
                    />
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{percentage}% used</span>
                      <span>{usage.limit - (usage.current || 0)} remaining</span>
                    </div>
                  </div>
                )}
                
                {usage?.limit === -1 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <Infinity className="w-4 h-4" />
                    <span className="text-sm font-medium">Unlimited</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feature Access */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentPlan.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${
                  feature.included ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span className={`text-sm ${
                  feature.included ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {feature.name}
                  {feature.limit && feature.included && (
                    <span className="text-gray-600"> (up to {feature.limit})</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}