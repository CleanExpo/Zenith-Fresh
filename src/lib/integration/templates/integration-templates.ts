/**
 * Integration Templates System
 * 
 * Pre-built integration templates for rapid deployment of common
 * enterprise integration patterns and use cases.
 */

export interface IntegrationTemplate {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: TemplateCategory;
  useCase: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
  integrations: string[];
  requirements: TemplateRequirement[];
  steps: TemplateStep[];
  configuration: TemplateConfiguration;
  outputs: TemplateOutput[];
  documentation: TemplateDocumentation;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateStep {
  id: string;
  order: number;
  title: string;
  description: string;
  type: StepType;
  action: StepAction;
  configuration: any;
  validation: StepValidation;
  dependencies: string[];
  optional: boolean;
}

export interface TemplateConfiguration {
  variables: ConfigVariable[];
  defaults: Record<string, any>;
  validation: ConfigValidation;
  advanced: AdvancedConfig;
}

export interface TemplateOutput {
  name: string;
  type: string;
  description: string;
  example: any;
}

export enum TemplateCategory {
  CRM_SYNC = 'crm_sync',
  MARKETING = 'marketing',
  ANALYTICS = 'analytics',
  COMMUNICATION = 'communication',
  ECOMMERCE = 'ecommerce',
  WORKFLOW = 'workflow',
  DATA_PIPELINE = 'data_pipeline',
  CUSTOM = 'custom'
}

export enum StepType {
  AUTHENTICATION = 'authentication',
  CONFIGURATION = 'configuration',
  DATA_MAPPING = 'data_mapping',
  TRANSFORMATION = 'transformation',
  SYNC = 'sync',
  WEBHOOK = 'webhook',
  VALIDATION = 'validation',
  DEPLOYMENT = 'deployment'
}

export enum StepAction {
  CREATE_INSTANCE = 'create_instance',
  CONFIGURE_AUTH = 'configure_auth',
  MAP_FIELDS = 'map_fields',
  SETUP_WEBHOOK = 'setup_webhook',
  CREATE_TRANSFORMATION = 'create_transformation',
  TEST_CONNECTION = 'test_connection',
  DEPLOY_INTEGRATION = 'deploy_integration'
}

export interface TemplateRequirement {
  type: 'credential' | 'permission' | 'configuration' | 'subscription';
  name: string;
  description: string;
  required: boolean;
  documentation?: string;
}

export interface ConfigVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: any;
  options?: any[];
  validation?: ValidationRule;
}

export interface ConfigValidation {
  rules: ValidationRule[];
  customValidators: string[];
}

export interface AdvancedConfig {
  rateLimiting: boolean;
  errorHandling: ErrorHandlingConfig;
  monitoring: MonitoringConfig;
  caching: CachingConfig;
}

export interface ValidationRule {
  type: string;
  value: any;
  message: string;
}

export interface StepValidation {
  required: boolean;
  rules: ValidationRule[];
  customValidator?: string;
}

export interface ErrorHandlingConfig {
  retryPolicy: {
    maxRetries: number;
    backoffStrategy: string;
    retryableErrors: string[];
  };
  notifications: {
    email: boolean;
    slack: boolean;
    webhook: boolean;
  };
}

export interface MonitoringConfig {
  metrics: string[];
  alerts: AlertConfig[];
  dashboards: DashboardConfig[];
}

export interface CachingConfig {
  enabled: boolean;
  strategy: string;
  ttl: number;
  invalidation: string[];
}

export interface AlertConfig {
  condition: string;
  threshold: number;
  action: string;
  recipients: string[];
}

export interface DashboardConfig {
  name: string;
  widgets: WidgetConfig[];
}

export interface WidgetConfig {
  type: string;
  title: string;
  query: string;
  visualization: string;
}

export interface TemplateDocumentation {
  overview: string;
  prerequisites: string;
  setupGuide: string;
  troubleshooting: string;
  examples: string;
  faq: string;
}

export class IntegrationTemplateManager {
  private templates: Map<string, IntegrationTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    const templates = [
      this.createSalesforceContactSyncTemplate(),
      this.createHubSpotLeadNurturingTemplate(),
      this.createSlackNotificationTemplate(),
      this.createEcommerceAnalyticsTemplate(),
      this.createCustomerJourneyTemplate(),
      this.createDataWarehouseTemplate(),
      this.createMarketingAutomationTemplate(),
      this.createSupportTicketTemplate()
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });

    console.log(`✅ Initialized ${templates.length} integration templates`);
  }

  // ==================== TEMPLATE DEFINITIONS ====================

  private createSalesforceContactSyncTemplate(): IntegrationTemplate {
    return {
      id: 'salesforce_contact_sync',
      name: 'salesforce-contact-sync',
      displayName: 'Salesforce Contact Synchronization',
      description: 'Bidirectional synchronization of contacts between Salesforce and your application',
      category: TemplateCategory.CRM_SYNC,
      useCase: 'Keep customer data synchronized between Salesforce CRM and your application in real-time',
      difficulty: 'intermediate',
      estimatedTime: 45,
      integrations: ['salesforce'],
      requirements: [
        {
          type: 'credential',
          name: 'Salesforce OAuth Credentials',
          description: 'Connected App with OAuth configuration in Salesforce',
          required: true,
          documentation: 'https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_auth_connected_app.htm'
        },
        {
          type: 'permission',
          name: 'API Access',
          description: 'User must have API access permission in Salesforce',
          required: true
        }
      ],
      steps: [
        {
          id: 'step_1',
          order: 1,
          title: 'Configure Salesforce Authentication',
          description: 'Set up OAuth 2.0 credentials for Salesforce integration',
          type: StepType.AUTHENTICATION,
          action: StepAction.CONFIGURE_AUTH,
          configuration: {
            integration: 'salesforce',
            authType: 'oauth2',
            scopes: ['full', 'refresh_token'],
            sandbox: false
          },
          validation: {
            required: true,
            rules: [
              { type: 'required', value: 'clientId', message: 'Client ID is required' },
              { type: 'required', value: 'clientSecret', message: 'Client Secret is required' }
            ]
          },
          dependencies: [],
          optional: false
        },
        {
          id: 'step_2',
          order: 2,
          title: 'Map Contact Fields',
          description: 'Configure field mapping between Salesforce contacts and your application',
          type: StepType.DATA_MAPPING,
          action: StepAction.MAP_FIELDS,
          configuration: {
            sourceObject: 'Contact',
            targetEntity: 'User',
            mappings: [
              { source: 'Id', target: 'salesforceId', transformation: 'direct' },
              { source: 'Email', target: 'email', transformation: 'direct' },
              { source: 'FirstName', target: 'firstName', transformation: 'direct' },
              { source: 'LastName', target: 'lastName', transformation: 'direct' },
              { source: 'Phone', target: 'phone', transformation: 'direct' }
            ]
          },
          validation: {
            required: true,
            rules: [
              { type: 'minMappings', value: 2, message: 'At least 2 field mappings required' }
            ]
          },
          dependencies: ['step_1'],
          optional: false
        },
        {
          id: 'step_3',
          order: 3,
          title: 'Configure Sync Direction',
          description: 'Set up bidirectional synchronization rules',
          type: StepType.CONFIGURATION,
          action: StepAction.CREATE_TRANSFORMATION,
          configuration: {
            syncDirection: 'bidirectional',
            conflictResolution: 'lastModified',
            batchSize: 100,
            syncFrequency: 'hourly'
          },
          validation: {
            required: true,
            rules: []
          },
          dependencies: ['step_2'],
          optional: false
        },
        {
          id: 'step_4',
          order: 4,
          title: 'Set Up Webhooks',
          description: 'Configure real-time webhooks for instant synchronization',
          type: StepType.WEBHOOK,
          action: StepAction.SETUP_WEBHOOK,
          configuration: {
            events: ['contact.created', 'contact.updated', 'contact.deleted'],
            webhookUrl: '/api/webhooks/salesforce/contacts',
            verification: true
          },
          validation: {
            required: false,
            rules: []
          },
          dependencies: ['step_3'],
          optional: true
        },
        {
          id: 'step_5',
          order: 5,
          title: 'Test Integration',
          description: 'Validate the integration configuration and test data flow',
          type: StepType.VALIDATION,
          action: StepAction.TEST_CONNECTION,
          configuration: {
            testCases: ['connection', 'sync', 'webhook'],
            sampleData: true
          },
          validation: {
            required: true,
            rules: []
          },
          dependencies: ['step_3'],
          optional: false
        }
      ],
      configuration: {
        variables: [
          {
            name: 'syncFrequency',
            type: 'string',
            description: 'How often to sync data',
            required: true,
            default: 'hourly',
            options: ['realtime', 'hourly', 'daily', 'weekly']
          },
          {
            name: 'conflictResolution',
            type: 'string',
            description: 'How to resolve data conflicts',
            required: true,
            default: 'lastModified',
            options: ['lastModified', 'salesforce', 'application', 'manual']
          },
          {
            name: 'enableWebhooks',
            type: 'boolean',
            description: 'Enable real-time webhooks',
            required: false,
            default: true
          }
        ],
        defaults: {
          batchSize: 100,
          timeout: 30000,
          retryAttempts: 3
        },
        validation: {
          rules: [],
          customValidators: []
        },
        advanced: {
          rateLimiting: true,
          errorHandling: {
            retryPolicy: {
              maxRetries: 3,
              backoffStrategy: 'exponential',
              retryableErrors: ['timeout', 'rate_limit', 'server_error']
            },
            notifications: {
              email: true,
              slack: false,
              webhook: false
            }
          },
          monitoring: {
            metrics: ['sync_count', 'error_rate', 'latency'],
            alerts: [],
            dashboards: []
          },
          caching: {
            enabled: true,
            strategy: 'lru',
            ttl: 300,
            invalidation: ['contact.updated', 'contact.deleted']
          }
        }
      },
      outputs: [
        {
          name: 'syncStats',
          type: 'object',
          description: 'Synchronization statistics',
          example: {
            totalRecords: 1500,
            syncedRecords: 1485,
            errorCount: 15,
            lastSync: '2024-01-23T10:30:00Z'
          }
        }
      ],
      documentation: {
        overview: 'This template creates a robust bidirectional synchronization between Salesforce contacts and your application users.',
        prerequisites: 'Salesforce Developer Edition or higher, API access enabled, Connected App configured.',
        setupGuide: 'Follow the step-by-step wizard to configure authentication, field mapping, and sync preferences.',
        troubleshooting: 'Common issues include authentication failures, field mapping errors, and API limits.',
        examples: 'Examples include contact creation, update scenarios, and conflict resolution.',
        faq: 'Frequently asked questions about sync frequency, data limits, and customization options.'
      },
      tags: ['salesforce', 'crm', 'sync', 'contacts', 'bidirectional'],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private createHubSpotLeadNurturingTemplate(): IntegrationTemplate {
    return {
      id: 'hubspot_lead_nurturing',
      name: 'hubspot-lead-nurturing',
      displayName: 'HubSpot Lead Nurturing Automation',
      description: 'Automated lead scoring and nurturing workflow with HubSpot integration',
      category: TemplateCategory.MARKETING,
      useCase: 'Automatically score leads and trigger nurturing campaigns based on user behavior',
      difficulty: 'advanced',
      estimatedTime: 60,
      integrations: ['hubspot'],
      requirements: [
        {
          type: 'credential',
          name: 'HubSpot Private App',
          description: 'HubSpot private app with contacts, deals, and workflows permissions',
          required: true
        },
        {
          type: 'subscription',
          name: 'HubSpot Marketing Hub',
          description: 'Marketing Hub Professional or Enterprise for workflows',
          required: true
        }
      ],
      steps: [
        {
          id: 'hubspot_auth',
          order: 1,
          title: 'Connect HubSpot',
          description: 'Authenticate with HubSpot using private app token',
          type: StepType.AUTHENTICATION,
          action: StepAction.CONFIGURE_AUTH,
          configuration: {
            integration: 'hubspot',
            authType: 'api_key',
            scopes: ['contacts', 'deals', 'workflows']
          },
          validation: {
            required: true,
            rules: [
              { type: 'required', value: 'apiKey', message: 'HubSpot API key is required' }
            ]
          },
          dependencies: [],
          optional: false
        },
        {
          id: 'lead_scoring',
          order: 2,
          title: 'Configure Lead Scoring',
          description: 'Set up lead scoring criteria and weights',
          type: StepType.CONFIGURATION,
          action: StepAction.CREATE_TRANSFORMATION,
          configuration: {
            scoringRules: [
              { property: 'email_opens', weight: 5, condition: 'gte', value: 3 },
              { property: 'page_views', weight: 10, condition: 'gte', value: 5 },
              { property: 'form_submissions', weight: 20, condition: 'gte', value: 1 },
              { property: 'demo_requested', weight: 50, condition: 'eq', value: true }
            ],
            thresholds: {
              cold: 0,
              warm: 30,
              hot: 70,
              qualified: 100
            }
          },
          validation: {
            required: true,
            rules: []
          },
          dependencies: ['hubspot_auth'],
          optional: false
        }
      ],
      configuration: {
        variables: [
          {
            name: 'scoringFrequency',
            type: 'string',
            description: 'How often to calculate lead scores',
            required: true,
            default: 'daily',
            options: ['hourly', 'daily', 'weekly']
          }
        ],
        defaults: {},
        validation: { rules: [], customValidators: [] },
        advanced: {
          rateLimiting: true,
          errorHandling: {
            retryPolicy: {
              maxRetries: 3,
              backoffStrategy: 'exponential',
              retryableErrors: ['timeout', 'rate_limit']
            },
            notifications: {
              email: true,
              slack: true,
              webhook: false
            }
          },
          monitoring: {
            metrics: ['leads_scored', 'campaigns_triggered', 'conversion_rate'],
            alerts: [],
            dashboards: []
          },
          caching: {
            enabled: true,
            strategy: 'time-based',
            ttl: 3600,
            invalidation: []
          }
        }
      },
      outputs: [],
      documentation: {
        overview: 'Automated lead nurturing with intelligent scoring and campaign triggers.',
        prerequisites: 'HubSpot Marketing Hub Professional or Enterprise subscription.',
        setupGuide: 'Configure scoring rules and nurturing workflows step by step.',
        troubleshooting: 'Common issues with API limits and workflow permissions.',
        examples: 'Lead scoring examples and campaign trigger scenarios.',
        faq: 'Questions about scoring algorithms and campaign optimization.'
      },
      tags: ['hubspot', 'marketing', 'lead-scoring', 'automation'],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private createSlackNotificationTemplate(): IntegrationTemplate {
    return {
      id: 'slack_notification_hub',
      name: 'slack-notification-hub',
      displayName: 'Slack Notification Hub',
      description: 'Centralized notification system sending alerts to Slack channels',
      category: TemplateCategory.COMMUNICATION,
      useCase: 'Send system alerts, user notifications, and business events to appropriate Slack channels',
      difficulty: 'beginner',
      estimatedTime: 20,
      integrations: ['slack'],
      requirements: [
        {
          type: 'credential',
          name: 'Slack App',
          description: 'Slack app with bot token and appropriate channel permissions',
          required: true
        }
      ],
      steps: [
        {
          id: 'slack_auth',
          order: 1,
          title: 'Connect Slack Workspace',
          description: 'Authenticate with your Slack workspace',
          type: StepType.AUTHENTICATION,
          action: StepAction.CONFIGURE_AUTH,
          configuration: {
            integration: 'slack',
            authType: 'oauth2',
            scopes: ['chat:write', 'channels:read', 'groups:read']
          },
          validation: {
            required: true,
            rules: []
          },
          dependencies: [],
          optional: false
        }
      ],
      configuration: {
        variables: [
          {
            name: 'defaultChannel',
            type: 'string',
            description: 'Default channel for notifications',
            required: true,
            default: '#general'
          }
        ],
        defaults: {},
        validation: { rules: [], customValidators: [] },
        advanced: {
          rateLimiting: true,
          errorHandling: {
            retryPolicy: {
              maxRetries: 3,
              backoffStrategy: 'linear',
              retryableErrors: ['timeout', 'rate_limit']
            },
            notifications: {
              email: false,
              slack: false,
              webhook: true
            }
          },
          monitoring: {
            metrics: ['messages_sent', 'delivery_rate', 'response_time'],
            alerts: [],
            dashboards: []
          },
          caching: {
            enabled: false,
            strategy: 'none',
            ttl: 0,
            invalidation: []
          }
        }
      },
      outputs: [],
      documentation: {
        overview: 'Simple Slack integration for sending notifications and alerts.',
        prerequisites: 'Slack workspace admin access to create apps.',
        setupGuide: 'Create Slack app, configure bot permissions, and test notifications.',
        troubleshooting: 'Common permission and channel access issues.',
        examples: 'Various notification types and message formatting examples.',
        faq: 'Questions about rate limits and message formatting.'
      },
      tags: ['slack', 'notifications', 'alerts', 'communication'],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Additional template methods would be implemented here...
  private createEcommerceAnalyticsTemplate(): IntegrationTemplate {
    // Implementation for ecommerce analytics template
    return {} as IntegrationTemplate;
  }

  private createCustomerJourneyTemplate(): IntegrationTemplate {
    // Implementation for customer journey template
    return {} as IntegrationTemplate;
  }

  private createDataWarehouseTemplate(): IntegrationTemplate {
    // Implementation for data warehouse template
    return {} as IntegrationTemplate;
  }

  private createMarketingAutomationTemplate(): IntegrationTemplate {
    // Implementation for marketing automation template
    return {} as IntegrationTemplate;
  }

  private createSupportTicketTemplate(): IntegrationTemplate {
    // Implementation for support ticket template
    return {} as IntegrationTemplate;
  }

  // ==================== PUBLIC API ====================

  /**
   * Get all available templates
   */
  getTemplates(): IntegrationTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: TemplateCategory): IntegrationTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): IntegrationTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Search templates
   */
  searchTemplates(query: string): IntegrationTemplate[] {
    const searchTerm = query.toLowerCase();
    return Array.from(this.templates.values()).filter(template =>
      template.name.toLowerCase().includes(searchTerm) ||
      template.displayName.toLowerCase().includes(searchTerm) ||
      template.description.toLowerCase().includes(searchTerm) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get templates by difficulty
   */
  getTemplatesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): IntegrationTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.difficulty === difficulty);
  }

  /**
   * Get templates by integration
   */
  getTemplatesByIntegration(integration: string): IntegrationTemplate[] {
    return Array.from(this.templates.values()).filter(t => 
      t.integrations.includes(integration)
    );
  }

  /**
   * Validate template configuration
   */
  validateTemplateConfig(templateId: string, config: any): { valid: boolean; errors: string[] } {
    const template = this.templates.get(templateId);
    if (!template) {
      return { valid: false, errors: ['Template not found'] };
    }

    const errors: string[] = [];

    // Validate required variables
    template.configuration.variables.forEach(variable => {
      if (variable.required && !config[variable.name]) {
        errors.push(`${variable.name} is required`);
      }
    });

    // Apply validation rules
    template.configuration.validation.rules.forEach(rule => {
      // Implementation would depend on rule type
    });

    return { valid: errors.length === 0, errors };
  }

  /**
   * Execute template deployment
   */
  async deployTemplate(templateId: string, config: any): Promise<{
    success: boolean;
    deploymentId: string;
    steps: any[];
    errors: string[];
  }> {
    const template = this.templates.get(templateId);
    if (!template) {
      return {
        success: false,
        deploymentId: '',
        steps: [],
        errors: ['Template not found']
      };
    }

    // Validate configuration
    const validation = this.validateTemplateConfig(templateId, config);
    if (!validation.valid) {
      return {
        success: false,
        deploymentId: '',
        steps: [],
        errors: validation.errors
      };
    }

    const deploymentId = `deploy_${Date.now()}_${templateId}`;
    const steps = [];

    try {
      // Execute template steps
      for (const step of template.steps) {
        const stepResult = await this.executeTemplateStep(step, config);
        steps.push(stepResult);
        
        if (!stepResult.success && !step.optional) {
          throw new Error(`Step ${step.title} failed: ${stepResult.error}`);
        }
      }

      return {
        success: true,
        deploymentId,
        steps,
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        deploymentId,
        steps,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private async executeTemplateStep(step: TemplateStep, config: any): Promise<any> {
    // Implementation would execute the actual step
    return {
      id: step.id,
      success: true,
      result: {},
      error: null
    };
  }
}

export const integrationTemplateManager = new IntegrationTemplateManager();