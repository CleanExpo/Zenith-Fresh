"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Globe,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Download,
  ExternalLink,
  TrendingUp,
  Shield,
  Zap,
  Eye,
  Target,
  Calendar,
  FileText,
  Lightbulb,
  Settings,
  Users,
  Activity,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/hooks/use-toast";
import { ScoreCalculator } from "@/lib/score-calculator";

interface ReportDetail {
  id: string;
  title: string;
  url: string;
  domain: string;
  description?: string;
  seoScore?: number;
  performanceScore?: number;
  accessibilityScore?: number;
  bestPracticesScore?: number;
  issues?: any[];
  suggestions?: any;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await authClient.authenticatedFetch(
          `/api/reports/${reportId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch report");
        }

        const data = await response.json();
        setReport(data.report);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch report");
      } finally {
        setLoading(false);
      }
    };

    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  // Handle download report
  const handleDownloadReport = async () => {
    if (!report || report.status !== "completed") {
      toast({
        title: "Cannot Download",
        description: "Only completed reports can be downloaded",
        variant: "destructive",
      });
      return;
    }

    setDownloadingReport(true);
    try {
      const response = await authClient.authenticatedFetch(
        `/api/reports/${report.id}/download`
      );

      if (!response.ok) {
        throw new Error("Failed to download report");
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get("content-disposition");
      let filename = `zenith-report-${report.domain}-${
        new Date().toISOString().split("T")[0]
      }.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Successful",
        description: "Professional PDF report has been downloaded successfully",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingReport(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "processing":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "failed":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "pending":
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "processing":
        return <Clock className="h-4 w-4" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    return ScoreCalculator.getScoreColor(score);
  };

  const getScoreBgColor = (score: number) => {
    return ScoreCalculator.getScoreBgColor(score);
  };

  const calculatedScores = report
    ? ScoreCalculator.getAllScores({
        seoScore: report.seoScore,
        performanceScore: report.performanceScore,
        accessibilityScore: report.accessibilityScore,
        bestPracticesScore: report.bestPracticesScore,
      })
    : {
        overall: 0,
        seo: 0,
        performance: 0,
        accessibility: 0,
        security: 0,
        content: 0,
      };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-electric-blue" />
          <span className="ml-2 text-slate-400">Loading report...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !report) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reports
            </Button>
          </div>
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-12 text-center">
              <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-300 mb-2">
                Error loading report
              </h3>
              <p className="text-slate-500">{error}</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const issues = report.issues || [];
  const suggestions = report.suggestions || {};
  const aiSuggestions = suggestions.aiGenerated || [];
  const recommendations = suggestions.recommendations || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reports
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-2xl font-bold text-slate-100">
                {report.title}
              </h1>
              <p className="text-slate-400 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {report.url}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(report.status)}>
              {getStatusIcon(report.status)}
              <span className="ml-1 capitalize">{report.status}</span>
            </Badge>
            {report.status === "completed" && (
              <Button
                onClick={handleDownloadReport}
                disabled={downloadingReport}
                className="bg-electric-blue hover:bg-cyan-500 text-slate-900 font-semibold"
              >
                {downloadingReport ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download PDF
              </Button>
            )}
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Overall Score</p>
                  <p
                    className={`text-2xl font-bold ${getScoreColor(
                      calculatedScores.overall
                    )}`}
                  >
                    {calculatedScores.overall}/100
                  </p>
                </div>
                <div className="p-3 bg-electric-blue/10 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-electric-blue" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">SEO Score</p>
                  <p
                    className={`text-2xl font-bold ${getScoreColor(
                      calculatedScores.seo
                    )}`}
                  >
                    {calculatedScores.seo}/100
                  </p>
                </div>
                <div className="p-3 bg-electric-blue/10 rounded-lg">
                  <Target className="h-6 w-6 text-electric-blue" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Performance</p>
                  <p
                    className={`text-2xl font-bold ${getScoreColor(
                      calculatedScores.performance
                    )}`}
                  >
                    {calculatedScores.performance}/100
                  </p>
                </div>
                <div className="p-3 bg-neon-green/10 rounded-lg">
                  <Zap className="h-6 w-6 text-neon-green" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Issues Found</p>
                  <p className="text-2xl font-bold text-red-400">
                    {issues.length}
                  </p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Scores */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-electric-blue" />
              Detailed Performance Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                className={`p-4 rounded-lg border ${getScoreBgColor(
                  report.seoScore || 0
                )}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Target className="h-5 w-5 text-electric-blue" />
                  <span className="font-semibold text-slate-200">SEO</span>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-2xl font-bold ${getScoreColor(
                      calculatedScores.seo
                    )}`}
                  >
                    {calculatedScores.seo}
                  </span>
                  <span className="text-sm text-slate-400">/100</span>
                </div>
                <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      calculatedScores.seo >= 90
                        ? "bg-green-500"
                        : calculatedScores.seo >= 70
                        ? "bg-yellow-500"
                        : calculatedScores.seo >= 50
                        ? "bg-orange-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${calculatedScores.seo}%` }}
                  ></div>
                </div>
              </div>

              <div
                className={`p-4 rounded-lg border ${getScoreBgColor(
                  report.performanceScore || 0
                )}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="h-5 w-5 text-neon-green" />
                  <span className="font-semibold text-slate-200">
                    Performance
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-2xl font-bold ${getScoreColor(
                      calculatedScores.performance
                    )}`}
                  >
                    {calculatedScores.performance}
                  </span>
                  <span className="text-sm text-slate-400">/100</span>
                </div>
                <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      calculatedScores.performance >= 90
                        ? "bg-green-500"
                        : calculatedScores.performance >= 70
                        ? "bg-yellow-500"
                        : calculatedScores.performance >= 50
                        ? "bg-orange-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${calculatedScores.performance}%` }}
                  ></div>
                </div>
              </div>

              <div
                className={`p-4 rounded-lg border ${getScoreBgColor(
                  calculatedScores.accessibility
                )}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Users className="h-5 w-5 text-purple-400" />
                  <span className="font-semibold text-slate-200">
                    Accessibility
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-2xl font-bold ${getScoreColor(
                      calculatedScores.accessibility
                    )}`}
                  >
                    {calculatedScores.accessibility}
                  </span>
                  <span className="text-sm text-slate-400">/100</span>
                </div>
                <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      calculatedScores.accessibility >= 90
                        ? "bg-green-500"
                        : calculatedScores.accessibility >= 70
                        ? "bg-yellow-500"
                        : calculatedScores.accessibility >= 50
                        ? "bg-orange-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${calculatedScores.accessibility}%` }}
                  ></div>
                </div>
              </div>

              <div
                className={`p-4 rounded-lg border ${getScoreBgColor(
                  calculatedScores.security
                )}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="h-5 w-5 text-orange-400" />
                  <span className="font-semibold text-slate-200">Security</span>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-2xl font-bold ${getScoreColor(
                      calculatedScores.security
                    )}`}
                  >
                    {calculatedScores.security}
                  </span>
                  <span className="text-sm text-slate-400">/100</span>
                </div>
                <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      calculatedScores.security >= 90
                        ? "bg-green-500"
                        : calculatedScores.security >= 70
                        ? "bg-yellow-500"
                        : calculatedScores.security >= 50
                        ? "bg-orange-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${calculatedScores.security}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Issues and Recommendations */}
        <Tabs defaultValue="issues" className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger
              value="issues"
              className="data-[state=active]:bg-slate-700"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Issues ({issues.length})
            </TabsTrigger>
            <TabsTrigger
              value="suggestions"
              className="data-[state=active]:bg-slate-700"
            >
              <Lightbulb className="mr-2 h-4 w-4" />
              AI Suggestions ({aiSuggestions.length})
            </TabsTrigger>
            <TabsTrigger
              value="recommendations"
              className="data-[state=active]:bg-slate-700"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Strategic Recommendations ({recommendations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="issues" className="space-y-4">
            {issues.length > 0 ? (
              issues.map((issue, index) => (
                <Card key={index} className="bg-slate-900/50 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-slate-100 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                        {issue.title || issue.category}
                      </CardTitle>
                      <Badge
                        className={
                          issue.severity === "critical"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : issue.severity === "high"
                            ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                            : issue.severity === "medium"
                            ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            : "bg-green-500/10 text-green-400 border-green-500/20"
                        }
                      >
                        {issue.severity || "medium"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 mb-3">{issue.description}</p>
                    {issue.impact && (
                      <div className="bg-slate-800/50 p-3 rounded-lg">
                        <p className="text-sm text-slate-400 mb-1">Impact:</p>
                        <p className="text-slate-200">{issue.impact}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-300 mb-2">
                    No Issues Found
                  </h3>
                  <p className="text-slate-500">
                    Great! No critical issues were detected in this analysis.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4">
            {aiSuggestions.length > 0 ? (
              aiSuggestions.map((suggestion, index) => (
                <Card key={index} className="bg-slate-900/50 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-slate-100 flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-400" />
                        {suggestion.title}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge className="bg-electric-blue/10 text-electric-blue border-electric-blue/20">
                          {suggestion.category}
                        </Badge>
                        <Badge
                          className={
                            suggestion.priority === "critical"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : suggestion.priority === "high"
                              ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                              : suggestion.priority === "medium"
                              ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                              : "bg-green-500/10 text-green-400 border-green-500/20"
                          }
                        >
                          {suggestion.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-300">{suggestion.description}</p>

                    {suggestion.examples && suggestion.examples.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-slate-400 mb-2">
                          Examples:
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          {suggestion.examples.map((example, i) => (
                            <li key={i} className="text-slate-300 text-sm">
                              {example}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {suggestion.implementation && (
                      <div className="bg-slate-800/50 p-3 rounded-lg">
                        <p className="text-sm font-semibold text-slate-400 mb-2">
                          Implementation:
                        </p>
                        <p className="text-slate-200 text-sm">
                          {suggestion.implementation}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {suggestion.estimatedEffort && (
                        <div className="bg-slate-800/50 p-3 rounded-lg">
                          <p className="text-sm text-slate-400">
                            Estimated Effort
                          </p>
                          <p className="text-slate-200 font-semibold">
                            {suggestion.estimatedEffort}
                          </p>
                        </div>
                      )}
                      {suggestion.expectedImprovement && (
                        <div className="bg-slate-800/50 p-3 rounded-lg">
                          <p className="text-sm text-slate-400">
                            Expected Improvement
                          </p>
                          <p className="text-slate-200 font-semibold">
                            {suggestion.expectedImprovement}
                          </p>
                        </div>
                      )}
                      <div className="bg-slate-800/50 p-3 rounded-lg">
                        <p className="text-sm text-slate-400">Impact</p>
                        <p className="text-slate-200 font-semibold">
                          {suggestion.impact}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-8 text-center">
                  <Lightbulb className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-300 mb-2">
                    No AI Suggestions Available
                  </h3>
                  <p className="text-slate-500">
                    AI suggestions will be generated for this report.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            {recommendations.length > 0 ? (
              recommendations.map((recommendation, index) => (
                <Card key={index} className="bg-slate-900/50 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-slate-100 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-400" />
                        {recommendation.title}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge className="bg-electric-blue/10 text-electric-blue border-electric-blue/20">
                          {recommendation.category}
                        </Badge>
                        <Badge
                          className={
                            recommendation.priority === "critical"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : recommendation.priority === "high"
                              ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                              : recommendation.priority === "medium"
                              ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                              : "bg-green-500/10 text-green-400 border-green-500/20"
                          }
                        >
                          {recommendation.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-300">
                      {recommendation.description}
                    </p>

                    {recommendation.stepByStepGuide &&
                      recommendation.stepByStepGuide.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-slate-400 mb-2">
                            Step-by-Step Guide:
                          </p>
                          <ol className="list-decimal list-inside space-y-1">
                            {recommendation.stepByStepGuide.map((step, i) => (
                              <li key={i} className="text-slate-300 text-sm">
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {recommendation.timeline && (
                        <div className="bg-slate-800/50 p-3 rounded-lg">
                          <p className="text-sm text-slate-400">Timeline</p>
                          <p className="text-slate-200 font-semibold">
                            {recommendation.timeline}
                          </p>
                        </div>
                      )}
                      {recommendation.cost && (
                        <div className="bg-slate-800/50 p-3 rounded-lg">
                          <p className="text-sm text-slate-400">
                            Estimated Cost
                          </p>
                          <p className="text-slate-200 font-semibold">
                            {recommendation.cost}
                          </p>
                        </div>
                      )}
                      <div className="bg-slate-800/50 p-3 rounded-lg">
                        <p className="text-sm text-slate-400">Impact</p>
                        <p className="text-slate-200 font-semibold">
                          {recommendation.impact}
                        </p>
                      </div>
                      {recommendation.tools &&
                        recommendation.tools.length > 0 && (
                          <div className="bg-slate-800/50 p-3 rounded-lg">
                            <p className="text-sm text-slate-400">
                              Recommended Tools
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {recommendation.tools.map((tool, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {tool}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-8 text-center">
                  <TrendingUp className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-300 mb-2">
                    No Strategic Recommendations Available
                  </h3>
                  <p className="text-slate-500">
                    Strategic recommendations will be generated for this report.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Report Metadata */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Settings className="h-5 w-5 text-slate-400" />
              Report Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-400">Created:</span>
                  <span className="text-slate-200">
                    {new Date(report.createdAt).toLocaleDateString()} at{" "}
                    {new Date(report.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-400">Last Updated:</span>
                  <span className="text-slate-200">
                    {new Date(report.updatedAt).toLocaleDateString()} at{" "}
                    {new Date(report.updatedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-400">Report ID:</span>
                  <span className="text-slate-200 font-mono text-sm">
                    {report.id}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-400">Domain:</span>
                  <span className="text-slate-200">{report.domain}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
