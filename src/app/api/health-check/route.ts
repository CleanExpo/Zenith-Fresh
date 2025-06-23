import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL format
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
      if (!['http:', 'https:'].includes(targetUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const startTime = Date.now();
    let responseData: any = {
      url: targetUrl.href,
      status: 'Unknown',
      responseTime: 0,
      ssl: false,
      error: null,
      seo: {
        title: null,
        description: null,
        keywords: [],
        topKeywords: [],
        h1Tags: [],
        imageCount: 0,
        linkCount: 0,
        pageRank: null,
        traffic: {
          estimated: null,
          rank: null,
          source: 'Estimated'
        }
      }
    };

    try {
      // Perform the health check with full content
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for full analysis

      const response = await fetch(targetUrl.href, {
        method: 'GET', // Changed to GET to analyze content
        signal: controller.signal,
        headers: {
          'User-Agent': 'Zenith-SEO-Analyzer/1.0 (Mozilla/5.0 compatible)'
        }
      });

      clearTimeout(timeoutId);
      
      const endTime = Date.now();
      responseData.responseTime = endTime - startTime;
      responseData.ssl = targetUrl.protocol === 'https:';

      if (response.ok) {
        responseData.status = `${response.status} ${response.statusText}`;
        
        // Get and analyze HTML content for SEO data
        const htmlContent = await response.text();
        const $ = cheerio.load(htmlContent);
        
        // Extract SEO data
        responseData.seo.title = $('title').text() || null;
        responseData.seo.description = $('meta[name="description"]').attr('content') || 
                                      $('meta[property="og:description"]').attr('content') || null;
        
        // Extract keywords from meta tags
        const keywordsContent = $('meta[name="keywords"]').attr('content');
        if (keywordsContent) {
          responseData.seo.keywords = keywordsContent.split(',').map(k => k.trim()).slice(0, 10);
        }
        
        // Extract H1 tags
        responseData.seo.h1Tags = [];
        $('h1').each((i, el) => {
          if (i < 5) { // Limit to first 5 H1 tags
            responseData.seo.h1Tags.push($(el).text().trim());
          }
        });
        
        // Count images and links
        responseData.seo.imageCount = $('img').length;
        responseData.seo.linkCount = $('a').length;
        
        // Extract potential keywords from content (simple analysis)
        const textContent = $('body').text().toLowerCase();
        const words = textContent.match(/\b[a-z]{3,}\b/g) || [];
        const wordFreq: { [key: string]: number } = {};
        
        words.forEach(word => {
          if (!['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'way', 'why'].includes(word)) {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
          }
        });
        
        responseData.seo.topKeywords = Object.entries(wordFreq)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 3)
          .map(([word, count]) => ({ keyword: word, frequency: count }));

      } else {
        responseData.status = `${response.status} ${response.statusText}`;
      }

      // Additional header analysis
      const headers = {
        'content-type': response.headers.get('content-type'),
        'server': response.headers.get('server'),
        'cache-control': response.headers.get('cache-control'),
        'x-powered-by': response.headers.get('x-powered-by')
      };

      responseData.headers = headers;

      // Performance rating
      if (responseData.responseTime < 200) {
        responseData.performance = 'Excellent';
      } else if (responseData.responseTime < 500) {
        responseData.performance = 'Good';
      } else if (responseData.responseTime < 1000) {
        responseData.performance = 'Fair';
      } else {
        responseData.performance = 'Poor';
      }

      // Security score
      let securityScore = 0;
      if (responseData.ssl) securityScore += 40;
      if (headers['cache-control']) securityScore += 20;
      if (!headers['x-powered-by']) securityScore += 20; // Better if not exposed
      if (headers.server && !headers.server.includes('Apache') && !headers.server.includes('nginx')) securityScore += 20;
      
      responseData.securityScore = securityScore;

      // Try to get PageSpeed Insights data (Google API - free)
      try {
        const pageSpeedUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl.href)}&category=seo&category=performance`;
        const pageSpeedResponse = await fetch(pageSpeedUrl);
        
        if (pageSpeedResponse.ok) {
          const pageSpeedData = await pageSpeedResponse.json();
          
          // Extract SEO score if available
          if (pageSpeedData.lighthouseResult?.categories?.seo?.score) {
            responseData.seo.pageRank = Math.round(pageSpeedData.lighthouseResult.categories.seo.score * 100);
          }
        }
      } catch (pageSpeedError) {
        console.log('PageSpeed API not available:', pageSpeedError);
      }

      // Estimate traffic based on various factors
      const domain = targetUrl.hostname;
      const estimatedTraffic = estimateWebsiteTraffic(domain, responseData);
      responseData.seo.traffic = estimatedTraffic;

    } catch (error: any) {
      const endTime = Date.now();
      responseData.responseTime = endTime - startTime;
      
      if (error.name === 'AbortError') {
        responseData.error = 'Request timeout (15s limit)';
      } else if (error.code === 'ENOTFOUND') {
        responseData.error = 'Domain not found';
      } else if (error.code === 'ECONNREFUSED') {
        responseData.error = 'Connection refused';
      } else {
        responseData.error = error.message || 'Connection failed';
      }
      responseData.status = 'Unreachable';
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to estimate website traffic
function estimateWebsiteTraffic(domain: string, responseData: any) {
  // Basic traffic estimation based on domain characteristics and performance
  let estimatedMonthlyVisits = 1000; // Base estimate
  
  // Adjust based on TLD
  if (domain.endsWith('.com')) estimatedMonthlyVisits *= 2;
  if (domain.endsWith('.org') || domain.endsWith('.net')) estimatedMonthlyVisits *= 1.5;
  if (domain.endsWith('.gov') || domain.endsWith('.edu')) estimatedMonthlyVisits *= 3;
  
  // Adjust based on performance
  if (responseData.performance === 'Excellent') estimatedMonthlyVisits *= 2;
  if (responseData.performance === 'Good') estimatedMonthlyVisits *= 1.5;
  if (responseData.performance === 'Poor') estimatedMonthlyVisits *= 0.5;
  
  // Adjust based on SSL
  if (responseData.ssl) estimatedMonthlyVisits *= 1.3;
  
  // Adjust based on content richness
  if (responseData.seo?.imageCount > 10) estimatedMonthlyVisits *= 1.2;
  if (responseData.seo?.linkCount > 50) estimatedMonthlyVisits *= 1.3;
  
  // Random variation to simulate real-world data
  const variation = 0.7 + Math.random() * 0.6; // 70% to 130%
  estimatedMonthlyVisits = Math.round(estimatedMonthlyVisits * variation);
  
  // Estimate global rank (inverse relationship with traffic)
  const estimatedRank = Math.max(1000, Math.round(10000000 / Math.sqrt(estimatedMonthlyVisits)));
  
  return {
    estimated: estimatedMonthlyVisits,
    rank: estimatedRank,
    source: 'Algorithm-based estimate'
  };
}