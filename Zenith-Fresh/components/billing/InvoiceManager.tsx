/**
 * Enterprise Invoice Generation & Automated Billing Manager
 * Comprehensive invoice management with automated billing and customization
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
import { Calendar, DateRange } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  FileText,
  Download,
  Send,
  Mail,
  Calendar as CalendarIcon,
  DollarSign,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Copy,
  RefreshCw,
  Settings,
  Filter,
  Search,
  ExternalLink,
  Printer,
  Archive,
  RotateCcw,
  Building,
  User,
  MapPin,
  Phone,
  Globe,
  Calculator,
  Receipt,
  Percent,
  Zap,
  Target,
  TrendingUp,
  BarChart3,
  PieChart
} from 'lucide-react';
import { format, addDays, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { toast } from 'sonner';

// Types
interface Invoice {
  id: string;
  number: string;
  stripeInvoiceId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  subscriptionId?: string;
  
  // Invoice details
  status: 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'UNCOLLECTIBLE';
  amount: number;
  subtotal: number;
  taxAmount: number;
  currency: string;
  
  // Dates
  createdAt: Date;
  dueDate?: Date;
  paidAt?: Date;
  voidedAt?: Date;
  
  // Enterprise features
  purchaseOrder?: string;
  billingContact?: string;
  customFields?: Record<string, any>;
  
  // PDF and delivery
  invoicePdfUrl?: string;
  hostedInvoiceUrl?: string;
  emailedAt?: Date;
  
  // Payment tracking
  attemptCount: number;
  nextPaymentAttempt?: Date;
  
  // Line items
  lineItems: InvoiceLineItem[];
  
  // Metadata
  notes?: string;
  terms?: string;
  footer?: string;
}

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
  taxable: boolean;
  periodStart?: Date;
  periodEnd?: Date;
  metadata?: Record<string, any>;
}

interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  
  // Template configuration
  logoUrl?: string;
  primaryColor: string;
  fontFamily: string;
  
  // Business information
  companyName: string;
  companyAddress: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  taxId?: string;
  
  // Invoice settings
  includePaymentTerms: boolean;
  paymentTermsDays: number;
  includeNotes: boolean;
  defaultNotes?: string;
  includeFooter: boolean;
  defaultFooter?: string;
  
  // Field visibility
  showPurchaseOrder: boolean;
  showBillingContact: boolean;
  showProjectDetails: boolean;
  showTaxBreakdown: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  
  // Trigger conditions
  triggerType: 'subscription_cycle' | 'usage_threshold' | 'date_based' | 'manual';
  triggerConditions: Record<string, any>;
  
  // Actions
  actions: AutomationAction[];
  
  // Scheduling
  schedule?: {
    frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
    time?: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
  
  // Statistics
  executionCount: number;
  lastExecuted?: Date;
  nextExecution?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

interface AutomationAction {
  type: 'create_invoice' | 'send_invoice' | 'send_reminder' | 'update_subscription' | 'webhook';
  config: Record<string, any>;
  delayDays?: number;
}

interface InvoiceManagerProps {
  userId?: string;
  isAdmin?: boolean;
}

export default function InvoiceManager({ userId, isAdmin = false }: InvoiceManagerProps) {
  const [activeTab, setActiveTab] = useState('invoices');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  
  // Filter states
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [showCreateInvoiceDialog, setShowCreateInvoiceDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showAutomationDialog, setShowAutomationDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);
  
  // Form states
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    currency: 'usd',
    status: 'DRAFT',
    lineItems: [{
      id: '1',
      description: '',
      quantity: 1,
      unitAmount: 0,
      amount: 0,
      taxable: true
    }]
  });

  // Sample data (in real app, this would come from API)
  const sampleInvoices: Invoice[] = [
    {
      id: '1',
      number: 'ZEN-2024-001',
      stripeInvoiceId: 'in_1234567890',
      customerId: 'cus_1234567890',
      customerName: 'Acme Corporation',
      customerEmail: 'billing@acme.com',
      subscriptionId: 'sub_1234567890',
      status: 'PAID',
      amount: 150000, // $1,500.00
      subtotal: 130000,
      taxAmount: 20000,
      currency: 'usd',
      createdAt: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
      paidAt: new Date('2024-01-20'),
      purchaseOrder: 'PO-2024-001',
      billingContact: 'Jane Smith',
      invoicePdfUrl: '/invoices/ZEN-2024-001.pdf',
      hostedInvoiceUrl: 'https://invoice.stripe.com/i/acct_123/test_123',
      emailedAt: new Date('2024-01-15'),
      attemptCount: 1,
      lineItems: [
        {
          id: '1',
          description: 'Professional Plan - January 2024',
          quantity: 1,
          unitAmount: 99900,
          amount: 99900,
          taxable: true,
          periodStart: new Date('2024-01-01'),
          periodEnd: new Date('2024-01-31')
        },
        {
          id: '2',
          description: 'Additional API requests',
          quantity: 10000,
          unitAmount: 3,
          amount: 30100,
          taxable: true
        }
      ],
      notes: 'Thank you for your business!',
      terms: 'Payment due within 30 days'
    },
    {
      id: '2',
      number: 'ZEN-2024-002',
      stripeInvoiceId: 'in_2345678901',
      customerId: 'cus_2345678901',
      customerName: 'TechCorp Inc.',
      customerEmail: 'finance@techcorp.com',
      status: 'OPEN',
      amount: 250000, // $2,500.00
      subtotal: 220000,
      taxAmount: 30000,
      currency: 'usd',
      createdAt: new Date('2024-01-20'),
      dueDate: new Date('2024-02-20'),
      attemptCount: 0,
      lineItems: [
        {
          id: '1',
          description: 'Enterprise Plan - January 2024',
          quantity: 1,
          unitAmount: 199900,
          amount: 199900,
          taxable: true,
          periodStart: new Date('2024-01-01'),
          periodEnd: new Date('2024-01-31')
        },
        {
          id: '2',
          description: 'Setup fee',
          quantity: 1,
          unitAmount: 50000,
          amount: 50000,
          taxable: true
        }
      ]
    }
  ];

  // Load data
  useEffect(() => {
    setInvoices(sampleInvoices);
    setLoading(false);
  }, []);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    let filtered = invoices;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status.toLowerCase() === statusFilter);
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
        invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.purchaseOrder?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [invoices, statusFilter, dateRange, searchQuery]);

  // Invoice statistics
  const invoiceStats = useMemo(() => {
    const total = invoices.length;
    const paid = invoices.filter(i => i.status === 'PAID').length;
    const open = invoices.filter(i => i.status === 'OPEN').length;
    const overdue = invoices.filter(i => 
      i.status === 'OPEN' && i.dueDate && i.dueDate < new Date()
    ).length;
    
    const totalAmount = invoices.reduce((sum, i) => sum + i.amount, 0);
    const paidAmount = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0);
    const outstandingAmount = invoices.filter(i => i.status === 'OPEN').reduce((sum, i) => sum + i.amount, 0);
    
    return {
      total,
      paid,
      open,
      overdue,
      totalAmount,
      paidAmount,
      outstandingAmount
    };
  }, [invoices]);

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
      'DRAFT': 'bg-gray-100 text-gray-800',
      'OPEN': 'bg-blue-100 text-blue-800',
      'PAID': 'bg-green-100 text-green-800',
      'VOID': 'bg-red-100 text-red-800',
      'UNCOLLECTIBLE': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }, []);

  // Get status icon
  const getStatusIcon = useCallback((status: string) => {
    const icons = {
      'DRAFT': FileText,
      'OPEN': Clock,
      'PAID': CheckCircle,
      'VOID': XCircle,
      'UNCOLLECTIBLE': AlertTriangle
    };
    const Icon = icons[status as keyof typeof icons] || Clock;
    return <Icon className="h-4 w-4" />;
  }, []);

  // Add line item
  const addLineItem = useCallback(() => {
    const newLineItem: InvoiceLineItem = {
      id: Math.random().toString(),
      description: '',
      quantity: 1,
      unitAmount: 0,
      amount: 0,
      taxable: true
    };
    
    setNewInvoice(prev => ({
      ...prev,
      lineItems: [...(prev.lineItems || []), newLineItem]
    }));
  }, []);

  // Remove line item
  const removeLineItem = useCallback((itemId: string) => {
    setNewInvoice(prev => ({
      ...prev,
      lineItems: prev.lineItems?.filter(item => item.id !== itemId) || []
    }));
  }, []);

  // Update line item
  const updateLineItem = useCallback((itemId: string, updates: Partial<InvoiceLineItem>) => {
    setNewInvoice(prev => ({
      ...prev,
      lineItems: prev.lineItems?.map(item => 
        item.id === itemId 
          ? { ...item, ...updates, amount: (updates.quantity || item.quantity) * (updates.unitAmount || item.unitAmount) }
          : item
      ) || []
    }));
  }, []);

  // Calculate invoice totals
  const calculateTotals = useCallback((lineItems: InvoiceLineItem[]) => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxableAmount = lineItems.filter(item => item.taxable).reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = Math.round(taxableAmount * 0.08); // 8% tax rate
    const total = subtotal + taxAmount;
    
    return { subtotal, taxAmount, total };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
          <p className="text-gray-600 mt-1">Generate and manage invoices with automated billing</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setRefreshing(true)}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreateInvoiceDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Receipt className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Invoices</p>
                <p className="text-2xl font-bold">{invoiceStats.total}</p>
                <p className="text-xs text-gray-600">
                  {invoiceStats.paid} paid, {invoiceStats.open} open
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(invoiceStats.totalAmount)}</p>
                <p className="text-xs text-gray-600">
                  {formatCurrency(invoiceStats.paidAmount)} collected
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Outstanding</p>
                <p className="text-2xl font-bold">{formatCurrency(invoiceStats.outstandingAmount)}</p>
                <p className="text-xs text-gray-600">
                  {invoiceStats.open} open invoices
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Overdue</p>
                <p className="text-2xl font-bold">{invoiceStats.overdue}</p>
                <p className="text-xs text-gray-600">requiring attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

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
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
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
                      onSelect={(date: Date | any | undefined) => {
                        if (!date) {
                          setDateRange({ from: undefined, to: undefined })
                        } else if (date instanceof Date) {
                          setDateRange({ from: date, to: undefined })
                        } else {
                          setDateRange(date || { from: undefined, to: undefined })
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
              <CardTitle>Invoices ({filteredInvoices.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
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
                        <div>
                          <p className="font-medium">{invoice.customerName}</p>
                          <p className="text-sm text-gray-600">{invoice.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(invoice.createdAt, 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {invoice.dueDate ? (
                          <div>
                            <p>{format(invoice.dueDate, 'MMM dd, yyyy')}</p>
                            {invoice.status === 'OPEN' && invoice.dueDate < new Date() && (
                              <Badge variant="destructive" className="text-xs">Overdue</Badge>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {formatCurrency(invoice.amount, invoice.currency)}
                          </p>
                          {invoice.taxAmount > 0 && (
                            <p className="text-sm text-gray-600">
                              +{formatCurrency(invoice.taxAmount, invoice.currency)} tax
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
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {invoice.invoicePdfUrl && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={invoice.invoicePdfUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Send className="h-4 w-4" />
                          </Button>
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

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Invoice Templates</CardTitle>
                <Button size="sm" onClick={() => setShowTemplateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                No invoice templates configured yet
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Billing Automation</CardTitle>
                <Button size="sm" onClick={() => setShowAutomationDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                No automation rules configured yet
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="defaultCurrency">Default Currency</Label>
                  <Select defaultValue="usd">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD - US Dollar</SelectItem>
                      <SelectItem value="eur">EUR - Euro</SelectItem>
                      <SelectItem value="gbp">GBP - British Pound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="paymentTerms">Default Payment Terms (Days)</Label>
                  <Input type="number" defaultValue="30" />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Automation Settings</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">Auto-send invoices</h5>
                    <p className="text-sm text-gray-600">
                      Automatically send invoices when created
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">Payment reminders</h5>
                    <p className="text-sm text-gray-600">
                      Send automatic payment reminders for overdue invoices
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">Late fees</h5>
                    <p className="text-sm text-gray-600">
                      Automatically apply late fees to overdue invoices
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Invoice Dialog */}
      <Dialog open={showCreateInvoiceDialog} onOpenChange={setShowCreateInvoiceDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={newInvoice.customerName || ''}
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Customer or company name"
                />
              </div>
              
              <div>
                <Label htmlFor="customerEmail">Customer Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={newInvoice.customerEmail || ''}
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, customerEmail: e.target.value }))}
                  placeholder="customer@example.com"
                />
              </div>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newInvoice.dueDate ? format(newInvoice.dueDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setNewInvoice(prev => ({ 
                    ...prev, 
                    dueDate: e.target.value ? new Date(e.target.value) : undefined 
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  value={newInvoice.currency} 
                  onValueChange={(value) => setNewInvoice(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD</SelectItem>
                    <SelectItem value="eur">EUR</SelectItem>
                    <SelectItem value="gbp">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="purchaseOrder">Purchase Order</Label>
                <Input
                  id="purchaseOrder"
                  value={newInvoice.purchaseOrder || ''}
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, purchaseOrder: e.target.value }))}
                  placeholder="PO number (optional)"
                />
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>Line Items</Label>
                <Button size="sm" onClick={addLineItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
              
              <div className="space-y-4">
                {newInvoice.lineItems?.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <Label>Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                        placeholder="Item description"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, { quantity: parseInt(e.target.value) || 0 })}
                        min="1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Unit Price</Label>
                      <Input
                        type="number"
                        value={item.unitAmount / 100}
                        onChange={(e) => updateLineItem(item.id, { unitAmount: Math.round((parseFloat(e.target.value) || 0) * 100) })}
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Amount</Label>
                      <Input
                        value={formatCurrency(item.amount, newInvoice.currency)}
                        disabled
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeLineItem(item.id)}
                        disabled={newInvoice.lineItems?.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Invoice Totals */}
            {newInvoice.lineItems && newInvoice.lineItems.length > 0 && (
              <div className="border-t pt-4">
                {(() => {
                  const totals = calculateTotals(newInvoice.lineItems);
                  return (
                    <div className="space-y-2 text-right">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(totals.subtotal, newInvoice.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax (8%):</span>
                        <span>{formatCurrency(totals.taxAmount, newInvoice.currency)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>{formatCurrency(totals.total, newInvoice.currency)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newInvoice.notes || ''}
                onChange={(e) => setNewInvoice(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes or terms..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateInvoiceDialog(false)}>
                Cancel
              </Button>
              <Button variant="outline">
                Save as Draft
              </Button>
              <Button>
                Create & Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}