/**
 * Advanced Enterprise AI Platform - AI Ethics & Governance API
 * Handles bias detection, compliance audits, and ethics monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { aiEthicsGovernance } from '@/lib/ai/advanced/ai-ethics-governance';

// Request schemas
const BiasAssessmentRequestSchema = z.object({
  modelId: z.string(),
  assessmentType: z.enum(['fairness', 'representation', 'performance', 'societal']),
  methodology: z.string(),
  datasetInfo: z.object({
    id: z.string(),
    size: z.number(),
    demographics: z.record(z.any()),
    timeRange: z.object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    }),
  }),
  protectedAttributes: z.array(z.string()),
  assessedBy: z.string(),
});

const ComplianceAuditRequestSchema = z.object({
  name: z.string(),
  scope: z.object({
    models: z.array(z.string()),
    departments: z.array(z.string()),
    timeRange: z.object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    }),
  }),
  frameworks: z.array(z.enum(['gdpr', 'ccpa', 'hipaa', 'sox', 'iso27001', 'nist', 'fair', 'custom'])),
  criteria: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    requirements: z.array(z.string()),
    weight: z.number(),
  })),
  auditedBy: z.string(),
});

const ExplainabilityRequestSchema = z.object({
  modelId: z.string(),
  requestId: z.string(),
  explanationType: z.enum(['global', 'local', 'counterfactual', 'example_based']),
  audienceLevel: z.enum(['technical', 'business', 'regulatory', 'general']).default('business'),
});

const EthicsViolationRequestSchema = z.object({
  violationType: z.enum(['bias', 'privacy', 'fairness', 'transparency', 'misuse', 'discrimination']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string(),
  evidence: z.array(z.any()),
  affectedEntities: z.array(z.string()),
  discoveredBy: z.string(),
});

const GovernanceRuleRequestSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.enum(['data_usage', 'model_deployment', 'access_control', 'monitoring', 'reporting']),
  trigger: z.object({
    event: z.string(),
    conditions: z.array(z.object({
      field: z.string(),
      operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'contains']),
      value: z.any(),
    })),
  }),
  actions: z.array(z.object({
    type: z.enum(['approve', 'reject', 'flag', 'escalate', 'notify', 'log', 'block']),
    parameters: z.record(z.any()),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
  })),
  exemptions: z.array(z.object({
    condition: z.string(),
    approver: z.string(),
    reason: z.string(),
  })).optional(),
  createdBy: z.string(),
});

const EthicsFrameworkRequestSchema = z.object({
  name: z.string(),
  version: z.string(),
  principles: z.array(z.object({
    name: z.string(),
    description: z.string(),
    guidelines: z.array(z.string()),
    requirements: z.array(z.string()),
    metrics: z.array(z.string()),
  })),
  policies: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    scope: z.enum(['organization', 'department', 'project', 'model']),
    rules: z.array(z.object({
      condition: z.string(),
      action: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
    })),
    compliance: z.array(z.string()),
  })),
  createdBy: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...requestData } = body;

    switch (action) {
      case 'conduct_bias_assessment':
        const biasRequest = BiasAssessmentRequestSchema.parse({
          ...requestData,
          datasetInfo: {
            ...requestData.datasetInfo,
            timeRange: {
              start: new Date(requestData.datasetInfo.timeRange.start),
              end: new Date(requestData.datasetInfo.timeRange.end),
            },
          },
        });
        
        const assessmentId = await aiEthicsGovernance.conductBiasAssessment(biasRequest);
        
        return NextResponse.json({
          success: true,
          assessmentId,
          message: 'Bias assessment started successfully',
          timestamp: new Date().toISOString(),
        });

      case 'conduct_compliance_audit':
        const auditRequest = ComplianceAuditRequestSchema.parse({
          ...requestData,
          scope: {
            ...requestData.scope,
            timeRange: {
              start: new Date(requestData.scope.timeRange.start),
              end: new Date(requestData.scope.timeRange.end),
            },
          },
        });
        
        const auditId = await aiEthicsGovernance.conductComplianceAudit(auditRequest);
        
        return NextResponse.json({
          success: true,
          auditId,
          message: 'Compliance audit started successfully',
          timestamp: new Date().toISOString(),
        });

      case 'generate_explanation':
        const explainRequest = ExplainabilityRequestSchema.parse(requestData);
        const reportId = await aiEthicsGovernance.generateExplanation(
          explainRequest.modelId,
          explainRequest.requestId,
          explainRequest.explanationType,
          explainRequest.audienceLevel
        );
        
        return NextResponse.json({
          success: true,
          reportId,
          message: 'Explainability report generated successfully',
          timestamp: new Date().toISOString(),
        });

      case 'report_ethics_violation':
        const violationRequest = EthicsViolationRequestSchema.parse(requestData);
        const violationId = await aiEthicsGovernance.reportEthicsViolation(violationRequest);
        
        return NextResponse.json({
          success: true,
          violationId,
          message: 'Ethics violation reported successfully',
          timestamp: new Date().toISOString(),
        });

      case 'create_governance_rule':
        const ruleRequest = GovernanceRuleRequestSchema.parse(requestData);
        const ruleId = await aiEthicsGovernance.createGovernanceRule(ruleRequest);
        
        return NextResponse.json({
          success: true,
          ruleId,
          message: 'Governance rule created successfully',
          timestamp: new Date().toISOString(),
        });

      case 'create_ethics_framework':
        const frameworkRequest = EthicsFrameworkRequestSchema.parse(requestData);
        const frameworkId = await aiEthicsGovernance.createEthicsFramework(frameworkRequest);
        
        return NextResponse.json({
          success: true,
          frameworkId,
          message: 'Ethics framework created successfully',
          timestamp: new Date().toISOString(),
        });

      case 'conduct_risk_assessment':
        const { modelId } = requestData;
        const riskId = await aiEthicsGovernance.conductRiskAssessment(modelId);
        
        return NextResponse.json({
          success: true,
          riskId,
          message: 'Risk assessment started successfully',
          timestamp: new Date().toISOString(),
        });

      case 'approve_model':
        const { modelId: approveModelId, approver, comments } = requestData;
        await aiEthicsGovernance.approveModel(approveModelId, approver, comments);
        
        return NextResponse.json({
          success: true,
          message: 'Model approved successfully',
          timestamp: new Date().toISOString(),
        });

      case 'reject_model':
        const { modelId: rejectModelId, approver: rejector, reason } = requestData;
        await aiEthicsGovernance.rejectModel(rejectModelId, rejector, reason);
        
        return NextResponse.json({
          success: true,
          message: 'Model rejected',
          timestamp: new Date().toISOString(),
        });

      case 'enable_monitoring':
        const { modelId: monitorModelId } = requestData;
        aiEthicsGovernance.enableModelMonitoring(monitorModelId);
        
        return NextResponse.json({
          success: true,
          message: 'Model monitoring enabled',
          timestamp: new Date().toISOString(),
        });

      case 'disable_monitoring':
        const { modelId: unmonitorModelId } = requestData;
        aiEthicsGovernance.disableModelMonitoring(unmonitorModelId);
        
        return NextResponse.json({
          success: true,
          message: 'Model monitoring disabled',
          timestamp: new Date().toISOString(),
        });

      case 'trigger_governance_rule':
        const { event, context } = requestData;
        await aiEthicsGovernance.triggerGovernanceRule(event, context);
        
        return NextResponse.json({
          success: true,
          message: 'Governance rule triggered',
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('AI ethics error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request format',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    const modelId = searchParams.get('modelId');

    switch (action) {
      case 'list_ethics_frameworks':
        const frameworks = aiEthicsGovernance.listEthicsFrameworks();
        return NextResponse.json({
          success: true,
          frameworks,
          timestamp: new Date().toISOString(),
        });

      case 'get_ethics_framework':
        if (!id) {
          return NextResponse.json(
            { error: 'id parameter is required' },
            { status: 400 }
          );
        }
        
        const framework = aiEthicsGovernance.getEthicsFramework(id);
        if (!framework) {
          return NextResponse.json(
            { error: 'Ethics framework not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          framework,
          timestamp: new Date().toISOString(),
        });

      case 'list_bias_assessments':
        const assessments = aiEthicsGovernance.listBiasAssessments(modelId || undefined);
        return NextResponse.json({
          success: true,
          assessments,
          timestamp: new Date().toISOString(),
        });

      case 'get_bias_assessment':
        if (!id) {
          return NextResponse.json(
            { error: 'id parameter is required' },
            { status: 400 }
          );
        }
        
        const assessment = aiEthicsGovernance.getBiasAssessment(id);
        if (!assessment) {
          return NextResponse.json(
            { error: 'Bias assessment not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          assessment,
          timestamp: new Date().toISOString(),
        });

      case 'list_compliance_audits':
        const audits = aiEthicsGovernance.listComplianceAudits();
        return NextResponse.json({
          success: true,
          audits,
          timestamp: new Date().toISOString(),
        });

      case 'get_compliance_audit':
        if (!id) {
          return NextResponse.json(
            { error: 'id parameter is required' },
            { status: 400 }
          );
        }
        
        const audit = aiEthicsGovernance.getComplianceAudit(id);
        if (!audit) {
          return NextResponse.json(
            { error: 'Compliance audit not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          audit,
          timestamp: new Date().toISOString(),
        });

      case 'list_explainability_reports':
        const reports = aiEthicsGovernance.listExplainabilityReports(modelId || undefined);
        return NextResponse.json({
          success: true,
          reports,
          timestamp: new Date().toISOString(),
        });

      case 'get_explainability_report':
        if (!id) {
          return NextResponse.json(
            { error: 'id parameter is required' },
            { status: 400 }
          );
        }
        
        const report = aiEthicsGovernance.getExplainabilityReport(id);
        if (!report) {
          return NextResponse.json(
            { error: 'Explainability report not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          report,
          timestamp: new Date().toISOString(),
        });

      case 'list_ethics_violations':
        const violations = aiEthicsGovernance.listEthicsViolations();
        return NextResponse.json({
          success: true,
          violations,
          timestamp: new Date().toISOString(),
        });

      case 'get_ethics_violation':
        if (!id) {
          return NextResponse.json(
            { error: 'id parameter is required' },
            { status: 400 }
          );
        }
        
        const violation = aiEthicsGovernance.getEthicsViolation(id);
        if (!violation) {
          return NextResponse.json(
            { error: 'Ethics violation not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          violation,
          timestamp: new Date().toISOString(),
        });

      case 'list_governance_rules':
        const category = searchParams.get('category') as any || undefined;
        const rules = aiEthicsGovernance.listGovernanceRules(category);
        return NextResponse.json({
          success: true,
          rules,
          timestamp: new Date().toISOString(),
        });

      case 'get_governance_rule':
        if (!id) {
          return NextResponse.json(
            { error: 'id parameter is required' },
            { status: 400 }
          );
        }
        
        const rule = aiEthicsGovernance.getGovernanceRule(id);
        if (!rule) {
          return NextResponse.json(
            { error: 'Governance rule not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          rule,
          timestamp: new Date().toISOString(),
        });

      case 'get_risk_assessment':
        if (!id) {
          return NextResponse.json(
            { error: 'id parameter is required' },
            { status: 400 }
          );
        }
        
        const riskAssessment = aiEthicsGovernance.getRiskAssessment(id);
        if (!riskAssessment) {
          return NextResponse.json(
            { error: 'Risk assessment not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          riskAssessment,
          timestamp: new Date().toISOString(),
        });

      case 'monitored_models':
        const monitoredModels = aiEthicsGovernance.getMonitoredModels();
        return NextResponse.json({
          success: true,
          monitoredModels,
          timestamp: new Date().toISOString(),
        });

      case 'ethics_analytics':
        const analytics = aiEthicsGovernance.getEthicsAnalytics();
        return NextResponse.json({
          success: true,
          analytics,
          timestamp: new Date().toISOString(),
        });

      case 'compliance_score':
        const timeRange = searchParams.get('timeRange') || '30d';
        const complianceFramework = searchParams.get('framework');
        
        // Calculate compliance score based on recent audits
        const recentAudits = aiEthicsGovernance.listComplianceAudits()
          .filter(audit => audit.status === 'completed');
        
        let filteredAudits = recentAudits;
        if (complianceFramework) {
          filteredAudits = recentAudits.filter(audit => 
            audit.frameworks.includes(complianceFramework as any)
          );
        }
        
        const averageScore = filteredAudits.length > 0 
          ? filteredAudits.reduce((sum, audit) => sum + audit.overallScore, 0) / filteredAudits.length
          : 0;
        
        return NextResponse.json({
          success: true,
          complianceScore: averageScore,
          auditsCount: filteredAudits.length,
          timeRange,
          complianceFramework,
          timestamp: new Date().toISOString(),
        });

      case 'bias_trends':
        const period = searchParams.get('period') || '7d';
        const attribute = searchParams.get('attribute');
        
        // Generate bias trend data
        const biasAssessments = aiEthicsGovernance.listBiasAssessments();
        const trendData = biasAssessments
          .filter(assessment => assessment.status === 'completed')
          .map(assessment => ({
            date: assessment.completedAt,
            modelId: assessment.modelId,
            overallScore: assessment.overallScore,
            biasDetected: assessment.biasDetected,
            protectedAttributes: assessment.protectedAttributes,
          }))
          .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
        
        return NextResponse.json({
          success: true,
          trends: trendData,
          period,
          attribute,
          timestamp: new Date().toISOString(),
        });

      case 'violation_trends':
        const violationPeriod = searchParams.get('period') || '30d';
        const violationType = searchParams.get('type');
        
        const trendViolations = aiEthicsGovernance.listEthicsViolations();
        let filteredViolations = trendViolations;
        
        if (violationType) {
          filteredViolations = trendViolations.filter(v => v.violationType === violationType);
        }
        
        const violationTrends = filteredViolations.reduce((acc, violation) => {
          const dateKey = violation.reportedAt.toISOString().split('T')[0];
          acc[dateKey] = (acc[dateKey] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        return NextResponse.json({
          success: true,
          trends: violationTrends,
          period: violationPeriod,
          type: violationType,
          timestamp: new Date().toISOString(),
        });

      case 'explainability_coverage':
        const coverageModelId = searchParams.get('modelId');
        
        let explanationReports = aiEthicsGovernance.listExplainabilityReports();
        if (coverageModelId) {
          explanationReports = explanationReports.filter(r => r.modelId === coverageModelId);
        }
        
        const coverageStats = {
          totalReports: explanationReports.length,
          byType: explanationReports.reduce((acc, report) => {
            acc[report.explanationType] = (acc[report.explanationType] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          byAudience: explanationReports.reduce((acc, report) => {
            acc[report.audienceLevel] = (acc[report.audienceLevel] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          averageConfidence: explanationReports.reduce((sum, report) => sum + report.confidence, 0) / explanationReports.length || 0,
        };
        
        return NextResponse.json({
          success: true,
          coverage: coverageStats,
          modelId: coverageModelId,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('AI ethics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}