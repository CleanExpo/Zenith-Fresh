"use client";

import { useState, useEffect } from "react";
import { prisma } from "@/lib/prisma";
import { Download, ExternalLink, Code, FileText } from "lucide-react";

interface GeneratedWebsitePageProps {
  params: {
    id: string;
  };
}

export default function GeneratedWebsitePage({
  params,
}: GeneratedWebsitePageProps) {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWebsite = async () => {
      try {
        const response = await fetch(`/api/generated-website/${params.id}`);
        if (response.ok) {
          const html = await response.text();
          setHtmlContent(html);
        } else {
          setError("Website not found");
        }
      } catch (err) {
        setError("Failed to load website");
      } finally {
        setLoading(false);
      }
    };

    fetchWebsite();
  }, [params.id]);

  const downloadFile = (
    content: string,
    filename: string,
    mimeType: string
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadWebsite = () => {
    if (htmlContent) {
      downloadFile(htmlContent, "index.html", "text/html");
    }
  };

  const downloadAsZip = async () => {
    try {
      const response = await fetch(
        `/api/generated-website/${params.id}/download`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `website-${params.id}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Failed to download ZIP:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your website...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Website Not Found
          </h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Download Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-gray-800">
              Generated Website
            </h1>
            <span className="text-sm text-gray-500">ID: {params.id}</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={downloadWebsite}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download HTML</span>
            </button>
            <button
              onClick={downloadAsZip}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Download ZIP</span>
            </button>
            <button
              onClick={() =>
                window.open(`/api/generated-website/${params.id}`, "_blank")
              }
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Raw</span>
            </button>
          </div>
        </div>
      </div>

      {/* Website Content */}
      <div className="pt-20">
        <div
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          className="w-full"
        />
      </div>
    </div>
  );
}
