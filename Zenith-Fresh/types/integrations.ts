/**
 * Enterprise Integrations Types
 * Comprehensive type definitions for the enterprise integration hub
 */

export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'syncing' | 'pending';
export type IntegrationType = 'crm' | 'marketing' | 'analytics' | 'social' | 'webhook' | 'sso' | 'etl';
export type AuthType = 'oauth2' | 'api_key' | 'basic' | 'saml' | 'oidc' | 'webhook' | 'custom';

export interface BaseIntegration {
  id: string;
  name: string;
  type: IntegrationType;
  provider: string;
  status: IntegrationStatus;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
  nextSyncAt?: Date;
  config: IntegrationConfig;
  metadata: IntegrationMetadata;
  settings: IntegrationSettings;
}

export interface IntegrationConfig {
  authType: AuthType;
  credentials: {
    clientId?: string;
    clientSecret?: string;
    apiKey?: string;
    accessToken?: string;
    refreshToken?: string;
    webhookUrl?: string;
    username?: string;
    password?: string;
    customFields?: Record<string, any>;
  };
  endpoints: {
    auth?: string;
    api?: string;
    webhook?: string;
    refresh?: string;
  };
  scopes?: string[];
  permissions?: string[];
}

export interface IntegrationMetadata {
  version: string;
  description: string;
  documentation?: string;
  supportEmail?: string;
  tags: string[];
  category: string;
  vendor: {
    name: string;
    website?: string;
    logo?: string;
  };
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
}

export interface IntegrationSettings {
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';
  retryAttempts: number;
  timeout: number;
  batchSize: number;
  enableLogging: boolean;
  enableNotifications: boolean;
  customMappings: Record<string, string>;
  filters: IntegrationFilter[];
}

export interface IntegrationFilter {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
  value: any;
  enabled: boolean;
}

export interface IntegrationStats {
  totalConnections: number;
  activeConnections: number;
  errorConnections: number;
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  dataPointsSynced: number;
  averageSyncTime: number;
  lastSyncDuration: number;
  uptimePercentage: number;
}

export interface IntegrationEvent {
  id: string;
  integrationId: string;
  type: 'sync' | 'error' | 'connection' | 'webhook' | 'auth';
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  duration?: number;
}

export interface WebhookEvent {
  id: string;
  integrationId: string;
  source: string;
  event: string;
  payload: Record<string, any>;
  headers: Record<string, string>;
  timestamp: Date;
  processed: boolean;
  processingTime?: number;
  error?: string;
}

export interface SyncJob {
  id: string;
  integrationId: string;
  type: 'full' | 'incremental' | 'manual';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  recordsFailed: number;
  errors: string[];
  logs: string[];
}

// CRM Integration Types
export interface CRMContact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  phone?: string;
  customFields: Record<string, any>;
  tags: string[];
  lastActivity?: Date;
  leadScore?: number;
  lifecycle?: string;
}

export interface CRMDeal {
  id: string;
  name: string;
  value: number;
  currency: string;
  stage: string;
  probability: number;
  contactId?: string;
  companyId?: string;
  ownerId?: string;
  expectedCloseDate?: Date;
  customFields: Record<string, any>;
}

export interface CRMCompany {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  revenue?: number;
  phone?: string;
  address?: string;
  customFields: Record<string, any>;
}

// Marketing Integration Types
export interface MarketingCampaign {
  id: string;
  name: string;
  type: 'email' | 'social' | 'ads' | 'content';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    cost: number;
    ctr: number;
    cpc: number;
    cpa: number;
  };
}

export interface MarketingContact {
  id: string;
  email: string;
  status: 'subscribed' | 'unsubscribed' | 'bounced' | 'complained';
  tags: string[];
  customFields: Record<string, any>;
  segments: string[];
  engagement: {
    emailsOpened: number;
    emailsClicked: number;
    lastActivity?: Date;
  };
}

// Analytics Integration Types
export interface AnalyticsMetric {
  name: string;
  value: number;
  dimension?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AnalyticsReport {
  id: string;
  name: string;
  metrics: AnalyticsMetric[];
  dimensions: string[];
  filters: Record<string, any>;
  dateRange: {
    start: Date;
    end: Date;
  };
  generatedAt: Date;
}

// Social Media Integration Types
export interface SocialPost {
  id: string;
  platform: 'twitter' | 'facebook' | 'linkedin' | 'instagram';
  content: string;
  mediaUrls?: string[];
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledAt?: Date;
  publishedAt?: Date;
  metrics?: {
    likes: number;
    shares: number;
    comments: number;
    impressions: number;
    engagement: number;
  };
}

export interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  displayName: string;
  verified: boolean;
  followers: number;
  following: number;
  profileImage?: string;
  connected: boolean;
}

// ETL Pipeline Types
export interface ETLPipeline {
  id: string;
  name: string;
  description: string;
  sourceIntegrationId: string;
  targetIntegrationId: string;
  transformations: ETLTransformation[];
  schedule: {
    type: 'cron' | 'interval';
    expression: string;
  };
  status: 'active' | 'paused' | 'error';
  lastRun?: {
    startedAt: Date;
    completedAt: Date;
    recordsProcessed: number;
    status: 'success' | 'error';
    error?: string;
  };
}

export interface ETLTransformation {
  id: string;
  type: 'map' | 'filter' | 'aggregate' | 'join' | 'custom';
  config: Record<string, any>;
  order: number;
}

// SSO Integration Types
export interface SSOProvider {
  id: string;
  name: string;
  type: 'saml' | 'oidc' | 'oauth2';
  config: {
    entityId?: string;
    ssoUrl?: string;
    certificate?: string;
    issuer?: string;
    authorizationUrl?: string;
    tokenUrl?: string;
    userInfoUrl?: string;
    jwksUrl?: string;
    clientId?: string;
    clientSecret?: string;
  };
  attributeMappings: Record<string, string>;
  enabled: boolean;
  defaultRole?: string;
  autoProvision: boolean;
}

// API Types
export interface APIEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  parameters: APIParameter[];
  responses: APIResponse[];
  authentication: string[];
  rateLimit?: {
    requests: number;
    window: string;
  };
  deprecated: boolean;
}

export interface APIParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  example?: any;
  validation?: Record<string, any>;
}

export interface APIResponse {
  statusCode: number;
  description: string;
  schema: Record<string, any>;
  example?: any;
}

// SDK Types
export interface SDK {
  language: string;
  version: string;
  packageName: string;
  downloadUrl: string;
  documentation: string;
  examples: SDKExample[];
  installation: string;
  lastUpdated: Date;
}

export interface SDKExample {
  title: string;
  description: string;
  code: string;
  language: string;
}

// Marketplace Types
export interface MarketplaceConnector {
  id: string;
  name: string;
  description: string;
  provider: string;
  category: string;
  version: string;
  price: number;
  currency: string;
  rating: number;
  downloads: number;
  screenshots: string[];
  features: string[];
  requirements: string[];
  installation: string;
  documentation: string;
  support: string;
  verified: boolean;
  lastUpdated: Date;
}

export interface ConnectorInstallation {
  id: string;
  connectorId: string;
  userId: string;
  teamId: string;
  installedAt: Date;
  version: string;
  config: Record<string, any>;
  enabled: boolean;
  license?: {
    type: 'free' | 'paid' | 'trial';
    expiresAt?: Date;
    features: string[];
  };
}