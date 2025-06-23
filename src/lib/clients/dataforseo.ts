// src/lib/clients/dataforseo.ts

export interface BacklinkOpportunity {
  domain: string;
  domainAuthority: number;
  pageUrl: string;
  contactEmail: string;
  relevanceScore: number;
  linkingToDomain: string;
  anchorText: string;
  linkType: 'dofollow' | 'nofollow';
  publishDate: Date;
  trafficEstimate: number;
}

export interface BacklinkAnalysis {
  url: string;
  isDofollow: boolean;
  anchorText: string;
  domainAuthority: number;
  pageAuthority: number;
  isIndexed: boolean;
  discoveredDate: Date;
}

export interface CompetitorBacklinks {
  domain: string;
  totalBacklinks: number;
  uniqueDomains: number;
  topBacklinks: BacklinkOpportunity[];
}

export class DataForSEOClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.dataforseo.com/v3';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Find backlink gaps between client domain and competitors
   */
  async findBacklinkGaps(clientDomain: string, competitors: string[]): Promise<BacklinkOpportunity[]> {
    try {
      const opportunities: BacklinkOpportunity[] = [];
      
      // Get client's existing backlinks
      const clientBacklinks = await this.getBacklinks(clientDomain);
      const clientLinkingDomains = new Set(clientBacklinks.map(link => link.domain));

      // Analyze each competitor
      for (const competitor of competitors) {
        const competitorBacklinks = await this.getBacklinks(competitor);
        
        // Find domains linking to competitor but not client
        const gaps = competitorBacklinks.filter(link => 
          !clientLinkingDomains.has(link.domain) && 
          link.domainAuthority > 20 // Only high-quality domains
        );

        // Score and add opportunities
        const scoredGaps = gaps.map(gap => ({
          ...gap,
          linkingToDomain: competitor,
          relevanceScore: this.calculateRelevanceScore(gap, clientDomain),
          contactEmail: this.findContactEmail(gap.domain)
        }));

        opportunities.push(...scoredGaps);
      }

      // Sort by relevance and domain authority
      return opportunities
        .sort((a, b) => (b.relevanceScore * b.domainAuthority) - (a.relevanceScore * a.domainAuthority))
        .slice(0, 50); // Top 50 opportunities

    } catch (error) {
      console.error('DataForSEO: Failed to find backlink gaps:', error);
      throw new Error('Failed to analyze backlink opportunities');
    }
  }

  /**
   * Get backlinks for a specific domain
   */
  async getBacklinks(domain: string): Promise<BacklinkOpportunity[]> {
    try {
      // In production, this would make actual API calls to DataForSEO
      // For now, return mock data
      const mockBacklinks: BacklinkOpportunity[] = [
        {
          domain: 'techcrunch.com',
          domainAuthority: 94,
          pageUrl: 'https://techcrunch.com/2024/ai-marketing-trends',
          contactEmail: 'editor@techcrunch.com',
          relevanceScore: 0.85,
          linkingToDomain: domain,
          anchorText: 'AI marketing platform',
          linkType: 'dofollow',
          publishDate: new Date('2024-01-15'),
          trafficEstimate: 15000
        },
        {
          domain: 'searchengineland.com',
          domainAuthority: 78,
          pageUrl: 'https://searchengineland.com/seo-tools-review',
          contactEmail: 'editorial@searchengineland.com',
          relevanceScore: 0.92,
          linkingToDomain: domain,
          anchorText: 'SEO optimization tools',
          linkType: 'dofollow',
          publishDate: new Date('2024-02-01'),
          trafficEstimate: 8500
        }
      ];

      return mockBacklinks;
    } catch (error) {
      console.error(`DataForSEO: Failed to get backlinks for ${domain}:`, error);
      return [];
    }
  }

  /**
   * Analyze a specific backlink
   */
  async analyzeBacklink(url: string): Promise<BacklinkAnalysis> {
    try {
      // In production, this would analyze the actual backlink
      const analysis: BacklinkAnalysis = {
        url,
        isDofollow: true,
        anchorText: 'Zenith platform',
        domainAuthority: 65,
        pageAuthority: 45,
        isIndexed: true,
        discoveredDate: new Date()
      };

      return analysis;
    } catch (error) {
      console.error(`DataForSEO: Failed to analyze backlink ${url}:`, error);
      throw new Error('Failed to analyze backlink');
    }
  }

  /**
   * Get competitor backlink profile
   */
  async getCompetitorProfile(domain: string): Promise<CompetitorBacklinks> {
    try {
      const backlinks = await this.getBacklinks(domain);
      
      return {
        domain,
        totalBacklinks: backlinks.length,
        uniqueDomains: new Set(backlinks.map(link => link.domain)).size,
        topBacklinks: backlinks.slice(0, 10)
      };
    } catch (error) {
      console.error(`DataForSEO: Failed to get competitor profile for ${domain}:`, error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  private calculateRelevanceScore(opportunity: BacklinkOpportunity, clientDomain: string): number {
    // Calculate relevance based on content similarity, niche alignment, etc.
    // This would use ML/NLP in production
    let score = 0.5; // Base score

    // Increase score for relevant anchor text
    if (opportunity.anchorText.toLowerCase().includes('marketing') || 
        opportunity.anchorText.toLowerCase().includes('seo') ||
        opportunity.anchorText.toLowerCase().includes('saas')) {
      score += 0.3;
    }

    // Increase score for high traffic pages
    if (opportunity.trafficEstimate > 10000) {
      score += 0.2;
    }

    // Increase score for dofollow links
    if (opportunity.linkType === 'dofollow') {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  private findContactEmail(domain: string): string {
    // In production, this would scrape contact information
    // For now, generate logical contact emails
    const emailPatterns = [
      `editor@${domain}`,
      `hello@${domain}`,
      `contact@${domain}`,
      `info@${domain}`
    ];

    return emailPatterns[0]; // Return first pattern as default
  }

  private async makeApiCall(endpoint: string, data: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('DataForSEO API call failed:', error);
      throw error;
    }
  }
}

export default DataForSEOClient;
