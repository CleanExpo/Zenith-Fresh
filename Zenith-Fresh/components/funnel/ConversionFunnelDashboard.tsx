'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { 
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  Target,
  BarChart3,
  LineChart,
  Activity,
  Zap,
  Eye,
  MousePointerClick,
  FileText,
  ShoppingCart,
  UserPlus,
  LogIn,
  Settings,
  Calendar as CalendarIcon,
  Download,
  Share,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  ArrowDown
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { 
  FunnelWithSteps,
  FunnelMetrics,
  FunnelHealthScore,
  DropoffPoint
} from '../../types/funnel';
import FunnelBuilder from './FunnelBuilder';
import FunnelTracker, { useFunnelTracker } from './FunnelTracker';
import DropoffAnalyzer from './DropoffAnalyzer';
import ConversionOptimizer from './ConversionOptimizer';

interface ConversionFunnelDashboardProps {
  initialFunnelId?: string;
  teamId?: string;
  projectId?: string;
  className?: string;
}

const eventTypeIcons = {
  PAGE_VIEW: Eye,
  BUTTON_CLICK: MousePointerClick,
  FORM_SUBMIT: FileText,
  PURCHASE: ShoppingCart,
  SIGNUP: UserPlus,
  LOGIN: LogIn,
  CUSTOM: Settings
};

export default function ConversionFunnelDashboard({
  initialFunnelId,
  teamId,
  projectId,
  className = ''
}: ConversionFunnelDashboardProps) {
  const [selectedFunnelId, setSelectedFunnelId] = useState(initialFunnelId || '');
  const [funnel, setFunnel] = useState<FunnelWithSteps | null>(null);
  const [funnels, setFunnels] = useState<FunnelWithSteps[]>([]);
  const [metrics, setMetrics] = useState<FunnelMetrics | null>(null);
  const [healthScore, setHealthScore] = useState<FunnelHealthScore | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    startOfDay(subDays(new Date(), 30)),
    endOfDay(new Date())
  ]);
  const [selectedDatePreset, setSelectedDatePreset] = useState('30d');
  const [activeView, setActiveView] = useState('overview');
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Funnel tracker hook
  const { trackCustomEvent, getTrackingState } = useFunnelTracker();

  // Load funnels on mount
  useEffect(() => {
    loadFunnels();
  }, [teamId, projectId]);

  // Load funnel data when selection changes
  useEffect(() => {
    if (selectedFunnelId) {
      loadFunnelData();
    }
  }, [selectedFunnelId, dateRange]);

  const loadFunnels = async () => {
    try {
      const response = await fetch(`/api/funnels?teamId=${teamId || ''}&projectId=${projectId || ''}`);
      if (response.ok) {
        const data = await response.json();
        setFunnels(data.funnels || []);
        
        // Auto-select first funnel if none selected
        if (!selectedFunnelId && data.funnels.length > 0) {
          setSelectedFunnelId(data.funnels[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load funnels:', error);
    }
  };

  const loadFunnelData = async () => {
    if (!selectedFunnelId) return;
    
    setIsLoading(true);
    try {
      const [funnelResponse, metricsResponse] = await Promise.all([
        fetch(`/api/funnels/${selectedFunnelId}`),
        fetch(`/api/funnels/${selectedFunnelId}/analytics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            periodStart: dateRange[0].toISOString(),
            periodEnd: dateRange[1].toISOString(),
            analysisTypes: ['CONVERSION_RATE', 'DROPOFF_ANALYSIS', 'REVENUE_ANALYSIS']
          })
        })
      ]);

      if (funnelResponse.ok) {
        const funnelData = await funnelResponse.json();
        setFunnel(funnelData);
      }

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData.metrics);
        
        // Calculate health score
        const health = calculateHealthScore(metricsData.metrics);
        setHealthScore(health);
      }
    } catch (error) {
      console.error('Failed to load funnel data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateHealthScore = (metrics: FunnelMetrics): FunnelHealthScore => {
    const conversionScore = Math.min(metrics.overallConversionRate * 10, 100); // Scale 0-1 to 0-100
    const dropoffScore = Math.max(100 - (metrics.dropoffPoints.reduce((sum, dp) => sum + dp.dropoffRate, 0) / metrics.dropoffPoints.length * 100), 0);
    const timeScore = metrics.averageTimeToConvert < 3600 ? 100 : Math.max(100 - (metrics.averageTimeToConvert / 3600 - 1) * 20, 0); // Penalty after 1 hour
    const revenueScore = metrics.averageRevenuePerUser > 0 ? Math.min(metrics.averageRevenuePerUser * 2, 100) : 0;
    const userExperienceScore = (conversionScore + dropoffScore + timeScore) / 3;
    
    const overall = (conversionScore * 0.3 + dropoffScore * 0.2 + timeScore * 0.15 + revenueScore * 0.15 + userExperienceScore * 0.2);
    
    return {
      overall: Math.round(overall),
      conversionRate: Math.round(conversionScore),
      dropoffRate: Math.round(dropoffScore),
      timeToConvert: Math.round(timeScore),
      revenuePerformance: Math.round(revenueScore),
      userExperience: Math.round(userExperienceScore)
    };
  };

  const handleDatePresetChange = (preset: string) => {
    setSelectedDatePreset(preset);
    const now = new Date();
    
    switch (preset) {
      case '7d':
        setDateRange([startOfDay(subDays(now, 7)), endOfDay(now)]);
        break;
      case '30d':
        setDateRange([startOfDay(subDays(now, 30)), endOfDay(now)]);
        break;
      case '90d':
        setDateRange([startOfDay(subDays(now, 90)), endOfDay(now)]);
        break;
      case '1y':
        setDateRange([startOfDay(subDays(now, 365)), endOfDay(now)]);
        break;
    }
  };

  const handleFunnelCreated = async (config: any) => {
    try {
      const response = await fetch('/api/funnels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          teamId,
          projectId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedFunnelId(data.funnel.id);
        setShowBuilder(false);
        await loadFunnels();
      }
    } catch (error) {
      console.error('Failed to create funnel:', error);
      throw error;
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const renderFunnelVisualization = () => {
    if (!funnel || !metrics) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Funnel Visualization</CardTitle>
          <CardDescription>
            Visual representation of user flow through your conversion funnel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {funnel.steps.map((step, index) => {
              const stepMetric = metrics.stepConversionRates.find(m => m.stepNumber === step.stepNumber);
              const userCount = stepMetric?.users || 0;
              const conversionRate = stepMetric?.conversionRate || 0;
              const revenueGenerated = stepMetric?.revenueGenerated || 0;
              const dropoff = metrics.dropoffPoints.find(dp => dp.fromStep === step.stepNumber);
              const IconComponent = eventTypeIcons[step.eventType as keyof typeof eventTypeIcons] || Settings;

              return (
                <div key={step.id} className="relative">
                  {/* Step Card */}
                  <div className="flex items-center space-x-4 p-4 border rounded-lg bg-white">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <IconComponent className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-lg">{step.name}</h4>
                          <p className="text-sm text-gray-600">{step.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {userCount.toLocaleString()}
                          </div>
                          <p className="text-sm text-gray-500">users</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Conversion Rate</p>
                          <p className="font-semibold text-lg">
                            {(conversionRate * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Completion %</p>
                          <p className="font-semibold text-lg">
                            {((userCount / metrics.totalUsers) * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Revenue</p>
                          <p className="font-semibold text-lg text-green-600">
                            ${revenueGenerated.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <Progress 
                          value={(userCount / metrics.totalUsers) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dropoff Indicator */}
                  {dropoff && index < funnel.steps.length - 1 && (
                    <div className="flex justify-center my-4">
                      <div className={`flex items-center space-x-2 px-4 py-2 rounded-full border ${
                        dropoff.dropoffRate > 0.5 
                          ? 'bg-red-50 border-red-200 text-red-700' 
                          : dropoff.dropoffRate > 0.3 
                          ? 'bg-orange-50 border-orange-200 text-orange-700'
                          : 'bg-gray-50 border-gray-200 text-gray-700'
                      }`}>
                        <ArrowDown className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {dropoff.dropoffCount.toLocaleString()} users dropped off ({(dropoff.dropoffRate * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Success Indicator */}
                  {index === funnel.steps.length - 1 && (
                    <div className="flex justify-center mt-4">
                      <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {userCount.toLocaleString()} users completed the funnel
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderMetricsCards = () => {
    if (!metrics) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-gray-500">
              in selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(metrics.overallConversionRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">
              overall funnel conversion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue per User</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${metrics.averageRevenuePerUser.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500">
              average per user
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time to Convert</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(metrics.averageTimeToConvert / 60)}m
            </div>
            <p className="text-xs text-gray-500">
              average completion time
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderHealthScore = () => {
    if (!healthScore) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Funnel Health Score</span>
          </CardTitle>
          <CardDescription>
            Overall performance assessment of your conversion funnel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold p-4 rounded-lg ${getHealthScoreColor(healthScore.overall)}`}>
                {healthScore.overall}
              </div>
              <p className="text-sm font-medium mt-2">Overall</p>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold p-3 rounded-lg ${getHealthScoreColor(healthScore.conversionRate)}`}>
                {healthScore.conversionRate}
              </div>
              <p className="text-sm mt-2">Conversion</p>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold p-3 rounded-lg ${getHealthScoreColor(healthScore.dropoffRate)}`}>
                {healthScore.dropoffRate}
              </div>
              <p className="text-sm mt-2">Retention</p>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold p-3 rounded-lg ${getHealthScoreColor(healthScore.timeToConvert)}`}>
                {healthScore.timeToConvert}
              </div>
              <p className="text-sm mt-2">Speed</p>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold p-3 rounded-lg ${getHealthScoreColor(healthScore.revenuePerformance)}`}>
                {healthScore.revenuePerformance}
              </div>
              <p className="text-sm mt-2">Revenue</p>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold p-3 rounded-lg ${getHealthScoreColor(healthScore.userExperience)}`}>
                {healthScore.userExperience}
              </div>
              <p className="text-sm mt-2">UX</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (showBuilder) {
    return (
      <div className={className}>
        <FunnelBuilder
          onFunnelCreated={handleFunnelCreated}
          teamId={teamId}
          projectId={projectId}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Conversion Funnels</h1>
          <p className="text-gray-600">
            Track and optimize your user conversion journeys
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Date Range Selector */}
          <Select value={selectedDatePreset} onValueChange={handleDatePresetChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={loadFunnelData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button onClick={() => setShowBuilder(true)}>
            <Target className="h-4 w-4 mr-2" />
            Create Funnel
          </Button>
        </div>
      </div>

      {/* Funnel Selector */}
      {funnels.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Label htmlFor="funnel-select" className="text-sm font-medium">
                Select Funnel:
              </Label>
              <Select value={selectedFunnelId} onValueChange={setSelectedFunnelId}>
                <SelectTrigger className="w-80">
                  <SelectValue placeholder="Choose a funnel to analyze" />
                </SelectTrigger>
                <SelectContent>
                  {funnels.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name} ({f.steps.length} steps)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {funnel && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Badge variant="outline">{funnel.category}</Badge>
                  <span>•</span>
                  <span>{funnel.steps.length} steps</span>
                  <span>•</span>
                  <span>Created {format(new Date(funnel.createdAt), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Funnels State */}
      {funnels.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Conversion Funnels Found
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first funnel to start tracking user conversions and optimizing your flow.
            </p>
            <Button onClick={() => setShowBuilder(true)}>
              <Target className="h-4 w-4 mr-2" />
              Create Your First Funnel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {funnel && metrics && (
        <>
          {/* Funnel Tracker */}
          <FunnelTracker
            funnelId={selectedFunnelId}
            sessionId={sessionId}
            userId="current-user" // TODO: Get from auth context
            isEnabled={true}
            debug={false}
          />

          {/* Metrics Overview */}
          {renderMetricsCards()}

          {/* Health Score */}
          {renderHealthScore()}

          {/* Main Dashboard Tabs */}
          <Tabs value={activeView} onValueChange={setActiveView} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="dropoffs">Dropoff Analysis</TabsTrigger>
              <TabsTrigger value="optimization">Optimization</TabsTrigger>
              <TabsTrigger value="testing">A/B Testing</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {renderFunnelVisualization()}
              
              {/* Top Traffic Sources */}
              {metrics.topSources.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Traffic Sources</CardTitle>
                    <CardDescription>
                      Best performing traffic sources for this funnel
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {metrics.topSources.slice(0, 5).map((source, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{source.source}</h4>
                            <p className="text-sm text-gray-600">
                              {source.medium && `${source.medium} • `}
                              {source.users.toLocaleString()} users
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-green-600">
                              {(source.conversionRate * 100).toFixed(1)}%
                            </div>
                            <p className="text-sm text-gray-600">
                              ${source.revenuePerUser.toFixed(2)} RPU
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="dropoffs">
              <DropoffAnalyzer
                funnelId={selectedFunnelId}
                funnel={funnel}
                metrics={metrics}
                dateRange={dateRange}
                onOptimizationRequest={(dropoffPoint: DropoffPoint) => {
                  // Switch to optimization tab and highlight the dropoff
                  setActiveView('optimization');
                }}
              />
            </TabsContent>

            <TabsContent value="optimization">
              <ConversionOptimizer
                funnelId={selectedFunnelId}
                funnel={funnel}
                metrics={metrics}
                dateRange={dateRange}
              />
            </TabsContent>

            <TabsContent value="testing">
              <Card>
                <CardHeader>
                  <CardTitle>A/B Testing Integration</CardTitle>
                  <CardDescription>
                    Funnel optimization through controlled experiments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                    <p>A/B Testing integration coming soon</p>
                    <p className="text-sm">Connect with existing A/B testing framework</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}