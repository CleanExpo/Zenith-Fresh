/**
 * Enterprise Billing & Subscription Management Dashboard
 * Fortune 500-grade comprehensive billing system with full compliance and reporting
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Calendar, DateRange } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Users,
  Calendar as CalendarIcon,
  Download,
  FileText,
  Send,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Pause,
  Play,
  RotateCcw,
  Globe,
  Calculator,
  Shield,
  Zap,
  Building,
  Mail,
  Phone,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  Search,
  RefreshCw,
  ExternalLink,
  PieChart,
  Activity,
  Target,
  Percent,
  Wallet,
  Receipt,
  BellRing,
  Archive
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { toast } from 'sonner';

// Types
interface Subscription {
  id: string;
  planId: string;
  planName: string;
  planTier: string;
  status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'PAUSED';
  amount: number;
  currency: string;
  billingInterval: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
  contractId?: string;
  customPricing?: any;
  usage: Record<string, number>;
  usageLimit: Record<string, number>;
}

interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'UNCOLLECTIBLE';
  dueDate?: Date;
  paidAt?: Date;
  createdAt: Date;
  purchaseOrder?: string;
  taxAmount?: number;
  hostedInvoiceUrl?: string;
  invoicePdfUrl?: string;
  lineItems: InvoiceLineItem[];
}

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
  periodStart?: Date;
  periodEnd?: Date;
}

interface PaymentMethod {
  id: string;
  type: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  isActive: boolean;
}

interface RevenueMetrics {
  totalRevenue: number;
  recurringRevenue: number;
  oneTimeRevenue: number;
  newCustomers: number;
  totalCustomers: number;
  churnRate: number;
  averageRevenuePerUser: number;
  planMetrics: Record<string, number>;
}

interface UsageMetric {
  metricName: string;
  current: number;
  limit: number;
  percentage: number;
  trend: number;
}

interface BillingDashboardProps {
  userId?: string;
  isAdmin?: boolean;
}

export default function EnterpriseBillingDashboard({ userId, isAdmin = false }: BillingDashboardProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(null);
  const [usageMetrics, setUsageMetrics] = useState<UsageMetric[]>([]);
  
  // Filter states
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [invoiceFilter, setInvoiceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showPaymentMethodDialog, setShowPaymentMethodDialog] = useState(false);
  const [showUsageDialog, setShowUsageDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Fetch billing data
  const fetchBillingData = useCallback(async () => {
    try {
      setLoading(true);
      
      const endpoints = [
        '/api/billing/subscription',
        '/api/billing/invoices',
        '/api/billing/payment-methods',
        '/api/billing/usage',
        ...(isAdmin ? ['/api/billing/revenue-metrics'] : [])
      ];

      const responses = await Promise.all(
        endpoints.map(endpoint => fetch(endpoint).then(res => res.json()))
      );

      const [subscriptionData, invoicesData, paymentMethodsData, usageData, revenueData] = responses;

      setSubscription(subscriptionData.subscription);
      setInvoices(invoicesData.invoices || []);
      setPaymentMethods(paymentMethodsData.paymentMethods || []);
      setUsageMetrics(usageData.usage || []);
      
      if (isAdmin && revenueData) {
        setRevenueMetrics(revenueData.metrics);
      }
      
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  // Refresh data
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await fetchBillingData();
    setRefreshing(false);
    toast.success('Billing data refreshed');
  }, [fetchBillingData]);

  // Load data on mount
  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    let filtered = invoices;

    // Status filter
    if (invoiceFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status.toLowerCase() === invoiceFilter);
    }

    // Date range filter
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter(invoice =>
        isWithinInterval(invoice.createdAt, { start: dateRange.from!, end: dateRange.to! })
      );
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(invoice =>
        invoice.number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.purchaseOrder?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [invoices, invoiceFilter, dateRange, searchQuery]);

  // Format currency
  const formatCurrency = useCallback((amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2
    }).format(amount / 100);
  }, []);

  // Get status color
  const getStatusColor = useCallback((status: string) => {
    const colors = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'TRIALING': 'bg-blue-100 text-blue-800',
      'PAST_DUE': 'bg-red-100 text-red-800',
      'CANCELED': 'bg-gray-100 text-gray-800',
      'PAUSED': 'bg-yellow-100 text-yellow-800',
      'PAID': 'bg-green-100 text-green-800',
      'OPEN': 'bg-blue-100 text-blue-800',
      'DRAFT': 'bg-gray-100 text-gray-800',
      'VOID': 'bg-red-100 text-red-800',
      'UNCOLLECTIBLE': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }, []);

  // Get status icon
  const getStatusIcon = useCallback((status: string) => {
    const icons = {
      'ACTIVE': CheckCircle,
      'TRIALING': Clock,
      'PAST_DUE': AlertTriangle,
      'CANCELED': XCircle,
      'PAUSED': Pause,
      'PAID': CheckCircle,
      'OPEN': Clock,
      'DRAFT': FileText,
      'VOID': XCircle,
      'UNCOLLECTIBLE': AlertTriangle
    };
    const Icon = icons[status as keyof typeof icons] || Clock;
    return <Icon className="h-4 w-4" />;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enterprise Billing</h1>
          <p className="text-gray-600 mt-1">Comprehensive billing and subscription management</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {isAdmin && (
            <Button size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          )}
        </div>
      </div>

      {/* Current Subscription Overview */}
      {subscription && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Subscription
              </CardTitle>
              <Badge className={getStatusColor(subscription.status)}>
                {getStatusIcon(subscription.status)}
                <span className="ml-1">{subscription.status}</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Plan</p>
                <p className="text-2xl font-bold">{subscription.planName}</p>
                <p className="text-sm text-gray-600">{subscription.planTier} Tier</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Amount</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(subscription.amount, subscription.currency)}
                </p>
                <p className="text-sm text-gray-600">
                  per {subscription.billingInterval.toLowerCase()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Current Period</p>
                <p className="text-lg font-semibold">
                  {format(subscription.currentPeriodStart, 'MMM dd')} - {format(subscription.currentPeriodEnd, 'MMM dd, yyyy')}
                </p>
                {subscription.trialEnd && (
                  <p className="text-sm text-blue-600">
                    Trial ends {format(subscription.trialEnd, 'MMM dd, yyyy')}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Auto-renewal</p>
                <p className="text-lg font-semibold">
                  {subscription.cancelAtPeriodEnd ? 'Disabled' : 'Enabled'}
                </p>
                {subscription.cancelAtPeriodEnd && (
                  <p className="text-sm text-red-600">
                    Cancels at period end
                  </p>
                )}
              </div>
            </div>

            {/* Usage Metrics */}
            {usageMetrics.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-lg font-semibold mb-4">Usage This Period</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {usageMetrics.map((metric) => (
                    <div key={metric.metricName} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{metric.metricName.replace('_', ' ')}</span>
                        <span className="text-sm text-gray-600">
                          {metric.current.toLocaleString()} / {metric.limit === -1 ? '∞' : metric.limit.toLocaleString()}
                        </span>
                      </div>
                      <Progress 
                        value={metric.limit === -1 ? 0 : metric.percentage} 
                        className="h-2"
                      />
                      {metric.trend !== 0 && (
                        <div className="flex items-center text-xs">
                          {metric.trend > 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                          )}
                          <span className={metric.trend > 0 ? 'text-green-600' : 'text-red-600'}>
                            {Math.abs(metric.trend)}% vs last period
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          {isAdmin && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Spent</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(
                        invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0)
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Receipt className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Invoices</p>
                    <p className="text-2xl font-bold">{invoices.length}</p>
                    <p className="text-xs text-gray-600">
                      {invoices.filter(i => i.status === 'OPEN').length} pending
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CreditCard className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Payment Methods</p>
                    <p className="text-2xl font-bold">{paymentMethods.length}</p>
                    <p className="text-xs text-gray-600">
                      {paymentMethods.filter(p => p.isDefault).length} default
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Account Status</p>
                    <p className="text-lg font-bold text-green-600">Active</p>
                    <p className="text-xs text-gray-600">
                      Since {subscription && format(subscription.currentPeriodStart, 'MMM yyyy')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Invoices */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices.slice(0, 5).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(invoice.status)}
                      </div>
                      <div>
                        <p className="font-medium">{invoice.number}</p>
                        <p className="text-sm text-gray-600">
                          {format(invoice.createdAt, 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </p>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {invoices.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No invoices found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search invoices..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={invoiceFilter} onValueChange={setInvoiceFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="void">Void</SelectItem>
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={(date: Date | DateRange | undefined) => {
                        if (!date) {
                          setDateRange({ from: undefined, to: undefined })
                        } else if (date instanceof Date) {
                          // Single date selected, treat as range start
                          setDateRange({ from: date, to: undefined })
                        } else {
                          // DateRange selected
                          setDateRange(date)
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          {/* Invoices Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Invoices ({filteredInvoices.length})</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invoice.number}</p>
                          {invoice.purchaseOrder && (
                            <p className="text-sm text-gray-600">PO: {invoice.purchaseOrder}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(invoice.createdAt, 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {formatCurrency(invoice.amount, invoice.currency)}
                          </p>
                          {invoice.taxAmount && (
                            <p className="text-sm text-gray-600">
                              Tax: {formatCurrency(invoice.taxAmount, invoice.currency)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.status)}>
                          {getStatusIcon(invoice.status)}
                          <span className="ml-1">{invoice.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invoice.dueDate ? format(invoice.dueDate, 'MMM dd, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowInvoiceDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {invoice.invoicePdfUrl && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={invoice.invoicePdfUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          {invoice.hostedInvoiceUrl && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredInvoices.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No invoices found matching your criteria
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payment Methods</CardTitle>
                <Button size="sm" onClick={() => setShowPaymentMethodDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <CreditCard className="h-8 w-8 text-gray-400" />
                      <div>
                        <p className="font-medium">
                          {method.brand?.toUpperCase()} •••• {method.last4}
                        </p>
                        <p className="text-sm text-gray-600">
                          Expires {method.expiryMonth}/{method.expiryYear}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {method.isDefault && (
                        <Badge>Default</Badge>
                      )}
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {paymentMethods.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No payment methods configured
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {usageMetrics.map((metric) => (
                  <Card key={metric.metricName}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold">
                          {metric.metricName.replace('_', ' ')}
                        </h4>
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {metric.current.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            of {metric.limit === -1 ? '∞' : metric.limit.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <Progress 
                        value={metric.limit === -1 ? 0 : metric.percentage} 
                        className="h-3 mb-2"
                      />
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {metric.limit === -1 ? 'Unlimited' : `${metric.percentage.toFixed(1)}% used`}
                        </span>
                        {metric.trend !== 0 && (
                          <span className={`flex items-center ${
                            metric.trend > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {metric.trend > 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {Math.abs(metric.trend)}%
                          </span>
                        )}
                      </div>
                      
                      {metric.percentage > 80 && metric.limit !== -1 && (
                        <Alert className="mt-4">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            You're approaching your usage limit. Consider upgrading your plan.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab (Admin Only) */}
        {isAdmin && (
          <TabsContent value="analytics" className="space-y-6">
            {revenueMetrics && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <DollarSign className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(revenueMetrics.totalRevenue)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <RotateCcw className="h-8 w-8 text-blue-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Recurring Revenue</p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(revenueMetrics.recurringRevenue)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Users className="h-8 w-8 text-purple-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Total Customers</p>
                          <p className="text-2xl font-bold">{revenueMetrics.totalCustomers}</p>
                          <p className="text-xs text-gray-600">
                            +{revenueMetrics.newCustomers} this period
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <TrendingDown className="h-8 w-8 text-red-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Churn Rate</p>
                          <p className="text-2xl font-bold">{revenueMetrics.churnRate.toFixed(1)}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Plan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(revenueMetrics.planMetrics).map(([plan, revenue]) => (
                        <div key={plan} className="flex items-center justify-between">
                          <span className="font-medium">{plan}</span>
                          <span className="text-lg font-bold">
                            {formatCurrency(revenue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        )}

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Email Notifications</h4>
                  <p className="text-sm text-gray-600">
                    Receive email notifications for billing events
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Auto-pay</h4>
                  <p className="text-sm text-gray-600">
                    Automatically pay invoices using default payment method
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Usage Alerts</h4>
                  <p className="text-sm text-gray-600">
                    Get notified when approaching usage limits
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subscription Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Modify Subscription
              </Button>
              
              <Button variant="outline" className="w-full">
                <Pause className="h-4 w-4 mr-2" />
                Pause Subscription
              </Button>
              
              <Button variant="destructive" className="w-full">
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Subscription
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invoice Detail Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Invoice Information</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Invoice Number:</dt>
                      <dd className="font-medium">{selectedInvoice.number}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Date:</dt>
                      <dd>{format(selectedInvoice.createdAt, 'MMM dd, yyyy')}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Due Date:</dt>
                      <dd>{selectedInvoice.dueDate ? format(selectedInvoice.dueDate, 'MMM dd, yyyy') : '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Status:</dt>
                      <dd>
                        <Badge className={getStatusColor(selectedInvoice.status)}>
                          {selectedInvoice.status}
                        </Badge>
                      </dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Amount Details</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Subtotal:</dt>
                      <dd>{formatCurrency(selectedInvoice.amount - (selectedInvoice.taxAmount || 0), selectedInvoice.currency)}</dd>
                    </div>
                    {selectedInvoice.taxAmount && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Tax:</dt>
                        <dd>{formatCurrency(selectedInvoice.taxAmount, selectedInvoice.currency)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold">
                      <dt>Total:</dt>
                      <dd>{formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Line Items</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.lineItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.unitAmount, selectedInvoice.currency)}</TableCell>
                        <TableCell>{formatCurrency(item.amount, selectedInvoice.currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end space-x-2">
                {selectedInvoice.invoicePdfUrl && (
                  <Button variant="outline" asChild>
                    <a href={selectedInvoice.invoicePdfUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </a>
                  </Button>
                )}
                {selectedInvoice.hostedInvoiceUrl && (
                  <Button asChild>
                    <a href={selectedInvoice.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Invoice
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}