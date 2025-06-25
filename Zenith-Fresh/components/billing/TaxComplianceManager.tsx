/**
 * Enterprise Tax Calculation & Compliance Manager
 * Comprehensive tax handling for global compliance and reporting
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
import { 
  Calculator,
  Globe,
  FileText,
  Shield,
  Building,
  MapPin,
  Percent,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Settings,
  Download,
  Upload,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  Target,
  Archive,
  Flag,
  Clock,
  Mail,
  Phone,
  ExternalLink
} from 'lucide-react';
import { format, startOfYear, endOfYear, subMonths } from 'date-fns';
import { toast } from 'sonner';

// Types
interface TaxRate {
  id: string;
  stripeTaxRateId: string;
  displayName: string;
  description?: string;
  jurisdiction: string; // Country/state code
  percentage: number;
  type: 'vat' | 'sales_tax' | 'gst' | 'custom';
  inclusive: boolean; // Tax-inclusive pricing
  active: boolean;
  country?: string;
  state?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TaxConfiguration {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  
  // Geographic rules
  countryRules: CountryTaxRule[];
  stateRules: StateTaxRule[];
  
  // Business rules
  productTaxability: ProductTaxRule[];
  customerExemptions: CustomerExemptionRule[];
  
  // Thresholds
  digitalServiceThresholds: DigitalServiceThreshold[];
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CountryTaxRule {
  country: string;
  taxRateId: string;
  threshold?: number; // Minimum amount for tax
  exemptProductTypes?: string[];
  b2bExempt: boolean;
  digitalServiceTax: boolean;
}

interface StateTaxRule {
  country: string;
  state: string;
  taxRateId: string;
  threshold?: number;
  localTax?: number;
  exemptProductTypes?: string[];
}

interface ProductTaxRule {
  productType: string;
  taxableCountries: string[];
  exemptCountries: string[];
  specialRates: { country: string; rate: number }[];
}

interface CustomerExemptionRule {
  customerType: 'individual' | 'business' | 'nonprofit' | 'government';
  exemptionType: 'full' | 'partial' | 'reverse_charge';
  countries: string[];
  requiredDocuments: string[];
  verificationRequired: boolean;
}

interface DigitalServiceThreshold {
  country: string;
  revenueThreshold: number;
  transactionThreshold: number;
  requiresRegistration: boolean;
  registrationUrl?: string;
  notes?: string;
}

interface TaxCalculation {
  id: string;
  invoiceId?: string;
  customerId: string;
  
  // Input data
  customerCountry: string;
  customerState?: string;
  customerType: 'individual' | 'business';
  hasValidVatNumber: boolean;
  productType: string;
  amount: number;
  currency: string;
  
  // Calculation results
  applicableTaxRates: ApplicableTaxRate[];
  totalTaxAmount: number;
  totalTaxPercentage: number;
  isReversedCharge: boolean;
  exemptionReason?: string;
  
  // Compliance
  taxJurisdictions: string[];
  requiredReporting: ReportingRequirement[];
  
  calculatedAt: Date;
  calculatedBy: string;
}

interface ApplicableTaxRate {
  taxRateId: string;
  jurisdiction: string;
  type: string;
  percentage: number;
  amount: number;
  basis: number; // Amount this tax is calculated on
}

interface ReportingRequirement {
  jurisdiction: string;
  reportType: string;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  nextDueDate: Date;
  filingMethod: 'electronic' | 'paper' | 'api';
  contactInfo?: string;
}

interface TaxComplianceManagerProps {
  userId?: string;
  isAdmin?: boolean;
}

export default function TaxComplianceManager({ userId, isAdmin = false }: TaxComplianceManagerProps) {
  const [activeTab, setActiveTab] = useState('rates');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [taxConfigurations, setTaxConfigurations] = useState<TaxConfiguration[]>([]);
  const [taxCalculations, setTaxCalculations] = useState<TaxCalculation[]>([]);
  
  // Filter states
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [showRateDialog, setShowRateDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showCalculatorDialog, setShowCalculatorDialog] = useState(false);
  const [selectedRate, setSelectedRate] = useState<TaxRate | null>(null);
  
  // Form states
  const [calculatorForm, setCalculatorForm] = useState({
    customerCountry: 'US',
    customerState: '',
    customerType: 'individual' as 'individual' | 'business',
    hasValidVatNumber: false,
    productType: 'software_subscription',
    amount: 10000, // $100.00 in cents
    currency: 'usd'
  });

  // Sample data (in real app, this would come from API)
  const sampleTaxRates: TaxRate[] = [
    {
      id: '1',
      stripeTaxRateId: 'txr_1234567890',
      displayName: 'US Sales Tax (CA)',
      description: 'California state sales tax',
      jurisdiction: 'US-CA',
      percentage: 8.75,
      type: 'sales_tax',
      inclusive: false,
      active: true,
      country: 'US',
      state: 'CA',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '2',
      stripeTaxRateId: 'txr_2345678901',
      displayName: 'EU VAT (Standard)',
      description: 'Standard VAT rate for EU',
      jurisdiction: 'EU',
      percentage: 21.0,
      type: 'vat',
      inclusive: true,
      active: true,
      country: 'EU',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '3',
      stripeTaxRateId: 'txr_3456789012',
      displayName: 'UK VAT',
      description: 'United Kingdom VAT',
      jurisdiction: 'GB',
      percentage: 20.0,
      type: 'vat',
      inclusive: true,
      active: true,
      country: 'GB',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '4',
      stripeTaxRateId: 'txr_4567890123',
      displayName: 'Canada GST',
      description: 'Canadian Goods and Services Tax',
      jurisdiction: 'CA',
      percentage: 5.0,
      type: 'gst',
      inclusive: false,
      active: true,
      country: 'CA',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  ];

  // Load data
  useEffect(() => {
    setTaxRates(sampleTaxRates);
    setLoading(false);
  }, []);

  // Filter tax rates
  const filteredTaxRates = useMemo(() => {
    let filtered = taxRates;

    if (jurisdictionFilter !== 'all') {
      filtered = filtered.filter(rate => rate.jurisdiction === jurisdictionFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(rate => rate.type === typeFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(rate =>
        rate.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rate.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rate.jurisdiction.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [taxRates, jurisdictionFilter, typeFilter, searchQuery]);

  // Calculate tax for form
  const calculateTax = useCallback(() => {
    const { customerCountry, customerState, customerType, hasValidVatNumber, productType, amount } = calculatorForm;
    
    // Find applicable tax rates
    const applicableRates = taxRates.filter(rate => {
      if (!rate.active) return false;
      
      // Country matching
      if (rate.country === 'EU') {
        // EU VAT countries
        const euCountries = ['AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK'];
        if (!euCountries.includes(customerCountry)) return false;
      } else if (rate.country !== customerCountry) {
        return false;
      }
      
      // State matching
      if (rate.state && rate.state !== customerState) {
        return false;
      }
      
      // B2B VAT exemptions
      if (rate.type === 'vat' && customerType === 'business' && hasValidVatNumber && customerCountry !== 'US') {
        return false; // Reverse charge
      }
      
      return true;
    });

    const totalTaxPercentage = applicableRates.reduce((sum, rate) => sum + rate.percentage, 0);
    const totalTaxAmount = Math.round(amount * totalTaxPercentage / 100);
    
    const calculation: TaxCalculation = {
      id: Math.random().toString(),
      customerId: 'demo',
      customerCountry,
      customerState,
      customerType,
      hasValidVatNumber,
      productType,
      amount,
      currency: calculatorForm.currency,
      applicableTaxRates: applicableRates.map(rate => ({
        taxRateId: rate.id,
        jurisdiction: rate.jurisdiction,
        type: rate.type,
        percentage: rate.percentage,
        amount: Math.round(amount * rate.percentage / 100),
        basis: amount
      })),
      totalTaxAmount,
      totalTaxPercentage,
      isReversedCharge: customerType === 'business' && hasValidVatNumber && applicableRates.some(r => r.type === 'vat'),
      taxJurisdictions: applicableRates.map(r => r.jurisdiction),
      requiredReporting: [],
      calculatedAt: new Date(),
      calculatedBy: 'demo'
    };

    return calculation;
  }, [calculatorForm, taxRates]);

  // Format currency
  const formatCurrency = useCallback((amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2
    }).format(amount / 100);
  }, []);

  // Get type color
  const getTypeColor = useCallback((type: string) => {
    const colors = {
      'vat': 'bg-blue-100 text-blue-800',
      'sales_tax': 'bg-green-100 text-green-800',
      'gst': 'bg-purple-100 text-purple-800',
      'custom': 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tax data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tax & Compliance</h1>
          <p className="text-gray-600 mt-1">Manage global tax rates and compliance requirements</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setRefreshing(true)}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCalculatorDialog(true)}>
            <Calculator className="h-4 w-4 mr-2" />
            Tax Calculator
          </Button>
          {isAdmin && (
            <Button size="sm" onClick={() => setShowRateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tax Rate
            </Button>
          )}
        </div>
      </div>

      {/* Tax Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Percent className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Tax Rates</p>
                <p className="text-2xl font-bold">{taxRates.filter(r => r.active).length}</p>
                <p className="text-xs text-gray-600">
                  across {new Set(taxRates.map(r => r.jurisdiction)).size} jurisdictions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Globe className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Coverage</p>
                <p className="text-2xl font-bold">{new Set(taxRates.map(r => r.country)).size}</p>
                <p className="text-xs text-gray-600">countries & regions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Compliance Status</p>
                <p className="text-2xl font-bold text-green-600">98.5%</p>
                <p className="text-xs text-gray-600">tax accuracy rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Calculations</p>
                <p className="text-2xl font-bold">{taxCalculations.length}</p>
                <p className="text-xs text-gray-600">this month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="rates">Tax Rates</TabsTrigger>
          <TabsTrigger value="rules">Tax Rules</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="reporting">Reporting</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Tax Rates Tab */}
        <TabsContent value="rates" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search tax rates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={jurisdictionFilter} onValueChange={setJurisdictionFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jurisdictions</SelectItem>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="EU">European Union</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="vat">VAT</SelectItem>
                    <SelectItem value="sales_tax">Sales Tax</SelectItem>
                    <SelectItem value="gst">GST</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tax Rates Table */}
          <Card>
            <CardHeader>
              <CardTitle>Tax Rates ({filteredTaxRates.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Jurisdiction</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Inclusive</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTaxRates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{rate.displayName}</p>
                          {rate.description && (
                            <p className="text-sm text-gray-600">{rate.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Flag className="h-4 w-4 text-gray-400" />
                          <span>{rate.jurisdiction}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(rate.type)}>
                          {rate.type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{rate.percentage}%</span>
                      </TableCell>
                      <TableCell>
                        {rate.inclusive ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={rate.active ? 'default' : 'secondary'}>
                          {rate.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <>
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredTaxRates.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No tax rates found matching your criteria
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tax Configuration Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Tax configuration rules will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calculator Form */}
            <Card>
              <CardHeader>
                <CardTitle>Tax Calculator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerCountry">Customer Country</Label>
                    <Select 
                      value={calculatorForm.customerCountry} 
                      onValueChange={(value) => setCalculatorForm(prev => ({ ...prev, customerCountry: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                        <SelectItem value="DE">Germany</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="customerState">State/Province</Label>
                    <Input
                      id="customerState"
                      value={calculatorForm.customerState}
                      onChange={(e) => setCalculatorForm(prev => ({ ...prev, customerState: e.target.value }))}
                      placeholder="e.g., CA"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerType">Customer Type</Label>
                    <Select 
                      value={calculatorForm.customerType} 
                      onValueChange={(value) => setCalculatorForm(prev => ({ ...prev, customerType: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="productType">Product Type</Label>
                    <Select 
                      value={calculatorForm.productType} 
                      onValueChange={(value) => setCalculatorForm(prev => ({ ...prev, productType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="software_subscription">Software Subscription</SelectItem>
                        <SelectItem value="digital_service">Digital Service</SelectItem>
                        <SelectItem value="consulting">Consulting</SelectItem>
                        <SelectItem value="physical_goods">Physical Goods</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="amount">Amount (in cents)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={calculatorForm.amount}
                    onChange={(e) => setCalculatorForm(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                    placeholder="e.g., 10000 for $100.00"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={calculatorForm.hasValidVatNumber}
                    onCheckedChange={(checked) => setCalculatorForm(prev => ({ ...prev, hasValidVatNumber: checked }))}
                  />
                  <Label>Has Valid VAT Number</Label>
                </div>
              </CardContent>
            </Card>

            {/* Calculation Results */}
            <Card>
              <CardHeader>
                <CardTitle>Tax Calculation Results</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const calculation = calculateTax();
                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Subtotal</p>
                          <p className="text-xl font-bold">
                            {formatCurrency(calculation.amount, calculation.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Total Tax</p>
                          <p className="text-xl font-bold text-blue-600">
                            {formatCurrency(calculation.totalTaxAmount, calculation.currency)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Tax Rate</p>
                          <p className="text-lg font-semibold">
                            {calculation.totalTaxPercentage.toFixed(2)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Total Amount</p>
                          <p className="text-lg font-semibold">
                            {formatCurrency(calculation.amount + calculation.totalTaxAmount, calculation.currency)}
                          </p>
                        </div>
                      </div>

                      {calculation.applicableTaxRates.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Applicable Tax Rates</h4>
                          <div className="space-y-2">
                            {calculation.applicableTaxRates.map((rate, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div>
                                  <span className="text-sm font-medium">{rate.jurisdiction}</span>
                                  <Badge className={getTypeColor(rate.type)} size="sm" variant="outline">
                                    {rate.type.toUpperCase()}
                                  </Badge>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium">
                                    {formatCurrency(rate.amount, calculation.currency)}
                                  </p>
                                  <p className="text-xs text-gray-600">{rate.percentage}%</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {calculation.isReversedCharge && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            This transaction is subject to reverse charge. The customer is responsible for remitting tax.
                          </AlertDescription>
                        </Alert>
                      )}

                      {calculation.exemptionReason && (
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            Tax exempt: {calculation.exemptionReason}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reporting Tab */}
        <TabsContent value="reporting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tax Reporting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Tax reporting features will be available here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tax Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Auto-calculate tax</h4>
                  <p className="text-sm text-gray-600">
                    Automatically calculate tax for all transactions
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Use Stripe Tax</h4>
                  <p className="text-sm text-gray-600">
                    Use Stripe's tax calculation service for real-time rates
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Tax-inclusive pricing</h4>
                  <p className="text-sm text-gray-600">
                    Display prices inclusive of tax where applicable
                  </p>
                </div>
                <Switch />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="defaultTaxBehavior">Default Tax Behavior</Label>
                  <Select defaultValue="exclusive">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exclusive">Tax Exclusive</SelectItem>
                      <SelectItem value="inclusive">Tax Inclusive</SelectItem>
                      <SelectItem value="automatic">Automatic (by region)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="taxRounding">Tax Rounding</Label>
                  <Select defaultValue="round">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round">Round to nearest cent</SelectItem>
                      <SelectItem value="up">Round up</SelectItem>
                      <SelectItem value="down">Round down</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tax Calculator Dialog */}
      <Dialog open={showCalculatorDialog} onOpenChange={setShowCalculatorDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Advanced Tax Calculator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Calculate tax for any transaction with our comprehensive tax engine.
            </p>
            {/* Calculator content would go here */}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}