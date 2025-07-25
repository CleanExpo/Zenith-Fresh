import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware";

async function handleGetReport(request: NextRequest, context: { user: any }) {
  try {
    // Extract ID from URL path
    const pathParts = request.nextUrl.pathname.split("/");
    const id = pathParts[pathParts.length - 1];

    // Check if the report exists and belongs to the user
    const report = await prisma.websiteAnalysis.findFirst({
      where: {
        id,
        userId: context.user.id,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Failed to fetch report:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}

async function handleDeleteReport(
  request: NextRequest,
  context: { user: any }
) {
  try {
    // Extract ID from URL path
    const pathParts = request.nextUrl.pathname.split("/");
    const id = pathParts[pathParts.length - 1];

    // Check if the report exists and belongs to the user
    const report = await prisma.websiteAnalysis.findFirst({
      where: {
        id,
        userId: context.user.id,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Delete the report
    await prisma.websiteAnalysis.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete report:", error);
    return NextResponse.json(
      { error: "Failed to delete report" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGetReport);
export const DELETE = withAuth(handleDeleteReport);
