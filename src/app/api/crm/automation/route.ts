/**
 * CRM Automation API
 * 
 * Handles email campaigns, customer journey automation, and workflow triggers
 */

import { NextRequest, NextResponse } from 'next/server';
import { crmAgent } from '@/lib/agents/crm-agent';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    switch (type) {
      case 'campaigns':
        // Get email campaigns
        const campaigns = await getCampaignOverview(status);
        return NextResponse.json({
          success: true,
          data: campaigns
        });

      case 'journeys':
        // Get customer journey analytics
        const journeys = await getCustomerJourneyAnalytics();
        return NextResponse.json({
          success: true,
          data: journeys
        });

      case 'triggers':
        // Get automation triggers
        const triggers = await getAutomationTriggers();
        return NextResponse.json({
          success: true,
          data: triggers
        });

      case 'workflows':
        // Get active workflows
        const workflows = await getActiveWorkflows();
        return NextResponse.json({
          success: true,
          data: workflows
        });

      default:
        // Get automation overview
        const overview = await getAutomationOverview();
        return NextResponse.json({
          success: true,
          data: overview
        });
    }

  } catch (error) {
    console.error('CRM automation GET API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch automation data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, campaignId, contactId, touchpointData, workflowData } = body;

    switch (action) {
      case 'track_touchpoint':
        if (!contactId || !touchpointData) {
          return NextResponse.json(
            { success: false, error: 'Contact ID and touchpoint data are required' },
            { status: 400 }
          );
        }

        await crmAgent.trackCustomerTouchpoint(contactId, touchpointData);

        return NextResponse.json({
          success: true,
          message: 'Touchpoint tracked successfully',
          data: {
            contactId,
            touchpointType: touchpointData.type,
            timestamp: new Date().toISOString()
          }
        });

      case 'trigger_campaign':
        if (!campaignId || !contactId) {
          return NextResponse.json(
            { success: false, error: 'Campaign ID and contact ID are required' },
            { status: 400 }
          );
        }

        // Trigger specific campaign for contact
        const triggerResult = await triggerCampaignForContact(campaignId, contactId);
        
        return NextResponse.json({
          success: true,
          message: 'Campaign triggered successfully',
          data: triggerResult
        });

      case 'create_workflow':
        if (!workflowData) {
          return NextResponse.json(
            { success: false, error: 'Workflow data is required' },
            { status: 400 }
          );
        }

        const workflow = await createAutomationWorkflow(workflowData);
        
        return NextResponse.json({
          success: true,
          message: 'Workflow created successfully',
          data: workflow
        });

      case 'pause_campaign':
        if (!campaignId) {
          return NextResponse.json(
            { success: false, error: 'Campaign ID is required' },
            { status: 400 }
          );
        }

        await pauseEmailCampaign(campaignId);
        
        return NextResponse.json({
          success: true,
          message: 'Campaign paused successfully'
        });

      case 'resume_campaign':
        if (!campaignId) {
          return NextResponse.json(
            { success: false, error: 'Campaign ID is required' },
            { status: 400 }
          );
        }

        await resumeEmailCampaign(campaignId);
        
        return NextResponse.json({
          success: true,
          message: 'Campaign resumed successfully'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('CRM automation POST API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process automation request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ==================== HELPER FUNCTIONS ====================

async function getCampaignOverview(status?: string | null) {
  // Mock campaign data - in production this would come from the CRM agent
  const campaigns = [
    {
      id: 'welcome_nurture',
      name: 'Welcome & Nurture Sequence',
      type: 'onboarding',
      status: 'active',
      metrics: {
        sent: 1247,
        opened: 856,
        clicked: 234,
        converted: 47,
        unsubscribed: 12
      },
      performance: {
        openRate: 0.686,
        clickRate: 0.188,
        conversionRate: 0.038,
        unsubscribeRate: 0.01
      },
      nextRun: new Date(Date.now() + 3600000).toISOString(),
      lastRun: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 'lead_nurture_technical',
      name: 'Technical Decision Maker Nurture',
      type: 'nurture',
      status: 'active',
      metrics: {
        sent: 543,
        opened: 398,
        clicked: 156,
        converted: 34,
        unsubscribed: 8
      },
      performance: {
        openRate: 0.733,
        clickRate: 0.287,
        conversionRate: 0.063,
        unsubscribeRate: 0.015
      },
      nextRun: new Date(Date.now() + 7200000).toISOString(),
      lastRun: new Date(Date.now() - 900000).toISOString()
    },
    {
      id: 'upsell_enterprise',
      name: 'Enterprise Upsell Campaign',
      type: 'promotional',
      status: 'paused',
      metrics: {
        sent: 89,
        opened: 67,
        clicked: 23,
        converted: 8,
        unsubscribed: 2
      },
      performance: {
        openRate: 0.753,
        clickRate: 0.258,
        conversionRate: 0.090,
        unsubscribeRate: 0.022
      },
      nextRun: null,
      lastRun: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  if (status) {
    return campaigns.filter(campaign => campaign.status === status);
  }

  return campaigns;
}

async function getCustomerJourneyAnalytics() {
  return {
    stages: {
      subscriber: {
        count: 2847,
        conversionRate: 0.24,
        averageTime: 5.2 // days
      },
      lead: {
        count: 683,
        conversionRate: 0.31,
        averageTime: 8.7
      },
      marketing_qualified_lead: {
        count: 212,
        conversionRate: 0.45,
        averageTime: 12.3
      },
      sales_qualified_lead: {
        count: 95,
        conversionRate: 0.62,
        averageTime: 18.5
      },
      opportunity: {
        count: 59,
        conversionRate: 0.38,
        averageTime: 24.8
      },
      customer: {
        count: 22,
        conversionRate: 1.0,
        averageTime: 0
      }
    },
    topPaths: [
      {
        path: 'subscriber → lead → mql → sql → customer',
        count: 12,
        conversionRate: 0.85,
        averageTime: 45.2
      },
      {
        path: 'lead → mql → sql → opportunity → customer',
        count: 8,
        conversionRate: 0.72,
        averageTime: 52.8
      },
      {
        path: 'subscriber → lead → sql → customer',
        count: 6,
        conversionRate: 0.91,
        averageTime: 38.7
      }
    ],
    dropoffPoints: [
      {
        stage: 'lead → mql',
        dropoffRate: 0.69,
        commonReasons: ['Lack of engagement', 'Poor lead quality', 'Timing mismatch']
      },
      {
        stage: 'sql → opportunity',
        dropoffRate: 0.38,
        commonReasons: ['Budget constraints', 'Decision delay', 'Competitor choice']
      }
    ]
  };
}

async function getAutomationTriggers() {
  return [
    {
      id: 'website_visit_pricing',
      name: 'Pricing Page Visit',
      type: 'behavioral',
      status: 'active',
      condition: 'page_view = "/pricing" AND visit_count >= 3',
      action: 'Send upgrade email sequence',
      triggeredCount: 234,
      conversionRate: 0.12
    },
    {
      id: 'demo_request',
      name: 'Demo Request',
      type: 'form_submission',
      status: 'active',
      condition: 'form_id = "demo_request"',
      action: 'Notify sales team + Schedule follow-up',
      triggeredCount: 89,
      conversionRate: 0.67
    },
    {
      id: 'email_engagement_high',
      name: 'High Email Engagement',
      type: 'engagement',
      status: 'active',
      condition: 'email_opens >= 5 AND email_clicks >= 2 IN last_7_days',
      action: 'Add to hot leads list',
      triggeredCount: 156,
      conversionRate: 0.28
    },
    {
      id: 'trial_expiring',
      name: 'Trial Expiring Soon',
      type: 'lifecycle',
      status: 'active',
      condition: 'trial_expires_in <= 3_days AND usage_level = "high"',
      action: 'Send conversion email series',
      triggeredCount: 67,
      conversionRate: 0.34
    }
  ];
}

async function getActiveWorkflows() {
  return [
    {
      id: 'wf_onboarding_saas',
      name: 'SaaS Customer Onboarding',
      type: 'lifecycle',
      status: 'active',
      steps: 7,
      activeContacts: 43,
      completedToday: 12,
      avgCompletionTime: 14.5, // days
      completionRate: 0.78
    },
    {
      id: 'wf_lead_nurture_b2b',
      name: 'B2B Lead Nurturing',
      type: 'nurture',
      status: 'active',
      steps: 12,
      activeContacts: 189,
      completedToday: 23,
      avgCompletionTime: 28.3,
      completionRate: 0.62
    },
    {
      id: 'wf_customer_success',
      name: 'Customer Success Check-ins',
      type: 'retention',
      status: 'active',
      steps: 5,
      activeContacts: 156,
      completedToday: 34,
      avgCompletionTime: 7.2,
      completionRate: 0.91
    }
  ];
}

async function getAutomationOverview() {
  const campaigns = await getCampaignOverview();
  const journeys = await getCustomerJourneyAnalytics();
  const triggers = await getAutomationTriggers();
  const workflows = await getActiveWorkflows();

  return {
    summary: {
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      totalEmailsSent: campaigns.reduce((sum, c) => sum + c.metrics.sent, 0),
      avgOpenRate: campaigns.reduce((sum, c) => sum + c.performance.openRate, 0) / campaigns.length,
      avgClickRate: campaigns.reduce((sum, c) => sum + c.performance.clickRate, 0) / campaigns.length,
      activeWorkflows: workflows.filter(w => w.status === 'active').length,
      activeTriggers: triggers.filter(t => t.status === 'active').length,
      contactsInAutomation: workflows.reduce((sum, w) => sum + w.activeContacts, 0)
    },
    campaigns: campaigns.slice(0, 3), // Top 3 campaigns
    recentTriggers: triggers.slice(0, 5), // Recent triggers
    performanceMetrics: {
      automationROI: 4.7,
      timesSaved: 23.5, // hours per week
      conversionImprovement: 0.34 // 34% improvement
    }
  };
}

async function triggerCampaignForContact(campaignId: string, contactId: string) {
  // Mock implementation - in production this would trigger actual campaign
  console.log(`🎯 Triggering campaign ${campaignId} for contact ${contactId}`);
  
  return {
    campaignId,
    contactId,
    status: 'triggered',
    nextEmail: new Date(Date.now() + 3600000).toISOString(),
    sequence: 1
  };
}

async function createAutomationWorkflow(workflowData: any) {
  // Mock implementation - in production this would create actual workflow
  const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`🔄 Creating automation workflow: ${workflowData.name}`);
  
  return {
    id: workflowId,
    name: workflowData.name,
    type: workflowData.type,
    status: 'draft',
    steps: workflowData.steps || [],
    triggers: workflowData.triggers || [],
    createdAt: new Date().toISOString()
  };
}

async function pauseEmailCampaign(campaignId: string) {
  // Mock implementation - in production this would pause actual campaign
  console.log(`⏸️ Pausing email campaign: ${campaignId}`);
}

async function resumeEmailCampaign(campaignId: string) {
  // Mock implementation - in production this would resume actual campaign
  console.log(`▶️ Resuming email campaign: ${campaignId}`);
}