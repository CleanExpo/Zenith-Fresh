import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware";

async function handleGetBillingHistory(
  request: NextRequest,
  context: { user: any }
) {
  try {
    // Get user's subscription history from database
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: context.user.id,
        status: "ACTIVE",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        status: true,
        plan: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        createdAt: true,
        stripeSubscriptionId: true,
      },
    });

    // Transform subscriptions to billing history format
    const billingHistory = subscriptions.map((subscription) => ({
      id: subscription.id,
      date: subscription.createdAt.toISOString().split("T")[0],
      amount: "$275.00", // Monthly Health Check price
      description: "Monthly Health Check",
      status: subscription.status.toLowerCase(),
      invoiceUrl: `/api/billing/invoice/${subscription.stripeSubscriptionId}`,
    }));

    return NextResponse.json({ history: billingHistory });
  } catch (error) {
    console.error("Failed to fetch billing history:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing history" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGetBillingHistory);
