/**
 * Advanced Security Dashboard
 * 
 * Executive-level security monitoring and reporting with real-time
 * threat detection, compliance status, and risk analytics.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Users, 
  Lock, 
  Globe,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  Eye,
  Activity,
  Zap,
  Target,
  BarChart3,
  PieChart,
  LineChart,
  Map,
  Server,
  Wifi,
  Database
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell
} from 'recharts';

interface SecurityDashboardData {
  overview: {
    riskScore: number;
    activeThreats: number;
    securityIncidents: number;
    complianceScore: number;
    vulnerabilities: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    uptime: number;
  };
  threats: {
    summary: {
      activeThreats: number;
      openIncidents: number;
      threatsByLevel: Record<string, number>;
      topThreatTypes: Array<{ type: string; count: number }>;
    };
    recentThreats: Array<{
      id: string;
      type: string;
      level: string;
      source: string;
      timestamp: string;
      status: string;
    }>;
    riskTrends: Array<{
      timestamp: string;
      riskScore: number;
      threats: number;
      incidents: number;
    }>;
  };
  compliance: {
    frameworks: Record<string, {
      status: string;
      percentage: number;
      lastAssessment: string | null;
      controls: number;
    }>;
    overallCompliance: number;
    criticalIssues: number;
    upcomingAssessments: number;
  };
  vulnerabilities: {
    totalVulnerabilities: number;
    vulnerabilitiesBySeverity: Record<string, number>;
    vulnerabilitiesByType: Record<string, number>;
    recentFindings: Array<{
      id: string;
      type: string;
      severity: string;
      title: string;
      endpoint: string;
      discovered: string;
    }>;
  };
  zeroTrust: {
    activeSessions: number;
    policyRules: number;
    microSegments: number;
    recentAccessRequests: number;
    riskDistribution: Record<string, number>;
  };
  performance: {
    responseTime: number;
    availability: number;
    errorRate: number;
    throughput: number;
    trends: Array<{
      timestamp: string;
      responseTime: number;
      availability: number;
      errorRate: number;
      throughput: number;
    }>;
  };
  lastUpdated: string;
}

const SEVERITY_COLORS = {
  CRITICAL: '#dc2626',
  HIGH: '#ea580c',
  MEDIUM: '#d97706',
  LOW: '#65a30d',
  INFO: '#2563eb'
};

const THREAT_LEVEL_COLORS = {
  CRITICAL: '#dc2626',
  HIGH: '#ea580c',
  MEDIUM: '#d97706',
  LOW: '#65a30d'
};

export default function SecurityDashboard() {
  const [dashboardData, setDashboardData] = useState<SecurityDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time updates
    if (realTimeEnabled) {
      const interval = setInterval(fetchDashboardData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [realTimeEnabled]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch data from multiple security APIs
      const [
        overview,
        threats,
        compliance,
        vulnerabilities,
        zeroTrust,
        performance
      ] = await Promise.all([
        fetch('/api/security/overview').then(r => r.json()),
        fetch('/api/security/threats').then(r => r.json()),
        fetch('/api/compliance/dashboard').then(r => r.json()),
        fetch('/api/security/vulnerabilities').then(r => r.json()),
        fetch('/api/security/zero-trust').then(r => r.json()),
        fetch('/api/monitoring/performance').then(r => r.json())
      ]);

      const data: SecurityDashboardData = {
        overview: overview.data || generateMockOverview(),
        threats: threats.data || generateMockThreats(),
        compliance: compliance.data || generateMockCompliance(),
        vulnerabilities: vulnerabilities.data || generateMockVulnerabilities(),
        zeroTrust: zeroTrust.data || generateMockZeroTrust(),
        performance: performance.data || generateMockPerformance(),
        lastUpdated: new Date().toISOString()
      };

      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load security data');
      
      // Use mock data as fallback
      setDashboardData({
        overview: generateMockOverview(),
        threats: generateMockThreats(),
        compliance: generateMockCompliance(),
        vulnerabilities: generateMockVulnerabilities(),
        zeroTrust: generateMockZeroTrust(),
        performance: generateMockPerformance(),
        lastUpdated: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const getRiskLevelColor = (score: number): string => {
    if (score >= 80) return 'text-red-600 bg-red-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getThreatLevelColor = (level: string): string => {
    switch (level.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceStatusColor = (status: string): string => {
    switch (status.toUpperCase()) {
      case 'COMPLIANT':
        return 'bg-green-100 text-green-800';
      case 'NON_COMPLIANT':
        return 'bg-red-100 text-red-800';
      case 'PARTIALLY_COMPLIANT':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading security dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Security Data</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!dashboardData) {
    return (
      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No Data Available</AlertTitle>
        <AlertDescription>Security dashboard data is not available.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Operations Center</h1>
          <p className="text-muted-foreground">
            Real-time security monitoring, threat detection, and compliance management
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            variant={realTimeEnabled ? "default" : "outline"}
            size="sm"
          >
            <Activity className={`h-4 w-4 mr-2 ${realTimeEnabled ? 'animate-pulse' : ''}`} />
            Real-time
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {dashboardData.overview.activeThreats > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Active Security Threats Detected</AlertTitle>
          <AlertDescription className="text-red-700">
            {dashboardData.overview.activeThreats} active threat(s) require immediate attention.
            Risk score is currently {dashboardData.overview.riskScore}/100.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRiskLevelColor(dashboardData.overview.riskScore)}`}>
              {dashboardData.overview.riskScore}/100
            </div>
            <Progress 
              value={dashboardData.overview.riskScore} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Overall security risk level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {dashboardData.overview.activeThreats}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Threats requiring attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboardData.compliance.overallCompliance}%
            </div>
            <Progress 
              value={dashboardData.compliance.overallCompliance} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Regulatory compliance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Vulnerabilities</CardTitle>
            <Zap className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {dashboardData.overview.vulnerabilities.critical}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Requiring immediate patch
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Server className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboardData.overview.uptime}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Last 30 days availability
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zero Trust Sessions</CardTitle>
            <Lock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.zeroTrust.activeSessions}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Active verified sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="threats">Threat Intelligence</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="zerotrust">Zero Trust</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Security Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Risk Trends</CardTitle>
                <CardDescription>
                  Risk score and threat activity over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboardData.threats.riskTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="riskScore" 
                        stackId="1" 
                        stroke="#ef4444" 
                        fill="#fecaca" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="threats" 
                        stackId="2" 
                        stroke="#f59e0b" 
                        fill="#fed7aa" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Threat Distribution</CardTitle>
                <CardDescription>
                  Current threat levels breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(dashboardData.threats.summary.threatsByLevel).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: THREAT_LEVEL_COLORS[level as keyof typeof THREAT_LEVEL_COLORS] }}
                        />
                        <span className="font-medium">{level}</span>
                      </div>
                      <Badge className={getThreatLevelColor(level)}>
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Security Events */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>
                Latest security incidents and threat detections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.threats.recentThreats.slice(0, 5).map((threat, index) => (
                  <div key={threat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium">{threat.type.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          From {threat.source} • {new Date(threat.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getThreatLevelColor(threat.level)}>
                        {threat.level}
                      </Badge>
                      <Badge variant="outline">
                        {threat.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          {/* Threat Intelligence Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Threats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {dashboardData.threats.summary.activeThreats}
                </div>
                <p className="text-sm text-muted-foreground">
                  Threats currently being monitored
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Open Incidents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {dashboardData.threats.summary.openIncidents}
                </div>
                <p className="text-sm text-muted-foreground">
                  Security incidents under investigation
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Threat Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardData.threats.summary.topThreatTypes.slice(0, 3).map((threat, index) => (
                    <div key={threat.type} className="flex justify-between items-center">
                      <span className="text-sm">{threat.type.replace('_', ' ')}</span>
                      <Badge variant="outline">{threat.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Threat Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Threat Activity Timeline</CardTitle>
              <CardDescription>
                Security threats and incidents over the last 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={dashboardData.threats.riskTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="threats" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ fill: '#ef4444' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="incidents" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      dot={{ fill: '#f59e0b' }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Threat List */}
          <Card>
            <CardHeader>
              <CardTitle>All Active Threats</CardTitle>
              <CardDescription>
                Complete list of detected security threats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboardData.threats.recentThreats.map((threat, index) => (
                  <div key={threat.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{threat.type.replace('_', ' ')}</h4>
                        <p className="text-sm text-muted-foreground">
                          Source: {threat.source} • {new Date(threat.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getThreatLevelColor(threat.level)}>
                        {threat.level}
                      </Badge>
                      <Badge variant="outline">
                        {threat.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Investigate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vulnerabilities" className="space-y-4">
          {/* Vulnerability Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(dashboardData.vulnerabilities.vulnerabilitiesBySeverity).map(([severity, count]) => (
              <Card key={severity}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{severity} Severity</CardTitle>
                  <AlertTriangle 
                    className="h-4 w-4" 
                    style={{ color: SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] }}
                  />
                </CardHeader>
                <CardContent>
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] }}
                  >
                    {count}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Vulnerabilities found
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Vulnerability Types Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Vulnerabilities by Type</CardTitle>
              <CardDescription>
                Distribution of vulnerability types discovered
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(dashboardData.vulnerabilities.vulnerabilitiesByType).map(([type, count]) => ({ type, count }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Findings */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Vulnerability Findings</CardTitle>
              <CardDescription>
                Latest security vulnerabilities discovered
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.vulnerabilities.recentFindings.map((finding, index) => (
                  <div key={finding.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Target className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{finding.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {finding.endpoint} • Discovered {new Date(finding.discovered).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        style={{ 
                          backgroundColor: SEVERITY_COLORS[finding.severity as keyof typeof SEVERITY_COLORS] + '20',
                          color: SEVERITY_COLORS[finding.severity as keyof typeof SEVERITY_COLORS]
                        }}
                      >
                        {finding.severity}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          {/* Compliance Framework Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(dashboardData.compliance.frameworks).map(([framework, data]) => (
              <Card key={framework}>
                <CardHeader>
                  <CardTitle>{framework.replace('_', ' ')}</CardTitle>
                  <CardDescription>
                    {data.controls} controls • Last assessment: {data.lastAssessment ? new Date(data.lastAssessment).toLocaleDateString() : 'Never'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span>Compliance</span>
                        <span className="font-semibold">{data.percentage}%</span>
                      </div>
                      <Progress value={data.percentage} />
                    </div>
                    <Badge className={getComplianceStatusColor(data.status)}>
                      {data.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Compliance Issues */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Critical Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {dashboardData.compliance.criticalIssues}
                </div>
                <p className="text-sm text-muted-foreground">
                  Require immediate attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Overall Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {dashboardData.compliance.overallCompliance}%
                </div>
                <Progress value={dashboardData.compliance.overallCompliance} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Assessments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {dashboardData.compliance.upcomingAssessments}
                </div>
                <p className="text-sm text-muted-foreground">
                  Next 30 days
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="zerotrust" className="space-y-4">
          {/* Zero Trust Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {dashboardData.zeroTrust.activeSessions}
                </div>
                <p className="text-sm text-muted-foreground">
                  Verified user sessions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Policy Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {dashboardData.zeroTrust.policyRules}
                </div>
                <p className="text-sm text-muted-foreground">
                  Active access policies
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Micro Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {dashboardData.zeroTrust.microSegments}
                </div>
                <p className="text-sm text-muted-foreground">
                  Network segments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Access Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {dashboardData.zeroTrust.recentAccessRequests}
                </div>
                <p className="text-sm text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Risk Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Distribution</CardTitle>
              <CardDescription>
                User and device risk levels in zero trust environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(dashboardData.zeroTrust.riskDistribution).map(([level, count]) => (
                  <div key={level} className="text-center">
                    <div className={`text-2xl font-bold ${getThreatLevelColor(level)}`}>
                      {count}
                    </div>
                    <div className="text-sm text-muted-foreground">{level} Risk</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {dashboardData.performance.responseTime}ms
                </div>
                <p className="text-sm text-muted-foreground">
                  Average API response time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {dashboardData.performance.availability}%
                </div>
                <p className="text-sm text-muted-foreground">
                  System uptime
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {dashboardData.performance.errorRate}%
                </div>
                <p className="text-sm text-muted-foreground">
                  Failed requests
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Throughput</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {dashboardData.performance.throughput}
                </div>
                <p className="text-sm text-muted-foreground">
                  Requests per minute
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                System performance metrics over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={dashboardData.performance.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="responseTime" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Response Time (ms)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="availability" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Availability (%)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="errorRate" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="Error Rate (%)"
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {new Date(dashboardData.lastUpdated).toLocaleString()}
        {realTimeEnabled && <span className="ml-2">• Real-time updates enabled</span>}
      </div>
    </div>
  );
}

// Mock data generators for fallback
function generateMockOverview() {
  return {
    riskScore: 35,
    activeThreats: 3,
    securityIncidents: 1,
    complianceScore: 87,
    vulnerabilities: {
      critical: 2,
      high: 8,
      medium: 15,
      low: 23
    },
    uptime: 99.8
  };
}

function generateMockThreats() {
  const riskTrends = [];
  for (let i = 23; i >= 0; i--) {
    const date = new Date();
    date.setHours(date.getHours() - i);
    riskTrends.push({
      timestamp: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      riskScore: Math.floor(Math.random() * 40) + 20,
      threats: Math.floor(Math.random() * 10),
      incidents: Math.floor(Math.random() * 3)
    });
  }

  return {
    summary: {
      activeThreats: 3,
      openIncidents: 1,
      threatsByLevel: {
        CRITICAL: 1,
        HIGH: 2,
        MEDIUM: 5,
        LOW: 8
      },
      topThreatTypes: [
        { type: 'SQL_INJECTION', count: 5 },
        { type: 'BRUTE_FORCE_ATTACK', count: 3 },
        { type: 'XSS_ATTEMPT', count: 2 }
      ]
    },
    recentThreats: [
      {
        id: '1',
        type: 'SQL_INJECTION',
        level: 'HIGH',
        source: '192.168.1.100',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        status: 'INVESTIGATING'
      },
      {
        id: '2',
        type: 'BRUTE_FORCE_ATTACK',
        level: 'MEDIUM',
        source: '10.0.0.50',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        status: 'CONTAINED'
      }
    ],
    riskTrends
  };
}

function generateMockCompliance() {
  return {
    frameworks: {
      SOC2_TYPE_II: {
        status: 'COMPLIANT',
        percentage: 95,
        lastAssessment: new Date(Date.now() - 86400000 * 7).toISOString(),
        controls: 25
      },
      GDPR: {
        status: 'PARTIALLY_COMPLIANT',
        percentage: 78,
        lastAssessment: new Date(Date.now() - 86400000 * 14).toISOString(),
        controls: 18
      },
      ISO27001: {
        status: 'IN_PROGRESS',
        percentage: 65,
        lastAssessment: null,
        controls: 114
      }
    },
    overallCompliance: 87,
    criticalIssues: 2,
    upcomingAssessments: 3
  };
}

function generateMockVulnerabilities() {
  return {
    totalVulnerabilities: 48,
    vulnerabilitiesBySeverity: {
      CRITICAL: 2,
      HIGH: 8,
      MEDIUM: 15,
      LOW: 23
    },
    vulnerabilitiesByType: {
      SQL_INJECTION: 12,
      XSS: 8,
      CSRF: 5,
      AUTHENTICATION_BYPASS: 3,
      INFORMATION_DISCLOSURE: 7
    },
    recentFindings: [
      {
        id: '1',
        type: 'SQL_INJECTION',
        severity: 'CRITICAL',
        title: 'SQL Injection in User Authentication',
        endpoint: '/api/auth/login',
        discovered: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: '2',
        type: 'XSS',
        severity: 'HIGH',
        title: 'Reflected XSS in Search Function',
        endpoint: '/api/search',
        discovered: new Date(Date.now() - 86400000 * 2).toISOString()
      }
    ]
  };
}

function generateMockZeroTrust() {
  return {
    activeSessions: 127,
    policyRules: 45,
    microSegments: 12,
    recentAccessRequests: 1847,
    riskDistribution: {
      LOW: 85,
      MEDIUM: 32,
      HIGH: 8,
      CRITICAL: 2
    }
  };
}

function generateMockPerformance() {
  const trends = [];
  for (let i = 23; i >= 0; i--) {
    const date = new Date();
    date.setHours(date.getHours() - i);
    trends.push({
      timestamp: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      responseTime: Math.floor(Math.random() * 50) + 50,
      availability: Math.floor(Math.random() * 5) + 95,
      errorRate: Math.random() * 2,
      throughput: Math.floor(Math.random() * 500) + 1000
    });
  }

  return {
    responseTime: 85,
    availability: 99.8,
    errorRate: 0.2,
    throughput: 1250,
    trends
  };
}