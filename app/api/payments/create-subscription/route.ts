import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { StripeService } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { withAuth, withCors } from "@/lib/middleware";

const createSubscriptionSchema = z.object({
  plan: z.literal("MONTHLY_HEALTH_CHECK"),
});

async function handleCreateSubscription(
  request: NextRequest,
  context: { user: any }
) {
  try {
    const body = await request.json();
    const { plan } = createSubscriptionSchema.parse(body);
    const user = context.user;

    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (existingSubscription && existingSubscription.status === "ACTIVE") {
      return NextResponse.json(
        { error: "User already has an active subscription" },
        { status: 400 }
      );
    }

    // Create or get Stripe customer
    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await StripeService.createCustomer(
        user.email,
        `${user.firstName || ""} ${user.lastName || ""}`.trim()
      );

      stripeCustomerId = customer.id;

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
    }

    // Create subscription
    const subscription = await StripeService.createSubscription(
      stripeCustomerId,
      plan
    );

    // Store subscription in database
    await prisma.subscription.create({
      data: {
        userId: user.id,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        stripeCustomerId,
        status: "INCOMPLETE",
        plan: "MONTHLY_HEALTH_CHECK",
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });

    const latestInvoice = subscription.latest_invoice as any;
    const paymentIntent = latestInvoice?.payment_intent;

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent?.client_secret,
      status: subscription.status,
    });
  } catch (error) {
    console.error("Create subscription error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}

export const POST = withCors(withAuth(handleCreateSubscription));
