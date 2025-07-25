"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Search,
  Eye,
  Smartphone,
  Monitor,
  Download,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsData {
  overviewStats: Array<{
    title: string;
    value: string;
    change: string;
    trend: "up" | "down";
  }>;
  performanceMetrics: Array<{
    name: string;
    current: number;
    previous: number;
    color: string;
  }>;
  topIssues: Array<{
    issue: string;
    count: number;
    severity: string;
    trend: string;
  }>;
  websites: Array<{
    id: string;
    name: string;
    domain: string;
  }>;
  scoreDistribution: {
    excellent: number;
    good: number;
    needsWork: number;
    poor: number;
  };
  deviceStats: Array<{
    device: string;
    percentage: number;
    count: string;
  }>;
}

export function AnalyticsView() {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedWebsite, setSelectedWebsite] = useState("all");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchAnalyticsData = async () => {
    try {
      const params = new URLSearchParams({
        timeRange,
        websiteId: selectedWebsite,
      });

      const response = await authClient.authenticatedFetch(
        `/api/analytics?${params}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }

      const data = await response.json();
      setAnalyticsData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, selectedWebsite]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        fetchAnalyticsData();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [loading, refreshing]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalyticsData();
  };

  const handleExport = async (format: "csv" | "pdf") => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        format,
        timeRange,
        websiteId: selectedWebsite,
      });

      const response = await authClient.authenticatedFetch(
        `/api/analytics/export?${params}`
      );

      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      if (format === "csv") {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `zenith-analytics-${timeRange}-${
          new Date().toISOString().split("T")[0]
        }.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (format === "pdf") {
        const data = await response.json();
        toast({
          title: "PDF Export",
          description:
            "PDF export functionality would be implemented with a PDF library like jsPDF",
        });
      }

      toast({
        title: "Export Successful",
        description: `Analytics data exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export analytics data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-red-400" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-neon-green" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-electric-blue" />
          <p className="text-slate-400">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-2">
              Analytics
            </h1>
            <p className="text-slate-400">
              Track your website performance and optimization progress
            </p>
          </div>
        </div>

        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-200 mb-2">
              No Analytics Data Yet
            </h3>
            <p className="text-slate-400 mb-6">
              Start analyzing your websites to see performance insights, trends,
              and optimization opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleRefresh} disabled={refreshing}>
                {refreshing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Refresh Data
              </Button>
              <Button
                variant="outline"
                className="border-slate-600 text-slate-200 hover:bg-slate-800"
              >
                Analyze Website
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const overviewStats = [
    {
      title: "Total Analyses",
      value: analyticsData.overviewStats[0]?.value || "0",
      change: analyticsData.overviewStats[0]?.change || "0%",
      trend: analyticsData.overviewStats[0]?.trend || "up",
      icon: <BarChart3 className="h-6 w-6 text-electric-blue" />,
    },
    {
      title: "Average Score",
      value: analyticsData.overviewStats[1]?.value || "0",
      change: analyticsData.overviewStats[1]?.change || "0%",
      trend: analyticsData.overviewStats[1]?.trend || "up",
      icon: <TrendingUp className="h-6 w-6 text-neon-green" />,
    },
    {
      title: "Total Issues",
      value: analyticsData.overviewStats[2]?.value || "0",
      change: analyticsData.overviewStats[2]?.change || "0%",
      trend: analyticsData.overviewStats[2]?.trend || "up",
      icon: <Search className="h-6 w-6 text-yellow-400" />,
    },
    {
      title: "Avg Load Time",
      value: analyticsData.overviewStats[3]?.value || "0s",
      change: analyticsData.overviewStats[3]?.change || "0s",
      trend: analyticsData.overviewStats[3]?.trend || "up",
      icon: <Clock className="h-6 w-6 text-purple-400" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Analytics</h1>
          <p className="text-slate-400">
            Track your website performance and optimization progress
            {lastUpdated && (
              <span className="block text-xs text-slate-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={selectedWebsite} onValueChange={setSelectedWebsite}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-600 text-slate-100">
              <SelectValue placeholder="Select website" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {analyticsData.websites.map((website) => (
                <SelectItem
                  key={website.id}
                  value={website.id}
                  className="text-slate-200 hover:bg-slate-700"
                >
                  {website.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-slate-800 border-slate-600 text-slate-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem
                value="7d"
                className="text-slate-200 hover:bg-slate-700"
              >
                7 days
              </SelectItem>
              <SelectItem
                value="30d"
                className="text-slate-200 hover:bg-slate-700"
              >
                30 days
              </SelectItem>
              <SelectItem
                value="90d"
                className="text-slate-200 hover:bg-slate-700"
              >
                90 days
              </SelectItem>
              <SelectItem
                value="1y"
                className="text-slate-200 hover:bg-slate-700"
              >
                1 year
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="border-slate-600 text-slate-200 hover:bg-slate-800 bg-transparent"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewStats.map((stat, index) => (
          <Card key={index} className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-100">
                    {stat.value}
                  </p>
                  <div className="flex items-center mt-2">
                    {stat.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-neon-green mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-400 mr-1" />
                    )}
                    <span
                      className={`text-sm ${
                        stat.trend === "up" ? "text-neon-green" : "text-red-400"
                      }`}
                    >
                      {stat.change}
                    </span>
                  </div>
                </div>
                {stat.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger
            value="performance"
            className="data-[state=active]:bg-slate-700"
          >
            Performance
          </TabsTrigger>
          <TabsTrigger
            value="issues"
            className="data-[state=active]:bg-slate-700"
          >
            Issues
          </TabsTrigger>
          <TabsTrigger
            value="devices"
            className="data-[state=active]:bg-slate-700"
          >
            Devices
          </TabsTrigger>
          <TabsTrigger
            value="trends"
            className="data-[state=active]:bg-slate-700"
          >
            Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">
                  Performance Metrics
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Current scores vs previous period
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData.performanceMetrics.map((metric, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">{metric.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${metric.color}`}>
                          {metric.current}
                        </span>
                        <span className="text-slate-500 text-sm">
                          ({metric.previous})
                        </span>
                        {metric.current > metric.previous ? (
                          <TrendingUp className="h-4 w-4 text-neon-green" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className="bg-electric-blue h-2 rounded-full transition-all duration-300"
                        style={{ width: `${metric.current}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Score Distribution */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">
                  Score Distribution
                </CardTitle>
                <CardDescription className="text-slate-400">
                  How your websites are performing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Excellent (90-100)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-800 rounded-full h-2">
                        <div
                          className="bg-neon-green h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${analyticsData.scoreDistribution.excellent}%`,
                          }}
                        />
                      </div>
                      <span className="text-slate-400 text-sm">
                        {analyticsData.scoreDistribution.excellent}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Good (70-89)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-800 rounded-full h-2">
                        <div
                          className="bg-electric-blue h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${analyticsData.scoreDistribution.good}%`,
                          }}
                        />
                      </div>
                      <span className="text-slate-400 text-sm">
                        {analyticsData.scoreDistribution.good}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Needs Work (50-69)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-800 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${analyticsData.scoreDistribution.needsWork}%`,
                          }}
                        />
                      </div>
                      <span className="text-slate-400 text-sm">
                        {analyticsData.scoreDistribution.needsWork}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Poor (0-49)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-800 rounded-full h-2">
                        <div
                          className="bg-red-400 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${analyticsData.scoreDistribution.poor}%`,
                          }}
                        />
                      </div>
                      <span className="text-slate-400 text-sm">
                        {analyticsData.scoreDistribution.poor}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="issues" className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">
                Top Issues Across All Sites
              </CardTitle>
              <CardDescription className="text-slate-400">
                Most common issues found in your analyses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topIssues.length > 0 ? (
                  analyticsData.topIssues.map((issue, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 font-mono text-sm">
                          #{index + 1}
                        </span>
                        <div>
                          <h4 className="font-medium text-slate-200">
                            {issue.issue}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getSeverityColor(issue.severity)}>
                              {issue.severity}
                            </Badge>
                            <span className="text-slate-500 text-sm">
                              {issue.count} occurrences
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(issue.trend)}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-slate-200"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400">
                      No issues found in the selected time period
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">
                  Device Breakdown
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Analysis distribution by device type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData.deviceStats.map((device, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {device.device === "Mobile" ? (
                          <Smartphone className="h-5 w-5" />
                        ) : (
                          <Monitor className="h-5 w-5" />
                        )}
                        <span className="text-slate-300">{device.device}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-sm">
                          {device.count}
                        </span>
                        <span className="font-bold text-slate-200">
                          {device.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className="bg-electric-blue h-2 rounded-full transition-all duration-300"
                        style={{ width: `${device.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">
                  Mobile Performance
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Mobile-specific metrics and issues
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-electric-blue">72</p>
                    <p className="text-sm text-slate-400">Mobile Score</p>
                  </div>
                  <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-400">3.2s</p>
                    <p className="text-sm text-slate-400">Mobile Load Time</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-200">
                    Common Mobile Issues:
                  </h4>
                  <ul className="space-y-1 text-sm text-slate-400">
                    <li>• Touch targets too small</li>
                    <li>• Text too small to read</li>
                    <li>• Content wider than screen</li>
                    <li>• Slow loading images</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">
                Performance Trends
              </CardTitle>
              <CardDescription className="text-slate-400">
                Track improvements over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chart visualization would be implemented here</p>
                  <p className="text-sm">
                    Using a charting library like Chart.js or Recharts
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Options */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-100 mb-1">
                Export Analytics Data
              </h3>
              <p className="text-sm text-slate-400">
                Download your analytics data for external analysis
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-slate-600 text-slate-200 hover:bg-slate-800 bg-transparent"
                onClick={() => handleExport("csv")}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Export CSV
              </Button>
              <Button
                variant="outline"
                className="border-slate-600 text-slate-200 hover:bg-slate-800 bg-transparent"
                onClick={() => handleExport("pdf")}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Export PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
