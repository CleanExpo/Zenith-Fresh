/**
 * Enterprise Usage-Based Billing Manager
 * Comprehensive metered pricing and usage tracking system
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
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, DateRange } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar as CalendarIcon,
  Download,
  Upload,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Zap,
  Database,
  Globe,
  Users,
  Target,
  Percent,
  Calculator,
  Filter,
  Search,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  LineChart,
  BarChart,
  MousePointer,
  Smartphone,
  Monitor,
  Code,
  Mail,
  Webhook
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, addDays } from 'date-fns';
import { toast } from 'sonner';

// Types
interface UsageMetric {
  id: string;
  name: string;
  displayName: string;
  description: string;
  unit: string;
  category: 'API' | 'MONITORING' | 'TEAM' | 'STORAGE' | 'BANDWIDTH' | 'CUSTOM';
  icon: React.ComponentType<{ className?: string }>;
  pricing: UsagePricing;
  currentUsage: number;
  limit: number;
  projectedUsage: number;
  cost: number;
  projectedCost: number;
  trend: number;
  isEnabled: boolean;
}

interface UsagePricing {
  type: 'flat' | 'tiered' | 'volume';
  basePrice: number;
  unitPrice: number;
  tiers?: PricingTier[];
  volumeDiscounts?: VolumeDiscount[];
  includedUnits: number;
  currency: string;
}

interface PricingTier {
  from: number;
  to?: number;
  price: number;
  description: string;
}

interface VolumeDiscount {
  minQuantity: number;
  discountPercent: number;
  description: string;
}

interface UsageRecord {
  id: string;
  metricName: string;
  quantity: number;
  timestamp: Date;
  source: string;
  metadata?: any;
  cost: number;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
}

interface UsageAlert {
  id: string;
  metricName: string;
  threshold: number;
  type: 'percentage' | 'absolute';
  isActive: boolean;
  lastTriggered?: Date;
  recipients: string[];
}

interface UsageBillingManagerProps {
  userId?: string;
  subscriptionId?: string;
  isAdmin?: boolean;
}

export default function UsageBillingManager({ 
  userId, 
  subscriptionId, 
  isAdmin = false 
}: UsageBillingManagerProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [usageMetrics, setUsageMetrics] = useState<UsageMetric[]>([]);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [usageAlerts, setUsageAlerts] = useState<UsageAlert[]>([]);
  
  // Filter states
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [selectedMetric, setSelectedMetric] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [showMetricDialog, setShowMetricDialog] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [showUsageDialog, setShowUsageDialog] = useState(false);
  const [selectedUsageMetric, setSelectedUsageMetric] = useState<UsageMetric | null>(null);

  // Sample data (in real app, this would come from API)
  const sampleUsageMetrics: UsageMetric[] = [
    {
      id: '1',
      name: 'api_requests',
      displayName: 'API Requests',
      description: 'Number of API requests made to the platform',
      unit: 'requests',
      category: 'API',
      icon: Code,
      pricing: {
        type: 'tiered',
        basePrice: 0,
        unitPrice: 0.01,
        includedUnits: 10000,
        currency: 'usd',
        tiers: [
          { from: 0, to: 10000, price: 0, description: 'Included' },
          { from: 10001, to: 100000, price: 0.01, description: '$0.01 per request' },
          { from: 100001, to: 1000000, price: 0.005, description: '$0.005 per request' },
          { from: 1000001, price: 0.001, description: '$0.001 per request' }
        ]
      },
      currentUsage: 85420,
      limit: 100000,
      projectedUsage: 95000,
      cost: 754.20,
      projectedCost: 850.00,
      trend: 12.5,
      isEnabled: true
    },
    {
      id: '2',
      name: 'monitoring_checks',
      displayName: 'Monitoring Checks',
      description: 'Website monitoring and health checks performed',
      unit: 'checks',
      category: 'MONITORING',
      icon: Activity,
      pricing: {
        type: 'flat',
        basePrice: 50,
        unitPrice: 0.05,
        includedUnits: 1000,
        currency: 'usd'
      },
      currentUsage: 2547,
      limit: 5000,
      projectedUsage: 2900,
      cost: 127.35,
      projectedCost: 145.00,
      trend: 8.2,
      isEnabled: true
    },
    {
      id: '3',
      name: 'team_members',
      displayName: 'Team Members',
      description: 'Number of active team members in the organization',
      unit: 'users',
      category: 'TEAM',
      icon: Users,
      pricing: {
        type: 'flat',
        basePrice: 0,
        unitPrice: 25,
        includedUnits: 5,
        currency: 'usd'
      },
      currentUsage: 12,
      limit: 25,
      projectedUsage: 15,
      cost: 175.00,
      projectedCost: 250.00,
      trend: 20.0,
      isEnabled: true
    },
    {
      id: '4',
      name: 'storage_gb',
      displayName: 'Storage',
      description: 'Data storage usage in gigabytes',
      unit: 'GB',
      category: 'STORAGE',
      icon: Database,
      pricing: {
        type: 'flat',
        basePrice: 0,
        unitPrice: 0.10,
        includedUnits: 100,
        currency: 'usd'
      },
      currentUsage: 245.6,
      limit: 500,
      projectedUsage: 280,
      cost: 14.56,
      projectedCost: 18.00,
      trend: 5.2,
      isEnabled: true
    },
    {
      id: '5',
      name: 'bandwidth_gb',
      displayName: 'Bandwidth',
      description: 'Data transfer usage in gigabytes',
      unit: 'GB',
      category: 'BANDWIDTH',
      icon: Globe,
      pricing: {
        type: 'volume',
        basePrice: 0,
        unitPrice: 0.05,
        includedUnits: 1000,
        currency: 'usd',
        volumeDiscounts: [
          { minQuantity: 10000, discountPercent: 10, description: '10% off for >10TB' },
          { minQuantity: 100000, discountPercent: 20, description: '20% off for >100TB' }
        ]
      },
      currentUsage: 15420,
      limit: 50000,
      projectedUsage: 18000,
      cost: 721.00,
      projectedCost: 850.00,
      trend: 15.8,
      isEnabled: true
    }
  ];

  // Load data
  useEffect(() => {
    setUsageMetrics(sampleUsageMetrics);
    setLoading(false);
  }, []);

  // Calculate total usage cost
  const totalUsageCost = useMemo(() => {
    return usageMetrics.reduce((sum, metric) => sum + metric.cost, 0);
  }, [usageMetrics]);

  // Calculate projected cost
  const projectedTotalCost = useMemo(() => {
    return usageMetrics.reduce((sum, metric) => sum + metric.projectedCost, 0);
  }, [usageMetrics]);

  // Filter usage records
  const filteredUsageRecords = useMemo(() => {
    let filtered = usageRecords;

    if (selectedMetric !== 'all') {
      filtered = filtered.filter(record => record.metricName === selectedMetric);
    }

    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter(record =>
        isWithinInterval(record.timestamp, { start: dateRange.from!, end: dateRange.to! })
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(record =>
        record.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.metricName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [usageRecords, selectedMetric, dateRange, searchQuery]);

  // Format currency
  const formatCurrency = useCallback((amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2
    }).format(amount);
  }, []);

  // Calculate usage cost
  const calculateUsageCost = useCallback((metric: UsageMetric, usage: number) => {
    const { pricing } = metric;
    let cost = pricing.basePrice;
    
    const billableUsage = Math.max(0, usage - pricing.includedUnits);
    
    if (pricing.type === 'flat') {
      cost += billableUsage * pricing.unitPrice;
    } else if (pricing.type === 'tiered' && pricing.tiers) {
      let remainingUsage = billableUsage;
      
      for (const tier of pricing.tiers) {
        if (remainingUsage <= 0) break;
        
        const tierUsage = tier.to 
          ? Math.min(remainingUsage, tier.to - tier.from + 1)
          : remainingUsage;
        
        cost += tierUsage * tier.price;
        remainingUsage -= tierUsage;
      }
    } else if (pricing.type === 'volume') {
      let unitPrice = pricing.unitPrice;
      
      // Apply volume discounts
      if (pricing.volumeDiscounts) {
        for (const discount of pricing.volumeDiscounts) {
          if (billableUsage >= discount.minQuantity) {
            unitPrice = pricing.unitPrice * (1 - discount.discountPercent / 100);
          }
        }
      }
      
      cost += billableUsage * unitPrice;
    }
    
    return cost;
  }, []);

  // Get category color
  const getCategoryColor = useCallback((category: string) => {
    const colors = {
      'API': 'bg-blue-100 text-blue-800',
      'MONITORING': 'bg-green-100 text-green-800',
      'TEAM': 'bg-purple-100 text-purple-800',
      'STORAGE': 'bg-orange-100 text-orange-800',
      'BANDWIDTH': 'bg-red-100 text-red-800',
      'CUSTOM': 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading usage data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usage & Billing</h1>
          <p className="text-gray-600 mt-1">Monitor usage and manage metered billing</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setRefreshing(true)}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Usage
          </Button>
        </div>
      </div>

      {/* Usage Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Current Period Cost</p>
                <p className="text-2xl font-bold">{formatCurrency(totalUsageCost)}</p>
                <p className="text-xs text-gray-600">
                  Projected: {formatCurrency(projectedTotalCost)}
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
                <p className="text-sm font-medium text-gray-500">Active Metrics</p>
                <p className="text-2xl font-bold">
                  {usageMetrics.filter(m => m.isEnabled).length}
                </p>
                <p className="text-xs text-gray-600">
                  of {usageMetrics.length} total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg. Growth Rate</p>
                <p className="text-2xl font-bold">
                  {(usageMetrics.reduce((sum, m) => sum + m.trend, 0) / usageMetrics.length).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-600">month over month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Usage Alerts</p>
                <p className="text-2xl font-bold">
                  {usageMetrics.filter(m => (m.currentUsage / m.limit) > 0.8).length}
                </p>
                <p className="text-xs text-gray-600">approaching limits</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="records">Usage Records</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Usage Metrics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {usageMetrics.map((metric) => {
              const IconComponent = metric.icon;
              const usagePercentage = metric.limit > 0 ? (metric.currentUsage / metric.limit) * 100 : 0;
              const isNearLimit = usagePercentage > 80;
              
              return (
                <Card key={metric.id} className={isNearLimit ? 'ring-2 ring-orange-200' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <IconComponent className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{metric.displayName}</h3>
                          <p className="text-sm text-gray-600">{metric.description}</p>
                        </div>
                      </div>
                      <Badge className={getCategoryColor(metric.category)}>
                        {metric.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Usage Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Current Usage</span>
                        <span className="text-sm text-gray-600">
                          {metric.currentUsage.toLocaleString()} / {metric.limit > 0 ? metric.limit.toLocaleString() : '∞'} {metric.unit}
                        </span>
                      </div>
                      <Progress 
                        value={usagePercentage} 
                        className={`h-2 ${isNearLimit ? 'bg-orange-100' : ''}`}
                      />
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          {usagePercentage.toFixed(1)}% used
                        </span>
                        <span className="text-xs text-gray-500">
                          Projected: {metric.projectedUsage.toLocaleString()} {metric.unit}
                        </span>
                      </div>
                    </div>

                    {/* Cost Information */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Current Cost</p>
                        <p className="text-xl font-bold">{formatCurrency(metric.cost)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Projected Cost</p>
                        <p className="text-xl font-bold">{formatCurrency(metric.projectedCost)}</p>
                      </div>
                    </div>

                    {/* Trend */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-gray-600">Growth Rate</span>
                      <div className="flex items-center">
                        {metric.trend > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                        )}
                        <span className={`text-sm font-medium ${
                          metric.trend > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {Math.abs(metric.trend)}%
                        </span>
                      </div>
                    </div>

                    {isNearLimit && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          You're approaching your usage limit. Consider upgrading your plan or optimizing usage.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Usage Metrics Management</CardTitle>
                {isAdmin && (
                  <Button size="sm" onClick={() => setShowMetricDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Metric
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Usage</TableHead>
                    <TableHead>Limit</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usageMetrics.map((metric) => {
                    const IconComponent = metric.icon;
                    const usagePercentage = metric.limit > 0 ? (metric.currentUsage / metric.limit) * 100 : 0;
                    
                    return (
                      <TableRow key={metric.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <IconComponent className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-medium">{metric.displayName}</p>
                              <p className="text-sm text-gray-600">{metric.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(metric.category)}>
                            {metric.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {metric.currentUsage.toLocaleString()} {metric.unit}
                            </p>
                            <Progress value={usagePercentage} className="h-1 mt-1" />
                          </div>
                        </TableCell>
                        <TableCell>
                          {metric.limit > 0 ? metric.limit.toLocaleString() : 'Unlimited'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{formatCurrency(metric.cost)}</p>
                            <p className="text-xs text-gray-600">
                              Proj: {formatCurrency(metric.projectedCost)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch checked={metric.isEnabled} />
                            {usagePercentage > 80 && (
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                            )}
                          </div>
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
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Records Tab */}
        <TabsContent value="records" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search usage records..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Metrics</SelectItem>
                    {usageMetrics.map((metric) => (
                      <SelectItem key={metric.id} value={metric.name}>
                        {metric.displayName}
                      </SelectItem>
                    ))}
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

          {/* Usage Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Records ({filteredUsageRecords.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Metric</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Period</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsageRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No usage records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsageRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {format(record.timestamp, 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">
                              {record.metricName.replace('_', ' ')}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {record.quantity.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {record.source}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(record.cost)}
                        </TableCell>
                        <TableCell>
                          {format(record.billingPeriodStart, 'MMM dd')} - {format(record.billingPeriodEnd, 'MMM dd')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Usage Alerts</CardTitle>
                <Button size="sm" onClick={() => setShowAlertDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Alert
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {usageAlerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No usage alerts configured
                  </div>
                ) : (
                  usageAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <AlertTriangle className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {alert.metricName.replace('_', ' ')} - {alert.threshold}
                            {alert.type === 'percentage' ? '%' : ' units'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Recipients: {alert.recipients.join(', ')}
                          </p>
                          {alert.lastTriggered && (
                            <p className="text-xs text-gray-500">
                              Last triggered: {format(alert.lastTriggered, 'MMM dd, yyyy HH:mm')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch checked={alert.isActive} />
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {usageMetrics.map((metric) => (
              <Card key={metric.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <metric.icon className="h-6 w-6 text-gray-600" />
                      <div>
                        <h3 className="text-lg font-semibold">{metric.displayName}</h3>
                        <Badge className={getCategoryColor(metric.category)}>
                          {metric.category}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {metric.pricing.type.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Base pricing info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Included Units</p>
                      <p className="text-lg font-bold">
                        {metric.pricing.includedUnits.toLocaleString()} {metric.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Base Price</p>
                      <p className="text-lg font-bold">
                        {formatCurrency(metric.pricing.basePrice)}
                      </p>
                    </div>
                  </div>

                  {/* Tiered pricing */}
                  {metric.pricing.type === 'tiered' && metric.pricing.tiers && (
                    <div>
                      <h4 className="font-medium mb-2">Pricing Tiers</h4>
                      <div className="space-y-2">
                        {metric.pricing.tiers.map((tier, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">
                              {tier.from.toLocaleString()}{tier.to ? ` - ${tier.to.toLocaleString()}` : '+'} {metric.unit}
                            </span>
                            <span className="text-sm font-medium">
                              {formatCurrency(tier.price)} per {metric.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Volume discounts */}
                  {metric.pricing.type === 'volume' && metric.pricing.volumeDiscounts && (
                    <div>
                      <h4 className="font-medium mb-2">Volume Discounts</h4>
                      <div className="space-y-2">
                        {metric.pricing.volumeDiscounts.map((discount, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{discount.description}</span>
                            <span className="text-sm font-medium text-green-600">
                              {discount.discountPercent}% off
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Current cost calculation */}
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Current Period Calculation</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Base Price:</span>
                        <span>{formatCurrency(metric.pricing.basePrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Included Units:</span>
                        <span>{metric.pricing.includedUnits.toLocaleString()} {metric.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Billable Usage:</span>
                        <span>
                          {Math.max(0, metric.currentUsage - metric.pricing.includedUnits).toLocaleString()} {metric.unit}
                        </span>
                      </div>
                      <div className="flex justify-between font-medium pt-2 border-t">
                        <span>Total Cost:</span>
                        <span>{formatCurrency(metric.cost)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}