'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Target, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Zap,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  Filter,
  Download,
  RefreshCw,
  Eye,
  UserPlus
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface UserSegment {
  id: string;
  name: string;
  description: string;
  size: number;
  growth: number;
  characteristics: {
    avgAge: number;
    avgLTV: number;
    churnRate: number;
    conversionRate: number;
    engagementScore: number;
    featureAdoption: number;
  };
  behavior: {
    sessionDuration: number;
    actionsPerSession: number;
    weeklyFrequency: number;
    preferredFeatures: string[];
  };
  predictions: {
    growthForecast: number[];
    churnRisk: number;
    upsellProbability: number;
    lifetimeValueTrend: 'increasing' | 'decreasing' | 'stable';
  };
  marketing: {
    preferredChannels: string[];
    bestMessaging: string[];
    campaignResponse: number;
  };
  color: string;
}

interface SegmentTransition {
  from: string;
  to: string;
  probability: number;
  timeframe: number; // days
  triggers: string[];
}

interface PersonaProfile {
  segmentId: string;
  persona: {
    name: string;
    avatar: string;
    demographics: Record<string, any>;
    goals: string[];
    painPoints: string[];
    behaviors: string[];
  };
  marketingStrategy: {
    messaging: string[];
    channels: string[];
    content: string[];
    timing: string;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#ffc658', '#8dd1e1'];

const UserSegmentPredictor: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'segments' | 'transitions' | 'personas'>('overview');
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  
  // Data state
  const [segments, setSegments] = useState<UserSegment[]>([]);
  const [transitions, setTransitions] = useState<SegmentTransition[]>([]);
  const [personas, setPersonas] = useState<PersonaProfile[]>([]);
  const [segmentEvolution, setSegmentEvolution] = useState<any[]>([]);

  useEffect(() => {
    loadSegmentData();
  }, []);

  const loadSegmentData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSegments(),
        loadTransitions(),
        loadPersonas(),
        loadSegmentEvolution()
      ]);
    } catch (error) {
      console.error('Error loading segment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSegments = async () => {
    // Mock segment data - replace with actual API call
    setSegments([
      {
        id: 'power_users',
        name: 'Power Users',
        description: 'Highly engaged users with extensive feature usage and high value',
        size: 234,
        growth: 15.2,
        characteristics: {
          avgAge: 32,
          avgLTV: 4500,
          churnRate: 2.1,
          conversionRate: 85,
          engagementScore: 9.2,
          featureAdoption: 92
        },
        behavior: {
          sessionDuration: 45,
          actionsPerSession: 23,
          weeklyFrequency: 5.8,
          preferredFeatures: ['Advanced Analytics', 'API Access', 'Custom Dashboards', 'Team Collaboration']
        },
        predictions: {
          growthForecast: [234, 248, 265, 284, 305, 328, 354, 382, 413, 447, 484, 525],
          churnRisk: 2.1,
          upsellProbability: 78,
          lifetimeValueTrend: 'increasing'
        },
        marketing: {
          preferredChannels: ['Email', 'In-app', 'Webinars'],
          bestMessaging: ['Advanced features', 'Productivity gains', 'Expert insights'],
          campaignResponse: 34
        },
        color: COLORS[0]
      },
      {
        id: 'growth_seekers',
        name: 'Growth Seekers',
        description: 'Mid-tier users showing signs of increased engagement and upgrade potential',
        size: 567,
        growth: 23.7,
        characteristics: {
          avgAge: 29,
          avgLTV: 2200,
          churnRate: 8.5,
          conversionRate: 45,
          engagementScore: 6.8,
          featureAdoption: 67
        },
        behavior: {
          sessionDuration: 28,
          actionsPerSession: 15,
          weeklyFrequency: 3.2,
          preferredFeatures: ['Basic Analytics', 'Reports', 'Integrations', 'Mobile App']
        },
        predictions: {
          growthForecast: [567, 589, 615, 645, 678, 715, 756, 801, 851, 906, 966, 1032],
          churnRisk: 8.5,
          upsellProbability: 52,
          lifetimeValueTrend: 'increasing'
        },
        marketing: {
          preferredChannels: ['Social Media', 'Email', 'Blog'],
          bestMessaging: ['Growth opportunities', 'Success stories', 'Feature tutorials'],
          campaignResponse: 28
        },
        color: COLORS[1]
      },
      {
        id: 'casual_users',
        name: 'Casual Users',
        description: 'Regular users with moderate engagement and stable usage patterns',
        size: 1245,
        growth: 8.3,
        characteristics: {
          avgAge: 35,
          avgLTV: 1200,
          churnRate: 12.4,
          conversionRate: 25,
          engagementScore: 4.5,
          featureAdoption: 45
        },
        behavior: {
          sessionDuration: 18,
          actionsPerSession: 8,
          weeklyFrequency: 2.1,
          preferredFeatures: ['Dashboard', 'Basic Reports', 'Email Notifications']
        },
        predictions: {
          growthForecast: [1245, 1267, 1291, 1316, 1342, 1370, 1399, 1429, 1461, 1494, 1529, 1565],
          churnRisk: 12.4,
          upsellProbability: 31,
          lifetimeValueTrend: 'stable'
        },
        marketing: {
          preferredChannels: ['Email', 'In-app', 'Support'],
          bestMessaging: ['Easy solutions', 'Time savings', 'Simple guides'],
          campaignResponse: 18
        },
        color: COLORS[2]
      },
      {
        id: 'trial_explorers',
        name: 'Trial Explorers',
        description: 'New users in trial period exploring features and evaluating value',
        size: 456,
        growth: 45.6,
        characteristics: {
          avgAge: 31,
          avgLTV: 0,
          churnRate: 65.2,
          conversionRate: 12,
          engagementScore: 3.2,
          featureAdoption: 28
        },
        behavior: {
          sessionDuration: 12,
          actionsPerSession: 5,
          weeklyFrequency: 1.8,
          preferredFeatures: ['Getting Started', 'Tutorials', 'Support Chat']
        },
        predictions: {
          growthForecast: [456, 478, 502, 528, 556, 587, 621, 658, 698, 741, 787, 837],
          churnRisk: 65.2,
          upsellProbability: 15,
          lifetimeValueTrend: 'increasing'
        },
        marketing: {
          preferredChannels: ['In-app', 'Email', 'Chat'],
          bestMessaging: ['Welcome guidance', 'Quick wins', 'Feature benefits'],
          campaignResponse: 42
        },
        color: COLORS[3]
      },
      {
        id: 'at_risk',
        name: 'At Risk',
        description: 'Users showing declining engagement and high churn probability',
        size: 189,
        growth: -12.3,
        characteristics: {
          avgAge: 38,
          avgLTV: 1850,
          churnRate: 45.7,
          conversionRate: 8,
          engagementScore: 2.1,
          featureAdoption: 22
        },
        behavior: {
          sessionDuration: 8,
          actionsPerSession: 3,
          weeklyFrequency: 0.8,
          preferredFeatures: ['Basic Dashboard', 'Account Settings']
        },
        predictions: {
          growthForecast: [189, 185, 180, 175, 170, 165, 160, 155, 150, 145, 140, 135],
          churnRisk: 45.7,
          upsellProbability: 5,
          lifetimeValueTrend: 'decreasing'
        },
        marketing: {
          preferredChannels: ['Email', 'Phone', 'Support'],
          bestMessaging: ['Retention offers', 'Success stories', 'Personal assistance'],
          campaignResponse: 15
        },
        color: COLORS[4]
      }
    ]);
  };

  const loadTransitions = async () => {
    setTransitions([
      {
        from: 'trial_explorers',
        to: 'casual_users',
        probability: 35,
        timeframe: 14,
        triggers: ['Feature adoption', 'Positive onboarding', 'Value realization']
      },
      {
        from: 'casual_users',
        to: 'growth_seekers',
        probability: 25,
        timeframe: 60,
        triggers: ['Increased usage', 'Feature discovery', 'Team growth']
      },
      {
        from: 'growth_seekers',
        to: 'power_users',
        probability: 18,
        timeframe: 90,
        triggers: ['Advanced features', 'API usage', 'Multiple projects']
      },
      {
        from: 'casual_users',
        to: 'at_risk',
        probability: 15,
        timeframe: 45,
        triggers: ['Decreased usage', 'Support issues', 'Competition']
      },
      {
        from: 'trial_explorers',
        to: 'churned',
        probability: 65,
        timeframe: 30,
        triggers: ['No value realization', 'Poor onboarding', 'Feature confusion']
      }
    ]);
  };

  const loadPersonas = async () => {
    setPersonas([
      {
        segmentId: 'power_users',
        persona: {
          name: 'Alex the Analyst',
          avatar: '👨‍💼',
          demographics: { role: 'Data Analyst', company: 'Enterprise', experience: '5+ years' },
          goals: ['Advanced insights', 'Automation', 'Team collaboration'],
          painPoints: ['Complex data', 'Time constraints', 'Tool integration'],
          behaviors: ['Daily usage', 'API integration', 'Feature exploration']
        },
        marketingStrategy: {
          messaging: ['Advanced analytics capabilities', 'Time-saving automation', 'Enterprise-grade features'],
          channels: ['Email newsletters', 'Webinars', 'LinkedIn'],
          content: ['Technical blogs', 'Case studies', 'Feature deep-dives'],
          timing: 'Weekday mornings'
        }
      },
      {
        segmentId: 'growth_seekers',
        persona: {
          name: 'Sarah the Startup Owner',
          avatar: '👩‍💻',
          demographics: { role: 'Founder/CEO', company: 'Startup', experience: '2-5 years' },
          goals: ['Business growth', 'Efficiency', 'Cost optimization'],
          painPoints: ['Limited budget', 'Learning curve', 'Time management'],
          behaviors: ['Weekly usage', 'Feature discovery', 'Team building']
        },
        marketingStrategy: {
          messaging: ['Growth opportunities', 'ROI optimization', 'Scaling solutions'],
          channels: ['Social media', 'Startup communities', 'Email'],
          content: ['Success stories', 'Growth guides', 'Feature tutorials'],
          timing: 'Evenings and weekends'
        }
      },
      {
        segmentId: 'casual_users',
        persona: {
          name: 'Mike the Manager',
          avatar: '👨‍💼',
          demographics: { role: 'Project Manager', company: 'Mid-size', experience: '3-7 years' },
          goals: ['Project visibility', 'Team coordination', 'Reporting'],
          painPoints: ['Information silos', 'Manual processes', 'Stakeholder updates'],
          behaviors: ['Bi-weekly usage', 'Basic reporting', 'Team communication']
        },
        marketingStrategy: {
          messaging: ['Project efficiency', 'Team collaboration', 'Simple reporting'],
          channels: ['Email', 'In-app notifications', 'Support'],
          content: ['How-to guides', 'Best practices', 'Template libraries'],
          timing: 'Business hours'
        }
      }
    ]);
  };

  const loadSegmentEvolution = async () => {
    // Mock evolution data showing how segments change over time
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    setSegmentEvolution(
      months.map(month => ({
        month,
        power_users: 200 + Math.random() * 50,
        growth_seekers: 500 + Math.random() * 100,
        casual_users: 1100 + Math.random() * 200,
        trial_explorers: 400 + Math.random() * 100,
        at_risk: 150 + Math.random() * 50
      }))
    );
  };

  const filteredSegments = selectedSegment === 'all' 
    ? segments 
    : segments.filter(segment => segment.id === selectedSegment);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <BarChart3 className="w-4 h-4 text-gray-600" />;
    }
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 20) return 'text-green-600';
    if (growth > 0) return 'text-blue-600';
    return 'text-red-600';
  };

  const exportSegmentData = () => {
    const data = segments.map(segment => ({
      name: segment.name,
      size: segment.size,
      growth: segment.growth,
      avgLTV: segment.characteristics.avgLTV,
      churnRate: segment.characteristics.churnRate,
      conversionRate: segment.characteristics.conversionRate,
      engagementScore: segment.characteristics.engagementScore
    }));
    
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user-segments.csv';
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading user segment analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Segment Predictor</h2>
          <p className="text-gray-600 mt-1">AI-powered user segmentation and behavior prediction</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedSegment}
            onChange={(e) => setSelectedSegment(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Segments</option>
            {segments.map(segment => (
              <option key={segment.id} value={segment.id}>{segment.name}</option>
            ))}
          </select>
          <Button onClick={exportSegmentData} variant="outline" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
          <Button onClick={loadSegmentData} className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{segments.reduce((sum, s) => sum + s.size, 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Growing Segments</p>
                <p className="text-2xl font-bold">{segments.filter(s => s.growth > 0).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg LTV</p>
                <p className="text-2xl font-bold">
                  ${Math.round(segments.reduce((sum, s) => sum + s.characteristics.avgLTV * s.size, 0) / segments.reduce((sum, s) => sum + s.size, 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">High Value Segments</p>
                <p className="text-2xl font-bold">{segments.filter(s => s.characteristics.avgLTV > 3000).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'segments', label: 'Segments', icon: Users },
          { key: 'transitions', label: 'Transitions', icon: Target },
          { key: 'personas', label: 'Personas', icon: UserPlus }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveView(key as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeView === key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Segment Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={segments}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    dataKey="size"
                    nameKey="name"
                  >
                    {segments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Segment Evolution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={segmentEvolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {segments.map((segment, index) => (
                    <Line
                      key={segment.id}
                      type="monotone"
                      dataKey={segment.id}
                      stroke={segment.color}
                      name={segment.name}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Segment Performance Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={segments}>
                  <CartesianGrid />
                  <XAxis 
                    type="number" 
                    dataKey="characteristics.avgLTV" 
                    name="Average LTV"
                    tickFormatter={(value) => `$${value}`}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="characteristics.engagementScore" 
                    name="Engagement Score"
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value, name) => [
                      name === 'characteristics.avgLTV' ? `$${value}` : value,
                      name === 'characteristics.avgLTV' ? 'Average LTV' : 'Engagement Score'
                    ]}
                  />
                  <Scatter dataKey="size" fill="#8884d8">
                    {segments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Segments */}
      {activeView === 'segments' && (
        <div className="space-y-6">
          {filteredSegments.map((segment) => (
            <Card key={segment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: segment.color }}
                    />
                    <CardTitle>{segment.name}</CardTitle>
                    <Badge className={`${getGrowthColor(segment.growth)} bg-gray-100`}>
                      {segment.growth > 0 ? '+' : ''}{segment.growth.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{segment.size.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">users</div>
                  </div>
                </div>
                <p className="text-gray-600">{segment.description}</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Characteristics */}
                  <div>
                    <h4 className="font-semibold mb-3">Characteristics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Average LTV:</span>
                        <span className="font-medium">${segment.characteristics.avgLTV.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Churn Rate:</span>
                        <span className="font-medium">{segment.characteristics.churnRate}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Conversion Rate:</span>
                        <span className="font-medium">{segment.characteristics.conversionRate}%</span>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Engagement Score:</span>
                          <span className="font-medium">{segment.characteristics.engagementScore}/10</span>
                        </div>
                        <Progress value={segment.characteristics.engagementScore * 10} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Feature Adoption:</span>
                          <span className="font-medium">{segment.characteristics.featureAdoption}%</span>
                        </div>
                        <Progress value={segment.characteristics.featureAdoption} className="h-2" />
                      </div>
                    </div>
                  </div>

                  {/* Behavior */}
                  <div>
                    <h4 className="font-semibold mb-3">Behavior Patterns</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Session Duration:</span>
                        <span className="font-medium">{segment.behavior.sessionDuration} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Actions/Session:</span>
                        <span className="font-medium">{segment.behavior.actionsPerSession}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Weekly Frequency:</span>
                        <span className="font-medium">{segment.behavior.weeklyFrequency}</span>
                      </div>
                      <div className="mt-3">
                        <span className="text-gray-600 text-xs">Preferred Features:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {segment.behavior.preferredFeatures.map((feature, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Predictions */}
                  <div>
                    <h4 className="font-semibold mb-3">Predictions</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Churn Risk:</span>
                        <span className="font-medium text-red-600">{segment.predictions.churnRisk}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Upsell Probability:</span>
                        <span className="font-medium text-green-600">{segment.predictions.upsellProbability}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">LTV Trend:</span>
                        <div className="flex items-center space-x-1">
                          {getTrendIcon(segment.predictions.lifetimeValueTrend)}
                          <span className="font-medium">{segment.predictions.lifetimeValueTrend}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <span className="text-gray-600 text-xs">12M Growth Forecast:</span>
                        <ResponsiveContainer width="100%" height={80}>
                          <LineChart data={segment.predictions.growthForecast.map((value, index) => ({ 
                            month: index + 1, 
                            size: value 
                          }))}>
                            <Line 
                              type="monotone" 
                              dataKey="size" 
                              stroke={segment.color} 
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Marketing Strategy</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Preferred Channels:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {segment.marketing.preferredChannels.map((channel, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Best Messaging:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {segment.marketing.bestMessaging.map((message, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {message}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Campaign Response Rate:</span>
                      <div className="font-medium">{segment.marketing.campaignResponse}%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Segment Transitions */}
      {activeView === 'transitions' && (
        <Card>
          <CardHeader>
            <CardTitle>Segment Transition Probabilities</CardTitle>
            <p className="text-gray-600">How users move between segments over time</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transitions.map((transition, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {segments.find(s => s.id === transition.from)?.name || transition.from}
                        </Badge>
                        <span className="text-gray-400">→</span>
                        <Badge variant="outline">
                          {segments.find(s => s.id === transition.to)?.name || transition.to}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{transition.probability}%</div>
                      <div className="text-sm text-gray-600">probability</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Average Timeframe:</span>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{transition.timeframe} days</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Key Triggers:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {transition.triggers.map((trigger, triggerIndex) => (
                          <Badge key={triggerIndex} variant="secondary" className="text-xs">
                            {trigger}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <Progress value={transition.probability} className="mt-3" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Personas */}
      {activeView === 'personas' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {personas.map((persona) => {
            const segment = segments.find(s => s.id === persona.segmentId);
            return (
              <Card key={persona.segmentId}>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{persona.persona.avatar}</div>
                    <div>
                      <CardTitle>{persona.persona.name}</CardTitle>
                      <p className="text-gray-600">{segment?.name}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Demographics</h4>
                    <div className="text-sm space-y-1">
                      {Object.entries(persona.persona.demographics).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600 capitalize">{key}:</span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Goals</h4>
                    <div className="flex flex-wrap gap-1">
                      {persona.persona.goals.map((goal, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {goal}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Pain Points</h4>
                    <div className="flex flex-wrap gap-1">
                      {persona.persona.painPoints.map((pain, index) => (
                        <Badge key={index} variant="outline" className="text-xs text-red-600">
                          {pain}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Marketing Strategy</h4>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-gray-600">Channels:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {persona.marketingStrategy.channels.map((channel, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {channel}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Content:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {persona.marketingStrategy.content.map((content, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {content}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Best Timing:</span>
                        <span className="font-medium">{persona.marketingStrategy.timing}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserSegmentPredictor;