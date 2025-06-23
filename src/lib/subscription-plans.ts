export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  stripePriceId: string;
  features: SubscriptionFeature[];
  limits: SubscriptionLimits;
  popular?: boolean;
  enterprise?: boolean;
}

export interface SubscriptionFeature {
  name: string;
  description: string;
  included: boolean;
  limit?: number;
}

export interface SubscriptionLimits {
  projects: number;
  teamMembers: number;
  apiCalls: number;
  storage: number; // in GB
  aiAgents: number;
  emailCampaigns: number;
  reviewCampaigns: number;
  seoAnalyses: number;
  partnerProgram: boolean;
  customIntegrations: boolean;
  prioritySupport: boolean;
  whiteLabel: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    currency: 'USD',
    interval: 'month',
    stripePriceId: '', // No Stripe price for free plan
    features: [
      { name: 'Basic SEO Analysis', description: 'Free URL health checks', included: true },
      { name: 'Project Management', description: 'Up to 3 projects', included: true, limit: 3 },
      { name: 'Team Members', description: 'Up to 2 team members', included: true, limit: 2 },
      { name: 'API Access', description: '1,000 calls per month', included: true, limit: 1000 },
      { name: 'Storage', description: '1GB file storage', included: true, limit: 1 },
      { name: 'AI Agents', description: 'No AI agents', included: false },
      { name: 'Email Support', description: 'Community support only', included: false },
    ],
    limits: {
      projects: 3,
      teamMembers: 2,
      apiCalls: 1000,
      storage: 1,
      aiAgents: 0,
      emailCampaigns: 0,
      reviewCampaigns: 0,
      seoAnalyses: 10,
      partnerProgram: false,
      customIntegrations: false,
      prioritySupport: false,
      whiteLabel: false,
    },
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'For small teams getting serious',
    price: 29,
    currency: 'USD',
    interval: 'month',
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID || '',
    features: [
      { name: 'Advanced SEO Analysis', description: 'Comprehensive keyword & traffic data', included: true },
      { name: 'Project Management', description: 'Up to 10 projects', included: true, limit: 10 },
      { name: 'Team Members', description: 'Up to 5 team members', included: true, limit: 5 },
      { name: 'API Access', description: '10,000 calls per month', included: true, limit: 10000 },
      { name: 'Storage', description: '10GB file storage', included: true, limit: 10 },
      { name: 'AI Agents', description: '3 AI agents', included: true, limit: 3 },
      { name: 'Email Campaigns', description: '5 campaigns per month', included: true, limit: 5 },
      { name: 'Email Support', description: 'Email support included', included: true },
    ],
    limits: {
      projects: 10,
      teamMembers: 5,
      apiCalls: 10000,
      storage: 10,
      aiAgents: 3,
      emailCampaigns: 5,
      reviewCampaigns: 3,
      seoAnalyses: 100,
      partnerProgram: false,
      customIntegrations: false,
      prioritySupport: false,
      whiteLabel: false,
    },
    popular: true,
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing businesses',
    price: 99,
    currency: 'USD',
    interval: 'month',
    stripePriceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID || '',
    features: [
      { name: 'Complete SEO Suite', description: 'All SEO tools + competitor analysis', included: true },
      { name: 'Project Management', description: 'Up to 50 projects', included: true, limit: 50 },
      { name: 'Team Members', description: 'Up to 15 team members', included: true, limit: 15 },
      { name: 'API Access', description: '100,000 calls per month', included: true, limit: 100000 },
      { name: 'Storage', description: '100GB file storage', included: true, limit: 100 },
      { name: 'AI Agents', description: '10 AI agents', included: true, limit: 10 },
      { name: 'Email Campaigns', description: 'Unlimited campaigns', included: true },
      { name: 'Review Campaigns', description: '20 campaigns per month', included: true, limit: 20 },
      { name: 'Priority Support', description: 'Priority email & chat support', included: true },
      { name: 'Custom Integrations', description: 'API webhooks & custom integrations', included: true },
    ],
    limits: {
      projects: 50,
      teamMembers: 15,
      apiCalls: 100000,
      storage: 100,
      aiAgents: 10,
      emailCampaigns: -1, // Unlimited
      reviewCampaigns: 20,
      seoAnalyses: 1000,
      partnerProgram: true,
      customIntegrations: true,
      prioritySupport: true,
      whiteLabel: false,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    price: 299,
    currency: 'USD',
    interval: 'month',
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
    features: [
      { name: 'Enterprise SEO Platform', description: 'White-label SEO platform', included: true },
      { name: 'Project Management', description: 'Unlimited projects', included: true },
      { name: 'Team Members', description: 'Unlimited team members', included: true },
      { name: 'API Access', description: 'Unlimited API calls', included: true },
      { name: 'Storage', description: '1TB file storage', included: true, limit: 1000 },
      { name: 'AI Agents', description: 'All 20+ AI agents', included: true },
      { name: 'Email Campaigns', description: 'Unlimited campaigns', included: true },
      { name: 'Review Campaigns', description: 'Unlimited campaigns', included: true },
      { name: 'White Label', description: 'Custom branding & white-label solution', included: true },
      { name: 'Dedicated Support', description: 'Dedicated account manager', included: true },
      { name: 'SLA Guarantee', description: '99.9% uptime SLA', included: true },
    ],
    limits: {
      projects: -1, // Unlimited
      teamMembers: -1, // Unlimited
      apiCalls: -1, // Unlimited
      storage: 1000,
      aiAgents: -1, // All agents
      emailCampaigns: -1, // Unlimited
      reviewCampaigns: -1, // Unlimited
      seoAnalyses: -1, // Unlimited
      partnerProgram: true,
      customIntegrations: true,
      prioritySupport: true,
      whiteLabel: true,
    },
    enterprise: true,
  },
];

export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
}

export function getFeatureLimit(planId: string, feature: keyof SubscriptionLimits): number | boolean {
  const plan = getPlanById(planId);
  if (!plan) return false;
  return plan.limits[feature];
}

export function hasFeatureAccess(planId: string, feature: keyof SubscriptionLimits): boolean {
  const limit = getFeatureLimit(planId, feature);
  if (typeof limit === 'boolean') return limit;
  if (typeof limit === 'number') return limit > 0 || limit === -1; // -1 means unlimited
  return false;
}

export function isWithinLimit(planId: string, feature: keyof SubscriptionLimits, currentUsage: number): boolean {
  const limit = getFeatureLimit(planId, feature);
  if (typeof limit === 'boolean') return limit;
  if (typeof limit === 'number') {
    if (limit === -1) return true; // Unlimited
    return currentUsage < limit;
  }
  return false;
}

export function getUpgradePromptMessage(planId: string, feature: keyof SubscriptionLimits): string {
  const currentPlan = getPlanById(planId);
  const nextPlan = getNextPlan(planId);
  
  const featureMessages: Record<keyof SubscriptionLimits, string> = {
    projects: `You've reached your project limit. Upgrade to ${nextPlan?.name} for ${nextPlan?.limits.projects === -1 ? 'unlimited' : nextPlan?.limits.projects} projects.`,
    teamMembers: `You've reached your team member limit. Upgrade to ${nextPlan?.name} for ${nextPlan?.limits.teamMembers === -1 ? 'unlimited' : nextPlan?.limits.teamMembers} team members.`,
    apiCalls: `You've reached your API call limit for this month. Upgrade to ${nextPlan?.name} for ${nextPlan?.limits.apiCalls === -1 ? 'unlimited' : nextPlan?.limits.apiCalls?.toLocaleString()} API calls.`,
    storage: `You've reached your storage limit. Upgrade to ${nextPlan?.name} for ${nextPlan?.limits.storage}GB storage.`,
    aiAgents: `You need access to AI agents. Upgrade to ${nextPlan?.name} to unlock ${nextPlan?.limits.aiAgents === -1 ? 'all' : nextPlan?.limits.aiAgents} AI agents.`,
    emailCampaigns: `You've reached your email campaign limit. Upgrade to ${nextPlan?.name} for ${nextPlan?.limits.emailCampaigns === -1 ? 'unlimited' : nextPlan?.limits.emailCampaigns} campaigns.`,
    reviewCampaigns: `You need access to review campaigns. Upgrade to ${nextPlan?.name} to unlock review campaigns.`,
    seoAnalyses: `You've reached your SEO analysis limit. Upgrade to ${nextPlan?.name} for ${nextPlan?.limits.seoAnalyses === -1 ? 'unlimited' : nextPlan?.limits.seoAnalyses} analyses.`,
    partnerProgram: `Partner program access requires a paid plan. Upgrade to ${nextPlan?.name} to access the partner program.`,
    customIntegrations: `Custom integrations require a Professional plan or higher.`,
    prioritySupport: `Priority support is available with Professional and Enterprise plans.`,
    whiteLabel: `White-label features are only available with Enterprise plans.`,
  };

  return featureMessages[feature] || `This feature requires a higher plan. Upgrade to ${nextPlan?.name} to unlock more features.`;
}

function getNextPlan(currentPlanId: string): SubscriptionPlan | undefined {
  const planOrder = ['free', 'starter', 'professional', 'enterprise'];
  const currentIndex = planOrder.indexOf(currentPlanId);
  if (currentIndex === -1 || currentIndex === planOrder.length - 1) return undefined;
  return getPlanById(planOrder[currentIndex + 1]);
}