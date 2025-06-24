/**
 * Enhanced Analytics Module
 * 
 * Comprehensive analytics tracking and business intelligence
 * integration for the Zenith platform.
 */

export interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  context?: AnalyticsContext;
  timestamp?: Date;
  userId?: string;
  sessionId?: string;
}

export interface AnalyticsContext {
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  page?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
}

class EnhancedAnalytics {
  private events: AnalyticsEvent[] = [];
  private isEnabled: boolean = true;

  /**
   * Track an analytics event
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    const enhancedEvent: AnalyticsEvent = {
      ...event,
      timestamp: event.timestamp || new Date(),
      sessionId: event.sessionId || this.getSessionId()
    };

    this.events.push(enhancedEvent);

    // In production, this would send to analytics service
    console.log('Analytics event tracked:', enhancedEvent);
  }

  /**
   * Track page view
   */
  async trackPageView(page: string, userId?: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      event: 'page_view',
      properties: {
        page,
        ...properties
      },
      userId,
      timestamp: new Date()
    });
  }

  /**
   * Track user action
   */
  async trackUserAction(action: string, userId: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      event: 'user_action',
      properties: {
        action,
        ...properties
      },
      userId,
      timestamp: new Date()
    });
  }

  /**
   * Track conversion
   */
  async trackConversion(type: string, value: number, userId?: string, properties?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      event: 'conversion',
      properties: {
        type,
        value,
        ...properties
      },
      userId,
      timestamp: new Date()
    });
  }

  /**
   * Get analytics summary
   */
  getSummary(): {
    totalEvents: number;
    uniqueUsers: number;
    topEvents: Array<{ event: string; count: number }>;
  } {
    const uniqueUsers = new Set(this.events.map(e => e.userId).filter(Boolean)).size;
    
    const eventCounts = this.events.reduce((acc, event) => {
      acc[event.event] = (acc[event.event] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEvents = Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([event, count]) => ({ event, count }));

    return {
      totalEvents: this.events.length,
      uniqueUsers,
      topEvents
    };
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  private getSessionId(): string {
    // Simple session ID generation
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

export const analytics = new EnhancedAnalytics();
export const analyticsEngine = analytics; // Export alias for compatibility
export default analytics;