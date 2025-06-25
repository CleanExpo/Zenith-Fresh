import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Mock competitor data - replace with actual database queries
const mockCompetitors = [
  {
    id: '1',
    name: 'WebFlow Analytics',
    domain: 'webflow-analytics.com',
    description: 'Leading website performance analysis platform',
    founded: 2018,
    employees: '100-250',
    funding: '$50M Series B',
    status: 'active',
    lastUpdated: '2 hours ago',
    metrics: {
      trafficRank: 15420,
      monthlyVisitors: '2.3M',
      marketShare: 12.5,
      growthRate: 23.4,
      trustScore: 87,
      technologyStack: ['React', 'Node.js', 'PostgreSQL', 'AWS']
    },
    pricing: {
      startingPrice: 29,
      currency: 'USD',
      model: 'subscription'
    },
    strengths: ['Strong brand recognition', 'Advanced analytics', 'Good documentation'],
    weaknesses: ['Higher pricing', 'Complex onboarding', 'Limited integrations'],
    threats: ['New market entrants', 'Price competition'],
    opportunities: ['AI integration', 'Mobile analytics', 'International expansion']
  },
  {
    id: '2',
    name: 'SiteMetrics Pro',
    domain: 'sitemetrics.pro',
    description: 'Enterprise website monitoring and optimization',
    founded: 2020,
    employees: '50-100',
    funding: '$15M Series A',
    status: 'monitoring',
    lastUpdated: '1 day ago',
    metrics: {
      trafficRank: 28750,
      monthlyVisitors: '1.1M',
      marketShare: 8.3,
      growthRate: 45.2,
      trustScore: 79,
      technologyStack: ['Vue.js', 'Python', 'MongoDB', 'GCP']
    },
    pricing: {
      startingPrice: 19,
      currency: 'USD',
      model: 'freemium'
    },
    strengths: ['Competitive pricing', 'Fast growing', 'Modern UI'],
    weaknesses: ['Limited enterprise features', 'Newer brand', 'Smaller team'],
    threats: ['Funding dependency', 'Talent acquisition'],
    opportunities: ['Enterprise market', 'Partnership opportunities', 'Feature expansion']
  },
  {
    id: '3',
    name: 'AnalyzeThis',
    domain: 'analyzethis.io',
    description: 'AI-powered website intelligence platform',
    founded: 2019,
    employees: '25-50',
    funding: '$8M Seed',
    status: 'active',
    lastUpdated: '5 hours ago',
    metrics: {
      trafficRank: 45690,
      monthlyVisitors: '650K',
      marketShare: 5.7,
      growthRate: -8.1,
      trustScore: 72,
      technologyStack: ['Angular', 'Java', 'MySQL', 'Azure']
    },
    pricing: {
      startingPrice: 39,
      currency: 'USD',
      model: 'subscription'
    },
    strengths: ['AI capabilities', 'Detailed reports', 'API access'],
    weaknesses: ['Declining growth', 'Limited marketing', 'Outdated UI'],
    threats: ['Market consolidation', 'Technology debt'],
    opportunities: ['UI modernization', 'Marketing investment', 'Strategic partnerships']
  }
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In production, fetch from database based on user's project
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    
    // Filter competitors based on project or return all
    let competitors = mockCompetitors;
    
    if (projectId) {
      // In production, filter by projectId
      competitors = mockCompetitors; // For now, return all
    }

    return NextResponse.json({
      competitors,
      total: competitors.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching competitors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, domain, description, projectId } = body;

    // Validate required fields
    if (!name || !domain) {
      return NextResponse.json(
        { error: 'Name and domain are required' },
        { status: 400 }
      );
    }

    // In production, save to database
    const newCompetitor = {
      id: Date.now().toString(),
      name,
      domain,
      description: description || '',
      founded: new Date().getFullYear(),
      employees: 'Unknown',
      funding: 'Unknown',
      status: 'monitoring',
      lastUpdated: 'Just now',
      metrics: {
        trafficRank: 0,
        monthlyVisitors: 'Unknown',
        marketShare: 0,
        growthRate: 0,
        trustScore: 0,
        technologyStack: []
      },
      pricing: {
        startingPrice: 0,
        currency: 'USD',
        model: 'unknown'
      },
      strengths: [],
      weaknesses: [],
      threats: [],
      opportunities: []
    };

    return NextResponse.json({
      competitor: newCompetitor,
      message: 'Competitor added successfully'
    });
  } catch (error) {
    console.error('Error adding competitor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}