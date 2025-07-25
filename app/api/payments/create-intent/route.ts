import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { StripeService, type PricingPlan, PRICING_PLANS } from "@/lib/stripe";
import { withRateLimit, withCors } from "@/lib/middleware";
import { apiRateLimit } from "@/lib/rate-limit";

const createIntentSchema = z.object({
  plan: z.literal("MONTHLY_HEALTH_CHECK"),
  customerEmail: z.string().email().optional(),
});

async function handleCreateIntent(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, customerEmail } = createIntentSchema.parse(body);

    // Create payment intent
    const paymentIntent = await StripeService.createPaymentIntent(
      plan as PricingPlan,
      customerEmail
    );

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    console.error("Create payment intent error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}

export const POST = withCors(withRateLimit(apiRateLimit, handleCreateIntent));
