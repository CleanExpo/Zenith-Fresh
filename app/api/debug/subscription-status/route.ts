import { type NextRequest, NextResponse } from "next/server";
import { withAuth, withCors } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

async function handleGetSubscriptionStatus(
  request: NextRequest,
  context: { user: any }
) {
  try {
    // Get the latest user data with subscription info directly from database
    const user = await prisma.user.findUnique({
      where: { id: context.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        subscription: {
          select: {
            id: true,
            status: true,
            plan: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
            canceledAt: true,
            stripeSubscriptionId: true,
          },
        },
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if subscription is active
    const hasActiveSubscription =
      !!user.subscription && user.subscription.status === "ACTIVE";

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        subscription: user.subscription,
        hasActiveSubscription,
        createdAt: user.createdAt,
      },
      debug: {
        subscriptionExists: !!user.subscription,
        subscriptionStatus: user.subscription?.status,
        subscriptionPlan: user.subscription?.plan,
        isActive: hasActiveSubscription,
        currentTime: new Date().toISOString(),
        subscriptionStart: user.subscription?.currentPeriodStart,
        subscriptionEnd: user.subscription?.currentPeriodEnd,
      },
    });
  } catch (error) {
    console.error("Debug subscription status error:", error);
    return NextResponse.json(
      { error: "Failed to get subscription status" },
      { status: 500 }
    );
  }
}

async function handleCreateTestSubscription(
  request: NextRequest,
  context: { user: any }
) {
  try {
    // Check if user already has a subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: context.user.id },
    });

    if (existingSubscription) {
      return NextResponse.json({
        message: "User already has a subscription",
        subscription: existingSubscription,
      });
    }

    // Create a test subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: context.user.id,
        stripeSubscriptionId: `test_sub_${Date.now()}`,
        stripePriceId: "price_monthly_health_check",
        stripeCustomerId: `test_customer_${Date.now()}`,
        status: "ACTIVE",
        plan: "MONTHLY_HEALTH_CHECK",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      message: "Test subscription created successfully",
      subscription,
    });
  } catch (error) {
    console.error("Create test subscription error:", error);
    return NextResponse.json(
      { error: "Failed to create test subscription" },
      { status: 500 }
    );
  }
}

export const GET = withCors(withAuth(handleGetSubscriptionStatus));
export const POST = withCors(withAuth(handleCreateTestSubscription));
