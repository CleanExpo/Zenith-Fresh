/**
 * Enterprise Revenue Analytics & Financial Reporting
 * Comprehensive financial analytics dashboard with Fortune 500-grade reporting
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, DateRange } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Calendar as CalendarIcon,
  Download,
  FileText,
  PieChart,
  LineChart,
  Activity,
  Percent,
  CreditCard,
  Globe,
  Building,
  UserCheck,
  UserX,
  RefreshCw,
  Filter,
  Eye,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

// Types
interface RevenueMetrics {
  periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  periodStart: Date;
  periodEnd: Date;
  
  // Revenue metrics
  totalRevenue: number;
  recurringRevenue: number;
  oneTimeRevenue: number;
  
  // Customer metrics
  newCustomers: number;
  churnedCustomers: number;
  totalCustomers: number;
  
  // Subscription metrics
  newSubscriptions: number;
  canceledSubscriptions: number;
  totalSubscriptions: number;
  
  // Plan breakdown
  planMetrics: Record<string, number>;
  
  // Calculated metrics
  averageRevenuePerUser: number;
  customerLifetimeValue: number;
  churnRate: number;
  
  // Growth rates
  revenueGrowthRate: number;
  customerGrowthRate: number;
  
  calculatedAt: Date;
}

interface FinancialReport {
  id: string;
  name: string;
  type: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  periodStart: Date;
  periodEnd: Date;
  
  // Revenue breakdown
  subscriptionRevenue: number;
  usageRevenue: number;
  setupFees: number;
  refunds: number;
  netRevenue: number;
  
  // Cost analysis
  cogs: number; // Cost of goods sold
  operatingExpenses: number;
  grossProfit: number;
  netProfit: number;
  
  // Margins
  grossMargin: number;
  netMargin: number;
  
  // Cash flow
  cashReceived: number;
  cashPaid: number;
  netCashFlow: number;
  
  // Tax and compliance
  taxCollected: number;
  taxRemitted: number;
  
  generatedAt: Date;
  status: 'draft' | 'finalized' | 'filed';
}

interface CohortAnalysis {
  cohortMonth: string;
  customersAcquired: number;
  retentionRates: number[]; // Monthly retention rates
  revenueRates: number[]; // Monthly revenue retention rates
  ltv: number;
  averageLifespan: number;
}

interface RevenueAnalyticsProps {
  isAdmin?: boolean;
  companyView?: boolean;
}

export default function RevenueAnalytics({ isAdmin = false, companyView = false }: RevenueAnalyticsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(null);
  const [historicalMetrics, setHistoricalMetrics] = useState<RevenueMetrics[]>([]);
  const [financialReports, setFinancialReports] = useState<FinancialReport[]>([]);
  const [cohortData, setCohortData] = useState<CohortAnalysis[]>([]);
  
  // Filter states
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [periodType, setPeriodType] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [comparisonPeriod, setComparisonPeriod] = useState<'previous' | 'year_ago'>('previous');

  // Sample data (in real app, this would come from API)
  const sampleRevenueMetrics: RevenueMetrics = {
    periodType: 'monthly',
    periodStart: startOfMonth(new Date()),
    periodEnd: endOfMonth(new Date()),
    totalRevenue: 2547890, // $25,478.90
    recurringRevenue: 2234560, // $22,345.60
    oneTimeRevenue: 313330, // $3,133.30
    newCustomers: 42,
    churnedCustomers: 8,
    totalCustomers: 1247,
    newSubscriptions: 45,
    canceledSubscriptions: 12,
    totalSubscriptions: 1189,
    planMetrics: {
      'Starter': 456780,
      'Professional': 1234560,
      'Business': 567890,
      'Enterprise': 288660
    },
    averageRevenuePerUser: 20432, // $204.32
    customerLifetimeValue: 245670, // $2,456.70
    churnRate: 2.1,
    revenueGrowthRate: 15.8,
    customerGrowthRate: 12.4,
    calculatedAt: new Date()
  };

  const sampleHistoricalMetrics: RevenueMetrics[] = [
    // Generate 12 months of historical data
    ...Array.from({ length: 12 }, (_, i) => {
      const month = subMonths(new Date(), i);
      const baseRevenue = 2000000 + (Math.random() * 500000);
      return {
        periodType: 'monthly' as const,
        periodStart: startOfMonth(month),
        periodEnd: endOfMonth(month),
        totalRevenue: Math.round(baseRevenue * (1 + (11 - i) * 0.05)), // Growth trend
        recurringRevenue: Math.round(baseRevenue * 0.85),
        oneTimeRevenue: Math.round(baseRevenue * 0.15),
        newCustomers: Math.round(30 + Math.random() * 20),
        churnedCustomers: Math.round(5 + Math.random() * 10),
        totalCustomers: 1200 + (11 - i) * 30,
        newSubscriptions: Math.round(32 + Math.random() * 18),
        canceledSubscriptions: Math.round(6 + Math.random() * 8),
        totalSubscriptions: 1150 + (11 - i) * 28,
        planMetrics: {},
        averageRevenuePerUser: Math.round(18000 + Math.random() * 4000),
        customerLifetimeValue: Math.round(220000 + Math.random() * 50000),
        churnRate: 1.5 + Math.random() * 2,
        revenueGrowthRate: 8 + Math.random() * 15,
        customerGrowthRate: 5 + Math.random() * 12,
        calculatedAt: new Date()
      };
    })
  ].reverse();

  // Load data
  useEffect(() => {
    setRevenueMetrics(sampleRevenueMetrics);
    setHistoricalMetrics(sampleHistoricalMetrics);
    setLoading(false);
  }, []);

  // Calculate comparison metrics
  const comparisonMetrics = useMemo(() => {
    if (!revenueMetrics || historicalMetrics.length === 0) return null;
    
    const compareIndex = comparisonPeriod === 'previous' ? 1 : 12;
    const compareMetrics = historicalMetrics[historicalMetrics.length - compareIndex];
    
    if (!compareMetrics) return null;
    
    return {
      revenueChange: ((revenueMetrics.totalRevenue - compareMetrics.totalRevenue) / compareMetrics.totalRevenue) * 100,
      customerChange: ((revenueMetrics.totalCustomers - compareMetrics.totalCustomers) / compareMetrics.totalCustomers) * 100,
      arpuChange: ((revenueMetrics.averageRevenuePerUser - compareMetrics.averageRevenuePerUser) / compareMetrics.averageRevenuePerUser) * 100,
      churnChange: revenueMetrics.churnRate - compareMetrics.churnRate
    };
  }, [revenueMetrics, historicalMetrics, comparisonPeriod]);

  // Format currency
  const formatCurrency = useCallback((amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2
    }).format(amount / 100);
  }, []);

  // Format percentage
  const formatPercentage = useCallback((value: number, showSign = false) => {
    const formatted = `${value.toFixed(1)}%`;
    if (showSign && value > 0) {
      return `+${formatted}`;
    }
    return formatted;
  }, []);

  // Get trend icon
  const getTrendIcon = useCallback((value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  }, []);

  // Get trend color
  const getTrendColor = useCallback((value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading revenue analytics...</p>
        </div>
      </div>
    );
  }

  if (!revenueMetrics) {
    return (
      <div className="text-center py-8 text-gray-500">
        No revenue data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Revenue Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive financial reporting and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={periodType} onValueChange={(value) => setPeriodType(value as any)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
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
                onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="sm" onClick={() => setRefreshing(true)}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-3xl font-bold">{formatCurrency(revenueMetrics.totalRevenue)}</p>
                {comparisonMetrics && (
                  <div className="flex items-center mt-1">
                    {getTrendIcon(comparisonMetrics.revenueChange)}
                    <span className={`text-sm ml-1 ${getTrendColor(comparisonMetrics.revenueChange)}`}>
                      {formatPercentage(Math.abs(comparisonMetrics.revenueChange), true)}
                    </span>
                  </div>
                )}
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Customers</p>
                <p className="text-3xl font-bold">{revenueMetrics.totalCustomers.toLocaleString()}</p>
                {comparisonMetrics && (
                  <div className="flex items-center mt-1">
                    {getTrendIcon(comparisonMetrics.customerChange)}
                    <span className={`text-sm ml-1 ${getTrendColor(comparisonMetrics.customerChange)}`}>
                      {formatPercentage(Math.abs(comparisonMetrics.customerChange), true)}
                    </span>
                  </div>
                )}
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">ARPU</p>
                <p className="text-3xl font-bold">{formatCurrency(revenueMetrics.averageRevenuePerUser)}</p>
                {comparisonMetrics && (
                  <div className="flex items-center mt-1">
                    {getTrendIcon(comparisonMetrics.arpuChange)}
                    <span className={`text-sm ml-1 ${getTrendColor(comparisonMetrics.arpuChange)}`}>
                      {formatPercentage(Math.abs(comparisonMetrics.arpuChange), true)}
                    </span>
                  </div>
                )}
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Churn Rate</p>
                <p className="text-3xl font-bold">{formatPercentage(revenueMetrics.churnRate)}</p>
                {comparisonMetrics && (
                  <div className="flex items-center mt-1">
                    {getTrendIcon(-comparisonMetrics.churnChange)} {/* Negative change is good for churn */}
                    <span className={`text-sm ml-1 ${getTrendColor(-comparisonMetrics.churnChange)}`}>
                      {formatPercentage(Math.abs(comparisonMetrics.churnChange), true)}
                    </span>
                  </div>
                )}
              </div>
              <Percent className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Recurring Revenue</span>
                    <span className="text-lg font-bold">
                      {formatCurrency(revenueMetrics.recurringRevenue)}
                    </span>
                  </div>
                  <Progress 
                    value={(revenueMetrics.recurringRevenue / revenueMetrics.totalRevenue) * 100} 
                    className="h-2" 
                  />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">One-time Revenue</span>
                    <span className="text-lg font-bold">
                      {formatCurrency(revenueMetrics.oneTimeRevenue)}
                    </span>
                  </div>
                  <Progress 
                    value={(revenueMetrics.oneTimeRevenue / revenueMetrics.totalRevenue) * 100} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Customer Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">New Customers</p>
                    <p className="text-2xl font-bold text-green-600">
                      +{revenueMetrics.newCustomers}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Churned</p>
                    <p className="text-2xl font-bold text-red-600">
                      -{revenueMetrics.churnedCustomers}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Net Growth</p>
                    <p className="text-2xl font-bold">
                      +{revenueMetrics.newCustomers - revenueMetrics.churnedCustomers}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Growth Rate</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatPercentage(revenueMetrics.customerGrowthRate)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Plan Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(revenueMetrics.planMetrics).map(([plan, revenue]) => {
                  const percentage = (revenue / revenueMetrics.totalRevenue) * 100;
                  return (
                    <div key={plan} className="text-center">
                      <p className="text-sm font-medium text-gray-500">{plan}</p>
                      <p className="text-xl font-bold">{formatCurrency(revenue)}</p>
                      <p className="text-sm text-gray-600">{formatPercentage(percentage)}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Growth Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Growth Trends (Last 12 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* This would be replaced with actual charts in a real implementation */}
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Revenue trend chart would be displayed here</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Recurring Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="text-3xl font-bold">{formatCurrency(revenueMetrics.recurringRevenue)}</p>
                  <p className="text-sm text-gray-600">
                    {formatPercentage(revenueMetrics.revenueGrowthRate, true)} from last month
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Annual Run Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="text-3xl font-bold">
                    {formatCurrency(revenueMetrics.recurringRevenue * 12)}
                  </p>
                  <p className="text-sm text-gray-600">Based on current MRR</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer LTV</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="text-3xl font-bold">
                    {formatCurrency(revenueMetrics.customerLifetimeValue)}
                  </p>
                  <p className="text-sm text-gray-600">Average customer lifetime value</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Historical Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <LineChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Historical revenue chart would be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <UserCheck className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">New Customers</p>
                    <p className="text-2xl font-bold">{revenueMetrics.newCustomers}</p>
                    <p className="text-xs text-gray-600">this month</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <UserX className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Churned Customers</p>
                    <p className="text-2xl font-bold">{revenueMetrics.churnedCustomers}</p>
                    <p className="text-xs text-gray-600">this month</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Net Growth</p>
                    <p className="text-2xl font-bold">
                      +{revenueMetrics.newCustomers - revenueMetrics.churnedCustomers}
                    </p>
                    <p className="text-xs text-gray-600">this month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Acquisition & Retention */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Acquisition & Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Customer acquisition funnel would be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
                    <p className="text-2xl font-bold">{revenueMetrics.totalSubscriptions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Plus className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">New Subscriptions</p>
                    <p className="text-2xl font-bold">{revenueMetrics.newSubscriptions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Canceled</p>
                    <p className="text-2xl font-bold">{revenueMetrics.canceledSubscriptions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Health */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Net Subscription Growth</span>
                  <span className="text-lg font-bold text-green-600">
                    +{revenueMetrics.newSubscriptions - revenueMetrics.canceledSubscriptions}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Subscription Churn Rate</span>
                  <span className="text-lg font-bold">
                    {formatPercentage((revenueMetrics.canceledSubscriptions / revenueMetrics.totalSubscriptions) * 100)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cohorts Tab */}
        <TabsContent value="cohorts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cohort Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Cohort analysis data would be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Financial Reports</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                No financial reports generated yet
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}