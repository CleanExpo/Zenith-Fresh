import { type NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { withAuth, withCors } from "@/lib/middleware";

async function handleVerifySession(
  request: NextRequest,
  context: { user: any }
) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    // Find the associated website analysis
    const analysis = await prisma.websiteAnalysis.findFirst({
      where: {
        paymentIntentId: session.payment_intent as string,
        userId: context.user.id,
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sessionId: session.id,
      analysisId: analysis.id,
      websiteUrl: analysis.url,
      plan: analysis.plan,
    });
  } catch (error) {
    console.error("Verify session error:", error);
    return NextResponse.json(
      { error: "Failed to verify session" },
      { status: 500 }
    );
  }
}

export const GET = withCors(withAuth(handleVerifySession));
