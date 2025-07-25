import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AnalysisData {
  url: string;
  domain: string;
  seoScore?: number;
  performanceScore?: number;
  accessibilityScore?: number;
  bestPracticesScore?: number;
  issues?: any[];
  suggestions?: any[];
}

interface AISuggestion {
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  impact: string;
  category: "seo" | "performance" | "accessibility" | "security" | "general";
  examples?: string[];
  implementation?: string;
  estimatedEffort?: string;
  expectedImprovement?: string;
}

interface AIRecommendation {
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  impact: string;
  category: "seo" | "performance" | "accessibility" | "security" | "general";
  stepByStepGuide?: string[];
  tools?: string[];
  timeline?: string;
  cost?: string;
}

export class AISuggestionsService {
  static async generateSuggestions(
    analysisData: AnalysisData
  ): Promise<AISuggestion[]> {
    try {
      const issues = analysisData.issues || [];
      const currentSuggestions = analysisData.suggestions || [];

      const prompt = this.buildSuggestionsPrompt(
        analysisData,
        issues,
        currentSuggestions
      );

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are an expert SEO and web performance consultant with 15+ years of experience. You provide actionable, detailed suggestions for website optimization. Always be specific, professional, and provide concrete examples.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from OpenAI");
      }

      return this.parseSuggestionsResponse(response);
    } catch (error) {
      console.error("Error generating AI suggestions:", error);
      return this.getFallbackSuggestions(analysisData);
    }
  }

  static async generateRecommendations(
    analysisData: AnalysisData
  ): Promise<AIRecommendation[]> {
    try {
      const prompt = this.buildRecommendationsPrompt(analysisData);

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a senior digital marketing strategist with expertise in SEO, performance optimization, and accessibility. You provide comprehensive, strategic recommendations that drive measurable results.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from OpenAI");
      }

      return this.parseRecommendationsResponse(response);
    } catch (error) {
      console.error("Error generating AI recommendations:", error);
      return this.getFallbackRecommendations(analysisData);
    }
  }

  private static buildSuggestionsPrompt(
    analysisData: AnalysisData,
    issues: any[],
    currentSuggestions: any[]
  ): string {
    return `
Generate 8-12 detailed, actionable suggestions for improving the website: ${
      analysisData.url
    }

Current Analysis:
- SEO Score: ${analysisData.seoScore || "N/A"}/100
- Performance Score: ${analysisData.performanceScore || "N/A"}/100
- Accessibility Score: ${analysisData.accessibilityScore || "N/A"}/100
- Security Score: ${analysisData.bestPracticesScore || "N/A"}/100

Issues Found: ${issues.length}
Current Suggestions: ${currentSuggestions.length}

Requirements:
1. Focus on the most impactful improvements first
2. Provide specific, actionable suggestions
3. Include examples and implementation details
4. Categorize by priority (critical, high, medium, low)
5. Include estimated effort and expected improvement
6. Cover SEO, Performance, Accessibility, and Security

Format each suggestion as JSON:
{
  "title": "Specific, actionable title",
  "description": "Detailed explanation with examples",
  "priority": "critical|high|medium|low",
  "impact": "Expected impact on scores and business",
  "category": "seo|performance|accessibility|security|general",
  "examples": ["Example 1", "Example 2"],
  "implementation": "Step-by-step implementation guide",
  "estimatedEffort": "Low/Medium/High",
  "expectedImprovement": "Expected score improvement"
}

Return only valid JSON array of suggestions.
`;
  }

  private static buildRecommendationsPrompt(
    analysisData: AnalysisData
  ): string {
    return `
Generate 5-8 strategic recommendations for long-term website optimization: ${
      analysisData.url
    }

Current Analysis:
- SEO Score: ${analysisData.seoScore || "N/A"}/100
- Performance Score: ${analysisData.performanceScore || "N/A"}/100
- Accessibility Score: ${analysisData.accessibilityScore || "N/A"}/100
- Security Score: ${analysisData.bestPracticesScore || "N/A"}/100

Requirements:
1. Focus on strategic, long-term improvements
2. Include implementation timeline and cost estimates
3. Provide step-by-step guides
4. Recommend specific tools and resources
5. Include ROI expectations
6. Cover technical, content, and marketing aspects

Format each recommendation as JSON:
{
  "title": "Strategic recommendation title",
  "description": "Comprehensive explanation with business impact",
  "priority": "critical|high|medium|low",
  "impact": "Expected business impact and ROI",
  "category": "seo|performance|accessibility|security|general",
  "stepByStepGuide": ["Step 1", "Step 2", "Step 3"],
  "tools": ["Tool 1", "Tool 2"],
  "timeline": "Estimated timeline (e.g., 2-4 weeks)",
  "cost": "Estimated cost range"
}

Return only valid JSON array of recommendations.
`;
  }

  private static parseSuggestionsResponse(response: string): AISuggestion[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("No valid JSON found in response");
    } catch (error) {
      console.error("Error parsing suggestions response:", error);
      return [];
    }
  }

  private static parseRecommendationsResponse(
    response: string
  ): AIRecommendation[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("No valid JSON found in response");
    } catch (error) {
      console.error("Error parsing recommendations response:", error);
      return [];
    }
  }

  private static getFallbackSuggestions(
    analysisData: AnalysisData
  ): AISuggestion[] {
    return [
      {
        title: "Optimize Page Load Speed",
        description:
          "Improve website loading speed by optimizing images, minifying CSS/JS, and implementing lazy loading. This will significantly improve user experience and search engine rankings.",
        priority: "high",
        impact: "Expected 15-25 point improvement in Performance score",
        category: "performance",
        examples: [
          "Compress images using WebP format",
          "Minify CSS and JavaScript files",
          "Implement lazy loading for images",
        ],
        implementation:
          "1. Audit current page speed using Google PageSpeed Insights\n2. Optimize images using tools like TinyPNG\n3. Minify CSS/JS using build tools\n4. Implement lazy loading with Intersection Observer API",
        estimatedEffort: "Medium",
        expectedImprovement: "15-25 points",
      },
      {
        title: "Improve SEO Meta Tags",
        description:
          "Enhance SEO by optimizing meta titles, descriptions, and implementing proper heading structure. This will improve search engine visibility and click-through rates.",
        priority: "high",
        impact: "Expected 10-20 point improvement in SEO score",
        category: "seo",
        examples: [
          "Create unique, descriptive meta titles",
          "Write compelling meta descriptions",
          "Use proper H1-H6 heading hierarchy",
        ],
        implementation:
          "1. Audit current meta tags\n2. Create unique titles for each page\n3. Write compelling descriptions under 160 characters\n4. Implement proper heading structure",
        estimatedEffort: "Low",
        expectedImprovement: "10-20 points",
      },
      {
        title: "Enhance Mobile Responsiveness",
        description:
          "Ensure the website is fully responsive and provides excellent user experience on all devices. This is crucial for both user experience and search rankings.",
        priority: "critical",
        impact: "Expected 20-30 point improvement in Accessibility score",
        category: "accessibility",
        examples: [
          "Implement responsive design",
          "Test on various screen sizes",
          "Optimize touch targets",
        ],
        implementation:
          "1. Test website on various devices\n2. Implement responsive breakpoints\n3. Optimize touch targets (minimum 44px)\n4. Test with screen readers",
        estimatedEffort: "High",
        expectedImprovement: "20-30 points",
      },
    ];
  }

  private static getFallbackRecommendations(
    analysisData: AnalysisData
  ): AIRecommendation[] {
    return [
      {
        title: "Implement Content Marketing Strategy",
        description:
          "Develop a comprehensive content marketing strategy to improve SEO rankings and drive organic traffic. This includes creating high-quality, relevant content that addresses user intent.",
        priority: "high",
        impact: "Expected 30-50% increase in organic traffic within 6 months",
        category: "seo",
        stepByStepGuide: [
          "Conduct keyword research and competitor analysis",
          "Create content calendar and editorial guidelines",
          "Develop pillar content and supporting articles",
          "Implement internal linking strategy",
          "Monitor and optimize content performance",
        ],
        tools: [
          "Ahrefs",
          "SEMrush",
          "Google Analytics",
          "Google Search Console",
        ],
        timeline: "3-6 months",
        cost: "$2,000-$5,000",
      },
      {
        title: "Technical SEO Audit and Implementation",
        description:
          "Conduct a comprehensive technical SEO audit and implement improvements to enhance search engine crawling and indexing.",
        priority: "critical",
        impact: "Expected 20-40 point improvement in overall SEO score",
        category: "seo",
        stepByStepGuide: [
          "Audit website structure and URL architecture",
          "Optimize robots.txt and sitemap.xml",
          "Fix crawl errors and broken links",
          "Implement schema markup",
          "Optimize Core Web Vitals",
        ],
        tools: [
          "Screaming Frog",
          "Google Search Console",
          "Schema.org",
          "PageSpeed Insights",
        ],
        timeline: "4-8 weeks",
        cost: "$1,500-$3,000",
      },
      {
        title: "Performance Optimization Strategy",
        description:
          "Implement a comprehensive performance optimization strategy to improve user experience and search rankings.",
        priority: "high",
        impact: "Expected 25-35 point improvement in Performance score",
        category: "performance",
        stepByStepGuide: [
          "Audit current performance using multiple tools",
          "Optimize images and implement WebP format",
          "Implement CDN and caching strategies",
          "Optimize database queries and server response",
          "Monitor and maintain performance improvements",
        ],
        tools: [
          "Google PageSpeed Insights",
          "GTmetrix",
          "WebPageTest",
          "Cloudflare",
        ],
        timeline: "6-12 weeks",
        cost: "$3,000-$8,000",
      },
    ];
  }
}
