/**
 * Enterprise Compliance Dashboard Component
 * 
 * Executive-level compliance visibility with real-time monitoring,
 * risk assessment, and regulatory framework status.
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
  Download,
  RefreshCw
} from 'lucide-react';

interface ComplianceFrameworkStatus {
  framework: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'UNDER_REVIEW';
  score: number;
  lastAssessment: string;
  nextAssessment: string;
  criticalIssues: number;
  totalControls: number;
  compliantControls: number;
}

interface ComplianceDashboardData {
  overview: {
    overallComplianceScore: number;
    criticalIssues: number;
    pendingRemediations: number;
    frameworkStatus: Record<string, string>;
  };
  soc2: {
    overallStatus: string;
    criticalIssues: number;
    controlsSummary: Record<string, { total: number; compliant: number; exceptions: number }>;
    upcomingTests: { controlId: string; nextTest: string }[];
  };
  gdpr: {
    consentStatistics: {
      totalConsentRecords: number;
      activeConsents: number;
      withdrawnConsents: number;
    };
    dataSubjectRequests: {
      total: number;
      pending: number;
      processing: number;
      completed: number;
      rejected: number;
    };
    processingRecords: number;
    breaches: {
      total: number;
      highRisk: number;
      lowRisk: number;
      last30Days: number;
    };
  };
  upcomingAssessments: { framework: string; date: string }[];
  lastUpdated: string;
}

export default function ComplianceDashboard() {
  const [dashboardData, setDashboardData] = useState<ComplianceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/compliance/dashboard?view=summary');
      if (!response.ok) {
        throw new Error('Failed to fetch compliance data');
      }
      
      const result = await response.json();
      setDashboardData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return 'bg-green-100 text-green-800';
      case 'NON_COMPLIANT':
        return 'bg-red-100 text-red-800';
      case 'PARTIALLY_COMPLIANT':
        return 'bg-yellow-100 text-yellow-800';
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'NON_COMPLIANT':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'PARTIALLY_COMPLIANT':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'UNDER_REVIEW':
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading compliance dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Compliance Data</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!dashboardData) {
    return (
      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No Data Available</AlertTitle>
        <AlertDescription>Compliance dashboard data is not available.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enterprise Compliance Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time compliance monitoring and risk assessment
          </p>
        </div>
        <div className="flex items-center space-x-2">
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
            Export Report
          </Button>
        </div>
      </div>

      {/* Critical Issues Alert */}
      {dashboardData.overview.criticalIssues > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Critical Compliance Issues Detected</AlertTitle>
          <AlertDescription className="text-red-700">
            {dashboardData.overview.criticalIssues} critical compliance issues require immediate attention.
            Review the detailed analysis below and implement remediation measures.
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Compliance Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.overview.overallComplianceScore}%
            </div>
            <Progress 
              value={dashboardData.overview.overallComplianceScore} 
              className="mt-2" 
            />
            <p className="text-xs text-muted-foreground mt-2">
              Across all active frameworks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {dashboardData.overview.criticalIssues}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Remediations</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {dashboardData.overview.pendingRemediations}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              In progress or scheduled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Frameworks</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(dashboardData.overview.frameworkStatus).length}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Compliance frameworks monitored
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="soc2">SOC2 Type II</TabsTrigger>
          <TabsTrigger value="gdpr">GDPR</TabsTrigger>
          <TabsTrigger value="frameworks">All Frameworks</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          {/* Framework Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Framework Status Overview</CardTitle>
              <CardDescription>
                Current compliance status across all regulatory frameworks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(dashboardData.overview.frameworkStatus).map(([framework, status]) => (
                  <div key={framework} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(status)}
                      <span className="font-medium">{framework.replace('_', ' ')}</span>
                    </div>
                    <Badge className={getStatusColor(status)}>
                      {status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Assessments */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Assessments</CardTitle>
              <CardDescription>
                Scheduled compliance assessments and reviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.upcomingAssessments.map((assessment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{assessment.framework} Assessment</p>
                        <p className="text-sm text-muted-foreground">
                          Scheduled for {new Date(assessment.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {Math.ceil((new Date(assessment.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="soc2" className="space-y-4">
          {/* SOC2 Overview */}
          <Card>
            <CardHeader>
              <CardTitle>SOC2 Type II Compliance</CardTitle>
              <CardDescription>
                Trust Services Criteria compliance status and control effectiveness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    {getStatusIcon(dashboardData.soc2.overallStatus)}
                    <span className="text-lg font-semibold">
                      Overall Status: {dashboardData.soc2.overallStatus.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Critical Issues:</span>
                      <span className="font-medium text-red-600">
                        {dashboardData.soc2.criticalIssues}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Controls Summary</h4>
                  <div className="space-y-2">
                    {Object.entries(dashboardData.soc2.controlsSummary).map(([category, summary]) => (
                      <div key={category} className="flex justify-between items-center">
                        <span className="text-sm">{category}:</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-green-600">{summary.compliant}</span>
                          <span className="text-sm text-gray-400">/</span>
                          <span className="text-sm">{summary.total}</span>
                          {summary.exceptions > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {summary.exceptions} issues
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Tests */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Control Tests</CardTitle>
              <CardDescription>
                Scheduled automated control testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.soc2.upcomingTests.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">Control {test.controlId}</p>
                        <p className="text-sm text-muted-foreground">
                          Next test: {new Date(test.nextTest).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Test Now
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gdpr" className="space-y-4">
          {/* GDPR Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Consent Management</CardTitle>
                <CardDescription>
                  GDPR consent tracking and management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Consent Records:</span>
                    <span className="font-semibold">
                      {dashboardData.gdpr.consentStatistics.totalConsentRecords}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Active Consents:</span>
                    <span className="font-semibold text-green-600">
                      {dashboardData.gdpr.consentStatistics.activeConsents}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Withdrawn Consents:</span>
                    <span className="font-semibold text-red-600">
                      {dashboardData.gdpr.consentStatistics.withdrawnConsents}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Subject Requests</CardTitle>
                <CardDescription>
                  Processing status of data subject rights requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Requests:</span>
                    <span className="font-semibold">
                      {dashboardData.gdpr.dataSubjectRequests.total}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pending:</span>
                    <span className="font-semibold text-yellow-600">
                      {dashboardData.gdpr.dataSubjectRequests.pending}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Processing:</span>
                    <span className="font-semibold text-blue-600">
                      {dashboardData.gdpr.dataSubjectRequests.processing}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Completed:</span>
                    <span className="font-semibold text-green-600">
                      {dashboardData.gdpr.dataSubjectRequests.completed}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Processing Records and Breaches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Processing Records</CardTitle>
                <CardDescription>
                  Article 30 compliance documentation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {dashboardData.gdpr.processingRecords}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Processing activities documented
                  </p>
                  <Button variant="outline" size="sm" className="mt-4">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Article 30 Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Breach Status</CardTitle>
                <CardDescription>
                  Breach notification and management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Breaches:</span>
                    <span className="font-semibold">
                      {dashboardData.gdpr.breaches.total}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>High Risk:</span>
                    <span className="font-semibold text-red-600">
                      {dashboardData.gdpr.breaches.highRisk}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Last 30 Days:</span>
                    <span className="font-semibold">
                      {dashboardData.gdpr.breaches.last30Days}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="frameworks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Compliance Frameworks</CardTitle>
              <CardDescription>
                Comprehensive view of all monitored compliance frameworks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(dashboardData.overview.frameworkStatus).map(([framework, status]) => (
                  <Card key={framework} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{framework.replace('_', ' ')}</h4>
                      {getStatusIcon(status)}
                    </div>
                    <Badge className={`${getStatusColor(status)} mb-3`}>
                      {status.replace('_', ' ')}
                    </Badge>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>Last Assessment: Recent</p>
                      <p>Next Review: Scheduled</p>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3">
                      View Details
                    </Button>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Schedule</CardTitle>
              <CardDescription>
                Planned compliance assessments and audit activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.upcomingAssessments.map((assessment, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{assessment.framework} Assessment</h4>
                        <p className="text-sm text-muted-foreground">
                          Scheduled for {new Date(assessment.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {Math.ceil((new Date(assessment.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                      </Badge>
                      <Button variant="outline" size="sm">
                        Prepare
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {new Date(dashboardData.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
}