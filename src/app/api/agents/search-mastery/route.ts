// src/app/api/agents/search-mastery/route.ts
import { NextRequest, NextResponse } from 'next/server';
import SearchMasteryAgent from '@/lib/agents/search-mastery-agent';

export async function POST(request: NextRequest) {
  try {
    const { task, clientId, userGscToken, context } = await request.json();
    
    if (!task || !clientId || !userGscToken) {
      return NextResponse.json(
        { error: 'Task, clientId, and userGscToken are required' },
        { status: 400 }
      );
    }

    const searchMasteryAgent = new SearchMasteryAgent(clientId, userGscToken);
    let result;

    switch (task) {
      case 'identifyHighValueSources':
        result = await searchMasteryAgent.identifyHighValueSources();
        break;

      case 'createAndPitchBespokeContent':
        if (!context?.opportunity) {
          return NextResponse.json(
            { error: 'Opportunity context required for bespoke content creation' },
            { status: 400 }
          );
        }
        result = await searchMasteryAgent.createAndPitchBespokeContent(context.opportunity);
        break;

      case 'verifyBacklink':
        if (!context?.url) {
          return NextResponse.json(
            { error: 'URL required for backlink verification' },
            { status: 400 }
          );
        }
        result = await searchMasteryAgent.verifyBacklink(context.url);
        break;

      case 'manageSearchConsole':
        result = await searchMasteryAgent.manageSearchConsole();
        break;

      case 'executeMonthlyAuthorityBuild':
        result = await searchMasteryAgent.executeMonthlyAuthorityBuild();
        break;

      default:
        return NextResponse.json(
          { error: `Unknown task: ${task}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      task,
      clientId,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('SearchMasteryAgent API error:', error);
    return NextResponse.json(
      { error: 'Failed to execute SearchMasteryAgent task' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Return available SearchMasteryAgent tasks and status
    const agentInfo = {
      agentName: 'SearchMasteryAgent',
      description: 'Autonomous authority-building through strategic backlink acquisition and Google Search Console management',
      availableTasks: [
        {
          task: 'identifyHighValueSources',
          description: 'Analyze competitors and identify high-value backlink opportunities',
          requiredParams: ['clientId', 'userGscToken']
        },
        {
          task: 'createAndPitchBespokeContent',
          description: 'Create tailored content and initiate outreach campaigns',
          requiredParams: ['clientId', 'userGscToken', 'context.opportunity']
        },
        {
          task: 'verifyBacklink',
          description: 'Verify and analyze newly acquired backlinks',
          requiredParams: ['clientId', 'userGscToken', 'context.url']
        },
        {
          task: 'manageSearchConsole',
          description: 'Automated Google Search Console management',
          requiredParams: ['clientId', 'userGscToken']
        },
        {
          task: 'executeMonthlyAuthorityBuild',
          description: 'Complete monthly authority building mission',
          requiredParams: ['clientId', 'userGscToken']
        }
      ],
      capabilities: [
        'Competitor backlink analysis',
        'High-value opportunity identification',
        'Bespoke content creation',
        'Multi-step outreach sequences',
        'Backlink verification and tracking',
        'Google Search Console automation',
        'Authority building missions'
      ]
    };

    return NextResponse.json({
      success: true,
      clientId,
      agent: agentInfo
    });

  } catch (error) {
    console.error('SearchMasteryAgent info error:', error);
    return NextResponse.json(
      { error: 'Failed to get SearchMasteryAgent information' },
      { status: 500 }
    );
  }
}
