'use client';

import { useState } from 'react';
import { AnalysisResults, ReportConfig } from '@/types/analyzer';
import { Download, Mail, Loader2 } from 'lucide-react';

interface PDFDownloadButtonProps {
  analysisResults: AnalysisResults;
  reportConfig: ReportConfig;
}

export function PDFDownloadButton({ analysisResults, reportConfig }: PDFDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePDF = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/website-analyzer/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisResults,
          reportConfig,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `website-analysis-${new Date().toISOString().split('T')[0]}.pdf`;
      
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const sendEmail = async () => {
    if (!reportConfig.emailDelivery?.enabled || !reportConfig.emailDelivery?.recipients?.length) {
      setError('Email delivery not configured');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch('/api/website-analyzer/send-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisResults,
          reportConfig,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      // Show success message (you might want to add a toast notification)
      alert('Report sent successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-4">Download Report</h3>
      
      <div className="space-y-4">
        {/* PDF Download */}
        <button
          onClick={generatePDF}
          disabled={isGenerating}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {isGenerating ? 'Generating PDF...' : 'Download PDF Report'}
        </button>

        {/* Email Delivery */}
        {reportConfig.emailDelivery?.enabled && (
          <button
            onClick={sendEmail}
            disabled={isSending || !reportConfig.emailDelivery?.recipients?.length}
            className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            {isSending ? 'Sending Email...' : 'Email Report'}
          </button>
        )}

        {/* Error Display */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </div>
        )}

        {/* Report Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Includes selected sections based on your customization</p>
          <p>• Professional branded PDF format</p>
          <p>• Comprehensive analysis and recommendations</p>
          {reportConfig.emailDelivery?.enabled && (
            <p>• Email delivery to {reportConfig.emailDelivery.recipients.length} recipient(s)</p>
          )}
        </div>
      </div>
    </div>
  );
}