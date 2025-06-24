// Conversion tracking for freemium funnel optimization

export interface ConversionEvent {
  event: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  properties: Record<string, any>;
  value?: number;
  currency?: string;
}

export interface FunnelStep {
  step: string;
  name: string;
  isRequired: boolean;
  conversionGoal?: boolean;
}

export interface UserJourney {
  sessionId: string;
  userId?: string;
  events: ConversionEvent[];
  startTime: Date;
  lastActiveTime: Date;
  currentStep?: string;
  completed: boolean;
  convertedAt?: Date;
  conversionValue?: number;
}

// Define conversion funnel steps
export const CONVERSION_FUNNEL: FunnelStep[] = [
  { step: 'landing_view', name: 'Landing Page View', isRequired: true },
  { step: 'url_entered', name: 'URL Entered', isRequired: true },
  { step: 'analysis_started', name: 'Analysis Started', isRequired: true },
  { step: 'registration_viewed', name: 'Registration Form Viewed', isRequired: true },
  { step: 'account_created', name: 'Account Created', isRequired: true, conversionGoal: true },
  { step: 'results_viewed', name: 'Results Viewed', isRequired: false },
  { step: 'upgrade_prompted', name: 'Upgrade Prompt Shown', isRequired: false },
  { step: 'upgrade_converted', name: 'Upgraded to Pro', isRequired: false, conversionGoal: true }
];

// Event definitions for tracking
export const TRACKING_EVENTS = {
  // Landing page events
  LANDING_PAGE_VIEW: 'landing_page_view',
  URL_INPUT_FOCUS: 'url_input_focus',
  URL_ENTERED: 'url_entered',
  ANALYSIS_BUTTON_CLICK: 'analysis_button_click',
  
  // Registration events
  REGISTRATION_PAGE_VIEW: 'registration_page_view',
  REGISTRATION_FORM_START: 'registration_form_start',
  REGISTRATION_FORM_SUBMIT: 'registration_form_submit',
  ACCOUNT_CREATED: 'account_created',
  
  // Onboarding events
  ONBOARDING_START: 'onboarding_start',
  WEBSITE_ANALYSIS_VIEW: 'website_analysis_view',
  HEALTH_SCORE_REVEAL: 'health_score_reveal',
  RECOMMENDATIONS_VIEW: 'recommendations_view',
  
  // Engagement events
  DASHBOARD_FIRST_VIEW: 'dashboard_first_view',
  FEATURE_USAGE: 'feature_usage',
  REPORT_DOWNLOAD: 'report_download',
  SHARE_RESULTS: 'share_results',
  
  // Upgrade events
  UPGRADE_PROMPT_SHOWN: 'upgrade_prompt_shown',
  UPGRADE_PROMPT_CLICKED: 'upgrade_prompt_clicked',
  UPGRADE_PROMPT_DISMISSED: 'upgrade_prompt_dismissed',
  PRICING_PAGE_VIEW: 'pricing_page_view',
  UPGRADE_FORM_START: 'upgrade_form_start',
  UPGRADE_COMPLETED: 'upgrade_completed',
  
  // Email events
  EMAIL_SENT: 'email_sent',
  EMAIL_OPENED: 'email_opened',
  EMAIL_CLICKED: 'email_clicked',
  EMAIL_UNSUBSCRIBED: 'email_unsubscribed',
  
  // Behavioral events
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  PAGE_VIEW: 'page_view',
  FEATURE_LIMIT_HIT: 'feature_limit_hit',
  USER_INACTIVE: 'user_inactive',
  USER_RETURNED: 'user_returned'
} as const;

class ConversionTracker {
  private events: ConversionEvent[] = [];
  private journeys: Map<string, UserJourney> = new Map();

  constructor() {
    // Initialize Google Analytics 4 if available
    if (typeof window !== 'undefined' && window.gtag) {
      this.setupGA4();
    }
  }

  private setupGA4() {
    // Configure enhanced ecommerce for GA4
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
      custom_map: {
        custom_parameter_1: 'funnel_step',
        custom_parameter_2: 'user_segment',
        custom_parameter_3: 'ab_test_variant'
      }
    });
  }

  // Track conversion events
  async track(
    event: string,
    properties: Record<string, any> = {},
    userId?: string
  ): Promise<void> {
    const sessionId = this.getSessionId();
    const timestamp = new Date();

    const conversionEvent: ConversionEvent = {
      event,
      userId,
      sessionId,
      timestamp,
      properties,
      value: properties.value,
      currency: properties.currency || 'USD'
    };

    // Store event
    this.events.push(conversionEvent);
    
    // Update user journey
    this.updateUserJourney(conversionEvent);

    // Send to analytics platforms
    await Promise.all([
      this.sendToGA4(conversionEvent),
      this.sendToMixpanel(conversionEvent),
      this.sendToDatabase(conversionEvent)
    ]);

    // Check for conversion goals
    this.checkConversionGoals(conversionEvent);
  }

  private updateUserJourney(event: ConversionEvent): void {
    const { sessionId, userId } = event;
    
    let journey = this.journeys.get(sessionId);
    
    if (!journey) {
      journey = {
        sessionId,
        userId,
        events: [],
        startTime: event.timestamp,
        lastActiveTime: event.timestamp,
        completed: false
      };
      this.journeys.set(sessionId, journey);
    }

    journey.events.push(event);
    journey.lastActiveTime = event.timestamp;
    journey.userId = journey.userId || userId;

    // Update current funnel step
    const funnelStep = CONVERSION_FUNNEL.find(step => 
      event.event.includes(step.step) || event.properties.funnel_step === step.step
    );
    
    if (funnelStep) {
      journey.currentStep = funnelStep.step;
      
      // Check if this is a conversion goal
      if (funnelStep.conversionGoal) {
        journey.completed = true;
        journey.convertedAt = event.timestamp;
        journey.conversionValue = event.value || this.getDefaultConversionValue(event.event);
      }
    }
  }

  private async sendToGA4(event: ConversionEvent): Promise<void> {
    if (typeof window === 'undefined' || !window.gtag) return;

    // Map to GA4 event structure
    const ga4Event = {
      event_category: this.getEventCategory(event.event),
      event_label: event.properties.label,
      value: event.value,
      currency: event.currency,
      user_id: event.userId,
      session_id: event.sessionId,
      funnel_step: event.properties.funnel_step,
      user_segment: event.properties.user_segment || 'free',
      ab_test_variant: event.properties.ab_test_variant,
      website_analyzed: event.properties.website,
      ...event.properties
    };

    // Send to GA4
    window.gtag('event', event.event, ga4Event);

    // Track conversions
    if (this.isConversionEvent(event.event)) {
      window.gtag('event', 'conversion', {
        send_to: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
        value: event.value || this.getDefaultConversionValue(event.event),
        currency: event.currency
      });
    }
  }

  private async sendToMixpanel(event: ConversionEvent): Promise<void> {
    // Integrate with Mixpanel for detailed behavioral analytics
    if (typeof window === 'undefined' || !window.mixpanel) return;

    window.mixpanel.track(event.event, {
      ...event.properties,
      timestamp: event.timestamp.toISOString(),
      session_id: event.sessionId,
      user_id: event.userId,
      value: event.value,
      currency: event.currency
    });

    // Set user properties for segmentation
    if (event.userId) {
      window.mixpanel.people.set(event.userId, {
        last_activity: event.timestamp.toISOString(),
        current_funnel_step: event.properties.funnel_step,
        user_segment: event.properties.user_segment || 'free'
      });
    }
  }

  private async sendToDatabase(event: ConversionEvent): Promise<void> {
    try {
      // Store in database for custom analytics
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('Failed to store analytics event:', error);
    }
  }

  private checkConversionGoals(event: ConversionEvent): void {
    const conversionEvents = [
      TRACKING_EVENTS.ACCOUNT_CREATED,
      TRACKING_EVENTS.UPGRADE_COMPLETED,
      TRACKING_EVENTS.UPGRADE_FORM_START
    ];

    if (conversionEvents.includes(event.event as any)) {
      this.triggerConversionHooks(event);
    }
  }

  private async triggerConversionHooks(event: ConversionEvent): Promise<void> {
    // Trigger post-conversion actions
    switch (event.event) {
      case TRACKING_EVENTS.ACCOUNT_CREATED:
        await this.handleAccountCreationConversion(event);
        break;
      case TRACKING_EVENTS.UPGRADE_COMPLETED:
        await this.handleUpgradeConversion(event);
        break;
    }
  }

  private async handleAccountCreationConversion(event: ConversionEvent): Promise<void> {
    // Track free trial conversion
    await this.track('free_trial_started', {
      conversion_value: 0,
      user_segment: 'free_trial',
      website: event.properties.website
    }, event.userId);

    // Start onboarding email sequence
    if (event.userId && event.properties.email) {
      await fetch('/api/email/trigger-sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: event.userId,
          email: event.properties.email,
          sequence: 'onboarding',
          website: event.properties.website,
          healthScore: event.properties.health_score
        })
      });
    }
  }

  private async handleUpgradeConversion(event: ConversionEvent): Promise<void> {
    // Track paid conversion
    await this.track('paid_conversion', {
      conversion_value: event.value || 29,
      user_segment: 'paid',
      plan: event.properties.plan || 'pro'
    }, event.userId);
  }

  // Funnel analysis methods
  getFunnelAnalysis(timeRange: { start: Date; end: Date }): any {
    const relevantJourneys = Array.from(this.journeys.values())
      .filter(journey => 
        journey.startTime >= timeRange.start && 
        journey.startTime <= timeRange.end
      );

    const funnelData = CONVERSION_FUNNEL.map(step => {
      const journeysAtStep = relevantJourneys.filter(journey =>
        journey.events.some(event => 
          event.event.includes(step.step) || 
          event.properties.funnel_step === step.step
        )
      );

      return {
        step: step.step,
        name: step.name,
        users: journeysAtStep.length,
        conversionRate: journeysAtStep.length / (relevantJourneys.length || 1) * 100
      };
    });

    return {
      totalUsers: relevantJourneys.length,
      conversions: relevantJourneys.filter(j => j.completed).length,
      overallConversionRate: relevantJourneys.filter(j => j.completed).length / (relevantJourneys.length || 1) * 100,
      steps: funnelData,
      averageTimeToConvert: this.calculateAverageTimeToConvert(relevantJourneys.filter(j => j.completed))
    };
  }

  private calculateAverageTimeToConvert(convertedJourneys: UserJourney[]): number {
    if (convertedJourneys.length === 0) return 0;

    const totalTime = convertedJourneys.reduce((sum, journey) => {
      if (journey.convertedAt) {
        return sum + (journey.convertedAt.getTime() - journey.startTime.getTime());
      }
      return sum;
    }, 0);

    return totalTime / convertedJourneys.length / (1000 * 60); // Return in minutes
  }

  // Utility methods
  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server-session';
    
    let sessionId = sessionStorage.getItem('zenith_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('zenith_session_id', sessionId);
    }
    return sessionId;
  }

  private getEventCategory(event: string): string {
    if (event.includes('registration') || event.includes('account')) return 'conversion';
    if (event.includes('upgrade') || event.includes('pricing')) return 'monetization';
    if (event.includes('email')) return 'engagement';
    if (event.includes('analysis') || event.includes('report')) return 'feature_usage';
    return 'general';
  }

  private isConversionEvent(event: string): boolean {
    return [
      TRACKING_EVENTS.ACCOUNT_CREATED,
      TRACKING_EVENTS.UPGRADE_COMPLETED
    ].includes(event as any);
  }

  private getDefaultConversionValue(event: string): number {
    switch (event) {
      case TRACKING_EVENTS.ACCOUNT_CREATED:
        return 0; // Free trial has no immediate value
      case TRACKING_EVENTS.UPGRADE_COMPLETED:
        return 29; // Default Pro plan value
      default:
        return 0;
    }
  }

  // A/B testing support
  async trackABTest(
    testName: string,
    variant: string,
    userId?: string
  ): Promise<void> {
    await this.track('ab_test_assignment', {
      test_name: testName,
      variant,
      funnel_step: 'ab_test'
    }, userId);
  }

  // Cohort analysis
  getCohortAnalysis(cohortPeriod: 'daily' | 'weekly' | 'monthly'): any {
    // Implementation for cohort analysis
    // This would analyze user retention and behavior over time
    return {
      cohorts: [],
      retentionRates: [],
      averageLifetimeValue: 0
    };
  }
}

// Global tracker instance
export const conversionTracker = new ConversionTracker();

// Convenience functions for common tracking scenarios
export const trackLandingPageView = (website?: string) => 
  conversionTracker.track(TRACKING_EVENTS.LANDING_PAGE_VIEW, {
    funnel_step: 'landing_view',
    website
  });

export const trackURLEntered = (website: string, userId?: string) =>
  conversionTracker.track(TRACKING_EVENTS.URL_ENTERED, {
    funnel_step: 'url_entered',
    website
  }, userId);

export const trackAccountCreated = (userId: string, email: string, website?: string) =>
  conversionTracker.track(TRACKING_EVENTS.ACCOUNT_CREATED, {
    funnel_step: 'account_created',
    email,
    website,
    value: 0,
    user_segment: 'free'
  }, userId);

export const trackUpgradeCompleted = (userId: string, plan: string, value: number) =>
  conversionTracker.track(TRACKING_EVENTS.UPGRADE_COMPLETED, {
    funnel_step: 'upgrade_converted',
    plan,
    value,
    user_segment: 'paid'
  }, userId);

export const trackFeatureUsage = (feature: string, userId?: string) =>
  conversionTracker.track(TRACKING_EVENTS.FEATURE_USAGE, {
    feature,
    funnel_step: 'feature_usage'
  }, userId);

// Types for external analytics platforms
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    mixpanel: {
      track: (event: string, properties: any) => void;
      people: {
        set: (userId: string, properties: any) => void;
      };
    };
  }
}