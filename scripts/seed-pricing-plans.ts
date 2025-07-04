/**
 * Seed Pricing Plans
 * Sets up default pricing plans in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PRICING_PLANS = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    currency: 'usd',
    interval: 'month',
    isActive: true,
    features: [
      '5 website scans per day',
      'Basic health score',
      'Email support',
      'Community access',
    ],
    limits: {
      websiteScans: 5,
      teamMembers: 1,
      apiCalls: 100,
      storageGb: 1,
    },
    stripePriceId: null,
    metadata: {
      isPopular: false,
      trialDays: 0,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Advanced features for growing businesses',
    price: 79,
    currency: 'usd',
    interval: 'month',
    isActive: true,
    features: [
      '100 website scans per day',
      'Advanced AI analysis',
      'Competitive intelligence',
      'Priority support',
      'API access',
      'Export reports',
      'Team collaboration',
      'Custom integrations',
    ],
    limits: {
      websiteScans: 100,
      teamMembers: 10,
      apiCalls: 10000,
      storageGb: 50,
    },
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || null,
    metadata: {
      isPopular: true,
      trialDays: 14,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Full-scale solution for large organizations',
    price: 299,
    currency: 'usd',
    interval: 'month',
    isActive: true,
    features: [
      'Unlimited website scans',
      'GPT-4 AI analysis',
      'White-label reports',
      'Custom branding',
      'SSO integration',
      'Dedicated support',
      'SLA guarantee',
      'Multi-region deployment',
      'Advanced compliance',
      'Custom integrations',
    ],
    limits: {
      websiteScans: -1, // Unlimited
      teamMembers: -1, // Unlimited
      apiCalls: -1, // Unlimited
      storageGb: 1000,
    },
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || null,
    metadata: {
      isPopular: false,
      trialDays: 30,
    },
  },
];

async function seedPricingPlans() {
  console.log('🌱 Seeding pricing plans...');

  try {
    for (const planData of PRICING_PLANS) {
      const existingPlan = await prisma.pricingPlan.findFirst({
        where: { id: planData.id },
      });

      if (existingPlan) {
        console.log(`📝 Updating existing plan: ${planData.name}`);
        await prisma.pricingPlan.update({
          where: { id: planData.id },
          data: planData,
        });
      } else {
        console.log(`✨ Creating new plan: ${planData.name}`);
        await prisma.pricingPlan.create({
          data: planData,
        });
      }
    }

    console.log('✅ Pricing plans seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding pricing plans:', error);
    throw error;
  }
}

async function seedFeatureFlags() {
  console.log('🚩 Seeding feature flags...');

  const FEATURE_FLAGS = [
    {
      key: 'ai.gpt4',
      name: 'GPT-4 AI Analysis',
      description: 'Advanced AI analysis using GPT-4',
      type: 'boolean',
      value: { enabled: true },
      requiredPlan: 'pro',
      isEnabled: true,
    },
    {
      key: 'ai.claude',
      name: 'Claude AI Assistant',
      description: 'Claude AI integration for advanced assistance',
      type: 'boolean',
      value: { enabled: true },
      requiredPlan: 'pro',
      isEnabled: true,
    },
    {
      key: 'team.unlimited_members',
      name: 'Unlimited Team Members',
      description: 'Add unlimited team members',
      type: 'boolean',
      value: { enabled: true },
      requiredPlan: 'enterprise',
      isEnabled: true,
    },
    {
      key: 'integrations.api_access',
      name: 'API Access',
      description: 'Full API access for integrations',
      type: 'boolean',
      value: { enabled: true },
      requiredPlan: 'pro',
      isEnabled: true,
    },
    {
      key: 'analytics.white_label',
      name: 'White Label Reports',
      description: 'Custom branded reports',
      type: 'boolean',
      value: { enabled: true },
      requiredPlan: 'enterprise',
      isEnabled: true,
    },
    {
      key: 'support.priority',
      name: 'Priority Support',
      description: '24/7 priority support',
      type: 'boolean',
      value: { enabled: true },
      requiredPlan: 'pro',
      isEnabled: true,
    },
  ];

  try {
    for (const flagData of FEATURE_FLAGS) {
      const existingFlag = await prisma.featureFlag.findFirst({
        where: { key: flagData.key },
      });

      if (existingFlag) {
        console.log(`📝 Updating existing feature flag: ${flagData.name}`);
        await prisma.featureFlag.update({
          where: { key: flagData.key },
          data: flagData,
        });
      } else {
        console.log(`✨ Creating new feature flag: ${flagData.name}`);
        await prisma.featureFlag.create({
          data: flagData,
        });
      }
    }

    console.log('✅ Feature flags seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding feature flags:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedPricingPlans();
    await seedFeatureFlags();
    console.log('🎉 All data seeded successfully!');
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { seedPricingPlans, seedFeatureFlags };