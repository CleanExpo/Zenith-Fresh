'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Settings,
  Download,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart
} from 'recharts';

interface RevenueData {
  date: string;
  actual: number | null;
  predicted: number;
  conservative: number;
  optimistic: number;
  upperBound: number;
  lowerBound: number;
}

interface Scenario {
  name: string;
  probability: number;
  value: number;
  description: string;
  factors: string[];
  confidence: number;
  timeframe: string;
}

interface RevenueDriver {
  name: string;
  contribution: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  importance: number;
  forecast: number[];
}

interface SeasonalPattern {
  month: string;
  multiplier: number;
  confidence: number;
  historicalData: number[];
}

interface ModelMetrics {
  accuracy: number;
  mae: number; // Mean Absolute Error
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Square Error
  r2: number; // R-squared
  lastUpdated: Date;
  dataPoints: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const RevenueForecasting: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'30d' | '90d' | '1y' | '2y'>('1y');
  const [viewType, setViewType] = useState<'forecast' | 'scenarios' | 'drivers' | 'seasonality'>('forecast');
  
  // Data state
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [drivers, setDrivers] = useState<RevenueDriver[]>([]);
  const [seasonalPatterns, setSeasonalPatterns] = useState<SeasonalPattern[]>([]);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null);

  useEffect(() => {
    loadRevenueData();
  }, [timeframe]);

  const loadRevenueData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadForecastData(),
        loadScenarios(),
        loadDrivers(),
        loadSeasonalData(),
        loadModelMetrics()
      ]);
    } catch (error) {
      console.error('Error loading revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadForecastData = async () => {
    const periods = timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : timeframe === '1y' ? 365 : 730;
    const historicalPeriods = Math.floor(periods / 2);
    
    const data: RevenueData[] = [];
    
    // Historical data (actual revenue)
    for (let i = historicalPeriods; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const baseRevenue = 100000 + (historicalPeriods - i) * 2000;
      const seasonality = 1 + 0.1 * Math.sin((date.getMonth() / 12) * 2 * Math.PI);
      const noise = 0.9 + Math.random() * 0.2;
      
      const actual = Math.floor(baseRevenue * seasonality * noise);
      
      data.push({
        date: date.toISOString().split('T')[0],
        actual,
        predicted: actual * (0.95 + Math.random() * 0.1), // Close to actual for historical
        conservative: actual * 0.9,
        optimistic: actual * 1.1,
        upperBound: actual * 1.15,
        lowerBound: actual * 0.85
      });
    }
    
    // Future predictions
    for (let i = 1; i <= periods - historicalPeriods; i++) {
      const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
      const baseRevenue = 100000 + (historicalPeriods + i) * 2000;
      const seasonality = 1 + 0.1 * Math.sin((date.getMonth() / 12) * 2 * Math.PI);
      const growth = Math.pow(1.02, i / 30); // 2% monthly growth
      
      const predicted = Math.floor(baseRevenue * seasonality * growth);
      
      data.push({
        date: date.toISOString().split('T')[0],
        actual: null,
        predicted,
        conservative: predicted * 0.85,
        optimistic: predicted * 1.25,
        upperBound: predicted * 1.35,
        lowerBound: predicted * 0.75
      });
    }
    
    setRevenueData(data);
  };

  const loadScenarios = async () => {
    setScenarios([
      {
        name: 'Conservative Growth',
        probability: 85,
        value: 1200000,
        description: 'Maintaining current growth rates with minimal market expansion',
        factors: ['Current retention rates', 'Historical seasonality', 'Economic headwinds'],
        confidence: 92,
        timeframe: '12 months'
      },
      {
        name: 'Expected Growth',
        probability: 65,
        value: 1450000,
        description: 'Moderate growth with successful feature adoption and market expansion',
        factors: ['Feature adoption rates', 'Customer acquisition', 'Upselling success'],
        confidence: 87,
        timeframe: '12 months'
      },
      {
        name: 'Optimistic Growth',
        probability: 35,
        value: 1750000,
        description: 'Aggressive growth with all initiatives succeeding',
        factors: ['New market penetration', 'Premium tier adoption', 'Partnership deals'],
        confidence: 76,
        timeframe: '12 months'
      },
      {
        name: 'Breakthrough Scenario',
        probability: 15,
        value: 2200000,
        description: 'Exceptional growth with viral adoption and enterprise deals',
        factors: ['Viral growth', 'Enterprise contracts', 'Market disruption'],
        confidence: 62,
        timeframe: '12 months'
      }
    ]);
  };

  const loadDrivers = async () => {
    setDrivers([
      {
        name: 'New Customer Acquisition',
        contribution: 45,
        trend: 'increasing',
        importance: 85,
        forecast: Array.from({ length: 12 }, (_, i) => 45000 + i * 2000 + Math.random() * 5000)
      },
      {
        name: 'Existing Customer Expansion',
        contribution: 30,
        trend: 'increasing',
        importance: 78,
        forecast: Array.from({ length: 12 }, (_, i) => 30000 + i * 1500 + Math.random() * 3000)
      },
      {
        name: 'Subscription Renewals',
        contribution: 20,
        trend: 'stable',
        importance: 92,
        forecast: Array.from({ length: 12 }, (_, i) => 20000 + i * 500 + Math.random() * 2000)
      },
      {
        name: 'Usage-Based Revenue',
        contribution: 5,
        trend: 'increasing',
        importance: 65,
        forecast: Array.from({ length: 12 }, (_, i) => 5000 + i * 300 + Math.random() * 1000)
      }
    ]);
  };

  const loadSeasonalData = async () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    setSeasonalPatterns(months.map((month, index) => ({
      month,
      multiplier: 0.8 + 0.4 * (1 + Math.sin((index / 12) * 2 * Math.PI)) / 2,
      confidence: 75 + Math.random() * 20,
      historicalData: Array.from({ length: 3 }, () => 
        Math.floor(100000 * (0.8 + 0.4 * (1 + Math.sin((index / 12) * 2 * Math.PI)) / 2) * (0.9 + Math.random() * 0.2))
      )
    })));
  };

  const loadModelMetrics = async () => {
    setModelMetrics({
      accuracy: 92.3,
      mae: 15420,
      mape: 8.7,
      rmse: 23150,
      r2: 0.89,
      lastUpdated: new Date(),
      dataPoints: 1247
    });
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <BarChart3 className="w-4 h-4 text-gray-600" />;
    }
  };

  const exportForecast = () => {
    const data = revenueData.map(item => ({
      date: item.date,
      actual: item.actual,
      predicted: item.predicted,
      conservative: item.conservative,
      optimistic: item.optimistic
    }));
    
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'revenue-forecast.csv';
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading revenue forecasting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Revenue Forecasting</h2>
          <p className="text-gray-600 mt-1">AI-powered revenue predictions and scenario analysis</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="30d">30 Days</option>
            <option value="90d">90 Days</option>
            <option value="1y">1 Year</option>
            <option value="2y">2 Years</option>
          </select>
          <Button onClick={exportForecast} variant="outline" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
          <Button onClick={loadRevenueData} className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Model Performance Card */}
      {modelMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-600" />
              <span>Model Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatPercent(modelMetrics.accuracy)}</div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(modelMetrics.mae)}</div>
                <div className="text-sm text-gray-600">MAE</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{formatPercent(modelMetrics.mape)}</div>
                <div className="text-sm text-gray-600">MAPE</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{modelMetrics.r2.toFixed(2)}</div>
                <div className="text-sm text-gray-600">R²</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{modelMetrics.dataPoints}</div>
                <div className="text-sm text-gray-600">Data Points</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Toggle */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'forecast', label: 'Forecast', icon: TrendingUp },
          { key: 'scenarios', label: 'Scenarios', icon: Target },
          { key: 'drivers', label: 'Drivers', icon: BarChart3 },
          { key: 'seasonality', label: 'Seasonality', icon: Calendar }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setViewType(key as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              viewType === key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Main Forecast Chart */}
      {viewType === 'forecast' && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue Forecast with Confidence Intervals</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={500}>
              <ComposedChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip 
                  formatter={(value, name) => [formatCurrency(Number(value)), name]}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                
                {/* Confidence interval */}
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  stackId="1"
                  stroke="none"
                  fill="#E0F2FE"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="lowerBound"
                  stackId="1"
                  stroke="none"
                  fill="#FFFFFF"
                  fillOpacity={1}
                />
                
                {/* Scenario lines */}
                <Line type="monotone" dataKey="conservative" stroke="#F59E0B" strokeDasharray="8 8" name="Conservative" />
                <Line type="monotone" dataKey="optimistic" stroke="#10B981" strokeDasharray="8 8" name="Optimistic" />
                
                {/* Main lines */}
                <Line type="monotone" dataKey="actual" stroke="#0088FE" strokeWidth={3} name="Actual Revenue" />
                <Line type="monotone" dataKey="predicted" stroke="#FF8042" strokeWidth={2} name="Predicted Revenue" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Scenarios View */}
      {viewType === 'scenarios' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scenarios.map((scenario, index) => (
                  <div key={scenario.name} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{scenario.name}</h3>
                      <Badge 
                        className={`${
                          scenario.probability > 70 ? 'bg-green-100 text-green-800' :
                          scenario.probability > 40 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        {scenario.probability}% likely
                      </Badge>
                    </div>
                    
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {formatCurrency(scenario.value)}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
                    
                    <div className="text-xs text-gray-500 mb-2">
                      Key factors: {scenario.factors.join(', ')}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Confidence: {scenario.confidence}%</span>
                      <span className="text-gray-600">Timeframe: {scenario.timeframe}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scenario Probability Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={scenarios}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, 'Probability']} />
                  <Bar dataKey="probability" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue Drivers View */}
      {viewType === 'drivers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Driver Contribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={drivers}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    dataKey="contribution"
                    nameKey="name"
                  >
                    {drivers.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Driver Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {drivers.map((driver, index) => (
                  <div key={driver.name} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{driver.name}</span>
                        {getTrendIcon(driver.trend)}
                      </div>
                      <span className="text-sm font-bold">{driver.contribution}%</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Importance:</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${driver.importance}%` }}
                            />
                          </div>
                          <span className="text-xs">{driver.importance}%</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">12M Forecast:</span>
                        <span className="font-medium ml-2">
                          {formatCurrency(driver.forecast.reduce((sum, val) => sum + val, 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Seasonality View */}
      {viewType === 'seasonality' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Seasonal Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={seasonalPatterns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`, 'Seasonal Multiplier']} />
                  <Bar dataKey="multiplier" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seasonal Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {seasonalPatterns.map((pattern, index) => (
                  <div key={pattern.month} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{pattern.month}</span>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          className={`${
                            pattern.multiplier > 1.1 ? 'bg-green-100 text-green-800' :
                            pattern.multiplier < 0.9 ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {((pattern.multiplier - 1) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      Confidence: {pattern.confidence.toFixed(1)}%
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Historical: {pattern.historicalData.map(val => formatCurrency(val)).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RevenueForecasting;