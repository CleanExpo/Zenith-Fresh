"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { authClient } from "@/lib/auth-client";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Code,
  Download,
  Eye,
  Loader2,
  Rocket,
  Search,
  Sparkles,
  XCircle,
  Zap,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { SubscriptionModal } from "./subscription-modal";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

interface AnalysisResult {
  url: string;
  score: number;
  analysisId?: string;
  issues: Array<{
    category: string;
    severity: "critical" | "high" | "medium" | "low";
    title: string;
    description: string;
    solution: string;
    pageUrl?: string;
    impact: string;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    impact: string;
    priority: "high" | "medium" | "low";
  }>;
  technicalDetails: {
    loadTime: number;
    mobileScore: number;
    seoScore: number;
    accessibilityScore: number;
    performanceScore: number;
    securityScore: number;
    totalPages: number;
    totalImages: number;
    totalLinks: number;
  };
  analysisDate: string;
  multiPageAudit?: {
    totalPagesAnalyzed: number;
    seoScore: number;
    contentScore: number;
    technicalScore: number;
    siteWideIssues: Array<{
      issue: string;
      severity: "critical" | "high" | "medium" | "low";
      description: string;
      fix: string;
      affectedPages: string[];
      impact: string;
    }>;
    allAnalyzedPages: Array<{
      url: string;
      title: string;
      description: string;
      wordCount: number;
      seoIssues: Array<{
        issue: string;
        severity: "critical" | "high" | "medium" | "low";
        description: string;
        fix: string;
      }>;
      contentIssues: Array<{
        issue: string;
        severity: "critical" | "high" | "medium" | "low";
        description: string;
        fix: string;
      }>;
      technicalIssues: Array<{
        issue: string;
        severity: "critical" | "high" | "medium" | "low";
        description: string;
        fix: string;
      }>;
    }>;
    websiteGenerationPrompt: string;
  };
}

interface GeneratedWebsite {
  websiteUrl: string;
  auditSummary: any;
  generatedAt: string;
}

export function WebsiteAnalyzer() {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const { user, loading, refreshSubscription } = useAuth();
  const router = useRouter();

  // Check subscription status with fallback
  const hasActiveSubscription =
    !!user?.subscription && user.subscription.status === "ACTIVE";

  const handleRefreshSubscription = async () => {
    setIsRefreshing(true);
    try {
      const updatedUser = await refreshSubscription();
      if (updatedUser) {
        toast({
          title: "Subscription refreshed",
          description: "Your subscription data has been updated.",
        });
      } else {
        toast({
          title: "Refresh failed",
          description: "Unable to refresh subscription data.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to refresh subscription:", error);
      toast({
        title: "Refresh failed",
        description: "Unable to refresh subscription data.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const analyzeWebsite = async () => {
    if (!websiteUrl) {
      toast({
        title: "Missing information",
        description: "Please provide website URL",
        variant: "destructive",
      });
      return;
    }

    // Force refresh subscription status before checking
    const updatedUser = await refreshSubscription();
    const hasActiveSubscription =
      !!updatedUser?.subscription &&
      updatedUser.subscription.status === "ACTIVE";

    if (!hasActiveSubscription) {
      router.push("/dashboard/upgrade");
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await authClient.authenticatedFetch(
        "/api/analyze-website",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: websiteUrl,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const result = await response.json();
      setAnalysisResult(result);

      toast({
        title: "Analysis complete!",
        description: `Found ${result.issues.length} issues across ${result.technicalDetails.totalPages} pages.`,
      });
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "Unable to analyze the website. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateNewWebsite = async () => {
    if (!analysisResult || !analysisResult.multiPageAudit) {
      toast({
        title: "Missing data",
        description:
          "Please complete the analysis first to get comprehensive audit data.",
        variant: "destructive",
      });
      return;
    }

    // Check subscription status before proceeding
    const updatedUser = await refreshSubscription();
    const hasActiveSubscription =
      !!updatedUser?.subscription &&
      updatedUser.subscription.status === "ACTIVE";

    if (!hasActiveSubscription) {
      // Show subscription modal only if user doesn't have active subscription
      setShowSubscriptionModal(true);
      return;
    }

    // User has active subscription, proceed with website generation
    setIsGenerating(true);

    try {
      const response = await authClient.authenticatedFetch(
        "/api/website/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysisId: analysisResult.analysisId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate website");
      }

      const result = await response.json();

      // Redirect to the generated website
      if (result.generatedSiteUrl) {
        window.open(result.generatedSiteUrl, "_blank");

        toast({
          title: "Website Generated Successfully!",
          description:
            "Your new professional website has been created and opened in a new tab.",
        });
      } else {
        throw new Error("No generated site URL returned");
      }
    } catch (error) {
      toast({
        title: "Generation failed",
        description:
          error instanceof Error
            ? error.message
            : "Unable to generate the website. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubscriptionSuccess = async () => {
    setIsGenerating(true);

    try {
      const generateResponse = await authClient.authenticatedFetch(
        "/api/website/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysisId: analysisResult!.analysisId,
          }),
        }
      );

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.error || "Failed to generate website");
      }

      const generatedResult = await generateResponse.json();

      // Open the generated website in a new tab
      if (generatedResult.generatedSiteUrl) {
        window.open(generatedResult.generatedSiteUrl, "_blank");

        toast({
          title: "Website Generated Successfully!",
          description:
            "Your new professional website has been created and opened in a new tab.",
        });
      } else {
        throw new Error("No generated site URL returned");
      }
    } catch (error) {
      toast({
        title: "Generation failed",
        description:
          error instanceof Error
            ? error.message
            : "Unable to generate the website. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setShowSubscriptionModal(false);
    }
  };

  const getFileType = (filename: string): string => {
    const extension = filename.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "html":
        return "text/html";
      case "css":
        return "text/css";
      case "js":
        return "text/javascript";
      case "json":
        return "application/json";
      case "txt":
        return "text/plain";
      case "xml":
        return "application/xml";
      default:
        return "text/plain";
    }
  };

  const exportReport = async () => {
    if (!analysisResult) {
      toast({
        title: "No analysis data",
        description: "Please complete an analysis first.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      const response = await authClient.authenticatedFetch(
        "/api/export-report",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysisId: analysisResult.analysisId,
            analysisData: analysisResult,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `website-analysis-${analysisResult.url.replace(
        /[^a-zA-Z0-9]/g,
        "-"
      )}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Report exported!",
        description: "Your PDF report has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Unable to export the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-600/10 text-red-300 border-red-600/20";
      case "high":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "low":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4" />;
      case "high":
        return <XCircle className="h-4 w-4" />;
      case "medium":
        return <AlertTriangle className="h-4 w-4" />;
      case "low":
        return <Eye className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "low":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">
            Website Analyzer
          </h1>
          <p className="text-slate-400">
            Enter your website URL to get a comprehensive SEO and UX analysis
          </p>
        </div>
        {!loading && (
          <div className="text-right">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshSubscription}
                disabled={isRefreshing}
                className="h-6 w-6 p-0"
                title="Refresh subscription"
              >
                <RefreshCw
                  className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
            {user?.subscription && (
              <p className="text-xs text-slate-400">
                {user.subscription.plan === "MONTHLY_HEALTH_CHECK"
                  ? "Monthly Health Check"
                  : user.subscription.plan}
                {user.subscription.status !== "ACTIVE" && (
                  <span className="text-yellow-400 ml-1">
                    ({user.subscription.status})
                  </span>
                )}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Website Analysis Form */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <Search className="h-5 w-5 text-electric-blue" />
            Analyze Website
          </CardTitle>
          <CardDescription className="text-slate-400">
            Get detailed insights about your website's performance and SEO
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="website-url" className="text-slate-200">
              Website URL
            </Label>
            <Input
              id="website-url"
              type="url"
              placeholder="https://example.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="bg-slate-800 border-slate-600 text-slate-100 focus:border-electric-blue"
            />
          </div>

          <Button
            onClick={analyzeWebsite}
            disabled={isAnalyzing || !websiteUrl}
            className="w-full bg-electric-blue hover:bg-cyan-500 text-slate-900 font-semibold"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing website...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Analyze Website
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Overall Score</p>
                    <p className="text-2xl font-bold text-slate-100">
                      {analysisResult.score}/100
                    </p>
                  </div>
                  <div className="text-3xl">📊</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">SEO Score</p>
                    <p className="text-2xl font-bold text-slate-100">
                      {analysisResult.technicalDetails.seoScore}/100
                    </p>
                  </div>
                  <div className="text-3xl">🔍</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Pages Analyzed</p>
                    <p className="text-2xl font-bold text-slate-100">
                      {analysisResult.technicalDetails.totalPages}
                    </p>
                  </div>
                  <div className="text-3xl">📄</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Issues Found</p>
                    <p className="text-2xl font-bold text-slate-100">
                      {analysisResult.issues.length}
                    </p>
                  </div>
                  <div className="text-3xl">⚠️</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Scores */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-slate-400">Performance</p>
                  <p className="text-xl font-bold text-slate-100">
                    {analysisResult.technicalDetails.performanceScore}/100
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-400">Accessibility</p>
                  <p className="text-xl font-bold text-slate-100">
                    {analysisResult.technicalDetails.accessibilityScore}/100
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-400">Security</p>
                  <p className="text-xl font-bold text-slate-100">
                    {analysisResult.technicalDetails.securityScore}/100
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-400">Load Time</p>
                  <p className="text-xl font-bold text-slate-100">
                    {analysisResult.technicalDetails.loadTime.toFixed(1)}s
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issues by Priority */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">
                Issues by Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="critical" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="critical">Critical</TabsTrigger>
                  <TabsTrigger value="high">High</TabsTrigger>
                  <TabsTrigger value="medium">Medium</TabsTrigger>
                  <TabsTrigger value="low">Low</TabsTrigger>
                </TabsList>

                <TabsContent value="critical" className="space-y-4">
                  {analysisResult.issues.filter(
                    (issue) => issue.severity === "critical"
                  ).length > 0 ? (
                    analysisResult.issues
                      .filter((issue) => issue.severity === "critical")
                      .map((issue, index) => (
                        <div
                          key={index}
                          className="border-l-4 border-red-500 bg-red-500/10 p-4 rounded-r-lg"
                        >
                          <h4 className="font-semibold text-red-400">
                            {issue.title}
                          </h4>
                          <p className="text-slate-300 text-sm mt-1">
                            {issue.description}
                          </p>
                          <p className="text-slate-400 text-sm mt-2">
                            <strong>Solution:</strong> {issue.solution}
                          </p>
                        </div>
                      ))
                  ) : (
                    <p className="text-slate-400 text-center py-4">
                      No critical issues found! 🎉
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="high" className="space-y-4">
                  {analysisResult.issues.filter(
                    (issue) => issue.severity === "high"
                  ).length > 0 ? (
                    analysisResult.issues
                      .filter((issue) => issue.severity === "high")
                      .map((issue, index) => (
                        <div
                          key={index}
                          className="border-l-4 border-orange-500 bg-orange-500/10 p-4 rounded-r-lg"
                        >
                          <h4 className="font-semibold text-orange-400">
                            {issue.title}
                          </h4>
                          <p className="text-slate-300 text-sm mt-1">
                            {issue.description}
                          </p>
                          <p className="text-slate-400 text-sm mt-2">
                            <strong>Solution:</strong> {issue.solution}
                          </p>
                        </div>
                      ))
                  ) : (
                    <p className="text-slate-400 text-center py-4">
                      No high priority issues found! 👍
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="medium" className="space-y-4">
                  {analysisResult.issues.filter(
                    (issue) => issue.severity === "medium"
                  ).length > 0 ? (
                    analysisResult.issues
                      .filter((issue) => issue.severity === "medium")
                      .map((issue, index) => (
                        <div
                          key={index}
                          className="border-l-4 border-yellow-500 bg-yellow-500/10 p-4 rounded-r-lg"
                        >
                          <h4 className="font-semibold text-yellow-400">
                            {issue.title}
                          </h4>
                          <p className="text-slate-300 text-sm mt-1">
                            {issue.description}
                          </p>
                          <p className="text-slate-400 text-sm mt-2">
                            <strong>Solution:</strong> {issue.solution}
                          </p>
                        </div>
                      ))
                  ) : (
                    <p className="text-slate-400 text-center py-4">
                      No medium priority issues found! 👌
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="low" className="space-y-4">
                  {analysisResult.issues.filter(
                    (issue) => issue.severity === "low"
                  ).length > 0 ? (
                    analysisResult.issues
                      .filter((issue) => issue.severity === "low")
                      .map((issue, index) => (
                        <div
                          key={index}
                          className="border-l-4 border-green-500 bg-green-500/10 p-4 rounded-r-lg"
                        >
                          <h4 className="font-semibold text-green-400">
                            {issue.title}
                          </h4>
                          <p className="text-slate-300 text-sm mt-1">
                            {issue.description}
                          </p>
                          <p className="text-slate-400 text-sm mt-2">
                            <strong>Solution:</strong> {issue.solution}
                          </p>
                        </div>
                      ))
                  ) : (
                    <p className="text-slate-400 text-center py-4">
                      No low priority issues found! 🌟
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisResult.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-blue-500 bg-blue-500/10 p-4 rounded-r-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-400">
                          {rec.title}
                        </h4>
                        <p className="text-slate-300 text-sm mt-1">
                          {rec.description}
                        </p>
                        <p className="text-slate-400 text-sm mt-2">
                          <strong>Impact:</strong> {rec.impact}
                        </p>
                      </div>
                      <Badge
                        variant={
                          rec.priority === "high"
                            ? "destructive"
                            : rec.priority === "medium"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {rec.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Multi-Page Audit Summary */}
          {analysisResult.multiPageAudit && (
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">
                  Multi-Page Audit Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-slate-400">SEO Score</p>
                    <p className="text-xl font-bold text-slate-100">
                      {analysisResult.multiPageAudit.seoScore}/100
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-400">Content Score</p>
                    <p className="text-xl font-bold text-slate-100">
                      {analysisResult.multiPageAudit.contentScore}/100
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-400">Technical Score</p>
                    <p className="text-xl font-bold text-slate-100">
                      {analysisResult.multiPageAudit.technicalScore}/100
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-100">
                    Pages Analyzed:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {analysisResult.multiPageAudit.allAnalyzedPages.map(
                      (page, index) => (
                        <div
                          key={index}
                          className="bg-slate-800/50 p-3 rounded-lg"
                        >
                          <p className="font-medium text-slate-200">
                            {page.title}
                          </p>
                          <p className="text-sm text-slate-400">{page.url}</p>
                          <p className="text-xs text-slate-500">
                            Word count: {page.wordCount}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={exportReport}
              disabled={isExporting}
              className="flex-1 bg-electric-blue hover:bg-electric-blue/90"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>📄 Export PDF Report</>
              )}
            </Button>

            {analysisResult.multiPageAudit && (
              <Button
                onClick={generateNewWebsite}
                disabled={isGenerating}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Website...
                  </>
                ) : (
                  <>🚀 Generate New Website</>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSuccess={handleSubscriptionSuccess}
        websiteUrl={analysisResult?.url}
      />
    </div>
  );
}
