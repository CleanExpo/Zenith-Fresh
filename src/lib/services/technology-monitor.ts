/**
 * Technology Monitor Service - Web Scraping and Content Analysis
 * 
 * Implements intelligent web scraping and content analysis for the InnovationAgent.
 * Monitors tech news, GitHub trends, research papers, and competitor updates.
 */

import { WebFetch } from '@/lib/tools/web-fetch';
import { aiSearch } from '@/lib/ai/ai-search';
import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';

interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  author?: string;
  publishedDate?: Date;
  tags?: string[];
  category?: string;
  summary?: string;
  metadata?: Record<string, any>;
}

interface TechArticle extends ScrapedContent {
  source: string;
  relevanceScore: number;
  technologies: string[];
  companies: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  innovation: boolean;
}

interface GitHubRepository {
  fullName: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  lastUpdated: Date;
  topics: string[];
  license?: string;
  homepage?: string;
  trendingScore: number;
}

interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  arxivId?: string;
  doi?: string;
  categories: string[];
  publishedDate: Date;
  pdfUrl?: string;
  relevanceScore: number;
  keyFindings: string[];
}

export class TechnologyMonitor {
  private webFetch: WebFetch;
  private readonly SCRAPING_DELAY = 2000; // 2 seconds between requests
  private readonly CACHE_TTL = 14400; // 4 hours
  
  constructor() {
    this.webFetch = new WebFetch();
  }

  /**
   * Scrape and analyze tech news from multiple sources
   */
  async scrapeTechNews(sources: { name: string; url: string; selector?: string }[]): Promise<TechArticle[]> {
    const articles: TechArticle[] = [];
    
    for (const source of sources) {
      try {
        const cacheKey = `tech_news:${source.name}:${new Date().toISOString().split('T')[0]}`;
        
        // Check cache
        if (redis) {
          const cached = await redis.get(cacheKey);
          if (cached) {
            articles.push(...JSON.parse(cached));
            continue;
          }
        }

        // Scrape articles
        const scrapedArticles = await this.scrapeNewsSource(source);
        
        // Analyze each article
        for (const article of scrapedArticles) {
          const analyzed = await this.analyzeTechArticle(article, source.name);
          if (analyzed.relevanceScore > 0.5) {
            articles.push(analyzed);
          }
        }

        // Cache results
        const sourceArticles = articles.filter(a => a.source === source.name);
        if (redis && sourceArticles.length > 0) {
          await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(sourceArticles));
        }

        // Respect rate limits
        await this.delay(this.SCRAPING_DELAY);
      } catch (error) {
        console.error(`Error scraping ${source.name}:`, error);
      }
    }

    return articles.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Monitor GitHub trending repositories
   */
  async monitorGitHubTrends(languages: string[] = ['typescript', 'python', 'rust', 'go']): Promise<GitHubRepository[]> {
    const repositories: GitHubRepository[] = [];
    
    for (const language of languages) {
      try {
        const cacheKey = `github_trends:${language}:${new Date().toISOString().split('T')[0]}`;
        
        // Check cache
        if (redis) {
          const cached = await redis.get(cacheKey);
          if (cached) {
            repositories.push(...JSON.parse(cached));
            continue;
          }
        }

        // Fetch trending repositories
        const url = `https://github.com/trending/${language}?since=daily`;
        const content = await this.webFetch.fetch(url);
        
        // Parse repositories
        const repos = await this.parseGitHubTrending(content, language);
        
        // Calculate trending score
        for (const repo of repos) {
          repo.trendingScore = this.calculateTrendingScore(repo);
          repositories.push(repo);
        }

        // Cache results
        if (redis && repos.length > 0) {
          await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(repos));
        }

        await this.delay(this.SCRAPING_DELAY);
      } catch (error) {
        console.error(`Error fetching GitHub trends for ${language}:`, error);
      }
    }

    return repositories.sort((a, b) => b.trendingScore - a.trendingScore);
  }

  /**
   * Fetch and analyze research papers
   */
  async fetchResearchPapers(categories: string[] = ['cs.AI', 'cs.LG', 'cs.CL']): Promise<ResearchPaper[]> {
    const papers: ResearchPaper[] = [];
    
    for (const category of categories) {
      try {
        const cacheKey = `research_papers:${category}:${new Date().toISOString().split('T')[0]}`;
        
        // Check cache
        if (redis) {
          const cached = await redis.get(cacheKey);
          if (cached) {
            papers.push(...JSON.parse(cached));
            continue;
          }
        }

        // Fetch from arXiv API
        const arxivPapers = await this.fetchArxivPapers(category);
        
        // Analyze relevance
        for (const paper of arxivPapers) {
          const analyzed = await this.analyzeResearchPaper(paper);
          if (analyzed.relevanceScore > 0.6) {
            papers.push(analyzed);
          }
        }

        // Cache results
        const categoryPapers = papers.filter(p => p.categories.includes(category));
        if (redis && categoryPapers.length > 0) {
          await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(categoryPapers));
        }

        await this.delay(this.SCRAPING_DELAY);
      } catch (error) {
        console.error(`Error fetching papers for ${category}:`, error);
      }
    }

    return papers.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Monitor competitor websites for feature updates
   */
  async monitorCompetitorFeatures(competitors: { name: string; url: string; selectors?: any }[]): Promise<any[]> {
    const updates: any[] = [];
    
    for (const competitor of competitors) {
      try {
        const cacheKey = `competitor:${competitor.name}:features:${new Date().toISOString().split('T')[0]}`;
        
        // Check cache
        if (redis) {
          const cached = await redis.get(cacheKey);
          if (cached) {
            updates.push(...JSON.parse(cached));
            continue;
          }
        }

        // Scrape competitor site
        const features = await this.scrapeCompetitorFeatures(competitor);
        
        // Compare with previous snapshot
        const changes = await this.detectFeatureChanges(competitor.name, features);
        
        if (changes.length > 0) {
          updates.push({
            competitor: competitor.name,
            url: competitor.url,
            changes,
            detectedAt: new Date()
          });
        }

        // Cache results
        if (redis && changes.length > 0) {
          await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(changes));
        }

        await this.delay(this.SCRAPING_DELAY);
      } catch (error) {
        console.error(`Error monitoring ${competitor.name}:`, error);
      }
    }

    return updates;
  }

  /**
   * Intelligent content extraction using AI
   */
  async extractContentIntelligently(url: string, type: 'article' | 'research' | 'product'): Promise<ScrapedContent> {
    try {
      const rawContent = await this.webFetch.fetch(url);
      
      const prompt = `
        Extract the following information from this ${type} content:
        1. Title
        2. Main content/summary (max 500 words)
        3. Key technologies mentioned
        4. Companies or organizations mentioned
        5. Publication date
        6. Author(s)
        7. Tags or categories
        
        Content: ${rawContent.substring(0, 5000)}
        
        Return as JSON format.
      `;

      const extracted = await aiSearch.generateResponse(prompt);
      
      try {
        const parsed = JSON.parse(extracted);
        return {
          url,
          title: parsed.title || 'Untitled',
          content: parsed.content || parsed.summary || '',
          author: parsed.author || parsed.authors?.join(', '),
          publishedDate: parsed.date ? new Date(parsed.date) : undefined,
          tags: parsed.tags || parsed.categories || [],
          summary: parsed.summary,
          metadata: {
            technologies: parsed.technologies || [],
            companies: parsed.companies || []
          }
        };
      } catch (e) {
        // Fallback to basic extraction
        return {
          url,
          title: this.extractTitle(rawContent),
          content: this.extractMainContent(rawContent),
          publishedDate: new Date()
        };
      }
    } catch (error) {
      console.error(`Error extracting content from ${url}:`, error);
      throw error;
    }
  }

  // Private helper methods

  private async scrapeNewsSource(source: { name: string; url: string; selector?: string }): Promise<ScrapedContent[]> {
    const articles: ScrapedContent[] = [];
    
    try {
      // For MVP, simulate scraping with intelligent extraction
      const mainPageContent = await this.webFetch.fetch(source.url);
      
      // Extract article links using AI
      const prompt = `
        Extract article URLs and titles from this news page HTML.
        Focus on tech/innovation articles from the last 24 hours.
        Return as JSON array with {url, title} objects.
        
        HTML: ${mainPageContent.substring(0, 10000)}
      `;

      const extracted = await aiSearch.generateResponse(prompt);
      
      try {
        const articleLinks = JSON.parse(extracted);
        
        // Fetch individual articles (limit to top 5)
        for (const link of articleLinks.slice(0, 5)) {
          try {
            const article = await this.extractContentIntelligently(
              link.url.startsWith('http') ? link.url : `${source.url}${link.url}`,
              'article'
            );
            articles.push(article);
          } catch (e) {
            console.error(`Error fetching article ${link.url}:`, e);
          }
        }
      } catch (e) {
        console.error('Error parsing article links:', e);
      }
    } catch (error) {
      console.error(`Error scraping ${source.name}:`, error);
    }

    return articles;
  }

  private async analyzeTechArticle(article: ScrapedContent, source: string): Promise<TechArticle> {
    const prompt = `
      Analyze this tech article and determine:
      1. Relevance score (0-1) for innovation/technology advancement
      2. Key technologies mentioned
      3. Companies involved
      4. Overall sentiment (positive/neutral/negative)
      5. Is this about innovation? (true/false)
      
      Article: ${article.title}
      ${article.content?.substring(0, 1000)}
      
      Return as JSON.
    `;

    const analysis = await aiSearch.generateResponse(prompt);
    
    try {
      const parsed = JSON.parse(analysis);
      return {
        ...article,
        source,
        relevanceScore: parsed.relevanceScore || 0.5,
        technologies: parsed.technologies || [],
        companies: parsed.companies || [],
        sentiment: parsed.sentiment || 'neutral',
        innovation: parsed.innovation || false
      };
    } catch (e) {
      // Fallback
      return {
        ...article,
        source,
        relevanceScore: 0.5,
        technologies: article.metadata?.technologies || [],
        companies: article.metadata?.companies || [],
        sentiment: 'neutral',
        innovation: article.title.toLowerCase().includes('innovat') || 
                   article.title.toLowerCase().includes('breakthrough')
      };
    }
  }

  private async parseGitHubTrending(content: string, language: string): Promise<GitHubRepository[]> {
    // Use AI to extract repository information
    const prompt = `
      Extract trending GitHub repositories from this HTML content.
      For each repository, extract:
      1. Full name (owner/repo)
      2. Description
      3. Programming language
      4. Star count
      5. Fork count
      6. Topics/tags
      
      HTML: ${content.substring(0, 15000)}
      
      Return as JSON array.
    `;

    const extracted = await aiSearch.generateResponse(prompt);
    
    try {
      const repos = JSON.parse(extracted);
      return repos.map((repo: any) => ({
        fullName: repo.fullName || repo.name,
        description: repo.description || '',
        language: repo.language || language,
        stars: parseInt(repo.stars) || 0,
        forks: parseInt(repo.forks) || 0,
        lastUpdated: new Date(),
        topics: repo.topics || [],
        trendingScore: 0 // Will be calculated
      }));
    } catch (e) {
      console.error('Error parsing GitHub repos:', e);
      return [];
    }
  }

  private calculateTrendingScore(repo: GitHubRepository): number {
    // Weighted scoring based on various factors
    const starsWeight = 0.4;
    const forksWeight = 0.2;
    const recencyWeight = 0.2;
    const topicsWeight = 0.2;

    const normalizedStars = Math.min(repo.stars / 10000, 1);
    const normalizedForks = Math.min(repo.forks / 1000, 1);
    const hasRelevantTopics = repo.topics.some(t => 
      ['ai', 'machine-learning', 'api', 'framework', 'performance'].includes(t.toLowerCase())
    ) ? 1 : 0.5;

    return (
      normalizedStars * starsWeight +
      normalizedForks * forksWeight +
      1 * recencyWeight + // Assuming all are recent
      hasRelevantTopics * topicsWeight
    ) * 100;
  }

  private async fetchArxivPapers(category: string): Promise<any[]> {
    // Simulate arXiv API call
    const url = `http://export.arxiv.org/api/query?search_query=cat:${category}&start=0&max_results=10&sortBy=submittedDate&sortOrder=descending`;
    
    try {
      const response = await this.webFetch.fetch(url);
      
      // Parse XML response using AI
      const prompt = `
        Extract research papers from this arXiv XML response.
        For each paper extract:
        1. ID
        2. Title
        3. Authors (array)
        4. Abstract
        5. Categories
        6. Published date
        7. PDF URL
        
        XML: ${response.substring(0, 20000)}
        
        Return as JSON array.
      `;

      const extracted = await aiSearch.generateResponse(prompt);
      return JSON.parse(extracted);
    } catch (error) {
      console.error(`Error fetching arXiv papers:`, error);
      return [];
    }
  }

  private async analyzeResearchPaper(paper: any): Promise<ResearchPaper> {
    const prompt = `
      Analyze this research paper for business relevance:
      1. Relevance score (0-1) for practical application
      2. Key findings (max 3 bullet points)
      3. Potential business applications
      
      Title: ${paper.title}
      Abstract: ${paper.abstract}
      
      Return as JSON.
    `;

    const analysis = await aiSearch.generateResponse(prompt);
    
    try {
      const parsed = JSON.parse(analysis);
      return {
        id: paper.id,
        title: paper.title,
        authors: paper.authors || [],
        abstract: paper.abstract,
        arxivId: paper.id,
        categories: paper.categories || [paper.category],
        publishedDate: new Date(paper.publishedDate || paper.published),
        pdfUrl: paper.pdfUrl || paper.pdf,
        relevanceScore: parsed.relevanceScore || 0.5,
        keyFindings: parsed.keyFindings || []
      };
    } catch (e) {
      return {
        ...paper,
        relevanceScore: 0.5,
        keyFindings: []
      };
    }
  }

  private async scrapeCompetitorFeatures(competitor: { name: string; url: string; selectors?: any }): Promise<any[]> {
    try {
      const content = await this.webFetch.fetch(`${competitor.url}/features`);
      
      const prompt = `
        Extract product features from this competitor website.
        Look for:
        1. Feature names and descriptions
        2. Pricing information
        3. New or recently updated features
        4. Technology stack mentions
        
        HTML: ${content.substring(0, 15000)}
        
        Return as JSON array of features.
      `;

      const extracted = await aiSearch.generateResponse(prompt);
      return JSON.parse(extracted);
    } catch (error) {
      console.error(`Error scraping ${competitor.name} features:`, error);
      return [];
    }
  }

  private async detectFeatureChanges(competitorName: string, currentFeatures: any[]): Promise<any[]> {
    try {
      // Get previous snapshot from database
      const previousSnapshot = await prisma.competitorSnapshot.findFirst({
        where: { competitorName },
        orderBy: { createdAt: 'desc' }
      });

      if (!previousSnapshot) {
        // First time tracking - save snapshot
        await prisma.competitorSnapshot.create({
          data: {
            competitorName,
            features: currentFeatures,
            featureCount: currentFeatures.length
          }
        });
        return currentFeatures.map(f => ({ ...f, changeType: 'new' }));
      }

      // Compare features
      const prevFeatures = previousSnapshot.features as any[];
      const changes: any[] = [];

      // Find new features
      for (const feature of currentFeatures) {
        const exists = prevFeatures.find(p => 
          p.name === feature.name || p.title === feature.title
        );
        
        if (!exists) {
          changes.push({ ...feature, changeType: 'new' });
        } else if (JSON.stringify(exists) !== JSON.stringify(feature)) {
          changes.push({ ...feature, changeType: 'updated', previous: exists });
        }
      }

      // Find removed features
      for (const prevFeature of prevFeatures) {
        const stillExists = currentFeatures.find(c => 
          c.name === prevFeature.name || c.title === prevFeature.title
        );
        
        if (!stillExists) {
          changes.push({ ...prevFeature, changeType: 'removed' });
        }
      }

      // Update snapshot if changes detected
      if (changes.length > 0) {
        await prisma.competitorSnapshot.create({
          data: {
            competitorName,
            features: currentFeatures,
            featureCount: currentFeatures.length,
            changes
          }
        });
      }

      return changes;
    } catch (error) {
      console.error(`Error detecting changes for ${competitorName}:`, error);
      return [];
    }
  }

  // Utility methods

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private extractTitle(html: string): string {
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    return titleMatch ? titleMatch[1] : 'Untitled';
  }

  private extractMainContent(html: string): string {
    // Simple content extraction - in production use proper HTML parsing
    const stripped = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    return stripped.substring(0, 1000).trim();
  }

  /**
   * Monitor conference announcements
   */
  async monitorConferences(conferences: { name: string; keywords: string[]; url?: string }[]): Promise<any[]> {
    const announcements: any[] = [];
    
    for (const conference of conferences) {
      try {
        // Search for conference news
        const searchQuery = `${conference.name} ${new Date().getFullYear()} announcements AI`;
        const results = await this.searchForConferenceNews(searchQuery, conference);
        
        if (results.length > 0) {
          announcements.push({
            conference: conference.name,
            announcements: results,
            lastChecked: new Date()
          });
        }
      } catch (error) {
        console.error(`Error monitoring ${conference.name}:`, error);
      }
    }

    return announcements;
  }

  private async searchForConferenceNews(query: string, conference: any): Promise<any[]> {
    // Use web search to find conference announcements
    const prompt = `
      Search for recent announcements about ${conference.name}.
      Look for:
      1. Keynote announcements
      2. New product/feature launches
      3. Technology breakthroughs
      4. Partnership announcements
      
      Focus on AI, ML, and technology innovations.
      Return top 5 most relevant announcements as JSON.
    `;

    try {
      const results = await aiSearch.generateResponse(prompt);
      return JSON.parse(results);
    } catch (error) {
      console.error(`Error searching conference news:`, error);
      return [];
    }
  }
}

export const technologyMonitor = new TechnologyMonitor();

// Export types
export type {
  ScrapedContent,
  TechArticle,
  GitHubRepository,
  ResearchPaper
};