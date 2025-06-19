'use client';

import { useState, useEffect } from 'react';
import { trackEvent, trackConversion, trackPurchase, trackSignUp, trackLogin, setUserId } from '@/lib/google-analytics';

interface AnalyticsData {
  summary?: any;
  realtime?: any;
  acquisition?: any;
  pages?: any;
  loading: boolean;
  error?: string;
}

export function useAnalytics(type: string = 'summary', dateRange?: { startDate: string; endDate: string }) {
  const [data, setData] = useState<AnalyticsData>({ loading: true });

  useEffect(() => {
    fetchAnalyticsData();
  }, [type, dateRange]);

  const fetchAnalyticsData = async () => {
    setData(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const params = new URLSearchParams({ type });
      if (dateRange) {
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);
      }

      const response = await fetch(`/api/analytics/google?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch analytics data');
      }

      setData({
        loading: false,
        [type]: result.data,
        summary: result.summary,
      });
    } catch (error) {
      setData({
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  return {
    ...data,
    refresh: fetchAnalyticsData,
  };
}

// Event tracking hooks
export function useEventTracking() {
  const track = {
    // Page view (automatically handled by GoogleAnalytics component)
    
    // Button clicks
    buttonClick: (buttonName: string, location?: string) => {
      trackEvent('click', 'button', `${buttonName}${location ? ` - ${location}` : ''}`);
    },

    // Form submissions
    formSubmit: (formName: string, success: boolean = true) => {
      trackEvent(success ? 'form_submit' : 'form_error', 'form', formName);
    },

    // File downloads
    download: (fileName: string, fileType?: string) => {
      trackEvent('download', 'file', fileName, undefined);
    },

    // External links
    externalLink: (url: string) => {
      trackEvent('click', 'external_link', url);
    },

    // Search
    search: (searchTerm: string, resultCount?: number) => {
      trackEvent('search', 'site_search', searchTerm, resultCount);
    },

    // Video interactions
    videoPlay: (videoTitle: string) => {
      trackEvent('play', 'video', videoTitle);
    },

    videoComplete: (videoTitle: string) => {
      trackEvent('complete', 'video', videoTitle);
    },

    // User engagement
    timeOnPage: (seconds: number, pagePath: string) => {
      trackEvent('timing_complete', 'page_timing', pagePath, seconds);
    },

    // Custom events
    custom: (action: string, category: string, label?: string, value?: number) => {
      trackEvent(action, category, label, value);
    },
  };

  return track;
}

// Conversion tracking hook
export function useConversionTracking() {
  const track = {
    // User registration
    signUp: (method: string = 'email') => {
      trackSignUp(method);
      trackConversion('sign_up');
    },

    // User login
    login: (method: string = 'email') => {
      trackLogin(method);
      trackEvent('login', 'auth', method);
    },

    // Subscription/Purchase
    subscribe: (planName: string, value: number, currency: string = 'USD') => {
      trackPurchase(
        `subscription_${Date.now()}`,
        value,
        currency,
        [{
          item_id: planName.toLowerCase().replace(/\s+/g, '_'),
          item_name: planName,
          category: 'subscription',
          quantity: 1,
          price: value,
        }]
      );
      trackConversion('subscribe', value, currency);
    },

    // Trial start
    trialStart: (planName: string) => {
      trackEvent('begin_trial', 'subscription', planName);
      trackConversion('trial_start');
    },

    // Contact form
    contactForm: () => {
      trackEvent('contact', 'lead_generation', 'contact_form');
      trackConversion('contact');
    },

    // Newsletter signup
    newsletter: () => {
      trackEvent('newsletter_signup', 'engagement', 'newsletter');
      trackConversion('newsletter');
    },

    // Demo request
    demoRequest: () => {
      trackEvent('demo_request', 'lead_generation', 'demo');
      trackConversion('demo_request');
    },

    // Custom conversion
    custom: (conversionName: string, value?: number, currency?: string) => {
      trackConversion(conversionName, value, currency);
    },
  };

  return track;
}

// User identification hook
export function useUserTracking() {
  const identify = (userId: string, userProperties?: Record<string, any>) => {
    setUserId(userId);
    
    if (userProperties) {
      // Set user properties for enhanced tracking
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
          user_properties: userProperties,
        });
      }
    }
  };

  const setUserProperty = (propertyName: string, propertyValue: any) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
        user_properties: {
          [propertyName]: propertyValue,
        },
      });
    }
  };

  return {
    identify,
    setUserProperty,
  };
}

// E-commerce tracking hook
export function useEcommerceTracking() {
  const track = {
    // View item
    viewItem: (itemId: string, itemName: string, category: string, price: number) => {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'view_item', {
          currency: 'USD',
          value: price,
          items: [{
            item_id: itemId,
            item_name: itemName,
            category: category,
            price: price,
          }],
        });
      }
    },

    // Add to cart
    addToCart: (itemId: string, itemName: string, category: string, price: number, quantity: number = 1) => {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'add_to_cart', {
          currency: 'USD',
          value: price * quantity,
          items: [{
            item_id: itemId,
            item_name: itemName,
            category: category,
            price: price,
            quantity: quantity,
          }],
        });
      }
    },

    // Begin checkout
    beginCheckout: (items: any[], value: number) => {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'begin_checkout', {
          currency: 'USD',
          value: value,
          items: items,
        });
      }
    },

    // Purchase (already available in conversion tracking)
    purchase: trackPurchase,
  };

  return track;
}