import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware";

async function handleShareReport(request: NextRequest, context: { user: any }) {
  try {
    // Extract ID from URL path
    const pathParts = request.nextUrl.pathname.split("/");
    const id = pathParts[pathParts.length - 2]; // share is the last part, id is second to last

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

    // Generate a shareable link
    // In a real implementation, you might want to create a separate table for shared reports
    // with expiration dates and access controls
    const shareableUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/shared-report/${id}`;

    return NextResponse.json({
      success: true,
      shareableUrl,
      message: "Report shared successfully",
    });
  } catch (error) {
    console.error("Failed to share report:", error);
    return NextResponse.json(
      { error: "Failed to share report" },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handleShareReport);
