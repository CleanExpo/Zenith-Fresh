"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Code,
  BarChart3,
  Zap,
  Search,
  AlertTriangle,
  Rocket,
  Sparkles,
  Globe,
  Smartphone,
  Shield,
  TrendingUp,
  Monitor,
  SmartphoneIcon as Mobile,
  Tablet,
  Maximize2,
  Minimize2,
  RefreshCw,
  FileText,
} from "lucide-react";
import Link from "next/link";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { JSZipObject } from "jszip";

interface GeneratedWebsiteData {
  generatedFiles: Record<string, string>;
  auditSummary: {
    totalPages: number;
    seoScore: number;
    contentScore: number;
    technicalScore: number;
    criticalIssuesFixed: number;
    highIssuesFixed: number;
  };
  generatedAt: string;
}

export default function GeneratedWebsitePage() {
  const searchParams = useSearchParams();
  const [websiteData, setWebsiteData] = useState<GeneratedWebsiteData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState("index.html");
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Fetch website data by ID from the API
  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) {
      setIsLoading(false);
      setWebsiteData(null);
      return;
    }
    setIsLoading(true);
    fetch(`/api/generated-website?id=${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setWebsiteData({
          generatedFiles: data.generatedFiles,
          auditSummary: data.auditSummary,
          generatedAt: data.createdAt,
        });
        // Set preview URL for index.html
        if (data.generatedFiles["index.html"]) {
          const blob = new Blob([data.generatedFiles["index.html"]], {
            type: "text/html",
          });
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        }
      })
      .catch(() => {
        setWebsiteData(null);
      })
      .finally(() => setIsLoading(false));
  }, [searchParams]);

  // Update preview when current page changes
  useEffect(() => {
    if (websiteData?.generatedFiles[currentPage]) {
      // Clean up previous URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const blob = new Blob([websiteData.generatedFiles[currentPage]], {
        type: "text/html",
      });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    }
    // Cleanup function
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [currentPage, websiteData]);

  const downloadWebsite = () => {
    if (!websiteData) return;
    const zip = new JSZip();
    Object.entries(websiteData.generatedFiles).forEach(
      ([filename, content]) => {
        zip.file(filename, content);
      }
    );
    zip.generateAsync({ type: "blob" }).then((blob: Blob) => {
      saveAs(blob, "website.zip");
    });
  };

  const openWebsiteInNewTab = () => {
    if (!previewUrl) return;
    window.open(previewUrl, "_blank");
  };

  const getPreviewWidth = () => {
    switch (previewMode) {
      case "mobile":
        return "w-80";
      case "tablet":
        return "w-96";
      case "desktop":
        return "w-full";
      default:
        return "w-full";
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getPageDisplayName = (filename: string) => {
    const name = filename.replace(".html", "");
    return name.charAt(0).toUpperCase() + name.slice(1).replace("-", " ");
  };

  // Add a warning if any file is missing or too small
  const missingOrSmallFiles = Object.entries(
    websiteData?.generatedFiles || {}
  ).filter(([, content]) => !content || content.length < 1000);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-blue mx-auto mb-4"></div>
          <p className="text-slate-300">Loading your optimized website...</p>
        </div>
      </div>
    );
  }

  if (!websiteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-100 mb-4">
            Website Not Found
          </h1>
          <p className="text-slate-400 mb-6">
            The generated website data is not available.
          </p>
          <Link href="/dashboard">
            <Button className="bg-electric-blue hover:bg-cyan-500 text-slate-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Analyzer
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header Section */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-300 hover:text-white"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div className="h-6 w-px bg-slate-600"></div>
              <div className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-neon-green" />
                <h1 className="text-lg font-semibold text-slate-100">
                  Generated Website
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={openWebsiteInNewTab}
                className="bg-neon-green hover:bg-lime-400 text-slate-900 font-semibold"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Website
              </Button>
              <Button
                onClick={downloadWebsite}
                variant="outline"
                className="border-slate-600 text-slate-200 hover:bg-slate-800 bg-transparent"
              >
                <Download className="mr-2 h-4 w-4" />
                Download All Files
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-neon-green/10 text-neon-green px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">
                Professional Multi-Page Website Generated
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-100 mb-6">
              Your New Optimized Website
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              A completely revamped, modern, and SEO-optimized multi-page
              website with professional branding, built with the latest web
              technologies and best practices. Features{" "}
              {Object.keys(websiteData.generatedFiles).length} pages with strong
              visual hierarchy.
            </p>
          </div>

          {/* Audit Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">SEO Score</p>
                    <p className="text-2xl font-bold text-slate-100">
                      {websiteData.auditSummary.seoScore}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Search className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Content Score</p>
                    <p className="text-2xl font-bold text-slate-100">
                      {websiteData.auditSummary.contentScore}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Zap className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Technical Score</p>
                    <p className="text-2xl font-bold text-slate-100">
                      {websiteData.auditSummary.technicalScore}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Issues Fixed</p>
                    <p className="text-2xl font-bold text-slate-100">
                      {websiteData.auditSummary.criticalIssuesFixed +
                        websiteData.auditSummary.highIssuesFixed}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Website Preview */}
          <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
            <CardHeader className="bg-slate-800/50 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Code className="h-5 w-5 text-electric-blue" />
                  <div>
                    <CardTitle className="text-slate-100">
                      Website Preview
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Your optimized multi-page website with modern design and
                      SEO enhancements
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-neon-green/20 text-neon-green border-neon-green/30">
                    {Object.keys(websiteData.generatedFiles).length} Pages
                  </Badge>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    Responsive
                  </Badge>
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    SEO Optimized
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Page Selection */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-400">Select Page:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(websiteData.generatedFiles).map((filename) => (
                    <Button
                      key={filename}
                      variant={currentPage === filename ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(filename)}
                      className={
                        currentPage === filename
                          ? "bg-electric-blue text-slate-900"
                          : "border-slate-600 text-slate-200 hover:bg-slate-800"
                      }
                    >
                      {getPageDisplayName(filename)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Preview Controls */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">Preview Mode:</span>
                  <div className="flex items-center gap-1 bg-slate-700 rounded-lg p-1">
                    <Button
                      variant={previewMode === "desktop" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setPreviewMode("desktop")}
                      className="h-8 px-3"
                    >
                      <Monitor className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={previewMode === "tablet" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setPreviewMode("tablet")}
                      className="h-8 px-3"
                    >
                      <Tablet className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={previewMode === "mobile" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setPreviewMode("mobile")}
                      className="h-8 px-3"
                    >
                      <Mobile className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="border-slate-600 text-slate-200 hover:bg-slate-800 bg-transparent"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Refresh the current page preview
                      if (websiteData?.generatedFiles[currentPage]) {
                        const blob = new Blob(
                          [websiteData.generatedFiles[currentPage]],
                          { type: "text/html" }
                        );
                        const url = URL.createObjectURL(blob);
                        setPreviewUrl(url);
                      }
                    }}
                    className="border-slate-600 text-slate-200 hover:bg-slate-800"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Website Preview Frame */}
              <div
                className={`mx-auto ${getPreviewWidth()} transition-all duration-300`}
              >
                <div className="bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-600">
                  <div className="bg-slate-100 px-4 py-2 flex items-center justify-between border-b">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="text-xs text-slate-600 font-medium">
                      {getPageDisplayName(currentPage)} -{" "}
                      {previewMode === "mobile"
                        ? "Mobile View"
                        : previewMode === "tablet"
                        ? "Tablet View"
                        : "Desktop View"}
                    </div>
                  </div>
                  <div
                    className={`${
                      isFullscreen ? "h-screen" : "h-[600px]"
                    } overflow-hidden`}
                  >
                    {previewUrl ? (
                      <iframe
                        src={previewUrl}
                        className="w-full h-full border-0"
                        title={`Generated Website Preview - ${currentPage}`}
                        sandbox="allow-scripts allow-same-origin allow-forms"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-4"></div>
                          <p className="text-slate-600">Loading preview...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Features Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-100 mb-4">
              What's Included in Your New Website
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Your generated website includes all the modern features and
              optimizations needed for success
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Globe className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    Multi-Page Structure
                  </h3>
                </div>
                <p className="text-slate-400">
                  {Object.keys(websiteData.generatedFiles).length}{" "}
                  well-structured pages including{" "}
                  {Object.keys(websiteData.generatedFiles)
                    .map((f) => getPageDisplayName(f))
                    .join(", ")}{" "}
                  with professional navigation.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Smartphone className="h-5 w-5 text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    Responsive Design
                  </h3>
                </div>
                <p className="text-slate-400">
                  Mobile-first design that looks perfect on all devices with
                  smooth animations and modern interactions.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Search className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    SEO Optimized
                  </h3>
                </div>
                <p className="text-slate-400">
                  Built for 90+ SEO scores with semantic HTML, meta tags,
                  structured data, and fast loading times.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <Shield className="h-5 w-5 text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    Modern Branding
                  </h3>
                </div>
                <p className="text-slate-400">
                  Professional color schemes, Roboto typography, and cohesive
                  brand identity throughout all pages.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    High Converting
                  </h3>
                </div>
                <p className="text-slate-400">
                  Strategic CTAs, social proof elements, and
                  conversion-optimized layouts for maximum impact.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-cyan-500/10 rounded-lg">
                    <Zap className="h-5 w-5 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    Fast & Accessible
                  </h3>
                </div>
                <p className="text-slate-400">
                  WCAG 2.1 compliant with optimized performance, clean code, and
                  excellent user experience.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Action Section */}
        <section className="text-center">
          <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold text-slate-100 mb-4">
                Ready to Launch Your New Website?
              </h2>
              <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
                Your professional, SEO-optimized website is ready to go live.
                Download all files now and start growing your online presence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={downloadWebsite}
                  size="lg"
                  className="bg-neon-green hover:bg-lime-400 text-slate-900 font-semibold"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download All Files
                </Button>
                <Button
                  onClick={openWebsiteInNewTab}
                  variant="outline"
                  size="lg"
                  className="border-slate-600 text-slate-200 hover:bg-slate-800 bg-transparent"
                >
                  <ExternalLink className="mr-2 h-5 w-5" />
                  Open in New Tab
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
