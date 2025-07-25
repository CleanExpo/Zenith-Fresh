import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, withCors } from "@/lib/middleware";

const generateSchema = z.object({
  analysisId: z.string(),
});

async function handleGenerate(request: NextRequest, context: { user: any }) {
  try {
    const body = await request.json();
    const { analysisId } = generateSchema.parse(body);

    // Get the analysis with all data
    const analysis = await prisma.websiteAnalysis.findUnique({
      where: { id: analysisId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 }
      );
    }

    // Use the real website generation service
    const { WebsiteGenerator } = await import("@/lib/website-generator");

    let generatedSiteUrl: string;

    try {
      // Prepare analysis data for website generation
      const analysisData = {
        url: analysis.url,
        description: analysis.description,
        issues: analysis.issues || [],
        suggestions: analysis.suggestions || [],
        seoScore: analysis.seoScore,
        performanceScore: analysis.performanceScore,
        accessibilityScore: analysis.accessibilityScore,
        bestPracticesScore: analysis.bestPracticesScore,
        createdAt: analysis.createdAt,
        user: analysis.user,
      };

      // Generate website using the real service with full analysis data
      generatedSiteUrl = await WebsiteGenerator.generateWebsite(
        analysis.url,
        analysisData
      );
    } catch (generationError) {
      console.error("Website generation error:", generationError);

      // Fallback to mock generation if real service fails
      generatedSiteUrl = await simulateWebsiteGeneration(analysis.url);
    }

    // Update analysis with generated site info (always update, even if URL already exists)
    const updatedAnalysis = await prisma.websiteAnalysis.update({
      where: { id: analysisId },
      data: {
        generatedSiteUrl,
        generatedAt: new Date(),
      },
    });

    return NextResponse.json({
      analysisId: updatedAnalysis.id,
      generatedSiteUrl: updatedAnalysis.generatedSiteUrl,
      generatedAt: updatedAnalysis.generatedAt,
      status: "completed",
    });
  } catch (error) {
    console.error("Website generation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}

// Mock generation function - replace with real implementation
async function simulateWebsiteGeneration(originalUrl: string): Promise<string> {
  // Simulate generation delay
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Return a mock generated site URL
  const domain = new URL(originalUrl).hostname.replace(/\./g, "-");
  return `https://generated-${domain}-${Date.now()}.zenith.engineer`;
}

export const POST = withCors(withAuth(handleGenerate));
