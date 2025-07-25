import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe, PRICING_PLANS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { withAuth, withCors } from "@/lib/middleware";

const createCheckoutSchema = z.object({
  plan: z.literal("MONTHLY_HEALTH_CHECK"),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

async function handleCreateCheckoutSession(
  request: NextRequest,
  context: { user: any }
) {
  try {
    const body = await request.json();
    const { plan, successUrl, cancelUrl } = createCheckoutSchema.parse(body);

    const planConfig = PRICING_PLANS[plan];
    const user = context.user;

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name:
          `${user.firstName || ""} ${user.lastName || ""}`.trim() || undefined,
        metadata: {
          userId: user.id,
        },
      });

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customer.id },
      });

      customerId = customer.id;
    }

    // Create or get the price
    const prices = await stripe.prices.list({
      lookup_keys: [plan],
      expand: ["data.product"],
    });

    let price;
    if (prices.data.length > 0) {
      price = prices.data[0];
    } else {
      // Create new product and price
      const product = await stripe.products.create({
        name: planConfig.name,
        description: planConfig.description,
      });

      const priceData: any = {
        unit_amount: planConfig.price,
        currency: planConfig.currency,
        product: product.id,
        lookup_key: plan,
      };

      if ("recurring" in planConfig && planConfig.recurring) {
        priceData.recurring = planConfig.recurring;
      }

      price = await stripe.prices.create(priceData);
    }

    // Create checkout session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url:
        successUrl ||
        `${baseUrl}/dashboard/success?session_id={CHECKOUT_SESSION_ID}&plan=MONTHLY_HEALTH_CHECK`,
      cancel_url: cancelUrl || `${baseUrl}/dashboard/upgrade?canceled=true`,
      metadata: {
        userId: user.id,
        plan: "MONTHLY_HEALTH_CHECK",
        timestamp: new Date().toISOString(),
      },
      allow_promotion_codes: true,
      billing_address_collection: "required",
      subscription_data: {
        metadata: {
          userId: user.id,
          plan: "MONTHLY_HEALTH_CHECK",
        },
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Create checkout session error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

export const POST = withCors(withAuth(handleCreateCheckoutSession));
