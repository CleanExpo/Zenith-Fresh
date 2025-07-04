import crypto from 'crypto';

// DataForSEO API Configuration
const DATAFORSEO_API_KEY = process.env.DATAFORSEO_API_KEY!;
const DATAFORSEO_BASE_URL = 'https://api.dataforseo.com/v3';

// Helper function to create authorization header
function getAuthHeader(): string {
  // DataForSEO uses API key authentication
  return `Bearer ${DATAFORSEO_API_KEY}`;
}

// Types for DataForSEO responses
export interface KeywordRankingData {
  keyword: string;
  position: number;
  volume: number;
  difficulty: number;
  url: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export interface LocalGridData {
  position: { lat: number; lng: number };
  ranking: number;
  business: string;
  address: string;
}

export interface CompetitorData {
  domain: string;
  visibility: number;
  traffic: number;
  keywords: number;
}

// DataForSEO Service Class
export class DataForSEOService {
  private headers: HeadersInit;

  constructor() {
    this.headers = {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    };
  }

  // Get keyword rankings for a domain
  async getKeywordRankings(
    keywords: string[],
    domain: string,
    location?: string
  ): Promise<KeywordRankingData[]> {
    try {
      const tasks = keywords.map(keyword => ({
        language_code: "en",
        location_code: location || 2840, // Default to US
        keyword: keyword,
        domain: domain,
        depth: 100,
      }));

      // Create tasks batch
      const createResponse = await fetch(
        `${DATAFORSEO_BASE_URL}/serp/google/organic/task_post`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(tasks),
        }
      );

      if (!createResponse.ok) {
        throw new Error(`DataForSEO API error: ${createResponse.statusText}`);
      }

      const createResult = await createResponse.json();
      
      // Wait for results (in production, use webhooks or polling)
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Get results
      const taskIds = createResult.tasks.map((task: any) => task.id);
      const rankings: KeywordRankingData[] = [];

      for (const taskId of taskIds) {
        const resultResponse = await fetch(
          `${DATAFORSEO_BASE_URL}/serp/google/organic/task_get/regular/${taskId}`,
          {
            headers: this.headers,
          }
        );

        if (resultResponse.ok) {
          const resultData = await resultResponse.json();
          const task = resultData.tasks[0];
          
          if (task.result && task.result[0].items) {
            const items = task.result[0].items;
            const domainItem = items.find((item: any) => 
              item.domain === domain || item.url.includes(domain)
            );

            if (domainItem) {
              rankings.push({
                keyword: task.data.keyword,
                position: domainItem.rank_group,
                volume: task.result[0].keyword_data?.keyword_info?.search_volume || 0,
                difficulty: task.result[0].keyword_data?.keyword_info?.competition || 0,
                url: domainItem.url,
                change: 0, // Calculate from historical data
                trend: 'stable',
              });
            } else {
              // Not ranking in top 100
              rankings.push({
                keyword: task.data.keyword,
                position: 100,
                volume: task.result[0].keyword_data?.keyword_info?.search_volume || 0,
                difficulty: task.result[0].keyword_data?.keyword_info?.competition || 0,
                url: '',
                change: 0,
                trend: 'stable',
              });
            }
          }
        }
      }

      return rankings;
    } catch (error) {
      console.error('DataForSEO API Error:', error);
      throw error;
    }
  }

  // Get local grid rankings
  async getLocalGridRankings(
    keyword: string,
    location: string,
    gridSize: number = 5
  ): Promise<LocalGridData[]> {
    try {
      // Parse location to get coordinates
      const locationParts = location.split(',');
      const centerLat = 40.7128; // Example: NYC latitude
      const centerLng = -74.0060; // Example: NYC longitude
      
      const gridData: LocalGridData[] = [];
      const step = 0.01; // Approximately 1km

      // Create grid points
      const halfSize = Math.floor(gridSize / 2);
      
      for (let i = -halfSize; i <= halfSize; i++) {
        for (let j = -halfSize; j <= halfSize; j++) {
          const lat = centerLat + (i * step);
          const lng = centerLng + (j * step);

          const task = {
            keyword: keyword,
            location_coordinate: `${lat},${lng}`,
            language_code: "en",
            depth: 20,
          };

          const response = await fetch(
            `${DATAFORSEO_BASE_URL}/serp/google/maps/task_post`,
            {
              method: 'POST',
              headers: this.headers,
              body: JSON.stringify([task]),
            }
          );

          if (response.ok) {
            const result = await response.json();
            // Process results (simplified for example)
            gridData.push({
              position: { lat, lng },
              ranking: Math.floor(Math.random() * 20) + 1, // Mock data
              business: 'Your Business',
              address: '123 Main St',
            });
          }
        }
      }

      return gridData;
    } catch (error) {
      console.error('DataForSEO Local Grid Error:', error);
      throw error;
    }
  }

  // Get competitor analysis
  async getCompetitorAnalysis(
    domain: string,
    competitors: string[]
  ): Promise<CompetitorData[]> {
    try {
      const tasks = [domain, ...competitors].map(d => ({
        target: d,
        location_code: 2840, // US
        language_code: "en",
      }));

      const response = await fetch(
        `${DATAFORSEO_BASE_URL}/domain_analytics/google/organic/domain_rank_overview/live`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(tasks),
        }
      );

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.statusText}`);
      }

      const result = await response.json();
      const competitorData: CompetitorData[] = [];

      if (result.tasks) {
        for (const task of result.tasks) {
          if (task.result && task.result[0]) {
            const metrics = task.result[0].metrics;
            competitorData.push({
              domain: task.data.target,
              visibility: metrics?.organic?.etv || 0,
              traffic: metrics?.organic?.count || 0,
              keywords: metrics?.organic?.pos_1 + metrics?.organic?.pos_2_10 || 0,
            });
          }
        }
      }

      return competitorData;
    } catch (error) {
      console.error('DataForSEO Competitor Analysis Error:', error);
      throw error;
    }
  }

  // Calculate API cost for tracking
  calculateCost(endpoint: string, count: number = 1): number {
    const costMap: Record<string, number> = {
      'serp/google/organic': 0.01,
      'serp/google/maps': 0.015,
      'domain_analytics': 0.02,
    };

    const baseCost = Object.entries(costMap).find(([key]) => 
      endpoint.includes(key)
    )?.[1] || 0.01;

    return baseCost * count;
  }
}

// Export singleton instance
export const dataForSEO = new DataForSEOService();
