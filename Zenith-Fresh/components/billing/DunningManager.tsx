/**
 * Enterprise Payment Failure Handling & Dunning Management
 * Comprehensive automated payment recovery and customer retention system
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle,
  CreditCard,
  XCircle,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  Send,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Activity,
  Calendar,
  Filter,
  Search,
  Download,
  Archive,
  MessageSquare,
  Webhook,
  Zap,
  Shield,
  Building,
  User,
  FileText,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { format, addDays, subDays, isAfter, isBefore, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

// Types
interface PaymentFailure {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  
  // Failure details
  failureCode: string;
  failureMessage: string;
  failureReason: 'insufficient_funds' | 'card_declined' | 'card_expired' | 'authentication_required' | 'processing_error' | 'other';
  attemptCount: number;
  lastAttemptAt: Date;
  nextRetryAt?: Date;
  
  // Customer communication
  customerNotified: boolean;
  lastNotificationAt?: Date;
  preferredContactMethod: 'email' | 'phone' | 'both';
  
  // Dunning status
  dunningStage: 'initial' | 'reminder' | 'final_notice' | 'collections' | 'suspended' | 'resolved';
  campaignId?: string;
  
  // Resolution
  isResolved: boolean;
  resolvedAt?: Date;
  resolutionMethod?: 'payment_succeeded' | 'payment_method_updated' | 'manual_resolution' | 'written_off';
  
  createdAt: Date;
  updatedAt: Date;
}

interface DunningCampaign {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  
  // Campaign settings
  triggerConditions: {
    failureTypes: string[];
    minimumAmount?: number;
    customerTiers?: string[];
    excludeRecentCustomers?: boolean;
  };
  
  // Dunning steps
  steps: DunningStep[];
  
  // Success metrics
  successRate: number;
  recoveryAmount: number;
  totalAttempts: number;
  activeFailures: number;
  
  createdAt: Date;
  updatedAt: Date;
}

interface DunningStep {
  id: string;
  stepNumber: number;
  name: string;
  delayDays: number;
  
  // Action configuration
  actionType: 'email' | 'sms' | 'phone_call' | 'letter' | 'webhook' | 'pause_service' | 'cancel_subscription';
  actionConfig: {
    templateId?: string;
    subject?: string;
    content?: string;
    webhookUrl?: string;
    phoneScript?: string;
    gracePeriodDays?: number;
  };
  
  // Conditions
  skipConditions?: {
    skipIfPaid?: boolean;
    skipIfContactedRecently?: boolean;
    skipForVipCustomers?: boolean;
  };
  
  // Success tracking
  executionCount: number;
  successCount: number;
  responseRate: number;
}

interface DunningAttempt {
  id: string;
  campaignId: string;
  failureId: string;
  stepId: string;
  
  // Execution details
  status: 'scheduled' | 'executing' | 'completed' | 'failed' | 'skipped';
  scheduledAt: Date;
  executedAt?: Date;
  
  // Results
  success: boolean;
  errorMessage?: string;
  responseReceived: boolean;
  responseDetails?: any;
  
  // Follow-up
  nextStepScheduled?: boolean;
  nextStepAt?: Date;
  
  createdAt: Date;
}

interface DunningTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'letter';
  subject?: string;
  content: string;
  
  // Template variables
  variables: string[];
  
  // A/B testing
  isControl: boolean;
  variant?: string;
  performanceMetrics: {
    openRate?: number;
    clickRate?: number;
    responseRate?: number;
    conversionRate?: number;
  };
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface DunningManagerProps {
  userId?: string;
  isAdmin?: boolean;
}

export default function DunningManager({ userId, isAdmin = false }: DunningManagerProps) {
  const [activeTab, setActiveTab] = useState('failures');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [paymentFailures, setPaymentFailures] = useState<PaymentFailure[]>([]);
  const [dunningCampaigns, setDunningCampaigns] = useState<DunningCampaign[]>([]);
  const [dunningAttempts, setDunningAttempts] = useState<DunningAttempt[]>([]);
  const [dunningTemplates, setDunningTemplates] = useState<DunningTemplate[]>([]);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showFailureDialog, setShowFailureDialog] = useState(false);
  const [selectedFailure, setSelectedFailure] = useState<PaymentFailure | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<DunningCampaign | null>(null);

  // Sample data (in real app, this would come from API)
  const samplePaymentFailures: PaymentFailure[] = [
    {
      id: '1',
      invoiceId: 'inv_1',
      invoiceNumber: 'ZEN-2024-001',
      customerId: 'cus_1',
      customerName: 'Acme Corp',
      customerEmail: 'billing@acme.com',
      amount: 99900,
      currency: 'usd',
      failureCode: 'insufficient_funds',
      failureMessage: 'Your card has insufficient funds',
      failureReason: 'insufficient_funds',
      attemptCount: 2,
      lastAttemptAt: new Date('2024-01-20'),
      nextRetryAt: new Date('2024-01-25'),
      customerNotified: true,
      lastNotificationAt: new Date('2024-01-20'),
      preferredContactMethod: 'email',
      dunningStage: 'reminder',
      campaignId: 'camp_1',
      isResolved: false,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20')
    },
    {
      id: '2',
      invoiceId: 'inv_2',
      invoiceNumber: 'ZEN-2024-002',
      customerId: 'cus_2',
      customerName: 'TechStart Inc',
      customerEmail: 'finance@techstart.io',
      amount: 199900,
      currency: 'usd',
      failureCode: 'card_declined',
      failureMessage: 'Your card was declined',
      failureReason: 'card_declined',
      attemptCount: 1,
      lastAttemptAt: new Date('2024-01-22'),
      customerNotified: true,
      lastNotificationAt: new Date('2024-01-22'),
      preferredContactMethod: 'email',
      dunningStage: 'initial',
      campaignId: 'camp_1',
      isResolved: false,
      createdAt: new Date('2024-01-22'),
      updatedAt: new Date('2024-01-22')
    }
  ];

  const sampleDunningCampaigns: DunningCampaign[] = [
    {
      id: 'camp_1',
      name: 'Standard Payment Recovery',
      description: 'Default dunning campaign for failed payments',
      isActive: true,
      triggerConditions: {
        failureTypes: ['insufficient_funds', 'card_declined', 'card_expired'],
        minimumAmount: 1000, // $10.00
        customerTiers: ['starter', 'professional', 'business'],
        excludeRecentCustomers: true
      },
      steps: [
        {
          id: 'step_1',
          stepNumber: 1,
          name: 'Immediate Notification',
          delayDays: 0,
          actionType: 'email',
          actionConfig: {
            templateId: 'template_1',
            subject: 'Payment Failed - Action Required',
            content: 'Your recent payment failed. Please update your payment method.'
          },
          executionCount: 156,
          successCount: 142,
          responseRate: 18.5
        },
        {
          id: 'step_2',
          stepNumber: 2,
          name: 'First Reminder',
          delayDays: 3,
          actionType: 'email',
          actionConfig: {
            templateId: 'template_2',
            subject: 'Payment Reminder - Update Required',
            content: 'We still haven\'t received your payment. Please update your payment method to avoid service interruption.'
          },
          executionCount: 89,
          successCount: 67,
          responseRate: 24.7
        },
        {
          id: 'step_3',
          stepNumber: 3,
          name: 'Final Notice',
          delayDays: 7,
          actionType: 'email',
          actionConfig: {
            templateId: 'template_3',
            subject: 'Final Notice - Service Will Be Suspended',
            content: 'This is your final notice. Please update your payment method within 24 hours to avoid service suspension.'
          },
          executionCount: 45,
          successCount: 28,
          responseRate: 31.1
        },
        {
          id: 'step_4',
          stepNumber: 4,
          name: 'Service Suspension',
          delayDays: 10,
          actionType: 'pause_service',
          actionConfig: {
            gracePeriodDays: 7
          },
          executionCount: 23,
          successCount: 12,
          responseRate: 42.9
        }
      ],
      successRate: 67.3,
      recoveryAmount: 2547890,
      totalAttempts: 324,
      activeFailures: 8,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-20')
    }
  ];

  // Load data
  useEffect(() => {
    setPaymentFailures(samplePaymentFailures);
    setDunningCampaigns(sampleDunningCampaigns);
    setLoading(false);
  }, []);

  // Filter payment failures
  const filteredFailures = useMemo(() => {
    let filtered = paymentFailures;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(failure => 
        statusFilter === 'resolved' ? failure.isResolved : !failure.isResolved
      );
    }

    if (stageFilter !== 'all') {
      filtered = filtered.filter(failure => failure.dunningStage === stageFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(failure =>
        failure.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        failure.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        failure.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [paymentFailures, statusFilter, stageFilter, searchQuery]);

  // Calculate statistics
  const dunningStats = useMemo(() => {
    const totalFailures = paymentFailures.length;
    const activeFailures = paymentFailures.filter(f => !f.isResolved).length;
    const resolvedFailures = paymentFailures.filter(f => f.isResolved).length;
    const totalAmount = paymentFailures.reduce((sum, f) => sum + f.amount, 0);
    const recoveredAmount = paymentFailures
      .filter(f => f.isResolved && f.resolutionMethod === 'payment_succeeded')
      .reduce((sum, f) => sum + f.amount, 0);
    
    const averageResolutionTime = paymentFailures
      .filter(f => f.isResolved && f.resolvedAt)
      .reduce((sum, f) => {
        const days = differenceInDays(f.resolvedAt!, f.createdAt);
        return sum + days;
      }, 0) / resolvedFailures || 0;

    const successRate = totalFailures > 0 ? (resolvedFailures / totalFailures) * 100 : 0;

    return {
      totalFailures,
      activeFailures,
      resolvedFailures,
      totalAmount,
      recoveredAmount,
      averageResolutionTime,
      successRate
    };
  }, [paymentFailures]);

  // Format currency
  const formatCurrency = useCallback((amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2
    }).format(amount / 100);
  }, []);

  // Get failure reason color
  const getFailureReasonColor = useCallback((reason: string) => {
    const colors = {
      'insufficient_funds': 'bg-red-100 text-red-800',
      'card_declined': 'bg-orange-100 text-orange-800',
      'card_expired': 'bg-yellow-100 text-yellow-800',
      'authentication_required': 'bg-blue-100 text-blue-800',
      'processing_error': 'bg-purple-100 text-purple-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[reason as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }, []);

  // Get dunning stage color
  const getDunningStageColor = useCallback((stage: string) => {
    const colors = {
      'initial': 'bg-blue-100 text-blue-800',
      'reminder': 'bg-yellow-100 text-yellow-800',
      'final_notice': 'bg-orange-100 text-orange-800',
      'collections': 'bg-red-100 text-red-800',
      'suspended': 'bg-red-100 text-red-800',
      'resolved': 'bg-green-100 text-green-800'
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dunning data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Recovery</h1>
          <p className="text-gray-600 mt-1">Manage payment failures and dunning campaigns</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setRefreshing(true)}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCampaignDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Failures</p>
                <p className="text-2xl font-bold">{dunningStats.activeFailures}</p>
                <p className="text-xs text-gray-600">
                  of {dunningStats.totalFailures} total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">At Risk Amount</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(dunningStats.totalAmount - dunningStats.recoveredAmount)}
                </p>
                <p className="text-xs text-gray-600">
                  {formatCurrency(dunningStats.recoveredAmount)} recovered
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Success Rate</p>
                <p className="text-2xl font-bold">{dunningStats.successRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-600">
                  avg resolution: {dunningStats.averageResolutionTime.toFixed(1)} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Campaigns</p>
                <p className="text-2xl font-bold">
                  {dunningCampaigns.filter(c => c.isActive).length}
                </p>
                <p className="text-xs text-gray-600">
                  {dunningCampaigns.length} total campaigns
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="failures">Payment Failures</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Payment Failures Tab */}
        <TabsContent value="failures" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search failures..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="initial">Initial</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="final_notice">Final Notice</SelectItem>
                    <SelectItem value="collections">Collections</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Payment Failures Table */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Failures ({filteredFailures.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Failure Reason</TableHead>
                    <TableHead>Dunning Stage</TableHead>
                    <TableHead>Last Attempt</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFailures.map((failure) => (
                    <TableRow key={failure.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{failure.customerName}</p>
                          <p className="text-sm text-gray-600">{failure.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{failure.invoiceNumber}</p>
                          <p className="text-sm text-gray-600">
                            Attempt #{failure.attemptCount}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {formatCurrency(failure.amount, failure.currency)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge className={getFailureReasonColor(failure.failureReason)}>
                          {failure.failureReason.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getDunningStageColor(failure.dunningStage)}>
                          {failure.dunningStage.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">
                            {format(failure.lastAttemptAt, 'MMM dd, yyyy')}
                          </p>
                          {failure.nextRetryAt && (
                            <p className="text-xs text-gray-600">
                              Next: {format(failure.nextRetryAt, 'MMM dd')}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedFailure(failure);
                              setShowFailureDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredFailures.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No payment failures found matching your criteria
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {dunningCampaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h3 className="text-lg font-semibold">{campaign.name}</h3>
                        <p className="text-sm text-gray-600">{campaign.description}</p>
                      </div>
                      <Badge variant={campaign.isActive ? 'default' : 'secondary'}>
                        {campaign.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={campaign.isActive} />
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Success Rate</p>
                      <p className="text-2xl font-bold text-green-600">
                        {campaign.successRate.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Recovery Amount</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(campaign.recoveryAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Attempts</p>
                      <p className="text-2xl font-bold">{campaign.totalAttempts}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Active Failures</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {campaign.activeFailures}
                      </p>
                    </div>
                  </div>

                  {/* Campaign Steps */}
                  <div>
                    <h4 className="font-medium mb-4">Dunning Steps</h4>
                    <div className="space-y-3">
                      {campaign.steps.map((step, index) => (
                        <div key={step.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                              {step.stepNumber}
                            </div>
                            <div>
                              <p className="font-medium">{step.name}</p>
                              <p className="text-sm text-gray-600">
                                {step.delayDays === 0 ? 'Immediate' : `After ${step.delayDays} days`} • 
                                {step.actionType.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {step.responseRate.toFixed(1)}% response rate
                            </p>
                            <p className="text-xs text-gray-600">
                              {step.successCount}/{step.executionCount} executions
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Dunning Templates</CardTitle>
                <Button size="sm" onClick={() => setShowTemplateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                No dunning templates configured yet
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recovery Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Success Rate</span>
                    <span className="text-lg font-bold text-green-600">
                      {dunningStats.successRate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={dunningStats.successRate} className="h-2" />
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-medium">Amount Recovered</span>
                    <span className="text-lg font-bold">
                      {formatCurrency(dunningStats.recoveredAmount)}
                    </span>
                  </div>
                  <Progress 
                    value={(dunningStats.recoveredAmount / dunningStats.totalAmount) * 100} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Failure Reasons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { reason: 'Insufficient Funds', count: 45, percentage: 42.1 },
                    { reason: 'Card Declined', count: 32, percentage: 29.9 },
                    { reason: 'Card Expired', count: 18, percentage: 16.8 },
                    { reason: 'Authentication Required', count: 8, percentage: 7.5 },
                    { reason: 'Processing Error', count: 4, percentage: 3.7 }
                  ].map((item) => (
                    <div key={item.reason} className="flex items-center justify-between">
                      <span className="text-sm">{item.reason}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dunning Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Auto-retry failed payments</h4>
                  <p className="text-sm text-gray-600">
                    Automatically retry failed payments after a delay
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Send customer notifications</h4>
                  <p className="text-sm text-gray-600">
                    Automatically notify customers of payment failures
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Suspend service for non-payment</h4>
                  <p className="text-sm text-gray-600">
                    Automatically suspend service after multiple failures
                  </p>
                </div>
                <Switch />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxRetries">Maximum Retry Attempts</Label>
                  <Input type="number" defaultValue="3" min="1" max="10" />
                </div>
                <div>
                  <Label htmlFor="retryDelay">Retry Delay (Days)</Label>
                  <Input type="number" defaultValue="3" min="1" max="30" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Failure Detail Dialog */}
      <Dialog open={showFailureDialog} onOpenChange={setShowFailureDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Failure Details</DialogTitle>
          </DialogHeader>
          {selectedFailure && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Customer Information</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Name:</dt>
                      <dd className="font-medium">{selectedFailure.customerName}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Email:</dt>
                      <dd>{selectedFailure.customerEmail}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Contact Method:</dt>
                      <dd>{selectedFailure.preferredContactMethod}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Failure Details</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Invoice:</dt>
                      <dd className="font-medium">{selectedFailure.invoiceNumber}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Amount:</dt>
                      <dd>{formatCurrency(selectedFailure.amount, selectedFailure.currency)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Reason:</dt>
                      <dd>
                        <Badge className={getFailureReasonColor(selectedFailure.failureReason)}>
                          {selectedFailure.failureReason.replace('_', ' ')}
                        </Badge>
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Attempts:</dt>
                      <dd>{selectedFailure.attemptCount}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Failure Message</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                  {selectedFailure.failureMessage}
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Dunning Progress</h4>
                <div className="flex items-center space-x-2">
                  <Badge className={getDunningStageColor(selectedFailure.dunningStage)}>
                    {selectedFailure.dunningStage.replace('_', ' ')}
                  </Badge>
                  {selectedFailure.customerNotified && (
                    <Badge variant="outline">Customer Notified</Badge>
                  )}
                </div>
                {selectedFailure.lastNotificationAt && (
                  <p className="text-xs text-gray-600 mt-1">
                    Last notification: {format(selectedFailure.lastNotificationAt, 'MMM dd, yyyy HH:mm')}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Reminder
                </Button>
                <Button variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retry Payment
                </Button>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Update Payment Method
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}