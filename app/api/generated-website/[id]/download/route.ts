import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import JSZip from "jszip";

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

    // Create a ZIP file
    const zip = new JSZip();

    // Add the HTML file
    zip.file("index.html", htmlContent);

    // Add a README file
    const readmeContent = `# Generated Website

This website was generated using Zenith.engineer's professional website generator.

## Files Included:
- index.html - Complete website with all sections and styling

## Features:
- Professional design with industry-specific color schemes
- Mobile responsive layout
- SEO optimized structure
- Conversion-focused content
- Smooth animations and interactions

## Usage:
Simply open index.html in any modern web browser to view the website.

Generated on: ${new Date().toLocaleDateString()}
Website ID: ${id}
`;

    zip.file("README.md", readmeContent);

    // Generate the ZIP file
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    // Return the ZIP file
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="website-${id}.zip"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error creating ZIP download:", error);
    return NextResponse.json(
      { error: "Failed to create download" },
      { status: 500 }
    );
  }
}
