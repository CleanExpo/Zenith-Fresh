import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware";

async function handleExportAnalytics(
  request: NextRequest,
  context: { user: any }
) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const timeRange = searchParams.get("timeRange") || "30d";
    const websiteId = searchParams.get("websiteId") || "all";

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build where clause
    const where: any = {
      userId: context.user.id,
      createdAt: {
        gte: startDate,
        lte: now,
      },
      status: "COMPLETED",
    };

    if (websiteId !== "all") {
      where.id = websiteId;
    }

    // Get analyses data
    const analyses = await prisma.websiteAnalysis.findMany({
      where,
      select: {
        id: true,
        url: true,
        domain: true,
        title: true,
        seoScore: true,
        performanceScore: true,
        accessibilityScore: true,
        bestPracticesScore: true,
        issues: true,
        suggestions: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (format === "csv") {
      // Generate CSV
      const csvHeaders = [
        "Domain",
        "URL",
        "Title",
        "SEO Score",
        "Performance Score",
        "Accessibility Score",
        "Security Score",
        "Total Issues",
        "Analysis Date",
      ];

      const csvRows = analyses.map((analysis) => [
        analysis.domain,
        analysis.url,
        analysis.title || "",
        analysis.seoScore || 0,
        analysis.performanceScore || 0,
        analysis.accessibilityScore || 0,
        analysis.bestPracticesScore || 0,
        ((analysis.issues as any[]) || []).length,
        analysis.createdAt.toISOString().split("T")[0],
      ]);

      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="zenith-analytics-${timeRange}-${
            new Date().toISOString().split("T")[0]
          }.csv"`,
        },
      });
    } else if (format === "pdf") {
      // For PDF, we'll return a JSON response with the data
      // The frontend can handle PDF generation using a library like jsPDF
      const pdfData = {
        title: `Zenith Analytics Report - ${timeRange}`,
        generatedAt: new Date().toISOString(),
        timeRange,
        totalAnalyses: analyses.length,
        summary: {
          averageSeoScore:
            analyses.length > 0
              ? Math.round(
                  analyses.reduce((sum, a) => sum + (a.seoScore || 0), 0) /
                    analyses.length
                )
              : 0,
          averagePerformanceScore:
            analyses.length > 0
              ? Math.round(
                  analyses.reduce(
                    (sum, a) => sum + (a.performanceScore || 0),
                    0
                  ) / analyses.length
                )
              : 0,
          averageAccessibilityScore:
            analyses.length > 0
              ? Math.round(
                  analyses.reduce(
                    (sum, a) => sum + (a.accessibilityScore || 0),
                    0
                  ) / analyses.length
                )
              : 0,
          averageSecurityScore:
            analyses.length > 0
              ? Math.round(
                  analyses.reduce(
                    (sum, a) => sum + (a.bestPracticesScore || 0),
                    0
                  ) / analyses.length
                )
              : 0,
          totalIssues: analyses.reduce((total, analysis) => {
            const issues = (analysis.issues as any[]) || [];
            return total + issues.length;
          }, 0),
        },
        analyses: analyses.map((analysis) => ({
          domain: analysis.domain,
          url: analysis.url,
          title: analysis.title || "",
          seoScore: analysis.seoScore || 0,
          performanceScore: analysis.performanceScore || 0,
          accessibilityScore: analysis.accessibilityScore || 0,
          securityScore: analysis.bestPracticesScore || 0,
          totalIssues: ((analysis.issues as any[]) || []).length,
          analysisDate: analysis.createdAt.toISOString().split("T")[0],
        })),
      };

      return NextResponse.json(pdfData);
    }

    return NextResponse.json(
      { error: "Unsupported format. Use 'csv' or 'pdf'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to export analytics:", error);
    return NextResponse.json(
      { error: "Failed to export analytics data" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleExportAnalytics);
