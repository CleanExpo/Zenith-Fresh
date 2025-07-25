import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware";
import { ScoreCalculator } from "@/lib/score-calculator";

async function handleGetReports(request: NextRequest, context: { user: any }) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    // Build where clause
    const where: any = {
      userId: context.user.id,
    };

    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }

    if (type && type !== "all") {
      // Map frontend types to database fields
      switch (type) {
        case "seo":
          where.seoScore = { not: null };
          break;
        case "performance":
          where.performanceScore = { not: null };
          break;
        case "accessibility":
          where.accessibilityScore = { not: null };
          break;
        case "security":
          where.bestPracticesScore = { not: null };
          break;
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { domain: { contains: search, mode: "insensitive" } },
        { url: { contains: search, mode: "insensitive" } },
      ];
    }

    const analyses = await prisma.websiteAnalysis.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        url: true,
        domain: true,
        title: true,
        description: true,
        seoScore: true,
        performanceScore: true,
        accessibilityScore: true,
        bestPracticesScore: true,
        issues: true,
        suggestions: true,
        status: true,
        paymentStatus: true,
        plan: true,
        createdAt: true,
        updatedAt: true,
        generatedSiteUrl: true,
        generatedAt: true,
      },
    });

    // Transform data to match frontend interface
    const reports = analyses.map((analysis) => {
      // Use centralized score calculator
      const calculatedScores = ScoreCalculator.getAllScores({
        seoScore: analysis.seoScore,
        performanceScore: analysis.performanceScore,
        accessibilityScore: analysis.accessibilityScore,
        bestPracticesScore: analysis.bestPracticesScore,
      });

      const primaryScore = ScoreCalculator.getPrimaryScore({
        seoScore: analysis.seoScore,
        performanceScore: analysis.performanceScore,
        accessibilityScore: analysis.accessibilityScore,
        bestPracticesScore: analysis.bestPracticesScore,
      });

      // Count issues
      const issuesCount = analysis.issues
        ? Array.isArray(analysis.issues)
          ? analysis.issues.length
          : 0
        : 0;

      // Calculate file size based on analysis data
      const calculateFileSize = (analysis: any) => {
        if (analysis.status !== "COMPLETED") return "0 MB";

        // Calculate size based on issues and suggestions
        const issues = Array.isArray(analysis.issues)
          ? analysis.issues.length
          : 0;
        const suggestions = analysis.suggestions
          ? Array.isArray(analysis.suggestions)
            ? analysis.suggestions.length
            : (analysis.suggestions.basic
                ? analysis.suggestions.basic.length
                : 0) +
              (analysis.suggestions.aiGenerated
                ? analysis.suggestions.aiGenerated.length
                : 0) +
              (analysis.suggestions.recommendations
                ? analysis.suggestions.recommendations.length
                : 0)
          : 0;

        // Base size + size per issue/suggestion
        const baseSize = 0.5; // 500KB base
        const issueSize = issues * 0.1; // 100KB per issue
        const suggestionSize = suggestions * 0.05; // 50KB per suggestion

        const totalSizeMB = baseSize + issueSize + suggestionSize;
        return `${totalSizeMB.toFixed(1)} MB`;
      };

      const size = calculateFileSize(analysis);

      return {
        id: analysis.id,
        title: analysis.title || `${primaryScore.type.toUpperCase()} Analysis`,
        website: analysis.domain,
        date: analysis.createdAt.toISOString().split("T")[0],
        status: analysis.status.toLowerCase(),
        score: primaryScore.score,
        issues: issuesCount,
        type: primaryScore.type,
        size,
        // Additional data for detailed view
        url: analysis.url,
        description: analysis.description,
        scores: {
          overall: calculatedScores.overall,
          seo: calculatedScores.seo,
          performance: calculatedScores.performance,
          accessibility: calculatedScores.accessibility,
          security: calculatedScores.security,
          content: calculatedScores.content,
        },
        suggestions: analysis.suggestions,
        paymentStatus: analysis.paymentStatus,
        plan: analysis.plan,
        generatedSiteUrl: analysis.generatedSiteUrl,
        generatedAt: analysis.generatedAt,
        updatedAt: analysis.updatedAt,
      };
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGetReports);
