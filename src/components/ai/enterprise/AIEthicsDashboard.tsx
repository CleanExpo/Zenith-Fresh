'use client';

/**
 * Advanced Enterprise AI Platform - AI Ethics Dashboard
 * Comprehensive interface for managing AI ethics, bias detection, and compliance
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Search, 
  Filter,
  Award,
  Scale,
  Brain,
  Users,
  FileText,
  BarChart3,
  TrendingUp,
  Settings,
  Clock,
  Zap,
  Flag,
  Lock,
  Gavel
} from 'lucide-react';

interface EthicsMetrics {
  biasAssessments: {
    total: number;
    passed: number;
    failed: number;
    pending: number;
  };
  complianceAudits: {
    total: number;
    compliant: number;
    nonCompliant: number;
    inProgress: number;
  };
  explainabilityReports: {
    total: number;
    generated: number;
    pending: number;
  };
  ethicsViolations: {
    total: number;
    resolved: number;
    investigating: number;
    reported: number;
  };
}

interface BiasAssessment {
  id: string;
  modelId: string;
  modelName: string;
  assessmentType: 'fairness' | 'representation' | 'performance' | 'societal';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  overallScore: number;
  biasDetected: boolean;
  protectedAttributes: string[];
  createdAt: Date;
  completedAt?: Date;
  assessedBy: string;
}

interface ComplianceAudit {
  id: string;
  name: string;
  frameworks: string[];
  overallScore: number;
  status: 'planning' | 'in_progress' | 'completed' | 'failed';
  findings: Array<{
    criteriaId: string;
    name: string;
    status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
    score: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  }>;
  createdAt: Date;
  completedAt?: Date;
  auditedBy: string;
}

interface EthicsViolation {
  id: string;
  violationType: 'bias' | 'privacy' | 'fairness' | 'transparency' | 'misuse' | 'discrimination';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedEntities: string[];
  status: 'reported' | 'investigating' | 'resolved' | 'dismissed';
  reportedAt: Date;
  discoveredBy: string;
}

interface ExplainabilityReport {
  id: string;
  modelId: string;
  modelName: string;
  explanationType: 'global' | 'local' | 'counterfactual' | 'example_based';
  confidence: number;
  complexity: 'simple' | 'moderate' | 'complex';
  audienceLevel: 'technical' | 'business' | 'regulatory' | 'general';
  createdAt: Date;
}

export const AIEthicsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<EthicsMetrics>({
    biasAssessments: { total: 0, passed: 0, failed: 0, pending: 0 },
    complianceAudits: { total: 0, compliant: 0, nonCompliant: 0, inProgress: 0 },
    explainabilityReports: { total: 0, generated: 0, pending: 0 },
    ethicsViolations: { total: 0, resolved: 0, investigating: 0, reported: 0 },
  });

  const [biasAssessments, setBiasAssessments] = useState<BiasAssessment[]>([]);
  const [complianceAudits, setComplianceAudits] = useState<ComplianceAudit[]>([]);
  const [ethicsViolations, setEthicsViolations] = useState<EthicsViolation[]>([]);
  const [explainabilityReports, setExplainabilityReports] = useState<ExplainabilityReport[]>([]);

  useEffect(() => {
    loadEthicsData();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      updateMetrics();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadEthicsData = () => {
    // Load bias assessments
    const mockBiasAssessments: BiasAssessment[] = [
      {
        id: 'bias_1',
        modelId: 'model_1',
        modelName: 'Loan Approval Model',
        assessmentType: 'fairness',
        status: 'completed',
        overallScore: 0.85,
        biasDetected: false,
        protectedAttributes: ['gender', 'race', 'age'],
        createdAt: new Date('2024-01-20'),
        completedAt: new Date('2024-01-20'),
        assessedBy: 'ethics.team@company.com',
      },
      {
        id: 'bias_2',
        modelId: 'model_2',
        modelName: 'Hiring Recommendation System',
        assessmentType: 'representation',
        status: 'completed',
        overallScore: 0.65,
        biasDetected: true,
        protectedAttributes: ['gender', 'ethnicity'],
        createdAt: new Date('2024-01-18'),
        completedAt: new Date('2024-01-19'),
        assessedBy: 'ai.governance@company.com',
      },
      {
        id: 'bias_3',
        modelId: 'model_3',
        modelName: 'Credit Scoring Model',
        assessmentType: 'fairness',
        status: 'in_progress',
        overallScore: 0,
        biasDetected: false,
        protectedAttributes: ['race', 'income', 'location'],
        createdAt: new Date('2024-01-22'),
        assessedBy: 'ethics.team@company.com',
      },
    ];

    // Load compliance audits
    const mockComplianceAudits: ComplianceAudit[] = [
      {
        id: 'audit_1',
        name: 'GDPR Compliance Audit Q1 2024',
        frameworks: ['GDPR', 'ISO27001'],
        overallScore: 0.94,
        status: 'completed',
        findings: [
          {
            criteriaId: 'gdpr_1',
            name: 'Data Processing Documentation',
            status: 'compliant',
            score: 0.95,
            riskLevel: 'low',
          },
          {
            criteriaId: 'gdpr_2',
            name: 'Consent Management',
            status: 'partial',
            score: 0.85,
            riskLevel: 'medium',
          },
        ],
        createdAt: new Date('2024-01-15'),
        completedAt: new Date('2024-01-22'),
        auditedBy: 'compliance.officer@company.com',
      },
      {
        id: 'audit_2',
        name: 'AI Ethics Framework Audit',
        frameworks: ['Fair', 'Custom'],
        overallScore: 0.78,
        status: 'in_progress',
        findings: [],
        createdAt: new Date('2024-01-20'),
        auditedBy: 'ethics.team@company.com',
      },
    ];

    // Load ethics violations
    const mockEthicsViolations: EthicsViolation[] = [
      {
        id: 'violation_1',
        violationType: 'bias',
        severity: 'high',
        description: 'Gender bias detected in hiring recommendation algorithm',
        affectedEntities: ['hiring_model_v2', 'hr_department'],
        status: 'investigating',
        reportedAt: new Date('2024-01-21'),
        discoveredBy: 'automated.monitoring@company.com',
      },
      {
        id: 'violation_2',
        violationType: 'privacy',
        severity: 'medium',
        description: 'Potential data leakage in model training logs',
        affectedEntities: ['customer_segmentation_model'],
        status: 'resolved',
        reportedAt: new Date('2024-01-18'),
        discoveredBy: 'security.team@company.com',
      },
    ];

    // Load explainability reports
    const mockExplainabilityReports: ExplainabilityReport[] = [
      {
        id: 'explain_1',
        modelId: 'model_1',
        modelName: 'Fraud Detection Model',
        explanationType: 'local',
        confidence: 0.92,
        complexity: 'moderate',
        audienceLevel: 'business',
        createdAt: new Date('2024-01-22'),
      },
      {
        id: 'explain_2',
        modelId: 'model_2',
        modelName: 'Customer Churn Predictor',
        explanationType: 'global',
        confidence: 0.87,
        complexity: 'simple',
        audienceLevel: 'technical',
        createdAt: new Date('2024-01-21'),
      },
    ];

    setBiasAssessments(mockBiasAssessments);
    setComplianceAudits(mockComplianceAudits);
    setEthicsViolations(mockEthicsViolations);
    setExplainabilityReports(mockExplainabilityReports);

    // Update metrics
    updateMetrics();
  };

  const updateMetrics = () => {
    setMetrics({
      biasAssessments: {
        total: biasAssessments.length,
        passed: biasAssessments.filter(b => b.status === 'completed' && !b.biasDetected).length,
        failed: biasAssessments.filter(b => b.status === 'completed' && b.biasDetected).length,
        pending: biasAssessments.filter(b => b.status === 'pending' || b.status === 'in_progress').length,
      },
      complianceAudits: {
        total: complianceAudits.length,
        compliant: complianceAudits.filter(a => a.status === 'completed' && a.overallScore >= 0.9).length,
        nonCompliant: complianceAudits.filter(a => a.status === 'completed' && a.overallScore < 0.7).length,
        inProgress: complianceAudits.filter(a => a.status === 'in_progress' || a.status === 'planning').length,
      },
      explainabilityReports: {
        total: explainabilityReports.length,
        generated: explainabilityReports.length,
        pending: 0,
      },
      ethicsViolations: {
        total: ethicsViolations.length,
        resolved: ethicsViolations.filter(v => v.status === 'resolved').length,
        investigating: ethicsViolations.filter(v => v.status === 'investigating').length,
        reported: ethicsViolations.filter(v => v.status === 'reported').length,
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'resolved':
      case 'compliant':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
      case 'investigating':
      case 'partial':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
      case 'planning':
      case 'reported':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'non_compliant':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getViolationTypeIcon = (type: string) => {
    switch (type) {
      case 'bias':
        return <Scale className="w-4 h-4" />;
      case 'privacy':
        return <Lock className="w-4 h-4" />;
      case 'fairness':
        return <Gavel className="w-4 h-4" />;
      case 'transparency':
        return <Eye className="w-4 h-4" />;
      case 'misuse':
        return <AlertTriangle className="w-4 h-4" />;
      case 'discrimination':
        return <Users className="w-4 h-4" />;
      default:
        return <Flag className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Ethics & Governance</h1>
          <p className="text-gray-600">Monitor bias, ensure compliance, and maintain ethical AI practices</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline">
            <Shield className="w-4 h-4 mr-2" />
            Run Assessment
          </Button>
          <Button>
            <Award className="w-4 h-4 mr-2" />
            Start Audit
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Bias Assessments</h3>
            <Scale className="w-5 h-5 text-blue-600" />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">{metrics.biasAssessments.total}</p>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-green-600">{metrics.biasAssessments.passed} passed</span>
              <span className="text-red-600">{metrics.biasAssessments.failed} failed</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Compliance Audits</h3>
            <Award className="w-5 h-5 text-green-600" />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">{metrics.complianceAudits.total}</p>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-green-600">{metrics.complianceAudits.compliant} compliant</span>
              <span className="text-yellow-600">{metrics.complianceAudits.inProgress} in progress</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Ethics Violations</h3>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">{metrics.ethicsViolations.total}</p>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-green-600">{metrics.ethicsViolations.resolved} resolved</span>
              <span className="text-blue-600">{metrics.ethicsViolations.investigating} investigating</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Explainability</h3>
            <Eye className="w-5 h-5 text-purple-600" />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">{metrics.explainabilityReports.total}</p>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-green-600">{metrics.explainabilityReports.generated} reports generated</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bias">Bias Detection</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="explainability">Explainability</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Assessments */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Bias Assessments</h3>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </div>
              
              <div className="space-y-3">
                {biasAssessments.slice(0, 3).map((assessment) => (
                  <div key={assessment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{assessment.modelName}</p>
                      <p className="text-sm text-gray-600">{assessment.assessmentType} assessment</p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(assessment.status)}>
                        {assessment.status}
                      </Badge>
                      {assessment.status === 'completed' && (
                        <p className="text-sm text-gray-600 mt-1">
                          Score: {(assessment.overallScore * 100).toFixed(0)}%
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Ethics Violations */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Ethics Violations</h3>
                <Button variant="outline" size="sm">
                  <Flag className="w-4 h-4 mr-2" />
                  Report Issue
                </Button>
              </div>
              
              <div className="space-y-3">
                {ethicsViolations.slice(0, 3).map((violation) => (
                  <div key={violation.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-1 rounded-full bg-white">
                      {getViolationTypeIcon(violation.violationType)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-gray-900 capitalize">{violation.violationType}</p>
                        <Badge className={getSeverityColor(violation.severity)}>
                          {violation.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{violation.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {violation.reportedAt.toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getStatusColor(violation.status)}>
                      {violation.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Compliance Overview */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Compliance Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {complianceAudits.filter(audit => audit.status === 'completed').map((audit) => (
                <div key={audit.id} className="text-center p-4 bg-gray-50 rounded-lg">
                  <Award className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-medium text-gray-900">{audit.name}</h4>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {(audit.overallScore * 100).toFixed(0)}%
                  </p>
                  <p className="text-sm text-gray-600">Compliance Score</p>
                  <div className="flex justify-center space-x-1 mt-2">
                    {audit.frameworks.map((framework, index) => (
                      <Badge key={index} variant="outline" size="sm">
                        {framework}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="bias" className="space-y-6">
          <div className="space-y-4">
            {biasAssessments.map((assessment) => (
              <Card key={assessment.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{assessment.modelName}</h3>
                    <p className="text-sm text-gray-600">
                      {assessment.assessmentType} • {assessment.id}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(assessment.status)}>
                      {assessment.status}
                    </Badge>
                    {assessment.biasDetected && (
                      <Badge className="bg-red-100 text-red-800">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Bias Detected
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Assessment Type</p>
                    <p className="font-medium capitalize">{assessment.assessmentType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Overall Score</p>
                    <p className="font-medium">{(assessment.overallScore * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Protected Attributes</p>
                    <p className="font-medium">{assessment.protectedAttributes.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Assessed By</p>
                    <p className="font-medium">{assessment.assessedBy.split('@')[0]}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {assessment.protectedAttributes.map((attribute, index) => (
                    <Badge key={index} variant="outline">
                      {attribute}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View Report
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  {assessment.biasDetected && (
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Remediation Plan
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="compliance">
          <div className="space-y-4">
            {complianceAudits.map((audit) => (
              <Card key={audit.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{audit.name}</h3>
                    <p className="text-sm text-gray-600">
                      Frameworks: {audit.frameworks.join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(audit.status)}>
                      {audit.status}
                    </Badge>
                    {audit.status === 'completed' && (
                      <p className="text-lg font-bold text-green-600 mt-1">
                        {(audit.overallScore * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                </div>

                {audit.findings.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="font-medium text-gray-900">Findings:</p>
                    {audit.findings.map((finding, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{finding.name}</p>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(finding.status)}>
                              {finding.status}
                            </Badge>
                            <Badge className={getSeverityColor(finding.riskLevel)}>
                              {finding.riskLevel} risk
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{(finding.score * 100).toFixed(0)}%</p>
                          <p className="text-sm text-gray-600">Score</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="explainability">
          <div className="space-y-4">
            {explainabilityReports.map((report) => (
              <Card key={report.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{report.modelName}</h3>
                    <p className="text-sm text-gray-600">
                      {report.explanationType} explanation • {report.audienceLevel} level
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">
                      {(report.confidence * 100).toFixed(0)}%
                    </p>
                    <p className="text-sm text-gray-600">Confidence</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Explanation Type</p>
                    <p className="font-medium capitalize">{report.explanationType.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Complexity</p>
                    <p className="font-medium capitalize">{report.complexity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Audience</p>
                    <p className="font-medium capitalize">{report.audienceLevel}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View Explanation
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                  <Button variant="outline" size="sm">
                    <Brain className="w-4 h-4 mr-2" />
                    Alternative Explanation
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="violations">
          <div className="space-y-4">
            {ethicsViolations.map((violation) => (
              <Card key={violation.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getViolationTypeIcon(violation.violationType)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 capitalize">
                        {violation.violationType} Violation
                      </h3>
                      <p className="text-sm text-gray-600">{violation.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getSeverityColor(violation.severity)}>
                      {violation.severity}
                    </Badge>
                    <Badge className={getStatusColor(violation.status)}>
                      {violation.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Reported Date</p>
                    <p className="font-medium">{violation.reportedAt.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Discovered By</p>
                    <p className="font-medium">{violation.discoveredBy.split('@')[0]}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Affected Entities</p>
                    <p className="font-medium">{violation.affectedEntities.length}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Investigation
                  </Button>
                  {violation.status === 'resolved' && (
                    <Button variant="outline" size="sm">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Resolution Report
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="governance">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">AI Governance Framework</h3>
            <p className="text-gray-600 mb-6">
              Configure governance rules, policies, and monitoring for your AI systems.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline">
                <Shield className="w-4 h-4 mr-2" />
                Ethics Framework
              </Button>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Governance Rules
              </Button>
              <Button variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Access Control
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};