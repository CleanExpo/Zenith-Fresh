'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget';
import { ProductTour, useProductTour } from '@/components/tour/ProductTour';
import { ContextualHelp } from '@/components/help/ContextualHelp';

interface CustomerSuccessProviderProps {
  children: React.ReactNode;
}

export function CustomerSuccessProvider({ children }: CustomerSuccessProviderProps) {
  const { data: session, status } = useSession();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const dashboardTour = useProductTour('dashboard');

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      checkOnboardingStatus();
    }
  }, [status, session?.user?.id]);

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/onboarding');
      if (response.ok) {
        const data = await response.json();
        setOnboardingData(data);
        
        // Show onboarding if not completed and user is new (within 7 days)
        const userCreatedAt = new Date(session?.user?.createdAt || Date.now());
        const daysSinceSignup = (Date.now() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24);
        
        if (!data.isCompleted && daysSinceSignup <= 7) {
          setShowOnboarding(true);
        }
      } else if (response.status === 404) {
        // New user, show onboarding
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Start dashboard tour after onboarding
    setTimeout(() => {
      dashboardTour.startTour();
    }, 1000);
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
  };

  // Don't render anything until we know authentication status
  if (status === 'loading') {
    return <>{children}</>;
  }

  // Only render customer success features for authenticated users
  if (status !== 'authenticated' || !session?.user) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      
      {/* Onboarding Flow */}
      {showOnboarding && (
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* Floating Feedback Widget */}
      <FeedbackWidget
        position="bottom-right"
        page={typeof window !== 'undefined' ? window.location.pathname : ''}
      />

      {/* Contextual Help - Only show on specific pages */}
      {typeof window !== 'undefined' && (
        <>
          {window.location.pathname === '/dashboard' && (
            <div className="fixed top-4 right-20 z-40">
              <ContextualHelp 
                page="/dashboard"
                trigger="click"
                position="bottom"
              >
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg">
                  Need Help?
                </button>
              </ContextualHelp>
            </div>
          )}
          
          {window.location.pathname === '/tools/website-analyzer' && (
            <div className="fixed top-4 right-20 z-40">
              <ContextualHelp 
                page="/tools/website-analyzer"
                trigger="click"
                position="bottom"
              >
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg">
                  Need Help?
                </button>
              </ContextualHelp>
            </div>
          )}
        </>
      )}

      {/* Product Tour for Dashboard */}
      <ProductTour
        tourId="dashboard"
        steps={[
          {
            id: 'welcome',
            title: 'Welcome to Your Dashboard',
            description: 'This is your central hub for monitoring all your projects and getting insights.',
            target: '[data-tour="dashboard-overview"]',
            position: 'center'
          },
          {
            id: 'sidebar',
            title: 'Navigation Sidebar',
            description: 'Use the sidebar to access different tools and features.',
            target: '[data-tour="sidebar"]',
            position: 'right'
          },
          {
            id: 'projects',
            title: 'Your Projects',
            description: 'View and manage all your website analysis projects here.',
            target: '[data-tour="projects-section"]',
            position: 'top'
          },
          {
            id: 'quick-scan',
            title: 'Quick Scan',
            description: 'Start a quick website analysis with this button.',
            target: '[data-tour="quick-scan-button"]',
            position: 'bottom',
            action: 'click'
          }
        ]}
        isVisible={dashboardTour.isVisible}
        autoStart={false}
        showProgress={true}
        allowSkip={true}
        onComplete={() => {
          dashboardTour.stopTour();
          // Track tour completion
          fetch('/api/user-success-metrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              metricType: 'engagement',
              metricName: 'dashboard-tour-completed',
              value: 1,
              unit: 'count',
              category: 'onboarding',
              milestone: 'dashboard-tour-complete'
            })
          });
        }}
        onSkip={() => {
          dashboardTour.stopTour();
        }}
      />
    </>
  );
}