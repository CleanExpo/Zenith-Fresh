// src/app/api/crm/contacts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import CommunicationsAgent from '@/lib/agents/communications-agent';
import OperationsAgent from '@/lib/agents/operations-agent';

const communicationsAgent = new CommunicationsAgent();
const operationsAgent = new OperationsAgent();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // In production, use actual Prisma queries
    const mockContacts = [
      {
        id: 'contact_1',
        type: 'PROSPECT',
        firstName: 'Sarah',
        lastName: 'Chen',
        email: 'sarah@techstart.com',
        company: 'TechStart',
        title: 'CTO',
        status: 'ACTIVE',
        leadScore: 85,
        source: 'website',
        lastContactDate: new Date('2025-06-20'),
        createdAt: new Date('2025-06-15'),
        tags: ['high-value', 'demo-requested']
      },
      {
        id: 'contact_2',
        type: 'CLIENT',
        firstName: 'Marcus',
        lastName: 'Johnson',
        email: 'marcus@scale.io',
        company: 'Scale',
        title: 'Lead Developer',
        status: 'ACTIVE',
        leadScore: 95,
        source: 'referral',
        lastContactDate: new Date('2025-06-21'),
        createdAt: new Date('2025-06-10'),
        tags: ['paying-customer', 'enterprise']
      }
    ];

    let filteredContacts = mockContacts;
    
    if (type) {
      filteredContacts = filteredContacts.filter(c => c.type === type);
    }
    
    if (status) {
      filteredContacts = filteredContacts.filter(c => c.status === status);
    }

    const paginatedContacts = filteredContacts.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedContacts,
      total: filteredContacts.length,
      limit,
      offset
    });

  } catch (error) {
    console.error('CRM Contacts API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      firstName,
      lastName,
      email,
      phone,
      company,
      title,
      source,
      notes,
      tags
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // In production, create actual contact in database
    const newContact = {
      id: `contact_${Date.now()}`,
      type,
      firstName,
      lastName,
      email,
      phone,
      company,
      title,
      source,
      notes,
      tags: tags || [],
      status: 'ACTIVE',
      leadScore: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Trigger automation based on contact type
    if (type === 'PROSPECT') {
      // Start welcome sequence for new prospects
      await communicationsAgent.startEmailSequence(
        newContact.id,
        'new_prospect',
        { 
          contactName: `${firstName} ${lastName}`,
          company: company || 'your company',
          source 
        }
      );

      // Create follow-up task
      await operationsAgent.createTask(
        `New prospect added: ${firstName} ${lastName}`,
        `New prospect from ${source}. Company: ${company || 'Unknown'}. Requires qualification.`,
        'FOLLOW_UP',
        'NORMAL',
        newContact.id
      );
    } else if (type === 'CLIENT') {
      // Start client onboarding sequence
      await communicationsAgent.startEmailSequence(
        newContact.id,
        'welcome_series',
        { 
          contactName: `${firstName} ${lastName}`,
          company: company || 'your company'
        }
      );

      // Create onboarding task
      await operationsAgent.createTask(
        `Onboard new client: ${firstName} ${lastName}`,
        `New client added. Begin onboarding process and account setup.`,
        'ONBOARDING',
        'HIGH',
        newContact.id
      );
    }

    console.log(`CRM: Created new ${type.toLowerCase()} contact: ${firstName} ${lastName}`);

    return NextResponse.json({
      success: true,
      data: newContact,
      message: 'Contact created successfully'
    });

  } catch (error) {
    console.error('CRM Contact Creation Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}
