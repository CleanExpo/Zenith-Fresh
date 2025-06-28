import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

interface IntegrationConnector {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  provider: string;
  logoUrl: string;
  authType: 'oauth2' | 'api_key' | 'basic_auth';
  popular: boolean;
  pricing: 'free' | 'paid' | 'enterprise';
  features: string[];
  setupComplexity: 'easy' | 'medium' | 'advanced';
  documentationUrl: string;
  requiredScopes?: string[];
  endpoints: {
    authorization?: string;
    token?: string;
    api?: string;
  };
}

// Available integration connectors
const INTEGRATION_MARKETPLACE: IntegrationConnector[] = [
  {
    id: 'salesforce',
    name: 'salesforce',
    displayName: 'Salesforce',
    description: 'Sync contacts, leads, and opportunities with Salesforce CRM',
    category: 'CRM',
    provider: 'salesforce.com',
    logoUrl: '/integrations/salesforce-logo.png',
    authType: 'oauth2',
    popular: true,
    pricing: 'free',
    features: ['Contact Sync', 'Lead Management', 'Opportunity Tracking', 'Custom Objects'],
    setupComplexity: 'medium',
    documentationUrl: 'https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/',
    requiredScopes: ['api', 'refresh_token'],
    endpoints: {
      authorization: 'https://login.salesforce.com/services/oauth2/authorize',
      token: 'https://login.salesforce.com/services/oauth2/token',
      api: 'https://your-instance.salesforce.com/services/data',
    },
  },
  {
    id: 'hubspot',
    name: 'hubspot',
    displayName: 'HubSpot',
    description: 'Connect with HubSpot CRM for contact and deal management',
    category: 'CRM',
    provider: 'hubspot.com',
    logoUrl: '/integrations/hubspot-logo.png',
    authType: 'oauth2',
    popular: true,
    pricing: 'free',
    features: ['Contact Management', 'Deal Tracking', 'Email Marketing', 'Analytics'],
    setupComplexity: 'easy',
    documentationUrl: 'https://developers.hubspot.com/docs/api/overview',
    requiredScopes: ['contacts', 'content', 'forms', 'oauth'],
    endpoints: {
      authorization: 'https://app.hubspot.com/oauth/authorize',
      token: 'https://api.hubapi.com/oauth/v1/token',
      api: 'https://api.hubapi.com',
    },
  },
  {
    id: 'slack',
    name: 'slack',
    displayName: 'Slack',
    description: 'Send notifications and updates to Slack channels',
    category: 'Communication',
    provider: 'slack.com',
    logoUrl: '/integrations/slack-logo.png',
    authType: 'oauth2',
    popular: true,
    pricing: 'free',
    features: ['Channel Notifications', 'Direct Messages', 'File Sharing', 'Bot Integration'],
    setupComplexity: 'easy',
    documentationUrl: 'https://api.slack.com/docs',
    requiredScopes: ['chat:write', 'channels:read', 'users:read'],
    endpoints: {
      authorization: 'https://slack.com/oauth/v2/authorize',
      token: 'https://slack.com/api/oauth.v2.access',
      api: 'https://slack.com/api',
    },
  },
  {
    id: 'microsoft-teams',
    name: 'microsoft-teams',
    displayName: 'Microsoft Teams',
    description: 'Integrate with Microsoft Teams for collaboration and notifications',
    category: 'Communication',
    provider: 'microsoft.com',
    logoUrl: '/integrations/teams-logo.png',
    authType: 'oauth2',
    popular: true,
    pricing: 'free',
    features: ['Team Notifications', 'Channel Integration', 'File Sharing', 'Meeting Integration'],
    setupComplexity: 'medium',
    documentationUrl: 'https://docs.microsoft.com/en-us/graph/api/overview',
    requiredScopes: ['ChannelMessage.Send', 'Team.ReadBasic.All'],
    endpoints: {
      authorization: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      token: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      api: 'https://graph.microsoft.com/v1.0',
    },
  },
  {
    id: 'github',
    name: 'github',
    displayName: 'GitHub',
    description: 'Connect with GitHub repositories for issue tracking and deployment',
    category: 'Development',
    provider: 'github.com',
    logoUrl: '/integrations/github-logo.png',
    authType: 'oauth2',
    popular: true,
    pricing: 'free',
    features: ['Repository Access', 'Issue Management', 'Pull Requests', 'Webhooks'],
    setupComplexity: 'medium',
    documentationUrl: 'https://docs.github.com/en/rest',
    requiredScopes: ['repo', 'user', 'admin:repo_hook'],
    endpoints: {
      authorization: 'https://github.com/login/oauth/authorize',
      token: 'https://github.com/login/oauth/access_token',
      api: 'https://api.github.com',
    },
  },
  {
    id: 'google-analytics',
    name: 'google-analytics',
    displayName: 'Google Analytics',
    description: 'Import website analytics data and create custom reports',
    category: 'Analytics',
    provider: 'google.com',
    logoUrl: '/integrations/google-analytics-logo.png',
    authType: 'oauth2',
    popular: true,
    pricing: 'free',
    features: ['Traffic Data', 'Conversion Tracking', 'Custom Reports', 'Real-time Data'],
    setupComplexity: 'medium',
    documentationUrl: 'https://developers.google.com/analytics/devguides/reporting/core/v4',
    requiredScopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    endpoints: {
      authorization: 'https://accounts.google.com/o/oauth2/auth',
      token: 'https://oauth2.googleapis.com/token',
      api: 'https://analyticsreporting.googleapis.com/v4',
    },
  },
  {
    id: 'stripe',
    name: 'stripe',
    displayName: 'Stripe',
    description: 'Sync payment data and customer information from Stripe',
    category: 'Payment',
    provider: 'stripe.com',
    logoUrl: '/integrations/stripe-logo.png',
    authType: 'api_key',
    popular: true,
    pricing: 'free',
    features: ['Payment Data', 'Customer Sync', 'Subscription Management', 'Revenue Analytics'],
    setupComplexity: 'easy',
    documentationUrl: 'https://stripe.com/docs/api',
    endpoints: {
      api: 'https://api.stripe.com/v1',
    },
  },
  {
    id: 'mailchimp',
    name: 'mailchimp',
    displayName: 'Mailchimp',
    description: 'Sync email lists and campaign data from Mailchimp',
    category: 'Marketing',
    provider: 'mailchimp.com',
    logoUrl: '/integrations/mailchimp-logo.png',
    authType: 'oauth2',
    popular: false,
    pricing: 'free',
    features: ['List Management', 'Campaign Analytics', 'Audience Sync', 'Automation'],
    setupComplexity: 'easy',
    documentationUrl: 'https://mailchimp.com/developer/marketing/',
    requiredScopes: ['read', 'write'],
    endpoints: {
      authorization: 'https://login.mailchimp.com/oauth2/authorize',
      token: 'https://login.mailchimp.com/oauth2/token',
      api: 'https://server.api.mailchimp.com/3.0',
    },
  },
  {
    id: 'zendesk',
    name: 'zendesk',
    displayName: 'Zendesk',
    description: 'Integrate customer support tickets and agent performance data',
    category: 'Support',
    provider: 'zendesk.com',
    logoUrl: '/integrations/zendesk-logo.png',
    authType: 'oauth2',
    popular: false,
    pricing: 'free',
    features: ['Ticket Management', 'Agent Analytics', 'Customer Data', 'SLA Tracking'],
    setupComplexity: 'medium',
    documentationUrl: 'https://developer.zendesk.com/api-reference/',
    requiredScopes: ['read', 'write'],
    endpoints: {
      authorization: 'https://your-subdomain.zendesk.com/oauth/authorizations/new',
      token: 'https://your-subdomain.zendesk.com/oauth/tokens',
      api: 'https://your-subdomain.zendesk.com/api/v2',
    },
  },
  {
    id: 'zapier',
    name: 'zapier',
    displayName: 'Zapier',
    description: 'Connect with 5,000+ apps through Zapier automation platform',
    category: 'Automation',
    provider: 'zapier.com',
    logoUrl: '/integrations/zapier-logo.png',
    authType: 'api_key',
    popular: true,
    pricing: 'paid',
    features: ['Multi-app Workflows', 'Trigger Actions', 'Data Transformation', 'Conditional Logic'],
    setupComplexity: 'advanced',
    documentationUrl: 'https://platform.zapier.com/docs/api',
    endpoints: {
      api: 'https://zapier.com/api/v1',
    },
  },
];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const popular = searchParams.get('popular');
    const pricing = searchParams.get('pricing');
    const search = searchParams.get('search');

    let filteredIntegrations = [...INTEGRATION_MARKETPLACE];

    // Apply filters
    if (category) {
      filteredIntegrations = filteredIntegrations.filter(
        integration => integration.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (popular === 'true') {
      filteredIntegrations = filteredIntegrations.filter(
        integration => integration.popular
      );
    }

    if (pricing) {
      filteredIntegrations = filteredIntegrations.filter(
        integration => integration.pricing === pricing
      );
    }

    if (search) {
      const searchTerm = search.toLowerCase();
      filteredIntegrations = filteredIntegrations.filter(
        integration =>
          integration.displayName.toLowerCase().includes(searchTerm) ||
          integration.description.toLowerCase().includes(searchTerm) ||
          integration.features.some(feature => feature.toLowerCase().includes(searchTerm))
      );
    }

    // Get unique categories for filtering
    const categories = [...new Set(INTEGRATION_MARKETPLACE.map(i => i.category))];

    return NextResponse.json({
      success: true,
      integrations: filteredIntegrations,
      categories,
      total: filteredIntegrations.length,
      filters: {
        category,
        popular: popular === 'true',
        pricing,
        search,
      },
    });
  } catch (error) {
    console.error('Failed to get marketplace integrations:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve integrations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { integrationId } = await request.json();

    if (!integrationId) {
      return NextResponse.json(
        { error: 'Integration ID is required' },
        { status: 400 }
      );
    }

    // Find the integration
    const integration = INTEGRATION_MARKETPLACE.find(i => i.id === integrationId);
    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // For OAuth integrations, return the authorization URL
    if (integration.authType === 'oauth2') {
      const authUrl = `/api/integrations/oauth/${integration.name}`;
      return NextResponse.json({
        success: true,
        authType: 'oauth2',
        authUrl,
        integration: {
          id: integration.id,
          name: integration.displayName,
          requiredScopes: integration.requiredScopes,
        },
      });
    }

    // For API key integrations, return setup instructions
    if (integration.authType === 'api_key') {
      return NextResponse.json({
        success: true,
        authType: 'api_key',
        integration: {
          id: integration.id,
          name: integration.displayName,
          setupInstructions: `Please provide your ${integration.displayName} API key`,
          documentationUrl: integration.documentationUrl,
        },
      });
    }

    return NextResponse.json({
      success: true,
      integration,
    });
  } catch (error) {
    console.error('Failed to connect integration:', error);
    return NextResponse.json(
      { error: 'Failed to connect integration' },
      { status: 500 }
    );
  }
}