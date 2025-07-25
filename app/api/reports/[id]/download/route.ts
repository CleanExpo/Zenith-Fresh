import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware";
import { PDFGenerator } from "@/lib/pdf-generator";

async function handleDownloadReport(
  request: NextRequest,
  context: { user: any }
) {
  try {
    // Extract ID from URL path
    const pathParts = request.nextUrl.pathname.split("/");
    const id = pathParts[pathParts.length - 2]; // download is the last part, id is second to last

    // Check if the report exists and belongs to the user
    const report = await prisma.websiteAnalysis.findFirst({
      where: {
        id,
        userId: context.user.id,
        status: "COMPLETED",
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found or not completed" },
        { status: 404 }
      );
    }

    // Generate professional PDF report
    const reportData = {
      id: report.id,
      title: report.title || `Analysis for ${report.domain}`,
      url: report.url,
      domain: report.domain,
      description: report.description || undefined,
      seoScore: report.seoScore || undefined,
      performanceScore: report.performanceScore || undefined,
      accessibilityScore: report.accessibilityScore || undefined,
      bestPracticesScore: report.bestPracticesScore || undefined,
      issues: (report.issues as any[]) || [],
      suggestions: (report.suggestions as any[]) || [],
      status: report.status,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    };

    const pdfBuffer = await PDFGenerator.generateProfessionalReport(reportData);

    // Return PDF file for download
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="zenith-report-${
          report.domain
        }-${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Failed to download report:", error);
    return NextResponse.json(
      { error: "Failed to download report" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleDownloadReport);
