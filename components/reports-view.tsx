"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Download,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Trash2,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import Link from "next/link";

interface Report {
  id: string;
  title: string;
  website: string;
  domain?: string;
  date: string;
  status: "completed" | "processing" | "failed" | "pending";
  score: number;
  issues: number;
  type: "seo" | "performance" | "security" | "accessibility";
  size: string;
  // Additional fields from API
  url?: string;
  description?: string;
  scores?: {
    seo?: number;
    performance?: number;
    accessibility?: number;
    security?: number;
  };
  suggestions?: any;
  paymentStatus?: string;
  plan?: string;
  generatedSiteUrl?: string;
  generatedAt?: string;
  updatedAt?: string;
}

export function ReportsView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingReport, setDeletingReport] = useState<string | null>(null);
  const [downloadingReport, setDownloadingReport] = useState<string | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const { toast } = useToast();

  // Fetch reports from API
  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedFilter !== "all") {
        if (
          ["completed", "processing", "failed", "pending"].includes(
            selectedFilter
          )
        ) {
          params.append("status", selectedFilter);
        } else {
          params.append("type", selectedFilter);
        }
      }

      const response = await authClient.authenticatedFetch(
        `/api/reports?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch reports");
      }

      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch reports");
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch reports on component mount and when filters change
  useEffect(() => {
    fetchReports();
  }, [searchTerm, selectedFilter]);

  // Handle view report
  const handleViewReport = (report: Report) => {
    // Navigate to the report detail page
    window.open(`/dashboard/reports/${report.id}`, "_blank");
  };

  // Handle download report
  const handleDownloadReport = async (report: Report) => {
    if (report.status !== "completed") {
      toast({
        title: "Cannot Download",
        description: "Only completed reports can be downloaded",
        variant: "destructive",
      });
      return;
    }

    setDownloadingReport(report.id);
    try {
      const response = await authClient.authenticatedFetch(
        `/api/reports/${report.id}/download`
      );

      if (!response.ok) {
        throw new Error("Failed to download report");
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get("content-disposition");
      let filename = `zenith-report-${report.domain || report.website}-${
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
      setDownloadingReport(null);
    }
  };

  // Handle delete report confirmation
  const handleDeleteClick = (report: Report) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  };

  // Handle delete report
  const handleDeleteReport = async () => {
    if (!reportToDelete) return;

    setDeletingReport(reportToDelete.id);
    try {
      const response = await authClient.authenticatedFetch(
        `/api/reports/${reportToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete report");
      }

      // Remove the report from the list
      setReports(reports.filter((r) => r.id !== reportToDelete.id));

      toast({
        title: "Report Deleted",
        description: "Report has been successfully deleted",
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingReport(null);
      setDeleteDialogOpen(false);
      setReportToDelete(null);
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case "seo":
        return "bg-electric-blue/10 text-electric-blue border-electric-blue/20";
      case "performance":
        return "bg-neon-green/10 text-neon-green border-neon-green/20";
      case "security":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "accessibility":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const completedReports = reports.filter((r) => r.status === "completed");
  const processingReports = reports.filter((r) => r.status === "processing");
  const totalIssues = completedReports.reduce((sum, r) => sum + r.issues, 0);
  const avgScore =
    completedReports.length > 0
      ? Math.round(
          completedReports.reduce((sum, r) => sum + r.score, 0) /
            completedReports.length
        )
      : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Reports</h1>
          <p className="text-slate-400">
            View and manage your website analysis reports
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-electric-blue" />
          <span className="ml-2 text-slate-400">Loading reports...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Reports</h1>
          <p className="text-slate-400">
            View and manage your website analysis reports
          </p>
        </div>
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">
              Error loading reports
            </h3>
            <p className="text-slate-500 mb-4">{error}</p>
            <Button
              onClick={fetchReports}
              className="bg-electric-blue hover:bg-cyan-500 text-slate-900 font-semibold"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Reports</h1>
        <p className="text-slate-400">
          View and manage your website analysis reports
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Reports</p>
                <p className="text-2xl font-bold text-slate-100">
                  {reports.length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-electric-blue" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Completed</p>
                <p className="text-2xl font-bold text-neon-green">
                  {completedReports.length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-neon-green" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Average Score</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {avgScore}/100
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Issues</p>
                <p className="text-2xl font-bold text-red-400">{totalIssues}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-600 text-slate-100 focus:border-electric-blue w-64"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-slate-600 text-slate-200 hover:bg-slate-800 bg-transparent"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-800 border-slate-700">
              <DropdownMenuItem
                onClick={() => setSelectedFilter("all")}
                className="text-slate-200 hover:bg-slate-700"
              >
                All Reports
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedFilter("completed")}
                className="text-slate-200 hover:bg-slate-700"
              >
                Completed
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedFilter("processing")}
                className="text-slate-200 hover:bg-slate-700"
              >
                Processing
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedFilter("failed")}
                className="text-slate-200 hover:bg-slate-700"
              >
                Failed
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedFilter("seo")}
                className="text-slate-200 hover:bg-slate-700"
              >
                SEO Reports
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedFilter("performance")}
                className="text-slate-200 hover:bg-slate-700"
              >
                Performance Reports
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Link href="/dashboard">
          <Button className="bg-electric-blue hover:bg-cyan-500 text-slate-900 font-semibold">
            <FileText className="mr-2 h-4 w-4" />
            New Analysis
          </Button>
        </Link>
      </div>

      {/* Reports List */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger
            value="list"
            className="data-[state=active]:bg-slate-700"
          >
            List View
          </TabsTrigger>
          <TabsTrigger
            value="grid"
            className="data-[state=active]:bg-slate-700"
          >
            Grid View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {reports.map((report) => (
            <Card
              key={report.id}
              className="bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-colors"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-800 rounded-lg">
                      <Globe className="h-6 w-6 text-electric-blue" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-100 mb-1">
                        {report.title}
                      </h3>
                      <p className="text-sm text-slate-400">{report.website}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getStatusColor(report.status)}>
                          {getStatusIcon(report.status)}
                          <span className="ml-1">{report.status}</span>
                        </Badge>
                        <Badge className={getTypeColor(report.type)}>
                          {report.type}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {report.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {report.status === "completed" && (
                      <>
                        <div className="text-center">
                          <p className="text-sm text-slate-400">Score</p>
                          <p className="text-lg font-bold text-electric-blue">
                            {report.score}/100
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-slate-400">Issues</p>
                          <p className="text-lg font-bold text-red-400">
                            {report.issues}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-slate-400">Size</p>
                          <p className="text-lg font-bold text-slate-300">
                            {report.size}
                          </p>
                        </div>
                      </>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-slate-200"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-700">
                        <DropdownMenuItem
                          className="text-slate-200 hover:bg-slate-700"
                          onClick={() => handleViewReport(report)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Report
                        </DropdownMenuItem>
                        {report.status === "completed" && (
                          <DropdownMenuItem
                            className="text-slate-200 hover:bg-slate-700"
                            onClick={() => handleDownloadReport(report)}
                            disabled={downloadingReport === report.id}
                          >
                            {downloadingReport === report.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="mr-2 h-4 w-4" />
                            )}
                            Download PDF
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-red-400 hover:bg-slate-700"
                          onClick={() => handleDeleteClick(report)}
                          disabled={deletingReport === report.id}
                        >
                          {deletingReport === report.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}
                          Delete Report
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent
          value="grid"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {reports.map((report) => (
            <Card
              key={report.id}
              className="bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-slate-800 rounded-lg">
                    <Globe className="h-6 w-6 text-electric-blue" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-slate-200"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-800 border-slate-700">
                      <DropdownMenuItem
                        className="text-slate-200 hover:bg-slate-700"
                        onClick={() => handleViewReport(report)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Report
                      </DropdownMenuItem>
                      {report.status === "completed" && (
                        <DropdownMenuItem
                          className="text-slate-200 hover:bg-slate-700"
                          onClick={() => handleDownloadReport(report)}
                          disabled={downloadingReport === report.id}
                        >
                          {downloadingReport === report.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          Download PDF
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-red-400 hover:bg-slate-700"
                        onClick={() => handleDeleteClick(report)}
                        disabled={deletingReport === report.id}
                      >
                        {deletingReport === report.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete Report
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="text-lg text-slate-100">
                  {report.title}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {report.website}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(report.status)}>
                      {getStatusIcon(report.status)}
                      <span className="ml-1">{report.status}</span>
                    </Badge>
                    <Badge className={getTypeColor(report.type)}>
                      {report.type}
                    </Badge>
                  </div>

                  {report.status === "completed" && (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="text-center">
                        <p className="text-xs text-slate-400">Score</p>
                        <p className="text-lg font-bold text-electric-blue">
                          {report.score}/100
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400">Issues</p>
                        <p className="text-lg font-bold text-red-400">
                          {report.issues}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                    <span className="text-xs text-slate-500">
                      {report.date}
                    </span>
                    <span className="text-xs text-slate-500">
                      {report.size}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {reports.length === 0 && (
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">
              No reports found
            </h3>
            <p className="text-slate-500 mb-4">
              {searchTerm || selectedFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Create your first website analysis report"}
            </p>
            <Button className="bg-electric-blue hover:bg-cyan-500 text-slate-900 font-semibold">
              <FileText className="mr-2 h-4 w-4" />
              New Analysis
            </Button>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteReport}
        title="Delete Report"
        description={`Are you sure you want to delete "${reportToDelete?.title}"? This action cannot be undone and all analysis data will be permanently removed.`}
        confirmText="Delete Report"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
