import { type NextRequest, NextResponse } from "next/server";
import { StripeService, stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature")!;

    const event = await StripeService.handleWebhook(body, signature);

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
      // Unhandled event type
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const { userId, plan } = session.metadata || {};

  if (session.payment_status === "paid") {
    // Handle subscription creation/update
    if (plan === "MONTHLY_HEALTH_CHECK" && session.subscription) {
      try {
        // Get userId from customer if not in metadata
        let finalUserId = userId;
        if (!finalUserId && session.customer) {
          const customer = await stripe.customers.retrieve(
            session.customer as string
          );
          finalUserId = (customer as any).metadata?.userId;
        }

        if (!finalUserId) {
          throw new Error("No userId found for subscription");
        }

        // Update or create subscription record
        let subscription = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: session.subscription as string },
        });

        if (!subscription) {
          // Create new subscription record
          subscription = await prisma.subscription.create({
            data: {
              userId: finalUserId,
              stripeSubscriptionId: session.subscription as string,
              stripePriceId: "price_monthly_health_check",
              stripeCustomerId: session.customer as string,
              status: "ACTIVE",
              plan: "MONTHLY_HEALTH_CHECK",
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            },
          });
        } else {
          // Update existing subscription
          await prisma.subscription.update({
            where: { stripeSubscriptionId: session.subscription as string },
            data: { status: "ACTIVE" },
          });
        }

        // Verify subscription was created/updated successfully
        const verifiedSubscription = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: session.subscription as string },
        });

        if (!verifiedSubscription) {
          throw new Error("Failed to create subscription record");
        }
      } catch (error) {
        console.error("Error processing subscription:", error);
        throw error;
      }
    }
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (dbSubscription) {
    const updatedSubscription = await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status.toUpperCase() as any,
        currentPeriodStart: new Date(
          (subscription as any).current_period_start * 1000
        ),
        currentPeriodEnd: new Date(
          (subscription as any).current_period_end * 1000
        ),
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
        canceledAt: (subscription as any).canceled_at
          ? new Date((subscription as any).canceled_at * 1000)
          : null,
      },
    });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: "CANCELED",
      canceledAt: new Date(),
    },
  });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if ((invoice as any).subscription) {
    // Handle successful subscription payment
    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: (invoice as any).subscription as string },
      include: { user: true },
    });

    if (subscription) {
      // Update subscription status to ACTIVE if it's not already
      if (subscription.status !== "ACTIVE") {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "ACTIVE" },
        });
      }

      // TODO: Trigger monthly health check analysis
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if ((invoice as any).subscription) {
    // Handle failed subscription payment
    // TODO: Send notification to user about failed payment
  }
}
