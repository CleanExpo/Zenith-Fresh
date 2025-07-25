import { type NextRequest, NextResponse } from "next/server";
import { WebsiteAuditService } from "@/lib/audit-services";
import { AISuggestionsService } from "@/lib/ai-suggestions";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware";

async function handleAnalyzeWebsite(
  request: NextRequest,
  context: { user: any }
) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const domain = new URL(url).hostname;

    // Create initial analysis record
    const analysis = await prisma.websiteAnalysis.create({
      data: {
        url,
        domain,
        userId: context.user.id,
        status: "IN_PROGRESS",
        title: `Analysis for ${domain}`,
        description: `Comprehensive SEO and performance analysis of ${url}`,
      },
    });

    try {
      const auditService = new WebsiteAuditService();
      const auditResult = await auditService.auditWebsite(url);

      // Compose the response in the same structure as before, but with real data
      const {
        crawlData,
        performanceData,
        aiInsights,
        multiPageAudit,
        overallScore,
      } = auditResult;

      const analysisResult = {
        url: crawlData.url,
        score: multiPageAudit.overallScore, // Use multi-page audit overall score for consistency
        analysisDate: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        issues: [
          ...aiInsights.seoAnalysis.issues.map((issue) => ({
            category: issue.category,
            severity: issue.severity,
            title: issue.title,
            description: issue.description,
            solution: issue.solution,
            impact: issue.impact,
            pageUrl: crawlData.url,
          })),
          ...aiInsights.contentAnalysis.contentGaps.map((gap) => ({
            category: "Content",
            severity:
              gap.priority === "high"
                ? "high"
                : gap.priority === "medium"
                ? "medium"
                : "low",
            title: `Content Gap: ${gap.topic}`,
            description: gap.opportunity,
            solution: `Create content about ${gap.topic}`,
            impact: "Improve search rankings and user engagement",
            pageUrl: crawlData.url,
          })),
          ...aiInsights.technicalAnalysis.performance.bottlenecks.map(
            (bottleneck) => ({
              category: "Performance",
              severity:
                bottleneck.priority === "high"
                  ? "high"
                  : bottleneck.priority === "medium"
                  ? "medium"
                  : "low",
              title: bottleneck.issue,
              description: bottleneck.impact,
              solution: bottleneck.solution,
              impact: "Improve page load speed and user experience",
              pageUrl: crawlData.url,
            })
          ),
        ],
        recommendations: [
          ...aiInsights.seoAnalysis.recommendations.map((rec) => ({
            title: rec.title,
            description: rec.description,
            impact: rec.impact,
            priority: rec.priority,
          })),
          ...aiInsights.contentAnalysis.keywordOptimization.map((keyword) => ({
            title: `Optimize for keyword: ${keyword.keyword}`,
            description: keyword.recommendation,
            impact: `Improve ranking for "${keyword.keyword}"`,
            priority:
              keyword.density < 1
                ? "high"
                : keyword.density < 2
                ? "medium"
                : "low",
          })),
          ...aiInsights.technicalAnalysis.performance.optimizations.map(
            (opt) => ({
              title: opt.type,
              description: opt.description,
              impact: opt.potentialImprovement,
              priority: "medium",
            })
          ),
        ],
        technicalDetails: {
          loadTime: crawlData.loadTime || 0,
          mobileScore: performanceData.lighthouseScore.performance,
          seoScore: multiPageAudit.seoScore, // Use multi-page audit SEO score
          accessibilityScore: performanceData.lighthouseScore.accessibility,
          performanceScore: performanceData.lighthouseScore.performance,
          securityScore: aiInsights.technicalAnalysis.score,
          totalPages: multiPageAudit.allAnalyzedPages.length, // Use actual analyzed pages count
          totalImages: crawlData.images.length,
          totalLinks: crawlData.links.length,
        },
        // Add comprehensive multi-page audit data
        multiPageAudit: {
          totalPagesAnalyzed: multiPageAudit.allAnalyzedPages.length,
          seoScore: multiPageAudit.seoScore,
          contentScore: multiPageAudit.contentScore,
          technicalScore: multiPageAudit.technicalScore,
          siteWideIssues: multiPageAudit.siteWideIssues,
          allAnalyzedPages: multiPageAudit.allAnalyzedPages,
          websiteGenerationPrompt: multiPageAudit.websiteGenerationPrompt,
          additionalPages: multiPageAudit.additionalPages.map((page) => ({
            url: page.url,
            title: page.title,
            wordCount: page.wordCount,
            seoIssues: page.seoIssues.length,
          })),
        },
        // Add brand marketing analysis
        brandMarketing: aiInsights.brandMarketingAnalysis,
        // Add enhanced performance data
        performanceDetails: {
          coreWebVitals: performanceData.coreWebVitals,
          opportunities: performanceData.opportunities.slice(0, 10), // Show more opportunities
          diagnostics: performanceData.diagnostics.slice(0, 10), // Show more diagnostics
        },
        // Add comprehensive content analysis
        contentAnalysis: {
          readability: aiInsights.contentAnalysis.readability,
          keywordOptimization: aiInsights.contentAnalysis.keywordOptimization,
          contentGaps: aiInsights.contentAnalysis.contentGaps,
          duplicateContent: aiInsights.contentAnalysis.duplicateContent,
        },
        // Add technical analysis details
        technicalAnalysis: {
          performance: aiInsights.technicalAnalysis.performance,
          security: aiInsights.technicalAnalysis.security,
        },
      };

      // Generate AI-powered suggestions and recommendations
      const analysisDataForAI = {
        url,
        domain,
        seoScore: multiPageAudit.seoScore,
        performanceScore: performanceData.lighthouseScore.performance,
        accessibilityScore: performanceData.lighthouseScore.accessibility,
        bestPracticesScore: aiInsights.technicalAnalysis.score,
        issues: analysisResult.issues,
        suggestions: analysisResult.recommendations,
      };

      const [aiSuggestions, aiRecommendations] = await Promise.all([
        AISuggestionsService.generateSuggestions(analysisDataForAI),
        AISuggestionsService.generateRecommendations(analysisDataForAI),
      ]);

      // Update the analysis record with results and AI-generated content
      await prisma.websiteAnalysis.update({
        where: { id: analysis.id },
        data: {
          status: "COMPLETED",
          seoScore: multiPageAudit.seoScore,
          performanceScore: performanceData.lighthouseScore.performance,
          accessibilityScore: performanceData.lighthouseScore.accessibility,
          bestPracticesScore: aiInsights.technicalAnalysis.score,
          issues: analysisResult.issues,
          suggestions: {
            basic: analysisResult.recommendations,
            aiGenerated: aiSuggestions.map((s) => ({
              title: s.title,
              description: s.description,
              priority: s.priority,
              impact: s.impact,
              category: s.category,
              examples: s.examples,
              implementation: s.implementation,
              estimatedEffort: s.estimatedEffort,
              expectedImprovement: s.expectedImprovement,
            })),
            recommendations: aiRecommendations.map((r) => ({
              title: r.title,
              description: r.description,
              priority: r.priority,
              impact: r.impact,
              category: r.category,
              stepByStepGuide: r.stepByStepGuide,
              tools: r.tools,
              timeline: r.timeline,
              cost: r.cost,
            })),
          },
          title: `Analysis for ${domain}`,
          description: `Found ${analysisResult.issues.length} issues across ${analysisResult.technicalDetails.totalPages} pages`,
        },
      });

      // Return the analysis result with the database ID
      return NextResponse.json({
        ...analysisResult,
        analysisId: analysis.id,
      });
    } catch (auditError) {
      // Update analysis record with failed status
      await prisma.websiteAnalysis.update({
        where: { id: analysis.id },
        data: {
          status: "FAILED",
          description: "Analysis failed during processing",
        },
      });

      throw auditError;
    }
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze website" },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handleAnalyzeWebsite);
