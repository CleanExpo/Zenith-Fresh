/**
 * SupportAgent - 24/7 Autonomous Customer Service
 * 
 * Master Plan Phase 2: Autonomous Operations Extension
 * Provides intelligent customer support with escalation capabilities
 */

import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';
import { enhancedSentryMonitoring } from '@/lib/monitoring/enhanced-sentry';
import { analyticsEngine } from '@/lib/analytics/analytics-enhanced';

interface SupportTicket {
  id: string;
  userId?: string;
  email: string;
  subject: string;
  message: string;
  category: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'in_progress' | 'awaiting_response' | 'resolved' | 'escalated';
  channel: 'email' | 'chat' | 'api' | 'dashboard';
  assignedAgent: 'autonomous' | 'human';
  resolutionConfidence: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  escalatedAt?: Date;
  resolutionTime?: number; // minutes
  customerSatisfaction?: number; // 1-5 rating
}

interface SupportResponse {
  id: string;
  ticketId: string;
  message: string;
  sender: 'agent' | 'customer' | 'system';
  agentType: 'autonomous' | 'human';
  timestamp: Date;
  attachments?: string[];
  actions?: SupportAction[];
}

interface SupportAction {
  type: 'account_adjustment' | 'feature_toggle' | 'billing_credit' | 'escalation' | 'knowledge_base';
  description: string;
  parameters: Record<string, any>;
  executed: boolean;
  executedAt?: Date;
  result?: string;
}

interface KnowledgeBaseEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  confidence: number;
  usage_count: number;
  last_updated: Date;
  effectiveness_rating: number; // 0-100
}

interface CustomerProfile {
  userId?: string;
  email: string;
  subscription_tier: 'freemium' | 'premium' | 'enterprise';
  account_created: Date;
  last_login: Date;
  support_history_count: number;
  satisfaction_rating: number;
  preferred_contact_method: string;
  timezone: string;
}

class SupportAgent {
  private readonly RESPONSE_TIME_TARGET = 300; // 5 minutes for autonomous responses
  private readonly ESCALATION_THRESHOLD = 24; // hours before escalation
  private readonly SATISFACTION_THRESHOLD = 3.5; // minimum rating before review
  
  private knowledgeBase: Map<string, KnowledgeBaseEntry> = new Map();
  private activeTickets: Map<string, SupportTicket> = new Map();

  constructor() {
    this.initializeKnowledgeBase();
    this.startTicketMonitoring();
    console.log('🎧 SupportAgent initialized - 24/7 customer service active');
  }

  /**
   * Initialize knowledge base with common solutions
   */
  private async initializeKnowledgeBase(): Promise<void> {
    const knowledgeEntries: KnowledgeBaseEntry[] = [
      {
        id: 'kb_001',
        title: 'How to upgrade subscription plan',
        content: 'To upgrade your subscription: 1) Go to Team Settings > Billing, 2) Click "Upgrade Plan", 3) Select your desired plan, 4) Complete payment. Your new features will be available immediately.',
        category: 'billing',
        tags: ['upgrade', 'subscription', 'payment', 'billing'],
        confidence: 95,
        usage_count: 0,
        last_updated: new Date(),
        effectiveness_rating: 90
      },
      {
        id: 'kb_002',
        title: 'Website scan returning 500 error',
        content: 'If website scans are failing: 1) Ensure the URL includes https://, 2) Check if the website is accessible, 3) Try again in a few minutes, 4) Contact support if the issue persists. Our system automatically retries failed scans.',
        category: 'technical',
        tags: ['website', 'scan', '500 error', 'troubleshooting'],
        confidence: 90,
        usage_count: 0,
        last_updated: new Date(),
        effectiveness_rating: 85
      },
      {
        id: 'kb_003',
        title: 'Understanding health scores',
        content: 'Your website health score is calculated from 5 pillars: Performance (40%), Technical SEO (20%), On-Page SEO (15%), Security (15%), and Accessibility (10%). Each pillar is scored 0-100 based on industry best practices.',
        category: 'feature_explanation',
        tags: ['health score', 'performance', 'seo', 'security', 'accessibility'],
        confidence: 98,
        usage_count: 0,
        last_updated: new Date(),
        effectiveness_rating: 95
      },
      {
        id: 'kb_004',
        title: 'Adding team members',
        content: 'To add team members: 1) Go to Team Settings > Members, 2) Click "Invite Member", 3) Enter their email address, 4) Select their role, 5) Send invitation. They will receive an email to join your team.',
        category: 'account_management',
        tags: ['team', 'members', 'invite', 'collaboration'],
        confidence: 95,
        usage_count: 0,
        last_updated: new Date(),
        effectiveness_rating: 92
      },
      {
        id: 'kb_005',
        title: 'Billing and payment issues',
        content: 'For billing issues: 1) Check your payment method in Team Settings > Billing, 2) Verify your card details are current, 3) Contact your bank if payments are declined, 4) Use our billing portal to manage subscriptions and download invoices.',
        category: 'billing',
        tags: ['billing', 'payment', 'card', 'invoice', 'subscription'],
        confidence: 92,
        usage_count: 0,
        last_updated: new Date(),
        effectiveness_rating: 88
      }
    ];

    for (const entry of knowledgeEntries) {
      this.knowledgeBase.set(entry.id, entry);
      
      // Store in Redis for persistence
      await redis?.setex(
        `kb:${entry.id}`,
        86400 * 30, // 30 days
        JSON.stringify(entry)
      );
    }

    console.log(`📚 Knowledge base initialized with ${knowledgeEntries.length} entries`);
  }

  /**
   * Start continuous ticket monitoring
   */
  private startTicketMonitoring(): void {
    // Check for new tickets every 30 seconds
    setInterval(async () => {
      try {
        await this.processNewTickets();
        await this.checkEscalationNeeded();
        await this.updateTicketStatuses();
      } catch (error) {
        console.error('Ticket monitoring failed:', error);
      }
    }, 30000);
  }

  /**
   * Create a new support ticket
   */
  async createTicket(ticketData: {
    userId?: string;
    email: string;
    subject: string;
    message: string;
    channel?: 'email' | 'chat' | 'api' | 'dashboard';
  }): Promise<SupportTicket> {
    const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get customer profile for context
    const customerProfile = await this.getCustomerProfile(ticketData.email, ticketData.userId);
    
    // Classify ticket automatically
    const classification = await this.classifyTicket(ticketData.subject, ticketData.message);
    
    const ticket: SupportTicket = {
      id: ticketId,
      userId: ticketData.userId,
      email: ticketData.email,
      subject: ticketData.subject,
      message: ticketData.message,
      category: classification.category,
      priority: classification.priority,
      status: 'new',
      channel: ticketData.channel || 'dashboard',
      assignedAgent: 'autonomous',
      resolutionConfidence: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store ticket
    this.activeTickets.set(ticketId, ticket);
    await this.storeTicket(ticket);

    // Immediate autonomous response
    await this.generateAutonomousResponse(ticket, customerProfile);

    // Track ticket creation
    await analyticsEngine.trackEvent({
      event: 'support_ticket_created',
      properties: {
        ticketId,
        category: ticket.category,
        priority: ticket.priority,
        channel: ticket.channel,
        userId: ticket.userId,
        customerTier: customerProfile.subscription_tier
      }
    });

    console.log(`🎫 New support ticket created: ${ticketId} (${ticket.category}/${ticket.priority})`);
    return ticket;
  }

  /**
   * Generate autonomous response to ticket
   */
  private async generateAutonomousResponse(
    ticket: SupportTicket, 
    customerProfile: CustomerProfile
  ): Promise<void> {
    // Search knowledge base for relevant solutions
    const relevantEntries = await this.searchKnowledgeBase(
      `${ticket.subject} ${ticket.message}`,
      ticket.category
    );

    let response: SupportResponse;
    let actions: SupportAction[] = [];

    if (relevantEntries.length > 0 && relevantEntries[0].confidence > 80) {
      // High confidence autonomous resolution
      const bestMatch = relevantEntries[0];
      
      response = {
        id: `response_${Date.now()}`,
        ticketId: ticket.id,
        message: this.generatePersonalizedResponse(bestMatch, customerProfile, ticket),
        sender: 'agent',
        agentType: 'autonomous',
        timestamp: new Date(),
        actions: this.generateAutomaticActions(ticket, bestMatch)
      };

      ticket.resolutionConfidence = bestMatch.confidence;
      ticket.status = 'awaiting_response';
      
      // Update KB usage
      bestMatch.usage_count++;
      this.knowledgeBase.set(bestMatch.id, bestMatch);

    } else {
      // Lower confidence - acknowledge and escalate if needed
      response = {
        id: `response_${Date.now()}`,
        ticketId: ticket.id,
        message: this.generateAcknowledgmentResponse(customerProfile, ticket),
        sender: 'agent',
        agentType: 'autonomous',
        timestamp: new Date()
      };

      ticket.resolutionConfidence = 40;
      
      // Escalate high priority or complex issues
      if (ticket.priority === 'urgent' || ticket.priority === 'high') {
        actions.push({
          type: 'escalation',
          description: 'Escalating to human agent due to priority level',
          parameters: { reason: 'high_priority', confidence_threshold: 80 },
          executed: false
        });
      }
    }

    // Store response
    await this.storeResponse(response);

    // Execute actions
    for (const action of actions) {
      await this.executeAction(action, ticket);
    }

    // Update ticket
    ticket.updatedAt = new Date();
    await this.storeTicket(ticket);

    console.log(`🤖 Autonomous response generated for ticket ${ticket.id} (confidence: ${ticket.resolutionConfidence}%)`);
  }

  /**
   * Classify ticket by category and priority
   */
  private async classifyTicket(subject: string, message: string): Promise<{
    category: SupportTicket['category'];
    priority: SupportTicket['priority'];
  }> {
    const text = `${subject} ${message}`.toLowerCase();
    
    // Category classification
    let category: SupportTicket['category'] = 'general';
    
    if (text.includes('billing') || text.includes('payment') || text.includes('invoice') || text.includes('subscription')) {
      category = 'billing';
    } else if (text.includes('bug') || text.includes('error') || text.includes('broken') || text.includes('not working')) {
      category = 'bug_report';
    } else if (text.includes('feature') || text.includes('enhancement') || text.includes('suggestion')) {
      category = 'feature_request';
    } else if (text.includes('scan') || text.includes('api') || text.includes('integration') || text.includes('technical')) {
      category = 'technical';
    }

    // Priority classification
    let priority: SupportTicket['priority'] = 'medium';
    
    if (text.includes('urgent') || text.includes('critical') || text.includes('down') || text.includes('broken')) {
      priority = 'urgent';
    } else if (text.includes('important') || text.includes('asap') || text.includes('high priority')) {
      priority = 'high';
    } else if (text.includes('minor') || text.includes('low priority') || text.includes('when possible')) {
      priority = 'low';
    }

    return { category, priority };
  }

  /**
   * Search knowledge base for relevant entries
   */
  private async searchKnowledgeBase(
    query: string, 
    category?: string
  ): Promise<KnowledgeBaseEntry[]> {
    const queryLower = query.toLowerCase();
    const entries = Array.from(this.knowledgeBase.values());
    
    // Score entries based on relevance
    const scoredEntries = entries.map(entry => {
      let score = 0;
      
      // Category match bonus
      if (category && entry.category === category) {
        score += 30;
      }
      
      // Title keyword matches
      const titleWords = entry.title.toLowerCase().split(' ');
      for (const word of titleWords) {
        if (queryLower.includes(word) && word.length > 3) {
          score += 10;
        }
      }
      
      // Tag matches
      for (const tag of entry.tags) {
        if (queryLower.includes(tag.toLowerCase())) {
          score += 15;
        }
      }
      
      // Content keyword matches
      const contentWords = entry.content.toLowerCase().split(' ');
      for (const word of contentWords) {
        if (queryLower.includes(word) && word.length > 4) {
          score += 5;
        }
      }
      
      // Apply confidence weighting
      score = score * (entry.confidence / 100);
      
      return { entry, score };
    });

    // Return top matches
    return scoredEntries
      .filter(item => item.score > 10)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.entry);
  }

  /**
   * Generate personalized response based on knowledge base
   */
  private generatePersonalizedResponse(
    kbEntry: KnowledgeBaseEntry,
    customer: CustomerProfile,
    ticket: SupportTicket
  ): string {
    const greeting = this.getPersonalizedGreeting(customer);
    const solution = kbEntry.content;
    const closing = this.getPersonalizedClosing(customer, ticket);

    return `${greeting}

Thank you for contacting Zenith support regarding "${ticket.subject}".

${solution}

${closing}

Best regards,
Zenith Support Team (Autonomous Agent)

Reference: ${ticket.id}`;
  }

  /**
   * Generate acknowledgment response for complex issues
   */
  private generateAcknowledgmentResponse(
    customer: CustomerProfile,
    ticket: SupportTicket
  ): string {
    const greeting = this.getPersonalizedGreeting(customer);
    
    return `${greeting}

Thank you for contacting Zenith support regarding "${ticket.subject}".

I've received your message and am reviewing the details of your inquiry. ${ticket.priority === 'urgent' || ticket.priority === 'high' ? 'Given the priority of this issue, I\'ve escalated it to our specialist team for immediate attention.' : 'I\'ll provide you with a detailed response within 24 hours.'}

In the meantime, you can:
• Check our Knowledge Base at https://zenith.engineer/help
• Review your account status in the dashboard
• Contact us directly if this is urgent

Best regards,
Zenith Support Team

Reference: ${ticket.id}`;
  }

  /**
   * Get customer profile for personalization
   */
  private async getCustomerProfile(email: string, userId?: string): Promise<CustomerProfile> {
    try {
      // Try to find user in database
      let user = null;
      if (userId) {
        user = await prisma.user.findUnique({ 
          where: { id: userId },
          include: { teams: { include: { team: true } } }
        });
      } else {
        user = await prisma.user.findUnique({ 
          where: { email },
          include: { teams: { include: { team: true } } }
        });
      }

      if (user) {
        const team = user.teams[0]?.team;
        return {
          userId: user.id,
          email: user.email,
          subscription_tier: (team?.subscriptionPlan as any) || 'freemium',
          account_created: user.createdAt,
          last_login: user.updatedAt,
          support_history_count: 0, // Would query support history
          satisfaction_rating: 4.5, // Would calculate from history
          preferred_contact_method: 'email',
          timezone: 'UTC'
        };
      }
    } catch (error) {
      console.error('Failed to get customer profile:', error);
    }

    // Default profile for non-users
    return {
      email,
      subscription_tier: 'freemium',
      account_created: new Date(),
      last_login: new Date(),
      support_history_count: 0,
      satisfaction_rating: 4.0,
      preferred_contact_method: 'email',
      timezone: 'UTC'
    };
  }

  /**
   * Process new tickets from queue
   */
  private async processNewTickets(): Promise<void> {
    const newTicketKeys = await redis?.keys('support_queue:*') || [];
    
    for (const key of newTicketKeys) {
      const ticketData = await redis?.get(key);
      if (ticketData) {
        const ticket = JSON.parse(ticketData);
        await this.createTicket(ticket);
        await redis?.del(key);
      }
    }
  }

  /**
   * Check if tickets need escalation
   */
  private async checkEscalationNeeded(): Promise<void> {
    for (const [ticketId, ticket] of this.activeTickets) {
      const hoursSinceCreation = (Date.now() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceCreation > this.ESCALATION_THRESHOLD && 
          ticket.assignedAgent === 'autonomous' && 
          ticket.status !== 'resolved') {
        
        await this.escalateToHuman(ticket, 'timeout');
      }
    }
  }

  /**
   * Escalate ticket to human agent
   */
  private async escalateToHuman(ticket: SupportTicket, reason: string): Promise<void> {
    ticket.assignedAgent = 'human';
    ticket.status = 'escalated';
    ticket.escalatedAt = new Date();
    ticket.updatedAt = new Date();

    // Create escalation alert
    await this.createEscalationAlert(ticket, reason);

    await this.storeTicket(ticket);

    console.log(`🚨 Ticket ${ticket.id} escalated to human agent (reason: ${reason})`);
  }

  /**
   * Update ticket statuses based on customer interaction
   */
  private async updateTicketStatuses(): Promise<void> {
    // Check for tickets awaiting response that might be resolved
    for (const [ticketId, ticket] of this.activeTickets) {
      if (ticket.status === 'awaiting_response') {
        const hoursSinceUpdate = (Date.now() - ticket.updatedAt.getTime()) / (1000 * 60 * 60);
        
        // Auto-resolve if no response after 72 hours and high confidence
        if (hoursSinceUpdate > 72 && ticket.resolutionConfidence > 85) {
          await this.autoResolveTicket(ticket);
        }
      }
    }
  }

  /**
   * Utility methods
   */
  private getPersonalizedGreeting(customer: CustomerProfile): string {
    const tierGreeting = {
      'freemium': 'Hello',
      'premium': 'Hello valued customer',
      'enterprise': 'Hello esteemed partner'
    };
    
    return tierGreeting[customer.subscription_tier] || 'Hello';
  }

  private getPersonalizedClosing(customer: CustomerProfile, ticket: SupportTicket): string {
    if (customer.subscription_tier === 'enterprise') {
      return 'As an enterprise customer, you have access to priority support. Please don\'t hesitate to reach out if you need further assistance.';
    } else if (customer.subscription_tier === 'premium') {
      return 'Thank you for being a premium subscriber. If you need additional help, please reply to this message.';
    } else {
      return 'If this resolves your issue, please consider upgrading to Premium for priority support and advanced features.';
    }
  }

  private generateAutomaticActions(ticket: SupportTicket, kbEntry: KnowledgeBaseEntry): SupportAction[] {
    const actions: SupportAction[] = [];

    // Add knowledge base reference
    actions.push({
      type: 'knowledge_base',
      description: `Referenced KB article: ${kbEntry.title}`,
      parameters: { kbId: kbEntry.id, confidence: kbEntry.confidence },
      executed: true,
      executedAt: new Date(),
      result: 'KB article provided in response'
    });

    return actions;
  }

  private async executeAction(action: SupportAction, ticket: SupportTicket): Promise<void> {
    switch (action.type) {
      case 'escalation':
        await this.escalateToHuman(ticket, action.parameters.reason);
        action.executed = true;
        action.executedAt = new Date();
        action.result = 'Escalated to human agent';
        break;
        
      // Add more action types as needed
    }
  }

  private async storeTicket(ticket: SupportTicket): Promise<void> {
    await redis?.setex(
      `ticket:${ticket.id}`,
      86400 * 30, // 30 days
      JSON.stringify(ticket)
    );
  }

  private async storeResponse(response: SupportResponse): Promise<void> {
    await redis?.setex(
      `response:${response.id}`,
      86400 * 30, // 30 days
      JSON.stringify(response)
    );
  }

  private async createEscalationAlert(ticket: SupportTicket, reason: string): Promise<void> {
    await redis?.setex(
      `escalation_alert:${ticket.id}`,
      86400, // 24 hours
      JSON.stringify({
        ticketId: ticket.id,
        reason,
        customerEmail: ticket.email,
        priority: ticket.priority,
        category: ticket.category,
        timestamp: new Date().toISOString()
      })
    );
  }

  private async autoResolveTicket(ticket: SupportTicket): Promise<void> {
    ticket.status = 'resolved';
    ticket.resolvedAt = new Date();
    ticket.resolutionTime = Math.round((ticket.resolvedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60));
    
    await this.storeTicket(ticket);
    this.activeTickets.delete(ticket.id);

    console.log(`✅ Auto-resolved ticket ${ticket.id} after ${ticket.resolutionTime} minutes`);
  }

  /**
   * Public methods for external access
   */
  async getTicketById(ticketId: string): Promise<SupportTicket | null> {
    const data = await redis?.get(`ticket:${ticketId}`);
    return data ? JSON.parse(data) : null;
  }

  async getTicketsByUser(userId: string): Promise<SupportTicket[]> {
    const keys = await redis?.keys('ticket:*') || [];
    const tickets = [];

    for (const key of keys) {
      const data = await redis?.get(key);
      if (data) {
        const ticket = JSON.parse(data);
        if (ticket.userId === userId) {
          tickets.push(ticket);
        }
      }
    }

    return tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getSupportMetrics(): Promise<{
    totalTickets: number;
    resolvedTickets: number;
    avgResolutionTime: number;
    autonomousResolutionRate: number;
    customerSatisfaction: number;
  }> {
    const keys = await redis?.keys('ticket:*') || [];
    const tickets = [];

    for (const key of keys) {
      const data = await redis?.get(key);
      if (data) {
        tickets.push(JSON.parse(data));
      }
    }

    const resolved = tickets.filter(t => t.status === 'resolved');
    const autonomous = resolved.filter(t => t.assignedAgent === 'autonomous');
    const withSatisfaction = tickets.filter(t => t.customerSatisfaction);

    const avgResolutionTime = resolved.length > 0
      ? resolved.reduce((sum, t) => sum + (t.resolutionTime || 0), 0) / resolved.length
      : 0;

    const avgSatisfaction = withSatisfaction.length > 0
      ? withSatisfaction.reduce((sum, t) => sum + (t.customerSatisfaction || 0), 0) / withSatisfaction.length
      : 0;

    return {
      totalTickets: tickets.length,
      resolvedTickets: resolved.length,
      avgResolutionTime: Math.round(avgResolutionTime),
      autonomousResolutionRate: resolved.length > 0 ? (autonomous.length / resolved.length) * 100 : 0,
      customerSatisfaction: Math.round(avgSatisfaction * 100) / 100
    };
  }
}

export const supportAgent = new SupportAgent();

// Export types
export type {
  SupportTicket,
  SupportResponse,
  SupportAction,
  KnowledgeBaseEntry,
  CustomerProfile
};