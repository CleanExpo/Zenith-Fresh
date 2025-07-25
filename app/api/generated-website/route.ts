import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "Missing id parameter" },
      { status: 400 }
    );
  }
  try {
    const entry = await prisma.generatedWebsite.findUnique({ where: { id } });
    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      generatedFiles: entry.files,
      auditSummary: entry.audit,
      createdAt: entry.createdAt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch generated website",
        details: error instanceof Error ? error.message : error,
      },
      { status: 500 }
    );
  }
}
