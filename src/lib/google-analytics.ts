import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { AnalyticsAdminServiceClient } from '@google-analytics/admin';
import { google } from 'googleapis';
import * as Sentry from '@sentry/nextjs';

// Google Analytics Configuration
interface GAConfig {
  propertyId: string;
  measurementId: string;
  serviceAccount?: {
    client_email: string;
    private_key: string;
    project_id: string;
  };
}

class GoogleAnalyticsService {
  private dataClient: BetaAnalyticsDataClient | null = null;
  private adminClient: AnalyticsAdminServiceClient | null = null;
  private analytics: any = null;
  private config: GAConfig;

  constructor() {
    this.config = {
      propertyId: process.env.GA_PROPERTY_ID || '',
      measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '',
      serviceAccount: this.parseServiceAccountKey(),
    };

    this.initializeClients();
  }

  private parseServiceAccountKey() {
    try {
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        return undefined;
      }
      
      // Skip parsing if it's a placeholder value
      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY.includes('placeholder')) {
        return undefined;
      }
      
      return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    } catch (error) {
      console.warn('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:', error);
      return undefined;
    }
  }

  private initializeClients() {
    try {
      if (this.config.serviceAccount) {
        // Initialize with service account
        const credentials = {
          client_email: this.config.serviceAccount.client_email,
          private_key: this.config.serviceAccount.private_key.replace(/\\n/g, '\n'),
        };

        this.dataClient = new BetaAnalyticsDataClient({
          credentials,
          projectId: this.config.serviceAccount.project_id,
        });

        this.adminClient = new AnalyticsAdminServiceClient({
          credentials,
          projectId: this.config.serviceAccount.project_id,
        });

        // Initialize Google APIs client
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: [
            'https://www.googleapis.com/auth/analytics.readonly',
            'https://www.googleapis.com/auth/analytics.edit',
            'https://www.googleapis.com/auth/analytics.manage.users',
          ],
        });

        this.analytics = google.analytics({ version: 'v3', auth });
      }
    } catch (error) {
      console.error('Failed to initialize Google Analytics clients:', error);
      Sentry.captureException(error as Error);
    }
  }

  // Real-time Analytics Data
  async getRealtimeData() {
    try {
      if (!this.dataClient || !this.config.propertyId) {
        throw new Error('Google Analytics not properly configured');
      }

      const [response] = await this.dataClient.runRealtimeReport({
        property: `properties/${this.config.propertyId}`,
        dimensions: [
          { name: 'country' },
          { name: 'deviceCategory' },
        ],
        metrics: [
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
        ],
      });

      return {
        success: true,
        data: response,
        activeUsers: response.totals?.[0]?.metricValues?.[0]?.value || '0',
        pageViews: response.totals?.[0]?.metricValues?.[1]?.value || '0',
      };
    } catch (error) {
      console.error('Failed to get realtime data:', error);
      Sentry.captureException(error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Historical Analytics Data
  async getAnalyticsData(startDate: string, endDate: string) {
    try {
      if (!this.dataClient || !this.config.propertyId) {
        throw new Error('Google Analytics not properly configured');
      }

      const [response] = await this.dataClient.runReport({
        property: `properties/${this.config.propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'date' },
          { name: 'pagePath' },
          { name: 'country' },
          { name: 'deviceCategory' },
        ],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
          { name: 'conversions' },
        ],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      });

      return {
        success: true,
        data: response,
        summary: {
          totalUsers: response.totals?.[0]?.metricValues?.[0]?.value || '0',
          totalSessions: response.totals?.[0]?.metricValues?.[1]?.value || '0',
          totalPageViews: response.totals?.[0]?.metricValues?.[2]?.value || '0',
          bounceRate: response.totals?.[0]?.metricValues?.[3]?.value || '0',
          avgSessionDuration: response.totals?.[0]?.metricValues?.[4]?.value || '0',
          conversions: response.totals?.[0]?.metricValues?.[5]?.value || '0',
        },
      };
    } catch (error) {
      console.error('Failed to get analytics data:', error);
      Sentry.captureException(error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Get User Acquisition Data
  async getUserAcquisitionData(startDate: string, endDate: string) {
    try {
      if (!this.dataClient || !this.config.propertyId) {
        throw new Error('Google Analytics not properly configured');
      }

      const [response] = await this.dataClient.runReport({
        property: `properties/${this.config.propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'sessionDefaultChannelGroup' },
          { name: 'sessionSource' },
          { name: 'sessionMedium' },
        ],
        metrics: [
          { name: 'newUsers' },
          { name: 'sessions' },
          { name: 'conversions' },
        ],
        orderBys: [{ metric: { metricName: 'newUsers' }, desc: true }],
      });

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      console.error('Failed to get user acquisition data:', error);
      Sentry.captureException(error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Get Top Pages Data
  async getTopPagesData(startDate: string, endDate: string) {
    try {
      if (!this.dataClient || !this.config.propertyId) {
        throw new Error('Google Analytics not properly configured');
      }

      const [response] = await this.dataClient.runReport({
        property: `properties/${this.config.propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'pagePath' },
          { name: 'pageTitle' },
        ],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
        ],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 20,
      });

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      console.error('Failed to get top pages data:', error);
      Sentry.captureException(error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Admin API - Create Property
  async createProperty(accountId: string, propertyName: string, websiteUrl: string) {
    try {
      if (!this.adminClient) {
        throw new Error('Google Analytics Admin client not initialized');
      }

      const [property] = await this.adminClient.createProperty({
        parent: `accounts/${accountId}`,
        property: {
          displayName: propertyName,
          industryCategory: 'TECHNOLOGY',
          timeZone: 'America/Los_Angeles',
          currencyCode: 'USD',
        },
      });

      return {
        success: true,
        property,
        propertyId: property.name?.split('/')[1],
      };
    } catch (error) {
      console.error('Failed to create property:', error);
      Sentry.captureException(error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Admin API - List Properties
  async listProperties(accountId?: string) {
    try {
      if (!this.adminClient) {
        throw new Error('Google Analytics Admin client not initialized');
      }

      const [properties] = await this.adminClient.listProperties({
        filter: accountId ? `parent:accounts/${accountId}` : undefined,
      });

      return {
        success: true,
        properties: properties || [],
      };
    } catch (error) {
      console.error('Failed to list properties:', error);
      Sentry.captureException(error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Admin API - Create Data Stream
  async createWebDataStream(propertyId: string, websiteUrl: string) {
    try {
      if (!this.adminClient) {
        throw new Error('Google Analytics Admin client not initialized');
      }

      const [dataStream] = await this.adminClient.createDataStream({
        parent: `properties/${propertyId}`,
        dataStream: {
          type: 'WEB_DATA_STREAM',
          displayName: 'Web Stream',
          webStreamData: {
            defaultUri: websiteUrl,
          },
        },
      });

      return {
        success: true,
        dataStream,
        measurementId: (dataStream as any).webStreamData?.measurementId,
      };
    } catch (error) {
      console.error('Failed to create web data stream:', error);
      Sentry.captureException(error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Get Account Summary
  async getAccountSummaries() {
    try {
      if (!this.adminClient) {
        throw new Error('Google Analytics Admin client not initialized');
      }

      const [accountSummaries] = await this.adminClient.listAccountSummaries({});

      return {
        success: true,
        accounts: accountSummaries || [],
      };
    } catch (error) {
      console.error('Failed to get account summaries:', error);
      Sentry.captureException(error as Error);
      return { success: false, error: (error as Error).message };
    }
  }
}

// Export singleton instance
export const googleAnalytics = new GoogleAnalyticsService();

// Utility functions for client-side tracking
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Page view tracking
export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_location: url,
    });
  }
};

// Event tracking
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Conversion tracking
export const trackConversion = (conversionId: string, value?: number, currency?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: conversionId,
      value: value,
      currency: currency || 'USD',
    });
  }
};

// User identification
export const setUserId = (userId: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      user_id: userId,
    });
  }
};

// Custom parameters
export const setUserProperties = (properties: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      custom_map: properties,
    });
  }
};

// E-commerce tracking
export const trackPurchase = (transactionId: string, value: number, currency: string, items: any[]) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: transactionId,
      value: value,
      currency: currency,
      items: items,
    });
  }
};

// Sign up tracking
export const trackSignUp = (method: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'sign_up', {
      method: method,
    });
  }
};

// Login tracking
export const trackLogin = (method: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'login', {
      method: method,
    });
  }
};

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}