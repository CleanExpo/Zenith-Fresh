/**
 * CRM Leads API
 * 
 * Handles lead management, scoring, and automation
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
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
    const filter = searchParams.get('filter');
    const limit = parseInt(searchParams.get('limit') || '50');
    const leadId = searchParams.get('id');

    // Get specific lead
    if (leadId) {
      const lead = await crmAgent.getLeadById(leadId);
      
      if (!lead) {
        return NextResponse.json(
          { success: false, error: 'Lead not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: lead
      });
    }

    // Get filtered leads
    let leads;
    switch (filter) {
      case 'qualified':
        leads = await crmAgent.getQualifiedLeads(limit);
        break;
      case 'high_priority':
        leads = (await crmAgent.getQualifiedLeads(limit * 2))
          .filter(lead => lead.priority === 'HIGH' || lead.priority === 'URGENT');
        break;
      case 'new':
        leads = (await crmAgent.getQualifiedLeads(limit * 2))
          .filter(lead => lead.status === 'new');
        break;
      case 'contacted':
        leads = (await crmAgent.getQualifiedLeads(limit * 2))
          .filter(lead => lead.status === 'contacted');
        break;
      default:
        leads = await crmAgent.getQualifiedLeads(limit);
    }

    // Calculate summary metrics
    const totalLeads = leads.length;
    const averageScore = leads.length > 0 
      ? leads.reduce((sum, lead) => sum + lead.score, 0) / leads.length 
      : 0;
    
    const statusDistribution = leads.reduce((dist, lead) => {
      dist[lead.status] = (dist[lead.status] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);

    const priorityDistribution = leads.reduce((dist, lead) => {
      dist[lead.priority] = (dist[lead.priority] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: leads,
      meta: {
        total: totalLeads,
        averageScore: Math.round(averageScore),
        statusDistribution,
        priorityDistribution,
        filter: filter || 'all',
        limit,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('CRM leads GET API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch leads',
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
    const { action, leadData, leadId, status, notes } = body;

    switch (action) {
      case 'create':
        if (!leadData) {
          return NextResponse.json(
            { success: false, error: 'Lead data is required' },
            { status: 400 }
          );
        }

        // Validate required fields
        if (!leadData.email || !leadData.lastName) {
          return NextResponse.json(
            { success: false, error: 'Email and last name are required' },
            { status: 400 }
          );
        }

        const result = await crmAgent.captureLead(leadData);
        
        if (!result.success) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 400 }
          );
        }

        // Get the created lead
        const createdLead = await crmAgent.getLeadById(result.leadId!);

        return NextResponse.json({
          success: true,
          data: createdLead,
          message: 'Lead created successfully',
          leadId: result.leadId
        });

      case 'update_status':
        if (!leadId || !status) {
          return NextResponse.json(
            { success: false, error: 'Lead ID and status are required' },
            { status: 400 }
          );
        }

        const updateResult = await crmAgent.updateLeadStatus(leadId, status, notes);
        
        if (!updateResult) {
          return NextResponse.json(
            { success: false, error: 'Failed to update lead status' },
            { status: 400 }
          );
        }

        // Get the updated lead
        const updatedLead = await crmAgent.getLeadById(leadId);

        return NextResponse.json({
          success: true,
          data: updatedLead,
          message: 'Lead status updated successfully'
        });

      case 'bulk_import':
        if (!Array.isArray(leadData)) {
          return NextResponse.json(
            { success: false, error: 'Lead data must be an array' },
            { status: 400 }
          );
        }

        const importResults = [];
        const errors = [];

        for (const lead of leadData) {
          try {
            const result = await crmAgent.captureLead(lead);
            if (result.success) {
              importResults.push({ leadId: result.leadId, email: lead.email, status: 'success' });
            } else {
              errors.push({ email: lead.email, error: result.error });
            }
          } catch (error) {
            errors.push({ 
              email: lead.email, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
          }
        }

        return NextResponse.json({
          success: true,
          data: {
            imported: importResults.length,
            failed: errors.length,
            results: importResults,
            errors
          },
          message: `Bulk import completed: ${importResults.length} successful, ${errors.length} failed`
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('CRM leads POST API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process lead request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
    const { leadId, updates } = body;

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    // Get current lead
    const currentLead = await crmAgent.getLeadById(leadId);
    if (!currentLead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Update specific fields
    if (updates.status) {
      await crmAgent.updateLeadStatus(leadId, updates.status, updates.notes);
    }

    // Get updated lead
    const updatedLead = await crmAgent.getLeadById(leadId);

    return NextResponse.json({
      success: true,
      data: updatedLead,
      message: 'Lead updated successfully'
    });

  } catch (error) {
    console.error('CRM leads PATCH API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update lead',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}