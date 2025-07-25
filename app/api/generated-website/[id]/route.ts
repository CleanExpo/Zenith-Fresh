import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get the generated website from the database
    const generatedWebsite = await prisma.generatedWebsite.findUnique({
      where: { id },
    });

    if (!generatedWebsite) {
      return NextResponse.json(
        { error: "Generated website not found" },
        { status: 404 }
      );
    }

    // Extract the HTML content from the files
    const files = generatedWebsite.files as any;
    const htmlContent = files["index.html"];

    if (!htmlContent) {
      return NextResponse.json(
        { error: "Website content not found" },
        { status: 404 }
      );
    }

    // Return the HTML content with proper headers
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error serving generated website:", error);
    return NextResponse.json(
      { error: "Failed to serve website" },
      { status: 500 }
    );
  }
}
