'use client';

import { SEOAnalysis } from '@/types/analyzer';
import { Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface SEOSectionProps {
  analysis: SEOAnalysis;
}

export function SEOSection({ analysis }: SEOSectionProps) {
  const StatusIcon = ({ status }: { status: boolean }) => (
    status ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    )
  );

  const OptimalIcon = ({ optimal }: { optimal: boolean }) => (
    optimal ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <AlertCircle className="w-4 h-4 text-yellow-600" />
    )
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center mb-6">
        <Search className="w-6 h-6 text-green-600 mr-3" />
        <h3 className="text-xl font-semibold">SEO Analysis</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Page Structure */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Page Structure</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <StatusIcon status={analysis.title.present} />
                <span className="ml-2 text-sm font-medium">Title Tag</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                {analysis.title.present && (
                  <>
                    <OptimalIcon optimal={analysis.title.optimal} />
                    <span className="ml-1">{analysis.title.length} chars</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <StatusIcon status={analysis.metaDescription.present} />
                <span className="ml-2 text-sm font-medium">Meta Description</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                {analysis.metaDescription.present && (
                  <>
                    <OptimalIcon optimal={analysis.metaDescription.optimal} />
                    <span className="ml-1">{analysis.metaDescription.length} chars</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <StatusIcon status={analysis.headings.structure} />
                <span className="ml-2 text-sm font-medium">Heading Structure</span>
              </div>
              <div className="text-sm text-gray-600">
                H1: {analysis.headings.h1Count}, H2: {analysis.headings.h2Count}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <StatusIcon status={analysis.canonicalUrl !== null} />
                <span className="ml-2 text-sm font-medium">Canonical URL</span>
              </div>
              {analysis.canonicalUrl && (
                <div className="text-xs text-gray-500 max-w-48 truncate">
                  {analysis.canonicalUrl}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Analysis */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Content Analysis</h4>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Images</span>
                <span className="text-sm text-gray-600">
                  {analysis.images.total} total
                </span>
              </div>
              <div className="text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>With Alt Text: {analysis.images.withAlt}</span>
                  <span className="text-green-600">
                    {analysis.images.total > 0 ? Math.round((analysis.images.withAlt / analysis.images.total) * 100) : 0}%
                  </span>
                </div>
                {analysis.images.missingAlt > 0 && (
                  <div className="flex justify-between mt-1">
                    <span>Missing Alt: {analysis.images.missingAlt}</span>
                    <span className="text-red-600">
                      {Math.round((analysis.images.missingAlt / analysis.images.total) * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Links</span>
                <span className="text-sm text-gray-600">
                  {analysis.internalLinks + analysis.externalLinks} total
                </span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Internal Links:</span>
                  <span>{analysis.internalLinks}</span>
                </div>
                <div className="flex justify-between">
                  <span>External Links:</span>
                  <span>{analysis.externalLinks}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Social Tags</span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Open Graph:</span>
                  <StatusIcon status={analysis.socialTags.openGraph} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Twitter Card:</span>
                  <StatusIcon status={analysis.socialTags.twitterCard} />
                </div>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Structured Data</span>
                <StatusIcon status={analysis.structured} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <div className="flex items-start">
          <Search className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-900 mb-1">SEO Recommendations</h4>
            <ul className="text-sm text-green-800 space-y-1">
              {!analysis.title.optimal && (
                <li>• Optimize title length (30-60 characters recommended)</li>
              )}
              {!analysis.metaDescription.optimal && (
                <li>• Optimize meta description length (120-160 characters recommended)</li>
              )}
              {analysis.images.missingAlt > 0 && (
                <li>• Add alt text to {analysis.images.missingAlt} images</li>
              )}
              {!analysis.socialTags.openGraph && (
                <li>• Add Open Graph tags for better social sharing</li>
              )}
              {!analysis.structured && (
                <li>• Implement structured data for rich snippets</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}