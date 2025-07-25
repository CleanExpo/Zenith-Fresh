import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFGenerator } from "@/lib/pdf-generator";

export async function POST(request: NextRequest) {
  try {
    const { analysisId, analysisData } = await request.json();

    if (!analysisId) {
      return NextResponse.json(
        { error: "Missing analysisId" },
        { status: 400 }
      );
    }

    // Use provided analysis data if available, otherwise fetch from database
    let reportData;

    if (analysisData) {
      // Use the provided analysis data directly
      reportData = {
        id: analysisId,
        title: `Analysis for ${new URL(analysisData.url).hostname}`,
        url: analysisData.url,
        domain: new URL(analysisData.url).hostname,
        description:
          analysisData.description ||
          `Comprehensive analysis of ${analysisData.url}`,
        seoScore: analysisData.technicalDetails?.seoScore || 0,
        performanceScore: analysisData.technicalDetails?.performanceScore || 0,
        accessibilityScore:
          analysisData.technicalDetails?.accessibilityScore || 0,
        bestPracticesScore: analysisData.technicalDetails?.securityScore || 0,
        issues: analysisData.issues || [],
        suggestions: analysisData.recommendations || [],
        status: "COMPLETED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        technicalDetails: {
          loadTime: analysisData.technicalDetails?.loadTime || 0,
          performanceScore:
            analysisData.technicalDetails?.performanceScore || 0,
          mobileScore: analysisData.technicalDetails?.mobileScore || 0,
          seoScore: analysisData.technicalDetails?.seoScore || 0,
          accessibilityScore:
            analysisData.technicalDetails?.accessibilityScore || 0,
          securityScore: analysisData.technicalDetails?.securityScore || 0,
          totalPages: analysisData.technicalDetails?.totalPages || 0,
          totalImages: analysisData.technicalDetails?.totalImages || 0,
          totalLinks: analysisData.technicalDetails?.totalLinks || 0,
          issuesFound: analysisData.issues?.length || 0,
          overallScore: analysisData.score || 0,
        },
        multiPageAudit: analysisData.multiPageAudit,
        contentAnalysis: analysisData.contentAnalysis,
        technicalAnalysis: analysisData.technicalAnalysis,
        brandMarketing: analysisData.brandMarketing,
      };
    } else {
      // Fallback to database fetch
      const analysis = await prisma.websiteAnalysis.findUnique({
        where: { id: analysisId },
      });

      if (!analysis) {
        return NextResponse.json(
          { error: "Analysis not found" },
          { status: 404 }
        );
      }

      reportData = {
        id: analysis.id,
        title: analysis.title || analysis.domain,
        url: analysis.url,
        domain: analysis.domain,
        description: analysis.description || "",
        seoScore: analysis.seoScore ?? 0,
        performanceScore: analysis.performanceScore ?? 0,
        accessibilityScore: analysis.accessibilityScore ?? 0,
        bestPracticesScore: analysis.bestPracticesScore ?? 0,
        issues: Array.isArray(analysis.issues)
          ? analysis.issues
          : typeof analysis.issues === "string"
          ? JSON.parse(analysis.issues)
          : [],
        suggestions: Array.isArray(analysis.suggestions)
          ? analysis.suggestions
          : typeof analysis.suggestions === "string"
          ? JSON.parse(analysis.suggestions)
          : [],
        status: analysis.status,
        createdAt: analysis.createdAt.toISOString(),
        updatedAt: analysis.updatedAt.toISOString(),
      };
    }

    // Generate professional PDF using the data
    const pdfBuffer = await PDFGenerator.generateProfessionalReport(reportData);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=\"Zenith-SEO-Report-${
          reportData.domain
        }-${new Date().toISOString().split("T")[0]}.pdf\"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export report" },
      { status: 500 }
    );
  }
}
