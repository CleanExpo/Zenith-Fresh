import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
});

export const PRICING_PLANS = {
  MONTHLY_HEALTH_CHECK: {
    name: "Monthly Health Check",
    price: 27500, // $275.00 in cents
    currency: "usd",
    description: "Ongoing website monitoring and optimization",
    features: [
      "Monthly comprehensive site analysis",
      "Performance monitoring",
      "SEO health tracking",
      "Security vulnerability scanning",
      "Detailed monthly reports",
      "Priority email support",
      "Optimization recommendations",
    ],
    recurring: {
      interval: "month" as const,
    },
  },
} as const;

export type PricingPlan = keyof typeof PRICING_PLANS;

export class StripeService {
  static async createPaymentIntent(plan: PricingPlan, customerEmail?: string) {
    const planConfig = PRICING_PLANS[plan];

    const paymentIntent = await stripe.paymentIntents.create({
      amount: planConfig.price,
      currency: planConfig.currency,
      metadata: {
        plan,
        customerEmail: customerEmail || "",
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  }

  static async createSubscription(customerId: string, plan: PricingPlan) {
    if (plan !== "MONTHLY_HEALTH_CHECK") {
      throw new Error("Only monthly health check supports subscriptions");
    }

    // Create or get the price
    const price = await this.getOrCreatePrice(plan);

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
    });

    return subscription;
  }

  static async createCustomer(email: string, name?: string) {
    const customer = await stripe.customers.create({
      email,
      name,
    });

    return customer;
  }

  static async getOrCreatePrice(plan: PricingPlan) {
    const planConfig = PRICING_PLANS[plan];

    // Try to find existing price
    const prices = await stripe.prices.list({
      lookup_keys: [plan],
      expand: ["data.product"],
    });

    if (prices.data.length > 0) {
      return prices.data[0];
    }

    // Create new product and price
    const product = await stripe.products.create({
      name: planConfig.name,
      description: planConfig.description,
    });

    const priceData: Stripe.PriceCreateParams = {
      unit_amount: planConfig.price,
      currency: planConfig.currency,
      product: product.id,
      lookup_key: plan,
    };

    if ("recurring" in planConfig && planConfig.recurring) {
      priceData.recurring = planConfig.recurring;
    }

    const price = await stripe.prices.create(priceData);

    return price;
  }

  static async handleWebhook(body: string, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err}`);
    }

    return event;
  }
}
