/**
 * CRMAgent - Complete Customer Relationship Automation
 * 
 * Master Plan Phase 2: Autonomous CRM Integration and Management
 * Handles lead management, customer journey automation, sales intelligence,
 * and seamless integration with HubSpot, Salesforce, and Pipedrive.
 */

import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';
import { analyticsEngine } from '@/lib/analytics/analytics-enhanced';
import { marketingAgent } from './marketing-agent';
import LeadScoringAgent from './lead-scoring-agent';
import HubSpotConnector from '@/lib/integration/connectors/hubspot-connector';
import SalesforceConnector from '@/lib/integration/connectors/salesforce-connector';

// ==================== INTERFACES ====================

interface CRMConfiguration {
  hubspot?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string[];
  };
  salesforce?: {
    instanceUrl: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    sandbox: boolean;
    apiVersion: string;
  };
  pipedrive?: {
    apiToken: string;
    companyDomain: string;
  };
  emailIntegration?: {
    provider: 'resend' | 'sendgrid' | 'mailgun';
    apiKey: string;
  };
}

interface Lead {
  id: string;
  firstName?: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  website?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'opportunity' | 'customer' | 'lost';
  score: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedTo?: string;
  tags: string[];
  customFields: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface Contact {
  id: string;
  firstName?: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  leadScore: number;
  lifecycleStage: 'subscriber' | 'lead' | 'marketing_qualified_lead' | 'sales_qualified_lead' | 'opportunity' | 'customer' | 'evangelist';
  lastActivity: Date;
  totalEngagementScore: number;
  crmSyncStatus: Record<string, 'synced' | 'pending' | 'error'>;
  touchpoints: TouchPoint[];
  customProperties: Record<string, any>;
}

interface TouchPoint {
  id: string;
  contactId: string;
  type: 'email_open' | 'email_click' | 'website_visit' | 'form_submission' | 'demo_request' | 'call' | 'meeting' | 'proposal_sent' | 'contract_signed';
  timestamp: Date;
  details: Record<string, any>;
  source: string;
  engagementScore: number;
}

interface Deal {
  id: string;
  name: string;
  contactId: string;
  companyId?: string;
  amount: number;
  stage: string;
  probability: number;
  expectedCloseDate: Date;
  ownerId: string;
  source: string;
  notes: string[];
  activities: DealActivity[];
  customFields: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface DealActivity {
  id: string;
  dealId: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task' | 'proposal';
  subject: string;
  description?: string;
  completedAt?: Date;
  dueDate?: Date;
  ownerId: string;
}

interface CustomerJourney {
  contactId: string;
  currentStage: string;
  stageHistory: Array<{
    stage: string;
    enteredAt: Date;
    duration?: number;
  }>;
  nextBestActions: string[];
  automationTriggers: string[];
  healthScore: number;
  churnRisk: number;
}

interface SalesIntelligence {
  dealAnalysis: {
    averageDealSize: number;
    averageSalesCycle: number;
    winRate: number;
    topPerformers: string[];
    dealsByStage: Record<string, number>;
  };
  leadAnalysis: {
    conversionRates: Record<string, number>;
    sourcePerformance: Record<string, { leads: number; conversions: number; rate: number }>;
    qualificationMetrics: Record<string, number>;
  };
  customerAnalysis: {
    lifetimeValue: number;
    churnRate: number;
    expansionRate: number;
    satisfactionScore: number;
  };
}

interface EmailCampaign {
  id: string;
  name: string;
  type: 'nurture' | 'promotional' | 'educational' | 'onboarding' | 'reactivation';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  segmentCriteria: Record<string, any>;
  emailSequence: Array<{
    subject: string;
    content: string;
    sendDelay: number; // hours
    conditions?: Record<string, any>;
  }>;
  metrics: {
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
    unsubscribed: number;
  };
  automationRules: Array<{
    trigger: string;
    action: string;
    conditions: Record<string, any>;
  }>;
}

// ==================== MAIN CRM AGENT CLASS ====================

class CRMAgent {
  private readonly SYNC_INTERVAL = 600000; // 10 minutes
  private readonly SCORING_INTERVAL = 1800000; // 30 minutes
  private readonly JOURNEY_UPDATE_INTERVAL = 3600000; // 1 hour
  
  private config: CRMConfiguration;
  private hubspotConnector?: HubSpotConnector;
  private salesforceConnector?: SalesforceConnector;
  private leadScoringAgent: LeadScoringAgent;
  
  private leads: Map<string, Lead> = new Map();
  private contacts: Map<string, Contact> = new Map();
  private deals: Map<string, Deal> = new Map();
  private emailCampaigns: Map<string, EmailCampaign> = new Map();

  constructor(config: CRMConfiguration) {
    this.config = config;
    this.leadScoringAgent = new LeadScoringAgent();
    
    this.initializeConnectors();
    this.initializeDefaultCampaigns();
    this.startAutomationProcesses();
    
    console.log('🤖 CRMAgent initialized - Complete customer relationship automation active');
  }

  // ==================== INITIALIZATION ====================

  private initializeConnectors(): void {
    if (this.config.hubspot) {
      this.hubspotConnector = new HubSpotConnector({
        clientId: this.config.hubspot.clientId,
        clientSecret: this.config.hubspot.clientSecret,
        redirectUri: this.config.hubspot.redirectUri,
        scopes: this.config.hubspot.scopes || ['crm.objects.contacts.read', 'crm.objects.contacts.write', 'crm.objects.deals.read', 'crm.objects.deals.write']
      });
    }

    if (this.config.salesforce) {
      this.salesforceConnector = new SalesforceConnector({
        instanceUrl: this.config.salesforce.instanceUrl,
        clientId: this.config.salesforce.clientId,
        clientSecret: this.config.salesforce.clientSecret,
        redirectUri: this.config.salesforce.redirectUri,
        sandbox: this.config.salesforce.sandbox,
        apiVersion: this.config.salesforce.apiVersion
      });
    }

    console.log('🔗 CRM connectors initialized');
  }

  private async initializeDefaultCampaigns(): Promise<void> {
    const defaultCampaigns: EmailCampaign[] = [
      {
        id: 'welcome_nurture',
        name: 'Welcome & Nurture Sequence',
        type: 'onboarding',
        status: 'active',
        segmentCriteria: { status: 'new', source: 'website' },
        emailSequence: [
          {
            subject: 'Welcome to Zenith - Your Website Health Journey Begins',
            content: 'Welcome email with onboarding checklist',
            sendDelay: 1
          },
          {
            subject: 'Your First Website Health Scan Results',
            content: 'Educational content about website health',
            sendDelay: 72
          },
          {
            subject: 'Unlock Premium Features - Limited Time Offer',
            content: 'Upgrade prompt with 20% discount',
            sendDelay: 168
          }
        ],
        metrics: { sent: 0, opened: 0, clicked: 0, converted: 0, unsubscribed: 0 },
        automationRules: [
          {
            trigger: 'email_clicked',
            action: 'add_to_hot_leads',
            conditions: { email_index: 2 }
          }
        ]
      },
      {
        id: 'lead_nurture_technical',
        name: 'Technical Decision Maker Nurture',
        type: 'nurture',
        status: 'active',
        segmentCriteria: { jobTitle: ['CTO', 'Technical Lead', 'Developer'], leadScore: { gte: 40 } },
        emailSequence: [
          {
            subject: 'Technical Deep Dive: How Zenith Analyzes Your Website',
            content: 'Technical content about algorithms and analysis',
            sendDelay: 24
          },
          {
            subject: 'Case Study: How TechCorp Improved Site Performance by 40%',
            content: 'Technical case study with metrics',
            sendDelay: 72
          },
          {
            subject: 'API Documentation & Enterprise Integration Options',
            content: 'Technical resources and integration guides',
            sendDelay: 120
          }
        ],
        metrics: { sent: 0, opened: 0, clicked: 0, converted: 0, unsubscribed: 0 },
        automationRules: [
          {
            trigger: 'case_study_downloaded',
            action: 'schedule_demo',
            conditions: { engagement_score: { gte: 60 } }
          }
        ]
      }
    ];

    for (const campaign of defaultCampaigns) {
      this.emailCampaigns.set(campaign.id, campaign);
      await this.storeCampaign(campaign);
    }

    console.log(`📧 Initialized ${defaultCampaigns.length} email campaigns`);
  }

  private startAutomationProcesses(): void {
    // CRM synchronization
    setInterval(async () => {
      try {
        await this.syncWithCRMPlatforms();
      } catch (error) {
        console.error('CRM sync failed:', error);
      }
    }, this.SYNC_INTERVAL);

    // Lead scoring updates
    setInterval(async () => {
      try {
        await this.updateLeadScores();
      } catch (error) {
        console.error('Lead scoring update failed:', error);
      }
    }, this.SCORING_INTERVAL);

    // Customer journey updates
    setInterval(async () => {
      try {
        await this.updateCustomerJourneys();
      } catch (error) {
        console.error('Customer journey update failed:', error);
      }
    }, this.JOURNEY_UPDATE_INTERVAL);

    // Email campaign processing
    setInterval(async () => {
      try {
        await this.processEmailCampaigns();
      } catch (error) {
        console.error('Email campaign processing failed:', error);
      }
    }, 300000); // 5 minutes

    console.log('⚙️ CRM automation processes started');
  }

  // ==================== LEAD MANAGEMENT ====================

  async captureLead(leadData: Partial<Lead>): Promise<{ success: boolean; leadId?: string; error?: string }> {
    try {
      const leadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Enrich lead data
      const enrichedLead = await this.enrichLeadData(leadData);
      
      // Calculate initial lead score
      const scoreResult = await this.leadScoringAgent.calculateLeadScore(leadId, []);
      
      const lead: Lead = {
        id: leadId,
        firstName: enrichedLead.firstName,
        lastName: enrichedLead.lastName || 'Unknown',
        email: enrichedLead.email || '',
        phone: enrichedLead.phone,
        company: enrichedLead.company,
        jobTitle: enrichedLead.jobTitle,
        website: enrichedLead.website,
        source: enrichedLead.source || 'website',
        status: 'new',
        score: scoreResult.score,
        priority: scoreResult.priority as any,
        tags: enrichedLead.tags || [],
        customFields: enrichedLead.customFields || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store lead
      this.leads.set(leadId, lead);
      await this.storeLead(lead);

      // Sync to CRM platforms
      await this.syncLeadToCRMs(lead);

      // Trigger automation workflows
      await this.triggerLeadAutomation(lead);

      // Track analytics
      await analyticsEngine.trackEvent({
        event: 'lead_captured',
        properties: {
          leadId,
          source: lead.source,
          score: lead.score,
          priority: lead.priority,
          company: lead.company
        }
      });

      console.log(`🎯 Lead captured: ${lead.firstName} ${lead.lastName} (${lead.email})`);

      return { success: true, leadId };
    } catch (error) {
      console.error('Failed to capture lead:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateLeadStatus(leadId: string, status: Lead['status'], notes?: string): Promise<boolean> {
    try {
      const lead = this.leads.get(leadId);
      if (!lead) {
        throw new Error('Lead not found');
      }

      const oldStatus = lead.status;
      lead.status = status;
      lead.updatedAt = new Date();

      // Update in storage
      this.leads.set(leadId, lead);
      await this.storeLead(lead);

      // Sync to CRM platforms
      await this.syncLeadToCRMs(lead);

      // Log activity
      await this.logLeadActivity(leadId, 'status_change', {
        oldStatus,
        newStatus: status,
        notes
      });

      // Track analytics
      await analyticsEngine.trackEvent({
        event: 'lead_status_updated',
        properties: {
          leadId,
          oldStatus,
          newStatus: status,
          notes
        }
      });

      console.log(`📊 Lead ${leadId} status updated: ${oldStatus} → ${status}`);

      return true;
    } catch (error) {
      console.error('Failed to update lead status:', error);
      return false;
    }
  }

  async getQualifiedLeads(limit: number = 50): Promise<Lead[]> {
    try {
      const allLeads = Array.from(this.leads.values());
      
      return allLeads
        .filter(lead => lead.score >= 60 || lead.priority === 'HIGH' || lead.priority === 'URGENT')
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get qualified leads:', error);
      return [];
    }
  }

  // ==================== CRM PLATFORM INTEGRATION ====================

  async syncWithCRMPlatforms(): Promise<void> {
    try {
      console.log('🔄 Starting CRM platform synchronization');

      // Sync leads and contacts to all configured platforms
      const leads = Array.from(this.leads.values());
      const contacts = Array.from(this.contacts.values());

      if (this.hubspotConnector) {
        await this.syncToHubSpot(leads, contacts);
      }

      if (this.salesforceConnector) {
        await this.syncToSalesforce(leads, contacts);
      }

      // Also sync deals
      const deals = Array.from(this.deals.values());
      await this.syncDeals(deals);

      console.log('✅ CRM synchronization completed');
    } catch (error) {
      console.error('CRM synchronization failed:', error);
    }
  }

  private async syncToHubSpot(leads: Lead[], contacts: Contact[]): Promise<void> {
    if (!this.hubspotConnector) return;

    try {
      // Sync leads as contacts in HubSpot
      for (const lead of leads) {
        await this.hubspotConnector.upsertContactByEmail(lead.email, {
          firstname: lead.firstName,
          lastname: lead.lastName,
          phone: lead.phone,
          company: lead.company,
          jobtitle: lead.jobTitle,
          website: lead.website,
          hs_lead_status: lead.status,
          zenith_lead_score: lead.score.toString(),
          zenith_priority: lead.priority,
          zenith_source: lead.source
        });
      }

      console.log(`📝 Synced ${leads.length} leads to HubSpot`);
    } catch (error) {
      console.error('HubSpot sync failed:', error);
    }
  }

  private async syncToSalesforce(leads: Lead[], contacts: Contact[]): Promise<void> {
    if (!this.salesforceConnector) return;

    try {
      // Sync leads to Salesforce
      for (const lead of leads) {
        const salesforceData = {
          FirstName: lead.firstName,
          LastName: lead.lastName,
          Email: lead.email,
          Phone: lead.phone,
          Company: lead.company || 'Unknown',
          Title: lead.jobTitle,
          Website: lead.website,
          Status: this.mapLeadStatusToSalesforce(lead.status),
          LeadSource: lead.source,
          Zenith_Lead_Score__c: lead.score,
          Zenith_Priority__c: lead.priority
        };

        await this.salesforceConnector.createLead(salesforceData);
      }

      console.log(`📝 Synced ${leads.length} leads to Salesforce`);
    } catch (error) {
      console.error('Salesforce sync failed:', error);
    }
  }

  private async syncDeals(deals: Deal[]): Promise<void> {
    // Sync deals to both platforms
    for (const deal of deals) {
      try {
        if (this.hubspotConnector) {
          await this.hubspotConnector.createDeal({
            properties: {
              dealname: deal.name,
              amount: deal.amount.toString(),
              dealstage: deal.stage,
              closedate: deal.expectedCloseDate.toISOString(),
              zenith_deal_source: deal.source
            }
          });
        }

        if (this.salesforceConnector) {
          await this.salesforceConnector.createOpportunity({
            Name: deal.name,
            Amount: deal.amount,
            StageName: deal.stage,
            CloseDate: deal.expectedCloseDate.toISOString().split('T')[0],
            AccountId: deal.companyId || '',
            Zenith_Source__c: deal.source
          });
        }
      } catch (error) {
        console.error(`Failed to sync deal ${deal.id}:`, error);
      }
    }
  }

  // ==================== CUSTOMER JOURNEY AUTOMATION ====================

  async trackCustomerTouchpoint(contactId: string, touchpoint: Omit<TouchPoint, 'id' | 'contactId'>): Promise<void> {
    try {
      const touchpointId = `tp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newTouchpoint: TouchPoint = {
        id: touchpointId,
        contactId,
        ...touchpoint
      };

      // Get or create contact
      let contact = this.contacts.get(contactId);
      if (!contact) {
        contact = await this.createContactFromTouchpoint(contactId, newTouchpoint);
      }

      // Add touchpoint
      contact.touchpoints.push(newTouchpoint);
      contact.lastActivity = touchpoint.timestamp;
      contact.totalEngagementScore += touchpoint.engagementScore;
      
      // Update lead score based on touchpoint
      const engagementEvents = contact.touchpoints.map(tp => ({
        type: tp.type,
        timestamp: tp.timestamp,
        metadata: tp.details
      }));

      const scoreResult = await this.leadScoringAgent.calculateLeadScore(contactId, engagementEvents);
      contact.leadScore = scoreResult.score;

      // Update contact
      this.contacts.set(contactId, contact);
      await this.storeContact(contact);

      // Update customer journey
      await this.updateCustomerJourney(contactId);

      // Track analytics
      await analyticsEngine.trackEvent({
        event: 'customer_touchpoint',
        properties: {
          contactId,
          touchpointType: touchpoint.type,
          engagementScore: touchpoint.engagementScore,
          source: touchpoint.source
        }
      });

      console.log(`📍 Touchpoint tracked: ${touchpoint.type} for contact ${contactId}`);
    } catch (error) {
      console.error('Failed to track customer touchpoint:', error);
    }
  }

  private async updateCustomerJourney(contactId: string): Promise<void> {
    try {
      const contact = this.contacts.get(contactId);
      if (!contact) return;

      const journey = await this.getCustomerJourney(contactId);
      
      // Determine current stage based on touchpoints and engagement
      const newStage = this.determineLifecycleStage(contact);
      
      if (newStage !== journey.currentStage) {
        // Stage progression
        journey.stageHistory.push({
          stage: newStage,
          enteredAt: new Date()
        });
        journey.currentStage = newStage;
        
        // Trigger stage-specific automation
        await this.triggerStageAutomation(contactId, newStage);
      }

      // Calculate health score and churn risk
      journey.healthScore = this.calculateCustomerHealthScore(contact);
      journey.churnRisk = this.calculateChurnRisk(contact);
      
      // Determine next best actions
      journey.nextBestActions = this.determineNextBestActions(contact, journey);
      
      // Store updated journey
      await this.storeCustomerJourney(journey);

      console.log(`🛤️ Customer journey updated for ${contactId}: ${journey.currentStage}`);
    } catch (error) {
      console.error('Failed to update customer journey:', error);
    }
  }

  private determineLifecycleStage(contact: Contact): Contact['lifecycleStage'] {
    if (contact.touchpoints.some(tp => tp.type === 'contract_signed')) {
      return 'customer';
    }
    if (contact.touchpoints.some(tp => tp.type === 'proposal_sent')) {
      return 'opportunity';
    }
    if (contact.leadScore >= 70 || contact.touchpoints.some(tp => tp.type === 'demo_request')) {
      return 'sales_qualified_lead';
    }
    if (contact.leadScore >= 40) {
      return 'marketing_qualified_lead';
    }
    if (contact.touchpoints.length > 0) {
      return 'lead';
    }
    return 'subscriber';
  }

  // ==================== SALES INTELLIGENCE ====================

  async generateSalesIntelligence(): Promise<SalesIntelligence> {
    try {
      const deals = Array.from(this.deals.values());
      const leads = Array.from(this.leads.values());
      const contacts = Array.from(this.contacts.values());

      // Deal analysis
      const wonDeals = deals.filter(d => d.stage === 'won');
      const totalDealValue = wonDeals.reduce((sum, d) => sum + d.amount, 0);
      const averageDealSize = wonDeals.length > 0 ? totalDealValue / wonDeals.length : 0;

      // Calculate average sales cycle
      const closedDeals = deals.filter(d => d.stage === 'won' || d.stage === 'lost');
      const averageSalesCycle = closedDeals.length > 0 
        ? closedDeals.reduce((sum, d) => {
            const daysDiff = Math.floor((d.updatedAt.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            return sum + daysDiff;
          }, 0) / closedDeals.length
        : 0;

      const winRate = closedDeals.length > 0 ? wonDeals.length / closedDeals.length : 0;

      // Lead analysis
      const convertedLeads = leads.filter(l => l.status === 'customer');
      const leadSources = leads.reduce((sources, lead) => {
        if (!sources[lead.source]) {
          sources[lead.source] = { leads: 0, conversions: 0, rate: 0 };
        }
        sources[lead.source].leads++;
        if (lead.status === 'customer') {
          sources[lead.source].conversions++;
        }
        sources[lead.source].rate = sources[lead.source].conversions / sources[lead.source].leads;
        return sources;
      }, {} as Record<string, { leads: number; conversions: number; rate: number }>);

      // Customer analysis
      const customers = contacts.filter(c => c.lifecycleStage === 'customer');
      const lifetimeValue = customers.length > 0 
        ? customers.reduce((sum, c) => sum + (c.customProperties.revenue || 0), 0) / customers.length 
        : 0;

      const intelligence: SalesIntelligence = {
        dealAnalysis: {
          averageDealSize,
          averageSalesCycle,
          winRate,
          topPerformers: this.getTopPerformers(deals),
          dealsByStage: this.groupDealsByStage(deals)
        },
        leadAnalysis: {
          conversionRates: {
            overall: leads.length > 0 ? convertedLeads.length / leads.length : 0,
            qualified: leads.filter(l => l.score >= 60).length / Math.max(leads.length, 1)
          },
          sourcePerformance: leadSources,
          qualificationMetrics: {
            averageScore: leads.reduce((sum, l) => sum + l.score, 0) / Math.max(leads.length, 1),
            highPriorityLeads: leads.filter(l => l.priority === 'HIGH' || l.priority === 'URGENT').length
          }
        },
        customerAnalysis: {
          lifetimeValue,
          churnRate: this.calculateChurnRate(customers),
          expansionRate: this.calculateExpansionRate(customers),
          satisfactionScore: this.calculateSatisfactionScore(customers)
        }
      };

      console.log('📊 Sales intelligence generated successfully');
      return intelligence;
    } catch (error) {
      console.error('Failed to generate sales intelligence:', error);
      return this.getEmptySalesIntelligence();
    }
  }

  async identifyUpsellOpportunities(): Promise<Array<{
    contactId: string;
    contactName: string;
    company: string;
    currentValue: number;
    opportunityType: string;
    potential: number;
    confidence: number;
    reasoning: string[];
  }>> {
    try {
      const customers = Array.from(this.contacts.values())
        .filter(c => c.lifecycleStage === 'customer');

      const opportunities: any[] = [];

      for (const customer of customers) {
        const upsellScore = this.calculateUpsellScore(customer);
        
        if (upsellScore.score > 60) {
          opportunities.push({
            contactId: customer.id,
            contactName: `${customer.firstName} ${customer.lastName}`,
            company: customer.company || 'Unknown',
            currentValue: customer.customProperties.currentPlan || 0,
            opportunityType: upsellScore.type,
            potential: upsellScore.potential,
            confidence: upsellScore.score,
            reasoning: upsellScore.reasoning
          });
        }
      }

      return opportunities.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Failed to identify upsell opportunities:', error);
      return [];
    }
  }

  // ==================== EMAIL MARKETING INTEGRATION ====================

  async processEmailCampaigns(): Promise<void> {
    try {
      for (const [campaignId, campaign] of this.emailCampaigns) {
        if (campaign.status !== 'active') continue;

        // Find eligible contacts for this campaign
        const eligibleContacts = await this.findEligibleContactsForCampaign(campaign);
        
        for (const contact of eligibleContacts) {
          await this.processContactInCampaign(contact, campaign);
        }
      }

      console.log('📧 Email campaigns processed');
    } catch (error) {
      console.error('Failed to process email campaigns:', error);
    }
  }

  private async findEligibleContactsForCampaign(campaign: EmailCampaign): Promise<Contact[]> {
    const allContacts = Array.from(this.contacts.values());
    
    return allContacts.filter(contact => {
      // Check segment criteria
      const criteria = campaign.segmentCriteria;
      
      if (criteria.status && !criteria.status.includes(contact.lifecycleStage)) {
        return false;
      }
      
      if (criteria.leadScore && contact.leadScore < criteria.leadScore.gte) {
        return false;
      }
      
      if (criteria.jobTitle && !criteria.jobTitle.some((title: string) => 
        contact.jobTitle?.toLowerCase().includes(title.toLowerCase())
      )) {
        return false;
      }
      
      return true;
    });
  }

  private async processContactInCampaign(contact: Contact, campaign: EmailCampaign): Promise<void> {
    try {
      // Check if contact is already in this campaign
      const campaignKey = `campaign:${campaign.id}:contact:${contact.id}`;
      const campaignStatus = await redis?.get(campaignKey);
      
      if (campaignStatus) {
        // Contact already in campaign, check for next email
        const status = JSON.parse(campaignStatus);
        await this.checkForNextEmail(contact, campaign, status);
      } else {
        // New contact, start campaign
        await this.startCampaignForContact(contact, campaign);
      }
    } catch (error) {
      console.error('Failed to process contact in campaign:', error);
    }
  }

  private async startCampaignForContact(contact: Contact, campaign: EmailCampaign): Promise<void> {
    const campaignKey = `campaign:${campaign.id}:contact:${contact.id}`;
    
    const status = {
      startedAt: new Date(),
      currentEmailIndex: 0,
      nextEmailDue: new Date(Date.now() + campaign.emailSequence[0].sendDelay * 60 * 60 * 1000),
      emails: []
    };
    
    await redis?.setex(campaignKey, 86400 * 30, JSON.stringify(status)); // 30 days
    
    // Send first email immediately if delay is 0
    if (campaign.emailSequence[0].sendDelay === 0) {
      await this.sendCampaignEmail(contact, campaign, 0);
    }
  }

  private async sendCampaignEmail(contact: Contact, campaign: EmailCampaign, emailIndex: number): Promise<void> {
    try {
      const email = campaign.emailSequence[emailIndex];
      
      // Personalize email content
      const personalizedSubject = this.personalizeEmailContent(email.subject, contact);
      const personalizedContent = this.personalizeEmailContent(email.content, contact);
      
      // Send email (mock implementation)
      console.log(`📧 Sending campaign email to ${contact.email}: ${personalizedSubject}`);
      
      // Update campaign metrics
      campaign.metrics.sent++;
      await this.storeCampaign(campaign);
      
      // Track touchpoint
      await this.trackCustomerTouchpoint(contact.id, {
        type: 'email_open', // Will be updated when actually opened
        timestamp: new Date(),
        details: {
          campaignId: campaign.id,
          emailIndex,
          subject: personalizedSubject
        },
        source: 'email_campaign',
        engagementScore: 5
      });
      
    } catch (error) {
      console.error('Failed to send campaign email:', error);
    }
  }

  // ==================== UTILITY METHODS ====================

  private async enrichLeadData(leadData: Partial<Lead>): Promise<Partial<Lead>> {
    // In production, this would call data enrichment APIs
    const enriched = { ...leadData };
    
    // Mock enrichment
    if (leadData.email && !leadData.company) {
      const domain = leadData.email.split('@')[1];
      enriched.company = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    }
    
    return enriched;
  }

  private async triggerLeadAutomation(lead: Lead): Promise<void> {
    // Trigger appropriate automation based on lead characteristics
    if (lead.score >= 70) {
      // High-score lead - immediate notification
      console.log(`🚨 High-score lead detected: ${lead.firstName} ${lead.lastName} (Score: ${lead.score})`);
    }
    
    if (lead.source === 'demo_request') {
      // Demo request - schedule follow-up
      console.log(`📞 Demo requested by: ${lead.firstName} ${lead.lastName}`);
    }
  }

  private mapLeadStatusToSalesforce(status: Lead['status']): string {
    const statusMap: Record<string, string> = {
      'new': 'Open - Not Contacted',
      'contacted': 'Working - Contacted',
      'qualified': 'Qualified',
      'opportunity': 'Qualified',
      'customer': 'Closed - Converted',
      'lost': 'Closed - Not Converted'
    };
    return statusMap[status] || 'Open - Not Contacted';
  }

  private calculateCustomerHealthScore(contact: Contact): number {
    let score = 50; // Base score
    
    // Recent activity boost
    const daysSinceLastActivity = (Date.now() - contact.lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastActivity < 7) score += 20;
    else if (daysSinceLastActivity < 30) score += 10;
    else if (daysSinceLastActivity > 90) score -= 30;
    
    // Engagement level
    score += Math.min(contact.totalEngagementScore / 10, 30);
    
    return Math.max(0, Math.min(100, score));
  }

  private calculateChurnRisk(contact: Contact): number {
    const healthScore = this.calculateCustomerHealthScore(contact);
    return Math.max(0, 100 - healthScore);
  }

  private determineNextBestActions(contact: Contact, journey: CustomerJourney): string[] {
    const actions: string[] = [];
    
    if (journey.churnRisk > 70) {
      actions.push('immediate_customer_success_outreach');
    }
    
    if (contact.leadScore > 80 && contact.lifecycleStage === 'sales_qualified_lead') {
      actions.push('schedule_demo');
    }
    
    if (contact.lifecycleStage === 'customer' && journey.healthScore > 80) {
      actions.push('upsell_opportunity');
    }
    
    return actions;
  }

  private calculateUpsellScore(customer: Contact): { score: number; type: string; potential: number; reasoning: string[] } {
    let score = 0;
    const reasoning: string[] = [];
    
    // High engagement indicates readiness for upsell
    if (customer.totalEngagementScore > 100) {
      score += 30;
      reasoning.push('High engagement with platform');
    }
    
    // Recent activity
    const daysSinceLastActivity = (Date.now() - customer.lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastActivity < 14) {
      score += 20;
      reasoning.push('Recently active');
    }
    
    // Feature usage patterns (mock)
    const usageLevel = customer.customProperties.usageLevel || 'medium';
    if (usageLevel === 'high') {
      score += 25;
      reasoning.push('Heavy platform usage');
    }
    
    return {
      score,
      type: 'plan_upgrade',
      potential: score * 10, // Mock potential value
      reasoning
    };
  }

  private personalizeEmailContent(content: string, contact: Contact): string {
    return content
      .replace('{{firstName}}', contact.firstName || 'there')
      .replace('{{lastName}}', contact.lastName)
      .replace('{{company}}', contact.company || 'your company');
  }

  // ==================== STORAGE METHODS ====================

  private async storeLead(lead: Lead): Promise<void> {
    await redis?.setex(`lead:${lead.id}`, 86400 * 30, JSON.stringify(lead));
  }

  private async storeContact(contact: Contact): Promise<void> {
    await redis?.setex(`contact:${contact.id}`, 86400 * 30, JSON.stringify(contact));
  }

  private async storeCampaign(campaign: EmailCampaign): Promise<void> {
    await redis?.setex(`campaign:${campaign.id}`, 86400 * 30, JSON.stringify(campaign));
  }

  private async storeCustomerJourney(journey: CustomerJourney): Promise<void> {
    await redis?.setex(`journey:${journey.contactId}`, 86400 * 30, JSON.stringify(journey));
  }

  private async logLeadActivity(leadId: string, activity: string, details: any): Promise<void> {
    const activityLog = {
      leadId,
      activity,
      details,
      timestamp: new Date()
    };
    
    await redis?.lpush(`lead_activity:${leadId}`, JSON.stringify(activityLog));
  }

  // ==================== HELPER METHODS ====================

  private async createContactFromTouchpoint(contactId: string, touchpoint: TouchPoint): Promise<Contact> {
    const contact: Contact = {
      id: contactId,
      lastName: 'Unknown',
      email: touchpoint.details.email || `${contactId}@unknown.com`,
      leadScore: 0,
      lifecycleStage: 'subscriber',
      lastActivity: touchpoint.timestamp,
      totalEngagementScore: 0,
      crmSyncStatus: {},
      touchpoints: [],
      customProperties: {}
    };
    
    return contact;
  }

  private async getCustomerJourney(contactId: string): Promise<CustomerJourney> {
    const stored = await redis?.get(`journey:${contactId}`);
    
    if (stored) {
      return JSON.parse(stored);
    }
    
    return {
      contactId,
      currentStage: 'subscriber',
      stageHistory: [{
        stage: 'subscriber',
        enteredAt: new Date()
      }],
      nextBestActions: [],
      automationTriggers: [],
      healthScore: 50,
      churnRisk: 50
    };
  }

  private async triggerStageAutomation(contactId: string, stage: string): Promise<void> {
    console.log(`🎯 Triggering automation for contact ${contactId} entering stage: ${stage}`);
    
    // Different automation based on stage
    switch (stage) {
      case 'marketing_qualified_lead':
        // Notify sales team
        break;
      case 'sales_qualified_lead':
        // Schedule demo
        break;
      case 'customer':
        // Start onboarding sequence
        break;
    }
  }

  private getTopPerformers(deals: Deal[]): string[] {
    const performerStats: Record<string, { deals: number; value: number }> = {};
    
    deals.filter(d => d.stage === 'won').forEach(deal => {
      if (!performerStats[deal.ownerId]) {
        performerStats[deal.ownerId] = { deals: 0, value: 0 };
      }
      performerStats[deal.ownerId].deals++;
      performerStats[deal.ownerId].value += deal.amount;
    });
    
    return Object.entries(performerStats)
      .sort(([,a], [,b]) => b.value - a.value)
      .slice(0, 5)
      .map(([ownerId]) => ownerId);
  }

  private groupDealsByStage(deals: Deal[]): Record<string, number> {
    return deals.reduce((stages, deal) => {
      stages[deal.stage] = (stages[deal.stage] || 0) + 1;
      return stages;
    }, {} as Record<string, number>);
  }

  private calculateChurnRate(customers: Contact[]): number {
    // Mock implementation
    return 0.05; // 5% churn rate
  }

  private calculateExpansionRate(customers: Contact[]): number {
    // Mock implementation
    return 0.15; // 15% expansion rate
  }

  private calculateSatisfactionScore(customers: Contact[]): number {
    // Mock implementation
    return 8.5; // 8.5/10 satisfaction score
  }

  private getEmptySalesIntelligence(): SalesIntelligence {
    return {
      dealAnalysis: {
        averageDealSize: 0,
        averageSalesCycle: 0,
        winRate: 0,
        topPerformers: [],
        dealsByStage: {}
      },
      leadAnalysis: {
        conversionRates: {},
        sourcePerformance: {},
        qualificationMetrics: {}
      },
      customerAnalysis: {
        lifetimeValue: 0,
        churnRate: 0,
        expansionRate: 0,
        satisfactionScore: 0
      }
    };
  }

  private async checkForNextEmail(contact: Contact, campaign: EmailCampaign, status: any): Promise<void> {
    const now = new Date();
    const nextEmailDue = new Date(status.nextEmailDue);
    
    if (now >= nextEmailDue && status.currentEmailIndex < campaign.emailSequence.length - 1) {
      const nextIndex = status.currentEmailIndex + 1;
      await this.sendCampaignEmail(contact, campaign, nextIndex);
      
      // Update status
      status.currentEmailIndex = nextIndex;
      if (nextIndex < campaign.emailSequence.length - 1) {
        status.nextEmailDue = new Date(Date.now() + campaign.emailSequence[nextIndex + 1].sendDelay * 60 * 60 * 1000);
      }
      
      const campaignKey = `campaign:${campaign.id}:contact:${contact.id}`;
      await redis?.setex(campaignKey, 86400 * 30, JSON.stringify(status));
    }
  }

  private async updateLeadScores(): Promise<void> {
    try {
      console.log('📊 Updating lead scores');
      
      for (const [leadId, lead] of this.leads) {
        // Get engagement events for this lead
        const contact = this.contacts.get(leadId);
        if (contact) {
          const engagementEvents = contact.touchpoints.map(tp => ({
            type: tp.type,
            timestamp: tp.timestamp,
            metadata: tp.details
          }));
          
          const scoreResult = await this.leadScoringAgent.calculateLeadScore(leadId, engagementEvents);
          
          // Update lead score
          lead.score = scoreResult.score;
          lead.priority = scoreResult.priority as any;
          lead.updatedAt = new Date();
          
          await this.storeLead(lead);
        }
      }
      
      console.log('✅ Lead scores updated');
    } catch (error) {
      console.error('Failed to update lead scores:', error);
    }
  }

  private async updateCustomerJourneys(): Promise<void> {
    try {
      console.log('🛤️ Updating customer journeys');
      
      for (const [contactId] of this.contacts) {
        await this.updateCustomerJourney(contactId);
      }
      
      console.log('✅ Customer journeys updated');
    } catch (error) {
      console.error('Failed to update customer journeys:', error);
    }
  }

  // ==================== PUBLIC API METHODS ====================

  async getCRMOverview(): Promise<{
    leads: { total: number; byStatus: Record<string, number>; byPriority: Record<string, number> };
    contacts: { total: number; byStage: Record<string, number> };
    deals: { total: number; value: number; byStage: Record<string, number> };
    campaigns: { active: number; totalSent: number; totalOpened: number };
  }> {
    const leads = Array.from(this.leads.values());
    const contacts = Array.from(this.contacts.values());
    const deals = Array.from(this.deals.values());
    const campaigns = Array.from(this.emailCampaigns.values());

    return {
      leads: {
        total: leads.length,
        byStatus: leads.reduce((acc, lead) => {
          acc[lead.status] = (acc[lead.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byPriority: leads.reduce((acc, lead) => {
          acc[lead.priority] = (acc[lead.priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      contacts: {
        total: contacts.length,
        byStage: contacts.reduce((acc, contact) => {
          acc[contact.lifecycleStage] = (acc[contact.lifecycleStage] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      deals: {
        total: deals.length,
        value: deals.reduce((sum, deal) => sum + deal.amount, 0),
        byStage: this.groupDealsByStage(deals)
      },
      campaigns: {
        active: campaigns.filter(c => c.status === 'active').length,
        totalSent: campaigns.reduce((sum, c) => sum + c.metrics.sent, 0),
        totalOpened: campaigns.reduce((sum, c) => sum + c.metrics.opened, 0)
      }
    };
  }

  async getLeadById(leadId: string): Promise<Lead | null> {
    return this.leads.get(leadId) || null;
  }

  async getContactById(contactId: string): Promise<Contact | null> {
    return this.contacts.get(contactId) || null;
  }

  async createDeal(dealData: Partial<Deal>): Promise<{ success: boolean; dealId?: string; error?: string }> {
    try {
      const dealId = `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const deal: Deal = {
        id: dealId,
        name: dealData.name || 'Untitled Deal',
        contactId: dealData.contactId || '',
        companyId: dealData.companyId,
        amount: dealData.amount || 0,
        stage: dealData.stage || 'prospecting',
        probability: dealData.probability || 0,
        expectedCloseDate: dealData.expectedCloseDate || new Date(),
        ownerId: dealData.ownerId || '',
        source: dealData.source || 'manual',
        notes: dealData.notes || [],
        activities: [],
        customFields: dealData.customFields || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.deals.set(dealId, deal);
      await redis?.setex(`deal:${dealId}`, 86400 * 30, JSON.stringify(deal));

      console.log(`💼 Deal created: ${deal.name} (${dealId})`);

      return { success: true, dealId };
    } catch (error) {
      console.error('Failed to create deal:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const crmAgent = new CRMAgent({
  // Configuration would be loaded from environment variables
  hubspot: process.env.HUBSPOT_CLIENT_ID ? {
    clientId: process.env.HUBSPOT_CLIENT_ID,
    clientSecret: process.env.HUBSPOT_CLIENT_SECRET || '',
    redirectUri: process.env.HUBSPOT_REDIRECT_URI || '',
    scopes: ['crm.objects.contacts.read', 'crm.objects.contacts.write', 'crm.objects.deals.read', 'crm.objects.deals.write']
  } : undefined,
  salesforce: process.env.SALESFORCE_CLIENT_ID ? {
    instanceUrl: process.env.SALESFORCE_INSTANCE_URL || '',
    clientId: process.env.SALESFORCE_CLIENT_ID,
    clientSecret: process.env.SALESFORCE_CLIENT_SECRET || '',
    redirectUri: process.env.SALESFORCE_REDIRECT_URI || '',
    sandbox: process.env.SALESFORCE_SANDBOX === 'true',
    apiVersion: '58.0'
  } : undefined,
  emailIntegration: {
    provider: 'resend',
    apiKey: process.env.RESEND_API_KEY || ''
  }
});

// Export types and classes
export type {
  Lead,
  Contact,
  TouchPoint,
  Deal,
  CustomerJourney,
  SalesIntelligence,
  EmailCampaign,
  CRMConfiguration
};

export { CRMAgent };