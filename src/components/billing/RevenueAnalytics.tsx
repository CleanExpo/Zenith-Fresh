/**
 * Revenue Analytics Dashboard
 * Admin-only component for revenue insights and business metrics
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar,
  BarChart3,
  PieChart,
  Download,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface RevenueData {
  overview: {
    currentMrr: number;
    currentArr: number;
    mrrGrowth: number;
    churnRate: number;
    customerLifetimeValue: number;
    totalCustomers: number;
  };
  subscriptions: {
    total: number;
    active: number;
    trialing: number;
    pastDue: number;
  };
  planDistribution: Array<{
    planId: string;
    _count: { id: number };
  }>;
  revenueMetrics: Array<{
    date: string;
    mrr: number;
    arr: number;
    newMrr: number;
    churnedMrr: number;
    expansionMrr: number;
    activeSubscriptions: number;
    newSubscriptions: number;
    churnedSubscriptions: number;
  }>;
  recentInvoices: Array<{
    id: string;
    number: string;
    status: string;
    total: number;
    createdAt: string;
    teamName: string;
  }>;
}

export function RevenueAnalytics() {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  useEffect(() => {
    fetchRevenueData();
  }, [selectedPeriod]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/billing/analytics?period=${selectedPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch revenue data');
      const data = await response.json();
      setRevenueData(data);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PAID: { variant: 'success' as const, label: 'Paid' },
      OPEN: { variant: 'warning' as const, label: 'Open' },
      DRAFT: { variant: 'secondary' as const, label: 'Draft' },
      VOID: { variant: 'destructive' as const, label: 'Void' },
      UNCOLLECTIBLE: { variant: 'destructive' as const, label: 'Uncollectible' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: 'secondary' as const,
      label: status,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const exportRevenueData = async () => {
    try {
      const response = await fetch(`/api/billing/analytics/export?period=${selectedPeriod}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `revenue-report-${selectedPeriod}d.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting revenue data:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!revenueData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Failed to load revenue data</p>
        </div>
      </div>
    );
  }

  const { overview, subscriptions, planDistribution, revenueMetrics, recentInvoices } = revenueData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Revenue Analytics</h1>
          <p className="text-gray-600">Business insights and financial metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportRevenueData}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
        <TabsList>
          <TabsTrigger value="7">Last 7 days</TabsTrigger>
          <TabsTrigger value="30">Last 30 days</TabsTrigger>
          <TabsTrigger value="90">Last 90 days</TabsTrigger>
          <TabsTrigger value="365">Last year</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedPeriod} className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Monthly Recurring Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">{formatCurrency(overview.currentMrr)}</div>
                  <div className={`flex items-center text-sm ${
                    overview.mrrGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {overview.mrrGrowth >= 0 ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    {formatPercentage(overview.mrrGrowth)} this month
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Annual Recurring Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">{formatCurrency(overview.currentArr)}</div>
                  <div className="text-sm text-gray-500">
                    {formatCurrency(overview.currentMrr * 12)} projected
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">{overview.totalCustomers}</div>
                  <div className="text-sm text-gray-500">
                    {subscriptions.active} active subscriptions
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Churn Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">{overview.churnRate.toFixed(1)}%</div>
                  <div className={`text-sm ${
                    overview.churnRate <= 5 ? 'text-green-600' : 
                    overview.churnRate <= 10 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {overview.churnRate <= 5 ? 'Excellent' : 
                     overview.churnRate <= 10 ? 'Good' : 'Needs attention'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Status</CardTitle>
                <CardDescription>Current subscription distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Active</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{subscriptions.active}</div>
                      <div className="text-sm text-gray-500">
                        {((subscriptions.active / subscriptions.total) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span>Trialing</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{subscriptions.trialing}</div>
                      <div className="text-sm text-gray-500">
                        {((subscriptions.trialing / subscriptions.total) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span>Past Due</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{subscriptions.pastDue}</div>
                      <div className="text-sm text-gray-500">
                        {((subscriptions.pastDue / subscriptions.total) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan Distribution</CardTitle>
                <CardDescription>Revenue by subscription plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {planDistribution.map((plan) => (
                    <div key={plan.planId} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <PieChart className="h-4 w-4 text-gray-500" />
                        <span className="capitalize">{plan.planId}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{plan._count.id}</div>
                        <div className="text-sm text-gray-500">
                          {((plan._count.id / subscriptions.total) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Invoices */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Latest billing activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium">{invoice.number}</div>
                        <div className="text-sm text-gray-500">{invoice.teamName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(invoice.total)}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {getStatusBadge(invoice.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Revenue Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>MRR growth and customer metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueMetrics.slice(-7).map((metric, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-3 border rounded-lg">
                    <div>
                      <div className="text-sm text-gray-500">Date</div>
                      <div className="font-medium">
                        {new Date(metric.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">MRR</div>
                      <div className="font-medium">{formatCurrency(metric.mrr)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">New MRR</div>
                      <div className="font-medium text-green-600">
                        +{formatCurrency(metric.newMrr)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Churned MRR</div>
                      <div className="font-medium text-red-600">
                        -{formatCurrency(metric.churnedMrr)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Active Subs</div>
                      <div className="font-medium">{metric.activeSubscriptions}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}