'use client';

import React, { useEffect, useState } from 'react';
import { useFeatureGuard } from '@/hooks/useSubscription';
import { SubscriptionLimits } from '@/lib/subscription-plans';
import { UpgradeModal } from './UpgradeModal';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Lock, Zap } from 'lucide-react';

interface PaywallGuardProps {
  children: React.ReactNode;
  feature: keyof SubscriptionLimits;
  fallback?: React.ReactNode;
  checkUsage?: boolean;
  teamId?: string;
  className?: string;
}

export function PaywallGuard({
  children,
  feature,
  fallback,
  checkUsage = false,
  teamId,
  className,
}: PaywallGuardProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const {
    checkFeatureAccess,
    checkUsageLimit,
    upgradeModal,
    closeUpgradeModal,
    upgradeToPlan,
    isUpgrading,
    currentPlan,
  } = useFeatureGuard();

  useEffect(() => {
    const checkAccess = async () => {
      setIsLoading(true);
      try {
        let allowed = false;
        
        if (checkUsage) {
          allowed = await checkUsageLimit(feature);
        } else {
          allowed = await checkFeatureAccess(feature);
        }
        
        setHasAccess(allowed);
      } catch (error) {
        console.error('Error checking access:', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [feature, checkUsage, checkFeatureAccess, checkUsageLimit]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <>
        {fallback || (
          <Card className={`border-dashed border-2 border-gray-300 ${className}`}>
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-gray-400" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Upgrade Required
              </h3>
              
              <p className="text-gray-600 mb-4 max-w-md">
                {getFeatureDescription(feature)} is available on higher plans. 
                Upgrade to unlock this feature and boost your productivity.
              </p>
              
              <Button
                onClick={() => checkFeatureAccess(feature)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                View Plans
              </Button>
            </CardContent>
          </Card>
        )}
        
        <UpgradeModal
          isOpen={upgradeModal.isOpen}
          onClose={closeUpgradeModal}
          onUpgrade={upgradeToPlan}
          isUpgrading={isUpgrading}
          feature={upgradeModal.feature}
          message={upgradeModal.message}
          targetPlan={upgradeModal.targetPlan}
          currentPlan={currentPlan?.id}
        />
      </>
    );
  }

  return <>{children}</>;
}

// Usage limit wrapper that checks both feature access and usage limits
export function UsageLimitGuard({
  children,
  feature,
  fallback,
  teamId,
  className,
}: PaywallGuardProps) {
  return (
    <PaywallGuard
      feature={feature}
      fallback={fallback}
      checkUsage={true}
      teamId={teamId}
      className={className}
    >
      {children}
    </PaywallGuard>
  );
}

// Simple feature access wrapper
export function FeatureGuard({
  children,
  feature,
  fallback,
  teamId,
  className,
}: PaywallGuardProps) {
  return (
    <PaywallGuard
      feature={feature}
      fallback={fallback}
      checkUsage={false}
      teamId={teamId}
      className={className}
    >
      {children}
    </PaywallGuard>
  );
}

function getFeatureDescription(feature: keyof SubscriptionLimits): string {
  const descriptions: Record<keyof SubscriptionLimits, string> = {
    projects: 'Advanced project management',
    teamMembers: 'Team collaboration',
    apiCalls: 'API access',
    storage: 'Additional storage',
    aiAgents: 'AI agent automation',
    emailCampaigns: 'Email marketing campaigns',
    reviewCampaigns: 'Review generation campaigns',
    seoAnalyses: 'Advanced SEO analysis',
    partnerProgram: 'Partner program access',
    customIntegrations: 'Custom integrations',
    prioritySupport: 'Priority customer support',
    whiteLabel: 'White-label branding',
  };

  return descriptions[feature] || 'This feature';
}