// src/lib/clients/google-search-console.ts

export interface CrawlError {
  url: string;
  errorType: 'notFound' | 'serverError' | 'accessDenied' | 'redirectError' | 'other';
  errorMessage: string;
  detectedDate: Date;
  severity: 'high' | 'medium' | 'low';
}

export interface SearchAnalyticsData {
  query: string;
  page: string;
  country: string;
  device: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  date: Date;
}

export interface SitemapStatus {
  path: string;
  lastSubmitted: Date;
  isPending: boolean;
  isWarning: boolean;
  isError: boolean;
  urlsSubmitted: number;
  urlsIndexed: number;
}

export interface IndexCoverageData {
  valid: number;
  warning: number;
  error: number;
  excluded: number;
  totalPages: number;
  issues: {
    type: string;
    count: number;
    examples: string[];
  }[];
}

export class GoogleSearchConsoleClient {
  private accessToken: string;
  private baseUrl: string = 'https://www.googleapis.com/webmasters/v3';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Submit a sitemap to Google Search Console
   */
  async submitSitemap(siteUrl: string, sitemapUrl: string): Promise<boolean> {
    try {
      const response = await this.makeApiCall(
        `PUT`,
        `/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`,
        {}
      );

      console.log(`GSC: Successfully submitted sitemap ${sitemapUrl} for ${siteUrl}`);
      return true;
    } catch (error) {
      console.error(`GSC: Failed to submit sitemap:`, error);
      return false;
    }
  }

  /**
   * Get crawl errors for a site
   */
  async getCrawlErrors(siteUrl: string): Promise<CrawlError[]> {
    try {
      // In production, this would call the actual GSC API
      // For now, return mock data
      const mockErrors: CrawlError[] = [
        {
          url: `${siteUrl}/broken-page`,
          errorType: 'notFound',
          errorMessage: 'Page not found (404)',
          detectedDate: new Date(Date.now() - 86400000), // 1 day ago
          severity: 'medium'
        },
        {
          url: `${siteUrl}/server-error-page`,
          errorType: 'serverError',
          errorMessage: 'Internal server error (500)',
          detectedDate: new Date(Date.now() - 172800000), // 2 days ago
          severity: 'high'
        }
      ];

      return mockErrors;
    } catch (error) {
      console.error(`GSC: Failed to get crawl errors:`, error);
      return [];
    }
  }

  /**
   * Get search analytics data
   */
  async getSearchAnalytics(
    siteUrl: string,
    startDate: Date,
    endDate: Date,
    dimensions: string[] = ['query', 'page']
  ): Promise<SearchAnalyticsData[]> {
    try {
      const requestBody = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions,
        rowLimit: 1000
      };

      // In production, make actual API call
      // For now, return mock data
      const mockData: SearchAnalyticsData[] = [
        {
          query: 'ai marketing tools',
          page: `${siteUrl}/`,
          country: 'usa',
          device: 'desktop',
          clicks: 45,
          impressions: 1200,
          ctr: 0.0375,
          position: 8.5,
          date: new Date()
        },
        {
          query: 'seo automation software',
          page: `${siteUrl}/features`,
          country: 'usa',
          device: 'mobile',
          clicks: 23,
          impressions: 890,
          ctr: 0.0258,
          position: 12.3,
          date: new Date()
        }
      ];

      return mockData;
    } catch (error) {
      console.error(`GSC: Failed to get search analytics:`, error);
      return [];
    }
  }

  /**
   * Get sitemap status
   */
  async getSitemaps(siteUrl: string): Promise<SitemapStatus[]> {
    try {
      // In production, make actual API call
      const mockSitemaps: SitemapStatus[] = [
        {
          path: '/sitemap.xml',
          lastSubmitted: new Date(Date.now() - 86400000),
          isPending: false,
          isWarning: false,
          isError: false,
          urlsSubmitted: 150,
          urlsIndexed: 142
        }
      ];

      return mockSitemaps;
    } catch (error) {
      console.error(`GSC: Failed to get sitemaps:`, error);
      return [];
    }
  }

  /**
   * Get index coverage data
   */
  async getIndexCoverage(siteUrl: string): Promise<IndexCoverageData> {
    try {
      // In production, make actual API call
      const mockCoverage: IndexCoverageData = {
        valid: 142,
        warning: 5,
        error: 3,
        excluded: 8,
        totalPages: 158,
        issues: [
          {
            type: 'Submitted URL not found (404)',
            count: 2,
            examples: [`${siteUrl}/old-page`, `${siteUrl}/removed-content`]
          },
          {
            type: 'Server error (5xx)',
            count: 1,
            examples: [`${siteUrl}/api/broken-endpoint`]
          }
        ]
      };

      return mockCoverage;
    } catch (error) {
      console.error(`GSC: Failed to get index coverage:`, error);
      throw error;
    }
  }

  /**
   * Request indexing for a specific URL
   */
  async requestIndexing(url: string): Promise<boolean> {
    try {
      // Use Google Indexing API
      const response = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: url,
          type: 'URL_UPDATED'
        })
      });

      if (response.ok) {
        console.log(`GSC: Successfully requested indexing for ${url}`);
        return true;
      } else {
        throw new Error(`Failed to request indexing: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`GSC: Failed to request indexing for ${url}:`, error);
      return false;
    }
  }

  /**
   * Get mobile usability issues
   */
  async getMobileUsabilityIssues(siteUrl: string): Promise<any[]> {
    try {
      // In production, make actual API call
      const mockIssues = [
        {
          issueType: 'MOBILE_FRIENDLY_RULE_FAILURE',
          severity: 'ERROR',
          impactedUrls: [`${siteUrl}/contact`, `${siteUrl}/pricing`]
        }
      ];

      return mockIssues;
    } catch (error) {
      console.error(`GSC: Failed to get mobile usability issues:`, error);
      return [];
    }
  }

  /**
   * Get performance insights
   */
  async getPerformanceInsights(siteUrl: string): Promise<any> {
    try {
      const searchAnalytics = await this.getSearchAnalytics(
        siteUrl, 
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        new Date()
      );

      const insights = {
        totalClicks: searchAnalytics.reduce((sum, data) => sum + data.clicks, 0),
        totalImpressions: searchAnalytics.reduce((sum, data) => sum + data.impressions, 0),
        averageCTR: searchAnalytics.reduce((sum, data) => sum + data.ctr, 0) / searchAnalytics.length,
        averagePosition: searchAnalytics.reduce((sum, data) => sum + data.position, 0) / searchAnalytics.length,
        topQueries: searchAnalytics
          .sort((a, b) => b.clicks - a.clicks)
          .slice(0, 10)
          .map(data => ({
            query: data.query,
            clicks: data.clicks,
            impressions: data.impressions,
            position: data.position
          }))
      };

      return insights;
    } catch (error) {
      console.error(`GSC: Failed to get performance insights:`, error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  private async makeApiCall(method: string, endpoint: string, data?: any): Promise<any> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      };

      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`GSC API error: ${response.status} ${response.statusText}`);
      }

      // Handle empty responses for PUT/DELETE
      if (method === 'PUT' || method === 'DELETE') {
        return { success: true };
      }

      return await response.json();
    } catch (error) {
      console.error('GSC API call failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token if needed
   */
  private async refreshTokenIfNeeded(): Promise<void> {
    // In production, implement token refresh logic
    // This would check if the token is expired and refresh it
  }
}

export default GoogleSearchConsoleClient;
