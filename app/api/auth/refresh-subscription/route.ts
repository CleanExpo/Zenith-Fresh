import { type NextRequest, NextResponse } from "next/server";
import { withAuth, withCors } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

async function handleRefreshSubscription(
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
    console.error("Refresh subscription error:", error);
    return NextResponse.json(
      { error: "Failed to refresh subscription" },
      { status: 500 }
    );
  }
}

export const POST = withCors(withAuth(handleRefreshSubscription));
