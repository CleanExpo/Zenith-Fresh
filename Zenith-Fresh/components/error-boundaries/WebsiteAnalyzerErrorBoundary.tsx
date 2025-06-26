'use client';

import React, { ReactNode } from 'react';
import { BaseErrorBoundary } from './BaseErrorBoundary';
import { Search, AlertTriangle, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WebsiteAnalyzerErrorBoundaryProps {
  children: ReactNode;
  section?: 'scan' | 'results' | 'analysis' | 'reports';
  url?: string;
}

/**
 * Website Analyzer Error Boundary
 * 
 * Specialized error boundary for website analysis components
 */
export function WebsiteAnalyzerErrorBoundary({ 
  children, 
  section,
  url
}: WebsiteAnalyzerErrorBoundaryProps) {
  const sectionName = section ? `Website Analyzer ${section}` : 'Website Analyzer';

  const analyzerFallback = (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-green-600" />
          <CardTitle className="text-green-800">Analysis Interrupted</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-green-700">
            {url 
              ? `The analysis of ${url} encountered an issue.`
              : 'The website analysis encountered an unexpected error.'
            }
          </p>
          
          <div className="bg-green-100 border border-green-200 rounded p-3">
            <p className="text-green-800 text-sm font-medium mb-2">This could be due to:</p>
            <ul className="text-green-700 text-sm space-y-1">
              <li>• The target website being temporarily unavailable</li>
              <li>• Network connectivity issues</li>
              <li>• The website blocking analysis requests</li>
              <li>• Server overload during peak analysis times</li>
            </ul>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Analysis
            </Button>
            {url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newUrl = prompt('Enter a different URL to analyze:', url);
                  if (newUrl) {
                    window.location.href = `/tools/website-analyzer?url=${encodeURIComponent(newUrl)}`;
                  }
                }}
              >
                Try Different URL
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <BaseErrorBoundary
      name={sectionName}
      level="section"
      fallback={analyzerFallback}
      enableRetry={true}
      enableReporting={true}
      onError={(error, errorInfo, errorId) => {
        // Website analyzer specific error handling
        console.error(`Website Analyzer Error (${section}):`, {
          error,
          errorInfo,
          errorId,
          section,
          url,
          timestamp: new Date().toISOString()
        });

        // Track analyzer errors for improvement
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('analyzer-error', {
            detail: { 
              section, 
              errorId, 
              error: error.message,
              url,
              userAgent: navigator.userAgent
            }
          }));
        }
      }}
    >
      {children}
    </BaseErrorBoundary>
  );
}

/**
 * Scan Form Error Boundary
 * 
 * For URL input and scan initiation
 */
export function ScanFormErrorBoundary({ children }: { children: ReactNode }) {
  const scanFormFallback = (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-6">
        <div className="text-center">
          <Search className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <h3 className="text-blue-800 font-medium mb-2">Scan Form Unavailable</h3>
          <p className="text-blue-700 text-sm mb-4">
            The website scan form is temporarily unavailable.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Reload Form
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <BaseErrorBoundary
      name="Scan Form"
      level="component"
      fallback={scanFormFallback}
      enableRetry={true}
    >
      {children}
    </BaseErrorBoundary>
  );
}

/**
 * Analysis Results Error Boundary
 * 
 * For displaying analysis results and reports
 */
export function AnalysisResultsErrorBoundary({ 
  children, 
  url 
}: { 
  children: ReactNode; 
  url?: string; 
}) {
  const resultsFallback = (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-orange-800 font-medium mb-2">Results Display Error</h3>
            <p className="text-orange-700 text-sm mb-4">
              {url 
                ? `Unable to display analysis results for ${url}.`
                : 'Unable to display the analysis results.'
              }
            </p>
            
            <div className="space-y-2">
              <p className="text-orange-700 text-xs">
                Your analysis may have completed successfully, but there&apos;s an issue displaying the results.
              </p>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Results
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.history.back()}
                >
                  Go Back
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <BaseErrorBoundary
      name="Analysis Results"
      level="section"
      fallback={resultsFallback}
      enableRetry={true}
      enableReporting={true}
    >
      {children}
    </BaseErrorBoundary>
  );
}

/**
 * Report Generation Error Boundary
 * 
 * For PDF reports and data export
 */
export function ReportGenerationErrorBoundary({ children }: { children: ReactNode }) {
  const reportFallback = (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center space-x-2 mb-2">
        <FileText className="w-4 h-4 text-gray-500" />
        <span className="text-gray-700 font-medium">Report Generation Failed</span>
      </div>
      <p className="text-gray-600 text-sm mb-3">
        Unable to generate the report. This might be due to high server load or processing issues.
      </p>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // Attempt to download raw data instead
            window.open('/api/analysis/export?format=json', '_blank');
          }}
        >
          Download Raw Data
        </Button>
      </div>
    </div>
  );

  return (
    <BaseErrorBoundary
      name="Report Generation"
      level="component"
      fallback={reportFallback}
      enableRetry={true}
      enableReporting={true}
    >
      {children}
    </BaseErrorBoundary>
  );
}

/**
 * Performance Analysis Error Boundary
 * 
 * For performance metrics and analysis
 */
export function PerformanceAnalysisErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <WebsiteAnalyzerErrorBoundary section="analysis">
      {children}
    </WebsiteAnalyzerErrorBoundary>
  );
}

export default WebsiteAnalyzerErrorBoundary;