"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lock,
  Eye,
  Users,
  BookOpen,
  Scale,
  Search,
  Filter,
  Plus,
  Edit,
  Download,
  Upload,
  Flag,
  Clock,
  BarChart3,
  Settings,
  Globe
} from 'lucide-react';
import { motion } from 'framer-motion';

interface GovernancePolicy {
  id: string;
  name: string;
  description?: string;
  policyType: 'content_filter' | 'usage_limit' | 'access_control' | 'compliance' | 'data_retention' | 'audit';
  rules: PolicyRule[];
  enforcement: 'block' | 'warn' | 'log' | 'escalate';
  scope: 'global' | 'team' | 'agent' | 'model';
  scopeId?: string;
  scopeName?: string;
  isActive: boolean;
  violations: number;
  lastViolation?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface PolicyRule {
  id: string;
  type: 'keyword_filter' | 'rate_limit' | 'time_restriction' | 'data_classification' | 'geo_restriction';
  condition: string;
  action: string;
  parameters: any;
}

interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  requirements: ComplianceRequirement[];
  status: 'compliant' | 'partial' | 'non_compliant' | 'unknown';
  lastAssessment?: Date;
  nextAssessment?: Date;
}

interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  status: 'met' | 'partial' | 'not_met' | 'not_applicable';
  evidence?: string;
  remediation?: string;
}

interface PolicyViolation {
  id: string;
  policyId: string;
  policyName: string;
  agentId?: string;
  agentName?: string;
  userId?: string;
  userName?: string;
  violationType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  content?: string;
  action: 'blocked' | 'warned' | 'logged' | 'escalated';
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

interface AuditLog {
  id: string;
  eventType: 'policy_created' | 'policy_updated' | 'violation_detected' | 'access_granted' | 'data_accessed';
  description: string;
  userId?: string;
  userName?: string;
  agentId?: string;
  agentName?: string;
  metadata?: any;
  timestamp: Date;
}

const policyTypes = {
  content_filter: { 
    icon: Filter, 
    label: 'Content Filter', 
    description: 'Filter harmful or inappropriate content' 
  },
  usage_limit: { 
    icon: Clock, 
    label: 'Usage Limits', 
    description: 'Control usage rates and quotas' 
  },
  access_control: { 
    icon: Lock, 
    label: 'Access Control', 
    description: 'Manage user and system permissions' 
  },
  compliance: { 
    icon: Scale, 
    label: 'Compliance', 
    description: 'Ensure regulatory compliance' 
  },
  data_retention: { 
    icon: FileText, 
    label: 'Data Retention', 
    description: 'Manage data lifecycle and retention' 
  },
  audit: { 
    icon: Eye, 
    label: 'Audit Trail', 
    description: 'Track and log system activities' 
  }
};

const complianceFrameworks = [
  {
    id: 'gdpr',
    name: 'GDPR',
    description: 'General Data Protection Regulation (EU)',
    requirements: [
      { id: 'data_minimization', title: 'Data Minimization', description: 'Collect only necessary data' },
      { id: 'consent', title: 'User Consent', description: 'Obtain explicit user consent' },
      { id: 'right_to_deletion', title: 'Right to Deletion', description: 'Allow users to delete their data' },
      { id: 'data_portability', title: 'Data Portability', description: 'Allow users to export their data' }
    ]
  },
  {
    id: 'hipaa',
    name: 'HIPAA',
    description: 'Health Insurance Portability and Accountability Act (US)',
    requirements: [
      { id: 'phi_protection', title: 'PHI Protection', description: 'Protect personal health information' },
      { id: 'access_controls', title: 'Access Controls', description: 'Implement proper access controls' },
      { id: 'audit_logs', title: 'Audit Logs', description: 'Maintain comprehensive audit logs' },
      { id: 'encryption', title: 'Data Encryption', description: 'Encrypt sensitive data' }
    ]
  },
  {
    id: 'sox',
    name: 'SOX',
    description: 'Sarbanes-Oxley Act (US)',
    requirements: [
      { id: 'financial_controls', title: 'Financial Controls', description: 'Implement financial reporting controls' },
      { id: 'audit_trail', title: 'Audit Trail', description: 'Maintain detailed audit trails' },
      { id: 'segregation_duties', title: 'Segregation of Duties', description: 'Separate conflicting duties' }
    ]
  }
];

export default function AIGovernanceCompliance() {
  const [policies, setPolicies] = useState<GovernancePolicy[]>([]);
  const [violations, setViolations] = useState<PolicyViolation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<GovernancePolicy | null>(null);
  const [isCreatingPolicy, setIsCreatingPolicy] = useState(false);
  const [activeTab, setActiveTab] = useState('policies');

  useEffect(() => {
    fetchGovernanceData();
  }, []);

  const fetchGovernanceData = async () => {
    try {
      const [policiesRes, violationsRes, auditRes, frameworksRes] = await Promise.all([
        fetch('/api/ai-orchestration/governance/policies'),
        fetch('/api/ai-orchestration/governance/violations'),
        fetch('/api/ai-orchestration/governance/audit'),
        fetch('/api/ai-orchestration/governance/frameworks')
      ]);

      const [policiesData, violationsData, auditData, frameworksData] = await Promise.all([
        policiesRes.json(),
        violationsRes.json(),
        auditRes.json(),
        frameworksRes.json()
      ]);

      setPolicies(policiesData.policies || []);
      setViolations(violationsData.violations || []);
      setAuditLogs(auditData.logs || []);
      setFrameworks(frameworksData.frameworks || []);
    } catch (error) {
      console.error('Error fetching governance data:', error);
    }
  };

  const createPolicy = async (policyData: any) => {
    try {
      const response = await fetch('/api/ai-orchestration/governance/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policyData)
      });

      if (response.ok) {
        fetchGovernanceData();
        setIsCreatingPolicy(false);
      }
    } catch (error) {
      console.error('Error creating policy:', error);
    }
  };

  const togglePolicy = async (policyId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/ai-orchestration/governance/policies/${policyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      if (response.ok) {
        fetchGovernanceData();
      }
    } catch (error) {
      console.error('Error toggling policy:', error);
    }
  };

  const resolveViolation = async (violationId: string) => {
    try {
      const response = await fetch(`/api/ai-orchestration/governance/violations/${violationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isResolved: true })
      });

      if (response.ok) {
        fetchGovernanceData();
      }
    } catch (error) {
      console.error('Error resolving violation:', error);
    }
  };

  const activePolicies = policies.filter(p => p.isActive).length;
  const totalViolations = violations.length;
  const unresolvedViolations = violations.filter(v => !v.isResolved).length;
  const criticalViolations = violations.filter(v => v.severity === 'critical' && !v.isResolved).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Governance & Compliance</h1>
          <p className="text-muted-foreground">Manage policies, ensure compliance, and audit AI activities</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button onClick={() => setIsCreatingPolicy(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Policy
          </Button>
        </div>
      </div>

      {/* Critical Violations Alert */}
      {criticalViolations > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{criticalViolations} critical violation(s)</strong> require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePolicies}</div>
            <p className="text-xs text-muted-foreground">
              of {policies.length} total policies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Violations</CardTitle>
            <Flag className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unresolvedViolations}</div>
            <p className="text-xs text-muted-foreground">
              {criticalViolations} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">
              Overall compliance rating
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Events</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.length}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-4">
          <PolicyManagement 
            policies={policies}
            onToggle={togglePolicy}
            onEdit={setSelectedPolicy}
          />
        </TabsContent>

        <TabsContent value="violations" className="space-y-4">
          <ViolationManagement 
            violations={violations}
            onResolve={resolveViolation}
          />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <ComplianceManagement frameworks={frameworks} />
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <AuditTrail logs={auditLogs} />
        </TabsContent>
      </Tabs>

      {/* Create Policy Dialog */}
      <CreatePolicyDialog
        isOpen={isCreatingPolicy}
        onClose={() => setIsCreatingPolicy(false)}
        onCreate={createPolicy}
      />

      {/* Edit Policy Dialog */}
      {selectedPolicy && (
        <EditPolicyDialog
          policy={selectedPolicy}
          isOpen={!!selectedPolicy}
          onClose={() => setSelectedPolicy(null)}
          onSave={fetchGovernanceData}
        />
      )}
    </div>
  );
}

function PolicyManagement({ policies, onToggle, onEdit }: {
  policies: GovernancePolicy[];
  onToggle: (policyId: string, isActive: boolean) => void;
  onEdit: (policy: GovernancePolicy) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {policies.map((policy) => (
        <PolicyCard
          key={policy.id}
          policy={policy}
          onToggle={onToggle}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

function PolicyCard({ policy, onToggle, onEdit }: {
  policy: GovernancePolicy;
  onToggle: (policyId: string, isActive: boolean) => void;
  onEdit: (policy: GovernancePolicy) => void;
}) {
  const PolicyIcon = policyTypes[policy.policyType].icon;
  
  const enforcementColors = {
    block: 'text-red-600 bg-red-50',
    warn: 'text-yellow-600 bg-yellow-50',
    log: 'text-blue-600 bg-blue-50',
    escalate: 'text-purple-600 bg-purple-50'
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PolicyIcon className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-lg">{policy.name}</CardTitle>
          </div>
          <Switch
            checked={policy.isActive}
            onCheckedChange={(checked) => onToggle(policy.id, checked)}
          />
        </div>
        <CardDescription>{policy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Policy Type and Scope */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Type:</span>
            <Badge variant="outline">
              {policyTypes[policy.policyType].label}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Scope:</span>
            <Badge variant="outline" className="capitalize">
              {policy.scope}
              {policy.scopeName && ` • ${policy.scopeName}`}
            </Badge>
          </div>

          {/* Enforcement */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Enforcement:</span>
            <Badge className={`${enforcementColors[policy.enforcement]} capitalize`}>
              {policy.enforcement}
            </Badge>
          </div>

          {/* Rules Count */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Rules:</span>
            <span className="font-medium">{policy.rules.length}</span>
          </div>

          {/* Violations */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Violations:</span>
            <Badge variant={policy.violations > 0 ? "destructive" : "secondary"}>
              {policy.violations}
            </Badge>
          </div>

          {/* Last Violation */}
          {policy.lastViolation && (
            <div className="text-xs text-muted-foreground">
              Last violation: {new Date(policy.lastViolation).toLocaleDateString()}
            </div>
          )}

          {/* Actions */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(policy)}
            className="w-full"
          >
            <Edit className="mr-1 h-3 w-3" />
            Edit Policy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ViolationManagement({ violations, onResolve }: {
  violations: PolicyViolation[];
  onResolve: (violationId: string) => void;
}) {
  const unresolvedViolations = violations.filter(v => !v.isResolved);
  const resolvedViolations = violations.filter(v => v.isResolved);

  return (
    <div className="space-y-4">
      {/* Unresolved Violations */}
      <Card>
        <CardHeader>
          <CardTitle>Unresolved Violations ({unresolvedViolations.length})</CardTitle>
          <CardDescription>Violations requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          {unresolvedViolations.length > 0 ? (
            <div className="space-y-3">
              {unresolvedViolations.map((violation) => (
                <ViolationCard
                  key={violation.id}
                  violation={violation}
                  onResolve={onResolve}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="mx-auto h-8 w-8 mb-2 text-green-500" />
              <div>No unresolved violations</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Resolved Violations */}
      {resolvedViolations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Resolved ({resolvedViolations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {resolvedViolations.slice(0, 10).map((violation) => (
                <ViolationCard
                  key={violation.id}
                  violation={violation}
                  onResolve={onResolve}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ViolationCard({ violation, onResolve }: {
  violation: PolicyViolation;
  onResolve: (violationId: string) => void;
}) {
  const severityColors = {
    low: 'text-blue-600 bg-blue-50 border-blue-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    high: 'text-orange-600 bg-orange-50 border-orange-200',
    critical: 'text-red-600 bg-red-50 border-red-200'
  };

  const actionColors = {
    blocked: 'text-red-600 bg-red-50',
    warned: 'text-yellow-600 bg-yellow-50',
    logged: 'text-blue-600 bg-blue-50',
    escalated: 'text-purple-600 bg-purple-50'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 border rounded-lg ${violation.isResolved ? 'opacity-60' : ''} ${severityColors[violation.severity]}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Badge className={severityColors[violation.severity]}>
              {violation.severity}
            </Badge>
            <Badge className={actionColors[violation.action]}>
              {violation.action}
            </Badge>
            {violation.isResolved && (
              <Badge variant="outline">
                <CheckCircle className="h-3 w-3 mr-1" />
                Resolved
              </Badge>
            )}
          </div>
          
          <div className="font-medium mb-1">{violation.policyName}</div>
          <div className="text-sm mb-2">{violation.description}</div>
          
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            {violation.agentName && <span>Agent: {violation.agentName}</span>}
            {violation.userName && <span>User: {violation.userName}</span>}
            <span>{new Date(violation.createdAt).toLocaleString()}</span>
          </div>
          
          {violation.content && (
            <div className="mt-2 p-2 bg-background/50 rounded text-xs">
              <strong>Content:</strong> {violation.content.substring(0, 200)}...
            </div>
          )}
        </div>
        
        {!violation.isResolved && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onResolve(violation.id)}
          >
            Resolve
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function ComplianceManagement({ frameworks }: { frameworks: ComplianceFramework[] }) {
  return (
    <div className="space-y-4">
      {complianceFrameworks.map((framework) => (
        <ComplianceFrameworkCard key={framework.id} framework={framework} />
      ))}
    </div>
  );
}

function ComplianceFrameworkCard({ framework }: { framework: any }) {
  const compliantRequirements = framework.requirements.filter((req: any) => req.status === 'met').length;
  const compliancePercentage = (compliantRequirements / framework.requirements.length) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{framework.name}</CardTitle>
            <CardDescription>{framework.description}</CardDescription>
          </div>
          <Badge variant={compliancePercentage >= 90 ? 'default' : compliancePercentage >= 70 ? 'secondary' : 'destructive'}>
            {compliancePercentage.toFixed(0)}% Compliant
          </Badge>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Compliance Progress</span>
            <span>{compliantRequirements} / {framework.requirements.length} requirements</span>
          </div>
          <Progress value={compliancePercentage} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {framework.requirements.map((requirement: any) => (
            <RequirementCard key={requirement.id} requirement={requirement} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RequirementCard({ requirement }: { requirement: any }) {
  const statusConfig = {
    met: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    partial: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    not_met: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    not_applicable: { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-50' }
  };

  const config = statusConfig[requirement.status || 'not_met'];
  const Icon = config.icon;

  return (
    <div className={`p-3 border rounded ${config.bg}`}>
      <div className="flex items-start space-x-3">
        <Icon className={`h-4 w-4 mt-0.5 ${config.color}`} />
        <div className="flex-1">
          <div className="font-medium">{requirement.title}</div>
          <div className="text-sm text-muted-foreground">{requirement.description}</div>
          {requirement.status === 'not_met' && requirement.remediation && (
            <div className="text-xs text-red-600 mt-1">
              <strong>Remediation needed:</strong> {requirement.remediation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AuditTrail({ logs }: { logs: AuditLog[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Trail</CardTitle>
        <CardDescription>Recent system events and activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {logs.map((log) => (
            <AuditLogCard key={log.id} log={log} />
          ))}
          {logs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Eye className="mx-auto h-8 w-8 mb-2" />
              <div>No audit logs available</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AuditLogCard({ log }: { log: AuditLog }) {
  const eventTypeColors = {
    policy_created: 'text-green-600 bg-green-50',
    policy_updated: 'text-blue-600 bg-blue-50',
    violation_detected: 'text-red-600 bg-red-50',
    access_granted: 'text-purple-600 bg-purple-50',
    data_accessed: 'text-yellow-600 bg-yellow-50'
  };

  return (
    <div className="flex items-start space-x-3 p-3 border rounded">
      <div className={`px-2 py-1 rounded text-xs ${eventTypeColors[log.eventType]}`}>
        {log.eventType.replace('_', ' ').toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="text-sm">{log.description}</div>
        <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
          {log.userName && <span>User: {log.userName}</span>}
          {log.agentName && <span>Agent: {log.agentName}</span>}
          <span>{new Date(log.timestamp).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

// Placeholder dialog components
function CreatePolicyDialog({ isOpen, onClose, onCreate }: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (policy: any) => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Governance Policy</DialogTitle>
          <DialogDescription>Set up a new policy to govern AI behavior</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground">Policy creation form would go here...</p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { onCreate({}); onClose(); }}>Create Policy</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditPolicyDialog({ policy, isOpen, onClose, onSave }: {
  policy: GovernancePolicy;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Policy</DialogTitle>
          <DialogDescription>Modify policy settings and rules</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground">Policy editing form for {policy.name} would go here...</p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { onSave(); onClose(); }}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}